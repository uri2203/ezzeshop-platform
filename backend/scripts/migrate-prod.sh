#!/bin/bash
set -euo pipefail

# Run production migration
# Usage: DATABASE_URL=postgres://... ./scripts/migrate-prod.sh

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

echo "Running production migration..."
psql "$DATABASE_URL" -f "$(dirname "$0")/../migrations/init.sql"
echo "Migration complete."
