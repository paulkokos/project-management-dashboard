# Ubuntu/K3s Kubernetes Manifests

Kubernetes manifests for deploying to Ubuntu servers using K3s (lightweight Kubernetes).

## Purpose

Deploy the Project Management Dashboard to:
- Single Ubuntu server (development/testing)
- Ubuntu server cluster (production on-premise)
- VPS providers (DigitalOcean, Hetzner, etc.)

## Why K3s?

K3s is perfect for Ubuntu deployments because:
- ✅ 50% less memory usage than full Kubernetes
- ✅ Single binary installation
- ✅ Perfect for edge/IoT/development
- ✅ 100% compatible with standard Kubernetes
- ✅ Easy migration to EKS later

## What Will Go Here

When implemented, this directory will contain:

### Core Infrastructure
- `namespace.yaml` - Project namespace
- `configmap.yaml` - Configuration values
- `secrets.yaml` - Sensitive data (passwords, keys)
- `storage-class.yaml` - Local storage configuration

### Microservices
Each service will have:
- `<service>/deployment.yaml` - Pod specification
- `<service>/service.yaml` - Service networking
- `<service>/hpa.yaml` - Auto-scaling (optional)

### Networking
- `ingress.yaml` - Nginx Ingress rules
- `network-policy.yaml` - Network security

### Monitoring
- `prometheus/` - Metrics collection
- `grafana/` - Dashboards

## Example Structure

```
ubuntu/
├── namespace.yaml
├── configmap.yaml
├── secrets.yaml
│
├── database/
│   ├── postgresql-deployment.yaml
│   ├── postgresql-service.yaml
│   └── postgresql-pvc.yaml
│
├── cache/
│   ├── redis-deployment.yaml
│   └── redis-service.yaml
│
├── auth-service/
│   ├── deployment.yaml
│   └── service.yaml
│
├── project-service/
│   ├── deployment.yaml
│   └── service.yaml
│
├── frontend/
│   ├── deployment.yaml
│   └── service.yaml
│
└── ingress.yaml
```

## Deployment Process

When ready to deploy:

```bash
# 1. Install K3s
curl -sfL https://get.k3s.io | sh -

# 2. Create namespace
kubectl apply -f namespace.yaml

# 3. Create secrets
kubectl apply -f secrets.yaml

# 4. Deploy services
kubectl apply -f database/
kubectl apply -f cache/
kubectl apply -f auth-service/
kubectl apply -f project-service/
kubectl apply -f frontend/

# 5. Setup ingress
kubectl apply -f ingress.yaml

# 6. Verify
kubectl get pods -n project-dashboard
```

## Server Requirements

**Minimum:**
- Ubuntu 22.04 LTS
- 16 GB RAM
- 8 CPU cores
- 200 GB SSD

**Recommended:**
- Ubuntu 22.04 LTS
- 32 GB RAM
- 16 CPU cores
- 500 GB SSD

## Current Status

**Status:** Empty - Manifests not yet created

**Create these when:**
- You need to deploy to Ubuntu server
- Docker Compose is not sufficient
- You want production-like environment
- Client requires on-premise deployment

---

**Last Updated:** 2025-11-02
**Status:** Placeholder - Awaiting implementation
