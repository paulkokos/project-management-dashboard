# Git Branching Strategy

## Overview

This document outlines the professional Git branching strategy for the Project Management Dashboard. We follow a modified Git Flow model with trunk-based development principles.

---

## Branch Types

### 1. Main Branch (`main`)
**Purpose:** Production-ready code

**Rules:**
- Protected branch - cannot push directly
- Requires pull request with code review
- Requires CI/CD checks to pass
- Requires 1 approval from team member
- No force pushes allowed
- No direct deletions allowed

**Deployment:** Automatically deployed to production on merge

**Naming:** `main` (only one)

---

### 2. Development Branch (`develop`)
**Purpose:** Integration branch for features

**Rules:**
- Protected branch - requires PR
- Integration point for feature branches
- Testing ground before production
- Regular merges from feature branches

**Deployment:** Deployed to staging on merge

**Naming:** `develop` (only one)

---

### 3. Feature Branches (`feature/*`)
**Purpose:** Development of new features

**Naming Convention:**
```
feature/issue-number-short-description
feature/41-password-notifications
feature/42-team-member-alerts
feature/44-project-updates
```

**Rules:**
- Created from: `develop` branch
- Merged back to: `develop` branch via PR
- Deleted after merge
- Short-lived (1-4 weeks)

**Workflow:**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/41-password-notifications
# Make changes...
git push origin feature/41-password-notifications
# Create PR to develop
```

---

### 4. Bugfix Branches (`bugfix/*`)
**Purpose:** Fix bugs in develop branch

**Naming Convention:**
```
bugfix/issue-number-description
bugfix/123-fix-login-error
bugfix/124-fix-team-display
```

**Rules:**
- Created from: `develop` branch
- Merged back to: `develop` branch via PR
- Should reference bug report issue

**Workflow:**
```bash
git checkout develop
git pull origin develop
git checkout -b bugfix/123-fix-login-error
# Fix bug...
git push origin bugfix/123-fix-login-error
# Create PR to develop with "Fixes #123"
```

---

### 5. Hotfix Branches (`hotfix/*`)
**Purpose:** Critical fixes to production

**Naming Convention:**
```
hotfix/version-issue-description
hotfix/1.0.1-security-patch
```

**Rules:**
- Created from: `main` branch
- Merged back to: `main` AND `develop`
- Bump version number
- Deploy immediately to production

**Workflow:**
```bash
git checkout main
git pull origin main
git checkout -b hotfix/1.0.1-security-patch
# Fix critical issue...
git push origin hotfix/1.0.1-security-patch
# Create PR to main
# After merge to main, also merge to develop
```

---

### 6. Release Branches (`release/*`)
**Purpose:** Prepare production release

**Naming Convention:**
```
release/version-number
release/1.0.0
release/1.1.0
```

**Rules:**
- Created from: `develop` branch
- Merged to: `main` with version tag
- Also merged back to: `develop`
- Only bug fixes and version bumps allowed
- No new features

**Workflow:**
```bash
git checkout develop
git pull origin develop
git checkout -b release/1.0.0
# Update version numbers
# Fix release-blocking bugs
git push origin release/1.0.0
# Create PR to main
# After merge, tag the release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

## Branch Hierarchy

```
main (Production)
├── Hotfix branches (critical fixes)
└── Release branches (prepared from develop)

develop (Staging)
├── Feature branches (new functionality)
├── Bugfix branches (bug fixes)
└── Release branches (start here)
```

---

## Naming Conventions

### Format
```
<type>/<issue-number>-<description>
```

### Types
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `release/` - Release preparation
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions

### Examples
```
feature/41-password-notifications
feature/42-team-member-alerts
bugfix/123-login-timeout
hotfix/1.0.1-security-vulnerability
release/1.1.0
chore/update-dependencies
docs/api-documentation
refactor/extract-email-service
test/add-backend-tests
```

---

## Pull Request Process

### 1. Create Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/41-password-notifications
```

### 2. Make Changes
```bash
# Make your changes
git add .
git commit -m "feat: Add password change notifications

- Send email when password changes
- Include IP address and timestamp
- Add security action links"
```

### 3. Push and Create PR
```bash
git push origin feature/41-password-notifications
```

Then on GitHub:
1. Create Pull Request from `feature/41-password-notifications` to `develop`
2. Add title: `Feature: Add password change notifications`
3. Add description referencing issue: `Closes #41`
4. Link to issue: Click "Link issue"

### 4. Code Review
- At least 1 approval required
- All checks must pass
- Conversations must be resolved
- Code owner review required

### 5. Merge
- Squash and merge for clean history
- Delete branch after merge
- Close associated issue automatically

---

## Commit Message Guidelines

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Test additions/fixes
- `chore` - Build, dependencies, etc.

### Scope
- Component affected
- Module or feature area

### Subject
- Imperative mood: "add" not "added" or "adds"
- Don't capitalize first letter
- No period at end
- Max 50 characters

### Body
- Explain what and why, not how
- Wrap at 72 characters
- Separate from subject by blank line

### Footer
- Reference issues: `Closes #41`
- Breaking changes: `BREAKING CHANGE:`

### Examples
```
feat(auth): add password change notifications

- Send email when user changes password
- Include IP address and device information
- Allow user to report unauthorized change

Closes #41

---

fix(api): handle missing query parameters gracefully

Previously the API would crash if required query
parameters were missing. Now it returns a clear
error message with instructions.

Fixes #123

---

docs(wiki): update API documentation

Added missing endpoints and clarified response
formats for all authentication endpoints.
```

---

## Protection Rules Summary

### Main Branch Protection
- ✓ Require pull request reviews (1 approval)
- ✓ Require status checks to pass
- ✓ Require branches to be up to date
- ✓ Dismiss stale pull request approvals
- ✓ Require code owner reviews
- ✓ Require conversation resolution
- ✓ Include administrators in restrictions
- ✗ Allow force pushes (disabled)
- ✗ Allow deletions (disabled)

### Develop Branch Protection (Recommended)
- ✓ Require pull request reviews (1 approval)
- ✓ Require status checks to pass
- ✓ Require branches to be up to date
- ✗ Allow force pushes (disabled)
- ✗ Allow deletions (disabled)

---

## Workflow Examples

### Feature Development
```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/41-password-notifications

# 2. Make commits
git add .
git commit -m "feat(auth): add password change notifications"

# 3. Push to remote
git push origin feature/41-password-notifications

# 4. Create PR via GitHub UI
# - Base: develop
# - Compare: feature/41-password-notifications
# - Title: Feature: Add password change notifications
# - Description: Closes #41

# 5. After approval and merge
git checkout develop
git pull origin develop
git branch -d feature/41-password-notifications
```

### Hotfix for Production
```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/1.0.1-security-fix

# 2. Make fix
git add .
git commit -m "fix(security): fix critical vulnerability"

# 3. Push and create PR to main
git push origin hotfix/1.0.1-security-fix

# 4. After merge to main
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1

# 5. Merge back to develop
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

### Release Preparation
```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/1.1.0

# 2. Update version numbers in files
# package.json, pyproject.toml, __init__.py, etc.
git add .
git commit -m "chore: bump version to 1.1.0"

# 3. Push to remote
git push origin release/1.1.0

# 4. Create PR to main
# - Title: Release v1.1.0
# - Description: Release notes and changelog

# 5. After merge to main, create tag
git checkout main
git pull origin main
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin v1.1.0

# 6. Merge back to develop
git checkout develop
git merge main
git push origin develop
```

---

## Branch Cleanup

### Local Cleanup
```bash
# Delete local feature branch
git branch -d feature/41-password-notifications

# Force delete if not merged
git branch -D feature/41-password-notifications

# Delete all local branches except develop and main
git branch | grep -v "develop\|main" | xargs git branch -d
```

### Remote Cleanup
```bash
# Delete remote branch
git push origin --delete feature/41-password-notifications

# Prune deleted remote branches
git fetch --prune
```

---

## Best Practices

### Do
- ✅ Create feature branch for each issue
- ✅ Keep branches short-lived (1-4 weeks)
- ✅ Write descriptive commit messages
- ✅ Reference issues in commits and PRs
- ✅ Keep branches updated with develop
- ✅ Squash commits before merging
- ✅ Delete branches after merge
- ✅ Use meaningful branch names

### Don't
- ❌ Commit directly to main or develop
- ❌ Use vague branch names like "fix" or "update"
- ❌ Force push to main or develop
- ❌ Leave old branches around
- ❌ Mix multiple features in one branch
- ❌ Merge without code review
- ❌ Skip CI/CD checks
- ❌ Commit secrets or credentials

---

## Status Checks Required

All pull requests must pass:
1. **GitHub Actions Workflows**
   - Frontend Tests
   - Backend Tests
   - CI/CD Pipeline
   - Code Quality Checks

2. **Branch Protection Rules**
   - Required checks pass
   - Required reviews approved
   - No conflicts with base branch

---

## Tags and Versions

### Semantic Versioning
```
v<major>.<minor>.<patch>
v1.0.0
v1.0.1
v1.1.0
v2.0.0
```

### Release Tags
```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag to remote
git push origin v1.0.0

# List tags
git tag -l

# Show tag details
git show v1.0.0
```

---

## Tools & Commands

### Useful Git Commands
```bash
# List all branches (local and remote)
git branch -a

# Fetch all branches from remote
git fetch --all

# Show branch history
git log --graph --all --oneline --decorate

# Show branches merged into current branch
git branch --merged

# Show branches not merged
git branch --no-merged

# Update current branch with develop
git rebase develop

# Interactive rebase for squashing commits
git rebase -i HEAD~3
```

---

## Resources

- [Git Flow Cheat Sheet](https://danielkummer.github.io/git-flow-cheatsheet/)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Document Version:** 1.0
**Created:** November 5, 2025
**Last Updated:** November 5, 2025
**Maintained By:** Project Team
