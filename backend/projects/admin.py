"""
Django admin configuration for Projects
"""

from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Activity,
    Milestone,
    Project,
    ProjectBulkOperation,
    Role,
    Tag,
    TeamMember,
)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "status_badge",
        "health_badge",
        "owner",
        "progress",
        "updated_at",
    ]
    list_filter = ["status", "health", "created_at", "tags"]
    search_fields = ["title", "description", "owner__username"]
    readonly_fields = ["created_at", "updated_at", "deleted_at", "etag", "version"]
    fieldsets = (
        ("Basic Information", {"fields": ("title", "description", "owner")}),
        ("Status", {"fields": ("status", "health", "progress")}),
        ("Dates", {"fields": ("start_date", "end_date")}),
        ("Metadata", {"fields": ("tags",)}),
        (
            "System",
            {
                "fields": ("created_at", "updated_at", "deleted_at", "etag", "version"),
                "classes": ("collapse",),
            },
        ),
    )

    def status_badge(self, obj):
        """Display status as badge"""
        colors = {
            "active": "green",
            "on_hold": "orange",
            "archived": "gray",
            "completed": "blue",
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            colors.get(obj.status, "gray"),
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"

    def health_badge(self, obj):
        """Display health as badge"""
        colors = {
            "healthy": "green",
            "at_risk": "orange",
            "critical": "red",
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            colors.get(obj.health, "gray"),
            obj.get_health_display(),
        )

    health_badge.short_description = "Health"


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "color_preview", "description"]
    search_fields = ["name"]
    readonly_fields = ["created_at", "updated_at"]

    def color_preview(self, obj):
        """Display color preview"""
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ccc;"></div>',
            obj.color,
        )

    color_preview.short_description = "Color"


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["display_name", "key", "color_badge", "sort_order"]
    list_filter = ["color"]
    search_fields = ["key", "display_name", "description"]
    ordering = ["sort_order", "display_name"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        (
            "Basic Information",
            {"fields": ("key", "display_name", "description", "sort_order")},
        ),
        (
            "Styling",
            {
                "fields": ("color", "bg_color", "text_color", "border_color"),
                "description": "Tailwind CSS classes for styling the role badge",
            },
        ),
        ("System", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

    def color_badge(self, obj):
        """Display role with its styling"""
        return format_html(
            '<span class="{} {} {}" style="padding: 4px 12px; border-radius: 4px; display: inline-block;">{}</span>',
            obj.bg_color,
            obj.text_color,
            obj.border_color,
            obj.display_name,
        )

    color_badge.short_description = "Preview"


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ["user", "project", "role", "capacity"]
    list_filter = ["role", "project"]
    search_fields = ["user__username", "project__title"]


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ["title", "project", "due_date", "progress"]
    list_filter = ["project", "due_date"]
    search_fields = ["title", "project__title"]


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ["project", "activity_type", "user", "created_at"]
    list_filter = ["activity_type", "created_at", "project"]
    search_fields = ["project__title", "description"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(ProjectBulkOperation)
class ProjectBulkOperationAdmin(admin.ModelAdmin):
    list_display = ["operation_type", "status", "performed_by", "created_at"]
    list_filter = ["operation_type", "status", "created_at"]
    search_fields = ["performed_by__username"]
    readonly_fields = ["created_at", "updated_at"]
