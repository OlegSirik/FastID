#!/bin/sh
# Запуск единого образа FastID (nginx + BFF) из Docker Hub.

set -e

CONTAINER_NAME=fastid
APP_IMAGE="${APP_IMAGE:-olegsirik/fastid:latest}"
FRONT_PORT="${FASTID_FRONT_PORT:-8082}"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/../.env}"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --add-host=host.docker.internal:host-gateway \
  -p "${FRONT_PORT}:80" \
  -e "POLITECH_API_URL=${POLITECH_API_URL:-http://host.docker.internal:8080}" \
  -e "TENANT_CODE=${TENANT_CODE:-demo}" \
  -e "SERVICE_USER_LOGIN=${SERVICE_USER_LOGIN:-demo}" \
  -e "SERVICE_PASSWORD=${SERVICE_PASSWORD:-demo}" \
  -e "SERVICE_CLIENT_ID=${SERVICE_CLIENT_ID:-sys}" \
  -e "RATE_LIMIT_PREMIUM=${RATE_LIMIT_PREMIUM:-10}" \
  -e "RATE_LIMIT_DECRYPT=${RATE_LIMIT_DECRYPT:-20}" \
  -e "RATE_LIMIT_SECURE_LINK=${RATE_LIMIT_SECURE_LINK:-10}" \
  -e "FASTID_SECURE_LINK_SECRET=${FASTID_SECURE_LINK_SECRET:-change-me-in-production}" \
  "$APP_IMAGE"

echo "Done. Open http://<server>:${FRONT_PORT}/demo/start"
docker ps --filter "name=$CONTAINER_NAME"
