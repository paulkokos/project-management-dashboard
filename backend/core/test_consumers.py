"""Tests for Django Channels WebSocket consumers"""

import json

import pytest
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

from config.asgi import application


@database_sync_to_async
def create_user(username="testuser"):
    """Create a test user"""
    return User.objects.create_user(
        username=username, email=f"{username}@example.com", password="testpass123"
    )


@pytest.mark.asyncio
class TestNotificationConsumer:
    """Test NotificationConsumer WebSocket consumer"""

    async def test_consumer_connect_with_valid_token(self):
        """Test consumer accepts valid JWT token"""
        user = await create_user("validuser")
        token = str(RefreshToken.for_user(user).access_token)

        communicator = WebsocketCommunicator(
            application, f"/ws/notifications/?token={token}"
        )

        connected, subprotocol = await communicator.connect()
        assert connected

        await communicator.disconnect()

    async def test_consumer_rejects_invalid_token(self):
        """Test consumer rejects invalid JWT token"""
        communicator = WebsocketCommunicator(
            application, "/ws/notifications/?token=invalid-token"
        )

        connected, subprotocol = await communicator.connect()
        assert not connected

    async def test_consumer_rejects_no_token(self):
        """Test consumer rejects connection without token"""
        communicator = WebsocketCommunicator(application, "/ws/notifications/")

        connected, subprotocol = await communicator.connect()
        assert not connected

    async def test_consumer_subscribe_to_project(self):
        """Test subscribing to project room"""
        user = await create_user("subuser")
        token = str(RefreshToken.for_user(user).access_token)

        communicator = WebsocketCommunicator(
            application, f"/ws/notifications/?token={token}"
        )

        connected, _ = await communicator.connect()
        assert connected

        # Send subscribe message
        await communicator.send_json_to({"type": "subscribe_project", "project_id": 1})

        await communicator.disconnect()

    async def test_consumer_unsubscribe_from_project(self):
        """Test unsubscribing from project room"""
        user = await create_user("unsubuser")
        token = str(RefreshToken.for_user(user).access_token)

        communicator = WebsocketCommunicator(
            application, f"/ws/notifications/?token={token}"
        )

        connected, _ = await communicator.connect()
        assert connected

        # Send unsubscribe message
        await communicator.send_json_to(
            {"type": "unsubscribe_project", "project_id": 1}
        )

        await communicator.disconnect()

    async def test_consumer_handles_disconnect(self):
        """Test consumer properly handles disconnection"""
        user = await create_user("discuser")
        token = str(RefreshToken.for_user(user).access_token)

        communicator = WebsocketCommunicator(
            application, f"/ws/notifications/?token={token}"
        )

        connected, _ = await communicator.connect()
        assert connected

        await communicator.disconnect()

        # Try to send after disconnect should not raise
        await communicator.send_json_to({"type": "test"})

    async def test_consumer_receives_notification(self):
        """Test consumer can receive notification messages"""
        user = await create_user("notifuser")
        token = str(RefreshToken.for_user(user).access_token)

        communicator = WebsocketCommunicator(
            application, f"/ws/notifications/?token={token}"
        )

        connected, _ = await communicator.connect()
        assert connected

        # Send a message from the server side
        await communicator.send_json_to(
            {
                "type": "notification_received",
                "title": "Test Notification",
                "message": "This is a test",
            }
        )

        response = await communicator.receive_json_from()
        assert response["type"] == "notification_received"
        assert response["title"] == "Test Notification"

        await communicator.disconnect()
