# Secrets Scanning Configuration Guide

## Overview

This document describes the secrets scanning setup for the Project Management Dashboard. Secrets scanning helps prevent accidental exposure of credentials, API keys, and other sensitive information.

## Current Configuration

### Secrets Scanning Status: ENABLED

Active Features:
1. Secret Scanning - ENABLED
2. Secret Scanning Push Protection - ENABLED
3. Secret Scanning Validity Checks - DISABLED (requires GitHub Enterprise)
4. Custom Pattern Scanning - DISABLED (requires GitHub Enterprise)

**Access:** https://github.com/paulkokos/project-management-dashboard/security/secret-scanning

---

## What Gets Scanned

### Standard Patterns (Automatically Detected)

The following types of secrets are automatically detected and scanned:

#### Authentication & API Keys
- AWS access keys and secret keys
- Google API keys
- GitHub tokens and PATs (Personal Access Tokens)
- GitLab tokens
- Slack tokens and webhooks
- Telegram bot tokens
- SendGrid API keys
- Stripe API keys
- Twilio API keys
- Mailchimp API keys

#### Cloud Provider Credentials
- Azure connection strings
- Google Cloud service account keys
- Firebase API keys
- Heroku API tokens
- DigitalOcean tokens
- Linode tokens

#### Database Credentials
- Database connection strings
- PostgreSQL passwords
- MySQL passwords
- MongoDB connection strings
- Redis passwords

#### Code Signing
- Private SSH keys
- PGP private keys
- Code signing certificates

#### Encryption Keys
- Encryption keys
- Private keys
- Master keys

#### Other Credentials
- OAuth tokens
- Bearer tokens
- AWS session tokens
- NPM tokens
- PyPI tokens

---

## How It Works

### Real-Time Scanning

1. **Commit Detection**
   - Scans all new commits
   - Checks commit history
   - Real-time analysis

2. **Push Protection** (ENABLED)
   - Blocks push if secrets detected
   - Provides warning message
   - Option to bypass (not recommended)

3. **Alert Creation**
   - Creates security alerts
   - Visible in Security tab
   - Can be dismissed if false positive

### Push Protection Flow

```
Developer attempts to push
         ↓
GitHub scans commit
         ↓
Secret detected?
    ↙           ↘
  YES            NO
   ↓              ↓
BLOCKED         ALLOWED
   ↓
Show warning
Display detected secret type
Option to bypass (risky!)
```

---

## Managing Detected Secrets

### If a Secret is Detected

1. **Block Attempt**
   ```
   git push origin branch

   # GitHub blocks with:
   Error: Push rejected
   Secret scanning detected secrets in your push.
   Type: GitHub Personal Access Token
   Location: config/settings.py:42
   ```

2. **Remediate the Secret**
   - Remove the secret from code
   - Never commit credentials in plain text
   - Use environment variables instead
   - Rotate the compromised credential

3. **Rebase and Push**
   ```bash
   # Remove secret and commit
   git add .
   git commit -m "Remove hardcoded credentials"
   git push origin branch
   ```

### If a Secret is Already Committed

1. **Create Clean-up Branch**
   ```bash
   git checkout -b fix/remove-secrets
   ```

2. **Remove from History**
   ```bash
   # Option 1: Use git filter-repo
   git filter-repo --replace-text replacements.txt

   # Option 2: Manually edit commit
   git rebase -i HEAD~5  # Rebase last 5 commits
   ```

3. **Force Push** (with caution)
   ```bash
   git push --force-with-lease origin fix/remove-secrets
   ```

4. **Rotate Compromised Credentials**
   - Change password/token immediately
   - All instances of the secret

5. **Create PR for Review**
   - Team reviews changes
   - Ensures history is clean
   - Merge after approval

---

## Best Practices

### Prevention

1. **Never Commit Secrets**
   ```python
   # WRONG - Never do this
   DATABASE_PASSWORD = "super_secret_123"
   API_KEY = "sk_live_abcd1234efgh5678"

   # RIGHT - Use environment variables
   DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
   API_KEY = os.getenv("API_KEY")
   ```

2. **Use Environment Variables**
   ```bash
   # Create .env file (in .gitignore)
   DATABASE_PASSWORD=super_secret_123
   API_KEY=sk_live_abcd1234efgh5678

   # Load in code
   import os
   from dotenv import load_dotenv

   load_dotenv()
   password = os.getenv("DATABASE_PASSWORD")
   api_key = os.getenv("API_KEY")
   ```

3. **Use Secrets Management Tools**
   - GitHub Secrets (for Actions)
   - HashiCorp Vault
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Secret Manager

4. **Configure .gitignore**
   ```
   # Environment files
   .env
   .env.local
   .env.*.local

   # IDE and OS
   .vscode/
   .idea/
   .DS_Store

   # Dependencies (may contain secrets)
   node_modules/
   __pycache__/

   # Build outputs
   dist/
   build/
   ```

5. **Code Review Checklist**
   - No hardcoded credentials
   - No API keys in code
   - No passwords in commits
   - Environment variables used
   - .gitignore updated

### Detection

1. **Regular Audits**
   - Review Security tab weekly
   - Check for new alerts
   - Dismiss false positives

2. **Monitoring**
   - Enable email notifications
   - Watch for push protection blocks
   - Set up alerts for critical services

3. **Rotation Schedule**
   - Rotate tokens regularly (30-90 days)
   - Change passwords periodically
   - Update API keys annually

---

## GitHub Actions & Secrets

### Using Secrets in Workflows

1. **Create Repository Secrets**
   ```
   Settings > Secrets and variables > Actions > New repository secret
   ```

