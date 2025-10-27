# Project Management Dashboard - Setup Guide

## Prerequisites

- Docker 28.5.1+
- Docker Compose 2.33.1+ (or docker-compose 3.9+)
- Node.js 22+ (LTS)
- npm 10.0.0+ (CI/CD compatible, local 11.x also works)
- Python 3.11+
- PostgreSQL 15+ (if running locally without Docker)
- Redis 7+ (if running locally without Docker)
- Git
- (Optional) kubectl & kind for Kubernetes

## Local Development Setup

### 1. Clone & Initialize

```bash
git clone <repository-url>
cd project-management-dashboard
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Using Docker Compose (Recommended)

#### Development Mode (with hot reload)

```bash
# Start all services with development settings
docker-compose -f docker-compose.dev.yml up

# Run migrations (in another terminal if needed)
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Create superuser
docker-compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser

# Access the application:
# Frontend (hot reload): http://localhost:5173
# Backend API: http://localhost:8000/api
# API Docs: http://localhost:8000/api/docs/
# Django Admin: http://localhost:8000/admin
```

#### Production Mode (optimized build)

```bash
# Start all services with production settings
docker-compose up --build

# Access the application:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api
# API Docs: http://localhost:8000/api/docs/
# Django Admin: http://localhost:8000/admin
```

### 3. Manual Setup

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file with your settings
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Production Deployment

### Docker Build

```bash
docker build -f deployment/docker/Dockerfile.backend -t project-dashboard-backend:latest .
docker build -f deployment/docker/Dockerfile.frontend -t project-dashboard-frontend:latest .
```

### Kubernetes Deployment (Local with kind)

```bash
# Install kind (if not already installed)
curl -Lo /tmp/kind https://kind.sigs.k8s.io/dl/v0.23.0/kind-linux-amd64
chmod +x /tmp/kind

# Create kind cluster
/tmp/kind create cluster --name project-dashboard

# Build Docker images
docker build -f deployment/docker/Dockerfile.backend -t paulkokos/project-dashboard-backend:latest .
docker build -f deployment/docker/Dockerfile.frontend -t paulkokos/project-dashboard-frontend:latest .

# Load images into kind cluster
/tmp/kind load docker-image paulkokos/project-dashboard-backend:latest --name project-dashboard
/tmp/kind load docker-image paulkokos/project-dashboard-frontend:latest --name project-dashboard

# Create namespace
kubectl apply -f deployment/k8s/namespace.yaml

# Deploy configuration
kubectl apply -f deployment/k8s/configmap.yaml
kubectl apply -f deployment/k8s/secret.yaml

# Deploy infrastructure services
kubectl apply -f deployment/k8s/postgres.yaml
kubectl apply -f deployment/k8s/redis.yaml

# Deploy application
kubectl apply -f deployment/k8s/backend.yaml
kubectl apply -f deployment/k8s/frontend.yaml

# Check status
kubectl get pods -n project-dashboard
kubectl get svc -n project-dashboard

# Port forward to access services
kubectl port-forward -n project-dashboard svc/backend 8000:8000
kubectl port-forward -n project-dashboard svc/frontend 3000:3000
```

Access the application:
- Frontend: http://localhost:3000
- API: http://localhost:8000/api
- Admin: http://localhost:8000/admin

### Kubernetes Deployment (Production)

For production Kubernetes clusters (EKS, GKE, AKS):

```bash
# Update image registry in deployment/k8s/backend.yaml and frontend.yaml
# Update ALLOWED_HOSTS and CORS_ALLOWED_ORIGINS in configmap.yaml
# Update secrets in secret.yaml

