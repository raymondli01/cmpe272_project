#!/bin/bash
# AWS Infrastructure Setup Script for AWARE Water Management System

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="aware-water"
BACKEND_REPO="${PROJECT_NAME}-backend"
FRONTEND_REPO="${PROJECT_NAME}-frontend"
CLUSTER_NAME="${PROJECT_NAME}-cluster"

echo -e "${GREEN}Starting AWS Infrastructure Setup...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}AWS credentials verified.${NC}"

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"

# Create ECR repositories
echo -e "${YELLOW}Creating ECR repositories...${NC}"

# Backend repository
if aws ecr describe-repositories --repository-names ${BACKEND_REPO} --region ${AWS_REGION} &> /dev/null; then
    echo -e "${YELLOW}Repository ${BACKEND_REPO} already exists.${NC}"
else
    aws ecr create-repository --repository-name ${BACKEND_REPO} --region ${AWS_REGION}
    echo -e "${GREEN}Created repository: ${BACKEND_REPO}${NC}"
fi

# Frontend repository
if aws ecr describe-repositories --repository-names ${FRONTEND_REPO} --region ${AWS_REGION} &> /dev/null; then
    echo -e "${YELLOW}Repository ${FRONTEND_REPO} already exists.${NC}"
else
    aws ecr create-repository --repository-name ${FRONTEND_REPO} --region ${AWS_REGION}
    echo -e "${GREEN}Created repository: ${FRONTEND_REPO}${NC}"
fi

# Get ECR repository URIs
BACKEND_ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_REPO}"
FRONTEND_ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_REPO}"

echo -e "${GREEN}ECR Repository URIs:${NC}"
echo -e "  Backend: ${BACKEND_ECR_URI}"
echo -e "  Frontend: ${FRONTEND_ECR_URI}"

# Create ECS cluster
echo -e "${YELLOW}Creating ECS cluster...${NC}"
if aws ecs describe-clusters --clusters ${CLUSTER_NAME} --region ${AWS_REGION} --query 'clusters[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
    echo -e "${YELLOW}Cluster ${CLUSTER_NAME} already exists.${NC}"
else
    aws ecs create-cluster --cluster-name ${CLUSTER_NAME} --region ${AWS_REGION}
    echo -e "${GREEN}Created ECS cluster: ${CLUSTER_NAME}${NC}"
fi

# Create VPC and networking (using default VPC for simplicity, or create new one)
echo -e "${YELLOW}Setting up networking...${NC}"

# Get default VPC
DEFAULT_VPC=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text --region ${AWS_REGION} 2>/dev/null || echo "")

if [ -z "$DEFAULT_VPC" ] || [ "$DEFAULT_VPC" == "None" ]; then
    echo -e "${YELLOW}No default VPC found. Creating new VPC...${NC}"
    # Create VPC with subnets
    VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --region ${AWS_REGION} --query 'Vpc.VpcId' --output text)
    aws ec2 modify-vpc-attribute --vpc-id ${VPC_ID} --enable-dns-hostnames --region ${AWS_REGION}
    aws ec2 modify-vpc-attribute --vpc-id ${VPC_ID} --enable-dns-support --region ${AWS_REGION}
    
    # Create Internet Gateway
    IGW_ID=$(aws ec2 create-internet-gateway --region ${AWS_REGION} --query 'InternetGateway.InternetGatewayId' --output text)
    aws ec2 attach-internet-gateway --internet-gateway-id ${IGW_ID} --vpc-id ${VPC_ID} --region ${AWS_REGION}
    
    # Get availability zones
    AZ1=$(aws ec2 describe-availability-zones --region ${AWS_REGION} --query 'AvailabilityZones[0].ZoneName' --output text)
    AZ2=$(aws ec2 describe-availability-zones --region ${AWS_REGION} --query 'AvailabilityZones[1].ZoneName' --output text)
    
    # Create public subnets
    SUBNET1=$(aws ec2 create-subnet --vpc-id ${VPC_ID} --cidr-block 10.0.1.0/24 --availability-zone ${AZ1} --region ${AWS_REGION} --query 'Subnet.SubnetId' --output text)
    SUBNET2=$(aws ec2 create-subnet --vpc-id ${VPC_ID} --cidr-block 10.0.2.0/24 --availability-zone ${AZ2} --region ${AWS_REGION} --query 'Subnet.SubnetId' --output text)
    
    # Create route table
    RT_ID=$(aws ec2 create-route-table --vpc-id ${VPC_ID} --region ${AWS_REGION} --query 'RouteTable.RouteTableId' --output text)
    aws ec2 create-route --route-table-id ${RT_ID} --destination-cidr-block 0.0.0.0/0 --gateway-id ${IGW_ID} --region ${AWS_REGION}
    aws ec2 associate-route-table --subnet-id ${SUBNET1} --route-table-id ${RT_ID} --region ${AWS_REGION}
    aws ec2 associate-route-table --subnet-id ${SUBNET2} --route-table-id ${RT_ID} --region ${AWS_REGION}
    
    echo -e "${GREEN}Created VPC: ${VPC_ID}${NC}"
    VPC_ID_TO_USE=${VPC_ID}
    SUBNET_IDS="${SUBNET1},${SUBNET2}"
else
    echo -e "${GREEN}Using default VPC: ${DEFAULT_VPC}${NC}"
    VPC_ID_TO_USE=${DEFAULT_VPC}
    # Get subnets from default VPC
    SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${DEFAULT_VPC}" --region ${AWS_REGION} --query 'Subnets[*].SubnetId' --output text | tr '\t' ',')
