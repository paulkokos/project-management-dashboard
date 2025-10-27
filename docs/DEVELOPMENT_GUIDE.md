# Development Guide

## Project Structure Overview

```
project-management-dashboard/
├── backend/                      # Django REST API
│   ├── config/                  # Settings and URLs
│   ├── projects/                # Main app (models, views, tests)
│   ├── core/                    # Shared utilities
│   ├── websocket_service/       # WebSocket handling
│   ├── manage.py
│   └── requirements.txt
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API and WebSocket services
│   │   ├── stores/              # Zustand stores
│   │   ├── types/               # TypeScript types
│   │   └── styles/              # Global styles
│   └── package.json
├── deployment/                   # Deployment configs
├── docs/                        # Documentation
└── packages/                    # NPM/PIP packages
```

## Backend Development

### Technology Stack
- **Django 5.1.3**: Modern web framework
- **Django REST Framework 3.14.0**: REST API toolkit
- **PostgreSQL 15**: Database
- **Redis 7**: Cache and message broker
- **Celery 5.4.0**: Async task queue
- **Daphne 4.1.2**: ASGI server for WebSocket
- **Django Channels 4.1.0**: WebSocket support
- **Python 3.11**: Runtime

### Setting Up

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Seed database (optional)
python manage.py seed_database
```

### Database

#### Migrations
```bash
# Create a new migration
python manage.py makemigrations projects

# Apply migrations
python manage.py migrate

# Rollback to specific migration
python manage.py migrate projects 0001
```

#### Seed Data
```bash
# Create test data
python manage.py seed_database

# Clear and reseed
python manage.py seed_database --clear
```

### Running the Server

```bash
# Development (without WebSocket)
python manage.py runserver

# Development with WebSocket (using Daphne ASGI server)
pip install daphne
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# Using Docker
docker-compose up backend
```

### Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=projects --cov=core

# Run specific test file
pytest projects/tests/test_models.py

# Run specific test
pytest projects/tests/test_models.py::TestProjectModel::test_create_project

# Run with verbose output
pytest -v

# Run in watch mode
ptw
```

### Management Commands

```bash
# Seed database
python manage.py seed_database

# Generate reports
python manage.py generate_report --format=json
python manage.py generate_report --format=text
```

## Frontend Development

### Technology Stack
- **React 19.0.0**: UI library with JSX transform
- **TypeScript 5.7.2**: Type safety
- **Vite 7.1.0+**: Fast build tool and dev server
- **Tailwind CSS 4.0.1**: Utility-first CSS
- **React Router 7.9.4**: Client-side routing
- **Zustand 5.0.1**: State management
- **React Query 5.55.0**: Server state management
- **Axios 1.7.7**: HTTP client with interceptors
- **Socket.IO 4.8.1**: WebSocket client
- **Node.js 22+**: Runtime (LTS)
- **npm 10.0.0+**: Package manager (CI/CD compatible)

### Code Quality
- **ESLint 9.16.0**: JavaScript linting
- **TypeScript ESLint 8.16.0**: TypeScript linting
- **Prettier 3.3.3**: Code formatter
- **Vitest 4.0.1**: Unit testing
- **@testing-library/react 16.0.1**: Component testing

### Setting Up

```bash
cd frontend
npm install

# Verify Node version (should be 22+)
node --version  # v22.x.x or higher

# Verify npm version (should be 10.0.0+)
npm --version   # 10.x.x or higher (compatible with CI/CD)
```

**Note**: npm 10.x is compatible with GitHub Actions CI/CD. If you have npm 11.x locally, it still works fine, but CI/CD runners use npm 10.x.

### Development Server

```bash
npm run dev
# Open http://localhost:5173 or http://localhost:3000 (depending on Vite config)

# Using Docker
docker-compose up frontend

# Vite HMR (Hot Module Replacement) enabled by default
```

### Building

```bash
# Build for production (Vite handles TypeScript)
npm run build
# Output: frontend/dist/
# Note: Removed tsc check from build script for faster builds

# Preview production build locally
npm run preview
# Open http://localhost:4173

# Clean build (remove dist and rebuild)
rm -rf dist && npm run build
```

**Build Optimization Notes**:
- TypeScript compilation is handled by Vite (faster than separate tsc)
- Test files are excluded from build with `tsconfig.json` configuration
- Config files (postcss.config.js, tailwind.config.js) use ES modules for compatibility
- Production build optimizations: minification, tree-shaking, code splitting

### Code Quality

```bash
# Lint with ESLint (includes TypeScript)
npm run lint
# Includes: @typescript-eslint/eslint-plugin, eslint-plugin-react, eslint-plugin-react-hooks

# Format code with Prettier
npm run format

# Run tests with Vitest
npm run test
# Watch mode, includes code coverage

# Run tests with UI
npm run test:ui
# Open interactive test UI at http://localhost:51204

# Type check (if separate from build)
npm run type-check  # Depends on tsconfig setup
```

## Creating New Features

### Backend: Adding a New Model

1. **Create the model** in `projects/models.py`:
```python
class MyModel(BaseModel):
    """My model"""
    title = models.CharField(max_length=255)
    # ... other fields
```

2. **Create migration**:
```bash
python manage.py makemigrations
python manage.py migrate
```

