#!/bin/bash
# Deployment Script for AWARE Water Management System

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find Docker binary
find_docker() {
    # Try common locations
    if command -v docker &> /dev/null; then
        echo "docker"
        return 0
    fi
    
    # Check common macOS Docker Desktop locations
    if [ -f /usr/local/bin/docker ]; then
        echo "/usr/local/bin/docker"
        return 0
    fi
    
    if [ -f /Applications/Docker.app/Contents/Resources/bin/docker ]; then
        echo "/Applications/Docker.app/Contents/Resources/bin/docker"
        return 0
    fi
    
    # Try to find it
    DOCKER_PATH=$(find /usr/local -name docker 2>/dev/null | head -1)
    if [ -n "$DOCKER_PATH" ]; then
        echo "$DOCKER_PATH"
        return 0
    fi
    
    return 1
}

# Set up Docker
DOCKER_CMD=$(find_docker)
if [ $? -ne 0 ]; then
    echo -e "${RED}Docker not found. Please ensure Docker Desktop is running.${NC}"
    echo -e "${YELLOW}Try: open -a Docker${NC}"
    exit 1
fi

# Export PATH to include docker location and credential helper
export PATH="/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"

# Find and add docker-credential-desktop to PATH if it exists
CREDENTIAL_HELPER=$(find /Applications/Docker.app -name "docker-credential-desktop" 2>/dev/null | head -1)
if [ -n "$CREDENTIAL_HELPER" ]; then
    export PATH="$(dirname $CREDENTIAL_HELPER):$PATH"
fi

# Verify Docker is working
if ! $DOCKER_CMD ps &> /dev/null; then
    echo -e "${RED}Docker is not responding. Please ensure Docker Desktop is fully started.${NC}"
    echo -e "${YELLOW}Wait a few seconds and try again, or check Docker Desktop status.${NC}"
    exit 1
fi

echo -e "${GREEN}Docker found: $DOCKER_CMD${NC}"

# Load AWS configuration if exists
if [ -f "aws-config.json" ]; then
    AWS_REGION=$(cat aws-config.json | grep -o '"region": "[^"]*' | cut -d'"' -f4)
    BACKEND_ECR_URI=$(cat aws-config.json | grep -o '"backendEcrUri": "[^"]*' | cut -d'"' -f4)
    FRONTEND_ECR_URI=$(cat aws-config.json | grep -o '"frontendEcrUri": "[^"]*' | cut -d'"' -f4)
    CLUSTER_NAME=$(cat aws-config.json | grep -o '"clusterName": "[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}aws-config.json not found. Please run ./aws-setup.sh first.${NC}"
    exit 1
fi

echo -e "${GREEN}Starting deployment...${NC}"
echo -e "Region: ${AWS_REGION}"
echo -e "Backend ECR: ${BACKEND_ECR_URI}"
echo -e "Frontend ECR: ${FRONTEND_ECR_URI}"

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
# Use --password-stdin to avoid credential helper issues
ECR_PASSWORD=$(aws ecr get-login-password --region ${AWS_REGION})
echo "$ECR_PASSWORD" | $DOCKER_CMD login --username AWS --password-stdin ${BACKEND_ECR_URI%%/*} 2>&1 | grep -v "Error saving credentials" || true

# Build and push backend image
echo -e "${YELLOW}Building backend Docker image...${NC}"
cd backend
$DOCKER_CMD build -t ${BACKEND_ECR_URI}:latest .
TIMESTAMP_TAG=$(date +%Y%m%d-%H%M%S)
$DOCKER_CMD tag ${BACKEND_ECR_URI}:latest ${BACKEND_ECR_URI}:${TIMESTAMP_TAG}
echo -e "${YELLOW}Pushing backend image to ECR...${NC}"
$DOCKER_CMD push ${BACKEND_ECR_URI}:latest
$DOCKER_CMD push ${BACKEND_ECR_URI}:${TIMESTAMP_TAG} || echo -e "${YELLOW}Warning: Could not push timestamp tag, but latest tag was pushed${NC}"
cd ..

# Build and push frontend image
echo -e "${YELLOW}Building frontend Docker image...${NC}"
cd frontend

# Load environment variables from .env file
if [ -f "../.env" ]; then
    echo -e "${GREEN}Found .env file, loading environment variables${NC}"
    source ../.env
else
    echo -e "${YELLOW}Warning: .env file not found. Frontend may not work correctly.${NC}"
fi

# Get ALB DNS for API URL
if [ -f "../aws-config.json" ]; then
    ALB_DNS=$(cat ../aws-config.json | grep -o '"albDns": "[^"]*' | cut -d'"' -f4)
    if [ -n "$ALB_DNS" ] && [ "$ALB_DNS" != "null" ]; then
        VITE_API_URL="http://${ALB_DNS}"
        echo -e "${GREEN}Using ALB DNS for API URL: ${VITE_API_URL}${NC}"
    fi
fi

# Build with build arguments
$DOCKER_CMD build \
    --build-arg VITE_SUPABASE_URL="${VITE_SUPABASE_URL}" \
    --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY}" \
    --build-arg VITE_API_URL="${VITE_API_URL:-http://localhost:8000}" \
    -t ${FRONTEND_ECR_URI}:latest .
TIMESTAMP_TAG=$(date +%Y%m%d-%H%M%S)
$DOCKER_CMD tag ${FRONTEND_ECR_URI}:latest ${FRONTEND_ECR_URI}:${TIMESTAMP_TAG}
echo -e "${YELLOW}Pushing frontend image to ECR...${NC}"
$DOCKER_CMD push ${FRONTEND_ECR_URI}:latest
$DOCKER_CMD push ${FRONTEND_ECR_URI}:${TIMESTAMP_TAG} || echo -e "${YELLOW}Warning: Could not push timestamp tag, but latest tag was pushed${NC}"
cd ..

echo -e "${GREEN}Docker images built and pushed successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Create ECS task definitions (see ecs-task-definition-*.json)"
echo -e "  2. Create/update ECS services"
echo -e "  3. Configure ALB target groups and listeners"

