#!/bin/bash

# AI-Powered Care Backend - Quick Start Script
# This script handles all setup and starts the development server

echo "🚀 Starting AI-Powered Care Backend..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i:$1 >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js and npm are installed${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the AIPC/backend directory${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙️ Creating environment configuration...${NC}"
    cp .env.example .env 2>/dev/null || echo "# Development Environment
NODE_ENV=development
PORT=5000
GEMINI_API_KEY=demo-key
DATABASE_URL=sqlite:./dev.db
JWT_SECRET=dev-secret-key" > .env
    echo -e "${GREEN}✅ Environment configuration created${NC}"
fi

# Kill any existing process on port 5000
if port_in_use 5000; then
    echo -e "${YELLOW}🔄 Stopping existing server on port 5000...${NC}"
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Try to build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build 2>/dev/null

# Start the server
echo -e "${YELLOW}🚀 Starting development server...${NC}"

# Try different startup methods
if [ -f "dist/server.dev.js" ]; then
    echo -e "${GREEN}Starting with built files...${NC}"
    node dist/server.dev.js &
elif [ -f "src/server.dev.ts" ]; then
    echo -e "${GREEN}Starting with TypeScript...${NC}"
    npx ts-node src/server.dev.ts &
elif [ -f "src/server.ts" ]; then
    echo -e "${GREEN}Starting with main server file...${NC}"
    npx ts-node src/server.ts &
else
    echo -e "${GREEN}Starting with npm script...${NC}"
    npm run dev &
fi

SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Check if server is running
if port_in_use 5000; then
    echo -e "${GREEN}✅ Server started successfully!${NC}"
    echo ""
    echo -e "${GREEN}🌐 Access URLs:${NC}"
    echo "   Main Application:    http://localhost:5000"
    echo "   Health Check:        http://localhost:5000/health"
    echo "   API Documentation:   http://localhost:5000/api"
    echo ""
    echo -e "${GREEN}🔑 Demo Credentials:${NC}"
    echo "   Patient:    patient1@example.com / Patient123!"
    echo "   Doctor:     dr.smith@aipc.com / Doctor123!"
    echo "   Admin:      admin@aipc.com / Admin123!"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    
    # Test the health endpoint
    echo -e "${YELLOW}🔍 Testing server health...${NC}"
    sleep 2
    curl -s http://localhost:5000/health > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Server is responding to requests${NC}"
        echo ""
        echo -e "${GREEN}🎉 AI-Powered Care Backend is ready!${NC}"
        echo "You can now access the application at http://localhost:5000"
    else
        echo -e "${YELLOW}⚠️ Server started but may still be initializing...${NC}"
        echo "Please wait a moment and try accessing http://localhost:5000/health"
    fi
    
    # Keep the script running
    wait $SERVER_PID
else
    echo -e "${RED}❌ Failed to start server${NC}"
    echo "Please check the logs above for errors"
    exit 1
fi
