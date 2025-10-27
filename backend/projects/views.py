"""
Views for Project API
"""

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.exceptions import OptimisticConcurrencyException
from websocket_service.channels_broadcast import (
    broadcast_milestone_change,
    broadcast_project_update,
    broadcast_team_member_change,
    notify_project_team,
)

from .models import (
    Activity,
    Milestone,
    Project,
    ProjectBulkOperation,
    Role,
    Tag,
    TeamMember,
)
from .permissions import (
    CanEditProject,
    CanViewProjectDetails,
    IsProjectOwner,
    can_view_project_details,
)
from .serializers import (
    ActivitySerializer,
    BulkUpdateSerializer,
    MilestoneSerializer,
    ProjectBulkOperationSerializer,
    ProjectCreateUpdateSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    RoleSerializer,
    TagSerializer,
    TeamMemberSerializer,
    UserSimpleSerializer,
)


class ProjectViewSet(viewsets.ModelViewSet):
    """Provides CRUD and custom actions for Projects."""

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "health", "owner", "tags"]
    search_fields = ["title", "description", "tags__name"]
    ordering_fields = ["title", "created_at", "updated_at", "progress"]
    ordering = ["-updated_at"]

    def get_queryset(self):
        """Get projects filtered by user's ownership or team membership"""
        user = self.request.user

        # Admin users can see all projects
        if user.is_superuser:
            return (
                Project.objects.all()
                .select_related("owner")
                .prefetch_related("tags", "team_members_details", "milestones")
            )

        # Return projects where user is owner OR a team member
        return (
            Project.objects.filter(Q(owner=user) | Q(team_members_details__user=user))
            .distinct()
            .select_related("owner")
            .prefetch_related("tags", "team_members_details", "milestones")
        )

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == "list":
            return ProjectListSerializer
        elif self.action == "retrieve":
            return ProjectDetailSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return ProjectCreateUpdateSerializer
        return ProjectListSerializer

    def get_permissions(self):
        """Instantiates and returns the list of permissions that this view requires."""
        if self.action in ["update", "partial_update"]:
            self.permission_classes = [IsAuthenticated, CanEditProject]
        elif self.action in ["retrieve", "activities"]:
            self.permission_classes = [IsAuthenticated, CanViewProjectDetails]
        elif self.action in [
            "soft_delete",
            "restore",
            "add_team_member",
            "remove_team_member",
            "update_team_member",
        ]:
            self.permission_classes = [IsAuthenticated, IsProjectOwner]
        else:
            # For 'list', 'create', and other actions, default to IsAuthenticated
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Create project and log activity"""
        project = serializer.save(owner=self.request.user)

        # Log activity
        Activity.objects.create(
            project=project,
            activity_type="created",
            user=self.request.user,
            description=f"Project '{project.title}' created",
        )

    def perform_update(self, serializer):
        """Update project and handle optimistic concurrency"""
        instance = self.get_object()
        # ETag check
        etag = self.request.data.get("etag")
        if etag and etag != instance.etag:
            raise OptimisticConcurrencyException()

        project = serializer.save()

        # Log activity
        metadata = {key: str(value) for key, value in serializer.validated_data.items()}
        Activity.objects.create(
            project=project,
            activity_type="updated",
            user=self.request.user,
            description=f"Project updated",
            metadata=metadata,
        )

        # Broadcast and notify
        broadcast_project_update(
            project_id=project.id,
            event_type="updated",
            data={"title": project.title, "status": project.status},
        )
        notify_project_team(
            project=project,
            event_type="project_updated",
            actor_user=self.request.user,
            title="Project Updated",
            message=f"Project '{project.title}' has been updated",
            exclude_user=self.request.user,
        )

    @action(detail=True, methods=["post"])
    def soft_delete(self, request, pk=None):
        """Soft delete a project"""
        project = self.get_object()
        project.soft_delete()

        Activity.objects.create(
            project=project,
            activity_type="updated",
            user=request.user,
            description=f"Project soft-deleted",
        )
        broadcast_project_update(
            project_id=project.id, event_type="deleted", data={"title": project.title}
        )
        notify_project_team(
            project=project,
            event_type="project_deleted",
            actor_user=request.user,
            title="Project Deleted",
            message=f"Project '{project.title}' has been deleted",
            exclude_user=request.user,
        )
        return Response(
            {"success": True, "message": "Project deleted"}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """Restore a soft-deleted project"""
        try:
            project = Project.objects.with_deleted().get(pk=pk)
            self.check_object_permissions(self.request, project)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if not project.is_deleted():
            return Response(
                {"error": "Project is not deleted"}, status=status.HTTP_400_BAD_REQUEST
            )

        project.restore()

        Activity.objects.create(
            project=project,
            activity_type="restored",
            user=request.user,
            description=f"Project restored",
        )
        broadcast_project_update(
            project_id=project.id, event_type="restored", data={"title": project.title}
        )
        notify_project_team(
            project=project,
            event_type="project_restored",
            actor_user=request.user,
            title="Project Restored",
            message=f"Project '{project.title}' has been restored",
            exclude_user=request.user,
        )
        serializer = self.get_serializer(project)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def deleted(self, request):
        """List soft-deleted projects"""
        if request.user.is_superuser:
            queryset = Project.objects.only_deleted()
        else:
            queryset = Project.objects.only_deleted().filter(owner=request.user)

        serializer = ProjectListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def empty_trash(self, request):
        """Permanently delete all soft-deleted projects (admin only)"""
        if not request.user.is_superuser:
            return Response(
                {"error": "Only admins can empty the trash"},
                status=status.HTTP_403_FORBIDDEN,
            )

        deleted_projects = Project.objects.only_deleted()
        count = deleted_projects.count()
        deleted_projects.delete()  # Hard delete

        return Response(
            {
                "success": True,
                "message": f"Permanently deleted {count} projects from trash",
                "deleted_count": count,
            }
        )

    @action(detail=True, methods=["post"])
    def add_team_member(self, request, pk=None):
        """Add a team member to the project."""
        project = self.get_object()
        serializer = TeamMemberSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project=project)
            Activity.objects.create(
                project=project,
                activity_type="team_added",
                user=request.user,
                description=f"Team member {serializer.validated_data['user_id']} added",
            )
            broadcast_team_member_change(
                project_id=project.id, event_type="added", member_data=serializer.data
            )
            notify_project_team(
                project=project,
                event_type="team_member_added",
                actor_user=request.user,
                title="Team Member Added",
                message=f"A new team member has been added to '{project.title}'",
                exclude_user=request.user,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["delete"])
    def remove_team_member(self, request, pk=None):
        """Remove a team member from the project."""
        project = self.get_object()
        user_id = request.data.get("user_id")
        try:
            team_member = TeamMember.objects.get(project=project, user_id=user_id)
            team_member.delete()
            Activity.objects.create(
                project=project,
                activity_type="team_removed",
                user=request.user,
                description=f"Team member {user_id} removed",
            )
            broadcast_team_member_change(
                project_id=project.id,
                event_type="removed",
                member_data={"user_id": user_id},
            )
            notify_project_team(
                project=project,
                event_type="team_member_removed",
                actor_user=request.user,
                title="Team Member Removed",
                message=f"A team member has been removed from '{project.title}'",
                exclude_user=request.user,
            )
            return Response({"success": True}, status=status.HTTP_200_OK)
        except TeamMember.DoesNotExist:
            return Response(
                {"error": "Team member not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=["patch"])
    def update_team_member(self, request, pk=None):
        """Update a team member's role and capacity."""
        project = self.get_object()
        user_id = request.data.get("user_id")
        try:
            team_member = TeamMember.objects.get(project=project, user_id=user_id)
            serializer = TeamMemberSerializer(
                team_member, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                Activity.objects.create(
                    project=project,
                    activity_type="team_added",  # Should be 'team_updated'
                    user=request.user,
                    description=f"Team member {user_id} updated",
                )
                broadcast_team_member_change(
                    project_id=project.id,
                    event_type="updated",
                    member_data=serializer.data,
                )
                notify_project_team(
                    project=project,
                    event_type="team_member_updated",
                    actor_user=request.user,
                    title="Team Member Updated",
                    message=f"A team member has been updated in '{project.title}'",
                    exclude_user=request.user,
                )
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except TeamMember.DoesNotExist:
            return Response(
                {"error": "Team member not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=["get"])
    def activities(self, request, pk=None):
        """Get recent activities for a project"""
        project = self.get_object()
        activities = project.activities.all()[:20]
        serializer = ActivitySerializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def bulk_update(self, request):
        """Update multiple projects atomically with optimistic concurrency control (owner only)"""
        serializer = BulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project_ids = serializer.validated_data["project_ids"]
        etag = serializer.validated_data["etag"]

        try:
            with transaction.atomic():
                # Filter projects to only those owned by the user
                projects = Project.objects.filter(
                    id__in=project_ids, owner=request.user
                )

                # Verify user has permission to update all requested projects
                if projects.count() != len(project_ids):
                    return Response(
                        {"error": "You can only bulk update projects you own"},
                        status=status.HTTP_403_FORBIDDEN,
                    )

                # Verify ETag matches (all projects must have same etag)
                for project in projects:
                    if project.etag != etag:
                        return Response(
                            {"error": "ETag mismatch. Data has been modified."},
                            status=status.HTTP_409_CONFLICT,
                        )

                # Update fields if provided
                if "status" in serializer.validated_data:
                    projects.update(status=serializer.validated_data["status"])

                if "health" in serializer.validated_data:
                    projects.update(health=serializer.validated_data["health"])

                if "tags" in serializer.validated_data:
                    tag_ids = serializer.validated_data["tags"]
                    for project in projects:
                        project.tags.set(tag_ids)

                # Regenerate ETags
                for project in projects:
                    project.save()

                # Log bulk operation activity
                Activity.objects.create(
                    project=projects.first() if projects.exists() else None,
                    activity_type="bulk_updated",
                    user=request.user,
                    description=f"Bulk updated {projects.count()} projects",
                )

                # Broadcast bulk update to all affected projects
                for project in projects:
                    broadcast_project_update(
                        project_id=project.id,
                        event_type="bulk_updated",
                        data={"updated_count": projects.count()},
                    )

                return Response(
                    {
                        "success": True,
                        "updated_count": projects.count(),
                        "projects": ProjectListSerializer(projects, many=True).data,
                    }
                )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TagViewSet(viewsets.ModelViewSet):
    """Provides CRUD operations for Tags."""

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]


class BulkOperationViewSet(viewsets.ViewSet):
    """Provides endpoints for performing bulk operations on projects."""

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"])
    def update_status(self, request):
        """Bulk update project status."""
        return self._perform_bulk_operation(
            operation_type="update_status", request=request
        )

    @action(detail=False, methods=["post"])
    def update_tags(self, request):
        """Bulk update project tags."""
        return self._perform_bulk_operation(
            operation_type="update_tags", request=request
        )

    @transaction.atomic
    def _perform_bulk_operation(self, operation_type, request):
        """Perform atomic bulk operation (owner only)."""
        project_ids = request.data.get("project_ids", [])
        changes = request.data.get("changes", {})

        if not project_ids:
            return Response(
                {"error": "project_ids required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Filter projects to only those owned by the user
            projects = Project.objects.filter(id__in=project_ids, owner=request.user)

            # Verify user has permission to update all requested projects
            if projects.count() != len(project_ids):
                return Response(
                    {"error": "You can only perform operations on projects you own"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if operation_type == "update_status":
                projects.update(status=changes.get("status"))
            elif operation_type == "update_tags":
                tag_ids = changes.get("tag_ids", [])
                for project in projects:
                    project.tags.set(tag_ids)

            # Log the bulk operation
            bulk_op = ProjectBulkOperation.objects.create(
                operation_type=operation_type,
                status="completed",
                performed_by=request.user,
                changes=changes,
            )
            bulk_op.projects.set(projects)

            return Response(
                {"success": True, "updated_count": projects.count()},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    """Provides a read-only endpoint for available Roles."""

    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
    ordering = ["sort_order", "display_name"]


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """Provides a read-only endpoint for Users, with profile update for authenticated users."""

    queryset = User.objects.all()
    serializer_class = UserSimpleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering = ["first_name", "last_name", "username"]

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
        """Get or update the details of the currently authenticated user."""
        if request.method == "GET":
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method == "PATCH":
            from projects.serializers import UserProfileSerializer

            serializer = UserProfileSerializer(
                request.user, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def change_password(self, request):
        """Change the password for the currently authenticated user."""
        from projects.serializers import ChangePasswordSerializer

        serializer = ChangePasswordSerializer(
            data=request.data, context={"user": request.user}
        )
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"message": "Password changed successfully"})


class MilestoneViewSet(viewsets.ModelViewSet):
    """Provides CRUD operations for Milestones."""

    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [OrderingFilter]
    ordering_fields = ["due_date", "created_at", "progress"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Get milestones for projects the user has access to"""
        user = self.request.user
        # Only milestones from projects user owns or is on
        return Milestone.objects.filter(
            Q(project__owner=user) | Q(project__team_members_details__user=user)
        ).distinct()

    def get_project(self):
        """Get the project from URL parameters"""
        project_id = self.request.query_params.get("project_id")
        if not project_id:
            raise PermissionDenied("project_id query parameter required")

        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            raise PermissionDenied("Project not found")

        # Check if user has access to this project
        if project.owner != self.request.user and not can_view_project_details(
            self.request.user, project
        ):
            raise PermissionDenied("You do not have access to this project")

        return project

    def check_can_edit_milestone(self, project):
        """Check if user can edit milestones in this project"""
        # Allow all users to edit milestones for now
        return True

    def perform_create(self, serializer):
        """Create milestone for project"""
        project = self.get_project()

        # Check if user can edit milestones
        if not self.check_can_edit_milestone(project):
            raise PermissionDenied(
                "You do not have permission to create milestones in this project"
            )

        milestone = serializer.save(project=project)

        # Log activity
        Activity.objects.create(
            project=project,
            activity_type="milestone_added",
            user=self.request.user,
            description=f"Milestone '{milestone.title}' created",
        )

        # Broadcast milestone creation to all subscribers
        broadcast_milestone_change(
            project_id=project.id,
            event_type="created",
            milestone_data={
                "id": milestone.id,
                "title": milestone.title,
                "progress": milestone.progress,
            },
        )

        # Notify team members
        notify_project_team(
            project=project,
            event_type="milestone_created",
            actor_user=self.request.user,
            title="Milestone Created",
            message=f"Milestone '{milestone.title}' has been created",
            exclude_user=self.request.user,
        )

    def perform_update(self, serializer):
        """Update milestone"""
        milestone = self.get_object()
        project = milestone.project

        # Check if user can edit milestones
        if not self.check_can_edit_milestone(project):
            raise PermissionDenied(
                "You do not have permission to edit milestones in this project"
            )

        updated_milestone = serializer.save()

        # Log activity
        Activity.objects.create(
            project=project,
            activity_type="progress_updated",
            user=self.request.user,
            description=f"Milestone '{updated_milestone.title}' updated (progress: {updated_milestone.progress}%)",
        )

        # Broadcast milestone update to all subscribers
        broadcast_milestone_change(
            project_id=project.id,
            event_type="updated",
            milestone_data={
                "id": updated_milestone.id,
                "title": updated_milestone.title,
                "progress": updated_milestone.progress,
            },
        )

        # Notify team members
        notify_project_team(
            project=project,
            event_type="milestone_updated",
            actor_user=self.request.user,
            title="Milestone Updated",
            message=f"Milestone '{updated_milestone.title}' has been updated",
            exclude_user=self.request.user,
        )

    def perform_destroy(self, instance):
        """Delete milestone"""
        project = instance.project

        # Check if user can edit milestones
        if not self.check_can_edit_milestone(project):
            raise PermissionDenied(
                "You do not have permission to delete milestones in this project"
            )

        milestone_title = instance.title
        milestone_id = instance.id
        instance.delete()

        # Log activity
        Activity.objects.create(
            project=project,
            activity_type="progress_updated",
            user=self.request.user,
            description=f"Milestone '{milestone_title}' deleted",
        )

        # Broadcast milestone deletion to all subscribers
        broadcast_milestone_change(
            project_id=project.id,
            event_type="deleted",
            milestone_data={"id": milestone_id, "title": milestone_title},
        )

        # Notify team members
        notify_project_team(
            project=project,
            event_type="milestone_deleted",
            actor_user=self.request.user,
            title="Milestone Deleted",
            message=f"Milestone '{milestone_title}' has been deleted",
            exclude_user=self.request.user,
        )

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Mark milestone as complete (progress = 100)"""
        milestone = self.get_object()
        project = milestone.project

        # Check if user can edit milestones
        if not self.check_can_edit_milestone(project):
            raise PermissionDenied(
                "You do not have permission to complete milestones in this project"
            )

        milestone.progress = 100
        milestone.save()

        # Log activity
        Activity.objects.create(
            project=project,
            activity_type="milestone_completed",
            user=request.user,
            description=f"Milestone '{milestone.title}' completed",
        )

        # Broadcast milestone completion to all subscribers
        broadcast_milestone_change(
            project_id=project.id,
            event_type="completed",
            milestone_data={
                "id": milestone.id,
                "title": milestone.title,
                "progress": milestone.progress,
            },
        )

        # Notify team members
        notify_project_team(
            project=project,
            event_type="milestone_completed",
            actor_user=request.user,
            title="Milestone Completed",
            message=f"Milestone '{milestone.title}' has been completed!",
            exclude_user=request.user,
        )

        serializer = self.get_serializer(milestone)
        return Response(serializer.data)
