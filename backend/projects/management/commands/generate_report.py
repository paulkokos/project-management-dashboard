"""
Management command to generate project reports
Usage: python manage.py generate_report --format=json
"""

import json

from django.core.management.base import BaseCommand
from django.db.models import Avg, Count

from projects.models import Activity, Project, Tag, TeamMember


class Command(BaseCommand):
    help = "Generate project management reports"

    def add_arguments(self, parser):
        parser.add_argument(
            "--format",
            type=str,
            default="text",
            choices=["text", "json"],
            help="Output format",
        )

    def handle(self, *args, **options):
        """Generate report"""
        output_format = options["format"]

        # Gather statistics
        stats = {
            "total_projects": Project.objects.count(),
            "active_projects": Project.objects.filter(status="active").count(),
            "archived_projects": Project.objects.filter(status="archived").count(),
            "completed_projects": Project.objects.filter(status="completed").count(),
            "average_progress": Project.objects.aggregate(avg_progress=Avg("progress"))[
                "avg_progress"
            ],
            "healthy_projects": Project.objects.filter(health="healthy").count(),
            "at_risk_projects": Project.objects.filter(health="at_risk").count(),
            "critical_projects": Project.objects.filter(health="critical").count(),
            "total_tags": Tag.objects.count(),
            "total_team_members": TeamMember.objects.count(),
            "total_activities": Activity.objects.count(),
            "top_tags": list(
                Tag.objects.annotate(project_count=Count("projects"))
                .order_by("-project_count")
                .values("name", "project_count")[:5]
            ),
            "recent_activities": list(
                Activity.objects.select_related("project", "user")
                .order_by("-created_at")[:10]
                .values("id", "project__title", "activity_type", "created_at")
            ),
        }

        if output_format == "json":
            self.stdout.write(json.dumps(stats, indent=2, default=str))
        else:
            self.print_text_report(stats)

    def print_text_report(self, stats):
        """Print report in text format"""
        self.stdout.write(self.style.SUCCESS("=== Project Management Report ===\n"))

        self.stdout.write(self.style.HTTP_INFO("Project Statistics:"))
        self.stdout.write(f"  Total Projects: {stats['total_projects']}")
        self.stdout.write(
            f"  Active: {stats['active_projects']} | "
            f"Archived: {stats['archived_projects']} | "
            f"Completed: {stats['completed_projects']}"
        )
        self.stdout.write(f"  Average Progress: {stats['average_progress']:.1f}%\n")

        self.stdout.write(self.style.HTTP_INFO("Health Distribution:"))
        self.stdout.write(
            f"  Healthy: {stats['healthy_projects']} | "
            f"At Risk: {stats['at_risk_projects']} | "
            f"Critical: {stats['critical_projects']}\n"
        )

        self.stdout.write(self.style.HTTP_INFO("Other Metrics:"))
        self.stdout.write(f"  Total Tags: {stats['total_tags']}")
        self.stdout.write(f"  Team Members: {stats['total_team_members']}")
        self.stdout.write(f"  Total Activities: {stats['total_activities']}\n")

        self.stdout.write(self.style.HTTP_INFO("Top Tags:"))
        for tag in stats["top_tags"]:
            self.stdout.write(f"  - {tag['name']}: {tag['project_count']} projects")

        self.stdout.write("\n" + self.style.HTTP_INFO("Recent Activities:"))
        for activity in stats["recent_activities"]:
            self.stdout.write(
                f"  - {activity['project__title']}: {activity['activity_type']}"
            )
