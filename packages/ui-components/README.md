# @paulkokos/ui-components

Reusable React UI components for project management dashboards.

## Overview

A collection of small, focused UI components that display project metrics and status information. Perfect for dashboards, project cards, and summary views.

## Installation

### From NPM (after publishing)

```bash
npm install @paulkokos/ui-components
```

### From Source (Local Development)

```bash
npm install
npm run build
```

### Link for Local Development

```bash
cd packages/ui-components
npm link

# In your project
npm link @paulkokos/ui-components
```

## Requirements

- React >= 18.0.0
- Tailwind CSS (for styling)
- Node >= 18.0.0

## Quick Start

### 1. Risk Badge

Display a color-coded risk level indicator.

```tsx
import { RiskBadge } from '@paulkokos/ui-components'

export function ProjectCard() {
  return (
    <div>
      <h3>My Project</h3>
      <RiskBadge riskLevel="high" />
    </div>
  )
}
```

### 2. Deadline Indicator

Show deadline status with color-coded urgency.

```tsx
import { DeadlineIndicator } from '@paulkokos/ui-components'

export function ProjectHeader() {
  return (
    <DeadlineIndicator
      daysUntilDeadline={15}
      endDate="2025-11-15"
    />
  )
}
```

### 3. Team Member Count

Display team size with icon and label.

```tsx
import { TeamMemberCount } from '@paulkokos/ui-components'

export function ProjectStats() {
  return <TeamMemberCount teamCount={5} />
}
```

### 4. Milestone Progress

Show milestone completion with count and progress bar.

```tsx
import { MilestoneProgress } from '@paulkokos/ui-components'

export function ProjectProgress() {
  return (
    <MilestoneProgress
      milestoneCount={10}
      completedMilestoneCount={7}
    />
  )
}
```

## Complete Example

```tsx
import React from 'react'
import {
  RiskBadge,
  DeadlineIndicator,
  TeamMemberCount,
  MilestoneProgress,
} from '@paulkokos/ui-components'

interface Project {
  id: number
  title: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  daysUntilDeadline: number
  endDate: string
  teamCount: number
  totalMilestones: number
  completedMilestones: number
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="p-4 border rounded-lg shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold">{project.title}</h3>
        <RiskBadge riskLevel={project.riskLevel} />
      </div>

      <div className="flex gap-4 text-sm">
        <div>
          <DeadlineIndicator
            daysUntilDeadline={project.daysUntilDeadline}
            endDate={project.endDate}
          />
        </div>
        <div>
          <TeamMemberCount teamCount={project.teamCount} />
        </div>
        <div>
          <MilestoneProgress
            milestoneCount={project.totalMilestones}
            completedMilestoneCount={project.completedMilestones}
          />
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
```

## Component Reference

### RiskBadge

Display a color-coded risk level indicator.

**Props:**
```tsx
interface RiskBadgeProps {
  riskLevel: 'low' | 'medium' | 'high' | 'critical' | undefined | null
}
```

**Color Mapping:**
- `low`: Green badge (bg-green-100, text-green-700)
- `medium`: Amber badge (bg-amber-100, text-amber-700)
- `high`: Orange badge (bg-orange-100, text-orange-700)
- `critical`: Red badge (bg-red-100, text-red-700)
- `null/undefined`: Returns nothing

**Renders:**
```
[● Low Risk]
[● Medium Risk]
[● High Risk]
[● Critical]
```

**Usage:**
```tsx
<RiskBadge riskLevel="critical" />
<RiskBadge riskLevel={null} />
```

### DeadlineIndicator

Show deadline status with automatic color coding.

**Props:**
```tsx
interface DeadlineIndicatorProps {
  daysUntilDeadline: number | null | undefined
  endDate: string | null | undefined
}
```

**Color Logic:**
- `< 0 days`: Red (Overdue)
- `= 0 days`: Red (Due today)
- `1-4 days`: Red (Due soon)
- `5-30 days`: Amber (Upcoming)
- `> 30 days`: Green (Plenty of time)
- `null/undefined`: Gray (No deadline)

**Example Outputs:**
```
Due in 45 days [green]
Due in 15 days [amber]
Due in 3 days [red]
Due today [red]
Overdue by 2 days [red]
No deadline [gray]
```

**Usage:**
```tsx
<DeadlineIndicator
  daysUntilDeadline={15}
  endDate="2025-11-15"
/>
```

### TeamMemberCount

Display team member count with icon.

**Props:**
```tsx
interface TeamMemberCountProps {
  teamCount: number | undefined | null
}
```

**Features:**
- Automatic pluralization (member/members)
- Returns null if teamCount is null/undefined
- Inline display with icon

**Example Outputs:**
```
[👥] 1 member
[👥] 5 members
[👥] 0 members
```

**Usage:**
```tsx
<TeamMemberCount teamCount={8} />
```

### MilestoneProgress

Display milestone completion progress.

**Props:**
```tsx
interface MilestoneProgressProps {
  milestoneCount: number | undefined | null
  completedMilestoneCount: number | undefined | null
}
```

