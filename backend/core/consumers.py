"""
WebSocket consumers for real-time notifications using Django Channels.

Proper implementation with:
- JWT token authentication from Authorization header
- Automatic user association
- Proper channel group management
- Error handling and logging
"""

import json
import logging

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser, User
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications.

    Handles user authentication and real-time message delivery.
    Supports both JWT tokens (via Authorization header) and session authentication.
    """

    async def connect(self):
        """Handle WebSocket connection"""
        logger.info(f"WebSocket connecting: {self.channel_name}")

        # Try to get authenticated user
        self.user = self.scope.get("user")

        # If no user from session auth, try JWT token from header
        if not self.user or not self.user.is_authenticated:
            token = self.scope.get("token")
            if token:
                self.user = await self._authenticate_jwt_token(token)

        # If we have an authenticated user, accept the connection
        if self.user and self.user.is_authenticated:
            self.user_room = f"user_{self.user.id}"
            await self.channel_layer.group_add(self.user_room, self.channel_name)
            logger.info(
                f"✅ WebSocket connected for user {self.user.id} ({self.user.username})"
            )
            await self.accept()
        else:
            logger.warning("❌ WebSocket rejected: No authenticated user")
            await self.close(code=4001, reason="Unauthorized")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, "user_room"):
            await self.channel_layer.group_discard(self.user_room, self.channel_name)
            logger.info(f"User left room {self.user_room}")

    async def receive(self, text_data=None, bytes_data=None):
        """Receive message from WebSocket"""
        if text_data:
            try:
                data = json.loads(text_data)
                event_type = data.get("type")

                # Handle subscribe to project
                if event_type == "subscribe_project":
                    project_id = data.get("project_id")
                    room = f"project_{project_id}"
                    await self.channel_layer.group_add(room, self.channel_name)
                    logger.debug(f"User subscribed to {room}")

                # Handle unsubscribe from project
                elif event_type == "unsubscribe_project":
                    project_id = data.get("project_id")
                    room = f"project_{project_id}"
                    await self.channel_layer.group_discard(room, self.channel_name)
                    logger.debug(f"User unsubscribed from {room}")

            except json.JSONDecodeError:
                logger.error("Invalid JSON received")

    async def notification_received(self, event):
        """Send notification to WebSocket"""
        logger.debug(
            f"Sending notification to user {self.user.id if self.user else 'Anonymous'}"
        )
        await self.send(text_data=json.dumps(event))

    async def milestone_changed(self, event):
        """Handle milestone change event"""
        logger.debug(
            f"Sending milestone change to user {self.user.id if self.user else 'Anonymous'}"
        )
        await self.send(text_data=json.dumps(event))

    async def team_member_changed(self, event):
        """Handle team member change event"""
        logger.debug(
            f"Sending team member change to user {self.user.id if self.user else 'Anonymous'}"
        )
        await self.send(text_data=json.dumps(event))

    async def project_updated(self, event):
        """Handle project update event"""
        logger.debug(
            f"Sending project update to user {self.user.id if self.user else 'Anonymous'}"
        )
        await self.send(text_data=json.dumps(event))

    @sync_to_async
    def _authenticate_jwt_token(self, token):
        """
        Authenticate JWT token in sync context.

        Uses DRF's JWTAuthentication to validate the token.
        Returns the authenticated user or AnonymousUser.
        """
        try:
            auth = JWTAuthentication()
            from django.http import HttpRequest
            from rest_framework.request import Request

            http_request = HttpRequest()
            http_request.META = {"HTTP_AUTHORIZATION": f"Bearer {token}"}
            drf_request = Request(http_request)

            user, _ = auth.authenticate(drf_request)
            if user:
                logger.debug(f"JWT token validated for user {user.id} ({user.username})")
                return user
            else:
                logger.warning("JWT token validated but no user returned")
                return AnonymousUser()

        except InvalidToken as e:
            logger.debug(f"Invalid JWT token: {e}")
            return AnonymousUser()
        except Exception as e:
            logger.error(f"Error authenticating JWT token: {e}", exc_info=True)
            return AnonymousUser()
