# Security Posture Documentation

## Overview

This document describes the security architecture, role-based access control (RBAC), and permission system implemented in the Project Management Dashboard.

**Last Updated:** October 23, 2025
**Security Level:** Production-Ready with role-based controls

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
3. [Permission Matrix](#permission-matrix)
4. [Project Access Rules](#project-access-rules)
5. [Team Member Operations](#team-member-operations)
6. [Data Privacy & Isolation](#data-privacy--isolation)
7. [Security Features Implemented](#security-features-implemented)
8. [Security Best Practices](#security-best-practices)
9. [Future Enhancements](#future-enhancements)

---

## Authentication & Authorization

### Authentication Flow

1. **User Login**
   - Username/password authentication via JWT (JSON Web Tokens)
   - Access token lifetime: 7 days (development), configurable in production
   - Refresh tokens: 7 days (development)
   - Token storage: Browser localStorage (secure in production with httpOnly cookies)

2. **Session Management**
   - Authentication state checked on app startup (`useEffect` in App.tsx)
   - Invalid tokens automatically clear authentication state
   - Users redirected to login if tokens expire

3. **API Authentication**
   - All API endpoints require `IsAuthenticated` permission
   - JWT token passed in `Authorization: Bearer <token>` header
   - CORS enabled for trusted origins only

### Authorization Levels

- **Unauthenticated**: Cannot access any API endpoints
- **Authenticated**: Can access API, but project access filtered by ownership/team membership
- **Project Owner**: Full control over owned projects
- **Team Member**: Access determined by assigned role

---

## Role-Based Access Control (RBAC)

### Role Hierarchy

```
Project Owner (implicit - project ownership)
├── Project Lead (explicit role)
├── Manager (explicit role)
├── Developer (explicit role)
├── Designer (explicit role)
├── QA Engineer (explicit role)
└── Stakeholder (read-only role)
```

### Role Definitions

| Role | Key | Display Name | Edit Permission | View Permission | Description |
|------|-----|--------------|-----------------|-----------------|-------------|
| **Owner** | N/A (implicit) | Project Owner | ✅ Full Control | ✅ Full View | Created the project, has absolute control |
| **Lead** | `lead` | Project Lead | ✅ Yes | ✅ Full View | Senior team member, can edit project details |
| **Manager** | `manager` | Manager | ✅ Yes | ✅ Full View | Project manager, can edit project details |
| **Developer** | `developer` | Developer | ❌ No | ✅ Full View | Developer team member, read-only access |
| **Designer** | `designer` | Designer | ❌ No | ✅ Full View | Designer team member, read-only access |
| **QA** | `qa` | QA Engineer | ❌ No | ✅ Full View | QA team member, read-only access |
| **Stakeholder** | `stakeholder` | Stakeholder | ❌ No | ✅ Read-Only | External stakeholder, limited read-only view |

---

## Permission Matrix

### Project-Level Permissions

| Action | Owner | Lead | Manager | Developer | Designer | QA | Stakeholder |
|--------|:-----:|:----:|:-------:|:----------:|:--------:|:---:|:-----------:|
| **View Project** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit Project** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Delete Project** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Restore Project** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Add Team Member** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Remove Team Member** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Change Team Role** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Edit Milestones** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Edit Tags** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Bulk Update** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Team Member Operations

| Action | Owner | Lead | Manager | Developer | Designer | QA | Stakeholder |
|--------|:-----:|:----:|:-------:|:----------:|:--------:|:---:|:-----------:|
| **View Team** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **View Team Roster** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Add Member** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Remove Member** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Change Capacity** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Project Access Rules

### Who Can See Which Projects?

A user can see a project if **ANY** of these conditions are true:

1. ✅ User is the **project owner**
2. ✅ User is a **team member** of the project (with any role)

**Consequence:** Users cannot see projects they don't own and aren't assigned to.

### Project Visibility Filtering

All API endpoints that list or retrieve projects apply automatic filtering:

```python
# Backend QuerySet filtering
Project.objects.filter(
    Q(owner=user) | Q(team_members__user=user)
).distinct()
```

**This means:**
- User1 cannot see User2's private projects
- User1 cannot see User2's deleted projects
- User1 can only see projects they own or are assigned to

### Project Listing Example

```
User0 owns:
├── Project A (created by User0)
├── Project B (created by User0)
└── Project C (created by User0)

User0 is assigned to:
├── Project X (owned by User1, User0 is Developer)
└── Project Y (owned by User2, User0 is QA)

Result: User0 can see Projects A, B, C, X, Y only
```

---

## Team Member Operations

### Adding Team Members

**Who can add team members?**
- ✅ **Project Owner only**

**Requirements:**
- User must be the project owner
- Target user must exist in system
- Role must be valid
- User cannot be added twice to same project

**API Endpoint:** `POST /api/projects/{id}/add_team_member/`

**Request Body:**
```json
{
  "user_id": 2,
  "role_id": 1,
  "capacity": 50
}
```

**Capacity Constraints:**
- Minimum: 0%
- Maximum: 100%
- Default: 100%
- Represents team member's available capacity for the project

### Removing Team Members

**Who can remove team members?**
- ✅ **Project Owner only**

**API Endpoint:** `DELETE /api/projects/{id}/remove_team_member/`

**Request Body:**
```json
{
  "user_id": 2
}
```

**Restrictions:**
- Owner cannot remove themselves via API (must delete project)
- Cannot remove members from projects you don't own

### Capacity Validation

Team member capacity is validated at multiple levels:

1. **Frontend Validation**
   - Input range slider: 0-100%
   - Real-time validation feedback

2. **Serializer Validation**
   - Value must be between 0 and 100
   - Clear error message: "Capacity must be between 0 and 100"

3. **Model Validation**
   - Database constraints: `MinValueValidator(0), MaxValueValidator(100)`
   - Prevents invalid data at storage level

---

## Data Privacy & Isolation

### User Data Isolation

Each user's data is completely isolated:

**User1 cannot access:**
- ❌ User2's owned projects (unless invited as team member)
- ❌ User2's deleted projects
- ❌ User2's project history/activities
- ❌ User2's team member assignments

**User1 can access:**
- ✅ Their own projects (all)
- ✅ Projects where they're assigned as team member
- ✅ Project details only for projects they can access
- ✅ Team rosters only for projects they own or are on

### Team Member Privacy

- Team members can view other team members on their shared projects only
- Cannot view team members on projects you're not part of
- Stakeholders cannot see team member list

### Activity Log Privacy

- Activities logged per project
- Only accessible by project owner and team members

---

## Security Features Implemented

### ✅ Feature: Authentication & Sessions

- JWT-based authentication
- Session token expiration (7 days)
- Automatic logout on token expiration
- Auth state persistence in localStorage

**Status:** ✅ Implemented

---

### ✅ Feature: Ownership Verification

All modifications checked against ownership:

- Project creation: Auto-set to request.user
- Project update: Must be owner or authorized role
- Project delete: Owner only
- Project restore: Owner only

**Status:** ✅ Implemented

---

### ✅ Feature: Team Access Control

Team member operations protected:

- Add member: Owner only
- Remove member: Owner only
- Edit capacity: Owner only
- View team roster: Owner and team members only

**Status:** ✅ Implemented

---

### ✅ Feature: Role-Based Edit Permissions

Edit access based on role:

```python
def can_edit_project(user, project):
    # Owner can always edit
    if project.owner == user:
        return True

    # Leads and managers can edit
    role = get_user_project_role(user, project)
    return role in ['lead', 'manager']
```

- Owner: ✅ Can edit
- Lead: ✅ Can edit
- Manager: ✅ Can edit
- Developer/Designer/QA: ❌ Read-only
- Stakeholder: ❌ Read-only

**Status:** ✅ Implemented

---

### ✅ Feature: Read-Only Role Support

Stakeholder role enforced as read-only:

```python
def is_read_only_role(user, project):
    role = get_user_project_role(user, project)
    return role == 'stakeholder'
```

- Stakeholders cannot edit any project details
- Stakeholders cannot access team roster
- Stakeholders get `403 Forbidden` on edit attempts

**Status:** ✅ Implemented

---

### ✅ Feature: Capacity Validation

Team member capacity constrained to 0-100%:

- Frontend: Range input validation (0-100)
- API: Serializer field validation
- Database: Model validators (MinValue/MaxValue)
- Error handling: Clear validation messages

**Status:** ✅ Implemented

---

### ✅ Feature: Bulk Operation Protection

Bulk operations validated:

- `bulk_update()`: Only owner can update their projects
- `BulkOperationViewSet`: Only owner can perform bulk ops
- Permission check: Compares requested project_ids against user's projects
- Error: `403 Forbidden` if trying to update projects user doesn't own

**Status:** ✅ Implemented

---

### ✅ Feature: Deleted Project Privacy

Soft-deleted projects filtered:

- Users can only see their own deleted projects
- Deleted projects hidden from other users
- Restore operation: Owner only

**Status:** ✅ Implemented

---

### ✅ Feature: Querysets Filtered by Access

All project queries filtered automatically:

```python
def get_queryset(self):
    user = self.request.user
    return Project.objects.filter(
        Q(owner=user) | Q(team_members__user=user)
    ).distinct()
```

- Prevents unauthorized project enumeration
- Users can't guess or brute-force project IDs
- API consistently enforces access rules

**Status:** ✅ Implemented

---

## Security Best Practices

### For Project Owners

1. **Manage Team Carefully**
   - Only add trusted users to your projects
   - Remove users who no longer need access
   - Review team roster regularly

2. **Assign Appropriate Roles**
   - Use `Developer` for contributors
   - Use `Lead` or `Manager` for decision makers
   - Use `Stakeholder` for external observers

3. **Monitor Project Activity**
   - Check activity log for changes
   - Audit changes made by team members with edit access

### For Team Members

1. **Respect Access Levels**
   - Don't attempt to access unauthorized projects
   - Report unauthorized access attempts
   - Follow principle of least privilege

2. **Capacity Planning**
   - Set realistic capacity percentages
   - Update capacity if availability changes
   - Use capacity for workload planning

### For System Administrators

1. **User Management**
   - Create users through Django admin
   - Set secure passwords
   - Enable strong password requirements

2. **Regular Audits**
   - Review project ownership
   - Check for inactive users
   - Audit access patterns

3. **Token Management**
   - Set appropriate token expiration
   - Monitor failed login attempts
   - Implement rate limiting (future)

---

## Future Enhancements

### Phase 2: Advanced RBAC

- [ ] Custom roles per organization
- [ ] Granular permission assignment
- [ ] Permission inheritance hierarchy
- [ ] Delegation support (owner can delegate certain tasks)

### Phase 3: Audit & Compliance

- [ ] Comprehensive audit logging
- [ ] Change tracking with who/when/what
- [ ] Activity log with filtering
- [ ] Export audit reports

### Phase 4: Advanced Security

- [ ] Two-factor authentication (2FA)
- [ ] API key management for integrations
- [ ] Rate limiting on API endpoints
- [ ] IP whitelisting per user/organization
- [ ] SSO/SAML support

### Phase 5: Team & Organization

- [ ] Organizations/teams concept
- [ ] Team-based access control
- [ ] Shared project templates
- [ ] Department hierarchies

---

## API Error Codes & Messages

### 401 Unauthorized
```
GET /api/projects/
Response: 401 Unauthorized
```
**Cause:** No authentication token provided or token expired
**Solution:** Login again and include valid token in headers

### 403 Forbidden
```
POST /api/projects/1/add_team_member/
Response: 403 Forbidden
{"error": "Only the project owner can add team members"}
```
**Cause:** User doesn't have permission to perform action
**Solution:** Request owner's permission or use appropriate role

### 404 Not Found
```
GET /api/projects/999/
Response: 404 Not Found
```
**Cause:** Project doesn't exist or user doesn't have access
**Solution:** Check project ID and your access permissions

### 400 Bad Request
```
POST /api/projects/1/add_team_member/
Body: {"user_id": 2, "role_id": 1, "capacity": 150}
Response: 400 Bad Request
{"capacity": ["Capacity must be between 0 and 100"]}
```
**Cause:** Invalid data submitted
**Solution:** Fix validation errors and retry

---

## Compliance & Security Standards

### Implemented Standards

- ✅ **OWASP Top 10**: CSRF protection, SQL injection prevention, secure authentication
- ✅ **RBAC Principle**: Principle of least privilege enforced
- ✅ **Data Isolation**: Complete user data separation
- ✅ **Input Validation**: All inputs validated and sanitized
- ✅ **Activity Logging**: All changes logged for audit trail

### Not Yet Implemented

- ⏳ GDPR compliance (right to be forgotten)
- ⏳ Data encryption at rest
- ⏳ Rate limiting
- ⏳ IP whitelisting
- ⏳ 2FA/MFA support

---

## Testing the Security Posture

### Test Case 1: User Isolation
```
1. Login as User1
2. Create Project A
3. Login as User2
4. List projects - User2 should NOT see Project A
5. Try GET /api/projects/1/ - Should get 404
```

### Test Case 2: Team Member Access
```
1. Login as User1 (owner)
2. Add User2 as Developer to Project A
3. Login as User2
4. GET /api/projects/A/ - Should see project details
5. PATCH /api/projects/A/ with changes - Should get 403
```

### Test Case 3: Owner-Only Operations
```
1. Login as User1 (owner of Project A)
2. Add User2 to team
3. Login as User2
4. POST /api/projects/A/add_team_member/ - Should get 403
5. DELETE /api/projects/A/ - Should get 403
```

### Test Case 4: Capacity Validation
```
1. POST /api/projects/1/add_team_member/
   Body: {"user_id": 2, "role_id": 1, "capacity": 150}
2. Should get 400 with "Capacity must be between 0 and 100"
```

---

## Questions & Support

For security questions, concerns, or vulnerability reports:

1. Contact the development team
2. Submit through proper channels
3. Do NOT publicly disclose security issues

---

**Document Version:** 1.0
**Last Updated:** October 23, 2025
**Next Review:** Q1 2026