**Features:**
- Shows completion counter (e.g., "3/5")
- Displays visual progress bar
- Calculates percentage
- Special case: "No milestones" if count is 0

**Example Outputs:**
```
[📋] 3/5 [========>-]
[📋] 5/5 [==========]
[📋] 0/5 [---------->]
No milestones
```

**Usage:**
```tsx
<MilestoneProgress
  milestoneCount={10}
  completedMilestoneCount={7}
/>
```

## Styling

All components use **Tailwind CSS** for styling. Ensure your project has Tailwind CSS configured:

```bash
npm install -D tailwindcss
npx tailwindcss init
```

**Configure tailwind.config.js:**
```js
module.exports = {
  content: [
    "./node_modules/@paulkokos/ui-components/dist/**/*.js",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## TypeScript Support

Full TypeScript support with type definitions included.

```tsx
import {
  RiskBadge,
  RiskBadgeProps,
  DeadlineIndicator,
  DeadlineIndicatorProps,
  TeamMemberCount,
  TeamMemberCountProps,
  MilestoneProgress,
  MilestoneProgressProps,
} from '@paulkokos/ui-components'

const riskLevel: RiskBadgeProps['riskLevel'] = 'high'
```

## Accessibility

All components are built with accessibility in mind:

- Semantic HTML elements
- Proper color contrast ratios
- No color-only information (icons and text provided)
- Screen reader friendly labels

## Performance

- Minimal dependencies (React only)
- Small bundle size (~5KB gzipped)
- Optimized for production builds
- No expensive computations

## Browser Support

Works with all modern browsers supporting ES2020:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Responsive Design

Components adapt to different screen sizes:
- Work well on mobile, tablet, and desktop
- Responsive padding and font sizes via Tailwind
- Flexible layout using flexbox

## Customization

Components use Tailwind CSS classes. To customize appearance:

```tsx
// Create a wrapper component
import { RiskBadge } from '@paulkokos/ui-components'

export function CustomRiskBadge(props) {
  return (
    <div className="custom-wrapper">
      <RiskBadge {...props} />
    </div>
  )
}
```

Or modify Tailwind config:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'custom-high-risk': '#FF5733',
      },
    },
  },
}
```

## Testing

Components are designed to be easy to test:

```tsx
import { render, screen } from '@testing-library/react'
import { RiskBadge } from '@paulkokos/ui-components'

test('renders risk badge', () => {
  render(<RiskBadge riskLevel="high" />)
  expect(screen.getByText('High Risk')).toBeInTheDocument()
})
```

## Best Practices

1. **Check for null values**: Components handle null/undefined gracefully
   ```tsx
   <RiskBadge riskLevel={project?.riskLevel} />
   ```

2. **Use TypeScript**: Leverage type definitions
   ```tsx
   import type { RiskBadgeProps } from '@paulkokos/ui-components'
   ```

3. **Combine components**: Use multiple components together
   ```tsx
   <div className="flex gap-2">
     <RiskBadge riskLevel={risk} />
     <DeadlineIndicator daysUntilDeadline={days} endDate={date} />
     <TeamMemberCount teamCount={count} />
   </div>
   ```

4. **Apply consistent spacing**: Use Tailwind gap utilities
   ```tsx
   <div className="flex gap-3">
     <DeadlineIndicator />
     <TeamMemberCount />
   </div>
   ```

## Performance Tips

1. **Memoize if necessary**:
   ```tsx
   const MemoizedRiskBadge = React.memo(RiskBadge)
   ```

2. **Avoid unnecessary re-renders**:
   ```tsx
   const riskLevel = useMemo(() => calculateRisk(data), [data])
   return <RiskBadge riskLevel={riskLevel} />
   ```

## Documentation

For detailed implementation, see:
- [RiskBadge.tsx](https://github.com/paulkokos/project-management-dashboard/blob/master/frontend/src/components/RiskBadge.tsx)
- [DeadlineIndicator.tsx](https://github.com/paulkokos/project-management-dashboard/blob/master/frontend/src/components/DeadlineIndicator.tsx)
- [TeamMemberCount.tsx](https://github.com/paulkokos/project-management-dashboard/blob/master/frontend/src/components/TeamMemberCount.tsx)
- [MilestoneProgress.tsx](https://github.com/paulkokos/project-management-dashboard/blob/master/frontend/src/components/MilestoneProgress.tsx)

## Contributing

Contributions are welcome! Please ensure:

1. TypeScript strict mode compliance
2. Full JSDoc documentation
3. Comprehensive examples
4. Accessibility best practices

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or suggestions:
https://github.com/paulkokos/project-management-dashboard/issues

## Related Packages

- **@paulkokos/search-components**: React search UI components and services
- **project-management-search-utils**: Python/Django search utilities

## Changelog

### v1.0.0 (2025-10-27)

Initial release with:
- RiskBadge component
- DeadlineIndicator component
- TeamMemberCount component
- MilestoneProgress component
- Full TypeScript support
- Comprehensive documentation
