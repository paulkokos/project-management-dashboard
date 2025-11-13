# Contributing to Project Management Dashboard

Thank you for your interest in contributing to the Project Management Dashboard! This document provides guidelines and instructions for contributing to our project.

## Code of Conduct

Please read and adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions with the community.

## Getting Started

### Prerequisites

Before you start contributing, ensure you have:

- Node.js (v18 or higher)
- Python (v3.10 or higher)
- Docker and Docker Compose (for local development)
- Git

### Setting Up Your Development Environment

1. **Fork the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/project-management-dashboard.git
   cd project-management-dashboard
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
   Follow our [Branching Strategy](BRANCHING_STRATEGY.md) for naming conventions.

3. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt

   # Frontend
   cd ../frontend
   npm install
   ```

4. **Set Up Local Development**
   - Follow the [Development Guide](DEVELOPMENT_GUIDE.md)
   - Use Docker Compose for local environment setup
   - Consult [Docker Desktop Deployment](DOCKER_DESKTOP_DEPLOYMENT.md) for setup instructions

## Ways to Contribute

### 1. Bug Reports

Found a bug? Please report it by:

- Checking if the issue already exists
- Creating a new GitHub issue with:
  - Clear description of the bug
  - Steps to reproduce
  - Expected vs actual behavior
  - Screenshots or logs if applicable
  - Your environment (OS, browser, versions)

### 2. Feature Requests

Have an idea for improvement? Submit a feature request by:

- Checking if it's already requested
- Creating a GitHub discussion or issue
- Describing the use case and expected behavior
- Explaining why this feature would be valuable

### 3. Code Contributions

Ready to code? Follow these steps:

#### Before You Code

- Check open issues and pull requests to avoid duplicate work
- Comment on an issue to express interest in working on it
- Discuss significant changes in an issue first
- Read relevant documentation in the `/docs` folder

#### Code Standards

- **Style Guide**: Follow the existing code style and conventions
- **Testing**: Write tests for new features (minimum 80% coverage)
- **Documentation**: Update documentation for any changes to functionality
- **Type Safety**: Use TypeScript for frontend and type hints for Python backend
- **Linting**: Ensure code passes linting checks:
  ```bash
  npm run lint          # Frontend
  pylint backend/**/*.py  # Backend
  ```

#### Commit Guidelines

- Use clear, descriptive commit messages
- Reference related issues: `Fix #123`, `Closes #456`
- Keep commits atomic and focused
- Follow conventional commit format where applicable:
  ```
  type(scope): description

  Longer explanation if needed.

  Fixes #issue-number
  ```

#### Pull Request Process

1. **Create a Draft PR** early for significant changes to get feedback
2. **Provide Description**:
   - Summary of changes
   - Link to related issues
   - Screenshots for UI changes
   - Testing instructions

3. **Ensure Quality**:
   - All tests pass
   - No console errors or warnings
   - Code follows style guidelines
   - Documentation is updated

4. **Wait for Review**:
   - Address reviewer feedback promptly
   - Re-request review after making changes
   - Be respectful and collaborative

5. **Merge**:
   - Maintainers will merge when approved
   - Delete your feature branch after merge

## Testing

- **Run Tests**:
  ```bash
  # Frontend
  npm run test

  # Backend
  pytest backend/
  ```

- **Coverage Requirements**: Aim for minimum 80% code coverage
- **Test Types**: Include unit tests, integration tests, and e2e tests where applicable

## Documentation

- Update relevant `.md` files in `/docs`
- Keep API documentation current
- Document new features and major changes
- Update IMPLEMENTATION_STATUS.md if adding/changing features

## Review Process

### What to Expect

- Code review by at least one maintainer
- Automated checks (linting, tests, security scans)
- Potentially multiple rounds of feedback

### As a Reviewer

- Be respectful and constructive
- Focus on code quality and maintainability
- Ask clarifying questions
- Approve when standards are met

## Deployment

Contributions go through the following pipeline:

1. Feature branch → Pull Request (develop branch)
2. Code review and testing
3. Merge to develop branch
4. Testing in staging environment
5. Release to main branch

See [Branching Strategy](BRANCHING_STRATEGY.md) for details.

## Community

- **Discussions**: Use GitHub Discussions for questions and ideas
- **Issues**: Report bugs and request features
- **Security**: See [SECURITY.md](SECURITY.md) for security issue reporting

## Resources

- [Development Guide](DEVELOPMENT_GUIDE.md)
- [API Guide](API_GUIDE.md)
- [Branching Strategy](BRANCHING_STRATEGY.md)
- [Docker Desktop Deployment](DOCKER_DESKTOP_DEPLOYMENT.md)
- [Implementation Status](IMPLEMENTATION_STATUS.md)

## Questions?

Feel free to:
- Create a GitHub Discussion
- Ask in an issue
- Contact project maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for making Project Management Dashboard better!

**Last Updated**: November 2025
