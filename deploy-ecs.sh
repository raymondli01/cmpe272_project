#!/bin/bash
# ECS Deployment Script for AWARE Water Management System

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
CLUSTER_NAME=$(cat aws-config.json | grep -o '"clusterName": "[^"]*' | cut -d'"' -f4)
BACKEND_ECR_URI=$(cat aws-config.json | grep -o '"backendEcrUri": "[^"]*' | cut -d'"' -f4)
FRONTEND_ECR_URI=$(cat aws-config.json | grep -o '"frontendEcrUri": "[^"]*' | cut -d'"' -f4)
VPC_ID=$(cat aws-config.json | grep -o '"vpcId": "[^"]*' | cut -d'"' -f4)
SUBNET_IDS=$(cat aws-config.json | grep -o '"subnetIds": "[^"]*' | cut -d'"' -f4)
ECS_SG_ID=$(cat aws-config.json | grep -o '"ecsSecurityGroupId": "[^"]*' | cut -d'"' -f4)
ALB_ARN=$(cat aws-config.json | grep -o '"albArn": "[^"]*' | cut -d'"' -f4)

echo -e "${GREEN}Starting ECS Deployment...${NC}"

# Create CloudWatch log groups
echo -e "${YELLOW}Creating CloudWatch log groups...${NC}"
aws logs create-log-group --log-group-name /ecs/aware-water-backend --region ${AWS_REGION} 2>/dev/null || echo "Log group already exists"
aws logs create-log-group --log-group-name /ecs/aware-water-frontend --region ${AWS_REGION} 2>/dev/null || echo "Log group already exists"

# Create IAM roles if they don't exist
echo -e "${YELLOW}Setting up IAM roles...${NC}"

# Check if execution role exists
EXEC_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole"
if ! aws iam get-role --role-name ecsTaskExecutionRole &> /dev/null; then
    echo -e "${YELLOW}Creating ECS task execution role...${NC}"
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file:///tmp/trust-policy.json
    aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
    echo -e "${GREEN}Created execution role${NC}"
else
    echo -e "${GREEN}Execution role already exists${NC}"
fi

# Check if task role exists
TASK_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskRole"
if ! aws iam get-role --role-name ecsTaskRole &> /dev/null; then
    echo -e "${YELLOW}Creating ECS task role...${NC}"
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    aws iam create-role --role-name ecsTaskRole --assume-role-policy-document file:///tmp/trust-policy.json
    echo -e "${GREEN}Created task role${NC}"
else
    echo -e "${GREEN}Task role already exists${NC}"
fi

# Update task definitions with actual values
echo -e "${YELLOW}Preparing task definitions...${NC}"

# Backend task definition
sed "s|ACCOUNT_ID|${AWS_ACCOUNT_ID}|g; s|REGION|${AWS_REGION}|g; s|ECR_URI|${BACKEND_ECR_URI}|g" \
    ecs-task-definition-backend.json > /tmp/backend-task-def.json

# Frontend task definition
sed "s|ACCOUNT_ID|${AWS_ACCOUNT_ID}|g; s|REGION|${AWS_REGION}|g; s|ECR_URI|${FRONTEND_ECR_URI}|g" \
    ecs-task-definition-frontend.json > /tmp/frontend-task-def.json

# Register task definitions
echo -e "${YELLOW}Registering task definitions...${NC}"
BACKEND_TASK_DEF_ARN=$(aws ecs register-task-definition \
    --cli-input-json file:///tmp/backend-task-def.json \
    --region ${AWS_REGION} \
    --query 'taskDefinition.taskDefinitionArn' --output text)

FRONTEND_TASK_DEF_ARN=$(aws ecs register-task-definition \
    --cli-input-json file:///tmp/frontend-task-def.json \
    --region ${AWS_REGION} \
    --query 'taskDefinition.taskDefinitionArn' --output text)

echo -e "${GREEN}Task definitions registered:${NC}"
echo -e "  Backend: ${BACKEND_TASK_DEF_ARN}"
echo -e "  Frontend: ${FRONTEND_TASK_DEF_ARN}"

# Create target groups
echo -e "${YELLOW}Creating target groups...${NC}"

# Backend target group
BACKEND_TG_NAME="${CLUSTER_NAME}-backend-tg"
BACKEND_TG_ARN=$(aws elbv2 describe-target-groups --names ${BACKEND_TG_NAME} --region ${AWS_REGION} --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "")

if [ -z "$BACKEND_TG_ARN" ] || [ "$BACKEND_TG_ARN" == "None" ]; then
    BACKEND_TG_ARN=$(aws elbv2 create-target-group \
        --name ${BACKEND_TG_NAME} \
        --protocol HTTP \
        --port 8000 \
        --vpc-id ${VPC_ID} \
        --target-type ip \
        --health-check-path / \
        --health-check-interval-seconds 30 \
        --health-check-timeout-seconds 5 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 3 \
        --region ${AWS_REGION} \
        --query 'TargetGroups[0].TargetGroupArn' --output text)
    echo -e "${GREEN}Created backend target group: ${BACKEND_TG_ARN}${NC}"
else
    echo -e "${YELLOW}Backend target group already exists${NC}"
fi

# Frontend target group
FRONTEND_TG_NAME="${CLUSTER_NAME}-frontend-tg"
FRONTEND_TG_ARN=$(aws elbv2 describe-target-groups --names ${FRONTEND_TG_NAME} --region ${AWS_REGION} --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "")

