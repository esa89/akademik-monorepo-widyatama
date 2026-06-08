#!/bin/sh
set -e

HASH_FILE="/app/node_modules/.deps-hash"

# Hash semua package.json (bind-mounted bisa berubah kapan saja)
CURRENT_HASH=$(find /app -name "package.json" -not -path "*/node_modules/*" | sort | xargs cat 2>/dev/null | md5sum | cut -d' ' -f1)

if [ ! -f "$HASH_FILE" ] || [ "$(cat "$HASH_FILE" 2>/dev/null)" != "$CURRENT_HASH" ]; then
    echo "[startup] Dependencies changed, installing..."
    pnpm install --no-frozen-lockfile
    echo "$CURRENT_HASH" > "$HASH_FILE"
else
    echo "[startup] Dependencies up to date, skipping install."
fi

# Handle Prisma jika schema ada (api-akademik, api-obe)
PRISMA_SCHEMA="/app/apps/${APP_NAME}/prisma/schema.prisma"
if [ -f "$PRISMA_SCHEMA" ]; then
    PRISMA_HASH_FILE="/app/node_modules/.prisma-hash"
    PRISMA_HASH=$(md5sum "$PRISMA_SCHEMA" | cut -d' ' -f1)

    if [ ! -f "$PRISMA_HASH_FILE" ] || [ "$(cat "$PRISMA_HASH_FILE" 2>/dev/null)" != "$PRISMA_HASH" ]; then
        echo "[startup] Prisma schema changed, regenerating..."
        cd "/app/apps/${APP_NAME}"
        npx prisma generate
        npx prisma db push --accept-data-loss
        cd /app
        echo "$PRISMA_HASH" > "$PRISMA_HASH_FILE"
    else
        echo "[startup] Prisma schema up to date, skipping."
    fi
fi

echo "[startup] Starting ${APP_NAME}..."
exec pnpm dev --filter="${APP_NAME}"
