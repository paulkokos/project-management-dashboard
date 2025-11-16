# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please email security@example.com with:
- Description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Suggested fix (if you have one)

Please do NOT create public GitHub issues for security vulnerabilities.

## Security Best Practices

### Backend Security

#### Authentication & Authorization
- ✅ JWT token-based authentication implemented
- ✅ Permission classes enforce object-level access control
- ✅ Role-based access control (RBAC) via TeamMember relationships
- ✅ Superuser can override all permissions
- ⚠️ Ensure JWT_SECRET is strong and rotated regularly

#### Data Protection
- ✅ Soft delete pattern prevents data loss
- ✅ Optimistic concurrency control via ETag versioning
- ✅ Activity audit trails track all changes
- ✅ User filtering ensures data isolation
- ⚠️ Sensitive data in Activity.metadata should not log passwords

#### API Security
- ✅ CORS headers configured to restrict cross-origin requests
- ✅ Rate limiting applied via middleware (configure in settings)
- ✅ Input validation on all serializers
- ✅ XSS prevention via content sanitization
- ⚠️ SQL injection protection via ORM (no raw queries)

#### Database
- ✅ Query optimization prevents information disclosure via timing attacks
- ✅ Database user has limited permissions
- ✅ Migrations tracked in version control
- ⚠️ Use parameterized queries (Django ORM default)
- ⚠️ Regular backups of production database

#### Dependencies
- ✅ Dependabot auto-updates for security patches
- ✅ GitHub security scanning enabled
- ✅ requirements.txt pinned versions
- ⚠️ Review dependency updates before merging
- ⚠️ Run `pip audit` before releases

### Frontend Security

#### Authentication & Authorization
- ✅ JWT tokens stored in httpOnly cookies (if configured)
- ✅ Role-based UI elements hidden based on permissions
- ✅ Permission checks before API calls
- ⚠️ Never store sensitive data in localStorage

#### XSS Prevention
- ✅ React sanitizes string content by default
- ✅ DOMPurify used for HTML content (if applicable)
- ✅ Content Security Policy headers recommended
- ⚠️ Avoid dangerouslySetInnerHTML

#### API Communication
- ✅ HTTPS enforced in production
- ✅ Bearer token in Authorization header
- ✅ CORS requests validated
- ⚠️ Implement request signing for sensitive operations
- ⚠️ Add rate limit handling on client

### WebSocket Security

#### Connection
- ✅ Permission verification on connection
- ✅ User authentication required
- ✅ Project access validation
- ⚠️ Implement heartbeat/ping-pong for stale connection detection
- ⚠️ Close connection on auth failure

#### Data
- ✅ User-scoped messages
- ✅ Project-scoped groups
- ⚠️ Never broadcast sensitive data (passwords, tokens, PII)
- ⚠️ Validate message format and type

## Security Checklist for Deployments

### Before Deploying to Production

- [ ] Update all dependencies: `pip install --upgrade -r requirements.txt`
- [ ] Run security audit: `pip audit` and `npm audit`
- [ ] Set strong Django SECRET_KEY (minimum 64 characters)
- [ ] Set DEBUG=False in production
- [ ] Configure ALLOWED_HOSTS with your domains only
- [ ] Enable HTTPS and HSTS headers
- [ ] Set secure cookie flags: `SESSION_COOKIE_SECURE=True`, `CSRF_COOKIE_SECURE=True`
- [ ] Run database migrations: `python manage.py migrate`
- [ ] Collect static files: `python manage.py collectstatic --noinput`
- [ ] Run tests: `pytest` and `npm test`
- [ ] Review CORS settings - restrict to your frontend domain only
- [ ] Configure rate limiting appropriate for your load
- [ ] Enable security headers: X-Frame-Options, X-Content-Type-Options, etc.
- [ ] Set up logging and monitoring for suspicious activity
- [ ] Backup database before deployment
- [ ] Have a rollback plan ready

### Environment Variables Required

```bash
# Django Core
SECRET_KEY=<strong-random-string>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host/db

# JWT
JWT_SECRET=<strong-random-string>
JWT_ALGORITHM=HS256

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=app-specific-password

# Redis (for caching and WebSocket)
REDIS_URL=redis://localhost:6379/0
```

## Known Vulnerabilities and Mitigations

### Dependency Vulnerabilities (18 identified)

The current scan identified 18 vulnerabilities:
- **1 Critical**: Upgrade affected packages immediately
- **5 High**: Upgrade within 1-2 weeks
- **11 Moderate**: Upgrade within 1 month
- **1 Low**: Upgrade as part of regular maintenance

**Action Items:**
1. Run `dependabot` security update PRs
2. Review and test each dependency update
3. Monitor GitHub security advisories weekly
4. Schedule quarterly security updates

### Application Security

#### Permissions System
- Verify TeamMember checks before granting access
- Regular audit of team memberships
- Deactivate users immediately when they leave
- Review admin user list monthly

#### Activity Logging
- Monitor suspicious activity patterns
- Alert on multiple failed login attempts
- Track mass deletions or bulk updates
- Review permission change logs

## Security Testing

### Automated Tests
- Run: `pytest backend/projects/tests/test_permissions.py`
- Coverage: 95%+ of permission checks
- CI/CD: All tests must pass before merge

### Manual Testing
- Test with different user roles (admin, member, non-member)
- Verify permission denied responses (403)
- Test with invalid/expired tokens
- Verify CORS restrictions
- Test WebSocket with unauthorized connections

## Response to Security Incidents

1. **Identify**: Determine scope and severity
2. **Isolate**: Disable affected features if necessary
3. **Notify**: Alert affected users if data was exposed
4. **Remediate**: Fix the vulnerability
5. **Review**: Conduct post-incident review to prevent recurrence
6. **Document**: Update this SECURITY.md with lessons learned

## Version History

| Date | Change | Impact |
|------|--------|--------|
| 2025-11-17 | Initial security policy | Baseline security documentation |

## Contact

For security questions or reports, contact: security@example.com

**Do not** create public GitHub issues for security vulnerabilities.
