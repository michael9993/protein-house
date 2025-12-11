#!/bin/sh
# Shell script to create a tunnel for the Stripe app
# This allows external access to your local Stripe app for webhook testing

PORT=${1:-3002}
TOOL=${2:-cloudflared}

echo "Creating tunnel for Stripe app on port $PORT using $TOOL..."

if [ "$TOOL" = "cloudflared" ]; then
    # Check if cloudflared is installed
    if ! command -v cloudflared &> /dev/null; then
        echo "cloudflared not found. Please install from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
        exit 1
    fi
    
    echo "Starting cloudflared tunnel..."
    echo "Your Stripe app will be accessible at the URL shown below"
    echo "Press Ctrl+C to stop the tunnel"
    echo ""
    
    cloudflared tunnel --url http://localhost:$PORT
elif [ "$TOOL" = "ngrok" ]; then
    # Check if ngrok is installed
    if ! command -v ngrok &> /dev/null; then
        echo "ngrok not found. Please install from https://ngrok.com/download"
        exit 1
    fi
    
    echo "Starting ngrok tunnel..."
    echo "Your Stripe app will be accessible at the URL shown below"
    echo "Press Ctrl+C to stop the tunnel"
    echo ""
    
    ngrok http $PORT
else
    echo "Unknown tool: $TOOL. Use 'cloudflared' or 'ngrok'"
    exit 1
fi
