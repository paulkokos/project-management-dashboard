"""
Custom exception handlers for the API
"""

from rest_framework import status
from rest_framework.exceptions import APIException


class OptimisticConcurrencyException(APIException):
    """Raised when optimistic concurrency control fails (ETag mismatch)"""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "Resource has been modified. Please refresh and try again."
    default_code = "conflict"


class SoftDeletedResourceException(APIException):
    """Raised when accessing soft-deleted resources"""

    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Resource has been deleted."
    default_code = "not_found"


def custom_exception_handler(exc, context):
    """
    Custom exception handler for API responses
    """
    from rest_framework.views import exception_handler

    response = exception_handler(exc, context)

    if response is not None:
        # Handle both dict and list responses
        if isinstance(response.data, dict):
            code = response.data.get("detail", "Unknown error")
        elif isinstance(response.data, list):
            code = response.data[0] if response.data else "Unknown error"
        else:
            code = "Unknown error"

        response.data = {
            "success": False,
            "error": {
                "code": code,
                "detail": str(response.data),
            },
        }

    return response
