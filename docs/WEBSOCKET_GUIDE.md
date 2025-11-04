# WebSocket and Real-Time Notifications Guide

## Overview

This application uses **Django Channels** with native WebSocket support to deliver real-time notifications to users. All changes to milestones, team members, and projects are instantly synchronized across connected clients using a Redis-backed channel layer.

## Architecture

### Technology Stack

- **Backend**: Django Channels 4.x with Daphne ASGI server
- **Frontend**: Native WebSocket API (no Socket.IO)
- **Message Broker**: Redis for channel layers
- **Authentication**: JWT tokens passed via query string
- **Protocol**: Standard WebSocket (ws://, wss://)

### Components

#### Backend

**`backend/core/consumers.py`** - WebSocket Consumer
- Handles WebSocket lifecycle (connect, disconnect, receive)
- Authenticates users via JWT token
- Manages group subscriptions for projects and user-specific rooms
- Routes incoming messages to appropriate handlers

**`backend/core/routing.py`** - URL Routing
- Maps `/ws/notifications/` route to NotificationConsumer
- Handles WebSocket protocol routing

**`backend/websocket_service/channels_broadcast.py`** - Broadcasting Utilities
- `notify_project_team()` - Send notification to all project members
- `broadcast_milestone_change()` - Broadcast milestone events
- `broadcast_team_member_change()` - Broadcast team member changes
- `broadcast_project_update()` - Broadcast project updates

#### Frontend

**`frontend/src/services/websocket.ts`** - WebSocket Service
- Singleton service managing WebSocket connection
- Handles authentication, subscription, and event routing
- Implements automatic reconnection with exponential backoff
- Event-based listener system

**`frontend/src/contexts/NotificationContext.tsx`** - Notification State
- Manages notification state and display
- Listens for WebSocket events
- Provides `useNotification()` hook to components

**`frontend/src/components/NotificationContainer.tsx`** - Notification UI
- Renders list of active notifications
- Manages toast display and auto-dismiss

**`frontend/src/components/NotificationToast.tsx`** - Toast Component
- Individual notification toast with styling
- Auto-dismiss timer and manual close button
- Different styles for success, error, warning, info types

## Event Types

### Notification Events

All notifications follow this structure:

```json
{
  "type": "notification_received",
  "title": "Milestone Created",
  "message": "Milestone 'Sprint 1' has been created",
  "event_type": "milestone_created",
  "actor": {
    "id": 1,
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe"
  },
  "project_id": 2,
  "project_title": "Mobile App",
  "timestamp": "2025-10-24T12:30:45.123456+00:00"
}
```

### Milestone Events

- `milestone_created` - New milestone added
- `milestone_updated` - Milestone progress or details changed
- `milestone_deleted` - Milestone removed

### Team Member Events

- `team_member_added` - User added to project
- `team_member_updated` - User role or capacity changed
- `team_member_removed` - User removed from project

### Project Events

- `project_created` - New project added
- `project_updated` - Project details changed
- `project_deleted` - Project soft-deleted

### Error Events

- `connection_error` - WebSocket connection failed
- `connection_lost` - Reconnection attempts exhausted

## Connection Flow

### Initial Connection

1. Frontend loads and user logs in
2. App.tsx calls `useWebSocket({ autoConnect: true })`
3. WebSocket service retrieves JWT token from localStorage
4. Connects to `ws://localhost:8000/ws/notifications/?token={jwt}`
5. Backend consumer authenticates token
6. User added to personal room (`user_{user_id}`)

### Subscribing to Project

1. User navigates to project detail page
2. Component calls `wsService.subscribe(projectId)`
3. Client sends message: `{ type: 'subscribe_project', project_id: 123 }`
4. Consumer adds user to project room (`project_123`)
5. User now receives all project notifications

### Receiving Notification

1. Backend action (create milestone, etc.) triggers broadcast
2. `notify_project_team()` called with event details
3. Message sent to Redis channel layer
4. Sent to all users in project room via WebSocket
5. Frontend receives message and emits 'notification_received' event
6. NotificationContext listener creates notification toast
7. Toast displays for 5 seconds (configurable) then auto-dismisses

## Error Handling

### Connection Failures

When WebSocket connection fails:

```
User sees: "WebSocket connection failed" (red toast)
Action: Service automatically attempts reconnection
Backoff: 1s, 2s, 4s, 8s, 16s (exponential)
Max attempts: 5
```

### Max Reconnection Reached

After 5 failed reconnection attempts:

```
User sees: "Unable to reconnect to server. Please refresh the page." (red toast)
Action: User must manually refresh browser to attempt new connection
```

### Server Errors

Mutation errors show user-friendly messages:

```
"Failed to create milestone"
"Failed to update team member"
"Failed to delete project"
```

## Integration Points

### Backend Notification Triggers

1. **Milestone Operations** (`backend/projects/views.py`)
   - MilestoneViewSet.create() → `notify_project_team()`
   - MilestoneViewSet.update() → `notify_project_team()`
   - MilestoneViewSet.destroy() → `notify_project_team()`

2. **Team Member Operations** (`backend/projects/views.py`)
   - add_team_member() → `notify_project_team()`
   - update_team_member() → `notify_project_team()`
   - remove_team_member() → `notify_project_team()`

3. **Project Operations** (`backend/projects/views.py`)
   - ProjectViewSet.create() → `notify_project_team()`
   - ProjectViewSet.update() → `notify_project_team()`
   - ProjectViewSet.destroy() → `notify_project_team()`

### Frontend Integration

1. **Components** listen to WebSocket events:
   ```typescript
   wsService.on('milestone_changed', (data) => {
     // Refetch data from server
   })
   ```

2. **Mutations** have error callbacks:
   ```typescript
   useMutation({
     onError: (error) => {
       addNotification({
         type: 'error',
         message: 'Operation failed'
       })
     }
   })
   ```

## Configuration

### Environment Variables

**Backend** (`backend/.env`):
```
REDIS_HOST=redis
REDIS_PORT=6379
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

**Frontend** (`.env`):
```
VITE_WS_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000/api
```

### Settings

**Backend** (`backend/config/settings.py`):
```python
# Channel Layer Configuration
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(os.getenv('REDIS_HOST', 'redis'), int(os.getenv('REDIS_PORT', 6379)))],
        },
    },
}
```

## Performance Considerations

1. **Message Size**: Keep notification payloads under 1MB
2. **Frequency**: Rate limit notifications per user to prevent flooding
3. **Connection Pooling**: Redis supports multiple concurrent connections
4. **Timeout**: WebSocket timeout set to 60s with ping every 25s
5. **Memory**: Each connected user holds open one WebSocket connection

## Debugging

### Enable WebSocket Logging

**Backend** (`backend/config/settings.py`):
```python
LOGGING = {
    'loggers': {
        'channels': {
            'level': 'DEBUG',
        }
    }
}
```

### Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Click on WebSocket connection
5. View Messages tab to see all sent/received messages

### Common Issues

**Issue**: WebSocket connection refused
- Check backend is running: `docker logs project_dashboard_backend_dev`
- Verify Redis is running: `docker logs project_dashboard_redis_dev`
- Check ALLOWED_HOSTS setting

**Issue**: Notifications not appearing
- Check browser console for errors (F12 → Console)
- Verify JWT token is valid: Check localStorage in DevTools
- Check NotificationContext is rendered in App.tsx

**Issue**: Frequent disconnections
- Check network stability
- Increase ping timeout in settings
- Check Redis memory usage

## Testing

### Unit Tests

Run frontend WebSocket tests:
```bash
cd frontend
npm run test:unit -- useWebSocket.test.ts
```

Run backend consumer tests:
```bash
cd backend
pytest core/test_consumers.py -v
```

### Integration Tests

Test notification flow manually:
1. Open two browser windows as different users
2. In window 1: Create a milestone
3. In window 2: Should see notification appear instantly
4. Close window 1 tab
5. Window 1 should close WebSocket connection
6. Verify no error messages in window 2

### Load Testing

For large numbers of concurrent users:
```bash
# Use Artillery for load testing
npm install -g artillery
artillery quick --count 100 --num 10 ws://localhost:8000/ws/notifications/
```

## Best Practices

1. **Always cleanup listeners** on component unmount
   ```typescript
   useEffect(() => {
     wsService.on('event', handler)
     return () => wsService.off('event', handler)
   }, [])
   ```

2. **Handle errors gracefully**
   ```typescript
   onError: (error) => {
     addNotification({
       type: 'error',
       message: 'User-friendly message'
     })
   }
   ```

3. **Invalidate caches on updates**
   ```typescript
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ['items'] })
   }
   ```

4. **Filter events by project_id**
   ```typescript
   if (payload.project_id === currentProjectId) {
     // Process event
   }
   ```

## Future Enhancements

- [ ] Persistent message queue for offline users
- [ ] Message encryption for sensitive data
- [ ] Notification history/archive
- [ ] User notification preferences
- [ ] Batch notifications for high-frequency events
- [ ] Support for push notifications
- [ ] Activity feed component
