# Terraform Infrastructure as Code

Infrastructure as Code (IaC) configurations for automated cloud infrastructure provisioning.

## Purpose

Define and manage cloud infrastructure using code:
- Repeatable deployments
- Version-controlled infrastructure
- Disaster recovery
- Multi-environment setup (dev, staging, prod)

## What is Terraform?

Terraform is an IaC tool that allows you to:
- ✅ Define infrastructure in declarative configuration files
- ✅ Automate cloud resource creation
- ✅ Manage infrastructure lifecycle
- ✅ Plan changes before applying
- ✅ Track infrastructure state
- ✅ Collaborate on infrastructure changes

## What Will Go Here

### For AWS Deployment:
```
terraform/aws/
├── main.tf              # Main configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── terraform.tfvars     # Variable values (not in git)
│
├── modules/
│   ├── vpc/            # Virtual Private Cloud
│   ├── eks/            # EKS cluster
│   ├── rds/            # PostgreSQL database
│   ├── elasticache/    # Redis cache
│   ├── s3/             # Object storage
│   ├── iam/            # IAM roles and policies
│   ├── security/       # Security groups, WAF
│   └── monitoring/     # CloudWatch, alarms
│
├── environments/
│   ├── dev/
│   ├── staging/
│   └── production/
│
└── README.md
```

## AWS Resources Managed

When implemented, Terraform will create:

### Networking
- VPC with public/private subnets across 3 AZs
- Internet Gateway
- NAT Gateways
- Route tables
- Security groups
- Network ACLs

### Compute
- EKS cluster
- Node groups (with auto-scaling)
- Launch templates
- Auto Scaling Groups

### Database & Cache
- RDS PostgreSQL (Multi-AZ)
- RDS read replicas
- ElastiCache Redis cluster
- Elasticsearch domain

### Storage
- S3 buckets (documents, backups, logs)
- EBS volumes
- Backup vaults

### Security
- IAM roles and policies
- Security groups
- WAF rules
- KMS encryption keys
- Secrets Manager secrets

### Networking & CDN
- Application Load Balancer
- Route 53 hosted zones
- CloudFront distributions
- ACM certificates

### Monitoring
- CloudWatch log groups
- CloudWatch alarms
- SNS topics for alerts
- CloudWatch dashboards

## Example Usage

When ready to deploy infrastructure:

```bash
# Navigate to AWS directory
cd terraform/aws

# Initialize Terraform
terraform init

# View execution plan
terraform plan

# Apply changes
terraform apply

# View outputs
terraform output

# Destroy infrastructure (be careful!)
terraform destroy
```

## Directory Structure

```
terraform/
└── aws/
    ├── README.md
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    ├── terraform.tfvars.example
    │
    ├── modules/
    │   ├── vpc/
    │   │   ├── main.tf
    │   │   ├── variables.tf
    │   │   └── outputs.tf
    │   │
    │   ├── eks/
    │   │   ├── main.tf
    │   │   ├── variables.tf
    │   │   └── outputs.tf
    │   │
    │   ├── rds/
    │   │   ├── main.tf
    │   │   ├── variables.tf
    │   │   └── outputs.tf
    │   │
    │   └── ... (other modules)
    │
    └── environments/
        ├── dev/
        │   ├── main.tf
        │   ├── terraform.tfvars
        │   └── backend.tf
        │
        ├── staging/
        │   └── ...
        │
        └── production/
            └── ...
```

## Benefits of Using Terraform

### 1. **Automation**
- No manual clicking in AWS console
- Consistent infrastructure across environments
- Reduced human error

### 2. **Version Control**
- Infrastructure changes tracked in Git
- Code review for infrastructure changes
- Rollback capability

### 3. **Documentation**
- Infrastructure is self-documenting
- Clear understanding of what resources exist
- Easy onboarding for new team members

### 4. **Multi-Environment**
- Identical dev, staging, production environments
- Easy to spin up new environments
- Test infrastructure changes safely

### 5. **Cost Management**
- Know exactly what resources are deployed
- Easy to tear down unused environments
- Track infrastructure costs

### 6. **Disaster Recovery**
- Rebuild entire infrastructure from code
- RPO: Minutes to hours (depending on backups)
- RTO: 2-4 hours

## Prerequisites

Before using Terraform:

1. **Install Terraform**
   ```bash
   # Ubuntu/Debian
   wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
   echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
   sudo apt update && sudo apt install terraform
   ```

2. **AWS Account**
   - Create AWS account
   - Configure billing
   - Set up IAM user with admin access

3. **AWS CLI**
   ```bash
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

4. **Configure AWS Credentials**
   ```bash
   aws configure
   # Enter: Access Key ID, Secret Access Key, Region, Output format
   ```

5. **S3 Backend for State** (recommended)
   - Create S3 bucket for Terraform state
   - Enable versioning
   - Enable encryption

## Cost Considerations

### Development Environment
- **Compute:** $200-400/month
- **Database:** $100-200/month
- **Other:** $50-100/month
- **Total:** ~$400-700/month

### Staging Environment
- **Compute:** $400-600/month
- **Database:** $200-300/month
- **Other:** $100-150/month
- **Total:** ~$700-1,050/month

### Production Environment
- **Compute:** $800-2,000/month
- **Database:** $500-1,000/month
- **Cache:** $200-500/month
- **Storage:** $100-200/month
- **Networking:** $100-200/month
- **Monitoring:** $50-100/month
- **Total:** ~$1,750-4,000/month

**Total for all environments:** ~$2,850-5,750/month

### Cost Optimization Tips
- Use Savings Plans (30-50% discount)
- Use Reserved Instances for predictable workloads
- Use Spot Instances for non-critical workloads
- Rightsize instances based on actual usage
- Delete unused resources
- Use auto-scaling to match demand

## Security Best Practices

### 1. **State File Security**
- Store state in S3 with encryption
- Enable state locking with DynamoDB
- Never commit state files to Git
- Use backend authentication

### 2. **Secrets Management**
- Never hardcode secrets in Terraform files
- Use AWS Secrets Manager
- Use environment variables for sensitive data
- Use Terraform variables for configuration

### 3. **Access Control**
- Use minimal IAM permissions
- Rotate credentials regularly
- Enable MFA for AWS account
- Use separate AWS accounts for environments

### 4. **Audit & Compliance**
- Enable CloudTrail
- Enable Config
- Use cost allocation tags
- Regular security audits

## When to Create This

Create Terraform configurations when:
- ✅ You're ready to deploy to AWS
- ✅ You need multiple environments (dev/staging/prod)
- ✅ You want infrastructure automation
- ✅ You need disaster recovery capability
- ✅ Team collaboration on infrastructure

Don't create these if:
- ❌ Still testing on local machine
- ❌ Ubuntu single server is sufficient
- ❌ Not ready for cloud costs
- ❌ No AWS deployment planned

## Current Status

**Status:** Empty - Configurations not yet created

**Next Steps:**
1. Decide on AWS deployment
2. Create AWS account
3. Plan infrastructure requirements
4. Write Terraform modules
5. Test in dev environment
6. Deploy to production

---

**Last Updated:** 2025-11-02
**Status:** Placeholder - Awaiting AWS deployment decision
