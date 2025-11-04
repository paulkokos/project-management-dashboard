# project-management-search-utils

Django search utilities for Elasticsearch integration with permission-aware filtering.

## Overview

This package provides high-level search functionality for project management applications using Elasticsearch as the search backend. It includes:

- **SearchService**: Main search service for querying Elasticsearch
- **SearchPermissionMixin**: Permission-aware filtering for search results
- **SearchIndexManager**: Utilities for managing Elasticsearch indexes

## Installation

### From PyPI (after publishing)

```bash
pip install project-management-search-utils
```

### From Source

```bash
pip install -e .
```

### Development Installation

```bash
pip install -e ".[dev]"
```

This will also install development dependencies (pytest, black, flake8, isort).

## Requirements

- Django >= 5.0
- djangorestframework >= 3.14
- django-haystack >= 3.2
- elasticsearch >= 8.0, < 9.0
- Python >= 3.11

## Quick Start

### Basic Search

```python
from project_search import SearchService
from django.contrib.auth.models import User

# Create service instance
service = SearchService()

# Get user
user = User.objects.get(username='john')

# Simple search
results = service.search(
    query="mobile app",
    user=user
)

print(f"Found {results['total']} results")
for result in results['results']:
    print(f"  - {result['title']}")
```

### Search with Filters and Pagination

```python
from project_search import SearchService

service = SearchService()

# Search with filters
results = service.search(
    query="mobile app",
    filters={
        "status": "active",
        "health": "healthy"
    },
    page=1,
    page_size=20,
    user=request.user
)

print(f"Total results: {results['total']}")
print(f"Current page: {results['page']}")
print(f"Total pages: {results['total_pages']}")

# Print results
for result in results['results']:
    print(f"- {result['title']} (Status: {result['status']})")

# Print available filters
print("Available filters:")
for filter_name, options in results['facets'].items():
    print(f"\n{filter_name}:")
    for option, count in options.items():
        print(f"  - {option}: {count}")
```

### Autocomplete Suggestions

```python
from project_search import SearchService

service = SearchService()

# Get autocomplete suggestions
suggestions = service.autocomplete(
    query="mo",  # At least 2 characters
    limit=10,
    user=request.user
)

for suggestion in suggestions:
    print(f"- {suggestion['title']} (Type: {suggestion['type']})")
```

## API Reference

### SearchService

Main service for querying Elasticsearch.

#### Methods

##### `search(query, filters=None, page=1, page_size=20, user=None)`

Search for projects using Elasticsearch.

**Parameters:**
- `query` (str): Search query string
- `filters` (dict, optional): Filter criteria
  - `status`: Project status (e.g., 'active', 'archived')
  - `health`: Project health status (e.g., 'healthy', 'at_risk')
  - `owner`: Project owner username
- `page` (int): Page number (1-indexed, default: 1)
- `page_size` (int): Results per page (default: 20)
- `user` (User): Django User object for permission filtering

**Returns:**
Dictionary with:
```python
{
    "results": [
        {
            "id": 1,
            "title": "Mobile App",
            "description": "iOS and Android app",
            "owner": {"id": 1, "username": "john"},
            "status": "active",
            "health": "healthy",
            "progress": 75,
            "tags": [
                {"id": 1, "name": "frontend", "color": "#FF5733"},
                {"id": 2, "name": "mobile", "color": "#33FF57"}
            ]
        }
    ],
    "facets": {
        "status": {"active": 45, "archived": 12},
        "health": {"healthy": 40, "at_risk": 17},
        "owner": {"john": 30, "jane": 27}
    },
    "total": 57,
    "page": 1,
    "page_size": 20,
    "total_pages": 3
}
```

**Raises:**
- `ValueError`: If query is empty
- `PermissionDenied`: If user lacks permission

**Example:**
```python
results = service.search(
    query="dashboard",
    filters={"status": "active"},
    page=1,
    user=request.user
)
```

##### `autocomplete(query, limit=10, user=None)`

Get autocomplete suggestions.

**Parameters:**
- `query` (str): Partial query for prefix matching (minimum 2 characters)
- `limit` (int): Maximum number of suggestions (default: 10)
- `user` (User): Django User object for permission filtering

