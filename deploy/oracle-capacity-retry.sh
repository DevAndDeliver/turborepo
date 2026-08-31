#!/usr/bin/env bash
#
# Poll Oracle Cloud for VM.Standard.A1.Flex capacity and claim a slot the moment
# one frees. Always Free A1 capacity is a lottery — this plays it for you.
#
# It is built to create EXACTLY ONE instance. See "Single-instance guarantees"
# below; that constraint drives most of the code here.
#
#   ./oracle-capacity-retry.sh --discover    # print the OCIDs you need
#   ./oracle-capacity-retry.sh --dry-run     # resolve config, never launch
#   ./oracle-capacity-retry.sh               # run the retry loop
#
# Config comes from deploy/oracle-retry.env (gitignored — it holds your OCIDs).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${CONFIG_FILE:-$SCRIPT_DIR/oracle-retry.env}"
STATE_DIR="${STATE_DIR:-$HOME/.oracle-retry}"
LOCK_DIR="$STATE_DIR/lock"
SUCCESS_MARKER="$STATE_DIR/launched"
LOG_FILE="$STATE_DIR/retry.log"

# ---------------------------------------------------------------------------
# Config (override in oracle-retry.env)
# ---------------------------------------------------------------------------
DISPLAY_NAME="${DISPLAY_NAME:-turborepo-api}"
SHAPE="${SHAPE:-VM.Standard.A1.Flex}"
OCPUS="${OCPUS:-1}"
MEMORY_GB="${MEMORY_GB:-6}"
SSH_KEY_FILE="${SSH_KEY_FILE:-$HOME/.ssh/oracle_turborepo.pub}"
# Poll interval in seconds. Below ~60 you start earning 429 TooManyRequests,
# which slows you down rather than speeding you up.
INTERVAL="${INTERVAL:-90}"
# Consecutive network failures tolerated before giving up. A 6-hour run will hit
# a few; twenty in a row means the connection is broken, not flaky.
MAX_TRANSIENT="${MAX_TRANSIENT:-20}"
# Backoff after a transient failure; the longer one kicks in after 5 in a row.
TRANSIENT_BACKOFF="${TRANSIENT_BACKOFF:-30}"
TRANSIENT_BACKOFF_LONG="${TRANSIENT_BACKOFF_LONG:-120}"

[ -f "$CONFIG_FILE" ] && . "$CONFIG_FILE"

mkdir -p "$STATE_DIR"

log() {
  printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG_FILE"
}

# NOTIFY=0 silences desktop alerts and speech. The test suite sets it: without
# it, running the tests fires nine real notifications and talks out loud, which
# is both alarming and indistinguishable from the real thing having happened.
notify() {
  [ "${NOTIFY:-1}" = "0" ] && return 0
  local title="$1" message="$2" spoken="${3:-}"
  osascript -e "display notification \"$message\" with title \"$title\" sound name \"Glass\"" 2>/dev/null || true
  [ -n "$spoken" ] && { say "$spoken" 2>/dev/null || true; }
  printf '\a'
}

die() {
  log "ABORT: $*"
  notify "Oracle retry stopped" "$*" "Oracle retry stopped"
  exit 1
}

# ---------------------------------------------------------------------------
# Single-instance guarantees
#
#   1. Lock directory      — mkdir is atomic, so only one copy can ever run.
#   2. Success marker      — a completed run refuses to start again.
#   3. Pre-flight census   — abort if a non-terminated instance already exists.
#   4. Post-failure census — a launch can succeed on Oracle's side and still
#                            return non-zero (timeout, dropped connection).
#                            Re-counting after every failure is what stops the
#                            loop from creating a second instance in that case.
#   5. Hard exit on success — never loops after a successful launch.
# ---------------------------------------------------------------------------

acquire_lock() {
  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    die "Another run holds the lock ($LOCK_DIR). Remove it if no script is running."
  fi
  trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT INT TERM
}

# Counts instances with our display name that are not terminated/terminating.
# Anything > 0 means we already have one and must not create another.
count_live_instances() {
  local out status
  set +e
  out="$(
    oci compute instance list \
      --compartment-id "$COMPARTMENT_OCID" \
      --display-name "$DISPLAY_NAME" \
      --all 2>&1
  )"
  status=$?
  set -e

  # Never conflate "the call failed" with "there are no instances" — that
  # mistake reads as permission to launch.
  if [ $status -ne 0 ]; then
    printf 'ERR'
    return
  fi

  # The OCI CLI prints NOTHING (exit 0) for an empty list rather than an empty
  # JSON document, so an empty body here genuinely means zero instances. That
  # is only safe to assume because the exit status was checked first.
  if [ -z "$(printf '%s' "$out" | tr -d '[:space:]')" ]; then
    printf '0'
    return
  fi

  local n
  n="$(printf '%s' "$out" |
    jq '[.data[]? | select(."lifecycle-state" != "TERMINATED" and ."lifecycle-state" != "TERMINATING")] | length' 2>/dev/null)"

  # Anything non-numeric (malformed JSON, jq missing) is unknown, not zero.
  case "$n" in
  '' | *[!0-9]*) printf 'ERR' ;;
  *) printf '%s' "$n" ;;
  esac
}

