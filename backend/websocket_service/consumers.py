"""
WebSocket consumers for real-time updates
"""

import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User

from projects.models import Activity, Comment, Project


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


class CommentConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time comment updates.

    Connects to group: comments_{project_id}
    Broadcasts comment create, update, delete events to all connected users.
    """

    async def connect(self):
        """Handle WebSocket connection for a project"""
        try:
            self.project_id = self.scope["url_route"]["kwargs"]["project_id"]
            self.user = self.scope.get("user")

            # Verify user has access to project
            if not await self.verify_project_access():
                await self.close()
                return

            self.comment_group_name = f"comments_{self.project_id}"

            # Join group for this project's comments
            await self.channel_layer.group_add(self.comment_group_name, self.channel_name)

            await self.accept()

            # Send connection confirmation
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "connection_established",
                        "project_id": self.project_id,
                        "message": "Connected to comment updates",
                    }
                )
            )

        except Exception as e:
            await self.close()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, "comment_group_name"):
            await self.channel_layer.group_discard(
                self.comment_group_name, self.channel_name
            )

    async def receive(self, text_data):
        """Receive message from WebSocket client"""
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "ping":
                # Respond to ping
                await self.send(text_data=json.dumps({"type": "pong"}))

            elif message_type == "subscribe":
                # Client confirming subscription
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "subscribed",
                            "project_id": self.project_id,
                            "message": "Subscribed to comment updates",
                        }
                    )
                )

        except json.JSONDecodeError:
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Invalid JSON format"}
                )
            )
        except Exception as e:
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": str(e)}
                )
            )

    # Event handlers for group messages
    async def comment_created(self, event):
        """Handle comment creation event"""
        await self.send(text_data=json.dumps(event["data"]))

    async def comment_updated(self, event):
        """Handle comment update event"""
        await self.send(text_data=json.dumps(event["data"]))

    async def comment_deleted(self, event):
        """Handle comment deletion event"""
        await self.send(text_data=json.dumps(event["data"]))

    async def comment_replied(self, event):
        """Handle comment reply event"""
        await self.send(text_data=json.dumps(event["data"]))

    # Helper methods
    @database_sync_to_async
    def verify_project_access(self):
        """Verify user has access to the project"""
        if not self.user:
            return False

        if self.user.is_superuser:
            return True

        try:
            project = Project.objects.get(id=self.project_id)
            # Check if user is owner or team member
            if project.owner == self.user:
                return True
            return project.team_members.filter(id=self.user.id).exists()
        except Project.DoesNotExist:
            return False
