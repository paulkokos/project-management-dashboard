"""
WebSocket consumers for real-time notifications using Django Channels
"""

import json
import logging

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications"""

    async def connect(self):
        """Handle WebSocket connection"""
        logger.info(f"Client connecting: {self.channel_name}")

        # Get the user from JWT token
        self.user = await self.get_user_from_token()

        if self.user and self.user.is_authenticated:
            # Create user-specific room
            self.user_room = f"user_{self.user.id}"
            await self.channel_layer.group_add(self.user_room, self.channel_name)
            logger.info(f"User {self.user.id} joined room {self.user_room}")

            await self.accept()
            logger.info(f"WebSocket connection accepted for user {self.user.id}")
        else:
            logger.warning("No authenticated user, rejecting connection")
            await self.close()

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

    async def get_user_from_token(self):
        """Extract user from JWT token in headers"""
        try:
            # Get token from query string
            query_string = self.scope.get("query_string", b"").decode()
            token = None

            # Parse token from query string (ws://localhost/ws?token=...)
            if "token=" in query_string:
                token = query_string.split("token=")[1].split("&")[0]

            if not token:
                logger.debug("No token provided in WebSocket connection")
                return AnonymousUser()

            # Validate JWT token in a sync context (database access requires sync)
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