assert_no_instance() {
  local count
  count="$(count_live_instances)"
  case "$count" in
  '' | *[!0-9]*)
    die "Could not determine whether an instance already exists. Refusing to launch blind."
    ;;
  esac
  if [ "$count" -gt 0 ]; then
    log "An instance named '$DISPLAY_NAME' already exists ($count live). Nothing to do."
    notify "Oracle instance exists" "$DISPLAY_NAME is already provisioned" "Instance already exists"
    touch "$SUCCESS_MARKER"
    exit 0
  fi
}

# ---------------------------------------------------------------------------
# Discovery
# ---------------------------------------------------------------------------

resolve_tenancy() {
  awk -F'=' '/^tenancy/ {gsub(/ /,"",$2); print $2; exit}' "$HOME/.oci/config"
}

discover() {
  command -v oci >/dev/null || die "oci CLI not installed."
  [ -f "$HOME/.oci/config" ] || die "No ~/.oci/config — run 'oci setup config' first."

  local tenancy
  tenancy="$(resolve_tenancy)"
  echo "# Paste into $CONFIG_FILE"
  echo "COMPARTMENT_OCID=$tenancy"
  echo

  echo "# Availability domains:"
  oci iam availability-domain list --compartment-id "$tenancy" | jq -r '.data[].name' | sed 's/^/#   /'
  echo

  echo "# Subnets (pick the PUBLIC one):"
  oci network subnet list --compartment-id "$tenancy" --all 2>/dev/null |
    jq -r '.data[]? | "#   \(."display-name")  public=\(if ."prohibit-public-ip-on-vnic" then "NO" else "YES" end)  \(.id)"'
  echo

  echo "# Ubuntu 24.04 aarch64 image for $SHAPE:"
  oci compute image list \
    --compartment-id "$tenancy" \
    --operating-system "Canonical Ubuntu" \
    --operating-system-version "24.04" \
    --shape "$SHAPE" \
    --sort-by TIMECREATED --limit 1 2>/dev/null |
    jq -r '.data[]? | "IMAGE_OCID=\(.id)   # \(."display-name")"'
}

# ---------------------------------------------------------------------------
# Launch
# ---------------------------------------------------------------------------

# Errors fall into three buckets:
#
#   capacity  — expected, the whole reason this script exists. Retry forever.
#   transient — network timeouts, 5xx, laptop sleep/wake. Retry with backoff;
#               a multi-hour run will hit these, and aborting on the first one
#               wastes the entire wait.
#   permanent — bad OCID, bad auth, exceeded service limits. Retrying will never
#               help, so stop rather than hammer the API for days.
is_capacity_error() {
  grep -qiE 'out of (host )?capacity|outofcapacity|insufficient.*capacity' <<<"$1"
}

is_rate_limit() {
  grep -qiE 'toomanyrequests|429' <<<"$1"
}

is_transient_error() {
  grep -qiE 'connection.*(timed out|refused|reset|error)|timed out|timeout|requestexception|max retries exceeded|temporarily unavailable|name or service not known|could not resolve|ssl.*error|\b(500|502|503|504)\b' <<<"$1"
}

attempt_launch() {
  local ad="$1" output status
  set +e
  output="$(
    oci compute instance launch \
      --compartment-id "$COMPARTMENT_OCID" \
      --availability-domain "$ad" \
      --shape "$SHAPE" \
      --shape-config "{\"ocpus\":$OCPUS,\"memoryInGBs\":$MEMORY_GB}" \
      --image-id "$IMAGE_OCID" \
      --subnet-id "$SUBNET_OCID" \
      --assign-public-ip true \
      --display-name "$DISPLAY_NAME" \
      --metadata "{\"ssh_authorized_keys\":\"$(cat "$SSH_KEY_FILE")\"}" \
      --wait-for-state RUNNING \
      2>&1
  )"
  status=$?
  set -e
  printf '%s' "$output"
  return $status
}

