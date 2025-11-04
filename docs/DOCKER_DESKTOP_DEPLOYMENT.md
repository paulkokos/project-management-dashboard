# Docker Desktop Kubernetes Deployment Guide

This guide walks you through deploying the Project Management Dashboard on Docker Desktop's built-in Kubernetes cluster.

---

## Prerequisites

- **Docker Desktop** installed with Kubernetes enabled
- **Helm 3** installed (`brew install helm` on macOS)
- **kubectl** installed (comes with Docker Desktop)
- Project cloned locally

---

## Step 1: Enable Kubernetes in Docker Desktop

1. Open **Docker Desktop**
2. Go to **Settings → Kubernetes**
3. Check **"Enable Kubernetes"**
4. Click **"Apply & Restart"**
5. Wait 2-5 minutes for initialization

**Verify:**
```bash
kubectl cluster-info
```

Expected output:
```
Kubernetes control plane is running at https://kubernetes.docker.internal:6443
```

---

## Step 2: Install Required Components

### 2.1 Install Helm (if not already installed)

```bash
# macOS
brew install helm

# Windows
choco install kubernetes-helm

# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

**Verify Helm:**
```bash
helm version
```

### 2.2 Install Nginx Ingress Controller

```bash
# Add Helm repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install Nginx Ingress
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.metrics.enabled=true \
  --wait

# Verify installation (wait for READY status)
kubectl get pods -n ingress-nginx -w
```

**Wait for output like:**
```
NAME                                        READY   STATUS    RESTARTS   AGE
nginx-ingress-ingress-nginx-controller-xxx  1/1     Running   0          1m
```

Press Ctrl+C to exit watch mode.

### 2.3 Install cert-manager (for SSL/TLS)

```bash
# Add Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true \
  --wait

# Verify installation
kubectl get pods -n cert-manager -w
```

**Wait for output like:**
```
NAME                                      READY   STATUS    RESTARTS   AGE
cert-manager-xxx                          1/1     Running   0          1m
cert-manager-webhook-xxx                  1/1     Running   0          1m
cert-manager-cainjector-xxx               1/1     Running   0          1m
```

Press Ctrl+C to exit watch mode.

**Verify all components are ready:**
```bash
kubectl get ingressclass
# Should show: nginx   nginx.org/ingress-class   True
```

---

## Step 3: Create Application Namespace and Secrets

```bash
# Create namespace
kubectl create namespace project-dashboard

# Create Docker registry secret (if using private registry)
# Skip if using public Docker Hub
kubectl create secret docker-registry regcred \
  --docker-server=docker.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_PASSWORD \
  --docker-email=your@email.com \
  -n project-dashboard

# Create application secrets
kubectl create secret generic app-secrets \
  --from-literal=SECRET_KEY=$(openssl rand -hex 32) \
  --from-literal=DB_PASSWORD=postgres_secure_password_123 \
  -n project-dashboard

# Verify secrets
kubectl get secrets -n project-dashboard
```

---

## Step 4: Build and Load Docker Images

Navigate to project root directory:

```bash
cd /path/to/project-management-dashboard

# Build backend image
docker build \
  -f deployment/docker/Dockerfile.backend \
  -t project-dashboard-backend:latest \
  .

# Build frontend image
docker build \
  -f deployment/docker/Dockerfile.frontend \
  -t project-dashboard-frontend:latest \
  .

# Verify images were built
docker images | grep project-dashboard
```

**Note:** Images are already in Docker Desktop's local registry, no need to push to Docker Hub.

---

## Step 5: Deploy Application to Kubernetes

### 5.1 Apply Configuration and Secrets

```bash
# Apply ConfigMap
kubectl apply -f deployment/k8s/configmap.yaml

# Apply Secrets (update values as needed)
kubectl apply -f deployment/k8s/secret.yaml

# Verify
kubectl get configmap -n project-dashboard
kubectl get secrets -n project-dashboard
```

### 5.2 Deploy Infrastructure Services

```bash
# Deploy PostgreSQL
kubectl apply -f deployment/k8s/postgres.yaml

