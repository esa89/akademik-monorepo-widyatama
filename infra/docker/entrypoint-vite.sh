#!/bin/sh
set -e

HASH_FILE="/app/node_modules/.deps-hash"

# Hash semua package.json (bind-mounted bisa berubah kapan saja)
CURRENT_HASH=$(find /app -name "package.json" -not -path "*/node_modules/*" | sort | xargs cat 2>/dev/null | md5sum | cut -d' ' -f1)

if [ ! -f "$HASH_FILE" ] || [ "$(cat "$HASH_FILE" 2>/dev/null)" != "$CURRENT_HASH" ]; then
    echo "[startup] Dependencies changed, installing..."
    pnpm install --no-frozen-lockfile
    echo "$CURRENT_HASH" > "$HASH_FILE"
    # Force rebuild shared packages after install
    rm -f /app/node_modules/.packages-hash
else
    echo "[startup] Dependencies up to date, skipping install."
fi

# Hash source shared packages (packages/ di-bind-mount, bisa berubah)
PACKAGES_HASH_FILE="/app/node_modules/.packages-hash"
PACKAGES_HASH=$(find /app/packages -type f \( -name "*.ts" -o -name "*.tsx" -o -name "package.json" \) 2>/dev/null | sort | xargs md5sum 2>/dev/null | md5sum | cut -d' ' -f1)

if [ ! -f "$PACKAGES_HASH_FILE" ] || [ "$(cat "$PACKAGES_HASH_FILE" 2>/dev/null)" != "$PACKAGES_HASH" ]; then
    echo "[startup] Shared packages changed, rebuilding..."
    pnpm build --filter=@widyatama/ui --filter=@widyatama/sso-types --filter=@widyatama/sso-react 2>/dev/null || true
    echo "$PACKAGES_HASH" > "$PACKAGES_HASH_FILE"
else
    echo "[startup] Shared packages up to date, skipping build."
fi

echo "[startup] Starting ${APP_NAME}..."
exec pnpm dev --filter="${APP_NAME}" -- --host 0.0.0.0
