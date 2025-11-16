"""
Custom permissions for the projects app.
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import TeamMember


def can_view_project_details(user, project):
    """
    Helper function to check if a user can view project details.
    """
    if user.is_superuser or project.owner == user:
        return True
    return TeamMember.objects.filter(project=project, user=user).exists()


class CanViewProjectDetails(BasePermission):
    """
    Allows access only to project owners, team members, or admins.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or obj.owner == request.user:
            return True

        # Check if the user is a team member
        return TeamMember.objects.filter(project=obj, user=request.user).exists()


class CanEditProject(BasePermission):
    """
    Allows write access only to project owners, specific team roles, or admins.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any user that can view the project
        if request.method in SAFE_METHODS:
            return CanViewProjectDetails().has_object_permission(request, view, obj)

        # Write permissions are more restrictive
        if request.user.is_superuser or obj.owner == request.user:
            return True

        # Check for specific team roles that allow editing
        try:
            team_member = TeamMember.objects.get(project=obj, user=request.user)
            return team_member.role.key in ["lead", "manager"]
        except TeamMember.DoesNotExist:
            return False


class IsProjectOwner(BasePermission):
    """
    Allows access only to the project owner.
    """

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user or request.user.is_superuser


class CanViewProjectComments(BasePermission):
    """
    Allows viewing comments only to users who can view the project.
    """

    def has_permission(self, request, view):
        # Get the project_id from the URL or query parameters
        project_id = view.kwargs.get("project_id") or request.query_params.get("project_id")
        if not project_id:
            return False

        from .models import Project
        try:
            project = Project.objects.get(id=project_id)
            return can_view_project_details(request.user, project)
        except Project.DoesNotExist:
            return False


class IsCommentAuthorOrAdmin(BasePermission):
    """
    Allows editing/deleting comments only to the author or admins.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions allowed to anyone who can view the project
        if request.method in SAFE_METHODS:
            return can_view_project_details(request.user, obj.project)

        # Write permissions only for author or admin
        return obj.author == request.user or request.user.is_superuser
