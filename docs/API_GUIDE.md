# API Documentation Guide

## Authentication

All API endpoints (except `/api/health/`) require JWT authentication.

### Getting Tokens

**POST** `/api/auth/token/`
```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Refreshing Tokens

**POST** `/api/auth/token/refresh/`
```bash
curl -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "your-refresh-token"}'
```

### Using the Token

Include the access token in all requests:
```bash
curl -H "Authorization: Bearer your-access-token" \
  http://localhost:8000/api/projects/
```

## Projects API

### List Projects

**GET** `/api/projects/`

Query Parameters:
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20)
- `status` - Filter by status (active, on_hold, archived, completed)
- `health` - Filter by health (healthy, at_risk, critical)
- `search` - Full-text search on title, description, tags
- `ordering` - Sort by field (-title for reverse)

Example:
```bash
GET /api/projects/?status=active&search=backend&ordering=-updated_at
```

Response:
```json
{
  "count": 5,
  "next": "http://api.example.com/api/projects/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Backend API",
      "description": "REST API development",
      "owner": {
        "id": 1,
        "username": "developer",
        "email": "dev@paulkokos.yahoo.gr"
      },
      "status": "active",
      "health": "healthy",
      "progress": 45,
      "start_date": "2024-01-01",
      "end_date": "2024-06-01",
      "tags": [
        {
          "id": 1,
          "name": "backend",
          "color": "#3B82F6"
        }
      ],
      "team_count": 3,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T15:45:00Z",
      "etag": "abc123def456"
    }
  ]
}
```

### Create Project

**POST** `/api/projects/`

Request Body:
```json
{
  "title": "New Backend Service",
  "description": "Build microservice for user authentication",
  "status": "active",
  "health": "healthy",
  "progress": 0,
  "start_date": "2024-02-01",
  "end_date": "2024-04-01",
  "tag_ids": [1, 2]
}
```

Response: 201 Created
```json
{
  "id": 5,
  "title": "New Backend Service",
  "owner": {
    "id": 1,
    "username": "developer"
  },
  "status": "active",
  "health": "healthy",
  "progress": 0,
  "tags": [...],
  "version": 1,
  "etag": "xyz789",
  "created_at": "2024-01-25T10:00:00Z",
  "updated_at": "2024-01-25T10:00:00Z"
}
```

### Get Project Detail

**GET** `/api/projects/{id}/`

Response:
```json
{
  "id": 1,
  "title": "Backend API",
  "description": "REST API development",
  "owner": {...},
  "status": "active",
  "health": "healthy",
  "progress": 45,
  "tags": [...],
  "team_members": [
    {
      "id": 1,
      "user": {
        "id": 2,
        "username": "john",
        "email": "john@paulkokos.yahoo.gr"
      },
      "role": "developer",
      "capacity": 80
    }
  ],
  "milestones": [
    {
      "id": 1,
      "title": "Phase 1",
      "description": "Core API development",
      "due_date": "2024-03-01",
      "progress": 50
    }
  ],
  "recent_activities": [
    {
      "id": 1,
      "activity_type": "status_changed",
      "user": {...},
      "description": "Status changed from on_hold to active",
      "metadata": {
        "old_status": "on_hold",
        "new_status": "active"
      },
      "created_at": "2024-01-20T15:45:00Z"
    }
  ],
  "milestone_progress": 50,
  "version": 5,
  "etag": "abc123",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:45:00Z"
}
```

### Update Project

**PATCH** `/api/projects/{id}/`

Note: Include `etag` from the project for optimistic concurrency control.

Request Body:
```json
{
  "title": "Updated Title",
  "progress": 50,
  "etag": "abc123"
}
```

Response: 200 OK
```json
{
  "id": 1,
  "title": "Updated Title",
  "progress": 50,
  "version": 6,
  "etag": "xyz789",
  ...
}
```

**Error Response (409 Conflict)** - When ETag doesn't match:
```json
{
  "detail": "Resource has been modified. Please refresh and try again."
}
```

### Soft Delete Project

**POST** `/api/projects/{id}/soft_delete/`

Response: 200 OK
```json
{
  "success": true,
  "message": "Project deleted"
}
```

The project will still exist in the database but won't appear in list queries.

### Restore Project

**POST** `/api/projects/{id}/restore/`

Response: 200 OK
```json
{
  "id": 1,
  "title": "Restored Project",
  "deleted_at": null,
  ...
}
```

### Get Project Activities

**GET** `/api/projects/{id}/activities/`

Response:
```json
[
  {
    "id": 1,
    "activity_type": "status_changed",
    "user": {
      "id": 1,
      "username": "developer"
    },
    "description": "Status changed from on_hold to active",
    "metadata": {...},
    "created_at": "2024-01-20T15:45:00Z"
  }
]
```

### Add Team Member

**POST** `/api/projects/{id}/add_team_member/`

Request Body:
```json
{
  "user_id": 2,
  "role": "developer",
  "capacity": 80
}
```

Response: 201 Created

### Remove Team Member

**DELETE** `/api/projects/{id}/remove_team_member/`

Request Body:
```json
{
  "user_id": 2
}
```

Response: 200 OK

### Add Milestone

**POST** `/api/projects/{id}/add_milestone/`

Request Body:
```json
{
  "title": "Phase 2",
  "description": "Advanced features",
  "due_date": "2024-04-01",
  "progress": 0
}
```

Response: 201 Created

## Bulk Operations

### Bulk Update Status

**POST** `/api/bulk/update_status/`

Request Body:
```json
{
  "project_ids": [1, 2, 3],
  "changes": {
    "status": "archived"
  }
}
```

Response: 200 OK
```json
{
  "success": true,
  "updated_count": 3
}
```

### Bulk Update Tags

**POST** `/api/bulk/update_tags/`

Request Body:
```json
{
  "project_ids": [1, 2, 3],
  "changes": {
    "tag_ids": [1, 4, 5]
  }
}
```

Response: 200 OK
```json
{
  "success": true,
  "updated_count": 3
}
```

## Tags API

### List Tags

**GET** `/api/tags/`

Response:
```json
[
  {
    "id": 1,
    "name": "backend",
    "color": "#3B82F6",
    "description": "Backend development tasks",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Create Tag

**POST** `/api/tags/`

Request Body:
```json
{
  "name": "urgent",
  "color": "#EF4444",
  "description": "Urgent priority tasks"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "detail": "Invalid field value"
  }
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied"
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 409 Conflict (Optimistic Concurrency)
```json
{
  "detail": "Resource has been modified. Please refresh and try again."
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "detail": "An unexpected error occurred"
  }
}
```

## WebSocket API

### Connect to Project Updates

```javascript
import io from 'socket.io-client'

const socket = io('ws://localhost:8000', {
  auth: { token: 'your-jwt-token' }
})

// Subscribe to project
socket.emit('subscribe', { project_id: 1 })

// Listen for updates
socket.on('project_update', (data) => {
  console.log('Project updated:', data)
})

socket.on('activity', (data) => {
  console.log('New activity:', data)
})
```

## Rate Limiting

API endpoints are rate limited:
- General endpoints: 100 requests/second per IP
- Bulk operations: 10 requests/second per IP

## Pagination

All list endpoints support pagination:
- Default page size: 20
- Maximum page size: 100
- Use `?page=2` to get next page

## Search

Full-text search available on:
- Project titles
- Project descriptions
- Tag names

Search is case-insensitive.

## Filtering & Sorting

Supported filter fields:
- `status` - Project status
- `health` - Project health
- `owner` - Project owner ID
- `tags` - Tag IDs (multiple allowed)

Supported sort fields:
- `title`
- `created_at`
- `updated_at`
- `progress`

Use `-` prefix for descending order: `-title`

## Examples

### Search for Projects
```bash
curl -H "Authorization: Bearer token" \
  "http://localhost:8000/api/projects/?search=backend&status=active"
```

### Create and Assign Team Members
```bash
# Create project
curl -X POST http://localhost:8000/api/projects/ \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"title": "New Project"}'

# Get project ID from response

# Add team member
curl -X POST http://localhost:8000/api/projects/1/add_team_member/ \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "role": "developer", "capacity": 80}'
```

### Bulk Archive Projects
```bash
curl -X POST http://localhost:8000/api/bulk/update_status/ \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "project_ids": [1, 2, 3],
    "changes": {"status": "archived"}
  }'
```
