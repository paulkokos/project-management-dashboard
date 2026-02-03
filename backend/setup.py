"""
Setup configuration for Project Management Dashboard backend library
Publishable as a PIP package
"""

from setuptools import find_packages, setup

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="project-management-dashboard",
    version="1.0.0",
    author="Your Name",
    author_email="your.email@example.com",
    description="Django backend library for Project Management Dashboard with real-time capabilities",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/project-management-dashboard",
    packages=find_packages(exclude=["tests", "*.tests", "*.tests.*", "tests.*"]),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Environment :: Web Environment",
        "Framework :: Django :: 4.2",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries",
    ],
    python_requires=">=3.11",
    install_requires=[
        "Django>=4.2.7,<6.0",
        "djangorestframework>=3.14.0",
        "django-cors-headers>=4.3.1",
        "django-filter>=23.4",
        "django-extensions>=3.2.3",
        "django-ratelimit>=4.1.0",
        "psycopg2-binary>=2.9.9",
        "django-dbbackup>=4.0.2",
        "channels>=4.0.0",
        "channels-redis>=4.1.0",
        "daphne>=4.0.0",
        "python-socketio>=5.9.0",
        "python-engineio>=4.7.1",
        "celery>=5.3.4",
        "redis>=5.0.1",
        "django-redis>=5.4.0",
        "djangorestframework-simplejwt>=5.3.1",
        "coreapi>=2.3.3",
        "python-dateutil>=2.8.2",
        "pytz>=2023.3",
        "django-haystack>=3.2.1",
        "elasticsearch>=8.11.0",
        "python-dotenv>=1.0.0",
        "Pillow>=10.1.0",
        "requests>=2.31.0",
        "sentry-sdk>=1.39.1",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "pytest-django>=4.7.0",
            "pytest-cov>=4.1.0",
            "factory-boy>=3.3.0",
            "black>=23.12.0",
            "flake8>=6.1.0",
            "isort>=5.13.0",
        ],
        "production": [
            "gunicorn>=21.2.0",
            "whitenoise>=6.6.0",
        ],
    },
    include_package_data=True,
    entry_points={
        "console_scripts": [
            "project-dashboard-manage=manage:main",
        ],
    },
)
