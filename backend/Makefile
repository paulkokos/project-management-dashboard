.PHONY: help lint lint-tests lint-fix format black flake8 test

VENV := . venv/bin/activate &&

help:
	@echo "Available commands:"
	@echo "  make lint          - Run all linters (flake8)"
	@echo "  make lint-tests    - Lint test files only"
	@echo "  make lint-fix      - Auto-fix code style issues with black"
	@echo "  make black         - Run black formatter"
	@echo "  make black-check   - Check black formatting without changes"
	@echo "  make flake8        - Run flake8 linter"
	@echo "  make flake8-tests  - Lint tests with flake8"
	@echo "  make test          - Run all tests (requires Docker)"
	@echo "  make test-fast     - Run tests without migrations (requires Docker)"
	@echo "  make test-coverage - Run tests with coverage report (requires Docker)"

lint:
	$(VENV) flake8 . --exclude migrations,venv

lint-tests:
	$(VENV) flake8 --select=F,E,W */tests tests --show-source --statistics

lint-fix:
	$(VENV) black .

black:
	$(VENV) black . --check --diff

black-check:
	$(VENV) black . --check

flake8:
	$(VENV) flake8 . --exclude migrations,venv,tests

flake8-tests:
	$(VENV) flake8 projects/tests --show-source --statistics

test:
	cd .. && docker-compose -f docker-compose.dev.yml exec -T backend python -m pytest -v

test-fast:
	cd .. && docker-compose -f docker-compose.dev.yml exec -T backend python -m pytest -v --no-migrations

test-coverage:
	cd .. && docker-compose -f docker-compose.dev.yml exec -T backend python -m pytest --cov=projects --cov=core --cov-report=html
