#!/bin/sh
set -e

: "${TENANT_CODE:=demo}"

mkdir -p /usr/share/nginx/html/assets
if [ -f /usr/share/nginx/html/assets/env.template.js ]; then
  sed \
    -e "s#\${TENANT_CODE:-demo}#${TENANT_CODE}#g" \
    /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js
else
  cat > /usr/share/nginx/html/assets/env.js <<EOF
window.__env = window.__env || {};
window.__env.TENANT_CODE = '${TENANT_CODE}';
EOF
fi

java -jar /app/app.jar &
JAVA_PID=$!

cleanup() {
  kill "$JAVA_PID" 2>/dev/null || true
}
trap cleanup EXIT TERM INT

echo "Waiting for BFF on :8080..."
for i in $(seq 1 60); do
  if curl -sf http://127.0.0.1:8080/actuator/health >/dev/null 2>&1; then
    echo "BFF is ready"
    break
  fi
  if ! kill -0 "$JAVA_PID" 2>/dev/null; then
    echo "BFF process exited unexpectedly" >&2
    wait "$JAVA_PID" || true
    exit 1
  fi
  if [ "$i" -eq 60 ]; then
    echo "BFF did not become healthy in time" >&2
    exit 1
  fi
  sleep 2
done

exec nginx -g 'daemon off;'
