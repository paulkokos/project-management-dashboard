# Publishable Packages

This project includes reusable packages for both frontend (NPM) and backend (PyPI) that can be published to package registries and used in other projects.

## Overview

Three production-ready packages are available:

1. **@paulkokos/search-components** - React search UI components (NPM)
2. **@paulkokos/ui-components** - Reusable project dashboard UI components (NPM)
3. **project-management-search-utils** - Django/Python search utilities (PyPI)

## NPM Packages

### @paulkokos/search-components

Complete search interface components for React applications.

**Location:** `packages/search-components/`

**Contents:**
- `SearchAutocomplete`: Debounced autocomplete input with suggestions
- `SearchFilters`: Dynamic filter UI (status, health, owner)
- `SearchResults`: Paginated results display with project cards
- Full TypeScript type definitions

**Installation:**

```bash
npm install @paulkokos/search-components
```

**Usage:**

```tsx
import {
  SearchAutocomplete,
  SearchFilters,
  SearchResults,
  type SearchResponse,
} from '@paulkokos/search-components'

function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse>()

  const handleSearch = async (q: string) => {
    const response = await fetch(`/api/search?q=${q}`)
    setResults(await response.json())
  }

  return (
    <div>
      <SearchAutocomplete
        value={query}
        onChange={setQuery}
        onSearch={handleSearch}
      />
      <SearchResults data={results} isLoading={false} />
    </div>
  )
}
```

**Dependencies:**
- React 18+
- React DOM 18+
- React Query 5+
- Tailwind CSS

**Package Size:** ~25KB gzipped

**Documentation:** [packages/search-components/README.md](../packages/search-components/README.md)

---

### @paulkokos/ui-components

Lightweight UI components for project dashboards.

**Location:** `packages/ui-components/`

**Contents:**
- `RiskBadge`: Color-coded risk level indicator
- `DeadlineIndicator`: Deadline status with urgency coloring
- `TeamMemberCount`: Team member count badge
- `MilestoneProgress`: Milestone completion progress with bar

**Installation:**

```bash
npm install @paulkokos/ui-components
```

**Usage:**

```tsx
import {
  RiskBadge,
  DeadlineIndicator,
  TeamMemberCount,
  MilestoneProgress,
} from '@paulkokos/ui-components'

function ProjectCard() {
  return (
    <div className="p-4 border rounded">
      <div className="flex justify-between items-center mb-2">
        <h3>My Project</h3>
        <RiskBadge riskLevel="high" />
      </div>

      <div className="space-y-2">
        <DeadlineIndicator
          daysUntilDeadline={15}
          endDate="2025-11-15"
        />
        <TeamMemberCount teamCount={5} />
        <MilestoneProgress
          milestoneCount={10}
          completedMilestoneCount={7}
        />
      </div>
    </div>
  )
}
```

**Dependencies:**
- React 18+
- React DOM 18+
- Tailwind CSS

**Package Size:** ~5KB gzipped

**Documentation:** [packages/ui-components/README.md](../packages/ui-components/README.md)

---

## PyPI Package

### project-management-search-utils

Django/Python utilities for Elasticsearch integration.

**Location:** `packages/search-utils/`

**Contents:**
- `SearchService`: High-level search interface
  - `search()`: Full-text search with filtering and pagination
  - `autocomplete()`: Prefix-based suggestions
- `SearchPermissionMixin`: Permission-aware result filtering
  - `get_accessible_projects()`: Get user's accessible projects
  - `filter_by_permissions()`: Filter querysets
  - `has_project_access()`: Check individual project access
  - `get_accessible_project_ids()`: Get project IDs for ES filtering
- `SearchIndexManager`: Elasticsearch index management
  - `rebuild_all_indexes()`: Rebuild all indexes
  - `optimize_index()`: Optimize specific index
  - `get_index_stats()`: Retrieve statistics
  - `health_check()`: Monitor health

**Installation:**

```bash
pip install project-management-search-utils
```

**Usage:**

```python
from project_search import SearchService, SearchPermissionMixin
from django.contrib.auth.models import User

# Basic search
service = SearchService()
user = User.objects.get(username='john')

results = service.search(
    query="mobile app",
    filters={"status": "active"},
    user=user
)

# Permission filtering
mixin = SearchPermissionMixin()
accessible = mixin.get_accessible_projects(user=user)
```

