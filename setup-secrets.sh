#!/bin/bash
# Setup AWS Secrets Manager for AWARE Water Management System

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load AWS configuration
if [ ! -f "aws-config.json" ]; then
    echo -e "${RED}aws-config.json not found. Please run ./aws-setup.sh first.${NC}"
    exit 1
fi

AWS_REGION=$(cat aws-config.json | grep -o '"region": "[^"]*' | cut -d'"' -f4)
AWS_ACCOUNT_ID=$(cat aws-config.json | grep -o '"accountId": "[^"]*' | cut -d'"' -f4)

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}.env file not found. Please create it with your environment variables.${NC}"
    exit 1
fi

echo -e "${GREEN}Setting up AWS Secrets Manager...${NC}"

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if aws secretsmanager describe-secret --secret-id ${secret_name} --region ${AWS_REGION} &> /dev/null; then
        echo -e "${YELLOW}Updating secret: ${secret_name}${NC}"
        aws secretsmanager update-secret \
            --secret-id ${secret_name} \
            --secret-string "${secret_value}" \
            --region ${AWS_REGION} > /dev/null
    else
        echo -e "${YELLOW}Creating secret: ${secret_name}${NC}"
        aws secretsmanager create-secret \
            --name ${secret_name} \
            --secret-string "${secret_value}" \
            --region ${AWS_REGION} > /dev/null
    fi
    echo -e "${GREEN}Secret ${secret_name} is ready${NC}"
}

# Read .env file and extract values
source .env

# Create secrets
if [ -n "$SUPABASE_URL" ]; then
    create_or_update_secret "aware-water/supabase-url" "${SUPABASE_URL}"
else
    echo -e "${RED}SUPABASE_URL not found in .env${NC}"
fi

if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    create_or_update_secret "aware-water/supabase-service-key" "${SUPABASE_SERVICE_ROLE_KEY}"
else
    echo -e "${RED}SUPABASE_SERVICE_ROLE_KEY not found in .env${NC}"
fi

if [ -n "$OPENAI_API_KEY" ]; then
    create_or_update_secret "aware-water/openai-key" "${OPENAI_API_KEY}"
else
    echo -e "${RED}OPENAI_API_KEY not found in .env${NC}"
fi

# Get ALB DNS for allowed origins
if [ -f "aws-config.json" ]; then
    ALB_DNS=$(cat aws-config.json | grep -o '"albDns": "[^"]*' | cut -d'"' -f4)
    if [ -n "$ALB_DNS" ] && [ "$ALB_DNS" != "null" ]; then
        ALLOWED_ORIGINS="http://${ALB_DNS},http://localhost:5173,http://localhost:3000"
    else
        ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"
    fi
else
    ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"
fi

create_or_update_secret "aware-water/allowed-origins" "${ALLOWED_ORIGINS}"

# Frontend environment variables
if [ -n "$VITE_SUPABASE_URL" ]; then
    create_or_update_secret "aware-water/frontend/supabase-url" "${VITE_SUPABASE_URL}"
fi

if [ -n "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
    create_or_update_secret "aware-water/frontend/supabase-key" "${VITE_SUPABASE_PUBLISHABLE_KEY}"
fi

echo -e "${GREEN}Secrets setup complete!${NC}"

