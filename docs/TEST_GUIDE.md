# Manual Testing Guide - Project Card Features

## Quick Start

1. Start the application:
```bash
# Development environment with hot reload
docker-compose -f docker-compose.dev.yml up
```

2. Open the application in your browser:
- Frontend: http://localhost:5173 (development)
- Backend API: http://localhost:8000/api
- Django Admin: http://localhost:8000/admin

3. Test credentials (if available):
- Username: `admin` or `testuser`
- Password: See `.env` file or Django admin

## What to Test

### 1. Project List Page - Basic Display

Navigate to the Projects list page. Each project card should now display:

#### Required (Already existed):
- [x] Project title
- [x] Project description (2-line clamp)
- [x] Owner name
- [x] Last updated date
- [x] Project tags (color-coded)
- [x] Status badge
- [x] Health indicator
- [x] Progress bar with percentage

#### New Additions:

**1. Project Duration Display**
- Look for text like "Duration: Oct 01 to Dec 15"
- Appears below the tags
- Only shows if project has a start_date
- Format: "Mon DD to Mon DD"

Expected behavior:
- Projects with both start_date and end_date: Shows "Oct 01 to Dec 15"
- Projects with only start_date: Shows just the start date
- Projects without dates: Nothing displayed

**2. Risk Badge (Next to Status/Health)**
- Appears in the badges row with status and health
- Shows one of: "Low Risk", "Medium Risk", "High Risk", "Critical"
- Color coded:
  - Low Risk: Green background
  - Medium Risk: Amber background
  - High Risk: Orange background
  - Critical: Red background
- Has a colored dot indicator

Risk calculation:
- Critical: health='critical' OR days_until_deadline < 0 (overdue)
- High: days_until_deadline < 5 (within 5 days)
- Medium: progress=0 AND days_until_deadline < 30
- Low: Everything else

**3. Team Member Count Badge**
- Shows number with person icon
- Format: "X members" or "X member" (singular for 1)
- Gray background with icon
- Appears on the left side below progress bar

**4. Milestone Progress Indicator**
- Shows "X/Y" with small progress bar
- Format: "8/12" with mini horizontal bar
- Blue background
- Appears on the right side below progress bar

**5. Deadline Indicator**
- Appears at the bottom of the card
- Only shows if project has end_date
- Shows days until deadline with color coding:
  - Green: > 30 days
  - Amber: 5-30 days
  - Red: < 5 days
  - Red: 0 days (due today)
  - Red: Negative (overdue)

Example messages:
- "Due in 45 days" (green)
- "Due in 15 days" (amber)
- "Due in 2 days" (red)
- "Due today" (red)
- "Overdue by 3 days" (red)
- "No deadline" (gray, if no end_date)

### 2. Card Layout Visual Check

Before (minimal):
```
Title                    [Delete]
Owner: John | Oct 24
Description (2 lines)
[Tag1] [Tag2]
[Status] [Health]
Progress bar: 65%
```

After (enhanced):
```
Title                    [Delete]
Owner: John | Oct 24
Description (2 lines)
[Tag1] [Tag2]
Duration: Oct 01 to Dec 15
[Status] [Health] [Risk Badge]
Progress bar: 65%
Team: 5 members    Milestones: 8/12 ●●●●●
Due in 15 days
```

### 3. Responsive Behavior

Test on different screen sizes:
- Desktop (lg): Cards in 3-column grid
- Tablet (md): Cards in 2-column grid
- Mobile (sm): Cards in 1-column stack

All badges should wrap and align properly on smaller screens.

### 4. Data Verification

To verify backend is returning the new fields, check the API response:

```bash
# Get projects list (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/projects/

# You should see fields like:
{
  "id": 1,
  "title": "Mobile App Development",
  "team_count": 5,
  "milestone_count": 12,
  "completed_milestone_count": 8,
  "days_until_deadline": 15,
  "risk_level": "medium",
  "duration_display": "Oct 01 to Dec 15",
  ...
}
```

### 5. Edge Cases to Test

**Case 1: No Team Members**
- team_count = 0
- TeamMemberCount should show "0 members"

**Case 2: No Milestones**
- milestone_count = 0
- MilestoneProgress should show "No milestones" text

**Case 3: No End Date**
- days_until_deadline = null
- DeadlineIndicator should show "No deadline"
- Duration should show only start date (or nothing if no start_date)

