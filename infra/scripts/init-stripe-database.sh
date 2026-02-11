#!/bin/bash
set -e

# Create stripe_app database if it doesn't exist
psql -v ON_ERROR_STOP=0 --username "$POSTGRES_USER" --dbname "postgres" -c "CREATE DATABASE stripe_app;" 2>/dev/null || true

echo "Stripe app database 'stripe_app' created (if it didn't exist)"
