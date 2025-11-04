# Project Management Dashboard - Code Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Backend (Django) Documentation](#backend-django-documentation)
3. [Frontend (React) Documentation](#frontend-react-documentation)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [WebSocket Events](#websocket-events)
7. [State Management](#state-management)
8. [Key Algorithms](#key-algorithms)

---

## Architecture Overview

### System Architecture
```
┌─────────────────┐
│   React SPA     │  Frontend: React 19 + TypeScript + Vite
│  (Port 3000)    │  State: Zustand + React Query
└────────┬────────┘
         │ HTTP/WS
         ↓
┌─────────────────┐
│     Nginx       │  Reverse Proxy + Load Balancer
│  (Port 80/443)  │  SSL/TLS Termination
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Django API     │  Backend: Django 5.1.3 + DRF
│  (Port 8000)    │  ASGI: Daphne (WebSocket support)
└────────┬────────┘
         │
    ┌────┴────┬─────────┐
    ↓         ↓         ↓
┌────────┐ ┌────┐ ┌──────────┐
│Postgres│ │Redis│ │Daphne    │
│  DB    │ │Cache│ │WebSocket │
└────────┘ └────┘ └──────────┘
```

### Technology Stack

**Backend:**
- Django 5.1.3 - Web framework
- Django REST Framework 3.14.0 - API framework
- Django Channels 4.1.0 - WebSocket support
- Daphne 4.1.2 - ASGI server for WebSocket and async support
- PostgreSQL 15 - Primary database
- Redis 7 - Cache + message broker for WebSocket channel layer
- Elasticsearch 8.14.0 - Full-text search via django-haystack

**Frontend:**
- React 19.0.0 - UI library
- TypeScript 5.7.2 - Type safety
- Vite 7.0.0 - Build tool
- Zustand 5.0.1 - State management
- React Query 5.55.0 - Server state
- Axios 1.7.7 - HTTP client
- Socket.IO 4.8.1 - WebSocket client
- Tailwind CSS 4.0.1 - Styling

---

## Backend (Django) Documentation

### Project Structure
```
backend/
├── config/              # Django settings and configuration
├── core/               # Core utilities and shared code
│   ├── utils.py        # Helper functions
│   ├── permissions.py  # Custom permissions
│   └── exceptions.py   # Custom exceptions
├── projects/           # Main projects application
│   ├── models.py       # Data models
│   ├── views.py        # API views
│   ├── serializers.py  # DRF serializers
│   ├── urls.py         # URL routing
│   ├── signals.py      # Django signals
│   ├── admin.py        # Admin interface
│   └── management/     # Management commands
└── websocket_service/  # Real-time WebSocket handlers
```

### Models

#### BaseModel (Abstract)
Base model providing common functionality for all models.

**Fields:**
- `created_at` (DateTime) - Auto-set on creation
- `updated_at` (DateTime) - Auto-updated on save
- `deleted_at` (DateTime, nullable) - Soft delete timestamp
- `version` (Integer) - Optimistic concurrency version
- `etag` (String) - MD5 hash for concurrency control

**Methods:**
- `save()` - Generates ETag before saving
- `generate_etag()` - Creates MD5 hash from model data
- `soft_delete()` - Marks record as deleted without removing
- `restore()` - Undeletes a soft-deleted record
- `is_deleted()` - Returns boolean if record is deleted

**Managers:**
- `objects` - Default manager (excludes deleted)
- `all_objects` - Includes soft-deleted records

#### Project Model
Main model representing a project.

**Fields:**
- `title` (String, max 255) - Project name (indexed)
- `description` (Text) - Project description
- `owner` (ForeignKey → User) - Project owner
- `status` (Choice) - active, on_hold, archived, completed
- `health` (Choice) - healthy, at_risk, critical
- `progress` (Integer, 0-100) - Completion percentage
- `start_date` (Date, nullable) - Project start
- `end_date` (Date, nullable) - Project deadline
- `tags` (ManyToMany → Tag) - Associated tags
- `team_members` (ManyToMany → User through TeamMember)

**Properties:**
- `days_until_deadline` - Days remaining (negative if overdue)
- `team_count` - Number of team members
- `milestone_count` - Total milestones
- `completed_milestone_count` - Completed milestones
- `risk_level` - Calculated risk (low, medium, high, critical)
- `duration_display` - Formatted date range

**Methods:**
- `get_team_roster()` - Returns team with roles and capacity
- `calculate_milestone_progress()` - Average milestone progress

**Indexes:**
- `status, owner` - Composite index
- `health` - Single field index
- `created_at` - Single field index
- `deleted_at` - Soft delete queries

#### Tag Model
Project categorization tags.

**Fields:**
- `name` (String, max 50, unique) - Tag name
- `color` (String, max 7) - Hex color code (default: #3B82F6)
- `description` (Text) - Tag description

#### Role Model
Team member role definitions.

**Fields:**
- `key` (String, unique) - Role identifier (e.g., 'lead', 'developer')
- `display_name` (String) - Human-readable name
- `description` (Text) - Role responsibilities
- `color` (String) - Color identifier
- `bg_color` (String) - Tailwind background class
- `text_color` (String) - Tailwind text class
- `border_color` (String) - Tailwind border class
- `sort_order` (Integer) - Display order

**Default Roles:**
- Lead (Project Lead) - Full project control
- Developer - Code implementation
- Designer - UI/UX design
- QA - Quality assurance testing
- Manager - Project oversight
- Stakeholder - Read-only access

#### TeamMember Model
Links users to projects with roles.

**Fields:**
- `project` (ForeignKey → Project)
- `user` (ForeignKey → User)
- `role` (ForeignKey → Role)
- `capacity` (Integer, 0-100) - Percentage allocation

**Constraints:**
- Unique together: (project, user)

#### Milestone Model
Project milestones for tracking progress.

**Fields:**
- `project` (ForeignKey → Project)
- `title` (String, max 255) - Milestone name
- `description` (Text) - Milestone details
- `due_date` (Date) - Deadline
- `progress` (Integer, 0-100) - Completion percentage

#### Activity Model
Event tracking for project changes.

**Fields:**
- `project` (ForeignKey → Project)
- `activity_type` (Choice) - Event type
- `user` (ForeignKey → User) - Who performed action
- `description` (Text) - Event description
- `metadata` (JSON) - Additional structured data

**Activity Types:**
- created, updated, status_changed, health_changed
- team_added, team_removed
- milestone_added, milestone_completed
- progress_updated, comment_added
- restored, bulk_updated

#### ProjectBulkOperation Model
Tracks bulk operations for atomic updates.

**Fields:**
- `operation_type` (String) - Operation name
- `status` (Choice) - pending, processing, completed, failed
- `projects` (ManyToMany → Project) - Affected projects
- `changes` (JSON) - Applied changes
- `performed_by` (ForeignKey → User)
- `error_message` (Text) - Error details if failed

### Serializers

#### ProjectListSerializer
Lightweight serializer for project listings.

**Fields:** id, title, status, health, progress, owner (nested), tags (nested), team_count, milestone_count, created_at, updated_at, etag

#### ProjectDetailSerializer
Full project details with relationships.

**Includes:** All list fields + description, start_date, end_date, team_roster, milestones, activities, risk_level, days_until_deadline

#### ProjectCreateUpdateSerializer
Write-only serializer for creating/updating projects.

**Validation:**
- End date must be after start date
- Progress must be 0-100
- User must have edit permissions

#### TagSerializer, RoleSerializer, TeamMemberSerializer
Standard CRUD serializers for respective models.

#### BulkUpdateSerializer
Handles bulk operations on multiple projects.

**Fields:**
- `project_ids` (List[int]) - Projects to update
- `updates` (Dict) - Fields to change
- `etag` (String, optional) - For concurrency control

### ViewSets

#### ProjectViewSet
Main API for project CRUD operations.

**Endpoints:**
- `GET /api/projects/` - List projects (paginated, filtered)
- `POST /api/projects/` - Create project
- `GET /api/projects/{id}/` - Get project details
- `PUT /api/projects/{id}/` - Update project
- `PATCH /api/projects/{id}/` - Partial update
- `DELETE /api/projects/{id}/` - Soft delete
- `POST /api/projects/{id}/restore/` - Restore deleted
- `POST /api/projects/bulk_update/` - Bulk operations
- `GET /api/projects/deleted/` - List deleted projects

**Filters:**
- `status` - Filter by status
- `health` - Filter by health
- `owner` - Filter by owner ID
- `tags` - Filter by tag IDs
- `search` - Full-text search (title, description, tags)

**Ordering:**
- `title`, `created_at`, `updated_at`, `progress`
- Prefix with `-` for descending (e.g., `-created_at`)

**Pagination:**
- Default: 20 items per page
- Query params: `page`, `page_size`

**Permissions:**
- Authenticated users only
- Admin can see/edit all projects
- Owner can see/edit their projects
- Team members can see their projects
- Lead/Manager roles can edit projects
- Stakeholders have read-only access

### Permissions

#### Permission Functions
Located in `views.py`:

**`get_user_project_role(user, project)`**
Returns the role key of user in project, or None.

**`can_edit_project(user, project)`**
Returns True if user can modify project.
- Admin: always True
- Owner: always True
- Team members with 'lead' or 'manager' roles: True
- Others: False

**`can_view_project_details(user, project)`**
Returns True if user can view project.
- Admin: always True
- Owner: always True
- Team members: True
- Others: False

**`is_read_only_role(user, project)`**
Returns True if user has read-only access.
- Stakeholders: True
- Others: False

### Utility Functions

Located in `core/utils.py`:

**`bulk_update_with_transaction(model_class, updates, filter_kwargs)`**
Performs atomic bulk updates using database transactions.
Returns: Number of objects updated

**`paginated_response(queryset, page, page_size)`**
Returns paginated data with metadata.
Returns: `{ results: [], count: int, next: str, previous: str }`

**`calculate_progress(completed, total)`**
Calculates percentage progress.
Returns: Integer 0-100

### WebSocket Broadcasting

Located in `websocket_service/channels_broadcast.py`:

**`broadcast_project_update(project_id, action, data)`**
Broadcasts project changes to all connected clients.

**`broadcast_team_member_change(project_id, action, member_data)`**
Notifies team composition changes.

**`broadcast_milestone_change(project_id, action, milestone_data)`**
Notifies milestone updates.

**`notify_project_team(project_id, message)`**
Sends notification to all project team members.

### Management Commands

**`python manage.py seed_database`**
Populates database with sample data for testing.
- Creates users, projects, tags, team members, milestones
- Options: `--clear` to wipe existing data first

**`python manage.py generate_report`**
Generates project statistics and reports.
- Export formats: JSON, CSV, PDF

---

## Frontend (React) Documentation

### Project Structure
```
frontend/src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── ProjectForm.tsx # Project create/edit form
│   ├── RiskBadge.tsx   # Risk level indicator
│   └── ...
├── pages/              # Page components (routes)
│   ├── Dashboard.tsx   # Main dashboard
│   ├── ProjectList.tsx # Project listing
│   ├── ProjectDetail.tsx # Single project view
│   └── Login.tsx       # Authentication
├── services/           # API and WebSocket clients
│   ├── api.ts         # Axios HTTP client
│   └── websocket.ts   # Socket.IO client
├── stores/            # Zustand state stores
│   ├── authStore.ts   # Authentication state
│   └── projectStore.ts # Project state
├── hooks/             # Custom React hooks
│   ├── useAsync.ts    # Async operation handler
│   ├── useDebounce.ts # Value debouncing
│   └── useWebSocket.ts # WebSocket connection
├── contexts/          # React contexts
│   └── NotificationContext.tsx # Toast notifications
├── types/             # TypeScript type definitions
│   └── index.ts
└── utils/             # Helper functions
    └── permissions.ts  # Permission checking
```

### Types

#### Project Type
```typescript
interface Project {
  id: number
  title: string
  description: string
  status: 'active' | 'on_hold' | 'archived' | 'completed'
  health: 'healthy' | 'at_risk' | 'critical'
  progress: number  // 0-100
  start_date?: string  // ISO date
  end_date?: string    // ISO date
  owner: User
  tags: Tag[]
  team_count: number
  milestone_count: number
  completed_milestone_count: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  days_until_deadline?: number
  created_at: string
  updated_at: string
  etag: string
  
  // Detailed view only
  team_roster?: TeamMember[]
  milestones?: Milestone[]
  activities?: Activity[]
}
```

#### User Type
```typescript
interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_admin: boolean
}
```

#### Tag Type
```typescript
interface Tag {
  id: number
  name: string
  color: string  // Hex color
  description: string
  created_at: string
}
```

#### TeamMember Type
```typescript
interface TeamMember {
  id: number
  user: User
  role: Role
  capacity: number  // 0-100%
  created_at: string
}
```

#### Role Type
```typescript
interface Role {
  id: number
  key: string
  display_name: string
  description: string
  color: string
  bg_color: string      // Tailwind class
  text_color: string    // Tailwind class
  border_color: string  // Tailwind class
  sort_order: number
}
```

### Services

#### API Service (`services/api.ts`)

**Configuration:**
- Base URL: `VITE_API_BASE_URL` or `/api`
- Timeout: 30 seconds
- Max retries: 3
- Retry delay: Exponential backoff

**Features:**
- Automatic JWT token injection
- Token refresh on 401 errors
- Retry on network/5xx errors
- Request/response interceptors

**Methods:**

**Projects:**
```typescript
api.get('/projects/')                          // List projects
api.get('/projects/?status=active')            // Filtered list
api.get('/projects/?search=dashboard')         // Search
api.get('/projects/{id}/')                     // Get details
api.post('/projects/', data)                   // Create
api.put('/projects/{id}/', data)               // Update
api.patch('/projects/{id}/', data)             // Partial update
api.delete('/projects/{id}/')                  // Soft delete
api.post('/projects/{id}/restore/')            // Restore
api.post('/projects/bulk_update/', data)       // Bulk operations
api.get('/projects/deleted/')                  // Deleted list
```

**Authentication:**
```typescript
api.post('/auth/login/', { username, password })
api.post('/auth/token/refresh/', { refresh })
api.post('/auth/logout/')
```

**Tags:**
```typescript
api.get('/tags/')                    // List tags
api.post('/tags/', { name, color })  // Create tag
api.get('/tags/{id}/')               // Get tag
api.put('/tags/{id}/', data)         // Update tag
api.delete('/tags/{id}/')            // Delete tag
```

**Team Members:**
```typescript
api.get('/projects/{id}/team/')               // Get team roster
api.post('/projects/{id}/team/', member_data) // Add member
api.delete('/projects/{id}/team/{member_id}/')// Remove member
```

**Milestones:**
```typescript
api.get('/projects/{id}/milestones/')           // Get milestones
api.post('/projects/{id}/milestones/', data)    // Add milestone
api.patch('/milestones/{id}/', { progress })    // Update progress
api.delete('/milestones/{id}/')                 // Delete milestone
```

#### WebSocket Service (`services/websocket.ts`)

**Connection:**
```typescript
const socket = io(VITE_WS_URL, {
  auth: { token: accessToken },
  transports: ['websocket', 'polling']
})
```

**Events:**

**Client → Server:**
- `join_project` - Subscribe to project updates
- `leave_project` - Unsubscribe from project

**Server → Client:**
- `project_updated` - Project data changed
- `team_member_added` - Member joined project
- `team_member_removed` - Member left project
- `milestone_updated` - Milestone changed
- `activity_created` - New activity logged
- `notification` - General notification

**Usage:**
```typescript
import { websocketService } from '@/services/websocket'

// Connect
websocketService.connect(accessToken)

// Subscribe to project
websocketService.joinProject(projectId)

// Listen for updates
websocketService.on('project_updated', (data) => {
  // Handle update
})

// Unsubscribe
websocketService.leaveProject(projectId)

// Disconnect
websocketService.disconnect()
```

### State Management

#### Auth Store (`stores/authStore.ts`)

**State:**
```typescript
{
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}
```

**Actions:**
- `login(username, password)` - Authenticate user
- `logout()` - Clear auth state
- `setUser(user)` - Update user info
- `setTokens(access, refresh)` - Store tokens
- `refreshToken()` - Get new access token

**Persistence:**
Tokens stored in localStorage for persistence across sessions.

#### Project Store (`stores/projectStore.ts`)

**State:**
```typescript
{
  projects: Project[]
  selectedProject: Project | null
  filters: ProjectFilters
  loading: boolean
  error: string | null
}
```

**Actions:**
- `setProjects(projects)` - Replace project list
- `setSelectedProject(project)` - Set current project
- `setFilters(filters)` - Update filter criteria
- `updateProject(project)` - Update single project in list
- `deleteProject(projectId)` - Remove from list
- `clearFilters()` - Reset all filters

**Filters:**
```typescript
interface ProjectFilters {
  status?: string
  health?: string
  owner?: number
  tags?: number[]
  search?: string
  page?: number
  page_size?: number
  ordering?: string
}
```

### Custom Hooks

#### useAsync Hook (`hooks/useAsync.ts`)
Manages async operations with proper cleanup.

**Usage:**
```typescript
const { status, data, error, execute } = useAsync(
  () => api.get('/projects/'),
  true  // Execute immediately
)

// status: 'idle' | 'pending' | 'success' | 'error'
```

**Features:**
- Race condition prevention
- Automatic cleanup on unmount
- Manual execution control
- Reset functionality

#### useDebounce Hook (`hooks/useDebounce.ts`)
Debounces rapidly changing values (e.g., search input).

**Usage:**
```typescript
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearch = useDebounce(searchTerm, 500)

// debouncedSearch updates 500ms after last change
```

#### useWebSocket Hook (`hooks/useWebSocket.ts`)
Manages WebSocket connection lifecycle.

**Usage:**
```typescript
const { connected, subscribe, unsubscribe } = useWebSocket()

useEffect(() => {
  if (projectId) {
    subscribe(`project:${projectId}`, handleUpdate)
    return () => unsubscribe(`project:${projectId}`)
  }
}, [projectId])
```

### Components

#### Layout Component
Provides consistent app structure with navigation.

**Props:** `children` (React.ReactNode)

**Features:**
- Responsive sidebar navigation
- User menu with logout
- Breadcrumb navigation
- Mobile-friendly hamburger menu

#### ProjectForm Component
Form for creating/editing projects.

**Props:**
- `project?: Project` - Existing project (edit mode)
- `onSubmit: (data) => void` - Submit handler
- `onCancel: () => void` - Cancel handler

**Features:**
- Form validation
- Date range validation
- Tag selection
- Status/health dropdowns
- Progress slider
- Error handling

#### RiskBadge Component
Visual indicator for project risk level.

**Props:**
- `level: 'low' | 'medium' | 'high' | 'critical'`
- `className?: string`

**Styling:**
- Low: Green
- Medium: Yellow
- High: Orange
- Critical: Red

#### TeamMemberManager Component
Manages project team members.

**Props:**
- `projectId: number`
- `teamMembers: TeamMember[]`
- `onUpdate: () => void`

**Features:**
- Add team members
- Remove team members
- Update roles
- Adjust capacity

#### MilestoneProgress Component
Displays milestone completion status.

**Props:**
- `milestones: Milestone[]`
- `projectId: number`

**Features:**
- Progress bars
- Due date indicators
- Overdue highlighting
- Edit milestone progress

### Pages

#### Dashboard Page
Overview with statistics and recent projects.

**Features:**
- Total project count
- Status breakdown
- Health metrics
- Recent activity feed
- Quick actions

#### ProjectList Page
Paginated list of projects with filters.

**Features:**
- Search by keyword
- Filter by status, health, tags, owner
- Sort by multiple fields
- Bulk selection
- Bulk operations
- Create new project button

#### ProjectDetail Page
Detailed view of single project.

**Features:**
- Full project information
- Team roster with roles
- Milestone tracking
- Activity timeline
- Edit/delete actions
- Real-time updates via WebSocket

#### Login Page
User authentication.

**Features:**
- Username/password form
- Remember me option
- Error handling
- Redirect after login

### Routing

```typescript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<Layout />}>
    <Route index element={<Dashboard />} />
    <Route path="projects" element={<ProjectList />} />
    <Route path="projects/new" element={<ProjectCreate />} />
    <Route path="projects/:id" element={<ProjectDetail />} />
    <Route path="projects/:id/edit" element={<ProjectEdit />} />
    <Route path="projects/deleted" element={<DeletedProjects />} />
  </Route>
</Routes>
```

**Protected Routes:**
All routes except `/login` require authentication.
Redirect to login if not authenticated.

---

## API Endpoints

### Complete API Reference

#### Authentication

**POST /api/auth/login/**
Login with credentials.
```json
Request: { "username": "john", "password": "pass123" }
Response: { "access": "token", "refresh": "token", "user": {...} }
```

**POST /api/auth/token/refresh/**
Refresh access token.
```json
Request: { "refresh": "refresh_token" }
Response: { "access": "new_access_token" }
```

**POST /api/auth/logout/**
Logout (invalidate refresh token).
```json
Request: { "refresh": "refresh_token" }
Response: { "detail": "Successfully logged out" }
```

#### Projects

**GET /api/projects/**
List projects with pagination and filters.

Query Parameters:
- `page` (int) - Page number
- `page_size` (int) - Items per page
- `status` (string) - Filter by status
- `health` (string) - Filter by health
- `owner` (int) - Filter by owner ID
- `tags` (int[]) - Filter by tag IDs
- `search` (string) - Search query
- `ordering` (string) - Sort field (prefix `-` for desc)

Response:
```json
{
  "count": 42,
  "next": "http://api/projects/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Dashboard Redesign",
      "status": "active",
      "health": "healthy",
      "progress": 65,
      "owner": {...},
      "tags": [...],
      "team_count": 5,
      "milestone_count": 8,
      "etag": "abc123",
      ...
    }
  ]
}
```

**POST /api/projects/**
Create new project.

Request:
```json
{
  "title": "New Project",
  "description": "Project description",
  "status": "active",
  "health": "healthy",
  "progress": 0,
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "tags": [1, 2, 3]
}
```

Response: Created project object (status 201)

**GET /api/projects/{id}/**
Get project details.

Response: Full project object with team_roster, milestones, activities

**PUT /api/projects/{id}/**
Full update of project.

Headers:
- `If-Match: {etag}` - Optional, for optimistic concurrency

Request: Complete project object
Response: Updated project object

**PATCH /api/projects/{id}/**
Partial update of project.

Headers:
- `If-Match: {etag}` - Optional

Request: Partial project object
Response: Updated project object

**DELETE /api/projects/{id}/**
Soft delete project.

Response: status 204 (No Content)

**POST /api/projects/{id}/restore/**
Restore soft-deleted project.

Response: Restored project object

**POST /api/projects/bulk_update/**
Bulk update multiple projects.

Request:
```json
{
  "project_ids": [1, 2, 3],
  "updates": {
    "status": "archived",
    "health": "healthy"
  }
}
```

Response:
```json
{
  "success": true,
  "updated_count": 3,
  "errors": []
}
```

**GET /api/projects/deleted/**
List soft-deleted projects.

Response: Paginated list of deleted projects

#### Tags

**GET /api/tags/**
List all tags.

**POST /api/tags/**
Create new tag.

Request:
```json
{
  "name": "Frontend",
  "color": "#3B82F6",
  "description": "Frontend development tasks"
}
```

**GET /api/tags/{id}/**
Get tag details.

**PUT /api/tags/{id}/**
Update tag.

**DELETE /api/tags/{id}/**
Delete tag.

#### Roles

**GET /api/roles/**
List all available roles.

Response:
```json
[
  {
    "id": 1,
    "key": "lead",
    "display_name": "Project Lead",
    "description": "Leads the project team",
    "color": "blue",
    "bg_color": "bg-blue-100",
    "text_color": "text-blue-700",
    "border_color": "border-blue-300",
    "sort_order": 1
  },
  ...
]
```

#### Team Members

**GET /api/projects/{id}/team/**
Get project team roster.

Response:
```json
[
  {
    "id": 1,
    "user": {...},
    "role": {...},
    "capacity": 80,
    "created_at": "2025-01-01T10:00:00Z"
  },
  ...
]
```

**POST /api/projects/{id}/team/**
Add team member to project.

Request:
```json
{
  "user_id": 5,
  "role": "developer",
  "capacity": 100
}
```

**PATCH /api/team-members/{id}/**
Update team member.

Request:
```json
{
  "role": "lead",
  "capacity": 50
}
```

**DELETE /api/team-members/{id}/**
Remove team member from project.

#### Milestones

**GET /api/projects/{id}/milestones/**
Get project milestones.

**POST /api/projects/{id}/milestones/**
Add milestone to project.

Request:
```json
{
  "title": "MVP Release",
  "description": "First public release",
  "due_date": "2025-06-01",
  "progress": 0
}
```

**PATCH /api/milestones/{id}/**
Update milestone progress.

Request:
```json
{
  "progress": 75
}
```

**DELETE /api/milestones/{id}/**
Delete milestone.

#### Activities

**GET /api/projects/{id}/activities/**
Get project activity timeline.

Response:
```json
[
  {
    "id": 1,
    "activity_type": "team_added",
    "user": {...},
    "description": "Added John Doe as Developer",
    "metadata": {"user_id": 5, "role": "developer"},
    "created_at": "2025-01-15T14:30:00Z"
  },
  ...
]
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │ (Django built-in)
│─────────────│
│ id          │
│ username    │
│ email       │
│ password    │
└──────┬──────┘
       │
       │ owner_id
       ↓
┌─────────────────────────┐
│       Project           │
│─────────────────────────│
│ id                      │
│ title                   │──┐
│ description             │  │
│ owner_id (FK)           │  │
│ status                  │  │
│ health                  │  │  ┌─────────────┐
│ progress                │  │  │  Activity   │
│ start_date              │  │  │─────────────│
│ end_date                │  │  │ id          │
│ created_at              │  └──│ project_id  │
│ updated_at              │     │ type        │
│ deleted_at              │     │ user_id     │
│ version                 │     │ description │
│ etag                    │     │ metadata    │
└──────┬──────────────────┘     │ created_at  │
       │                        └─────────────┘
       │
       │         ┌──────────────┐
       │         │  Milestone   │
       │         │──────────────│
       │         │ id           │
       └─────────│ project_id   │
       │         │ title        │
       │         │ description  │
       │         │ due_date     │
       │         │ progress     │
       │         │ created_at   │
       │         └──────────────┘
       │
       │  M:M    ┌──────────────┐
       ├─────────│  Tag         │
       │         │──────────────│
       │         │ id           │
       │         │ name         │
       │         │ color        │
       │         │ description  │
       │         └──────────────┘
       │
       │         ┌──────────────┐
       │  M:M    │ TeamMember   │
       └─────────│──────────────│
                 │ id           │
                 │ project_id   │
                 │ user_id      │
                 │ role_id      │
                 │ capacity     │
                 └──────┬───────┘
                        │
                        │  ┌──────────────┐
                        └──│  Role        │
                           │──────────────│
                           │ id           │
                           │ key          │
                           │ display_name │
                           │ color        │
                           │ sort_order   │
                           └──────────────┘
```

### SQL Schema

**Projects Table:**
```sql
CREATE TABLE projects_project (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES auth_user(id),
    status VARCHAR(20) DEFAULT 'active',
    health VARCHAR(20) DEFAULT 'healthy',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,
    version INTEGER DEFAULT 1,
    etag VARCHAR(32)
);

CREATE INDEX idx_project_status_owner ON projects_project(status, owner_id);
CREATE INDEX idx_project_health ON projects_project(health);
CREATE INDEX idx_project_created ON projects_project(created_at);
CREATE INDEX idx_project_deleted ON projects_project(deleted_at);
CREATE INDEX idx_project_title ON projects_project(title);
```

---

## WebSocket Events

### Event Flow

```
Client                          Server
  │                              │
  ├──connect(auth_token)────────→│
  │←─────connected───────────────┤
  │                              │
  ├──join_project(project_id)───→│
  │←─────joined──────────────────┤
  │                              │
  │                              │ (Project updated)
  │←─project_updated(data)───────┤
  │                              │
  │                              │ (Team member added)
  │←─team_member_added(data)─────┤
  │                              │
  ├──leave_project(project_id)──→│
  │←─────left────────────────────┤
  │                              │
  ├──disconnect()────────────────→│
```

### Event Reference

**Connection Events:**
- `connect` - WebSocket connection established
- `disconnect` - Connection closed
- `error` - Connection error

**Project Events:**
- `project_updated` - Project data changed
  ```json
  {
    "action": "update",
    "project_id": 1,
    "data": { "progress": 85, "status": "active" }
  }
  ```

- `project_deleted` - Project soft deleted
- `project_restored` - Project restored

**Team Events:**
- `team_member_added` - New team member
  ```json
  {
    "project_id": 1,
    "member": {
      "user_id": 5,
      "username": "john",
      "role": "developer"
    }
  }
  ```

- `team_member_removed` - Team member removed
- `team_member_updated` - Role/capacity changed

**Milestone Events:**
- `milestone_added` - New milestone created
- `milestone_updated` - Milestone progress changed
- `milestone_deleted` - Milestone removed

**Activity Events:**
- `activity_created` - New activity logged
  ```json
  {
    "project_id": 1,
    "activity": {
      "type": "status_changed",
      "description": "Status changed to Completed",
      "user": "admin",
      "timestamp": "2025-01-15T10:00:00Z"
    }
  }
  ```

**Notification Events:**
- `notification` - General notification
  ```json
  {
    "type": "info",
    "title": "Project Updated",
    "message": "Dashboard Redesign progress updated to 85%"
  }
  ```

---

## Key Algorithms

### Optimistic Concurrency Control

**ETag Generation:**
```python
def generate_etag(self):
    data = {
        'id': self.pk,
        'updated_at': str(self.updated_at),
    }
    etag_string = json.dumps(data, sort_keys=True).encode()
    self.etag = hashlib.md5(etag_string).hexdigest()
```

**Conflict Detection:**
```python
if request.headers.get('If-Match') != project.etag:
    raise OptimisticConcurrencyException(
        "Project has been modified. Please refresh and try again."
    )
```

### Progress Calculation

**Milestone-based Progress:**
```python
def calculate_milestone_progress(self):
    milestones = self.milestones.all()
    if not milestones.exists():
        return 0
    return sum(m.progress for m in milestones) // len(milestones)
```

### Risk Level Assessment

**Multi-factor Risk:**
```python
def risk_level(self):
    if self.health == 'critical':
        return 'critical'
    if self.days_until_deadline is not None:
        if self.days_until_deadline < 0:
            return 'critical'  # Overdue
        if self.days_until_deadline < 5:
            return 'high'  # Due soon
    if self.progress == 0 and self.days_until_deadline < 30:
        return 'medium'  # Not started, due soon
    return 'low'
```

### Soft Delete Query Optimization

**Custom Manager:**
```python
class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        # Automatically exclude deleted records
        return super().get_queryset().filter(deleted_at__isnull=True)
    
    def with_deleted(self):
        # Include deleted records when needed
        return super().get_queryset()
```

### Bulk Update Transaction

**Atomic Bulk Operations:**
```python
@transaction.atomic
def bulk_update(project_ids, updates):
    # Lock rows for update
    projects = Project.objects.select_for_update().filter(
        id__in=project_ids
    )
    
    # Apply changes
    for project in projects:
        for field, value in updates.items():
            setattr(project, field, value)
        project.save()
        
        # Log activity
        Activity.objects.create(
            project=project,
            activity_type='bulk_updated',
            changes=updates
        )
    
    return projects.count()
```

### Search Ranking

**Full-Text Search with PostgreSQL:**
```python
from django.contrib.postgres.search import SearchVector, SearchRank

queryset = Project.objects.annotate(
    search=SearchVector('title', 'description', 'tags__name')
).filter(
    search=search_query
).annotate(
    rank=SearchRank('search', search_query)
).order_by('-rank')
```

### Pagination Algorithm

**Cursor-based Pagination (for large datasets):**
```python
def paginate_queryset(queryset, cursor, page_size=20):
    if cursor:
        queryset = queryset.filter(id__lt=cursor)
    
    results = list(queryset[:page_size + 1])
    has_more = len(results) > page_size
    
    if has_more:
        results = results[:page_size]
        next_cursor = results[-1].id
    else:
        next_cursor = None
    
    return {
        'results': results,
        'next_cursor': next_cursor,
        'has_more': has_more
    }
```

---

## Performance Optimizations

### Database

1. **Query Optimization:**
   - Use `select_related()` for foreign keys
   - Use `prefetch_related()` for many-to-many
   - Add database indexes on frequently queried fields

2. **Caching Strategy:**
   - Redis caching for frequently accessed data
   - ETag-based HTTP caching
   - Query result caching with timeout

3. **Connection Pooling:**
   - PostgreSQL connection pooling (pgBouncer)
   - Redis connection pool

### Frontend

1. **Code Splitting:**
   - Route-based code splitting with React.lazy()
   - Dynamic imports for heavy components

2. **Memoization:**
   - React.memo for expensive components
   - useMemo for expensive calculations
   - useCallback for stable function references

3. **Virtual Scrolling:**
   - For large lists (100+ items)
   - Render only visible items

### Network

1. **Request Batching:**
   - Batch multiple API calls into one request
   - Debounce search requests

2. **Response Compression:**
   - Gzip compression in Nginx
   - Minimize JSON payload size

3. **Caching:**
   - Browser caching with cache headers
   - Service worker for offline support

---

## Security

### Authentication & Authorization

1. **JWT Tokens:**
   - Short-lived access tokens (15 min)
   - Long-lived refresh tokens (7 days)
   - HTTP-only cookies for tokens (production)

2. **Permission Checks:**
   - Row-level permissions
   - Role-based access control
   - Owner-based restrictions

3. **Rate Limiting:**
   - API rate limiting (100 req/min)
   - Login attempt throttling (5 attempts/min)

### Data Protection

1. **Input Validation:**
   - DRF serializer validation
   - SQL injection prevention (ORM)
   - XSS protection (React escaping)

2. **Output Encoding:**
   - JSON encoding for API responses
   - HTML escaping in templates

3. **HTTPS:**
   - SSL/TLS encryption
   - Secure cookie flags
   - HSTS headers

### API Security

1. **CORS Configuration:**
   - Whitelist allowed origins
   - Credential support

2. **CSRF Protection:**
   - CSRF tokens for state-changing requests
   - Double-submit cookie pattern

3. **Content Security Policy:**
   - Restrict resource loading
   - Prevent XSS attacks

---

## Testing

### Backend Tests

**Unit Tests:**
- Model methods
- Serializers
- Utility functions

**Integration Tests:**
- API endpoints
- Permission checks
- Database transactions

**Command:**
```bash
pytest backend/tests/ --cov --cov-report=html
```

### Frontend Tests

**Unit Tests:**
- Component rendering
- Hook behavior
- Utility functions

**Integration Tests:**
- User flows
- API integration
- State management

**Command:**
```bash
cd frontend && npm run test -- --coverage
```

---

## Deployment

### Development
```bash
docker-compose up
```

### Production (Kubernetes)
```bash
kubectl apply -f deployment/k8s/
```

### Environment Variables

**Backend (.env):**
```
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379/0
ELASTICSEARCH_URL=http://host:9200
ALLOWED_HOSTS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

**Frontend (.env):**
```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

---

## Troubleshooting

### Common Issues

**1. WebSocket connection fails:**
- Check Nginx WebSocket upgrade headers
- Verify CORS allows WebSocket origin
- Check firewall rules for WS port

**2. 401 Unauthorized errors:**
- Token expired - refresh needed
- Invalid token - login again
- Token not sent - check Authorization header

**3. Slow queries:**
- Missing database indexes
- N+1 query problem - use select_related/prefetch_related
- Large dataset without pagination

**4. CORS errors:**
- Frontend and backend origins mismatch
- Missing CORS headers in Nginx
- Credentials not included in request

### Debug Commands

**Check database connections:**
```bash
docker-compose exec db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

**Check Redis:**
```bash
docker-compose exec redis redis-cli ping
```

**Check Django logs:**
```bash
docker-compose logs -f backend
```

**Check Celery workers:**
```bash
docker-compose exec backend celery -A config inspect active
```

---

## Contributing

See [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for:
- Code style guidelines
- Git workflow
- Pull request process
- Testing requirements

---

## License

MIT License - See LICENSE file for details

---

**Last Updated:** October 26, 2025  
**Version:** 1.0.0  
**Maintained by:** Paul Kokos
