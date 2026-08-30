#!/bin/bash
set -e

mkdir -p /app/staticfiles /app/media

echo "⏳ Running database migrations..."
python manage.py migrate --noinput

echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

echo "🚀 Starting Gunicorn..."
exec "$@"
