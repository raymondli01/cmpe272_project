# AWS Deployment Guide - AWARE Water Management System

This guide walks you through deploying the AWARE Water Management System to AWS using Docker, ECR, and ECS Fargate.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Docker** installed and running
4. **Environment variables** in `.env` file at project root

## Architecture

```
Internet
  ↓
Application Load Balancer (ALB)
  ├── Frontend (React/Vite) - Port 80
  └── Backend (FastAPI) - Port 8000
        ↓
    ECS Fargate Services
        ↓
    ECR Container Images
```

## Deployment Steps

### Step 1: Configure AWS CLI

AWS CLI should already be configured with your credentials. Verify with:

```bash
aws sts get-caller-identity
```

### Step 2: Set Up AWS Infrastructure

Run the infrastructure setup script to create:
- ECR repositories
- ECS cluster
- VPC and networking
- Security groups
- Application Load Balancer

```bash
./aws-setup.sh
```

This script will create `aws-config.json` with all the necessary configuration.

### Step 3: Set Up Secrets in AWS Secrets Manager

Before deploying, you need to store sensitive environment variables in AWS Secrets Manager:

```bash
./setup-secrets.sh
```

This script reads from your `.env` file and creates secrets for:
- `aware-water/supabase-url`
- `aware-water/supabase-service-key`
- `aware-water/openai-key`
- `aware-water/allowed-origins`
- `aware-water/frontend/supabase-url`
- `aware-water/frontend/supabase-key`

**Note**: Make sure your `.env` file contains all required variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Step 4: Build and Push Docker Images

Build Docker images and push them to ECR:

```bash
./deploy.sh
```

This will:
1. Build backend Docker image
2. Build frontend Docker image
3. Push both images to ECR

### Step 5: Deploy to ECS

Deploy the application to ECS Fargate:

```bash
./deploy-ecs.sh
```

This script will:
1. Create CloudWatch log groups
2. Create IAM roles (if needed)
3. Register ECS task definitions
4. Create target groups
5. Create/update ECS services
6. Configure ALB listeners and routing rules

### Step 6: Verify Deployment

After deployment, the script will output the ALB DNS name. Access your application at:

- **Frontend**: `http://<ALB_DNS>`
- **Backend API**: `http://<ALB_DNS>/api`

Check service status:

```bash
aws ecs describe-services \
  --cluster aware-water-cluster \
  --services aware-water-cluster-backend aware-water-cluster-frontend \
  --region us-east-1
```

## Environment Variables

### Backend (ECS Task Definition)

The backend uses secrets from AWS Secrets Manager:
- `SUPABASE_URL` - From `aware-water/supabase-url`
- `SUPABASE_SERVICE_ROLE_KEY` - From `aware-water/supabase-service-key`
- `OPENAI_API_KEY` - From `aware-water/openai-key`
- `ALLOWED_ORIGINS` - From `aware-water/allowed-origins`

### Frontend (Build Time)

Frontend environment variables are embedded at build time. Set these in your `.env` file:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_API_URL` - Backend API URL (will be set to ALB DNS)

## ALB Routing Rules

The Application Load Balancer is configured with the following routing:

- `/api/*` → Backend service
- `/sensors`, `/leaks`, `/ai/*`, `/network/*` → Backend service
- All other paths → Frontend service

## Updating the Deployment

### Update Application Code

1. Make your code changes
2. Rebuild and push images:
   ```bash
   ./deploy.sh
   ```
3. Update ECS services:
   ```bash
   ./deploy-ecs.sh
   ```

### Update Environment Variables

1. Update secrets in AWS Secrets Manager:
   ```bash
   ./setup-secrets.sh
   ```
2. Update ECS services to pick up new secrets:
   ```bash
   ./deploy-ecs.sh
   ```

## Troubleshooting

### Check ECS Service Logs

```bash
# Backend logs
aws logs tail /ecs/aware-water-backend --follow --region us-east-1

# Frontend logs
aws logs tail /ecs/aware-water-frontend --follow --region us-east-1
```

### Check Service Status

```bash
aws ecs describe-services \
  --cluster aware-water-cluster \
  --services aware-water-cluster-backend \
  --region us-east-1 \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

### Check Task Status

```bash
aws ecs list-tasks \
  --cluster aware-water-cluster \
  --service-name aware-water-cluster-backend \
  --region us-east-1
```

### View Task Details

```bash
TASK_ARN=$(aws ecs list-tasks --cluster aware-water-cluster --service-name aware-water-cluster-backend --region us-east-1 --query 'taskArns[0]' --output text)
aws ecs describe-tasks --cluster aware-water-cluster --tasks $TASK_ARN --region us-east-1
```

## Cost Considerations

- **ECS Fargate**: Pay per vCPU and memory used
- **ALB**: Pay per hour and per LCU (Load Balancer Capacity Unit)
- **ECR**: Pay per GB stored and per GB transferred
- **CloudWatch Logs**: Pay per GB ingested and stored

Estimated monthly cost for minimal setup (1 task each, low traffic): ~$30-50/month

## Security Notes

1. **Secrets**: All sensitive data is stored in AWS Secrets Manager
2. **Security Groups**: Configured to allow traffic only from ALB
3. **IAM Roles**: Use least privilege principle
4. **HTTPS**: Consider adding SSL certificate for production use

## Next Steps

1. Set up custom domain with Route 53
2. Configure SSL certificate with ACM
3. Set up auto-scaling policies
4. Configure CloudWatch alarms
5. Set up CI/CD pipeline

