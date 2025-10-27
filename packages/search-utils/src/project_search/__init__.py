"""
Project Management Search Utilities

Django search utilities for Elasticsearch integration with permission-aware filtering.

Classes:
    - SearchService: Main search service for querying Elasticsearch
    - SearchPermissionMixin: Permission-aware filtering for search results
    - SearchIndexManager: Index management utilities

Usage:
    from project_search import SearchService

    service = SearchService()
    results = service.search(
        query="mobile app",
        filters={"status": "active"},
        user=request.user
    )
"""

__version__ = "1.0.0"
__author__ = "Paul Kokos"
__license__ = "MIT"

from .search_service import SearchService
from .permissions import SearchPermissionMixin
from .indexing import SearchIndexManager

__all__ = [
    "SearchService",
    "SearchPermissionMixin",
    "SearchIndexManager",
]