**Case 4: Overdue Project**
- days_until_deadline = -5
- DeadlineIndicator shows "Overdue by 5 days" in red
- Risk badge shows "Critical"

**Case 5: Critical Health**
- health = 'critical'
- Risk badge shows "Critical" regardless of deadline
- Background is red

**Case 6: No Progress**
- progress = 0
- progress_bar width = 0%
- Shows "0% complete"

### 6. Filtering and Sorting

- All filters should still work with new data
- Sorting options unchanged
- Pagination should display all new fields

### 7. Real-time Updates

If you have multiple browser tabs open:
1. Create a new project in one tab
2. Should appear immediately in other tabs with new fields
3. Update a project's dates/milestones
4. Changes should reflect in real-time via WebSocket

### 8. Browser Console

Open DevTools (F12) and check:
- No console errors
- Network tab shows projects endpoint returns correct data
- Check that all new fields are in API response

## Test Scenarios

### Scenario 1: Perfect Project
```
Project: E-Commerce Platform
Owner: john_doe
Duration: Oct 01 to Dec 31 (3 months)
Status: Active | Health: Healthy | Risk: Low Risk
Progress: 75% (████████░)
Team: 8 members
Milestones: 10/15 (░░░░░░░░░░░░░░░)
Deadline: Due in 45 days (green)
```

Expected: All fields visible, green tones dominating

### Scenario 2: At-Risk Project
```
Project: Mobile App MVP
Owner: jane_smith
Duration: Sep 01 to Nov 10 (2.5 months)
Status: On Hold | Health: At Risk | Risk: High Risk
Progress: 40% (████░░░░░)
Team: 3 members
Milestones: 4/10 (░░░░░░░░░░)
Deadline: Due in 4 days (red)
```

Expected: Risk badge shows "High Risk" in orange, deadline in red

### Scenario 3: Critical Project
```
Project: Security Patch
Owner: admin_user
Duration: Oct 20 to Oct 27 (1 week)
Status: Active | Health: Critical | Risk: Critical
Progress: 15% (██░░░░░░░)
Team: 2 members
Milestones: 0/5 (░░░░░░░░░░)
Deadline: Overdue by 2 days (red)
```

Expected: Red everywhere, critical indicates immediate action needed

### Scenario 4: Project with No Dates
```
Project: Research Initiative
Owner: researcher_team
Duration: (none shown)
Status: Active | Health: Healthy | Risk: Low Risk
Progress: 30% (███░░░░░░)
Team: 6 members
Milestones: No milestones
Deadline: No deadline
```

Expected: Gracefully handles missing dates, shows defaults

## API Response Validation

Each project in the list endpoint should include:

```json
{
  "id": 1,
  "title": "Project Name",
  "description": "...",
  "owner": {
    "id": 1,
    "username": "user"
  },
  "status": "active",
  "health": "healthy",
  "progress": 75,
  "start_date": "2025-10-01",
  "end_date": "2025-12-31",
  "tags": [...],

  // NEW FIELDS
  "team_count": 8,
  "milestone_count": 15,
  "completed_milestone_count": 10,
  "days_until_deadline": 45,
  "risk_level": "low",
  "duration_display": "Oct 01 to Dec 31",

  "created_at": "...",
  "updated_at": "...",
  "etag": "...",
  "version": 1
}
```

## Troubleshooting

### New Fields Not Showing

**Issue**: Cards don't display new fields
**Check**:
1. Backend returned data: Check Network tab in DevTools
2. Make sure API response includes: team_count, milestone_count, etc.
3. Clear browser cache: Ctrl+Shift+Delete (Chrome)

### Styling Issues

**Issue**: Badges not styled correctly
**Check**:
1. Tailwind CSS classes are applied
2. No console errors about undefined classes
3. Check component CSS in browser inspector

### Real-time Updates Not Working

**Issue**: New fields don't update when WebSocket changes occur
**Check**:
1. WebSocket connection active (Network → WS filter)
2. NotificationContext is rendered
3. Check for JavaScript errors in console

## Performance Notes

- Each project card now makes minimal additional queries (all data in list API)
- Computed properties on backend don't require extra database calls
- Component rendering is optimized with conditional display

## Rollback Plan

If issues occur:
```bash
git revert 9ba9d69
docker-compose restart backend frontend
```

---

**Success Criteria**: All 5 new display elements appear on project cards with correct styling and data in real-time updates.
