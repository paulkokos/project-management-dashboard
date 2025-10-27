"""
Serializers for the Project API, responsible for converting model instances to JSON.
"""

from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Activity,
    Milestone,
    Project,
    ProjectBulkOperation,
    Role,
    Tag,
    TeamMember,
)


class UserSimpleSerializer(serializers.ModelSerializer):
    """A simplified serializer for the User model for nested relationships.

    This serializer provides a lightweight representation of a user, suitable for
    embedding within other serializers like `ProjectListSerializer`.

    Attributes:
        is_admin: A boolean field indicating if the user is a superuser.
    """

    is_admin = serializers.BooleanField(source="is_superuser", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_admin"]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration/signup.

    Validates username and email uniqueness, password confirmation, and creates
    a new User instance with the provided credentials.
    """

    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    is_admin = serializers.BooleanField(source="is_superuser", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "is_admin",
        ]
        read_only_fields = ["id", "is_admin"]

    def validate(self, data):
        """Validate that passwords match and other constraints."""
        if data["password"] != data.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match"}
            )
        return data

    def validate_username(self, value):
        """Ensure username is unique."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        """Ensure email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value

    def create(self, validated_data):
        """Create a new user with hashed password."""
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile viewing and editing.

    Used for retrieving and updating user profile information.
    """

    is_admin = serializers.BooleanField(source="is_superuser", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_admin"]
        read_only_fields = ["id", "username", "is_admin"]

    def validate_email(self, value):
        """Ensure email is unique (excluding current user)."""
        user = self.instance
        if user and User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("Email already registered")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password.

    Validates current password and ensures new passwords match.
    """

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        """Verify that current password is correct."""
        user = self.context.get("user")
        if not user or not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value

    def validate(self, data):
        """Validate that new passwords match."""
        if data["new_password"] != data["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match"}
            )
        return data


class TagSerializer(serializers.ModelSerializer):
    """Serializer for the Tag model."""

    class Meta:
        model = Tag
        fields = ["id", "name", "color", "description", "created_at"]


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for the Role model, including styling information."""

    class Meta:
        model = Role
        fields = [
            "id",
            "key",
            "display_name",
            "description",
            "color",
            "bg_color",
            "text_color",
            "border_color",
            "sort_order",
        ]


class TeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for the TeamMember model.

    Handles the serialization of team members, including nested user and role
    information. Also supports writing `user_id` and `role_id` for creating
    and updating team member relationships.
    """

    user = UserSimpleSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    role = serializers.SerializerMethodField(read_only=False)
    role_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = TeamMember
        fields = ["id", "user", "user_id", "role", "role_id", "capacity", "created_at"]

    def get_role(self, obj):
        """Returns the serialized Role object for a team member."""
        return RoleSerializer(obj.role).data

    def validate_capacity(self, value):
        """Ensures that the capacity value is between 0 and 100."""
        if value is not None and (value < 0 or value > 100):
            raise serializers.ValidationError("Capacity must be between 0 and 100")
        return value

    def to_internal_value(self, data):
        """Converts a role key (string) to a role_id (integer) on write operations."""
        from .models import Role

        if "role" in data and isinstance(data["role"], str) and "role_id" not in data:
            try:
                role = Role.objects.get(key=data["role"])
                data["role_id"] = role.id
            except Role.DoesNotExist:
                raise serializers.ValidationError(
                    f"Role '{data['role']}' does not exist"
                )
            del data["role"]
        return super().to_internal_value(data)

    def create(self, validated_data):
        """Handles the creation of a new TeamMember instance."""
        user_id = validated_data.pop("user_id")
        role_id = validated_data.pop("role_id", None)
        if not role_id:
            raise serializers.ValidationError("role_id is required")
        validated_data["user_id"] = user_id
        validated_data["role_id"] = role_id
        return super().create(validated_data)


class MilestoneSerializer(serializers.ModelSerializer):
    """Serializer for the Milestone model."""

    class Meta:
        model = Milestone
        fields = [
            "id",
            "title",
            "description",
            "due_date",
            "progress",
            "created_at",
            "updated_at",
        ]

    def validate_progress(self, value):
        """Ensures that the progress value is between 0 and 100."""
        if value is not None and (value < 0 or value > 100):
            raise serializers.ValidationError("Progress must be between 0 and 100")
        return value

    def validate_due_date(self, value):
        """Ensures that the due date is not in the past."""
        from django.utils import timezone

        if value and value < timezone.now().date():
            raise serializers.ValidationError("Due date must be in the future")
        return value


class ActivitySerializer(serializers.ModelSerializer):
    """Serializer for the Activity model, used for project audit trails."""

    user = UserSimpleSerializer(read_only=True)

    class Meta:
        model = Activity
        fields = [
            "id",
            "activity_type",
            "user",
            "description",
            "metadata",
            "created_at",
        ]


