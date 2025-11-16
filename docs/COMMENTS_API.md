# Comments API Documentation

## Overview

The Comments API provides endpoints for creating, reading, updating, and deleting comments on projects. Comments support threading (nested replies), soft deletion, edit tracking, and real-time updates via WebSocket.

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Base URL

```
/api/comments/
```

---

## Endpoints

### List Comments

**GET** `/api/comments/`

List all comments for a project with optional filtering.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `project_id` | integer | Filter comments by project ID (required for non-admins) |
| `parent_comment` | integer | Filter by parent comment ID (for getting replies) |
| `ordering` | string | Order results: `-created_at` (default) or `created_at` |

#### Example Request

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/comments/?project_id=1"
```

#### Example Response

```json
[
  {
    "id": 1,
    "content": "This is a comment",
    "author": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "is_edited": false,
    "reply_count": 2
  }
]
```

#### Status Codes

- `200 OK` - Success
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - No access to project

---

### Create Comment

**POST** `/api/comments/`

Create a new comment or reply.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Comment content (max 5000 chars) |
| `project_id` | integer | Yes | Project ID |
| `parent_comment` | integer | No | Parent comment ID (for replies) |

#### Example Request

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great work on this!",
    "project_id": 1
  }' \
  https://api.example.com/api/comments/
```

#### Example Response

```json
{
  "id": 2,
  "content": "Great work on this!",
  "author": {
    "id": 2,
    "username": "jane_smith",
    "email": "jane@example.com",
    "first_name": "Jane",
    "last_name": "Smith"
  },
  "created_at": "2025-01-15T11:00:00Z",
  "updated_at": "2025-01-15T11:00:00Z",
  "is_edited": false,
  "reply_count": 0
}
```

#### Validation Rules

- Content cannot be empty
- Content max length: 5000 characters
- Parent comment must exist and not be deleted
- User must have access to project

#### Status Codes

- `201 Created` - Comment created successfully
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - No access to project

---

### Retrieve Comment

**GET** `/api/comments/{id}/`

Get a specific comment with all its nested replies.

#### Example Request

```bash
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/comments/1/
```

#### Example Response

```json
{
  "id": 1,
  "content": "Parent comment",
  "author": {...},
  "parent_comment": null,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "is_edited": false,
  "edited_at": null,
  "edit_count": 0,
  "reply_count": 2,
  "replies": [
    {
      "id": 2,
      "content": "Reply 1",
      "author": {...},
      "created_at": "2025-01-15T11:00:00Z",
      "updated_at": "2025-01-15T11:00:00Z",
      "is_edited": false,
      "reply_count": 0
    }
  ]
}
```

#### Status Codes

- `200 OK` - Success
- `404 Not Found` - Comment not found
- `403 Forbidden` - No access

---

### Update Comment

**PATCH** `/api/comments/{id}/`

Update a comment. Only the author or admin can update.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Updated content |

#### Example Request

```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated comment text"}' \
  https://api.example.com/api/comments/1/
```

#### Status Codes

- `200 OK` - Updated successfully
- `400 Bad Request` - Validation error
- `403 Forbidden` - Not author or admin
- `404 Not Found` - Comment not found

---

### Delete Comment

**DELETE** `/api/comments/{id}/`

Soft delete a comment. Only the author or admin can delete.

#### Example Request

```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  https://api.example.com/api/comments/1/
```

#### Status Codes

- `204 No Content` - Deleted successfully
- `403 Forbidden` - Not author or admin
- `404 Not Found` - Comment not found

---

## WebSocket Real-time Updates

### Connection

Connect to the WebSocket endpoint for real-time comment updates:

```
ws://localhost:8000/ws/comments/{project_id}/
wss://example.com/ws/comments/{project_id}/
```

### Messages

#### Subscribe

```json
{"type": "subscribe"}
```

#### Ping (Keep-alive)

```json
{"type": "ping"}
```

### Events Received

#### Comment Created

```json
{
  "type": "comment_created",
  "project_id": 1,
  "timestamp": "2025-01-15T11:30:00Z",
  "comment": {
    "id": 3,
    "content": "New comment",
    "author": {...},
    "created_at": "2025-01-15T11:30:00Z"
  }
}
```

#### Comment Updated

```json
{
  "type": "comment_updated",
  "project_id": 1,
  "timestamp": "2025-01-15T11:35:00Z",
  "comment": {
    "id": 3,
    "content": "Updated comment",
    "updated_at": "2025-01-15T11:35:00Z",
    "is_edited": true
  }
}
```

#### Comment Deleted

