# Quick Deployment Guide

## Current Status

✅ Dockerfiles created
✅ AWS CLI configured
✅ ECR repositories created
✅ Infrastructure scripts ready

## What's Been Set Up

1. **Docker Configuration**
   - `backend/Dockerfile` - Python/FastAPI backend
   - `frontend/Dockerfile` - React/Vite frontend with nginx
   - `.dockerignore` files for both

2. **AWS Infrastructure Scripts**
   - `aws-setup.sh` - Creates ECR, ECS cluster, VPC, ALB
   - `deploy.sh` - Builds and pushes Docker images
   - `deploy-ecs.sh` - Deploys to ECS Fargate
   - `setup-secrets.sh` - Sets up AWS Secrets Manager

3. **Code Updates**
   - Backend CORS now uses `ALLOWED_ORIGINS` environment variable
   - Frontend uses `VITE_API_URL` environment variable for API calls

## Required AWS Permissions

Your AWS user needs additional permissions. See `AWS_PERMISSIONS.md` for details.

**Quick fix**: Attach these managed policies to your IAM user:
- `AmazonECS_FullAccess`
- `AmazonEC2FullAccess`
- `ElasticLoadBalancingFullAccess`
- `CloudWatchLogsFullAccess`
- `IAMFullAccess`
- `SecretsManagerReadWrite`

## Deployment Steps (Once Permissions Are Added)

### 1. Set Up Infrastructure
```bash
./aws-setup.sh
```

### 2. Set Up Secrets
Make sure your `.env` file has all required variables, then:
```bash
./setup-secrets.sh
```

### 3. Build and Push Images
```bash
./deploy.sh
```

### 4. Deploy to ECS
```bash
./deploy-ecs.sh
```

## Files Created

### Docker Files
- `backend/Dockerfile`
- `backend/.dockerignore`
- `frontend/Dockerfile`
- `frontend/.dockerignore`

### Deployment Scripts
- `aws-setup.sh` - Infrastructure setup
- `deploy.sh` - Build and push images
- `deploy-ecs.sh` - ECS deployment
- `setup-secrets.sh` - Secrets Manager setup

### Configuration Files
- `ecs-task-definition-backend.json` - Backend task definition template
- `ecs-task-definition-frontend.json` - Frontend task definition template
- `aws-config.json` - Generated after running aws-setup.sh

### Documentation
- `DEPLOYMENT.md` - Full deployment guide
- `AWS_PERMISSIONS.md` - Required IAM permissions
- `QUICK_DEPLOY.md` - This file

## Next Steps

1. **Add AWS Permissions** (see AWS_PERMISSIONS.md)
2. **Run aws-setup.sh** to create infrastructure
3. **Set up secrets** with setup-secrets.sh
4. **Deploy** with deploy.sh and deploy-ecs.sh

## Testing Locally

You can test the Docker images locally:

```bash
# Build backend
cd backend
docker build -t aware-backend .
docker run -p 8000:8000 --env-file ../.env aware-backend

# Build frontend
cd frontend
docker build -t aware-frontend .
docker run -p 80:80 aware-frontend
```