# Deploy Redis
kubectl apply -f deployment/k8s/redis.yaml

# Wait for services to be ready
kubectl get pods -n project-dashboard -w
```

**Wait for:**
```
NAME                          READY   STATUS    RESTARTS   AGE
postgres-0                    1/1     Running   0          2m
redis-0                       1/1     Running   0          2m
```

Press Ctrl+C to exit watch mode.

### 5.3 Deploy Backend

```bash
# Apply backend deployment
kubectl apply -f deployment/k8s/backend.yaml

# Check rollout status
kubectl rollout status deployment/backend -n project-dashboard -w
```

**Expected output:**
```
deployment "backend" successfully rolled out
```

### 5.4 Deploy Frontend

```bash
# Apply frontend deployment
kubectl apply -f deployment/k8s/frontend.yaml

# Check rollout status
kubectl rollout status deployment/frontend -n project-dashboard -w
```

### 5.5 Deploy Ingress

```bash
# Apply Ingress rules
kubectl apply -f deployment/k8s/ingress.yaml

# Verify Ingress created
kubectl get ingress -n project-dashboard
```

---

## Step 6: Access the Application

### Option 1: Using Localhost

Since Docker Desktop's Ingress uses LoadBalancer with localhost:

```bash
# Get Ingress IP/hostname
kubectl get ingress -n project-dashboard

# Access via localhost
Frontend: http://localhost:80
Backend:  http://localhost:8000/api
Admin:    http://localhost:8000/admin
```

### Option 2: Using Hostnames (requires /etc/hosts modification)

Edit `/etc/hosts` (or `C:\Windows\System32\drivers\etc\hosts` on Windows):

```
127.0.0.1 localhost example.com api.example.com
```

Then access:
```
Frontend: http://example.com
Backend:  http://api.example.com
Admin:    http://api.example.com/admin
```

### Option 3: Port Forwarding

```bash
# Port forward frontend
kubectl port-forward -n project-dashboard svc/frontend 3000:80 &

# Port forward backend
kubectl port-forward -n project-dashboard svc/backend 8000:8000 &

# Access
Frontend: http://localhost:3000
Backend:  http://localhost:8000/api
```

---

## Step 7: Verify Deployment

### Check all services are running

```bash
# View all pods
kubectl get pods -n project-dashboard

# Expected output:
# NAME                        READY   STATUS    RESTARTS   AGE
# backend-xxx                 1/1     Running   0          3m
# frontend-xxx                1/1     Running   0          2m
# postgres-0                  1/1     Running   0          5m
# redis-0                     1/1     Running   0          5m
```

### Check pod logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n project-dashboard

# Frontend logs
kubectl logs -f deployment/frontend -n project-dashboard

# Database logs
kubectl logs -f statefulset/postgres -n project-dashboard
```

### Test API health

```bash
# From inside cluster
kubectl exec -it deployment/backend -n project-dashboard -- bash
curl http://localhost:8000/api/health/

# From host machine
curl http://localhost:8000/api/health/
```

### Check Ingress status

```bash
# Describe ingress
kubectl describe ingress app-ingress -n project-dashboard

# Get ingress events
kubectl get events -n project-dashboard --sort-by='.lastTimestamp'
```

---

## Step 8: Initialize Database (First Time Only)

```bash
# Run migrations
kubectl exec -it deployment/backend -n project-dashboard -- \
  python manage.py migrate

# Create superuser
kubectl exec -it deployment/backend -n project-dashboard -- \
  python manage.py createsuperuser

# Seed demo data
kubectl exec -it deployment/backend -n project-dashboard -- \
  python manage.py seed_database
```

---

## Monitoring & Debugging

### View resource usage

```bash
# CPU and memory usage
kubectl top nodes
kubectl top pods -n project-dashboard
```

### Watch deployment status

