#!/usr/bin/env bash
# Exécute les migrations et les tests pgTAP sur un PostgreSQL 16 temporaire (sans Docker).
# En CI on utilise `supabase test db`. Prérequis : postgresql-16, postgresql-16-pgtap, pg_prove.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)}"
PORT="${PGPORT:-54999}"
WORK="$(mktemp -d)"
chmod 755 "$WORK"
chown postgres "$WORK" 2>/dev/null || true

as_pg() { if [ "$(id -u)" = 0 ]; then runuser -u postgres -- "$@"; else "$@"; fi; }

cleanup() { as_pg "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

as_pg "$PGBIN/initdb" -D "$WORK/data" -A trust -U postgres >/dev/null
as_pg "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/pg.log" -w start >/dev/null

export PGHOST="$WORK" PGPORT="$PORT" PGUSER=postgres PGDATABASE=postgres
psql -v ON_ERROR_STOP=1 -q -f "$ROOT/scripts/db/supabase-stub.sql"
psql -v ON_ERROR_STOP=1 -q -c "create extension if not exists pgtap with schema extensions;"
psql -v ON_ERROR_STOP=1 -q -c "alter database postgres set search_path to public, extensions;"

for f in $(ls "$ROOT"/supabase/migrations/*.sql | sort); do
  echo "→ migration $(basename "$f")"
  psql -v ON_ERROR_STOP=1 -q -f "$f"
done

echo "→ tests pgTAP"
pg_prove --ext .sql -r "$ROOT/supabase/tests"
