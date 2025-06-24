#!/bin/bash

# AIPC Healthcare Platform - Complete Deployment Script
# This script deploys the full integrated healthcare platform

echo "🏥 AIPC Healthcare Platform - Deployment Starting..."
echo "=================================================="

# Set environment variables for production
export NODE_ENV=production
export VITE_API_BASE_URL=https://aipcn.onrender.com
export VITE_APP_NAME="AIPC Healthcare Platform"
export VITE_DEMO_MODE=true

echo "✅ Environment variables set"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Build the application
echo "🔨 Building React application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Test the build
echo "🧪 Testing build..."
if [ ! -d "dist" ]; then
    echo "❌ Build directory not found"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Index.html not found in build"
    exit 1
fi

echo "✅ Build verification passed"

# Start the server
echo "🚀 Starting production server..."
echo "Backend API: https://aipcn.onrender.com"
echo "Frontend will be available at the deployed URL"
echo "Demo credentials:"
echo "  Patient: patient1@example.com / Patient123!"
echo "  Doctor: dr.smith@aipc.com / Doctor123!"
echo "  Admin: admin@aipc.com / Admin123!"

# Start the server
npm start
