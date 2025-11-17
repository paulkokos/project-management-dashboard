"""
Broadcast utilities for real-time notifications using Django Channels
"""

import logging

from asgiref.sync import async_to_sync
from django.utils import timezone

logger = logging.getLogger(__name__)


def notify_project_team(
    project, event_type, actor_user, title, message, exclude_user=None
):
    """
    Send notification to all subscribers in a project room using Django Channels
    """
    from channels.layers import get_channel_layer

    try:
        channel_layer = get_channel_layer()
        room_name = f"project_{project.id}"

        payload = {
            "type": "notification_received",  # This will call notification_received() on the consumer
            "title": title,
            "message": message,
            "event_type": event_type,
            "timestamp": timezone.now().isoformat(),
            "actor": {
                "id": actor_user.id,
                "username": actor_user.username,
                "first_name": actor_user.first_name,
                "last_name": actor_user.last_name,
            },
            "project_id": project.id,
            "project_title": project.title,
        }

        # Send to all consumers in the group asynchronously
        async_to_sync(channel_layer.group_send)(room_name, payload)

        logger.info(f"Notification sent to {room_name}: {event_type}")

    except Exception as e:
        logger.error(f"Error sending notification: {e}", exc_info=True)


def broadcast_project_update(project_id, event_type, data=None, user_id=None):
    """Broadcast project update to all subscribers"""
    from channels.layers import get_channel_layer

    try:
        channel_layer = get_channel_layer()
        room_name = f"project_{project_id}"

        payload = {
            "type": "project_updated",
            "event_type": event_type,
            "project_id": project_id,
            "timestamp": timezone.now().isoformat(),
            "data": data or {},
        }

        async_to_sync(channel_layer.group_send)(room_name, payload)
        logger.info(f"Broadcasted {event_type} for project {project_id}")
    except Exception as e:
        logger.error(f"Error broadcasting project update: {e}")


def broadcast_team_member_change(project_id, event_type, member_data=None):
    """Broadcast team member changes"""
    from channels.layers import get_channel_layer

    try:
        channel_layer = get_channel_layer()
        room_name = f"project_{project_id}"

        payload = {
            "type": "team_member_changed",
            "event_type": event_type,
            "project_id": project_id,
            "timestamp": timezone.now().isoformat(),
            "data": member_data or {},
        }

        async_to_sync(channel_layer.group_send)(room_name, payload)
        logger.info(f"Broadcasted team member {event_type} for project {project_id}")
    except Exception as e:
        logger.error(f"Error broadcasting team member change: {e}")


def broadcast_milestone_change(project_id, event_type, milestone_data=None):
    """Broadcast milestone changes"""
    from channels.layers import get_channel_layer

    try:
        channel_layer = get_channel_layer()
        room_name = f"project_{project_id}"

        payload = {
            "type": "milestone_changed",
            "event_type": event_type,
            "project_id": project_id,
            "timestamp": timezone.now().isoformat(),
            "data": milestone_data or {},
        }

        async_to_sync(channel_layer.group_send)(room_name, payload)
        logger.info(f"Broadcasted milestone {event_type} for project {project_id}")
    except Exception as e:
        logger.error(f"Error broadcasting milestone change: {e}")


def broadcast_task_change(project_id, event_type, task_data=None):
    """Broadcast task changes in real-time"""
    from channels.layers import get_channel_layer

    try:
        channel_layer = get_channel_layer()
        room_name = f"project_tasks_{project_id}"

        payload = {
            "type": event_type,
            "project_id": project_id,
            "timestamp": timezone.now().isoformat(),
            "data": {
                "type": event_type,
                "project_id": project_id,
                "timestamp": timezone.now().isoformat(),
                "task": task_data or {},
            },
        }

        async_to_sync(channel_layer.group_send)(room_name, payload)
        logger.info(f"Broadcasted task {event_type} for project {project_id}")
    except Exception as e:
        logger.error(f"Error broadcasting task change: {e}")


def broadcast_comment_change(project_id, event_type, comment_data=None):
    """Broadcast comment changes (created, updated, deleted, replied) in real-time"""
    from channels.layers import get_channel_layer

    try:
        channel_layer = get_channel_layer()
        room_name = f"project_{project_id}"

        payload = {
            "type": "comment_changed",
            "event_type": event_type,
            "project_id": project_id,
            "timestamp": timezone.now().isoformat(),
            "data": comment_data or {},
        }

        async_to_sync(channel_layer.group_send)(room_name, payload)
        logger.info(f"Broadcasted comment {event_type} for project {project_id}")
    except Exception as e:
        logger.error(f"Error broadcasting comment change: {e}")