**Dependencies:**
- Django >= 5.0
- djangorestframework >= 3.14
- django-haystack >= 3.2
- elasticsearch >= 8.0, < 9.0
- Python >= 3.11

**Documentation:** [packages/search-utils/README.md](../packages/search-utils/README.md)

---

## Package Structure

### NPM Packages

```
packages/
├── search-components/          # Search UI components
│   ├── package.json           # NPM metadata
│   ├── tsconfig.json          # TypeScript config
│   ├── src/
│   │   ├── index.ts           # Main exports
│   │   ├── types.ts           # TypeScript interfaces
│   │   ├── components/
│   │   │   ├── SearchAutocomplete.tsx
│   │   │   ├── SearchFilters.tsx
│   │   │   └── SearchResults.tsx
│   ├── README.md              # Complete documentation
│   └── LICENSE
│
└── ui-components/             # UI dashboard components
    ├── package.json           # NPM metadata
    ├── tsconfig.json          # TypeScript config
    ├── src/
    │   ├── index.ts           # Main exports
    │   ├── RiskBadge.tsx
    │   ├── DeadlineIndicator.tsx
    │   ├── TeamMemberCount.tsx
    │   └── MilestoneProgress.tsx
    ├── README.md              # Complete documentation
    └── LICENSE
```

### PyPI Package

```
packages/
└── search-utils/              # Django search utilities
    ├── setup.py               # Package metadata
    ├── README.md              # Complete documentation
    ├── LICENSE
    └── src/project_search/
        ├── __init__.py        # Package exports
        ├── search_service.py  # SearchService class
        ├── permissions.py     # Permission utilities
        └── indexing.py        # Index management
```

---

## Local Development & Testing

### NPM Packages

#### Setup

```bash
cd packages/search-components
npm install
npm run build
```

#### Local Testing with npm link

```bash
# In package directory
npm link

# In your test project
npm link @paulkokos/search-components
```

#### Watch Mode (Auto-compile)

```bash
npm run watch
```

#### Running Tests

```bash
npm test
```

---

### PyPI Package

#### Setup

```bash
cd packages/search-utils
pip install -e ".[dev]"
```

#### Local Testing with pip

```bash
# Editable install for development
pip install -e .

# Or with dev dependencies
pip install -e ".[dev]"
```

#### Running Tests

```bash
pytest
pytest --cov=project_search  # With coverage
```

---

## Publishing to Registries

### Publishing NPM Packages

#### Prerequisites

1. Create NPM account: https://www.npmjs.com/signup
2. Login locally: `npm login`
3. Update package version in `package.json`

#### Publishing to NPM

```bash
cd packages/search-components
npm run build

# Review files to be published
npm pack

# Publish to NPM
npm publish --access public
```

#### Scoped Package Publishing

For scoped packages like `@paulkokos/search-components`:

```bash
# First time publishing scoped package
npm publish --access public

# Subsequent publishes
npm publish
```

#### Version Updates

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch
npm publish

# Minor version (1.0.0 -> 1.1.0)
npm version minor
npm publish

# Major version (1.0.0 -> 2.0.0)
npm version major
npm publish
```

---

### Publishing to PyPI

#### Prerequisites

1. Create PyPI account: https://pypi.org/account/register/
2. Create `~/.pypirc` with credentials:

```ini
[distutils]
index-servers =
    pypi
    testpypi

[pypi]
repository: https://upload.pypi.org/legacy/
username: __token__
password: pypi-AgEIcHlwaS5vcmc...

[testpypi]
repository: https://test.pypi.org/legacy/
username: __token__
password: pypi-AgEIcHlweS5vcmc...
```

3. Install build tools:

```bash
pip install build twine
```

#### Publishing to Test PyPI

```bash
cd packages/search-utils

# Build distribution
python -m build

