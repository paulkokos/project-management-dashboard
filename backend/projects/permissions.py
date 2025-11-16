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


class CanViewProjectTasks(BasePermission):
    """
    Allows view access to tasks in projects the user has access to.
    """

    def has_object_permission(self, request, view, obj):
        return can_view_project_details(request.user, obj.project)


class CanEditTask(BasePermission):
    """
    Allows edit access to tasks:
    - Admins can edit all tasks
    - Task assignee can edit their assigned tasks
    - Project owner and leads can edit all project tasks
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return can_view_project_details(request.user, obj.project)

        if request.user.is_superuser:
            return True

        # Project owner can edit all tasks
        if obj.project.owner == request.user:
            return True

        # Assignee can edit their task
        if obj.assigned_to == request.user:
            return True

        # Check if user is a lead/manager on the project
        try:
            team_member = TeamMember.objects.get(project=obj.project, user=request.user)
            return team_member.role.key in ["lead", "manager"]
        except TeamMember.DoesNotExist:
            return False


class IsTaskAssigneeOrAdmin(BasePermission):
    """
    Allows access only to task assignee or admin.
    """

    def has_object_permission(self, request, view, obj):
        return obj.assigned_to == request.user or request.user.is_superuser
