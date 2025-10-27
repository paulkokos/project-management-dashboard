"""
Project management models
"""

import hashlib
import json

from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class SoftDeleteManager(models.Manager):
    """Manager that filters out soft-deleted items by default"""

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

    def with_deleted(self):
        """Include soft-deleted items"""
        return super().get_queryset()

    def only_deleted(self):
        """Only soft-deleted items"""
        return super().get_queryset().filter(deleted_at__isnull=False)


class BaseModel(models.Model):
    """Abstract base model with common fields"""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    # Optimistic concurrency control
    version = models.IntegerField(default=1)
    etag = models.CharField(max_length=32, editable=False)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        """Generate ETag on save"""
        self.generate_etag()
        super().save(*args, **kwargs)
        self.version += 1

    def generate_etag(self):
        """Generate ETag based on model data"""
        data = {
            "id": self.pk,
            "updated_at": str(self.updated_at),
        }
        etag_string = json.dumps(data, sort_keys=True).encode()
        self.etag = hashlib.md5(etag_string).hexdigest()

    def soft_delete(self):
        """Soft delete the instance"""
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """Restore a soft-deleted instance"""
        self.deleted_at = None
        self.save()

    def is_deleted(self):
        """Check if instance is soft-deleted"""
        return self.deleted_at is not None


class Project(BaseModel):
    """Project model"""

    STATUS_CHOICES = [
        ("active", "Active"),
        ("on_hold", "On Hold"),
        ("archived", "Archived"),
        ("completed", "Completed"),
    ]

    HEALTH_CHOICES = [
        ("healthy", "Healthy"),
        ("at_risk", "At Risk"),
        ("critical", "Critical"),
    ]

    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="owned_projects"
    )

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="active", db_index=True
    )
    health = models.CharField(
        max_length=20, choices=HEALTH_CHOICES, default="healthy", db_index=True
    )

    progress = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )  # 0-100
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    # Metadata
    tags = models.ManyToManyField("Tag", related_name="projects", blank=True)
    team_members = models.ManyToManyField(
        User, through="TeamMember", related_name="projects", blank=True
    )

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["status", "owner"]),
            models.Index(fields=["health"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["deleted_at"]),
        ]

    def __str__(self):
        return self.title

    def get_team_roster(self):
        """Get team members with their roles and capacity"""
        return self.team_members.through.objects.filter(project=self).values(
            "user__id", "user__username", "user__email", "role", "capacity"
        )

    def calculate_milestone_progress(self):
        """Calculate overall progress from milestones"""
        milestones = self.milestones.all()
        if not milestones.exists():
            return 0
        return sum(m.progress for m in milestones) // len(milestones)

    @property
    def days_until_deadline(self):
        """Calculate days remaining until deadline"""
        if not self.end_date:
            return None
        from datetime import date

        delta = (self.end_date - date.today()).days
        return delta

    @property
    def team_count(self):
        """Get number of team members"""
        return self.team_members.count()

    @property
    def milestone_count(self):
        """Get number of milestones"""
        return self.milestones.count()

    @property
    def completed_milestone_count(self):
        """Get number of completed milestones"""
        return self.milestones.filter(progress=100).count()

    @property
    def risk_level(self):
        """Determine project risk level based on health and deadline"""
        if self.health == "critical":
            return "critical"
        if self.days_until_deadline is not None and self.days_until_deadline < 5:
            if self.days_until_deadline < 0:
                return "critical"
            return "high"
        if (
            self.progress == 0
            and self.days_until_deadline
            and self.days_until_deadline < 30
        ):
            return "medium"
        return "low"

    @property
    def duration_display(self):
        """Return formatted project duration"""
        if not self.start_date:
            return None
        start = self.start_date.strftime("%b %d")
        if self.end_date:
            end = self.end_date.strftime("%b %d")
            return f"{start} to {end}"
        return start


class Tag(BaseModel):
    """Project tag model"""

    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default="#3B82F6")  # Hex color
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Role(BaseModel):
    """Team role definition - can be customized per project or globally"""

    key = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique key for the role (e.g., 'lead', 'developer')",
    )
    display_name = models.CharField(
        max_length=100, help_text="Display name for the role (e.g., 'Project Lead')"
    )
    description = models.TextField(
        blank=True, help_text="Description of the role and responsibilities"
    )
    color = models.CharField(
        max_length=20,
        default="blue",
        help_text="Color identifier (e.g., 'red', 'blue', 'green')",
    )
    bg_color = models.CharField(
        max_length=50,
        default="bg-blue-100",
        help_text="Tailwind background color class",
    )
    text_color = models.CharField(
        max_length=50, default="text-blue-700", help_text="Tailwind text color class"
    )
    border_color = models.CharField(
        max_length=50,
        default="border-blue-300",
        help_text="Tailwind border color class",
    )
    sort_order = models.IntegerField(
        default=0, help_text="Order in which roles appear in dropdowns"
    )

    class Meta:
        ordering = ["sort_order", "display_name"]

    def __str__(self):
        return self.display_name


class TeamMember(BaseModel):
    """Team member in a project with role and capacity"""

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="team_members_details"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.PROTECT)
    capacity = models.IntegerField(
        default=100,  # Percentage
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Team member capacity as percentage (0-100%)",
    )

    class Meta:
        unique_together = ["project", "user"]
        ordering = ["role__sort_order"]

    def __str__(self):
        return f"{self.user.username} - {self.role.display_name}"


class Milestone(BaseModel):
    """Project milestone for tracking progress"""

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="milestones"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    progress = models.IntegerField(
        default=0,  # 0-100
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Milestone progress as percentage (0-100%)",
    )

    class Meta:
        ordering = ["due_date"]

    def __str__(self):
        return f"{self.project.title} - {self.title}"


class Activity(BaseModel):
    """Activity/Event tracking for projects"""

    ACTIVITY_TYPES = [
        ("created", "Project Created"),
        ("updated", "Project Updated"),
        ("status_changed", "Status Changed"),
        ("health_changed", "Health Changed"),
        ("team_added", "Team Member Added"),
        ("team_removed", "Team Member Removed"),
        ("milestone_added", "Milestone Added"),
        ("milestone_completed", "Milestone Completed"),
        ("progress_updated", "Progress Updated"),
        ("comment_added", "Comment Added"),
        ("restored", "Project Restored"),
        ("bulk_updated", "Bulk Updated"),
    ]

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="activities"
    )
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)  # Store additional data

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["project", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.project.title} - {self.get_activity_type_display()}"


class ProjectBulkOperation(BaseModel):
    """Track bulk operations for atomic updates"""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    operation_type = models.CharField(
        max_length=50
    )  # e.g., 'update_status', 'update_tags'
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    projects = models.ManyToManyField(Project)
    changes = models.JSONField()  # What was changed
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.operation_type} - {self.status}"
