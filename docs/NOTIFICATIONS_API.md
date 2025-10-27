# Notifications API Reference

## WebSocket Connection

### Endpoint

```
ws://localhost:8000/ws/notifications/?token={jwt_token}
wss://production-domain.com/ws/notifications/?token={jwt_token}
```

### Authentication

JWT token passed as query parameter. Token must be valid and not expired.

**Example:**
```typescript
const token = localStorage.getItem('access_token')
const url = `ws://localhost:8000/ws/notifications/?token=${encodeURIComponent(token)}`
const ws = new WebSocket(url)
```

### Connection Response

**Success (HTTP 101 Switching Protocols)**
- WebSocket connection established
- User added to personal room: `user_{user_id}`
- Ready to receive notifications

**Failure (HTTP 403 Forbidden)**
- Invalid or expired token
- Connection closed immediately

## Subscription Messages

### Subscribe to Project

**Request:**
```json
{
  "type": "subscribe_project",
  "project_id": 123
}
```

**Response:** No response, user silently added to room `project_123`

**Example:**
```typescript
wsService.subscribe(123) // Sends above message
```

### Unsubscribe from Project

**Request:**
```json
{
  "type": "unsubscribe_project",
  "project_id": 123
}
```

**Response:** No response, user silently removed from room `project_123`

**Example:**
```typescript
wsService.unsubscribe(123) // Sends above message
```

## Notification Messages

### Notification Received

**Message from Server:**
```json
{
  "type": "notification_received",
  "title": "Milestone Created",
  "message": "Milestone 'Sprint Planning' has been created",
  "event_type": "milestone_created",
  "timestamp": "2025-10-24T14:30:00Z",
  "actor": {
    "id": 5,
    "username": "jane_smith",
    "first_name": "Jane",
    "last_name": "Smith"
  },
  "project_id": 2,
  "project_title": "Mobile App Development",
  "data": {
    "id": 42,
    "title": "Sprint Planning",
    "progress": 0
  }
}
```

**Frontend Handler:**
```typescript
wsService.on('notification_received', (data) => {
  // Data structure as above
  console.log(`${data.title}: ${data.message}`)
})
```

## Event Types Reference

### Milestone Events

#### milestone_created
**When:** New milestone added to project
**Fields:**
- `title`: "Milestone Created"
- `message`: "Milestone '{title}' has been created"
- `data.id`: Milestone ID
- `data.title`: Milestone title
- `data.progress`: Initial progress (0)

#### milestone_updated
**When:** Milestone progress or details changed
**Fields:**
- `title`: "Milestone Updated"
- `message`: "Milestone '{title}' has been updated"
- `data.id`: Milestone ID
- `data.title`: Updated title
- `data.progress`: Updated progress percentage

#### milestone_deleted
**When:** Milestone removed
**Fields:**
- `title`: "Milestone Deleted"
- `message`: "Milestone '{title}' has been deleted"
- `data.id`: Deleted milestone ID
- `data.title`: Deleted milestone title

### Team Member Events

#### team_member_added
**When:** User added to project
**Fields:**
- `title`: "Team Member Added"
- `message`: "A new team member has been added to '{project_title}'"
- `data.user_id`: User ID
- `data.role`: Role name
- `data.capacity`: Assigned capacity

#### team_member_updated
**When:** Team member role or capacity changed
**Fields:**
- `title`: "Team Member Updated"
- `message`: "A team member has been updated in '{project_title}'"
- `data.user_id`: User ID
- `data.role`: New role
- `data.capacity`: New capacity

#### team_member_removed
**When:** User removed from project
**Fields:**
- `title`: "Team Member Removed"
- `message`: "A team member has been removed from '{project_title}'"
- `data.user_id`: Removed user ID

### Project Events

#### project_created
**When:** New project created
**Fields:**
- `title`: "Project Created"
- `message`: "Project '{title}' has been created"
- `data.id`: Project ID
- `data.title`: Project title
- `data.status`: Project status

#### project_updated
**When:** Project details changed
**Fields:**
- `title`: "Project Updated"
- `message`: "Project '{title}' has been updated"
- `data.id`: Project ID
- `data.title`: Updated title
- `data.status`: Updated status

#### project_deleted
**When:** Project soft-deleted
**Fields:**
- `title`: "Project Deleted"
- `message`: "Project '{title}' has been deleted"
- `data.id`: Project ID
- `data.title`: Deleted project title

## Error Messages

### error - connection_error

**When:** WebSocket connection fails to establish

**Message:**
```json
{
  "type": "error",
  "message": "WebSocket connection failed"
}
```

**Frontend Response:**
```typescript
wsService.on('error', (data) => {
  if (data.type === 'connection_error') {
    showErrorToast('Connection failed, reconnecting...')
    // Service automatically retries with exponential backoff
  }
})
```

### error - connection_lost

**When:** Max reconnection attempts exceeded

**Message:**
```json
{
  "type": "error",
  "message": "Unable to reconnect to server. Please refresh the page."
}
```

**Frontend Response:**
```typescript
wsService.on('error', (data) => {
  if (data.type === 'connection_lost') {
    showErrorToast('Connection lost. Please refresh the page.')
    // User must manually refresh
  }
})
```

## Mutation Errors

### Create/Update/Delete Operations

When API calls fail, mutations emit error notifications:

**Example - Create Milestone Error:**
```json
{
  "type": "error",
  "message": "Failed to create milestone",
  "description": "Title is required"
}
```

**Frontend Handler:**
```typescript
useMutation({
  onError: (error) => {
    addNotification({
      type: 'error',
      message: 'Failed to create milestone',
      description: error.response?.data?.detail,
      duration: 7000
    })
  }
})
```

## Notification Context Hook

### useNotification()

Hook for adding notifications from any component:

```typescript
import { useNotification } from '@/contexts/NotificationContext'

