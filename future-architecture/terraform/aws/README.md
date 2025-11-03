# AWS Terraform Configuration

Terraform Infrastructure as Code for deploying Project Management Dashboard to AWS.

## Purpose

Automate the creation of complete AWS infrastructure for:
- EKS Kubernetes cluster
- RDS PostgreSQL database
- ElastiCache Redis
- S3 storage
- Networking (VPC, subnets, load balancers)
- Security (IAM, security groups, WAF)
- Monitoring (CloudWatch, alarms)

## What Will Go Here

When implemented, this directory will contain complete AWS infrastructure code.

### Module Structure

```
aws/
├── main.tf                 # Main configuration, module composition
├── variables.tf            # Input variables
├── outputs.tf              # Output values (cluster endpoint, etc.)
├── terraform.tfvars.example # Example variable values
├── backend.tf              # S3 backend for state
├── versions.tf             # Terraform and provider versions
│
├── modules/
│   ├── vpc/               # VPC, subnets, NAT, IGW
│   ├── eks/               # EKS cluster and node groups
│   ├── rds/               # PostgreSQL database
│   ├── elasticache/       # Redis cluster
│   ├── s3/                # S3 buckets
│   ├── iam/               # IAM roles and policies
│   ├── security/          # Security groups, NACL, WAF
│   ├── alb/               # Application Load Balancer
│   ├── route53/           # DNS configuration
│   ├── cloudfront/        # CDN
│   ├── monitoring/        # CloudWatch, SNS
│   └── backup/            # AWS Backup configuration
│
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   │   └── ...
│   └── production/
│       └── ...
│
└── README.md (this file)
```

## Infrastructure Created

This Terraform configuration will create:

### Networking (VPC Module)
- 1 VPC
- 3 Public subnets (1 per AZ)
- 3 Private subnets (1 per AZ)
- 3 Database subnets (1 per AZ)
- Internet Gateway
- 3 NAT Gateways (1 per AZ for HA)
- Route tables
- Network ACLs

### Compute (EKS Module)
- EKS control plane
- 3 Node groups (for different workload types)
- Auto Scaling Groups
- Launch templates
- IAM roles for nodes
- OIDC provider for IRSA

### Database (RDS Module)
- RDS PostgreSQL instance (Multi-AZ)
- 2 Read replicas
- DB subnet group
- Parameter group
- Option group
- Automated backups
- Encryption at rest

### Cache (ElastiCache Module)
- Redis cluster mode enabled
- 3 Shards
- 2 Replicas per shard
- Subnet group
- Parameter group
- Encryption at rest and in transit

### Storage (S3 Module)
- Documents bucket
- Backups bucket
- Logs bucket
- Versioning enabled
- Encryption at rest
- Lifecycle policies

### Security (IAM & Security Modules)
- EKS cluster role
- Node group role
- Service account roles (IRSA)
- Security groups for:
  - EKS control plane
  - Worker nodes
  - RDS database
  - ElastiCache
  - Load balancer
- WAF web ACL
- KMS keys for encryption

### Load Balancing (ALB Module)
- Application Load Balancer
- Target groups
- Listener rules
- SSL/TLS certificates (ACM)

### DNS (Route53 Module)
- Hosted zone
- A records
- CNAME records
- Health checks

### CDN (CloudFront Module)
- CloudFront distribution
- Origin configuration
- Cache behaviors
- SSL/TLS certificate

### Monitoring (Monitoring Module)
- CloudWatch log groups
- CloudWatch alarms for:
  - High CPU usage
  - High memory usage
  - Database connections
  - Disk space
  - Error rates
- SNS topics for alerts
- CloudWatch dashboards

### Backup (Backup Module)
- Backup vaults
- Backup plans
- Backup selection rules
- Lifecycle policies

## Prerequisites

Before running Terraform:

1. **AWS Account**
   - Active AWS account
   - Billing configured
   - No service limits blocking deployment

2. **AWS CLI Configured**
   ```bash
   aws configure
   # Set: Access Key, Secret Key, Region (us-east-1), Output (json)
   ```

3. **Terraform Installed**
   ```bash
   terraform --version
   # Should be v1.6.0 or later
   ```

4. **S3 Bucket for State**
   ```bash
   aws s3 mb s3://project-dashboard-terraform-state
   aws s3api put-bucket-versioning \
     --bucket project-dashboard-terraform-state \
     --versioning-configuration Status=Enabled
   ```

5. **DynamoDB Table for State Locking**
   ```bash
   aws dynamodb create-table \
     --table-name terraform-state-lock \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
   ```

## Usage

### Initial Setup

```bash
# 1. Navigate to this directory
cd future-architecture/terraform/aws

# 2. Copy example variables
cp terraform.tfvars.example terraform.tfvars

# 3. Edit variables
vim terraform.tfvars
# Set: region, environment, cluster_name, db_password, etc.

# 4. Initialize Terraform
terraform init

# 5. Validate configuration
terraform validate

# 6. Format code
terraform fmt -recursive
```

