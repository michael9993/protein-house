#!/bin/bash
# Database Restore Script for Saleor Platform
# Usage: ./restore-db.sh <backup-file> [container-name]
#
# Examples:
#   ./restore-db.sh ../backups/saleor-backup-20260208_020000.sql.gz
#   ./restore-db.sh ../backups/saleor-backup-20260208_020000.sql.gz saleor-postgres-prod
#   ./restore-db.sh s3://my-bucket/database-backups/saleor-backup-20260208_020000.sql.gz
#
# WARNING: This will DROP and recreate all tables in the target database.
# Make sure you have a recent backup before running this.

set -euo pipefail

# Configuration
BACKUP_SOURCE="${1:-}"
CONTAINER="${2:-saleor-postgres-dev}"
POSTGRES_USER="${POSTGRES_USER:-saleor}"
POSTGRES_DB="${POSTGRES_DB:-saleor}"

if [ -z "${BACKUP_SOURCE}" ]; then
    echo "Usage: $0 <backup-file|s3-uri> [container-name]"
    echo ""
    echo "Available local backups:"
    BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
    ls -lht "${BACKUP_DIR}"/saleor-backup-*.sql.gz 2>/dev/null || echo "  (none found)"
    exit 1
fi

echo "========================================"
echo "Saleor Database Restore"
echo "========================================"
echo "Time:      $(date -Iseconds)"
echo "Source:    ${BACKUP_SOURCE}"
echo "Container: ${CONTAINER}"
echo "Database:  ${POSTGRES_DB}"
echo "User:      ${POSTGRES_USER}"
echo ""

# Verify container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "ERROR: Container '${CONTAINER}' is not running."
    exit 1
fi

# Safety confirmation
echo "WARNING: This will DROP and recreate all tables in '${POSTGRES_DB}'."
echo "All existing data will be replaced with the backup."
read -p "Are you sure? Type 'yes' to continue: " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Download from S3 if needed
RESTORE_FILE="${BACKUP_SOURCE}"
TEMP_FILE=""
if [[ "${BACKUP_SOURCE}" == s3://* ]]; then
    echo "Downloading from S3..."
    TEMP_FILE=$(mktemp /tmp/saleor-restore-XXXXXXXX.sql.gz)
    aws s3 cp "${BACKUP_SOURCE}" "${TEMP_FILE}"
    RESTORE_FILE="${TEMP_FILE}"
fi

# Verify file exists
if [ ! -f "${RESTORE_FILE}" ]; then
    echo "ERROR: Backup file not found: ${RESTORE_FILE}"
    exit 1
fi

echo "Restoring database..."

# Terminate existing connections to the database
docker exec "${CONTAINER}" psql -U "${POSTGRES_USER}" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();" \
    2>/dev/null || true

# Restore: decompress and pipe into psql
gunzip -c "${RESTORE_FILE}" | docker exec -i "${CONTAINER}" psql \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --single-transaction \
    --set ON_ERROR_STOP=on \
    2>&1 | tail -5

# Clean up temp file
if [ -n "${TEMP_FILE}" ] && [ -f "${TEMP_FILE}" ]; then
    rm -f "${TEMP_FILE}"
fi

echo ""
echo "Restore complete at $(date -Iseconds)"
echo ""
echo "IMPORTANT: You should now restart the Saleor API and workers:"
echo "  docker compose -f infra/docker-compose.prod.yml restart saleor-api saleor-worker saleor-scheduler"
