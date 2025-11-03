# Ubuntu Server Deployment Guide

Complete guide for deploying the Project Management Dashboard on Ubuntu/Linux servers.

## Quick Start

```bash
# Run automated setup
cd future-architecture/scripts
chmod +x ubuntu-setup.sh
./ubuntu-setup.sh
```

## Deployment Options

### Option 1: Docker Compose (Development)
- **Best for:** Local development, testing
- **Requirements:** Ubuntu 22.04+, 16GB RAM, 8 CPU, 200GB disk
- **Cost:** $0 (local) or $40/month (VPS)

### Option 2: K3s Single Server (POC/Small Production)
- **Best for:** POC, demos, small deployments
- **Requirements:** Ubuntu 22.04+, 32GB RAM, 16 CPU, 500GB disk
- **Users:** 10-100
- **Cost:** $80-150/month (VPS)

### Option 3: Multi-Server Cluster (Production)
- **Best for:** Production, high availability
- **Requirements:** 3-5 Ubuntu servers
- **Users:** 100-1,000+
- **Cost:** Hardware or $200-500/month

## Detailed Setup Instructions

See scripts/ubuntu-setup.sh for complete automated installation.

### Manual Installation Steps

#### 1. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### 2. Install K3s
```bash
curl -sfL https://get.k3s.io | sh -
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
```

#### 3. Install Helm
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

#### 4. Deploy Services
```bash
kubectl create namespace project-dashboard
helm install postgresql bitnami/postgresql --namespace project-dashboard
helm install redis bitnami/redis --namespace project-dashboard
helm install elasticsearch elastic/elasticsearch --namespace project-dashboard
```

## Architecture on Ubuntu

```
Ubuntu Server (Single or Cluster)
├── K3s (Lightweight Kubernetes)
│   ├── Frontend Pods (React)
│   ├── Backend Pods (Django/FastAPI)
│   │   ├── Auth Service
│   │   ├── Project Service
│   │   ├── Audit Service
│   │   └── ... (other microservices)
│   └── Supporting Services
│       ├── PostgreSQL
│       ├── Redis
│       └── Elasticsearch
├── Nginx Ingress Controller
└── Monitoring (Prometheus + Grafana)
```

## Server Requirements

### Minimum (Testing)
- Ubuntu 22.04 LTS
- 16 GB RAM
- 8 CPU cores
- 200 GB SSD

### Recommended (Production)
- Ubuntu 22.04 LTS
- 32 GB RAM
- 16 CPU cores
- 500 GB SSD
- 100 Mbps network

### Large Scale (100+ users)
- 3-5 Ubuntu servers
- Each: 64 GB RAM, 32 CPU, 1TB SSD
- 1 Gbps network
- Load balancer

## Migration to AWS

When ready to scale to AWS:

```bash
cd future-architecture/scripts
chmod +x migrate-to-aws.sh
./migrate-to-aws.sh
```

The migration script will:
1. Export all data from Ubuntu
2. Create AWS infrastructure (Terraform)
3. Deploy to EKS
4. Migrate databases
5. Cutover DNS

## Advantages of Ubuntu Deployment

1. ✅ **Cost-effective** - $0-80/month vs $3,000/month AWS
2. ✅ **Full control** - Complete access to infrastructure
3. ✅ **Data sovereignty** - Keep data on-premise
4. ✅ **Testing ground** - Validate before AWS
5. ✅ **Client requirement** - Some pharma clients require on-premise
6. ✅ **Same architecture** - Seamless migration to AWS later

## Monitoring & Maintenance

### Install Monitoring
```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

### Backup Strategy
```bash
# Database backups
kubectl exec -n project-dashboard postgresql-0 -- \
  pg_dump -U admin project_management > backup-$(date +%Y%m%d).sql

# Schedule daily backups
0 2 * * * /path/to/backup-script.sh
```

## Troubleshooting

### Check Pod Status
```bash
kubectl get pods -n project-dashboard
kubectl describe pod <pod-name> -n project-dashboard
kubectl logs <pod-name> -n project-dashboard
```

### Resource Issues
```bash
# Check node resources
kubectl top nodes
kubectl top pods -n project-dashboard

# Increase resources if needed
kubectl scale deployment <service> --replicas=3 -n project-dashboard
```

## Security Hardening

1. **Firewall Rules**
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 6443/tcp  # K3s API
sudo ufw enable
```

2. **SSL Certificates**
```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

3. **Regular Updates**
```bash
sudo apt update && sudo apt upgrade -y
```

## Performance Tuning

### PostgreSQL
```bash
# Edit postgresql.conf
shared_buffers = 8GB
effective_cache_size = 24GB
max_connections = 200
```

### Redis
```bash
# Edit redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru
```

## Next Steps

1. Run ubuntu-setup.sh
2. Deploy microservices
3. Configure monitoring
4. Set up backups
5. Test everything
6. Go live or migrate to AWS

See docker-compose/docker-compose.ubuntu.yml for local development setup.
