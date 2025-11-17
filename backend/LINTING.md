# Test Linting & Code Quality Guide

This project uses comprehensive linting and code formatting tools for both the main codebase and test files.

## Tools Installed

### Python Linting & Formatting
- **Black 25.11.0** - Code formatter (line length: 100)
- **Flake8 7.3.0** - Code quality linter
- **Pytest 9.0.1** - Test runner

### Configuration Files
- `.flake8` - Flake8 configuration
- `setup.cfg` - Black and Pytest configuration
- `Makefile` - Convenient make targets for common tasks

## Quick Commands

### Run All Linters
```bash
make lint                    # Run flake8 on all code
make flake8-tests           # Lint test files specifically
```

### Format Code
```bash
make lint-fix               # Auto-format with black
black .                     # Format entire project
black --check .             # Check without changing files
```

### Run Tests
```bash
make test                   # Run all tests with output
make test-fast              # Run without migrations
make test-coverage          # Generate coverage report
```

## Linting Configuration

### Flake8 Rules
- **Excluded**: migrations, venv, __pycache__, .pytest_cache
- **Max line length**: 100 characters
- **Ignored rules for tests**: F401 (unused import), F811 (duplicate), E501 (line too long)

### Black Settings
- **Line length**: 100 characters
- **Target version**: Python 3.12
- **Excludes**: migrations, venv, .git, build directories

## Test File Standards

Test files must follow these standards:

1. **No unused variables** - Use `# noqa: F841` if necessary
2. **Proper spacing** - `x + 1` not `x+1` around operators
3. **Line length** - Max 100 characters (exceptions documented with noqa)
4. **Imports** - Remove unused imports (F401)
5. **Code formatting** - Follows Black formatting

## Example Usage

### Check test files for issues
```bash
flake8 projects/tests test_*.py --statistics
```

### Auto-fix formatting
```bash
black projects/tests/
```

### Run specific tests
```bash
python -m pytest projects/tests/test_api_projects.py -v
```

## Common Issues & Fixes

### Unused variable warning
```python
# Before
variable_name = some_value

# After (if variable is unused but intentional)
variable_name = some_value  # noqa: F841
```

### Missing whitespace around operators
```python
# Before
result = x+1

# After
result = x + 1
```

### Line too long (in tests only)
```python
# Use noqa comment for long test lines
very_long_assertion = "This is a very long string that exceeds 100 chars"  # noqa: E501
```

## CI/CD Integration

All pull requests should pass:
- `flake8 projects/tests --exclude migrations,venv`
- `black --check .`
- `pytest --no-migrations`

## Helpful Commands

```bash
# See all available make targets
make help

# Run everything (lint + format + test)
make lint && make lint-fix && make test

# Check specific test file
flake8 projects/tests/test_api_projects.py -v

# Format specific directory
black projects/tests/

# View flake8 violations by type
flake8 . --statistics --exclude migrations,venv
```

---

For more information, see the project configuration files or run `make help`.
