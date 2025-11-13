#!/bin/bash

# AWARE Water Management System - Service Stop Script

echo "🛑 Stopping AWARE Water Management System..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Kill all uvicorn and npm dev processes
pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null

# Kill processes on specific ports
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true

sleep 1

# Check if ports are now free
if lsof -i :8000 -t >/dev/null 2>&1; then
    echo -e "${RED}✗ Failed to stop backend on port 8000${NC}"
else
    echo -e "${GREEN}✓ Backend stopped${NC}"
fi

if lsof -i :5173 -t >/dev/null 2>&1; then
    echo -e "${RED}✗ Failed to stop frontend on port 5173${NC}"
else
    echo -e "${GREEN}✓ Frontend stopped${NC}"
fi

echo ""
echo "All services stopped."
