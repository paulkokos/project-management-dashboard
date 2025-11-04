# AWS EKS Kubernetes Manifests

Kubernetes manifests for deploying to Amazon EKS (Elastic Kubernetes Service).

## Purpose

Enterprise-grade cloud deployment on AWS with:
- Auto-scaling (10 to 10,000+ users)
- High availability (Multi-AZ)
- Managed Kubernetes
- AWS service integrations
- Global distribution

## Why EKS?

Amazon EKS is ideal for production because:
- ✅ Fully managed Kubernetes control plane
- ✅ Automatic version updates and patching
- ✅ Integrated with AWS services (RDS, ElastiCache, S3)
- ✅ Multi-AZ high availability
- ✅ Auto-scaling based on demand
- ✅ Enterprise security and compliance
- ✅ 99.95% uptime SLA

## What Will Go Here

When implemented, this directory will contain:

### AWS-Specific Configuration
- `aws-auth.yaml` - IAM roles for service accounts
- `storage-class.yaml` - EBS storage classes
- `alb-ingress.yaml` - Application Load Balancer
- `cluster-autoscaler.yaml` - Node auto-scaling
- `metrics-server.yaml` - Resource metrics

### Microservices
Same as Ubuntu, but with AWS optimizations:
- `<service>/deployment.yaml` - With AWS-specific settings
- `<service>/service.yaml` - Service definitions
- `<service>/hpa.yaml` - Horizontal Pod Autoscaler
- `<service>/vpa.yaml` - Vertical Pod Autoscaler (optional)

### AWS Service Integrations
- `external-secrets/` - AWS Secrets Manager integration
- `external-dns/` - Route 53 DNS automation
- `cert-manager/` - ACM certificate management
- `aws-load-balancer-controller/` - ALB controller

### Monitoring & Logging
- `cloudwatch/` - CloudWatch Container Insights
- `prometheus/` - Prometheus for metrics
- `grafana/` - Grafana dashboards
- `fluentd/` - Log forwarding to CloudWatch

## Example Structure

```
aws/
├── namespace.yaml
├── configmap.yaml
├── aws-auth.yaml
├── storage-class.yaml
│
├── auth-service/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   └── service-account.yaml
│
├── project-service/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
│
├── frontend/
│   ├── deployment.yaml
│   └── service.yaml
│
├── alb-ingress.yaml
├── cluster-autoscaler.yaml
├── external-secrets.yaml
└── external-dns.yaml
```

## AWS Architecture

```
                Internet
                   ↓
              CloudFront (CDN)
                   ↓
               Route 53 (DNS)
                   ↓
         Application Load Balancer
                   ↓
      ┌────────────┴────────────┐
      ↓                         ↓
   EKS Cluster              EKS Cluster
   (AZ-1a)                  (AZ-1b)
      ↓                         ↓
   Microservices            Microservices

      ↓                         ↓
   ┌──────────────────────────────┐
   │     AWS Services             │
   ├──────────────────────────────┤
   │ RDS PostgreSQL (Multi-AZ)    │
   │ ElastiCache Redis            │
   │ S3 (Documents/Backups)       │
   │ Elasticsearch Service        │
   │ Secrets Manager              │
   │ CloudWatch Logs              │
   └──────────────────────────────┘
```

## Deployment Process

When ready to deploy to AWS:

```bash
# 1. Create EKS cluster (via Terraform - see ../terraform/aws/)
cd ../../terraform/aws
terraform init
terraform apply

# 2. Configure kubectl
aws eks update-kubeconfig --name project-dashboard-cluster --region us-east-1

# 3. Install AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller/crds"
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system

# 4. Deploy services
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f aws-auth.yaml
kubectl apply -f auth-service/
kubectl apply -f project-service/
kubectl apply -f frontend/

# 5. Deploy ingress with ALB
kubectl apply -f alb-ingress.yaml

# 6. Setup auto-scaling
kubectl apply -f cluster-autoscaler.yaml

# 7. Verify deployment
kubectl get pods -n project-dashboard
kubectl get ingress -n project-dashboard
```

