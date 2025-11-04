from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="project-management-search-utils",
    version="1.0.8",
    author="Paul Kokos",
    author_email="paulkokos@example.com",
    description="Django search utilities for Elasticsearch integration with permission-aware filtering",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/paulkokos/project-management-dashboard",
    project_urls={
        "Bug Tracker": "https://github.com/paulkokos/project-management-dashboard/issues",
        "Documentation": "https://github.com/paulkokos/project-management-dashboard/tree/master/packages/search-utils",
        "Source Code": "https://github.com/paulkokos/project-management-dashboard/tree/master/packages/search-utils",
    },
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Framework :: Django",
        "Framework :: Django :: 5.0",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Topic :: Internet :: WWW/HTTP",
    ],
    python_requires=">=3.11",
    install_requires=[
        "Django>=5.0",
        "djangorestframework>=3.14",
        "django-haystack>=3.2",
        "elasticsearch>=8.0,<9.0",
    ],
    extras_require={
        "dev": [
            "pytest>=8.0",
            "pytest-django>=4.7",
            "black>=23.0",
            "flake8>=6.0",
            "isort>=5.0",
        ],
    },
)
