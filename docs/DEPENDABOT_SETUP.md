# Dependabot & Security Configuration Guide

## Overview

This document describes the automated security and dependency management setup for the Project Management Dashboard.

## Enabled Security Features

### 1. Dependabot Alerts (ENABLED)
- Automatically scans all dependencies for known vulnerabilities
- Updates daily with latest vulnerability data
- Creates alerts visible in the Security tab
- Currently: 16 vulnerability alerts detected

**Access:** https://github.com/paulkokos/project-management-dashboard/security/dependabot

### 2. Dependabot Security Updates (ENABLED)
- Automatically creates pull requests for security updates
- Only targets vulnerable dependencies
- Creates PRs when security patches are available
- Helps maintain secure dependencies automatically

### 3. Secret Scanning (ENABLED)
- Scans all commits for exposed secrets
- Blocks push if secrets are detected
- Prevents credential leaks to public repository
- Blocks patterns: API keys, tokens, credentials, etc.

### 4. Secret Scanning Push Protection (ENABLED)
- Prevents commits with secrets from being pushed
- Provides warnings before push attempt
- Option to bypass if necessary (not recommended)
- Protects from accidental credential exposure

### 5. Advanced Security (ENABLED)
- Default for public repositories
- Includes code scanning and dependency analysis
- Available in Security tab

### 6. Private Vulnerability Reporting (ENABLED)
- Researchers can report vulnerabilities privately
- Coordinated disclosure support
- GitHub security advisory system
- No public exposure until fixed

**Access:** https://github.com/paulkokos/project-management-dashboard/security/advisories

---

## Dependabot Configuration

### File: `.github/dependabot.yml`

Configured to automatically monitor and update:

#### 1. Frontend Dependencies (npm)
```yaml
package-ecosystem: "npm"
directory: "/frontend"
schedule: Weekly (Mondays 03:00 UTC)
```
- Monitors: `package.json` and `package-lock.json`
- Creates PRs for: security updates, version bumps
- Limit: 5 open PRs at a time
- Labels: `dependencies`, `frontend`

#### 2. Backend Dependencies (pip)
```yaml
package-ecosystem: "pip"
directory: "/backend"
schedule: Weekly (Mondays 03:00 UTC)
```
- Monitors: `requirements.txt`
- Creates PRs for: security updates, version bumps
- Limit: 5 open PRs at a time
- Labels: `dependencies`, `backend`

#### 3. GitHub Actions
```yaml
package-ecosystem: "github-actions"
schedule: Weekly (Mondays 04:00 UTC)
```
- Monitors: `.github/workflows/*.yml`
- Updates: action versions, runtime versions
- Labels: `dependencies`, `ci-cd`

#### 4. Docker Base Images
```yaml
package-ecosystem: "docker"
directory: "/deployment/docker"
schedule: Weekly (Mondays 04:30 UTC)
```
- Monitors: `Dockerfile` base images
- Updates: to latest secure base images
- Labels: `dependencies`, `docker`

---

## Dependency Vulnerability Alerts

### Current Status
- **Total Alerts:** 16
- **High Severity:** 4
- **Moderate Severity:** 10
- **Low Severity:** 2

### Review Process

1. **Go to Security Tab**
   - https://github.com/paulkokos/project-management-dashboard/security/dependabot

2. **Review Alert Details**
   - Severity level (Critical, High, Medium, Low)
   - Affected package name
   - Vulnerability description
   - Fix recommendation
   - Supported versions

3. **Fix Options**
   - Wait for Dependabot PR (automatic)
   - Create PR manually
   - Dismiss if false positive
   - Ignore if acceptable risk

4. **Test & Merge**
   - Run full test suite on Dependabot PR
   - Check CI/CD pipeline passes
   - Merge when confident

---

## Automatic Update Process

### When Dependabot Creates PRs

1. **Triggered By**
   - Vulnerability detected in dependency
   - New version available (if configured)
   - Schedule time (weekly Mondays)

2. **PR Details**
   - Auto-generated title with package name
   - Detailed changelog in description
   - Automatic tests run (CI/CD)
   - Security advisory links provided

3. **Labels Added**
   - `dependencies` - Marks as dependency update
   - `frontend` or `backend` - Component affected
   - `ci-cd` - For GitHub Actions updates

4. **Reviewer Assignment**
   - Automatically assigned to: paulkokos
   - Other maintainers can review

