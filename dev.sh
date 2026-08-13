#!/usr/bin/env bash
# Start full local dev environment: infra + backend + frontend.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "▶ Starting infrastructure (Postgres + Redis)"
docker compose up -d
until docker compose ps | grep -q "healthy"; do sleep 2; done

echo "▶ Starting Laravel backend on http://localhost:8000"
(cd "$ROOT/backend" && nohup php artisan serve --port=8000 > /tmp/printer-backend.log 2>&1 &)

echo "▶ Starting Next.js frontend on http://localhost:3000"
(cd "$ROOT/frontend" && nohup npm run dev > /tmp/printer-frontend.log 2>&1 &)

sleep 4
echo
echo "✅ Backend:  http://localhost:8000"
echo "✅ Frontend: http://localhost:3000  (EN /en | KM /km)"
echo "   Logs: /tmp/printer-backend.log, /tmp/printer-frontend.log"
