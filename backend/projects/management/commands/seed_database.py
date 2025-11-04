"""
Management command to seed database with test data
Usage: python manage.py seed_database
"""

from django.core.management.base import BaseCommand

from projects.fixtures import seed_database


class Command(BaseCommand):
    help = "Seed database with test data for development"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data before seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            from django.contrib.auth.models import User

            from projects.models import Activity, Milestone, Project, Tag, TeamMember

            self.stdout.write("Clearing existing data...")
            Activity.objects.all().delete()
            TeamMember.objects.all().delete()
            Milestone.objects.all().delete()
            Project.objects.all().delete()
            Tag.objects.all().delete()
            User.objects.filter(username__startswith="user").delete()

        seed_database()
        self.stdout.write(
            self.style.SUCCESS("Database seeding completed successfully!")
        )
