# Search Implementation Guide

## Overview

This project implements full-text search using **Elasticsearch** via **django-haystack**, providing production-grade search capabilities across projects, milestones, activities, and tags.

### Search Approach: Elasticsearch

**Why Elasticsearch?**
- Distributed full-text search engine
- Scales horizontally for large datasets
- Advanced relevance ranking with BM25 algorithm
- Faceted search for filtering
- Real-time indexing with signal processors
- Fast aggregations for analytics

**Architecture:**
```
User Query → Django API → Elasticsearch Backend → Ranked Results
                ↓
         django-haystack
         (abstraction layer)
```

---

## Elasticsearch Integration

### Configuration

Elasticsearch is configured in `backend/config/settings.py`:

```python
HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchEngine',
        'URL': os.getenv('ELASTICSEARCH_URL', 'http://elasticsearch:9200/'),
        'INDEX_NAME': 'projects_index',
    },
}

HAYSTACK_SIGNAL_PROCESSOR = 'haystack.signals.RealtimeSignalProcessor'
HAYSTACK_SEARCH_RESULTS_PER_PAGE = 20
```

**Environment Variables:**
- `ELASTICSEARCH_URL`: Elasticsearch cluster URL (default: `http://elasticsearch:9200/`)

### Docker Configuration

Elasticsearch service is included in `docker-compose.yml`:

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.14.0
  container_name: project_dashboard_elasticsearch
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
  ports:
    - "9200:9200"
  volumes:
    - elasticsearch_data:/usr/share/elasticsearch/data
```

---

## Search Indexes

### Implemented Indexes

**1. ProjectIndex** (`backend/projects/search_indexes.py`)

Indexes project documents with:
- `text`: Full-text searchable content (title + description + tags)
- `title`: Project title (boosted 1.5x for relevance)
- `description`: Project description
- `owner`: Project owner username
- `status`: Project status (active, archived, etc.)
- `health`: Project health (healthy, at risk, critical)
- `progress`: Project progress percentage
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `tags`: Tag names joined as searchable text

**2. MilestoneIndex**

Indexes milestone documents for searching by:
- Title, description, project name
- Status and progress
- Creation/update dates

**3. ActivityIndex**

Indexes activity logs for searching by:
- Activity type and description
- Project and actor information
- Timestamps

**4. TagIndex**

Indexes tags for autocomplete and suggestions by:
- Tag name (boosted 2.0x)
- Tag color

### Index Templates

Search templates in `backend/projects/templates/search/indexes/projects/`:
- `project_text.txt`: Title + description + owner + tags
- `milestone_text.txt`: Title + description + project name
- `activity_text.txt`: Activity type + description + project + actor
- `tag_text.txt`: Tag name only

### Index Updates

Indexes are automatically updated in real-time using `RealtimeSignalProcessor`:
- **Create**: New documents indexed on model save
- **Update**: Documents re-indexed when modified
- **Delete**: Documents removed on model delete
- **Soft Delete**: Soft-deleted items excluded via queryset filter

---

## Search API

### Full-Text Search Endpoint

**Request:**
```
GET /api/search/search/?q=query&status=active&health=healthy&owner=john&page=1&page_size=20
```

**Parameters:**
- `q` (required): Search query
- `status` (optional): Filter by project status
- `health` (optional): Filter by project health
- `owner` (optional): Filter by project owner username
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Results per page (default: 20)

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "title": "Mobile App Development",
      "description": "Build iOS and Android apps",
      "owner": {
        "id": 1,
        "username": "john_doe"
      },
      "status": "active",
      "health": "healthy",
      "progress": 75,
      "tags": ["mobile", "ios", "android"],
      "created_at": "2025-10-01T10:00:00Z",
      "updated_at": "2025-10-27T15:30:00Z"
    }
  ],
  "facets": {
    "statuses": {
      "active": 45,
      "archived": 12,
      "on_hold": 3
    },
    "healths": {
      "healthy": 40,
      "at_risk": 15,
      "critical": 5
    },
    "owners": {
      "john_doe": 30,
      "jane_smith": 20,
      "bob_wilson": 10
    }
  },
  "total": 60,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

### Autocomplete Endpoint

**Request:**
```
GET /api/search/autocomplete/?q=mob&limit=10
```

**Parameters:**
- `q` (required): Search prefix (minimum 2 characters)
- `limit` (optional): Number of suggestions (default: 10)

**Response:**
```json
{
  "suggestions": [
    {
      "title": "Mobile App Development",
      "id": 1,
      "type": "project"
    },
    {
      "title": "Mobile Backend Service",
      "id": 5,
      "type": "project"
    }
  ]
}
```

---

## Search Features

### Full-Text Search

Searches across multiple fields with BM25 relevance ranking:
- Exact title matches scored highest
- Description matches scored lower
- Tag matches included in ranking
- Results ordered by relevance score

**Example:**
```
Query: "mobile app"
Results:
1. "Mobile App Development" (exact title match)
2. "Build Mobile Applications" (contains "mobile" in description)
3. "App Marketing Mobile Strategy" (tag match)
```

### Faceted Search

Results can be filtered by:
- **Status**: active, archived, on_hold, completed
- **Health**: healthy, at_risk, critical
- **Owner**: project owner username

Facet counts show available values:
```json
"facets": {
  "statuses": {
    "active": 45,
    "archived": 12
  }
}
```

### Autocomplete Suggestions

Real-time search suggestions for:
- Project title prefix matching
- Fast response for UX

---

## Indexing Management

### Building Indexes

Build or rebuild all indexes:
```bash
docker-compose exec backend python manage.py rebuild_index
```

### Partial Indexing

Index specific models only:
```bash
docker-compose exec backend python manage.py rebuild_index --using default
```

### Monitoring Indexes

Check Elasticsearch cluster health:
```bash
curl http://localhost:9200/_cluster/health