5. **Merge Strategy**
   - Review CI/CD results
   - Ensure all tests pass
   - Merge when confident
   - Dismiss if false positive/acceptable risk

---

## Monitoring & Notifications

### Email Notifications
- Configure in GitHub Settings > Notifications
- Enable for: Dependabot alerts
- Receive updates when new vulnerabilities found

### Security Tab
- Visit Security tab weekly
- Review new alerts
- Check PR status

### Workflow Monitoring
- All Dependabot PRs run CI/CD pipeline
- Check workflow results before merge
- No special configuration needed

---

## Best Practices

### For Security
1. Review alerts within 7 days
2. Prioritize high/critical severity
3. Merge security updates promptly
4. Keep dependencies current

### For Stability
1. Test before merging major updates
2. Monitor for breaking changes
3. Review changelogs
4. Use semantic versioning

### For Automation
1. Keep Dependabot PRs under 5 open
2. Merge regularly to reduce backlog
3. Configure per-ecosystem priorities
4. Use `@dependabot` commands if needed

### For Secret Prevention
1. Never commit credentials
2. Use environment variables
3. Let push protection block you
4. Rotate compromised secrets immediately

---

## Commands & Tips

### GitHub CLI Commands
```bash
# List all Dependabot PRs
gh pr list --label dependencies

# View specific vulnerability alert
gh api repos/paulkokos/project-management-dashboard/vulnerability-alerts

# List Dependabot alerts
gh api repos/paulkokos/project-management-dashboard/dependabot/alerts
```

### Dependabot PR Commands
Use these in PR comments to control Dependabot:

```
@dependabot rebase
@dependabot squash and merge
@dependabot merge
@dependabot close
@dependabot reopen
@dependabot ignore this dependency
@dependabot ignore this major version
```

### Dismiss Vulnerability Alerts
```bash
# Dismiss a specific alert (if false positive)
# Use GitHub UI or API
gh api -X PATCH repos/paulkokos/project-management-dashboard/dependabot/alerts/{alert_number} \
  -f state='dismissed' \
  -f dismissed_reason='tolerable_risk'
```

---

## Vulnerability Alert Dismissal Reasons

Valid reasons when dismissing alerts:

1. **fix_started** - Already working on fix
2. **inaccurate** - Alert is not accurate
3. **no_bandwidth** - Too busy to address
4. **not_affected** - Code path not affected
5. **tolerable_risk** - Risk is acceptable

---

## Integration with Development

### Workflow
1. Dependabot creates PR
2. CI/CD pipeline runs automatically
3. Team reviews results
4. Merge if all tests pass
5. Redeploy with updated dependencies

### Branch Protection
Recommended settings in branch protection rules:
- Require pull request reviews: 1
- Require status checks to pass
- Require branches to be up to date
- Require code quality checks

---

## FAQ

### Q: Should I merge Dependabot PRs automatically?
A: Not recommended. Always run tests first. Only consider auto-merge for patch/minor updates after testing.

### Q: What if a dependency update breaks my code?
A: Revert the PR, file an issue, pin the version, or wait for next update. Tests should catch this.

### Q: Can I disable Dependabot?
A: Not recommended for security reasons. If needed, edit `.github/dependabot.yml` and remove ecosystems.

### Q: How often does Dependabot check?
A: Daily for vulnerability updates. Weekly schedule for version updates (per configuration).

### Q: What about private dependencies?
A: Not supported by Dependabot. Manage manually or use GitHub Packages.

---

## Security Scanning

### Code Scanning
- Enabled: Yes (Advanced Security)
- Tool: CodeQL (default)
- Frequency: Push, PR, and scheduled

### Dependency Scanning
- Enabled: Yes (Dependabot)
- Frequency: Daily (alerts), Weekly (PRs)
- Coverage: npm, pip, GitHub Actions, Docker

### Secret Scanning
- Enabled: Yes
- Real-time: Scans all commits
- Push protection: Blocks commits with secrets
- Alerts: Visible in Security tab

---

## Next Steps

1. Review the 16 current Dependabot alerts
2. Prioritize high/critical severity issues
3. Create PRs or dismiss false positives
4. Set up email notifications
5. Monitor Security tab weekly
6. Merge security updates promptly

---

## References

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-dependency-updates)
- [Security Alerts](https://docs.github.com/en/code-security/repository-security-advisories)
- [Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

---

**Last Updated:** November 5, 2025
**Configuration Version:** 1.0
**Maintained By:** Project Team
