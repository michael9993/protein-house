#!/bin/bash
# Database Backup Script for Saleor Platform
# Usage: ./backup-db.sh [local|s3] [container-name]
#
# Examples:
#   ./backup-db.sh                    # Local backup, dev container
#   ./backup-db.sh local              # Local backup, dev container
#   ./backup-db.sh s3                 # S3 backup, dev container
#   ./backup-db.sh local saleor-postgres-prod  # Local backup, prod container
#
# Environment variables (for S3 mode):
#   BACKUP_S3_BUCKET    - S3 bucket name (required)
#   BACKUP_S3_PREFIX    - S3 key prefix (default: database-backups)
#   AWS_PROFILE         - AWS CLI profile (optional)
#
# Cron example (daily at 2 AM):
#   0 2 * * * /path/to/backup-db.sh s3 saleor-postgres-prod >> /var/log/saleor-backup.log 2>&1

set -euo pipefail

# Configuration
MODE="${1:-local}"
CONTAINER="${2:-saleor-postgres-dev}"
POSTGRES_USER="${POSTGRES_USER:-saleor}"
POSTGRES_DB="${POSTGRES_DB:-saleor}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
BACKUP_FILE="saleor-backup-${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# S3 configuration
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
S3_PREFIX="${BACKUP_S3_PREFIX:-database-backups}"

echo "========================================"
echo "Saleor Database Backup"
echo "========================================"
echo "Time:      $(date -Iseconds)"
echo "Mode:      ${MODE}"
echo "Container: ${CONTAINER}"
echo "Database:  ${POSTGRES_DB}"
echo "User:      ${POSTGRES_USER}"
echo ""

# Verify container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "ERROR: Container '${CONTAINER}' is not running."
    echo "Running PostgreSQL containers:"
    docker ps --format '{{.Names}}' | grep postgres || echo "  (none)"
    exit 1
fi

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Run pg_dump inside the container, pipe through gzip
echo "Starting backup..."
docker exec "${CONTAINER}" pg_dump \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "Backup created: ${BACKUP_DIR}/${BACKUP_FILE} (${BACKUP_SIZE})"

# Upload to S3 if mode is s3
if [ "${MODE}" = "s3" ]; then
    if [ -z "${S3_BUCKET}" ]; then
        echo "ERROR: BACKUP_S3_BUCKET environment variable not set."
        exit 1
    fi

    echo "Uploading to S3: s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}"
    aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" \
        "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}" \
        --storage-class STANDARD_IA

    echo "S3 upload complete."

    # Clean up old S3 backups (keep last RETENTION_DAYS days)
    echo "Cleaning up S3 backups older than ${RETENTION_DAYS} days..."
    CUTOFF_DATE=$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d 2>/dev/null || date -v-${RETENTION_DAYS}d +%Y-%m-%d)
    aws s3api list-objects-v2 \
        --bucket "${S3_BUCKET}" \
        --prefix "${S3_PREFIX}/" \
        --query "Contents[?LastModified<='${CUTOFF_DATE}'].Key" \
        --output text \
        | tr '\t' '\n' \
        | while read -r key; do
            if [ -n "${key}" ] && [ "${key}" != "None" ]; then
                echo "  Deleting: ${key}"
                aws s3 rm "s3://${S3_BUCKET}/${key}"
            fi
        done
fi

# Clean up old local backups
echo "Cleaning up local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "saleor-backup-*.sql.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# List recent backups
echo ""
echo "Recent backups:"
ls -lht "${BACKUP_DIR}"/saleor-backup-*.sql.gz 2>/dev/null | head -5

echo ""
echo "Backup complete at $(date -Iseconds)"