3. **Create serializer** in `projects/serializers.py`:
```python
class MyModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyModel
        fields = ['id', 'title', ...]
```

4. **Create viewset** in `projects/views.py`:
```python
class MyModelViewSet(viewsets.ModelViewSet):
    queryset = MyModel.objects.all()
    serializer_class = MyModelSerializer
```

5. **Register in URLs** `projects/urls.py`:
```python
router.register(r'mymodels', MyModelViewSet)
```

6. **Add tests** in `projects/tests/`:
```python
class TestMyModel:
    def test_create(self):
        # Test your model
```

### Frontend: Adding a New Page

1. **Create page component** in `src/pages/MyPage.tsx`:
```tsx
export default function MyPage() {
  return <div>My Page</div>
}
```

2. **Add route** in `src/App.tsx`:
```tsx
<Route path="/my-page" element={<MyPage />} />
```

3. **Add link** in navigation component

4. **Create tests** in `src/pages/__tests__/MyPage.test.tsx`

## API Endpoints Reference

### Projects
- `GET /api/projects/` - List projects (paginated, filterable)
- `POST /api/projects/` - Create project
- `GET /api/projects/{id}/` - Get project detail
- `PUT/PATCH /api/projects/{id}/` - Update project
- `DELETE /api/projects/{id}/` - Delete project (hard delete)
- `POST /api/projects/{id}/soft_delete/` - Soft delete
- `POST /api/projects/{id}/restore/` - Restore soft-deleted
- `GET /api/projects/{id}/activities/` - Get activities

### Tags
- `GET /api/tags/` - List tags
- `POST /api/tags/` - Create tag
- `GET/PUT/DELETE /api/tags/{id}/` - CRUD operations

### Bulk Operations
- `POST /api/bulk/update_status/` - Bulk update status
- `POST /api/bulk/update_tags/` - Bulk update tags

### WebSocket
- `ws://localhost:8000/ws/projects/{project_id}/` - Project updates
- `ws://localhost:8000/ws/notifications/` - Notifications

## Common Tasks

### Run Backend Tests
```bash
cd backend
pytest projects/tests/ -v
```

### Generate Sample Data
```bash
python manage.py seed_database --clear
```

### Create Admin User
```bash
python manage.py createsuperuser
# Access at http://localhost:8000/admin
```

### Check Project Health
```bash
# Get statistics
python manage.py generate_report --format=json
```

### Database Query Optimization
```bash
# Use select_related for foreign keys
queryset = Model.objects.select_related('foreign_key')

# Use prefetch_related for reverse relationships
queryset = Model.objects.prefetch_related('many_to_many')
```

## Code Style Guidelines

### Python (Backend)
- Follow PEP 8
- Use type hints
- Maximum line length: 100 characters
- Use docstrings for functions and classes

```python
def get_project_stats(project_id: int) -> dict:
    """
    Get project statistics

    Args:
        project_id: ID of the project

    Returns:
        Dictionary containing project stats
    """
    # Implementation
```

### TypeScript (Frontend)
- Use TypeScript strict mode
- Export types for public APIs
- Use meaningful variable names
- Add JSDoc comments for complex functions

```typescript
interface ProjectStats {
  totalTasks: number
  completedTasks: number
}

/**
 * Calculate project statistics
 * @param projectId - The project ID
 * @returns Project statistics
 */
function getProjectStats(projectId: number): ProjectStats {
  // Implementation
}
```

## Debugging

### Backend Debugging
```python
# In Django shell
python manage.py shell
>>> from projects.models import Project
>>> Project.objects.all()

# Using pdb
import pdb; pdb.set_trace()
```

### Frontend Debugging
- Use React DevTools browser extension
- Use Redux DevTools (if using Redux)
- Use Network tab in DevTools to monitor API calls
- Console logging with descriptive messages

## Performance Tips

### Backend
1. Use `select_related()` for foreign keys
2. Use `prefetch_related()` for reverse relationships
3. Add database indexes for frequently filtered fields
4. Use `.only()` or `.defer()` to limit fields
5. Cache expensive queries

### Frontend
1. Use React.memo for expensive components
2. Use useCallback to memoize callbacks
3. Use React Query for data caching
4. Code-split routes with React.lazy()
5. Optimize images and assets

## Deployment Checklist

### Backend
- [ ] Set DEBUG=False
- [ ] Generate new SECRET_KEY
- [ ] Configure allowed hosts
- [ ] Set up HTTPS
- [ ] Configure CORS properly
- [ ] Run migrations
- [ ] Collect static files
- [ ] Set up logging
- [ ] Configure error tracking

### Frontend
- [ ] Run production build
- [ ] Test in production environment
- [ ] Configure API base URL
- [ ] Enable gzip compression
- [ ] Configure caching headers
- [ ] Test with real data

## Troubleshooting

### Common Issues

**Port already in use**
```bash
lsof -i :8000
kill -9 <PID>
```

**Database connection error**
```bash
# Check PostgreSQL is running
psql -U postgres

# Reset migrations
python manage.py migrate projects zero
```

**Node modules issues**
```bash
rm -rf node_modules package-lock.json
npm install
```

**WebSocket connection issues**
- Check that Daphne is running (not django runserver)
- Verify Redis is running
- Check browser console for connection errors
- Verify CORS configuration

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
