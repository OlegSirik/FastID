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

exec nginx -g 'daemon off;'
