"""
SearchPermissionMixin Module

Provides permission-aware filtering for search results.

For the full implementation, see:
https://github.com/paulkokos/project-management-dashboard/blob/master/backend/projects/search.py
"""

from typing import Any, List, Optional
from django.contrib.auth.models import User
from django.db.models import Q, QuerySet


class SearchPermissionMixin:
    """
    Mixin for permission-aware search filtering.

    This mixin provides methods to filter search results based on user permissions.
    It ensures that users can only see projects they have access to.

    Only projects the user owns or is a team member of will be included in results.
    Superusers can see all projects.

    Example:
        ```python
        from project_search import SearchPermissionMixin
        from django.contrib.auth.models import User

        class ProjectSearchService(SearchPermissionMixin):
            def search(self, user: User, query: str):
                accessible_projects = self.get_accessible_projects(user)
                # Use accessible_projects to filter search results
                ...

        service = ProjectSearchService()
        projects = service.search(user=request.user, query="mobile app")
        ```
    """

    def get_accessible_projects(self, user: Optional[User]) -> QuerySet:
        """
        Get projects accessible to the given user.

        Args:
            user: Django User object or None for anonymous access

        Returns:
            QuerySet of accessible projects

        Raises:
            ValueError: If user is not authenticated and anonymous access is disabled

        Note:
            Superusers have access to all projects.
            Regular users can access projects they own or are team members of.
            Anonymous users have no access unless explicitly configured.

        Example:
            ```python
            from django.contrib.auth.models import User
            from project_search import SearchPermissionMixin

            mixin = SearchPermissionMixin()
            user = User.objects.get(username='john')
            accessible = mixin.get_accessible_projects(user)
            # Returns QuerySet of projects where user is owner or team member
            ```
        """
        from projects.models import Project

        if user is None:
            raise ValueError(
                "Anonymous access not supported. User authentication required."
            )

        if user.is_superuser:
            return Project.objects.all()

        return Project.objects.filter(
            Q(owner=user) | Q(team_members__user=user)
        ).distinct()

    def filter_by_permissions(
        self, queryset: QuerySet, user: Optional[User]
    ) -> QuerySet:
        """
        Filter a queryset to include only accessible projects.

        Args:
            queryset: QuerySet to filter
            user: Django User object or None

        Returns:
            Filtered QuerySet containing only accessible projects

        Raises:
            ValueError: If user is not authenticated

        Example:
            ```python
            from projects.models import Project
            from project_search import SearchPermissionMixin

            mixin = SearchPermissionMixin()
            projects = Project.objects.all()
            filtered = mixin.filter_by_permissions(projects, user=request.user)
            # Returns only projects accessible to request.user
            ```
        """
        if user is None:
            raise ValueError(
                "Anonymous access not supported. User authentication required."
            )

        if user.is_superuser:
            return queryset

        return queryset.filter(
            Q(owner=user) | Q(team_members__user=user)
        ).distinct()

    def has_project_access(self, user: Optional[User], project_id: int) -> bool:
        """
        Check if user has access to a specific project.

        Args:
            user: Django User object or None
            project_id: ID of the project to check

        Returns:
            True if user has access, False otherwise

        Raises:
            ValueError: If user is not authenticated

        Example:
            ```python
            from project_search import SearchPermissionMixin

            mixin = SearchPermissionMixin()
            has_access = mixin.has_project_access(
                user=request.user,
                project_id=42
            )
            if has_access:
                print("User can access this project")
            ```
        """
        if user is None:
            return False

        if user.is_superuser:
            return True

        from projects.models import Project

        return Project.objects.filter(
            Q(owner=user) | Q(team_members__user=user), id=project_id
        ).exists()

    def get_accessible_project_ids(self, user: Optional[User]) -> List[int]:
        """
        Get list of project IDs accessible to the user.

        Useful for filtering Elasticsearch results by project ID.

        Args:
            user: Django User object or None

        Returns:
            List of accessible project IDs

        Raises:
            ValueError: If user is not authenticated

        Example:
            ```python
            from project_search import SearchPermissionMixin
            from projects.search import search_elasticsearch

            mixin = SearchPermissionMixin()
            project_ids = mixin.get_accessible_project_ids(user=request.user)

            # Use project_ids to filter Elasticsearch results
            results = search_elasticsearch(query="mobile", project_ids=project_ids)
            ```
        """
        if user is None:
            raise ValueError(
                "Anonymous access not supported. User authentication required."
            )

        accessible_projects = self.get_accessible_projects(user)
        return list(accessible_projects.values_list("id", flat=True))