class ProjectListSerializer(serializers.ModelSerializer):
    """A simplified serializer for listing projects.

    This serializer provides a more lightweight representation of a project,
    suitable for list views. It includes several calculated fields for
    displaying summary information.
    """

    owner = UserSimpleSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    team_count = serializers.SerializerMethodField()
    milestone_count = serializers.SerializerMethodField()
    completed_milestone_count = serializers.SerializerMethodField()
    days_until_deadline = serializers.SerializerMethodField()
    risk_level = serializers.SerializerMethodField()
    duration_display = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "description",
            "owner",
            "status",
            "health",
            "progress",
            "start_date",
            "end_date",
            "tags",
            "team_count",
            "milestone_count",
            "completed_milestone_count",
            "days_until_deadline",
            "risk_level",
            "duration_display",
            "created_at",
            "updated_at",
            "etag",
        ]

    def get_team_count(self, obj):
        """Returns the number of team members on the project."""
        return obj.team_members.count()

    def get_milestone_count(self, obj):
        """Returns the total number of milestones for the project."""
        return obj.milestone_count

    def get_completed_milestone_count(self, obj):
        """Returns the number of completed milestones."""
        return obj.completed_milestone_count

    def get_days_until_deadline(self, obj):
        """Returns the number of days until the project deadline."""
        return obj.days_until_deadline

    def get_risk_level(self, obj):
        """Returns the calculated risk level of the project."""
        return obj.risk_level

    def get_duration_display(self, obj):
        """Returns a formatted string for the project duration."""
        return obj.duration_display


class ProjectDetailSerializer(serializers.ModelSerializer):
    """A detailed serializer for a single Project.

    Provides a comprehensive view of a project, including nested relationships
    for team members, milestones, and recent activities.
    """

    owner = UserSimpleSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), write_only=True, many=True, source="tags"
    )
    team_members_details = serializers.SerializerMethodField()
    team_count = serializers.SerializerMethodField()
    milestone_count = serializers.SerializerMethodField()
    completed_milestone_count = serializers.SerializerMethodField()
    days_until_deadline = serializers.SerializerMethodField()
    risk_level = serializers.SerializerMethodField()
    duration_display = serializers.SerializerMethodField()
    milestones = MilestoneSerializer(many=True, read_only=True)
    recent_activities = serializers.SerializerMethodField()
    milestone_progress = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "description",
            "owner",
            "status",
            "health",
            "progress",
            "start_date",
            "end_date",
            "tags",
            "tag_ids",
            "team_members_details",
            "team_count",
            "milestone_count",
            "completed_milestone_count",
            "days_until_deadline",
            "risk_level",
            "duration_display",
            "milestones",
            "recent_activities",
            "milestone_progress",
            "version",
            "etag",
            "created_at",
            "updated_at",
        ]

    def get_team_members_details(self, obj):
        """Returns the serialized team roster for the project."""
        team = obj.team_members_details.all()
        return TeamMemberSerializer(team, many=True).data

    def get_team_count(self, obj):
        """Returns the number of team members on the project."""
        return obj.team_members.count()

    def get_milestone_count(self, obj):
        """Returns the total number of milestones for the project."""
        return obj.milestone_count

    def get_completed_milestone_count(self, obj):
        """Returns the number of completed milestones."""
        return obj.completed_milestone_count

    def get_days_until_deadline(self, obj):
        """Returns the number of days until the project deadline."""
        return obj.days_until_deadline

    def get_risk_level(self, obj):
        """Returns the calculated risk level of the project."""
        return obj.risk_level

    def get_duration_display(self, obj):
        """Returns a formatted string for the project duration."""
        return obj.duration_display

    def get_recent_activities(self, obj):
        """Returns the 10 most recent activities for the project."""
        activities = obj.activities.all()[:10]
        return ActivitySerializer(activities, many=True).data

    def get_milestone_progress(self, obj):
        """Returns the overall progress based on milestones."""
        return obj.calculate_milestone_progress()


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating projects.

    This serializer is used for write operations on the Project model, providing
    validation for fields like progress and handling date conversions.
    """

    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        write_only=True,
        many=True,
        source="tags",
        required=False,
    )
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    etag = serializers.CharField(read_only=True)
    version = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "title",
            "description",
            "status",
            "health",
            "progress",
            "start_date",
            "end_date",
            "tag_ids",
            "etag",
            "version",
        ]

    def validate_progress(self, value):
        """Ensures that the progress value is between 0 and 100."""
        if not 0 <= value <= 100:
            raise serializers.ValidationError("Progress must be between 0 and 100")
        return value

    def to_internal_value(self, data):
        """Converts empty date strings to None before validation."""
        if isinstance(data, dict):
            data = data.copy()
            if data.get("start_date") == "":
                data["start_date"] = None
            if data.get("end_date") == "":
                data["end_date"] = None
        return super().to_internal_value(data)


class ProjectBulkOperationSerializer(serializers.ModelSerializer):
    """Serializer for the ProjectBulkOperation model."""

    project_ids = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), many=True, source="projects", write_only=True
    )

    class Meta:
        model = ProjectBulkOperation
        fields = [
            "id",
            "operation_type",
            "status",
            "project_ids",
            "changes",
            "performed_by",
            "created_at",
        ]
        read_only_fields = ["id", "status", "performed_by", "created_at"]


class BulkUpdateSerializer(serializers.Serializer):
    """A serializer for validating bulk update payloads.

    This is not a model serializer but is used to validate the structure of
    requests to the bulk_update endpoint.
    """

    project_ids = serializers.ListField(child=serializers.IntegerField())
    status = serializers.ChoiceField(
        choices=["active", "on_hold", "completed", "archived"], required=False
    )
    health = serializers.ChoiceField(
        choices=["healthy", "at_risk", "critical"], required=False
    )
    tags = serializers.ListField(child=serializers.IntegerField(), required=False)
    etag = serializers.CharField(required=False)
