#!/bin/sh
set -e

echo "========== DIAGNOSTICS =========="
echo "PORT=$PORT"
echo "All PORT-related environment variables:"
env | grep -i port || true
echo "Current working directory:"
pwd
echo "================================="

echo "=== Running Database Migrations ==="
alembic upgrade head

echo "=== Starting Uvicorn Production Server ==="
echo "Running command:"
echo "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