```json
{
  "type": "comment_deleted",
  "project_id": 1,
  "timestamp": "2025-01-15T11:40:00Z",
  "comment": {"id": 3}
}
```

---

## Frontend Integration

### Using React Hooks

#### useComments

Fetch all comments for a project:

```typescript
import { useComments } from '@/hooks/useComments';

export function ProjectComments({ projectId }) {
  const { data: comments, isLoading, error } = useComments(projectId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <CommentList
      comments={comments || []}
      currentUserId={currentUser.id}
    />
  );
}
```

#### useCreateComment

Create a new comment:

```typescript
import { useCreateComment } from '@/hooks/useComments';

export function AddComment({ projectId }) {
  const { mutate: createComment, isPending } = useCreateComment(projectId);

  const handleSubmit = (content) => {
    createComment({ content, project_id: projectId });
  };

  return <CommentForm onSubmit={handleSubmit} isLoading={isPending} />;
}
```

#### useCommentWebSocket

Real-time updates:

```typescript
import { useCommentWebSocket } from '@/hooks/useCommentWebSocket';

export function RealtimeComments({ projectId }) {
  const { isConnected } = useCommentWebSocket({
    projectId,
    enabled: true,
    onStatusChange: (status) => console.log('WebSocket:', status),
  });

  return <div>{isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>;
}
```

### Components

#### CommentItem

Display a single comment:

```typescript
<CommentItem
  id={comment.id}
  content={comment.content}
  author={comment.author}
  created_at={comment.created_at}
  updated_at={comment.updated_at}
  is_edited={comment.is_edited}
  reply_count={comment.reply_count}
  isAuthor={comment.author.id === currentUserId}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onReply={handleReply}
/>
```

#### CommentList

Display multiple comments:

```typescript
<CommentList
  comments={comments}
  currentUserId={userId}
  isLoading={isLoading}
  isEmpty={comments.length === 0}
  onEditComment={handleEdit}
  onDeleteComment={handleDelete}
  onReplyComment={handleReply}
/>
```

#### CommentForm

Create or edit comments:

```typescript
<CommentForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={isPending}
  placeholder="Add a comment..."
  maxLength={5000}
  submitLabel="Post"
/>
```

#### CommentThread

Display comment with nested replies:

```typescript
<CommentThread
  id={comment.id}
  content={comment.content}
  author={comment.author}
  created_at={comment.created_at}
  replies={comment.replies}
  currentUserId={userId}
  onEditComment={handleEdit}
  onDeleteComment={handleDelete}
  onAddReply={handleReply}
/>
```

---

## Security

### Input Validation

- Comments are validated for length (max 5000 chars)
- Content is trimmed and sanitized
- XSS prevention via content sanitization

### Permissions

- Only authenticated users can comment
- Users can only edit/delete their own comments
- Project members can view comments
- Admins have full access

### Rate Limiting

Rate limiting is applied per user per endpoint to prevent abuse.

---

## Error Handling

All errors return standardized JSON responses:

```json
{
  "detail": "Error description",
  "code": "ERROR_CODE"
}
```

Common status codes:

- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid auth
- `403 Forbidden` - No permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Version conflict (optimistic locking)
- `429 Too Many Requests` - Rate limited
- `500 Server Error` - Internal error

---

## Best Practices

1. **Use React Query** for efficient data fetching and caching
2. **Enable WebSocket** for real-time updates
3. **Validate input** on client-side before submission
4. **Handle errors** gracefully with user feedback
5. **Use optimistic updates** for better UX
6. **Clean up subscriptions** on component unmount
7. **Implement pagination** for large comment lists
8. **Test permissions** thoroughly

---

## Examples

### Complete Comment Section

```typescript
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '@/hooks/useComments';
import { useCommentWebSocket } from '@/hooks/useCommentWebSocket';
import CommentList from '@/components/CommentList';
import CommentForm from '@/components/CommentForm';

export function CommentSection({ projectId, currentUserId }) {
  const { data: comments } = useComments(projectId);
  const { mutate: createComment } = useCreateComment(projectId);
  const { mutate: updateComment } = useUpdateComment();
  const { mutate: deleteComment } = useDeleteComment();

  useCommentWebSocket({ projectId });

  return (
    <div className="space-y-4">
      <CommentForm onSubmit={(content) => createComment({ content })} />
      <CommentList
        comments={comments || []}
        currentUserId={currentUserId}
        onEditComment={(id, content) => updateComment({ id, content })}
        onDeleteComment={(id) => deleteComment(id)}
      />
    </div>
  );
}
```
