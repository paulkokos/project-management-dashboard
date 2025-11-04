"""
Utility functions for the core application
"""

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response


def bulk_update_with_transaction(model_class, updates, filter_kwargs):
    """
    Perform bulk update with transaction safety

    Args:
        model_class: Django model class
        updates: Dictionary of fields to update
        filter_kwargs: Filter conditions

    Returns:
        Number of objects updated
    """
    with transaction.atomic():
        queryset = model_class.objects.filter(**filter_kwargs)
        count = queryset.update(**updates)
    return count


def get_paginated_response(data, count, page_size, request):
    """
    Generate paginated response

    Args:
        data: Serialized data
        count: Total count
        page_size: Items per page
        request: Request object

    Returns:
        Dictionary with pagination metadata
    """
    page = int(request.query_params.get("page", 1))
    total_pages = (count + page_size - 1) // page_size

    return {
        "count": count,
        "page": page,
        "total_pages": total_pages,
        "results": data,
    }


def calculate_progress_percentage(completed, total):
    """
    Calculate progress percentage safely

    Args:
        completed: Completed items
        total: Total items

    Returns:
        Percentage as integer (0-100)
    """
    if total == 0:
        return 0
    return min(100, max(0, int((completed / total) * 100)))


def format_error_response(message, code=None, details=None):
    """
    Format error response consistently

    Args:
        message: Error message
        code: Error code
        details: Additional details

    Returns:
        Formatted error dictionary
    """
    return {
        "success": False,
        "error": {
            "message": message,
            "code": code or "UNKNOWN_ERROR",
            "details": details or {},
        },
    }


class BulkOperationResult:
    """
    Result container for bulk operations
    """

    def __init__(self, total, succeeded, failed, errors=None):
        self.total = total
        self.succeeded = succeeded
        self.failed = failed
        self.errors = errors or []

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "total": self.total,
            "succeeded": self.succeeded,
            "failed": self.failed,
            "errors": self.errors,
        }

    def to_response(self):
        """Convert to API response"""
        return Response(
            self.to_dict(),
            status=(
                status.HTTP_200_OK if self.failed == 0 else status.HTTP_207_MULTI_STATUS
            ),
        )
