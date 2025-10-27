# Project Dashboard UI Components

A reusable React component library for the Project Management Dashboard application.

## Installation

```bash
npm install @paulkokos/project-dashboard-ui
```

## Usage

### ProjectCard

Display a project summary with status, progress, and owner information.

```typescript
import { ProjectCard, type Project } from '@paulkokos/project-dashboard-ui';

const project: Project = {
  id: 1,
  name: 'Website Redesign',
  description: 'Redesign company website',
  status: 'active',
  health: 'healthy',
  progress: 65,
  owner: {
    id: 1,
    email: 'owner@example.com',
    first_name: 'John',
    last_name: 'Doe',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function App() {
  return (
    <ProjectCard
      project={project}
      onClick={() => console.log('Project clicked')}
    />
  );
}
```

### ProgressBar

Visual progress indicator with animated support.

```typescript
import { ProgressBar } from '@paulkokos/project-dashboard-ui';

function App() {
  return (
    <ProgressBar
      progress={65}
      color="success"
      height={8}
      animated={true}
    />
  );
}
```

### StatusBadge

Display project status with color coding.

```typescript
import { StatusBadge } from '@paulkokos/project-dashboard-ui';

function App() {
  return (
    <StatusBadge
      status="active"
      size="md"
    />
  );
}
```

### HealthIndicator

Show project health status with pulsing animation.

```typescript
import { HealthIndicator } from '@paulkokos/project-dashboard-ui';

function App() {
  return (
    <HealthIndicator
      health="healthy"
      size="md"
      showLabel={true}
    />
  );
}
```

### TeamRoster

Display team members with roles.

```typescript
import { TeamRoster, type TeamMember } from '@paulkokos/project-dashboard-ui';

const teamMembers: TeamMember[] = [
  {
    id: 1,
    user: { id: 1, email: 'user@example.com', first_name: 'Alice', last_name: 'Smith' },
    project: 1,
    role: 'owner',
    joined_at: new Date().toISOString(),
  },
  {
    id: 2,
    user: { id: 2, email: 'user2@example.com', first_name: 'Bob', last_name: 'Jones' },
    project: 1,
    role: 'contributor',
    joined_at: new Date().toISOString(),
  },
];

function App() {
  return (
    <TeamRoster
      teamMembers={teamMembers}
      maxDisplay={5}
      onMemberClick={(member) => console.log(member)}
    />
  );
}
```

### ActivityFeed

Display recent project activities and events.

```typescript
import { ActivityFeed, type Activity } from '@paulkokos/project-dashboard-ui';

const activities: Activity[] = [
  {
    id: 1,
    project: 1,
    user: { id: 1, email: 'user@example.com', first_name: 'Alice', last_name: 'Smith' },
    activity_type: 'created',
    description: 'Created the project',
    created_at: new Date().toISOString(),
  },
];

function App() {
  return (
    <ActivityFeed
      activities={activities}
      maxItems={10}
      onActivityClick={(activity) => console.log(activity)}
    />
  );
}
```

## Component Props

### ProjectCard
- `project` (required): Project data object
- `onClick`: Optional callback when card is clicked
- `className`: Optional CSS class name

### ProgressBar
- `progress` (required): Progress percentage (0-100)
- `height`: Bar height in pixels (default: 8)
- `color`: Color variant - 'success', 'warning', 'danger', 'info' (default: 'success')
- `animated`: Enable pulsing animation (default: false)
- `className`: Optional CSS class name

### StatusBadge
- `status` (required): 'active', 'on_hold', 'completed', or 'archived'
- `size`: Badge size - 'sm', 'md', or 'lg' (default: 'md')
- `className`: Optional CSS class name

### HealthIndicator
- `health` (required): 'healthy', 'at_risk', or 'critical'
- `size`: Indicator size - 'sm', 'md', or 'lg' (default: 'md')
- `showLabel`: Display health text label (default: true)
- `className`: Optional CSS class name

### TeamRoster
- `teamMembers` (required): Array of team member objects
- `maxDisplay`: Maximum members to display before '+X more' (default: 5)
- `onMemberClick`: Optional callback when member is clicked
- `className`: Optional CSS class name

### ActivityFeed
- `activities` (required): Array of activity objects
- `maxItems`: Maximum activities to display (default: 10)
- `onActivityClick`: Optional callback when activity is clicked
- `className`: Optional CSS class name

## Styling

All components use inline styles for maximum portability. You can customize styling by:

1. Overriding inline styles with CSS classes via the `className` prop
2. Wrapping components in containers with custom styling
3. Using CSS-in-JS solutions with higher specificity

## TypeScript Support

All components are fully typed with TypeScript. Import types directly:

```typescript
import type {
  Project,
  User,
  TeamMember,
  Activity,
  ProjectTag,
} from '@paulkokos/project-dashboard-ui';
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Watch for changes
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## License

MIT

## Repository

https://github.com/paulkokos/project-management-dashboard