# Upload to test server
twine upload --repository testpypi dist/*

# Install from test PyPI
pip install --index-url https://test.pypi.org/simple/ project-management-search-utils
```

#### Publishing to Production PyPI

```bash
cd packages/search-utils

# Build distribution
python -m build

# Upload to PyPI
twine upload dist/*

# Install from PyPI
pip install project-management-search-utils
```

#### Version Updates

```bash
# Update version in setup.py
# Then:
rm -rf dist/ build/
python -m build
twine upload dist/*
```

---

## Version Management

### NPM Semantic Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (1.1.0): New features (backward compatible)
- **PATCH** (1.0.1): Bug fixes

### PyPI Versioning

Same as NPM - use semantic versioning in `setup.py`:

```python
setup(
    name="project-management-search-utils",
    version="1.0.0",  # Update here for releases
    ...
)
```

---

## GitHub Integration

### Creating Release Tags

```bash
# Create git tag
git tag v1.0.0

# Push tag to GitHub
git push origin v1.0.0

# Create GitHub release
gh release create v1.0.0 --generate-notes
```

### Release Checklist

- [ ] Update version numbers
- [ ] Update CHANGELOG
- [ ] Run tests: `npm test` / `pytest`
- [ ] Build packages: `npm run build` / `python -m build`
- [ ] Commit changes
- [ ] Create git tag
- [ ] Publish to registries
- [ ] Create GitHub release
- [ ] Update README with links to published packages

---

## Dependency Management

### NPM Package Dependencies

#### Peer Dependencies

Packages specify React 18+ as peer dependency (not bundled):

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

**Why peer dependencies?**
- Avoids duplicate React in node_modules
- Ensures compatibility with host project's React version
- Reduces bundle size

#### Installation

When installing packages with peer deps:

```bash
npm install @paulkokos/search-components
# npm automatically installs peer dependencies
```

---

### PyPI Package Dependencies

#### Core Dependencies

```python
install_requires=[
    "Django>=5.0",
    "djangorestframework>=3.14",
    "django-haystack>=3.2",
    "elasticsearch>=8.0,<9.0",
]
```

#### Optional Dependencies

```python
extras_require={
    "dev": [
        "pytest>=8.0",
        "pytest-django>=4.7",
        "black>=23.0",
        "flake8>=6.0",
    ],
}
```

Installation with optional deps:

```bash
pip install project-management-search-utils[dev]
```

---

## Best Practices

### NPM Packages

1. **Always build before publishing:**
   ```bash
   npm run build
   npm publish
   ```

2. **Test in a separate project:**
   ```bash
   npm link
   # Test in another project
   npm link @paulkokos/search-components
   ```

3. **Use TypeScript strict mode:**
   - Ensures type safety
   - Better IDE support for users

4. **Document with examples:**
   - Include code examples in README
   - Add JSDoc comments to exports

### PyPI Packages

1. **Use setuptools correctly:**
   - Specify `package_dir` properly
   - Include all necessary files

2. **Test installation locally:**
   ```bash
   pip install -e .
   python -c "import project_search; print(project_search.__version__)"
   ```

3. **Include comprehensive docstrings:**
   - Module-level docstrings
   - Function/class docstrings
   - Parameter and return documentation

4. **Specify Python version requirements:**
   ```python
   python_requires=">=3.11",
   ```

---

## Troubleshooting

### NPM Publishing

**Error:** `403 Forbidden`
- Solution: Ensure you're logged in: `npm login`
- Check scoped package settings in NPM dashboard

**Error:** `Package already published`
- Solution: Increment version number before publishing

**Error:** `Invalid package name`
- Solution: Package names must be lowercase and follow NPM naming rules

### PyPI Publishing

**Error:** `twine not found`
- Solution: `pip install twine`

**Error:** `Invalid credential`
- Solution: Check `~/.pypirc` format and token validity

**Error:** `Filename already exists`
- Solution: Increment version and rebuild: `rm -rf dist/ && python -m build`

---

## Update Process

### Updating NPM Packages

```bash
# 1. Make changes
cd packages/search-components
# ... edit src files ...

# 2. Update version
npm version patch

# 3. Build
npm run build

# 4. Test
npm test

# 5. Commit and push
git add .
git commit -m "Release v1.0.1"
git push

# 6. Publish
npm publish
```

### Updating PyPI Package

```bash
# 1. Make changes
cd packages/search-utils
# ... edit src files ...

# 2. Update setup.py version
# version="1.0.1"

# 3. Test
pip install -e .
pytest

# 4. Commit and push
git add .
git commit -m "Release v1.0.1"
git push

# 5. Build and publish
python -m build
twine upload dist/*
```

---

## Related Documentation

- [Search Implementation Guide](./SEARCH_GUIDE.md)
- [Frontend Search Guide](./FRONTEND_SEARCH_GUIDE.md)
- [Backend Search Guide](../backend/projects/search.py)

## Support

For issues or questions about packages:
- GitHub Issues: https://github.com/paulkokos/project-management-dashboard/issues
- NPM Package Issues: Use NPM issue template
- PyPI Package Issues: Use PyPI issue template

## License

All packages are released under the MIT License.
