#!/bin/bash

# AWARE Water Management System - Service Startup Script
# This script starts both backend and frontend services

set -e  # Exit on error

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 Starting AWARE Water Management System..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    lsof -i :$1 -t >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    echo -e "${YELLOW}Port $1 is in use. Killing existing process...${NC}"
    lsof -ti :$1 | xargs kill -9 2>/dev/null || true
    sleep 1
}

# Check and kill existing processes on ports
if check_port 8000; then
    kill_port 8000
fi

if check_port 5173; then
    kill_port 5173
fi

# Start backend
echo -e "\n${BLUE}Starting Backend API...${NC}"
cd "$SCRIPT_DIR/backend"

if [ -d "venv" ]; then
    source venv/bin/activate
    echo "Using virtual environment"
else
    echo "Using system Python"
fi

uvicorn main:app --reload --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started on http://localhost:8000 (PID: $BACKEND_PID)${NC}"

# Start frontend (with env vars unset to ensure .env file is used)
echo -e "\n${BLUE}Starting Frontend...${NC}"
cd "$SCRIPT_DIR/frontend"

# Unset any system environment variables that might override .env
unset VITE_SUPABASE_PROJECT_ID
unset VITE_SUPABASE_PUBLISHABLE_KEY
unset VITE_SUPABASE_URL

npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started on http://localhost:5173 (PID: $FRONTEND_PID)${NC}"

# Wait a moment for services to start
sleep 2

# Check if services are actually running
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}✗ Backend failed to start${NC}"
    exit 1
fi

if ! ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${RED}✗ Frontend failed to start${NC}"
    exit 1
fi

# Summary
echo -e "\n${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ All services started successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo "📊 Backend API:  http://localhost:8000"
echo "🌐 Frontend UI:  http://localhost:5173"
echo ""
echo "🔐 Login with:   admin@aware.com / password"
echo ""
echo "To stop services, press Ctrl+C or run:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Trap to cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

# Keep script running
wait
