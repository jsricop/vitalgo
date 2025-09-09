# VitalGo AWS Deployment Guide

This guide will help you deploy the VitalGo medical platform to AWS using a production-ready infrastructure.

## Architecture Overview

The VitalGo platform is deployed using the following AWS services:

- **ECS Fargate**: Containerized application hosting
- **RDS PostgreSQL**: Managed database service
- **Application Load Balancer**: Traffic distribution and HTTPS termination
- **ECR**: Container image registry
- **CloudWatch**: Logging and monitoring
- **VPC**: Isolated network environment

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Docker** installed and running
4. **Domain name** purchased and DNS access
5. **SSL Certificate** from AWS Certificate Manager

### Required AWS Permissions

Your AWS user/role needs the following permissions:
- CloudFormation full access
- ECS full access
- EC2 full access
- RDS full access
- ECR full access
- IAM role creation
- CloudWatch Logs access

## Pre-Deployment Setup

### 1. SSL Certificate Setup

1. Go to AWS Certificate Manager (ACM)
2. Request a public certificate for:
   - `yourdomain.com`
   - `*.yourdomain.com` (wildcard for api.yourdomain.com)
3. Validate the certificate via DNS or email
4. Note the Certificate ARN (needed for deployment)

### 2. Configure AWS CLI

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter default output format (json)
```

### 3. Clone and Prepare Repository

```bash
git clone <your-repo-url>
cd vitalgo
```

## Quick Deployment

The easiest way to deploy is using our automated script:

```bash
./deploy.sh
```

The script will:
1. Check prerequisites
2. Prompt for configuration (domain, certificate ARN, database password)
3. Create ECR repositories
4. Build and push Docker images
5. Deploy CloudFormation infrastructure
6. Provide next steps

## Manual Deployment Steps

If you prefer manual deployment or need to troubleshoot:

### Step 1: Create ECR Repositories

```bash
aws ecr create-repository --repository-name vitalgo-backend --region us-east-1
aws ecr create-repository --repository-name vitalgo-frontend --region us-east-1
```

### Step 2: Build and Push Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT-ID>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -t vitalgo-backend ./backend
docker tag vitalgo-backend:latest <ACCOUNT-ID>.dkr.ecr.us-east-1.amazonaws.com/vitalgo-backend:latest
docker push <ACCOUNT-ID>.dkr.ecr.us-east-1.amazonaws.com/vitalgo-backend:latest

# Build and push frontend
docker build -t vitalgo-frontend --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com ./frontend
docker tag vitalgo-frontend:latest <ACCOUNT-ID>.dkr.ecr.us-east-1.amazonaws.com/vitalgo-frontend:latest
docker push <ACCOUNT-ID>.dkr.ecr.us-east-1.amazonaws.com/vitalgo-frontend:latest
```

### Step 3: Deploy CloudFormation Stack

```bash
aws cloudformation deploy \
  --template-file aws/cloudformation-template.yml \
  --stack-name vitalgo-production \
  --parameter-overrides \
    ProjectName=vitalgo \
    Environment=production \
    DomainName=yourdomain.com \
    CertificateArn=arn:aws:acm:us-east-1:123456789:certificate/your-cert-id \
    DatabasePassword=YourSecurePassword123! \
    JWTSecretKey=YourVeryLongSecureJWTSecretKeyHere \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

## Post-Deployment Configuration

### 1. DNS Configuration

After deployment, you'll receive a Load Balancer DNS name. Configure your domain DNS:

```
A Record: yourdomain.com → <ALB-DNS-NAME>
CNAME: api.yourdomain.com → <ALB-DNS-NAME>
CNAME: www.yourdomain.com → <ALB-DNS-NAME>
```

### 2. Database Setup

Connect to your RDS instance and run the database initialization scripts:

```bash
# Connect to RDS (replace with your actual endpoint and credentials)
psql -h your-db-endpoint.rds.amazonaws.com -U vitalgo_user -d vitalgo_production

# Run the initialization scripts
\i backend/init.sql
\i backend/create_admin_user.sql
\i backend/populate_medical_data.sql
```

### 3. Environment Variables Verification

Verify that all environment variables are correctly set in the ECS task definitions.

## Monitoring and Maintenance

### CloudWatch Logs

Monitor application logs in CloudWatch:
- Backend logs: `/ecs/vitalgo-backend`
- Frontend logs: `/ecs/vitalgo-frontend`

### Health Checks

The deployment includes health checks:
- Backend: `https://api.yourdomain.com/health`
- Frontend: `https://yourdomain.com`

### Database Backups

RDS is configured with:
- 7-day backup retention
- Automated backups enabled
- Deletion protection enabled

## Scaling and Performance

### Auto Scaling

To enable auto-scaling for ECS services:

```bash
# Create auto-scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/vitalgo-cluster/vitalgo-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy based on CPU utilization
aws application-autoscaling put-scaling-policy \
  --policy-name vitalgo-backend-cpu-scaling \
  --service-namespace ecs \
  --resource-id service/vitalgo-cluster/vitalgo-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  }'
```

### Database Scaling

For production workloads, consider:
- Upgrading to `db.t3.small` or larger
- Enabling Multi-AZ deployment
- Setting up read replicas

## Cost Optimization

### Current Architecture Costs (estimated monthly):

- **ECS Fargate**: ~$30-50 (2 tasks running continuously)
- **RDS PostgreSQL**: ~$15-25 (db.t3.micro)
- **Application Load Balancer**: ~$18
- **Data Transfer**: ~$5-20 (depending on traffic)
- **ECR Storage**: ~$1-5

**Total estimated**: ~$70-120/month

### Cost Optimization Tips:

1. Use Fargate Spot for non-critical workloads
2. Enable ECS service auto-scaling to match demand
3. Use CloudWatch to monitor and optimize resource usage
4. Consider Reserved Instances for predictable workloads

## Security Best Practices

### Network Security
- VPC with public/private subnets
- Security groups restricting access
- Database in private subnets only

### Application Security
- HTTPS enforced with SSL certificate
- JWT tokens for authentication
- Environment variables for secrets
- Regular security updates

### Monitoring
- CloudWatch Logs for application monitoring
- CloudTrail for API auditing
- ECR image scanning enabled

## Troubleshooting

### Common Issues

1. **503 Service Unavailable**
   - Check ECS service status
   - Verify health check endpoints
   - Review CloudWatch logs

2. **Database Connection Issues**
   - Verify security group rules
   - Check database endpoint and credentials
   - Ensure database is in available state

3. **SSL Certificate Issues**
   - Verify certificate is validated
   - Check domain name matches certificate
   - Ensure certificate is in the same region

### Useful Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster vitalgo-cluster --services vitalgo-backend vitalgo-frontend

# View recent logs
aws logs tail /ecs/vitalgo-backend --follow

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <TARGET-GROUP-ARN>

# Database connection test
psql -h <DB-ENDPOINT> -U vitalgo_user -d vitalgo_production -c "SELECT version();"
```

## Support and Updates

### Updating the Application

1. Build new Docker images with updated tags
2. Update ECS task definitions
3. Deploy new service revisions

### Rolling Back

CloudFormation supports rollback on failure. To manually rollback:

```bash
aws cloudformation cancel-update-stack --stack-name vitalgo-production
```

## Contact

For deployment support or questions:
- Check CloudWatch Logs for error details
- Review AWS CloudFormation events
- Consult AWS documentation for service-specific issues

---

**Important**: Always test deployments in a staging environment before production deployment.