### Deploy Infrastructure

```bash
# 1. Plan changes
terraform plan -out=tfplan

# Review the plan carefully!
# This will show all resources to be created

# 2. Apply changes
terraform apply tfplan

# This will take 15-20 minutes for full deployment
```

### Update Infrastructure

```bash
# After making changes to .tf files
terraform plan
terraform apply
```

### Destroy Infrastructure

```bash
# WARNING: This deletes everything!
terraform plan -destroy
terraform destroy

# Only do this if you're sure!
```

## Variable Configuration

Key variables to configure in `terraform.tfvars`:

```hcl
# General
region = "us-east-1"
environment = "production"
project_name = "project-dashboard"

# Networking
vpc_cidr = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# EKS
cluster_name = "project-dashboard-cluster"
cluster_version = "1.28"
node_instance_types = ["m6i.xlarge"]
node_desired_size = 3
node_min_size = 2
node_max_size = 10

# RDS
db_instance_class = "db.r6g.xlarge"
db_allocated_storage = 100
db_engine_version = "15.4"
db_name = "project_management"
db_username = "admin"
db_password = "CHANGE_ME_TO_SECURE_PASSWORD"

# Redis
redis_node_type = "cache.r6g.large"
redis_num_cache_clusters = 2

# Domain
domain_name = "yourdomain.com"
certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID"

# Monitoring
enable_monitoring = true
alert_email = "alerts@yourdomain.com"

# Backup
backup_retention_days = 30
backup_schedule = "cron(0 2 * * ? *)" # 2 AM UTC daily

# Tags
tags = {
  Environment = "production"
  Project     = "project-dashboard"
  ManagedBy   = "terraform"
  Owner       = "platform-team"
}
```

## Outputs

After successful deployment, Terraform will output:

```hcl
# Cluster Information
cluster_endpoint      # EKS cluster API endpoint
cluster_name          # EKS cluster name
cluster_security_group_id

# Database
db_endpoint           # RDS endpoint
db_port              # Database port (5432)
db_name              # Database name

# Cache
redis_endpoint       # Redis cluster endpoint
redis_port          # Redis port (6379)

# Load Balancer
alb_dns_name        # Load balancer DNS
alb_zone_id

# Storage
s3_bucket_documents  # Documents bucket name
s3_bucket_backups    # Backups bucket name

# To view outputs:
terraform output
terraform output cluster_endpoint
```

## Cost Estimation

For production environment:

### Monthly Costs
- **EKS Control Plane:** $73
- **EC2 Instances (3x m6i.xlarge):** ~$450
- **RDS PostgreSQL (db.r6g.xlarge Multi-AZ):** ~$880
- **ElastiCache Redis:** ~$280
- **NAT Gateways (3x):** ~$100
- **Application Load Balancer:** ~$25
- **S3 Storage (1TB):** ~$23
- **Data Transfer:** ~$100
- **CloudWatch:** ~$50
- **Backup Storage:** ~$30

**Estimated Total:** ~$2,011/month

### Cost Optimization
- Use Savings Plans: Save 30-50%
- Use Spot Instances for dev: Save 70%
- Reduce to 2 AZs in non-prod: Save 33%
- Smaller instances for dev/staging

## Security Considerations

### Secrets Management
```hcl
# Never commit these to Git!
# Use environment variables or AWS Secrets Manager

# Example: Using environment variables
export TF_VAR_db_password="your-secure-password"

# Or use AWS Secrets Manager
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "project-dashboard/db-password"
}
```

### State File Security
```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "project-dashboard-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

## Troubleshooting

### Common Issues

**1. AWS Credentials Not Found**
```bash
aws configure
# Or set environment variables:
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
```

**2. Insufficient Permissions**
```bash
# Ensure IAM user has required permissions
# AdministratorAccess or custom policy with:
# - EC2, EKS, RDS, ElastiCache, S3, IAM, CloudWatch, Route53
```

**3. Resource Limits**
```bash
# Check service quotas in AWS console
# Request limit increases if needed
```

**4. State Lock**
```bash
# If state is locked
terraform force-unlock LOCK_ID
```

## Migration from Ubuntu

When migrating from Ubuntu to AWS:

1. **Backup Ubuntu data**
2. **Deploy AWS infrastructure** with Terraform
3. **Migrate database** to RDS
4. **Deploy applications** to EKS
5. **Test thoroughly**
6. **Switch DNS** to AWS
7. **Monitor** for issues

## Current Status

**Status:** Empty - Configuration files not yet created

**Create when:**
- Ready for AWS production deployment
- Budget approved (~$2,000-4,000/month)
- AWS account configured
- Team trained on Terraform

**Don't create if:**
- Still in development phase
- Ubuntu server is sufficient
- No budget for AWS
- No immediate cloud need

---

**Last Updated:** 2025-11-02
**Status:** Placeholder - Awaiting implementation
**Estimated Setup Time:** 1-2 weeks
**Estimated Cost:** $2,000-4,000/month (production)