main_loop() {
  local ad output cycle=0 transient_streak=0

  while true; do
    cycle=$((cycle + 1))

    # Guard 3: never launch if one already exists.
    assert_no_instance

    for ad in $AVAILABILITY_DOMAINS; do
      log "cycle $cycle — trying $ad"

      if output="$(attempt_launch "$ad")"; then
        # A launch response describes the instance, which has no public IP on
        # it — the address belongs to the attached VNIC and needs a second call.
        local ip="" instance_id
        instance_id="$(jq -r '.data.id // empty' <<<"$output" 2>/dev/null || true)"
        if [ -n "$instance_id" ]; then
          ip="$(oci compute instance list-vnics --instance-id "$instance_id" 2>/dev/null |
            jq -r '.data[0]."public-ip" // empty' 2>/dev/null || true)"
        fi
        touch "$SUCCESS_MARKER"
        log "SUCCESS in $ad. Public IP: ${ip:-check console}"
        notify "Oracle instance is up" "${DISPLAY_NAME} running in $ad — ${ip:-see console}" \
          "Oracle instance secured"
        echo
        echo "  Instance launched. Connect with:"
        echo "    ssh -i ${SSH_KEY_FILE%.pub} ubuntu@${ip:-<PUBLIC_IP>}"
        echo
        exit 0 # Guard 5: never loop after success.
      fi

      # Guard 4: the launch may have succeeded despite a non-zero exit — a
      # timeout looks identical from here whether the request landed or not.
      # Re-count before doing anything else.
      case "$(count_live_instances)" in
      0) ;; # nothing was created; safe to classify and retry below
      ERR)
        die "Launch failed AND the census could not confirm whether an instance
was created. Stopping rather than risk a duplicate — check the console, and
delete any instance you find before rerunning."
        ;;
      *)
        log "Launch reported failure but an instance now exists — stopping."
        notify "Oracle instance is up" "$DISPLAY_NAME exists — verify in console" "Instance created"
        touch "$SUCCESS_MARKER"
        exit 0
        ;;
      esac

      # Everything below is reached only after the census confirmed nothing was
      # created, which is what makes retrying a timed-out launch safe.
      if is_capacity_error "$output"; then
        log "  no capacity in $ad"
        transient_streak=0
      elif is_rate_limit "$output"; then
        log "  rate limited — backing off 60s"
        transient_streak=0
        sleep 60
      elif is_transient_error "$output"; then
        transient_streak=$((transient_streak + 1))
        if [ "$transient_streak" -ge "$MAX_TRANSIENT" ]; then
          die "$MAX_TRANSIENT consecutive network failures — the connection looks
genuinely broken rather than flaky. Last error:
$output"
        fi
        local backoff="$TRANSIENT_BACKOFF"
        [ "$transient_streak" -ge 5 ] && backoff="$TRANSIENT_BACKOFF_LONG"
        log "  transient network error ($transient_streak/$MAX_TRANSIENT) — retrying in ${backoff}s"
        sleep "$backoff"
      else
        die "Unexpected error (not capacity, not transient). Fix this before rerunning:
$output"
      fi
    done

    log "all ADs dry — sleeping ${INTERVAL}s"
    sleep "$INTERVAL"
  done
}

# ---------------------------------------------------------------------------

case "${1:-}" in
--discover)
  discover
  exit 0
  ;;
esac

command -v oci >/dev/null || die "oci CLI not installed."
command -v jq >/dev/null || die "jq not installed."
[ -f "$CONFIG_FILE" ] || die "Missing $CONFIG_FILE — run '$0 --discover' first."
[ -f "$SSH_KEY_FILE" ] || die "Missing SSH public key at $SSH_KEY_FILE"

for required in COMPARTMENT_OCID SUBNET_OCID IMAGE_OCID AVAILABILITY_DOMAINS; do
  eval "value=\${$required:-}"
  [ -n "$value" ] || die "$required is not set in $CONFIG_FILE"
done

# Guard 2: a previous run already claimed an instance.
if [ -f "$SUCCESS_MARKER" ]; then
  die "A previous run already launched an instance (marker: $SUCCESS_MARKER).
Delete it only if you are certain no instance exists."
fi

acquire_lock # Guard 1

if [ "${1:-}" = "--dry-run" ]; then
  log "DRY RUN — config resolves, no launch attempted"
  printf '  compartment: %s\n  subnet:      %s\n  image:       %s\n  shape:       %s (%s OCPU / %s GB)\n  ADs:         %s\n  interval:    %ss\n' \
    "$COMPARTMENT_OCID" "$SUBNET_OCID" "$IMAGE_OCID" "$SHAPE" "$OCPUS" "$MEMORY_GB" "$AVAILABILITY_DOMAINS" "$INTERVAL"
  assert_no_instance
  log "No existing instance. Ready to run."
  exit 0
fi

log "Polling for $SHAPE capacity every ${INTERVAL}s. Ctrl-C to stop."
main_loop
