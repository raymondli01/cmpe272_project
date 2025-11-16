# Required AWS IAM Permissions

The AWS user needs the following permissions to deploy the AWARE Water Management System:

## Required IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:*",
        "ecs:*",
        "ec2:*",
        "elasticloadbalancing:*",
        "logs:*",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:GetRole",
        "iam:PassRole",
        "iam:ListRoles",
        "secretsmanager:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Minimum Required Permissions (More Restrictive)

If you want to use least privilege, here are the specific permissions needed:

### ECR Permissions
- `ecr:CreateRepository`
- `ecr:DescribeRepositories`
- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:GetDownloadUrlForLayer`
- `ecr:BatchGetImage`
- `ecr:PutImage`
- `ecr:InitiateLayerUpload`
- `ecr:UploadLayerPart`
- `ecr:CompleteLayerUpload`

### ECS Permissions
- `ecs:CreateCluster`
- `ecs:DescribeClusters`
- `ecs:RegisterTaskDefinition`
- `ecs:DescribeTaskDefinition`
- `ecs:CreateService`
- `ecs:UpdateService`
- `ecs:DescribeServices`
- `ecs:ListTasks`
- `ecs:DescribeTasks`

### EC2 Permissions
- `ec2:CreateVpc`
- `ec2:DescribeVpcs`
- `ec2:ModifyVpcAttribute`
- `ec2:CreateSubnet`
- `ec2:DescribeSubnets`
- `ec2:CreateInternetGateway`
- `ec2:AttachInternetGateway`
- `ec2:CreateRouteTable`
- `ec2:CreateRoute`
- `ec2:AssociateRouteTable`
- `ec2:CreateSecurityGroup`
- `ec2:DescribeSecurityGroups`
- `ec2:AuthorizeSecurityGroupIngress`
- `ec2:DescribeAvailabilityZones`

### ELB Permissions
- `elasticloadbalancing:CreateLoadBalancer`
- `elasticloadbalancing:DescribeLoadBalancers`
- `elasticloadbalancing:CreateTargetGroup`
- `elasticloadbalancing:DescribeTargetGroups`
- `elasticloadbalancing:CreateListener`
- `elasticloadbalancing:DescribeListeners`
- `elasticloadbalancing:CreateRule`
- `elasticloadbalancing:DescribeRules`

### CloudWatch Logs Permissions
- `logs:CreateLogGroup`
- `logs:DescribeLogGroups`
- `logs:PutRetentionPolicy`

### IAM Permissions
- `iam:CreateRole`
- `iam:AttachRolePolicy`
- `iam:GetRole`
- `iam:PassRole`
- `iam:ListAttachedRolePolicies`

### Secrets Manager Permissions
- `secretsmanager:CreateSecret`
- `secretsmanager:UpdateSecret`
- `secretsmanager:DescribeSecret`
- `secretsmanager:GetSecretValue`

## How to Add Permissions

### Option 1: Attach AWS Managed Policies (Easiest)

Attach these managed policies to your IAM user:
- `AmazonECS_FullAccess`
- `AmazonEC2FullAccess`
- `ElasticLoadBalancingFullAccess`
- `CloudWatchLogsFullAccess`
- `IAMFullAccess` (or create custom policy with only needed permissions)
- `SecretsManagerReadWrite`

### Option 2: Create Custom Policy

1. Go to IAM Console → Policies → Create Policy
2. Use the JSON policy above
3. Attach it to your user

### Option 3: Use AWS Administrator Access (Not Recommended for Production)

For testing purposes, you can temporarily grant `AdministratorAccess` policy.

## Current Status

✅ ECR repositories created successfully
❌ ECS cluster creation requires additional permissions

## Next Steps

1. Contact your AWS administrator to add the required permissions
2. Or, if you have admin access, attach the policies listed above
3. Once permissions are added, re-run `./aws-setup.sh`

