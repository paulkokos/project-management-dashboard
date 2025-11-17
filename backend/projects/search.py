"""
Elasticsearch search functionality for projects
"""

from haystack.query import SearchQuerySet
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project
from .serializers import ProjectListSerializer


class ProjectSearchViewSet(viewsets.ViewSet):
    """
    ViewSet for searching projects using Elasticsearch

    Provides full-text search across project titles, descriptions, and tags
    with faceting and filtering capabilities.
    """

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def search(self, request):
        """
        Full-text search across projects

        Query Parameters:
        - q: Search query (required)
        - status: Filter by status (optional)
        - health: Filter by health (optional)
        - owner: Filter by owner username (optional)
        - page: Page number (default: 1)
        - page_size: Results per page (default: 20)

        Returns:
        - results: List of matching projects
        - facets: Available filter options with counts
        - total: Total number of results
        - page: Current page number
        """
        query = request.query_params.get("q", "")
        status_filter = request.query_params.get("status")
        health_filter = request.query_params.get("health")
        owner_filter = request.query_params.get("owner")
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))

        if not query:
            return Response(
                {"error": "Search query (q) is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get user's accessible projects
        user = request.user
        if user.is_superuser:
            accessible_projects = Project.objects.filter(
                deleted_at__isnull=True
            ).values_list("id", flat=True)
        else:
            from django.db.models import Q

            accessible_projects = (
                Project.objects.filter(
                    Q(owner=user) | Q(team_members_details__user=user), deleted_at__isnull=True
                )
                .distinct()
                .values_list("id", flat=True)
            )

        # Perform Elasticsearch search
        sqs = SearchQuerySet().models(Project).filter(content=query)

        # Apply filters
        if status_filter:
            sqs = sqs.filter(status=status_filter)
        if health_filter:
            sqs = sqs.filter(health=health_filter)
        if owner_filter:
            sqs = sqs.filter(owner=owner_filter)

        # Filter by accessible projects
        sqs = sqs.filter(django_id__in=accessible_projects)

        # Get total count
        total = sqs.count()

        # Get facets
        facets = {"statuses": {}, "healths": {}, "owners": {}}

        try:
            faceted_results = sqs.facet("status").facet("health").facet("owner")
            if hasattr(faceted_results, "facet_counts"):
                if "fields" in faceted_results.facet_counts():
                    facets["statuses"] = dict(
                        faceted_results.facet_counts()["fields"].get("status", [])
                    )
                    facets["healths"] = dict(
                        faceted_results.facet_counts()["fields"].get("health", [])
                    )
                    facets["owners"] = dict(
                        faceted_results.facet_counts()["fields"].get("owner", [])
                    )
        except Exception:
            # If faceting fails, continue without facets
            pass

        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        paginated_results = sqs[start:end]

        # Get actual project objects
        result_ids = [int(result.pk) for result in paginated_results]
        projects = (
            Project.objects.filter(id__in=result_ids, deleted_at__isnull=True)
            .select_related("owner")
            .prefetch_related("tags", "team_members")
        )

        # Serialize results
        serializer = ProjectListSerializer(projects, many=True)

        return Response(
            {
                "results": serializer.data,
                "facets": facets,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size,
            }
        )

    @action(detail=False, methods=["get"])
    def autocomplete(self, request):
        """
        Search suggestions for autocomplete

        Query Parameters:
        - q: Partial query for suggestions (required)
        - limit: Number of suggestions (default: 10)

        Returns:
        - suggestions: List of suggested titles and tags
        """
        query = request.query_params.get("q", "").strip()
        limit = int(request.query_params.get("limit", 10))

        if not query or len(query) < 2:
            return Response({"suggestions": []})

        # Get user's accessible projects
        user = request.user
        if user.is_superuser:
            accessible_projects = Project.objects.filter(
                deleted_at__isnull=True
            ).values_list("id", flat=True)
        else:
            from django.db.models import Q

            accessible_projects = (
                Project.objects.filter(
                    Q(owner=user) | Q(team_members_details__user=user), deleted_at__isnull=True
                )
                .distinct()
                .values_list("id", flat=True)
            )

        # Search for suggestions
        sqs = (
            SearchQuerySet()
            .models(Project)
            .filter(content__istartswith=query)
            .filter(django_id__in=accessible_projects)[:limit]
        )

        suggestions = []
        for result in sqs:
            suggestions.append(
                {"title": result.title, "id": result.pk, "type": "project"}
            )

        return Response({"suggestions": suggestions[:limit]})
