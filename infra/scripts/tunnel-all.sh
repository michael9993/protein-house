#!/bin/sh
# Shell script to create tunnels for all Saleor services
# Tunnels: Saleor API (8000), Dashboard (9000), and Stripe App (3002)

TOOL=${1:-cloudflared}

echo "========================================"
echo "Saleor Services Tunnel Setup"
echo "========================================"
echo ""

echo "Services to tunnel:"
echo "  Port 8000 : Saleor API (GraphQL)"
echo "  Port 9000 : Dashboard"
echo "  Port 3002 : Stripe App"
echo ""

if [ "$TOOL" = "cloudflared" ]; then
    echo "Using cloudflared (recommended)"
    echo ""
    
    if ! command -v cloudflared &> /dev/null; then
        echo "cloudflared not found. Please install from:"
        echo "https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
        exit 1
    fi
    
    echo "Starting cloudflared tunnels for all services..."
    echo "Each service will get its own tunnel URL"
    echo ""
    echo "Creating tunnels for:"
    echo "  - Port 8000 (Saleor API)"
    echo "  - Port 9000 (Dashboard)"
    echo "  - Port 3002 (Stripe App)"
    echo ""
    echo "Press Ctrl+C to stop all tunnels"
    echo ""
    
    cloudflared tunnel --url http://localhost:8000 --url http://localhost:9000 --url http://localhost:3002
elif [ "$TOOL" = "ngrok" ]; then
    echo "Using ngrok"
    echo "Note: ngrok requires separate processes for each port"
    echo ""
    
    if ! command -v ngrok &> /dev/null; then
        echo "ngrok not found. Please install from https://ngrok.com/download"
        exit 1
    fi
    
    echo "For multiple ports with ngrok, you need separate terminals."
    echo "Starting tunnel for Saleor API (port 8000)..."
    echo ""
    echo "For other ports, open new terminals and run:"
    echo "  ngrok http 9000  # Dashboard"
    echo "  ngrok http 3002  # Stripe App"
    echo ""
    
    ngrok http 8000
else
    echo "Unknown tool: $TOOL. Use 'cloudflared' or 'ngrok'"
    exit 1
fi
