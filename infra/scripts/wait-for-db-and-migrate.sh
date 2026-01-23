#!/bin/bash
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."

# Wait for database using Django's connection
python << 'EOF'
import sys
import time
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saleor.settings')
import django
django.setup()

from django.db import connection

max_attempts = 30
attempt = 0

while attempt < max_attempts:
    try:
        connection.ensure_connection()
        print('✅ PostgreSQL is ready')
        sys.exit(0)
    except Exception as e:
        attempt += 1
        if attempt < max_attempts:
            print(f'   PostgreSQL is not ready yet, waiting... (attempt {attempt}/{max_attempts})')
            time.sleep(2)
        else:
            print(f'❌ PostgreSQL failed to become ready: {e}')
            sys.exit(1)
EOF

echo "🔧 Creating migration files..."
python manage.py makemigrations --noinput || echo "⚠️  No new migrations to create"

echo "🔧 Running database migrations..."
python manage.py migrate --noinput

echo "✅ Migrations completed"
echo "🚀 Starting Saleor API server..."

exec uvicorn saleor.asgi:application --host 0.0.0.0 --port "${SALEOR_API_PORT:-8000}" --reload --lifespan off

