#!/usr/bin/env python3
"""Wait for database and run migrations, then start the API server."""
import os
import sys
import time
import subprocess

# Change to app directory and add to Python path
os.chdir('/app')
sys.path.insert(0, '/app')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saleor.settings')
import django
django.setup()

from django.db import connection

print("⏳ Waiting for PostgreSQL to be ready...")

# Wait for database
max_attempts = 30
attempt = 0

while attempt < max_attempts:
    try:
        connection.ensure_connection()
        print('✅ PostgreSQL is ready')
        break
    except Exception as e:
        attempt += 1
        if attempt < max_attempts:
            print(f'   PostgreSQL is not ready yet, waiting... (attempt {attempt}/{max_attempts})')
            time.sleep(2)
        else:
            print(f'❌ PostgreSQL failed to become ready: {e}')
            sys.exit(1)

print("🔧 Running database migrations...")
result = subprocess.run(
    [sys.executable, 'manage.py', 'migrate', '--noinput'],
    capture_output=True,
    text=True
)
if result.returncode != 0:
    print(f"⚠️  Standard migrate failed, trying --fake-initial...")
    result = subprocess.run(
        [sys.executable, 'manage.py', 'migrate', '--noinput', '--fake-initial'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"❌ Migration failed: {result.stderr}")
        sys.exit(1)

print("✅ Migrations completed")
print("🚀 Starting Saleor API server...")

# Start uvicorn
port = os.environ.get('SALEOR_API_PORT', '8000')
os.execvp('uvicorn', [
    'uvicorn',
    'saleor.asgi:application',
    '--host', '0.0.0.0',
    '--port', str(port),
    '--reload',
    '--lifespan', 'off'
])
