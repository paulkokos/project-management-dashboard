"""
Views for WebSocket service (REST endpoints for broadcasting)
"""

import json

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Activity, Project
from projects.serializers import ActivitySerializer


class BroadcastProjectUpdateView(APIView):
    """
    API endpoint to broadcast project updates to WebSocket clients
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Broadcast project update to all connected clients"""
        project_id = request.data.get("project_id")
        update_data = request.data.get("data")

        if not project_id or not update_data:
            return Response(
                {"error": "project_id and data are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
            )

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"project_updates_{project_id}",
            {
                "type": "project_update",
                "data": {
                    "type": "project_update",
                    "project_id": project_id,
                    "update": update_data,
                    "timestamp": str(timezone.now()),
                },
            },
        )

        return Response(
            {"success": True, "message": "Update broadcasted"},
            status=status.HTTP_200_OK,
        )


class BroadcastActivityView(APIView):
    """
    API endpoint to broadcast activity events to WebSocket clients
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Broadcast activity event"""
        project_id = request.data.get("project_id")

        if not project_id:
            return Response(
                {"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            project = Project.objects.get(id=project_id)
            activities = project.activities.all()[:1]

            if activities.exists():
                serializer = ActivitySerializer(activities[0])
                activity_data = serializer.data
            else:
                activity_data = {}

        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND
            )

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"project_updates_{project_id}",
            {
                "type": "activity_event",
                "data": {
                    "type": "activity",
                    "project_id": project_id,
                    "activity": activity_data,
                },
            },
        )

        return Response(
            {"success": True, "message": "Activity broadcasted"},
            status=status.HTTP_200_OK,
        )
