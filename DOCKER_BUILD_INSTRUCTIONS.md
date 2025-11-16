# Docker Build Instructions

Docker is required to build and push the container images. Here are your options:

## Option 1: Install Docker Locally (Recommended)

### macOS
```bash
# Install Docker Desktop for Mac
brew install --cask docker
# Or download from https://www.docker.com/products/docker-desktop
```

### Linux
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io
sudo systemctl start docker
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

### Windows
Download Docker Desktop from https://www.docker.com/products/docker-desktop

After installing Docker, run:
```bash
cd /Users/raymondli/Documents/CMPE272/aware-water-agent
./deploy.sh
```

## Option 2: Use AWS CodeBuild (Cloud-based)

I've created buildspec files that can be used with AWS CodeBuild. You can set up CodeBuild projects to build your images in the cloud.

## Option 3: Use EC2 Instance with Docker

1. Launch an EC2 instance with Docker pre-installed (Amazon Linux 2 AMI)
2. SSH into the instance
3. Clone your repository
4. Run `./deploy.sh`

## Option 4: Manual Build Commands

If you have Docker installed elsewhere, you can run these commands manually:

```bash
# Set variables
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=623677486066
BACKEND_ECR=623677486066.dkr.ecr.us-east-1.amazonaws.com/aware-water-backend
FRONTEND_ECR=623677486066.dkr.ecr.us-east-1.amazonaws.com/aware-water-frontend

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $BACKEND_ECR

# Build and push backend
cd backend
docker build -t $BACKEND_ECR:latest .
docker push $BACKEND_ECR:latest
cd ..

# Build and push frontend
cd frontend
docker build -t $FRONTEND_ECR:latest .
docker push $FRONTEND_ECR:latest
cd ..
```

## Current Status

✅ AWS Infrastructure: Created
✅ ECR Repositories: Created
✅ Secrets: Configured
⏳ Docker Images: Need to be built and pushed
⏳ ECS Deployment: Waiting for images

Once images are built and pushed, run:
```bash
./deploy-ecs.sh
```