## Cost Estimate

**Small Deployment (100-500 users):**
- EKS Control Plane: $73/month
- Worker Nodes (3x m6i.xlarge): $450/month
- RDS PostgreSQL: $440/month
- ElastiCache Redis: $280/month
- Load Balancer: $25/month
- Data transfer: $100/month
- **Total: ~$1,400/month**

**Medium Deployment (500-2,000 users):**
- EKS Control Plane: $73/month
- Worker Nodes (6x m6i.xlarge): $900/month
- RDS PostgreSQL (larger): $880/month
- ElastiCache Redis: $560/month
- Other services: $200/month
- **Total: ~$2,600/month**

**Large Deployment (2,000-10,000 users):**
- EKS Control Plane: $73/month
- Worker Nodes (12-20x): $1,800-3,000/month
- RDS PostgreSQL (Multi-AZ + replicas): $2,000/month
- ElastiCache Redis: $1,000/month
- Other services: $500/month
- **Total: ~$5,400-6,600/month**

## AWS Services Used

### Compute
- **EKS** - Managed Kubernetes
- **EC2** - Worker nodes
- **Auto Scaling Groups** - Node scaling

### Database & Cache
- **RDS PostgreSQL** - Managed database
- **ElastiCache Redis** - Managed cache
- **Elasticsearch Service** - Managed search

### Storage
- **EBS** - Block storage for pods
- **S3** - Object storage for files/backups
- **EFS** - Shared file system (optional)

### Networking
- **VPC** - Virtual network
- **Application Load Balancer** - HTTP(S) load balancing
- **Route 53** - DNS management
- **CloudFront** - CDN

### Security
- **IAM** - Identity and access management
- **Secrets Manager** - Secret storage
- **KMS** - Encryption keys
- **WAF** - Web application firewall
- **GuardDuty** - Threat detection
- **Security Groups** - Firewall rules

### Monitoring & Logging
- **CloudWatch** - Metrics and logs
- **CloudWatch Container Insights** - Container monitoring
- **X-Ray** - Distributed tracing
- **CloudTrail** - API audit logging

## Migration from Ubuntu

When migrating from Ubuntu K3s to AWS EKS:

1. **Export data** from Ubuntu PostgreSQL
2. **Create AWS infrastructure** (Terraform)
3. **Import data** to RDS
4. **Deploy services** to EKS
5. **Test thoroughly**
6. **Cutover DNS** to AWS
7. **Monitor** for issues

## High Availability Setup

For production HA:
- **Multi-AZ deployment** (3 availability zones)
- **Multiple replicas** per service (3+)
- **Database Multi-AZ** with read replicas
- **Redis cluster mode** with replicas
- **ALB health checks** and auto-recovery
- **Cluster autoscaler** for node scaling
- **Pod disruption budgets** for safe updates

## Security Best Practices

- Use **IAM roles for service accounts** (IRSA)
- Enable **Pod Security Standards**
- Implement **Network Policies**
- Use **AWS Secrets Manager** for secrets
- Enable **VPC Flow Logs**
- Configure **Security Groups** properly
- Use **private subnets** for pods
- Enable **encryption at rest** (EBS, RDS, S3)
- Enable **encryption in transit** (TLS)

## Current Status

**Status:** Empty - Manifests not yet created

**Create these when:**
- You're ready for AWS production deployment
- You need to scale beyond Ubuntu server capacity
- Client requires cloud deployment
- You have budget for AWS (~$1,400-6,600/month)

**Prerequisites:**
- AWS account with billing setup
- Terraform infrastructure created
- Docker images published to ECR
- DNS domain configured

---

**Last Updated:** 2025-11-02
**Status:** Placeholder - Awaiting AWS deployment decision