2. **Reference in Workflow**
   ```yaml
   - name: Deploy to server
     env:
       DATABASE_PASSWORD: ${{ secrets.DATABASE_PASSWORD }}
       API_KEY: ${{ secrets.API_KEY }}
     run: |
       echo "Deploying..."
   ```

3. **Best Practices**
   - Never print secrets in logs
   - Use masking for sensitive output
   - Limit secret access to specific workflows
   - Rotate secrets regularly

### Example Workflow with Secrets

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          API_KEY: ${{ secrets.API_KEY }}
        run: |
          # Secrets are automatically masked in logs
          npm run deploy
```

---

## Handling False Positives

### Dismiss a Secret Alert

If a detected secret is a false positive:

1. **Go to Security Tab**
   - Navigate to Secret scanning
   - Find the alert

2. **Dismiss Alert**
   - Click on alert
   - Select "Dismiss alert"
   - Choose reason:
     - Used in tests
     - False positive
     - Not a real credential
     - Other

3. **Document the Reason**
   - Add comment explaining why
   - Helps team understand decision

### Examples of False Positives
- Test credentials in test files
- Example keys in documentation
- String patterns matching format
- Placeholder values like "xxxx"

---

## Rotation & Credential Management

### Regular Rotation Schedule

**Critical Credentials (30 days):**
- Database passwords
- API keys for production
- Authentication tokens
- SSH keys

**Standard Credentials (90 days):**
- Development API keys
- Third-party service keys
- Application passwords

**Low Risk Credentials (6-12 months):**
- Webhook signing secrets
- Internal service keys
- Non-production credentials

### Rotation Process

1. **Generate New Credential**
   - Create new API key, token, or password
   - Ensure new one works

2. **Update in All Locations**
   - GitHub Secrets
   - Environment files
   - Configuration management
   - Third-party services

3. **Revoke Old Credential**
   - Deactivate old key
   - Verify no systems using it
   - Delete from provider

4. **Document Change**
   - Log date of rotation
   - Record new secret ID
   - Update rotation calendar

---

## Reporting Detected Secrets

### If You Detect a Leaked Secret

1. **Act Immediately**
   - Rotate the credential
   - Change password
   - Revoke access tokens

2. **Clean Repository**
   - Remove from code
   - Remove from history
   - Create clean commit

3. **Notify Team**
   - Alert maintainers
   - Update security contacts
   - Follow incident response

4. **Update Logging**
   - Document incident
   - Record actions taken
   - Plan prevention

---

## Monitoring & Alerts

### Email Notifications
1. Go to Settings > Notifications
2. Enable "Secret scanning alerts"
3. Receive alerts for:
   - New detected secrets
   - Secret scanning configuration changes

### Check Security Tab
1. Visit Security > Secret scanning
2. View all alerts
3. Filter by type, status, date

### Set Up Automation
- Webhook to Slack/Teams
- Integration with SIEM
- Custom monitoring scripts

---

## Command Reference

### Git Commands
```bash
# View commit history
git log --oneline

# Show specific commit
git show <commit-hash>

# View file changes
git diff <file>

# Rebase for history rewrite (CAUTION)
git rebase -i HEAD~N

# Check for secrets before pushing
git diff --staged
```

### GitHub CLI Commands
```bash
# View secret scanning alerts
gh api repos/paulkokos/project-management-dashboard/secret-scanning/alerts

# Dismiss an alert
gh api repos/paulkokos/project-management-dashboard/secret-scanning/alerts/{alert_number} \
  -X PATCH \
  -f state='dismissed' \
  -f dismissed_reason='false_positive'

# Create a repository secret
gh secret set API_KEY --body "your-secret-value"

# List all secrets
gh secret list
```

---

## Common Secrets to Watch For

### Frontend (.env files)
```
VITE_API_BASE_URL=
VITE_API_KEY=
VITE_STRIPE_KEY=
VITE_SLACK_WEBHOOK=
```

### Backend (settings.py)
```
SECRET_KEY=
DATABASE_PASSWORD=
REDIS_PASSWORD=
AWS_SECRET_ACCESS_KEY=
SENDGRID_API_KEY=
```

### CI/CD (.github/workflows)
```yaml
DATABASE_URL: ${{ secrets.DATABASE_URL }}
API_KEY: ${{ secrets.API_KEY }}
DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```

---

## FAQ

### Q: Can I bypass push protection?
A: Yes, with `git push --no-verify` but NOT RECOMMENDED. Better to remove secret and recommit.

### Q: What if I accidentally pushed a secret?
A: Immediately rotate the credential, then clean the git history using `git filter-repo`.

### Q: Are secrets scanned in pull requests?
A: Yes, all PR commits are scanned. Secrets in PR diffs are blocked.

### Q: Does scanning check old commits?
A: Yes, GitHub performs historical scan of repository when enabled.

### Q: What about secrets in issues/discussions?
A: Different system. Keep secrets out of descriptions and comments too.

---

## References

- [GitHub Secret Scanning](https://docs.github.com/code-security/secret-scanning)
- [Protecting Credentials](https://docs.github.com/code-security/secret-scanning/about-secret-scanning)
- [Pushing with Secret Scanning](https://docs.github.com/code-security/secret-scanning/pushing-a-branch-blocked-by-push-protection)
- [Repository Secrets](https://docs.github.com/actions/security-guides/encrypted-secrets)
- [Git Filter Repo](https://github.com/newren/git-filter-repo)

---

## Current Repository Status

- Secret Scanning: ENABLED
- Push Protection: ENABLED
- Non-provider Patterns: Disabled (Enterprise only)
- Validity Checks: Disabled (Enterprise only)

---

**Last Updated:** November 5, 2025
**Configuration Version:** 1.0
**Maintained By:** Project Team
