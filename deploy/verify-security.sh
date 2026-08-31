#!/usr/bin/env bash
# Post-deploy security verification for the production API + web.
# Run from anywhere AFTER the API redeploy and Vercel deploy have landed:
#   bash deploy/verify-security.sh
#
# Exits non-zero if any critical check fails. The rate-limit checks spoof
# X-Forwarded-For; that only proves per-IP keying because Caddy appends the
# real peer as the rightmost XFF entry and the app trusts exactly one hop.
set -uo pipefail

# Point these at your own deployment:
#   API_URL=https://api.yourdomain.com WEB_URL=https://your-app.vercel.app \
#     bash deploy/verify-security.sh
API="${API_URL:-https://api.yourdomain.com}"
WEB="${WEB_URL:-https://your-app.vercel.app}"
fail=0
ok()   { echo "  ✓ $1"; }
bad()  { echo "  ✗ $1"; fail=1; }

echo "API: $API"
echo "WEB: $WEB"
echo

echo "[1] API no longer advertises Express"
if curl -sS -D - -o /dev/null --max-time 15 "$API/health" | grep -qi "^x-powered-by:"; then
  bad "X-Powered-By still present"
else
  ok "X-Powered-By removed"
fi

echo "[2] API sends helmet security headers"
h=$(curl -sS -D - -o /dev/null --max-time 15 "$API/health")
for hdr in "strict-transport-security" "x-content-type-options" "referrer-policy"; do
  echo "$h" | grep -qi "^$hdr:" && ok "$hdr" || bad "$hdr missing"
done

echo "[3] Rate limiter engages, then recovers"
# NOTE: true PER-IP isolation can't be proven from one machine — a correctly
# configured proxy overwrites X-Forwarded-For with THIS host's IP, so spoofed
# values are (rightly) ignored and every request here shares one bucket. What
# we CAN check from one host: the limiter trips on a burst and recovers after
# the window. See the cross-IP note printed at the end for the real isolation test.
for i in $(seq 1 12); do
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$API/waitlist/count")
done
[ "$code" = "429" ] && ok "throttles after a burst (429)" || bad "no throttle after 12 rapid requests (got $code)"
echo "    waiting out the 60s window to confirm recovery..."
sleep 62
codeR=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$API/waitlist/count")
[ "$codeR" = "200" ] && ok "recovers after the window (200)" || bad "still blocked after window (got $codeR)"

echo "[4] CORS still locked to the web origin"
acao=$(curl -sS -D - -o /dev/null --max-time 15 -X OPTIONS "$API/waitlist" \
  -H "Origin: https://evil.example" -H "Access-Control-Request-Method: POST" \
  | grep -i "access-control-allow-origin" | tr -d '\r')
echo "$acao" | grep -qi "evil.example" && bad "evil origin reflected: $acao" || ok "evil origin rejected"

echo "[5] web robots.txt served"
rc=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$WEB/robots.txt")
[ "$rc" = "200" ] && ok "robots.txt 200" || bad "robots.txt $rc"

echo
echo "[i] PER-IP isolation — verify manually from TWO real IPs:"
echo "    1) from machine A:  for i in \$(seq 12); do curl -s -o /dev/null -w '%{http_code} ' $API/waitlist/count; done   # ends in 429"
echo "    2) immediately from machine B (phone hotspot, or a different network): one request should return 200, not 429"
echo "    If B returns 429 while A is throttled, the limiter is still keyed on the proxy, not the client."
echo
if [ "$fail" = "0" ]; then echo "ALL CHECKS PASSED"; else echo "SOME CHECKS FAILED"; fi
exit $fail