# Apply manifests
kubectl apply -f deployment/k8s/namespace.yaml
kubectl apply -f deployment/k8s/configmap.yaml
kubectl apply -f deployment/k8s/secret.yaml
kubectl apply -f deployment/k8s/postgres.yaml
kubectl apply -f deployment/k8s/redis.yaml
kubectl apply -f deployment/k8s/backend.yaml
kubectl apply -f deployment/k8s/frontend.yaml
kubectl apply -f deployment/k8s/ingress.yaml
```

## Environment Variables

### Backend (.env)

For local development:
```
DEBUG=True
SECRET_KEY=django-insecure-change-me-in-production
ALLOWED_HOSTS=localhost,127.0.0.1,backend
DB_ENGINE=django.db.backends.postgresql
DB_NAME=project_management_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
REDIS_CACHE_URL=redis://redis:6379/1
CELERY_BROKER_URL=redis://redis:6379/0
ELASTICSEARCH_URL=http://elasticsearch:9200
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
PAGINATION_PAGE_SIZE=20
```

For production:
```
DEBUG=False
SECRET_KEY=<generate-secure-key>
ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com
DB_ENGINE=django.db.backends.postgresql
DB_NAME=<production-db-name>
DB_USER=<production-user>
DB_PASSWORD=<secure-password>
DB_HOST=<production-db-host>
DB_PORT=5432
REDIS_URL=<production-redis-url>
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
```

### Frontend (.env)

For local development:
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=http://localhost:8000
VITE_APP_NAME=Project Management Dashboard
```

For production:
```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=https://yourdomain.com
VITE_APP_NAME=Project Management Dashboard
```

## Database Migration

```bash
# Create new migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Rollback migration
python manage.py migrate projects 0001
```

## API Documentation

- **Swagger UI**: http://localhost:8000/api/docs/
- **API Routes**:
  - `GET/POST /api/projects/` - List/Create projects
  - `GET/PUT/DELETE /api/projects/{id}/` - Project detail operations
  - `GET /api/projects/{id}/activities/` - Project activities
  - `GET /api/tags/` - List tags
  - `POST /api/bulk/update_status/` - Bulk status update

## WebSocket Connection

```javascript
import io from 'socket.io-client'

const socket = io('ws://localhost:8000', {
  auth: { token: 'your-jwt-token' }
})

// Subscribe to project updates
socket.emit('subscribe', { project_id: 1 })

// Listen for updates
socket.on('project_update', (data) => {
  console.log('Project updated:', data)
})
```

## Package Publishing

### NPM Package

```bash
cd packages/frontend
npm run build
npm publish
```

### PIP Package

```bash
cd packages/backend
python setup.py sdist bdist_wheel
twine upload dist/*
```

## CI/CD

### GitHub Actions

Workflows are configured in `.github/workflows/`:
- `backend-test.yml` - Backend tests
- `frontend-test.yml` - Frontend tests
- `docker-build.yml` - Docker image build & push

### Jenkins

Configure Jenkins with the `ci-cd/jenkins/Jenkinsfile`

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port
lsof -i :8000
kill -9 <PID>
```

### Database Connection Error

```bash
# Check PostgreSQL connection
psql -U postgres -h localhost -d project_management_db

# Reset migrations
python manage.py migrate projects zero
```

### Redis Connection Error

```bash
# Test Redis connection
redis-cli ping
```

### WebSocket Issues

- Check Nginx is configured for WebSocket upgrade
- Verify Redis connection
- Check browser console for connection errors

## Performance Optimization

### Database

- Enable query optimization
- Add database indexes
- Use select_related/prefetch_related for foreign keys

### Caching

- Redis caching enabled by default
- Configure cache TTL in settings
- Use @cache_page decorator for views

### Frontend

- Enable gzip compression in Nginx
- Implement code splitting
- Use React Query for efficient data fetching

## Security

### Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Generate secure `SECRET_KEY`
- [ ] Configure allowed hosts
- [ ] Enable HTTPS
- [ ] Set strong database passwords
- [ ] Configure CORS properly
- [ ] Enable CSRF protection
- [ ] Set up security headers
- [ ] Configure firewall rules

## Monitoring & Logging

### Logs

```bash
# Docker Compose
docker-compose logs -f backend
docker-compose logs -f frontend

# Kubernetes
kubectl -n project-dashboard logs -f deployment/backend
```

### Health Checks

```bash
curl http://localhost/health
curl http://localhost:8000/api/health/
```

## Support & Issues

For issues or questions:
1. Check the documentation
2. Review GitHub Issues
3. Create a new issue with:
   - Environment details
   - Steps to reproduce
   - Error messages
