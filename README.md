# Project Management Dashboard

A comprehensive full-stack project management application with real-time updates, advanced filtering, and modern infrastructure.

## Project Overview

This project implements a complete project management system with the following features:

### Task 1A: Web Application
- **Frontend**: React-based SPA with responsive design
- **Backend**: Django REST API with Python
- **Features**:
  - Project CRUD with pagination, sorting, and filtering
  - Soft delete with recovery
  - Real-time updates via WebSocket
  - Free-text search with full-text indexing
  - Bulk operations with optimistic concurrency
  - Project detail views with team roster and milestones
  - Activity tracking and events

### Task 1B: Deployment
- Nginx-based deployment configuration
- SSL/TLS support
- Load balancing ready

### Task 2: CI/CD Pipeline
- GitHub Actions for version control and automation
- Jenkins integration ready
- Automated testing and deployment

### Task 3A: Containerization
- Docker & Docker Compose setup
- Kubernetes manifests (K8s)
- Container registry ready

### Task 3B: Package Publishing
- Frontend components packaged for NPM
- Backend utilities packaged for PIP

## Project Structure

```
.
├── backend/                 # Django REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/              # Django settings
│   ├── projects/            # Projects app (models, views, serializers)
│   ├── core/                # Core utilities
│   ├── websocket_service/   # Real-time updates
│   └── tests/
├── frontend/                # React SPA
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── deployment/
│   ├── docker/              # Docker configurations
│   ├── nginx/               # Nginx configurations
│   └── k8s/                 # Kubernetes manifests
├── ci-cd/
│   ├── github/              # GitHub Actions workflows
│   └── jenkins/             # Jenkins pipeline
├── packages/
│   ├── frontend/            # NPM-ready components
│   └── backend/             # PIP-ready utilities
├── docs/                    # Documentation
├── docker-compose.yml       # Local development setup
└── README.md
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 22+
- npm 10.0.0+ (compatible with CI/CD environments)
- Docker 28.5.1+
- Docker Compose 2.33.1+
- (Optional) Kubernetes cluster or kind

### Local Development

#### Option 1: Docker Compose (Recommended)
```bash
# Development environment with hot reload
docker-compose -f docker-compose.dev.yml up

# Access:
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/api/docs/
```

#### Option 2: Manual Setup
1. Clone the repository and navigate to the project:
```bash
cd project-management-dashboard
```

2. Set up backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

3. Set up frontend (new terminal):
```bash
cd frontend
npm install
npm run dev
```

#### Option 3: Production Docker Build
```bash
docker-compose up --build
```

#### Option 4: Kubernetes Deployment on Docker Desktop
```bash
# Docker Desktop Kubernetes must be enabled
# See docs/DOCKER_DESKTOP_DEPLOYMENT.md for complete setup

# 1. Install Helm and add repos
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add jetstack https://charts.jetstack.io
helm repo update

# 2. Install Nginx Ingress Controller
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.type=LoadBalancer --wait

# 3. Install cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true --wait

# 4. Build Docker images
docker build -f deployment/docker/Dockerfile.backend -t project-dashboard-backend:latest .
docker build -f deployment/docker/Dockerfile.frontend -t project-dashboard-frontend:latest .

# 5. Create namespace and deploy
kubectl create namespace project-dashboard
kubectl apply -f deployment/k8s/configmap.yaml
kubectl apply -f deployment/k8s/secret.yaml
kubectl apply -f deployment/k8s/postgres.yaml
kubectl apply -f deployment/k8s/redis.yaml
kubectl apply -f deployment/k8s/backend.yaml
kubectl apply -f deployment/k8s/frontend.yaml
kubectl apply -f deployment/k8s/ingress.yaml

# 6. Verify deployment
kubectl get pods -n project-dashboard -w