fi

# Create security groups
echo -e "${YELLOW}Creating security groups...${NC}"

# ALB Security Group
ALB_SG_NAME="${PROJECT_NAME}-alb-sg"
ALB_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${ALB_SG_NAME}" "Name=vpc-id,Values=${VPC_ID_TO_USE}" --region ${AWS_REGION} --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")

if [ -z "$ALB_SG_ID" ] || [ "$ALB_SG_ID" == "None" ]; then
    ALB_SG_ID=$(aws ec2 create-security-group --group-name ${ALB_SG_NAME} --description "Security group for ALB" --vpc-id ${VPC_ID_TO_USE} --region ${AWS_REGION} --query 'GroupId' --output text)
    aws ec2 authorize-security-group-ingress --group-id ${ALB_SG_ID} --protocol tcp --port 80 --cidr 0.0.0.0/0 --region ${AWS_REGION}
    aws ec2 authorize-security-group-ingress --group-id ${ALB_SG_ID} --protocol tcp --port 443 --cidr 0.0.0.0/0 --region ${AWS_REGION}
    echo -e "${GREEN}Created ALB security group: ${ALB_SG_ID}${NC}"
else
    echo -e "${YELLOW}ALB security group already exists: ${ALB_SG_ID}${NC}"
fi

# ECS Security Group
ECS_SG_NAME="${PROJECT_NAME}-ecs-sg"
ECS_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${ECS_SG_NAME}" "Name=vpc-id,Values=${VPC_ID_TO_USE}" --region ${AWS_REGION} --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")

if [ -z "$ECS_SG_ID" ] || [ "$ECS_SG_ID" == "None" ]; then
    ECS_SG_ID=$(aws ec2 create-security-group --group-name ${ECS_SG_NAME} --description "Security group for ECS tasks" --vpc-id ${VPC_ID_TO_USE} --region ${AWS_REGION} --query 'GroupId' --output text)
    aws ec2 authorize-security-group-ingress --group-id ${ECS_SG_ID} --protocol tcp --port 8000 --source-group ${ALB_SG_ID} --region ${AWS_REGION}
    aws ec2 authorize-security-group-ingress --group-id ${ECS_SG_ID} --protocol tcp --port 80 --source-group ${ALB_SG_ID} --region ${AWS_REGION}
    echo -e "${GREEN}Created ECS security group: ${ECS_SG_ID}${NC}"
else
    echo -e "${YELLOW}ECS security group already exists: ${ECS_SG_ID}${NC}"
fi

# Create Application Load Balancer
echo -e "${YELLOW}Creating Application Load Balancer...${NC}"
ALB_NAME="${PROJECT_NAME}-alb"

# Check if ALB already exists
EXISTING_ALB=$(aws elbv2 describe-load-balancers --region ${AWS_REGION} --query "LoadBalancers[?LoadBalancerName=='${ALB_NAME}'].LoadBalancerArn" --output text 2>/dev/null || echo "")

if [ -z "$EXISTING_ALB" ] || [ "$EXISTING_ALB" == "None" ]; then
    # Convert subnet IDs to array
    IFS=',' read -ra SUBNET_ARRAY <<< "$SUBNET_IDS"
    
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name ${ALB_NAME} \
        --subnets ${SUBNET_ARRAY[@]} \
        --security-groups ${ALB_SG_ID} \
        --region ${AWS_REGION} \
        --query 'LoadBalancers[0].LoadBalancerArn' --output text)
    
    echo -e "${GREEN}Created Application Load Balancer: ${ALB_ARN}${NC}"
    
    # Get ALB DNS name
    ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns ${ALB_ARN} --region ${AWS_REGION} --query 'LoadBalancers[0].DNSName' --output text)
    echo -e "${GREEN}ALB DNS Name: ${ALB_DNS}${NC}"
else
    ALB_ARN=${EXISTING_ALB}
    ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns ${ALB_ARN} --region ${AWS_REGION} --query 'LoadBalancers[0].DNSName' --output text)
    echo -e "${YELLOW}ALB already exists: ${ALB_ARN}${NC}"
    echo -e "${GREEN}ALB DNS Name: ${ALB_DNS}${NC}"
fi

# Save configuration to file
cat > aws-config.json <<EOF
{
  "region": "${AWS_REGION}",
  "accountId": "${AWS_ACCOUNT_ID}",
  "clusterName": "${CLUSTER_NAME}",
  "backendRepo": "${BACKEND_REPO}",
  "frontendRepo": "${FRONTEND_REPO}",
  "backendEcrUri": "${BACKEND_ECR_URI}",
  "frontendEcrUri": "${FRONTEND_ECR_URI}",
  "vpcId": "${VPC_ID_TO_USE}",
  "subnetIds": "${SUBNET_IDS}",
  "albSecurityGroupId": "${ALB_SG_ID}",
  "ecsSecurityGroupId": "${ECS_SG_ID}",
  "albArn": "${ALB_ARN}",
  "albDns": "${ALB_DNS}"
}
EOF

echo -e "${GREEN}Configuration saved to aws-config.json${NC}"
echo -e "${GREEN}AWS Infrastructure Setup Complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Run './deploy.sh' to build and push Docker images"
echo -e "  2. Create ECS task definitions and services"
echo -e "  3. Configure ALB target groups and listeners"

