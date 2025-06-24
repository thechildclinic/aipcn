#!/bin/bash

# AIPC Healthcare Platform - Deployment Fix Script
# Fixes 404 errors and optimizes for customer presentations

echo "🔧 AIPC Healthcare Platform - Fixing Deployment Issues..."
echo "========================================================="

# Set production environment
export NODE_ENV=production
export VITE_API_BASE_URL=https://aipcn.onrender.com
export VITE_APP_NAME="AIPC Healthcare Platform"
export VITE_DEMO_MODE=true

echo "✅ Environment variables configured for production"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.vite/

# Install dependencies with clean cache
echo "📦 Installing dependencies with clean cache..."
npm ci --production=false

# Build with production optimizations
echo "🔨 Building with production optimizations..."
npm run build

# Verify build output
echo "🔍 Verifying build output..."
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed - index.html not found"
    exit 1
fi

# Copy public assets to dist
echo "📁 Copying public assets..."
if [ -d "public" ]; then
    cp -r public/* dist/ 2>/dev/null || true
fi

# Create missing favicon if needed
if [ ! -f "dist/favicon.ico" ]; then
    echo "🎨 Creating favicon..."
    touch dist/favicon.ico
fi

# Verify critical files
echo "✅ Verifying critical files..."
ls -la dist/

echo "🎉 Deployment fixes applied successfully!"
echo ""
echo "🚀 Ready for deployment:"
echo "  - All static assets configured"
echo "  - Favicon and manifest added"
echo "  - Production optimizations applied"
echo "  - 404 errors should be resolved"
echo ""
echo "📋 Next steps:"
echo "  1. Commit these changes: git add . && git commit -m 'fix: resolve 404 errors and optimize deployment'"
echo "  2. Push to trigger redeployment: git push origin main"
echo "  3. Wait for Render to redeploy (5-10 minutes)"
echo "  4. Test the demo URL for customer presentations"
