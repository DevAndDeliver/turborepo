#!/usr/bin/env bash
# Verifies the single-instance guarantees of oracle-capacity-retry.sh
# by stubbing the `oci` CLI. No network, no real Oracle account.
set -uo pipefail

SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/oracle-capacity-retry.sh"
TEST_ROOT="/tmp/oci-guard-test"
STUB_BIN="$TEST_ROOT/bin"
PASS=0
FAIL=0

mkdir -p "$STUB_BIN"

# --- stub oci -------------------------------------------------------------
cat >"$STUB_BIN/oci" <<'STUB'
#!/usr/bin/env bash
S="$OCI_STUB_STATE"
sub="$1 $2 $3"

case "$sub" in
  "compute instance list")
    case "$(cat "$S/list_mode" 2>/dev/null || echo normal)" in
      fail) echo "ServiceError: connection timed out" >&2; exit 1 ;;
    esac
    if [ -f "$S/instance_exists" ]; then
      echo '{"data":[{"lifecycle-state":"RUNNING","display-name":"turborepo-api"}]}'
    else
      # The real OCI CLI prints NOTHING (exit 0) for an empty list.
      exit 0
    fi
    ;;
  "compute instance launch")
    n=$(cat "$S/launch_attempts" 2>/dev/null || echo 0)
    n=$((n + 1)); echo "$n" > "$S/launch_attempts"

    mode=$(cat "$S/mode" 2>/dev/null || echo capacity)
    case "$mode" in
      capacity)
        echo "ServiceError: Out of capacity for shape VM.Standard.A1.Flex" >&2
        exit 1 ;;
      succeed_after_2)
        if [ "$n" -ge 3 ]; then
          echo "$n" > "$S/successful_launches"
          touch "$S/instance_exists"
          echo '{"data":{"public-ip":"140.238.1.2","lifecycle-state":"RUNNING"}}'
          exit 0
        fi
        echo "ServiceError: Out of capacity for shape VM.Standard.A1.Flex" >&2
        exit 1 ;;
      ghost_success)
        # Launch actually worked on Oracle's side but the CLI reports failure.
        touch "$S/instance_exists"
        echo "ServiceError: timeout waiting for state" >&2
        exit 1 ;;
      bad_config)
        echo "ServiceError: NotAuthenticated - invalid credentials" >&2
        exit 1 ;;
      timeout_then_capacity)
        # First attempt dies on a network timeout, the rest are honest
        # capacity misses. The loop must survive the blip, not abort.
        if [ "$n" -eq 1 ]; then
          echo 'RequestException: The connection to endpoint timed out.' >&2
        else
          echo "ServiceError: Out of capacity for shape VM.Standard.A1.Flex" >&2
        fi
        exit 1 ;;
      always_timeout)
        echo 'RequestException: The connection to endpoint timed out.' >&2
        exit 1 ;;
    esac
    ;;
esac
STUB
chmod +x "$STUB_BIN/oci"

check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    printf '  \033[32mPASS\033[0m  %s\n' "$name"
    PASS=$((PASS + 1))
  else
    printf '  \033[31mFAIL\033[0m  %s (expected %s, got %s)\n' "$name" "$expected" "$actual"
    FAIL=$((FAIL + 1))
  fi
}

setup() {
  local mode="$1"
  rm -rf "$TEST_ROOT/state" "$TEST_ROOT/cfg"
  mkdir -p "$TEST_ROOT/state"
  echo "$mode" > "$TEST_ROOT/state/mode"
  cat > "$TEST_ROOT/cfg" <<CFG
COMPARTMENT_OCID=ocid1.tenancy.oc1..test
SUBNET_OCID=ocid1.subnet.oc1..test
IMAGE_OCID=ocid1.image.oc1..test
AVAILABILITY_DOMAINS="AD-1 AD-2 AD-3"
INTERVAL=1
CFG
}

run() {
  timeout "${1:-10}" env \
    PATH="$STUB_BIN:$PATH" \
    OCI_STUB_STATE="$TEST_ROOT/state" \
    CONFIG_FILE="$TEST_ROOT/cfg" \
    STATE_DIR="$TEST_ROOT/state/run" \
    SSH_KEY_FILE="$HOME/.ssh/oracle_turborepo.pub" \
    TRANSIENT_BACKOFF=1 TRANSIENT_BACKOFF_LONG=1 NOTIFY=0 \
    bash "$SCRIPT" "${2:-}" >"$TEST_ROOT/out.log" 2>&1
  echo $?
}

