"""
WebSocket consumers for real-time updates
"""

import json
import logging

from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User, AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

from projects.models import Activity, Comment, Project

logger = logging.getLogger(__name__)


class ProjectUpdateConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time project updates
    Connects to group: project_updates_{project_id}
    """

    async def connect(self):
        """Handle WebSocket connection"""
        self.project_id = self.scope["url_route"]["kwargs"]["project_id"]
        self.project_group_name = f"project_updates_{self.project_id}"

        # Authenticate user from JWT token
        self.user = await self.get_user_from_token()

        if not self.user or not self.user.is_authenticated:
            logger.warning(
                "No authenticated user for project updates, rejecting connection"
            )
            await self.close()
            return

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


class TaskUpdateConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time task updates within a project
    Connects to group: project_tasks_{project_id}
    Broadcasts task create, update, delete, and status change events
    """

    async def connect(self):
        """Handle WebSocket connection"""
        self.project_id = self.scope["url_route"]["kwargs"]["project_id"]
        self.project_tasks_group = f"project_tasks_{self.project_id}"

        # Authenticate user from JWT token
        self.user = await self.get_user_from_token()

        if not self.user or not self.user.is_authenticated:
            logger.warning(
                "No authenticated user for task updates, rejecting connection"
            )
            await self.close()
            return

        self.user_id = self.user.id

        # Verify user has access to project
        has_access = await self.verify_project_access()
        if not has_access:
            logger.warning(
                f"User {self.user_id} denied access to project {self.project_id}"
            )
            await self.close()
            return

        # Join group
        await self.channel_layer.group_add(self.project_tasks_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        await self.channel_layer.group_discard(
            self.project_tasks_group, self.channel_name
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
                            "message": "Connected to task updates",
                        }
                    )
                )

        except json.JSONDecodeError:
            await self.send(
                text_data=json.dumps({"type": "error", "message": "Invalid JSON"})
            )

    # Event handlers from broadcast group
    async def task_created(self, event):
        """Handle task created event"""
        await self.send(text_data=json.dumps(event["data"]))

    async def task_updated(self, event):
        """Handle task updated event"""
        await self.send(text_data=json.dumps(event["data"]))

    async def task_deleted(self, event):
        """Handle task deleted event"""
        await self.send(text_data=json.dumps(event["data"]))

    async def task_status_changed(self, event):
        """Handle task status changed event"""
        await self.send(text_data=json.dumps(event["data"]))

    async def task_assigned(self, event):
        """Handle task assigned event"""
        await self.send(text_data=json.dumps(event["data"]))

    @database_sync_to_async
    def verify_project_access(self):
        """Verify user has access to this project"""
        from projects.models import Project, TeamMember
        from projects.permissions import can_view_project_details

        try:
            project = Project.objects.get(id=self.project_id)
            user = User.objects.get(id=self.user_id)
            return can_view_project_details(user, project)
        except (Project.DoesNotExist, User.DoesNotExist):
            return False

    async def get_user_from_token(self):
        """Extract user from JWT token in query string"""
        try:
            query_string = self.scope.get("query_string", b"").decode()
            token = None

            # Parse token from query string (ws://localhost/ws?token=...)
            if "token=" in query_string:
                token = query_string.split("token=")[1].split("&")[0]

            if not token:
                logger.debug("No token provided in WebSocket connection")
                return AnonymousUser()

            # Validate JWT token in a sync context
            return await self._authenticate_token(token)

        except Exception as e:
            logger.error(f"Error authenticating user: {e}", exc_info=True)
            return AnonymousUser()

    @sync_to_async
    def _authenticate_token(self, token):
        """Authenticate JWT token in sync context"""
        try:
            auth = JWTAuthentication()
            from django.http import HttpRequest
            from rest_framework.request import Request

            http_request = HttpRequest()
            http_request.META = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

            drf_request = Request(http_request)

            try:
                user, _ = auth.authenticate(drf_request)
                if user:
                    logger.info(f"✅ User {user.id} authenticated via JWT")
                    return user
                else:
                    logger.debug("Token validation returned no user")
                    return AnonymousUser()
            except InvalidToken as e:
                logger.debug(f"Invalid token: {e}")
                return AnonymousUser()
        except Exception as e:
            logger.error(f"Error in _authenticate_token: {e}", exc_info=True)
            return AnonymousUser()