# Access application
# Frontend: http://localhost
# Backend:  http://localhost/api
# Admin:    http://localhost/admin
```

**For detailed deployment instructions, see [docs/DOCKER_DESKTOP_DEPLOYMENT.md](docs/DOCKER_DESKTOP_DEPLOYMENT.md)**

## Technology Stack

### Backend
- **Django 5.1.3**: Web framework
- **Django REST Framework 3.14.0**: API framework
- **PostgreSQL 15-alpine**: Primary database
- **Celery 5.4.0**: Async task queue
- **Django Channels 4.1.0**: WebSocket support
- **Daphne 4.1.2**: ASGI server
- **Python 3.11**: Runtime

### Frontend
- **React 19.0.0**: UI framework with latest JSX transform
- **TypeScript 5.7.2**: Type safety
- **Vite 7.1.0+**: Build tool and dev server
- **Axios 1.7.7**: HTTP client with interceptor support
- **React Query 5.55.0**: Data fetching and caching
- **Zustand 5.0.1**: State management
- **Tailwind CSS 4.0.1**: Styling framework
- **Native WebSocket API**: Real-time updates (no Socket.IO framework)
- **Node.js 22+**: Runtime (LTS)
- **npm 10.0.0+**: Package manager

### Code Quality
- **ESLint 9.16.0**: JavaScript linting
- **TypeScript ESLint 8.16.0**: TypeScript linting
- **Prettier 3.3.3**: Code formatting
- **Pytest 8.0.2**: Python testing
- **Vitest 4.0.1**: Frontend testing

### DevOps
- **Docker 28.5.1**: Containerization
- **Docker Compose 3.9**: Local orchestration
- **Kubernetes (kind)**: Container orchestration
- **Redis 7-alpine**: Caching and message broker
- **PostgreSQL 15-alpine**: Full-text search capability
- **GitHub Actions**: CI/CD
- **Jenkins**: Alternative CI/CD

## Features Documentation

### 1. Project Management
- Full CRUD operations
- Pagination, sorting, filtering
- Soft delete with recovery
- Status tracking (Active, Archived, On Hold, Completed)
- Health indicators (Healthy, At Risk, Critical)

### 2. Advanced Search
- Full-text search across project titles, descriptions, and tags using Elasticsearch
- Elasticsearch integration via django-haystack for production-grade search
- Faceted search with filtering by status, health, and owner
- Real-time search suggestions and autocomplete
- Search results pagination and relevance-based ranking

### 3. Real-Time Updates
- WebSocket connection management
- Incremental updates to all connected clients
- Activity event streaming
- Progress updates

### 4. Bulk Operations
- Atomic status/tag updates
- Optimistic concurrency control (ETags)
- Transactional consistency

### 5. Team & Milestones
- Team roster with roles and capacity
- Milestone tracking with progress calculations
- Activity history

## Documentation

### Project Overview
- **[IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md)** - Complete implementation status and feature coverage
- **[PROJECT_CARD_REQUIREMENTS.md](docs/PROJECT_CARD_REQUIREMENTS.md)** - Project card requirements analysis

### Getting Started
- **[SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** - Complete setup instructions for local and Docker environments
- **[DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)** - Backend and frontend development workflows

### Deployment
- **[DOCKER_DESKTOP_DEPLOYMENT.md](docs/DOCKER_DESKTOP_DEPLOYMENT.md)** - Complete K8s deployment guide for Docker Desktop
- **[DEPLOYMENT_STATUS.md](docs/DEPLOYMENT_STATUS.md)** - Current deployment status and next steps
- **[INFRASTRUCTURE_SUMMARY.md](docs/INFRASTRUCTURE_SUMMARY.md)** - Infrastructure and deployment overview

### Features & API
- **[SEARCH_GUIDE.md](docs/SEARCH_GUIDE.md)** - Elasticsearch full-text search implementation and API
- **[FRONTEND_SEARCH_GUIDE.md](docs/FRONTEND_SEARCH_GUIDE.md)** - Frontend search UI components and implementation
- **[SEARCH_IMPLEMENTATION_SUMMARY.md](docs/SEARCH_IMPLEMENTATION_SUMMARY.md)** - Complete search feature overview

### Packages & Reusable Components
- **[PACKAGES.md](docs/PACKAGES.md)** - Complete guide to NPM and PyPI packages
  - **@paulkokos/search-components** - React search UI components (NPM)
  - **@paulkokos/ui-components** - Dashboard UI components (NPM)
  - **project-management-search-utils** - Django search utilities (PyPI)

### Testing & Code
- **[TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** - Test suite documentation (300+ tests)
- **[TEST_EXECUTION_GUIDE.md](docs/TEST_EXECUTION_GUIDE.md)** - Quick reference for running tests
- **[CODE_DOCUMENTATION.md](docs/CODE_DOCUMENTATION.md)** - Deep code architecture and design

## Environment Setup

See `.env.example` files in backend and frontend directories for configuration options.

## Deployment

### Development
```bash
# With hot reload for frontend and backend
docker-compose -f docker-compose.dev.yml up

# Accessible at:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:8000
# - API Docs: http://localhost:8000/api/docs/
```

### Production
```bash
# Production build with optimizations
docker-compose up --build

# Accessible at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8000
# - API Docs: http://localhost:8000/api/docs/
```

**Note**: See `deployment/` directory for detailed production configurations including:
- Nginx reverse proxy setup
- SSL/TLS configuration
- Kubernetes manifests
- Load balancing setup

## API Documentation

API documentation available at `/api/docs/` when backend is running.

## Contributing

1. Create feature branches
2. Follow code style guidelines
3. Add tests for new features
4. Update documentation

## Corners Cut & Production Considerations

See `docs/CORNERS_CUT.md` for details on what was simplified for this MVP and what would be enhanced for production.

## License

MIT
