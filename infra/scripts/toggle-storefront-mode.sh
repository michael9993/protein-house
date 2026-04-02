#!/bin/bash
# ============================================================================
# TOGGLE STOREFRONT BUILD MODE
# ============================================================================
# This script toggles between dev and production build modes for the storefront
# Usage:
#   ./scripts/toggle-storefront-mode.sh production  # Switch to production
#   ./scripts/toggle-storefront-mode.sh dev         # Switch to dev
#   ./scripts/toggle-storefront-mode.sh             # Toggle current mode
# ============================================================================

MODE="${1:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
ENV_TEMPLATE="$SCRIPT_DIR/../env-template.txt"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found at $ENV_FILE"
    echo "   Please copy env-template.txt to .env first"
    exit 1
fi

# Get current mode
CURRENT_MODE="dev"
if grep -q "STOREFRONT_MODE=" "$ENV_FILE"; then
    CURRENT_MODE=$(grep "STOREFRONT_MODE=" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')
fi

# Determine new mode
if [ -z "$MODE" ]; then
    # Toggle mode
    if [ "$CURRENT_MODE" = "production" ]; then
        NEW_MODE="dev"
    else
        NEW_MODE="production"
    fi
else
    if [ "$MODE" != "dev" ] && [ "$MODE" != "production" ]; then
        echo "❌ Error: Mode must be 'dev' or 'production'"
        exit 1
    fi
    NEW_MODE="$MODE"
fi

# Update .env file
if grep -q "STOREFRONT_MODE=" "$ENV_FILE"; then
    # Update existing line
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/STOREFRONT_MODE=.*/STOREFRONT_MODE=$NEW_MODE/" "$ENV_FILE"
    else
        # Linux
        sed -i "s/STOREFRONT_MODE=.*/STOREFRONT_MODE=$NEW_MODE/" "$ENV_FILE"
    fi
else
    # Add new line after SALEOR_APP_TOKEN
    if grep -q "SALEOR_APP_TOKEN=" "$ENV_FILE"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "/SALEOR_APP_TOKEN=/a\\
STOREFRONT_MODE=$NEW_MODE
" "$ENV_FILE"
        else
            # Linux
            sed -i "/SALEOR_APP_TOKEN=/a STOREFRONT_MODE=$NEW_MODE" "$ENV_FILE"
        fi
    else
        echo "STOREFRONT_MODE=$NEW_MODE" >> "$ENV_FILE"
    fi
fi

echo "✅ Storefront mode changed: $CURRENT_MODE → $NEW_MODE"
echo ""
echo "📝 Next steps:"
echo "   1. Restart the storefront container:"
echo "      docker compose -f docker-compose.dev.yml restart aura-storefront"
echo ""
echo "   2. Or rebuild and restart:"
echo "      docker compose -f docker-compose.dev.yml up -d --build aura-storefront"
echo ""

