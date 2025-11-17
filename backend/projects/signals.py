"""
Signal handlers for Projects app
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Activity, Milestone, Project


@receiver(post_save, sender=Milestone)
def log_milestone_update(sender, instance, created, **kwargs):
    """Log milestone creation or update"""
    if created:
        Activity.objects.create(
            project=instance.project,
            activity_type="milestone_added",
            user=None,
            description=f"Milestone '{instance.title}' added",
        )
    else:
        Activity.objects.create(
            project=instance.project,
            activity_type="milestone_updated",
            user=None,
            description=f"Milestone '{instance.title}' updated",
        )


@receiver(post_save, sender=Project)
def log_health_or_status_change(sender, instance, created, **kwargs):
    """Log project status or health changes"""
    if not created:
        # Could track previous values here if using django-audit-log
        pass
