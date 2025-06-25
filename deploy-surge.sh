#!/bin/bash

# Deploy AIPC to Surge.sh (free static hosting)
# No authentication required for public deployments

echo "🚀 Deploying AIPC to Surge.sh..."

# Install surge if not already installed
if ! command -v surge &> /dev/null; then
    echo "📦 Installing Surge.sh CLI..."
    npm install -g surge
fi

# Build the project
echo "🔨 Building React application..."
npm run build

# Deploy to surge with a random subdomain
echo "🌐 Deploying to Surge.sh..."
cd dist
surge . --domain aipc-healthcare-$(date +%s).surge.sh

echo "✅ Deployment complete!"
echo "🔗 Your AIPC demo is now live!"
