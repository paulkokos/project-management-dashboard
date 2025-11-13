# Security Policy

## Reporting Security Vulnerabilities

At Project Management Dashboard, we take security seriously. We appreciate your efforts to responsibly disclose your findings.

### Do Not

- **Do not** open a public GitHub issue for security vulnerabilities
- **Do not** post security details in discussions, comments, or pull requests
- **Do not** publicly disclose the vulnerability before coordinated release

### Do

**Report security vulnerabilities privately** by:

1. **Email**: Send a detailed report to the project maintainers (create a GitHub Discussion marked as private if available, or email through GitHub profile)
2. **Include**:
   - Type of vulnerability and affected component
   - Steps to reproduce the issue
   - Potential impact and severity
   - Your contact information for follow-up
3. **Allow time** for the team to investigate and develop a fix (typically 90 days)

## Supported Versions

We release security updates for:

| Version | Supported          |
|---------|-------------------|
| Latest  | ✅ Full support   |
| N-1     | ✅ Security fixes |
| Older   | ❌ No support     |

## Security Practices

### Code Security

- **Dependency Scanning**: Automated dependency vulnerability scanning via Dependabot
- **Code Review**: All changes reviewed for security implications
- **Secrets Scanning**: Automated secrets detection to prevent credential leaks
- **Type Safety**: TypeScript and Python type hints to catch errors early

See [Secrets Scanning Guide](SECRETS_SCANNING_GUIDE.md) for implementation details.

### API Security

- **CORS**: Properly configured Cross-Origin Resource Sharing
- **CSRF Protection**: Django CSRF token protection on state-changing requests
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: All inputs validated and sanitized
- **Authentication**: JWT-based authentication for API requests
- **Authorization**: Role-based access control (RBAC)

### Data Security

- **Encryption**: Sensitive data encrypted at rest and in transit
- **Database**: Connection string and credentials secured
- **Environment Variables**: Sensitive configuration stored securely
- **Logging**: Sensitive information redacted from logs

### Frontend Security

- **XSS Prevention**: Content Security Policy (CSP) headers
- **HTTPS**: All traffic encrypted
- **Session Management**: Secure session handling and token refresh
- **Dependency Updates**: Regular security updates to dependencies

## Dependencies

We use:
- **Frontend**: React with security best practices
- **Backend**: Django with Django REST Framework
- **Database**: PostgreSQL

All dependencies are regularly updated and scanned for vulnerabilities via Dependabot.

## Infrastructure Security

- **Docker**: Minimal base images, regular updates
- **Environment Separation**: Development, staging, and production isolated
- **Access Control**: Limited deployment access
- **Monitoring**: Security event logging and monitoring

## Compliance

The project follows security best practices for:
- OWASP Top 10 vulnerability prevention
- NIST guidelines for secure development
- Industry standard security patterns

## Security Incident Response

If a security vulnerability is confirmed:

1. **Triage**: Assess severity and impact
2. **Patch Development**: Create fix in private branch
3. **Testing**: Thoroughly test the fix
4. **Release**: Publish security patch with advisory
5. **Disclosure**: Coordinate public disclosure timing
6. **Communication**: Notify affected users/systems

## Contact Security Team

For security concerns or to report vulnerabilities:

- Create a private GitHub Discussion if available
- Email through your GitHub profile
- Contact project maintainers via appropriate secure channel

## Acknowledgments

We appreciate security researchers and community members who responsibly report vulnerabilities. Depending on the severity and quality of the report, we may acknowledge your contribution in a security advisory.

---

**Last Updated**: November 2025
