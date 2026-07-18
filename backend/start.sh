#!/bin/bash

# Exit immediately if any command fails
set -e

echo "=== Running Database Migrations ==="
alembic upgrade head

echo "=== Starting Uvicorn Production Server ==="
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
