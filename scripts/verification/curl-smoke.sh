#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${1:-http://localhost:3000}
EMAIL=${CRM_VERIFICATION_EMAIL:-}
PASSWORD=${CRM_VERIFICATION_PASSWORD:-}

if [[ -z "$EMAIL" || -z "$PASSWORD" ]]; then
  echo "Set CRM_VERIFICATION_EMAIL and CRM_VERIFICATION_PASSWORD before running." >&2
  exit 1
fi

COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_step() {
  echo
  echo "[$(timestamp)] $1"
}

request() {
  local method=$1
  local path=$2
  shift 2
  curl -sS -w '\n%{http_code} %{time_total}s\n' \
    -X "$method" \
    "$@" \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    "${BASE_URL}${path}"
}

log_step "GET /api/csrf.php"
CSRF_RESPONSE="$(request GET '/api/csrf.php')"
echo "$CSRF_RESPONSE"
CSRF_TOKEN="$(python -c "import json,sys; data=json.loads(sys.stdin.read().splitlines()[0] or '{}'); print(data.get('token',''))" <<<"$CSRF_RESPONSE")"

if [[ -z "$CSRF_TOKEN" ]]; then
  echo "Failed to extract CSRF token" >&2
  exit 1
fi

log_step "POST /api/login.php"
LOGIN_BODY="$(python - <<'PY'
import json, os
email = os.environ["CRM_VERIFICATION_EMAIL"]
password = os.environ["CRM_VERIFICATION_PASSWORD"]
print(json.dumps({"email": email, "password": password}))
PY
)"
LOGIN_RESPONSE="$(request POST '/api/login.php' -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF_TOKEN" --data "$LOGIN_BODY")"
echo "$LOGIN_RESPONSE"

log_step "GET /api/associations.php?page=1&pageSize=5"
ASSOC_RESPONSE="$(request GET '/api/associations.php?page=1&pageSize=5')"
echo "$ASSOC_RESPONSE"

log_step "POST /api/logout.php"
LOGOUT_RESPONSE="$(request POST '/api/logout.php' -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF_TOKEN" --data '{}')"
echo "$LOGOUT_RESPONSE"