if [ -z "$FRONTEND_TG_ARN" ] || [ "$FRONTEND_TG_ARN" == "None" ]; then
    FRONTEND_TG_ARN=$(aws elbv2 create-target-group \
        --name ${FRONTEND_TG_NAME} \
        --protocol HTTP \
        --port 80 \
        --vpc-id ${VPC_ID} \
        --target-type ip \
        --health-check-path / \
        --health-check-interval-seconds 30 \
        --health-check-timeout-seconds 5 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 3 \
        --region ${AWS_REGION} \
        --query 'TargetGroups[0].TargetGroupArn' --output text)
    echo -e "${GREEN}Created frontend target group: ${FRONTEND_TG_ARN}${NC}"
else
    echo -e "${YELLOW}Frontend target group already exists${NC}"
fi

# Configure ALB listeners FIRST (before creating services)
echo -e "${YELLOW}Configuring ALB listeners...${NC}"

# Get default listener or create one
LISTENER_ARN=$(aws elbv2 describe-listeners --load-balancer-arn ${ALB_ARN} --region ${AWS_REGION} --query 'Listeners[?Port==`80`].ListenerArn' --output text 2>/dev/null || echo "")

if [ -z "$LISTENER_ARN" ] || [ "$LISTENER_ARN" == "None" ]; then
    # Create listener with frontend as default
    LISTENER_ARN=$(aws elbv2 create-listener \
        --load-balancer-arn ${ALB_ARN} \
        --protocol HTTP \
        --port 80 \
        --default-actions Type=forward,TargetGroupArn=${FRONTEND_TG_ARN} \
        --region ${AWS_REGION} \
        --query 'Listeners[0].ListenerArn' --output text)
    echo -e "${GREEN}Created ALB listener${NC}"
    
    # Add rule for backend API
    aws elbv2 create-rule \
        --listener-arn ${LISTENER_ARN} \
        --priority 100 \
        --conditions Field=path-pattern,Values='/api/*' \
        --actions Type=forward,TargetGroupArn=${BACKEND_TG_ARN} \
        --region ${AWS_REGION} > /dev/null 2>&1 || echo "Rule may already exist"
    
    # Add rule for backend root paths
    aws elbv2 create-rule \
        --listener-arn ${LISTENER_ARN} \
        --priority 200 \
        --conditions Field=path-pattern,Values='/sensors','/leaks','/ai/*','/network/*' \
        --actions Type=forward,TargetGroupArn=${BACKEND_TG_ARN} \
        --region ${AWS_REGION} > /dev/null 2>&1 || echo "Rule may already exist"
    
    echo -e "${GREEN}Configured ALB routing rules${NC}"
else
    echo -e "${YELLOW}ALB listener already exists${NC}"
fi

# Convert subnet IDs to array and format for AWS CLI
IFS=',' read -ra SUBNET_ARRAY <<< "$SUBNET_IDS"
SUBNET_STRING=$(IFS=','; echo "${SUBNET_ARRAY[*]}")

# Create or update backend service
echo -e "${YELLOW}Creating/updating backend service...${NC}"
if aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${CLUSTER_NAME}-backend --region ${AWS_REGION} --query 'services[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
    aws ecs update-service \
        --cluster ${CLUSTER_NAME} \
        --service ${CLUSTER_NAME}-backend \
        --task-definition ${BACKEND_TASK_DEF_ARN} \
        --region ${AWS_REGION} > /dev/null
    echo -e "${GREEN}Updated backend service${NC}"
else
    aws ecs create-service \
        --cluster ${CLUSTER_NAME} \
        --service-name ${CLUSTER_NAME}-backend \
        --task-definition ${BACKEND_TASK_DEF_ARN} \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_STRING}],securityGroups=[${ECS_SG_ID}],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=${BACKEND_TG_ARN},containerName=backend,containerPort=8000" \
        --region ${AWS_REGION} > /dev/null
    echo -e "${GREEN}Created backend service${NC}"
fi

# Create or update frontend service
echo -e "${YELLOW}Creating/updating frontend service...${NC}"
if aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${CLUSTER_NAME}-frontend --region ${AWS_REGION} --query 'services[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
    aws ecs update-service \
        --cluster ${CLUSTER_NAME} \
        --service ${CLUSTER_NAME}-frontend \
        --task-definition ${FRONTEND_TASK_DEF_ARN} \
        --region ${AWS_REGION} > /dev/null
    echo -e "${GREEN}Updated frontend service${NC}"
else
    aws ecs create-service \
        --cluster ${CLUSTER_NAME} \
        --service-name ${CLUSTER_NAME}-frontend \
        --task-definition ${FRONTEND_TASK_DEF_ARN} \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_STRING}],securityGroups=[${ECS_SG_ID}],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=${FRONTEND_TG_ARN},containerName=frontend,containerPort=80" \
        --region ${AWS_REGION} > /dev/null
    echo -e "${GREEN}Created frontend service${NC}"
fi

# ALB listener already configured above

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns ${ALB_ARN} --region ${AWS_REGION} --query 'LoadBalancers[0].DNSName' --output text)

echo -e "${GREEN}ECS Deployment Complete!${NC}"
echo -e "${GREEN}Application URLs:${NC}"
echo -e "  Frontend: http://${ALB_DNS}"
echo -e "  Backend API: http://${ALB_DNS}/api"
echo -e "${YELLOW}Note: It may take a few minutes for services to become healthy.${NC}"