attempts() { cat "$TEST_ROOT/state/launch_attempts" 2>/dev/null || echo 0; }
successes() { [ -f "$TEST_ROOT/state/successful_launches" ] && echo 1 || echo 0; }

echo
echo "Single-instance guarantees — SIMULATED (stubbed oci CLI, no Oracle account touched)"
echo

# --- Guard 3: instance already exists -> never launch ----------------------
setup capacity
touch "$TEST_ROOT/state/instance_exists"
rc=$(run 10)
check "simulated existing instance: exits 0"            "0" "$rc"
check "simulated existing instance: zero launch calls"  "0" "$(attempts)"

# --- Guard 5: exits after success, exactly one instance --------------------
setup succeed_after_2
rc=$(run 30)
check "success: exits 0"                      "0" "$rc"
check "simulated success: exactly ONE launch call" "1" "$(successes)"
check "success: stopped retrying after win"   "3" "$(attempts)"

# --- Guard 4: launch succeeded but CLI reported failure --------------------
setup ghost_success
rc=$(run 20)
check "ghost success: exits 0"                        "0" "$rc"
check "ghost success: only ONE launch attempted"      "1" "$(attempts)"

# --- Guard 2: success marker blocks a rerun --------------------------------
setup capacity
mkdir -p "$TEST_ROOT/state/run"
touch "$TEST_ROOT/state/run/launched"
rc=$(run 10)
check "success marker: refuses to run"        "1" "$rc"
check "success marker: zero launch calls"     "0" "$(attempts)"

# --- Guard 1: lock blocks a concurrent run ---------------------------------
setup capacity
mkdir -p "$TEST_ROOT/state/run/lock"
rc=$(run 10)
check "lock held: refuses to run"             "1" "$rc"
check "lock held: zero launch calls"          "0" "$(attempts)"

# --- Non-capacity errors abort instead of hammering ------------------------
setup bad_config
rc=$(run 15)
check "auth error: aborts (does not loop)"    "1" "$rc"
check "auth error: only ONE attempt"          "1" "$(attempts)"

# --- Census failure must never read as "no instance, safe to launch" -------
# Regression: the census used to swallow errors and return an empty string,
# which bash evaluated as false — i.e. permission to launch.
setup succeed_after_2
echo fail > "$TEST_ROOT/state/list_mode"
rc=$(run 15)
check "census failure: aborts"                "1" "$rc"
check "census failure: launches NOTHING"      "0" "$(attempts)"

# --- Transient network errors must not end a multi-hour run ----------------
# Regression: a single "connection timed out" aborted a 6-hour run at 163
# capacity misses, because anything not-capacity was classified as fatal.
setup timeout_then_capacity
rc=$(run 12)
check "network blip: keeps going (timeout kills test, not script)" "124" "$rc"
attempts_after_blip=$(attempts)
check "network blip: retried past the timeout" "yes" \
  "$([ "$attempts_after_blip" -gt 1 ] && echo yes || echo no)"

# --- ...but a genuinely broken connection still gives up -------------------
setup always_timeout
rc=$(env MAX_TRANSIENT=3 timeout 60 env \
  PATH="$STUB_BIN:$PATH" OCI_STUB_STATE="$TEST_ROOT/state" \
  CONFIG_FILE="$TEST_ROOT/cfg" STATE_DIR="$TEST_ROOT/state/run" \
  SSH_KEY_FILE="$HOME/.ssh/oracle_turborepo.pub" MAX_TRANSIENT=3 TRANSIENT_BACKOFF=1 TRANSIENT_BACKOFF_LONG=1 NOTIFY=0 \
  bash "$SCRIPT" >"$TEST_ROOT/out.log" 2>&1; echo $?)
check "broken connection: gives up after MAX_TRANSIENT" "1" "$rc"
check "broken connection: created nothing"              "0" "$(successes)"

echo
printf 'passed %d, failed %d\n\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