function MyComponent() {
  const { addNotification } = useNotification()

  const handleAction = () => {
    addNotification({
      type: 'success',
      message: 'Action completed!',
      description: 'Details here',
      duration: 5000 // auto-dismiss after 5 seconds
    })
  }

  return <button onClick={handleAction}>Do Action</button>
}
```

### Parameters

- `type`: 'success' | 'error' | 'warning' | 'info'
- `message`: Main message (required)
- `description`: Optional detailed text
- `duration`: Auto-dismiss after N milliseconds (0 = permanent)

## Rate Limiting

No rate limiting currently enforced, but recommended:

- Max 10 notifications per user per minute
- Max 100 concurrent WebSocket connections per project
- Max 1000 total concurrent WebSocket connections per server

## Message Size Limits

- Max message size: 1 MB
- Recommended max: 10 KB for optimal performance
- Larger payloads should be split into multiple messages

## Connection Limits

- Idle timeout: 60 seconds
- Ping interval: 25 seconds
- Max reconnection attempts: 5
- Backoff delays: 1s, 2s, 4s, 8s, 16s

## Examples

### React Component Listening to Notifications

```typescript
import { useWebSocket } from '@/hooks/useWebSocket'

function ProjectDetail() {
  const { on, off } = useWebSocket()

  useEffect(() => {
    const handleMilestoneChange = (data) => {
      if (data.project_id === projectId) {
        // Refresh milestone data
        queryClient.invalidateQueries({ queryKey: ['milestones'] })
      }
    }

    on('milestone_changed', handleMilestoneChange)

    return () => {
      off('milestone_changed', handleMilestoneChange)
    }
  }, [projectId])

  return <div>{/* Component content */}</div>
}
```

### Broadcasting from Backend

```python
from websocket_service.channels_broadcast import notify_project_team

# After creating milestone
notify_project_team(
    project=project,
    event_type='milestone_created',
    actor_user=request.user,
    title='Milestone Created',
    message=f"Milestone '{milestone.title}' has been created",
    exclude_user=request.user
)
```

## Troubleshooting

### Messages Not Received

1. Check WebSocket is connected: `wsService.isConnected()`
2. Verify subscribed to correct project: `wsService.subscribe(projectId)`
3. Check browser console for errors
4. Verify backend is broadcasting: Check logs

### Frequent Disconnections

1. Check network stability (DevTools Network tab)
2. Verify Redis is running: `docker ps | grep redis`
3. Check backend logs: `docker logs project_dashboard_backend_dev`
4. Increase timeout in settings if needed

### Notifications Not Showing

1. Verify NotificationProvider wraps app
2. Check NotificationContext is using correct hooks
3. Verify mutation has onError callback
4. Check toast component is rendered in DOM

## Performance Tips

1. **Debounce subscription changes**: Don't subscribe/unsubscribe rapidly
2. **Filter events early**: Check project_id before processing
3. **Clean up listeners**: Always remove in useEffect cleanup
4. **Batch updates**: Combine multiple changes into single notification
5. **Lazy load**: Only connect WebSocket when needed