# Get index stats
curl http://localhost:9200/projects_index/_stats

# List all indexes
curl http://localhost:9200/_cat/indices
```

---

## Performance Considerations

### Query Performance

- Elasticsearch queries: < 100ms for typical searches
- Faceting aggregations: < 50ms
- Autocomplete: < 10ms

### Scaling

**For datasets:**
- < 10,000 items: Single Elasticsearch node sufficient
- 10,000-100,000 items: Consider 3-node cluster
- > 100,000 items: Multi-node cluster with sharding

**Indexing:**
- Bulk indexing: ~10,000 docs/sec
- Real-time indexing: < 1sec latency

---

## Limitations

### Current Limitations

- **No synonym support**: Search doesn't understand synonyms (e.g., "mobile app" vs "app development")
- **No phrase queries**: Only full-text matching, not exact phrase matching
- **No filtering by date range**: Only supported via API parameters if added
- **No search analytics**: No tracking of popular searches

### Potential Improvements

1. **Synonym Dictionary**: Configure Elasticsearch analyzers with synonyms
2. **Advanced Queries**: Support for phrase queries, wildcards, boolean operators
3. **Search History**: Track and suggest popular searches
4. **Query Logging**: Log searches for analytics and optimization

---

## Troubleshooting

### Elasticsearch Not Connected

**Error:** `ConnectionError: Connection failed`

**Solution:**
1. Check Elasticsearch is running: `docker ps | grep elasticsearch`
2. Verify connection URL: `curl http://localhost:9200/`
3. Check Docker logs: `docker-compose logs elasticsearch`

### Stale Index

**Error:** Results don't include recent changes

**Solution:**
```bash
# Rebuild all indexes
docker-compose exec backend python manage.py rebuild_index

# Or update a specific item
docker-compose exec backend python manage.py update_index
```

### Low Search Performance

**Solution:**
1. Increase Elasticsearch heap size in docker-compose.yml
2. Add more nodes to the cluster
3. Optimize query: reduce faceting, limit page size

### Index Size Growing

**Solution:**
1. Delete old indexes: `curl -X DELETE http://localhost:9200/projects_index_old`
2. Configure index retention policy
3. Use index aliases for zero-downtime rotations

---

## Comparison: Search Approaches

| Feature | PostgreSQL | Elasticsearch |
|---------|-----------|---------------|
| Full-Text Search | Basic | Excellent |
| Relevance Ranking | Simple | BM25 Algorithm |
| Faceting | Manual queries | Native support |
| Autocomplete | LIKE queries | Prefix queries |
| Scaling | Single node | Horizontal |
| Performance (large datasets) | Degrades | Consistent |
| Complexity | Low | Medium |
| Resource Usage | Low | Medium-High |

**This implementation chose Elasticsearch for:**
- Production-grade full-text search
- Faceted search capabilities
- Excellent performance at scale
- Native relevance ranking

---

## Related Documentation

- [API_GUIDE.md](API_GUIDE.md) - Full API endpoint documentation
- [CODE_DOCUMENTATION.md](CODE_DOCUMENTATION.md) - Architecture overview
- [WEBSOCKET_GUIDE.md](WEBSOCKET_GUIDE.md) - Real-time updates