```bash
# Real-time pod updates
kubectl get pods -n project-dashboard -w

# Detailed pod info
kubectl describe pod <pod-name> -n project-dashboard
```

### Access pod shell

```bash
# Backend shell
kubectl exec -it deployment/backend -n project-dashboard -- bash

# Frontend shell
kubectl exec -it deployment/frontend -n project-dashboard -- sh

# Database shell
kubectl exec -it statefulset/postgres -n project-dashboard -- \
  psql -U postgres -d project_management_db
```

### View Ingress Controller logs

```bash
kubectl logs -f -n ingress-nginx deployment/nginx-ingress-ingress-nginx-controller
```

---

## Cleanup & Uninstall

### Remove Application

```bash
# Delete namespace (removes all resources in it)
kubectl delete namespace project-dashboard

# Or delete individual resources
kubectl delete -f deployment/k8s/
```

### Uninstall Ingress Controller

```bash
helm uninstall nginx-ingress -n ingress-nginx
kubectl delete namespace ingress-nginx
```

### Uninstall cert-manager

```bash
helm uninstall cert-manager -n cert-manager
kubectl delete namespace cert-manager
```

### Disable Kubernetes in Docker Desktop

1. Open Docker Desktop
2. Settings → Kubernetes
3. Uncheck "Enable Kubernetes"
4. Click "Apply & Restart"

---

## Troubleshooting

### Pods stuck in "Pending"

```bash
# Check pod events
kubectl describe pod <pod-name> -n project-dashboard

# Common causes:
# - Insufficient resources
# - Image not found
# - ConfigMap/Secret missing
```

### Ingress not routing traffic

```bash
# Check Ingress status
kubectl get ingress -n project-dashboard -o yaml

# Check Ingress Controller logs
kubectl logs -f -n ingress-nginx deployment/nginx-ingress-ingress-nginx-controller

# Verify services exist
kubectl get svc -n project-dashboard
```

### Database connection errors

```bash
# Check PostgreSQL pod
kubectl get pod -n project-dashboard -l app=postgres

# Check logs
kubectl logs -f statefulset/postgres -n project-dashboard

# Test connection
kubectl exec -it statefulset/postgres -n project-dashboard -- \
  psql -U postgres -c "SELECT version();"
```

### Frontend/Backend connection issues

```bash
# Test from frontend pod
kubectl exec -it deployment/frontend -n project-dashboard -- \
  wget -O- http://backend:8000/api/health/

# Check CORS configuration
# Verify ALLOWED_HOSTS in backend ConfigMap
kubectl get configmap app-config -n project-dashboard -o yaml
```

### Out of disk space

```bash
# Check disk usage
df -h

# Clean up Docker resources
docker system prune
docker image prune
docker volume prune
```

---

## Performance Tuning

### Increase resource limits

Edit `deployment/k8s/backend.yaml` and `deployment/k8s/frontend.yaml`:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### Enable HPA (Horizontal Pod Autoscaling)

```bash
# Apply HPA manifests if available
kubectl apply -f deployment/k8s/hpa.yaml

# Check HPA status
kubectl get hpa -n project-dashboard
```

### Scale services manually

```bash
# Scale backend to 3 replicas
kubectl scale deployment backend --replicas=3 -n project-dashboard

# Scale frontend to 2 replicas
kubectl scale deployment frontend --replicas=2 -n project-dashboard
```

---

## Next Steps

1. **Set up SSL/TLS**: Update Ingress with real domain and Let's Encrypt certificates
2. **Configure monitoring**: Install Prometheus and Grafana
3. **Set up backups**: Configure automated database backups
4. **CI/CD integration**: Connect GitHub Actions to auto-deploy on push
5. **Load testing**: Test performance with tools like Apache Bench or k6

---

## References

- [Docker Desktop Kubernetes Documentation](https://docs.docker.com/desktop/kubernetes/)
- [Kubernetes Official Documentation](https://kubernetes.io/docs/)
- [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
