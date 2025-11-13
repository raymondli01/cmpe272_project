#!/bin/bash

# AWARE Water Management System - Service Startup Script
# This script starts both backend and frontend services

echo "🚀 Starting AWARE Water Management System..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Start backend
echo -e "\n${BLUE}Starting Backend API...${NC}"
cd backend
source venv/bin/activate 2>/dev/null || echo "Virtual environment not found, using system Python"
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started on http://localhost:8000 (PID: $BACKEND_PID)${NC}"

# Start frontend (with env vars unset to ensure .env file is used)
echo -e "\n${BLUE}Starting Frontend...${NC}"
cd ../frontend

# Unset any system environment variables that might override .env
unset VITE_SUPABASE_PROJECT_ID
unset VITE_SUPABASE_PUBLISHABLE_KEY
unset VITE_SUPABASE_URL

npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started on http://localhost:5173 (PID: $FRONTEND_PID)${NC}"

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

# Keep script running
wait