**Returns:**
List of suggestions:
```python
[
    {
        "id": 1,
        "title": "Mobile App",
        "type": "project"
    },
    {
        "id": 2,
        "title": "Mobile First Design",
        "type": "project"
    }
]
```

**Raises:**
- `ValueError`: If query is less than 2 characters

**Example:**
```python
suggestions = service.autocomplete(
    query="mob",
    limit=5,
    user=request.user
)
```

### SearchPermissionMixin

Provides permission-aware filtering for search results.

#### Methods

##### `get_accessible_projects(user)`

Get all projects accessible to the given user.

**Parameters:**
- `user` (User): Django User object

**Returns:**
QuerySet of accessible projects

**Raises:**
- `ValueError`: If user is not authenticated

**Example:**
```python
from project_search import SearchPermissionMixin

mixin = SearchPermissionMixin()
accessible = mixin.get_accessible_projects(user=request.user)
```

##### `filter_by_permissions(queryset, user)`

Filter a queryset to include only accessible projects.

**Parameters:**
- `queryset` (QuerySet): QuerySet to filter
- `user` (User): Django User object

**Returns:**
Filtered QuerySet

**Example:**
```python
projects = Project.objects.all()
filtered = mixin.filter_by_permissions(projects, user=request.user)
```

##### `has_project_access(user, project_id)`

Check if user has access to a specific project.

**Parameters:**
- `user` (User): Django User object
- `project_id` (int): Project ID

**Returns:**
Boolean indicating access

**Example:**
```python
if mixin.has_project_access(user=request.user, project_id=42):
    print("User has access")
```

##### `get_accessible_project_ids(user)`

Get list of accessible project IDs (useful for Elasticsearch filtering).

**Parameters:**
- `user` (User): Django User object

**Returns:**
List of project IDs

**Example:**
```python
project_ids = mixin.get_accessible_project_ids(user=request.user)
# Use for filtering Elasticsearch results
```

### SearchIndexManager

Utilities for managing Elasticsearch indexes.

#### Methods

##### `rebuild_all_indexes()`

Rebuild all search indexes from database.

**Returns:**
Dictionary with rebuild statistics

**Example:**
```python
from project_search import SearchIndexManager

manager = SearchIndexManager()
result = manager.rebuild_all_indexes()
print(f"Indexed {result['total_documents']} documents")
```

##### `rebuild_index(index_name)`

Rebuild a specific index.

**Parameters:**
- `index_name` (str): Name of index ('projects', 'milestones', 'activities', or 'tags')

**Returns:**
Dictionary with rebuild information

**Example:**
```python
result = manager.rebuild_index('projects')
```

##### `optimize_index(index_name)`

Optimize an index for better performance.

**Parameters:**
- `index_name` (str): Name of index to optimize

**Returns:**
Dictionary with optimization results

##### `delete_index(index_name)`

Delete an index (WARNING: irreversible).

**Parameters:**
- `index_name` (str): Name of index to delete

**Returns:**
Dictionary with deletion status

##### `get_index_stats()`

Get statistics for all search indexes.

**Returns:**
Dictionary with index statistics including document counts and health status

**Example:**
```python
stats = manager.get_index_stats()
print(f"Total documents: {stats['total_documents']}")
print(f"Health: {stats['health_status']}")
```

##### `get_index_mapping(index_name)`

Get the mapping (schema) for an index.

**Parameters:**
- `index_name` (str): Name of index

**Returns:**
Dictionary with index mapping

##### `reindex_document(doc_id, doc_type)`

Reindex a single document.

**Parameters:**
- `doc_id` (int): Document ID
- `doc_type` (str): Document type ('project', 'milestone', 'activity', 'tag')

**Returns:**
Dictionary with reindexing status

##### `clear_cache()`

Clear Elasticsearch request cache.

**Returns:**
Dictionary with cache clear status

##### `health_check()`

Check the health of Elasticsearch.

**Returns:**
Dictionary with health information and any issues found

## Integration with Django

### Settings Configuration

Add to your `settings.py`:

```python
INSTALLED_APPS = [
    # ...
    'haystack',
    'projects',
]

HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchEngine',
        'URL': os.getenv('ELASTICSEARCH_URL', 'http://elasticsearch:9200/'),
        'INDEX_NAME': 'projects_index',
    },
}

HAYSTACK_SIGNAL_PROCESSOR = 'haystack.signals.RealtimeSignalProcessor'
```

### Django Admin Integration

Use the SearchPermissionMixin to filter admin querysets:

```python
from django.contrib import admin
from project_search import SearchPermissionMixin
from projects.models import Project

class ProjectAdmin(admin.ModelAdmin, SearchPermissionMixin):
    list_display = ('title', 'owner', 'status')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return self.filter_by_permissions(qs, user=request.user)

admin.site.register(Project, ProjectAdmin)
```

## Usage in Views

### Class-Based View with SearchService

```python
from django.views.generic import ListView
from project_search import SearchService
from projects.models import Project

class ProjectSearchView(ListView):
    model = Project
    template_name = 'projects/search.html'
    context_object_name = 'results'

    def get_queryset(self):
        service = SearchService()
        query = self.request.GET.get('q', '')

        if not query:
            return Project.objects.none()

        results = service.search(
            query=query,
            user=self.request.user
        )
        return results['results']

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        service = SearchService()
        query = self.request.GET.get('q', '')

        results = service.search(query=query, user=self.request.user)
        context['facets'] = results['facets']
        context['total'] = results['total']

        return context
```

### REST API View with DRF

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from project_search import SearchService

class SearchAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        filters = {
            'status': request.query_params.get('status'),
            'health': request.query_params.get('health'),
        }
        page = int(request.query_params.get('page', 1))

        service = SearchService()
        results = service.search(
            query=query,
            filters={k: v for k, v in filters.items() if v},
            page=page,
            user=request.user
        )

        return Response(results)
```

## Performance Considerations

### Elasticsearch Configuration

For production deployments:

1. **Index Sharding**: Configure appropriate number of shards based on data volume
2. **Replicas**: Set replica count for high availability
3. **Refresh Interval**: Adjust for your throughput requirements
4. **Bulk Indexing**: Use bulk API for initial index creation

### Caching

Results are not cached by default. Implement your own caching strategy:

```python
from django.core.cache import cache

def cached_search(query, user):
    cache_key = f"search:{query}:{user.id}"
    results = cache.get(cache_key)

    if results is None:
        service = SearchService()
        results = service.search(query=query, user=user)
        cache.set(cache_key, results, timeout=300)  # 5 minutes

    return results
```

### Query Optimization

1. **Limit page size**: Don't return excessive results per page
2. **Use filters**: Narrow results before full-text search
3. **Debounce autocomplete**: Implement client-side debouncing for suggestions
4. **Index optimization**: Periodically optimize indexes after bulk operations

## Testing

Run tests with:

```bash
pytest
```

Run tests with coverage:

```bash
pytest --cov=project_search
```

Run specific test file:

```bash
pytest tests/test_search_service.py
```

## Documentation

For detailed documentation on Elasticsearch integration, see the full project documentation:

- [Backend Search Guide](https://github.com/paulkokos/project-management-dashboard/blob/master/docs/SEARCH_GUIDE.md)
- [Elasticsearch Integration](https://github.com/paulkokos/project-management-dashboard/blob/master/backend/projects/search.py)
- [Search Indexes](https://github.com/paulkokos/project-management-dashboard/blob/master/backend/projects/search_indexes.py)

## Contributing

Contributions are welcome! Please ensure:

1. Code follows PEP 8 style guide (checked with flake8)
2. Code is formatted with black
3. Import statements are sorted with isort
4. All tests pass
5. New features include tests

Format code before submitting:

```bash
black project_search/
isort project_search/
flake8 project_search/
```

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or suggestions, please visit:
https://github.com/paulkokos/project-management-dashboard/issues

## Related Projects

- **@paulkokos/search-components**: NPM package for React search UI components
- **project-management-dashboard**: Full project management application

See [PACKAGES.md](https://github.com/paulkokos/project-management-dashboard/blob/master/docs/PACKAGES.md) for more information on available packages.
