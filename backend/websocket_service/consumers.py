"""
WebSocket consumers for real-time updates
"""

import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User

from projects.models import Activity, Project


class ProjectUpdateConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time project updates
    Connects to group: project_updates_{project_id}
    """

    async def connect(self):
        """Handle WebSocket connection"""
        self.project_id = self.scope["url_route"]["kwargs"]["project_id"]
        self.project_group_name = f"project_updates_{self.project_id}"

        # Join group
        await self.channel_layer.group_add(self.project_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        await self.channel_layer.group_discard(
            self.project_group_name, self.channel_name
        )

    async def receive(self, text_data):
        """Receive message from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get("type", "unknown")

            if message_type == "ping":
                await self.send(text_data=json.dumps({"type": "pong"}))

            elif message_type == "subscribe":
                # Client is confirming subscription
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "subscribed",
                            "project_id": self.project_id,
                            "message": "Connected to project updates",
                        }
                    )
                )

        except json.JSONDecodeError:
            await self.send(
                text_data=json.dumps({"type": "error", "message": "Invalid JSON"})
            )

    # Receive message from group
    async def project_update(self, event):
        """Handle project update from group"""
        await self.send(text_data=json.dumps(event["data"]))

    async def activity_event(self, event):
        """Handle activity event from group"""
        await self.send(text_data=json.dumps(event["data"]))


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications
    Connects to group: notifications_{user_id}
    """

    async def connect(self):
        """Handle WebSocket connection"""
        self.user_id = self.scope["user"].id
        self.notification_group = f"notifications_{self.user_id}"

        await self.channel_layer.group_add(self.notification_group, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        await self.channel_layer.group_discard(
            self.notification_group, self.channel_name
        )

    async def notification(self, event):
        """Handle notification from group"""
        await self.send(text_data=json.dumps(event["data"]))
