#!/bin/bash
set -e

# Create stripe_app database if it doesn't exist
# We need to connect to postgres database (not saleor) to create new databases
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'stripe_app') THEN
            CREATE DATABASE stripe_app;
        END IF;
    END
    \$\$;
EOSQL

echo "Stripe app database 'stripe_app' created (if it didn't exist)"
