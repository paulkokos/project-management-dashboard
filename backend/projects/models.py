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
        ("milestone_updated", "Milestone Updated"),
        ("milestone_completed", "Milestone Completed"),
        ("milestone_deleted", "Milestone Deleted"),
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

    changed_fields = models.JSONField(
        default=list,
        blank=True,
        help_text="List of fields that were changed (if applicable)",
    )
    previous_values = models.JSONField(
        default=dict,
        blank=True,
        help_text="Previous values of changed fields (if applicable)",
    )
    new_values = models.JSONField(
        default=dict,
        blank=True,
        help_text="New values of changed fields (if applicable)",
    )
    change_reason = models.TextField(
        blank=True,
        help_text="Reason for the change (if provided)",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["project", "-created_at"]),
            models.Index(fields=["user", "activity_type"]),
        ]

    def __str__(self):
        return f"{self.project.title} - {self.get_activity_type_display()}"


class Comment(BaseModel):
    """
    Comment model for collaborative discussions on projects and tasks.

    Supports:
    - Markdown content rendering
    - Threaded replies (self-referential parent)
    - Polymorphic commenting (projects, tasks, milestones)
    - Soft delete with recovery
    - Optimistic concurrency control
    - Activity tracking
    """

    # Content and author
    content = models.TextField(help_text="Markdown-formatted comment content")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")

    # Polymorphic relationship - can comment on different entities
    # For now supporting projects and tasks (if task model exists)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="comments",
        null=True,
        blank=True,
        help_text="Project this comment belongs to",
    )

    # Future: Add task foreign key when task model is created
    # task = models.ForeignKey(
    #     'Task',
    #     on_delete=models.CASCADE,
    #     related_name="comments",
    #     null=True,
    #     blank=True
    # )

    # Threading support for nested replies
    parent_comment = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="replies",
        null=True,
        blank=True,
        help_text="Parent comment if this is a reply",
    )

    # Edit tracking
    edited_at = models.DateTimeField(
        null=True, blank=True, help_text="Timestamp when comment was last edited"
    )
    edit_count = models.IntegerField(
        default=0, help_text="Number of times this comment has been edited"
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["project", "-created_at"]),
            models.Index(fields=["author", "-created_at"]),
            models.Index(fields=["parent_comment"]),
            models.Index(fields=["deleted_at"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        """String representation of comment"""
        preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        return f"Comment by {self.author.username}: {preview}"

    def mark_edited(self):
        """
        Mark comment as edited and track edit count.
        Call this when comment is updated.
        """
        self.edited_at = timezone.now()
        self.edit_count += 1
        self.save()

    @property
    def is_edited(self):
        """Check if comment has been edited"""
        return self.edited_at is not None

    @property
    def reply_count(self):
        """Get number of replies to this comment"""
        return self.replies.filter(deleted_at__isnull=True).count()

    def get_nested_replies(self):
        """
        Get all replies including nested replies.
        Returns replies in tree-like structure.
        """
        direct_replies = self.replies.filter(deleted_at__isnull=True).order_by(
            "-created_at"
        )
        return direct_replies


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


class Task(BaseModel):
    """Project task with status, priority, assignment, and progress tracking"""

    STATUS_CHOICES = [
        ("backlog", "Backlog"),
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("in_review", "In Review"),
        ("done", "Done"),
        ("cancelled", "Cancelled"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    # Core fields
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="tasks", db_index=True
    )
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)

    # Status and Priority
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="backlog", db_index=True
    )
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default="medium", db_index=True
    )

    # Assignment
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
        db_index=True,
    )

    # Progress and Estimation
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Task progress as percentage (0-100%)",
    )
    estimated_hours = models.IntegerField(null=True, blank=True)
    actual_hours = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )

    # Dates
    due_date = models.DateField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Relations
    parent_task = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subtasks",
    )
    milestone = models.ForeignKey(
        Milestone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )

    # Metadata
    tags = models.ManyToManyField(Tag, related_name="tasks", blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["project", "priority"]),
            models.Index(fields=["assigned_to", "status"]),
            models.Index(fields=["milestone"]),
            models.Index(fields=["due_date"]),
        ]

    def __str__(self):
        return f"{self.project.title} - {self.title}"

    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if not self.due_date or self.status == "done":
            return False
        from datetime import date

        return self.due_date < date.today()

    @property
    def days_until_due(self):
        """Calculate days until due date"""
        if not self.due_date:
            return None
        from datetime import date

        delta = (self.due_date - date.today()).days
        return delta

    @property
    def subtask_count(self):
        """Get number of subtasks"""
        return self.subtasks.count()

    @property
    def completed_subtask_count(self):
        """Get number of completed subtasks"""
        return self.subtasks.filter(status="done").count()

    def mark_complete(self):
        """Mark task as complete"""
        self.status = "done"
        self.progress = 100
        self.completed_at = timezone.now()
        self.save()

    def mark_in_progress(self):
        """Mark task as in progress"""
        self.status = "in_progress"
        self.save()
