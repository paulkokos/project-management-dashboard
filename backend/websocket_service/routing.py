"""
WebSocket URL routing
"""

from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(
        r"ws/projects/(?P<project_id>\w+)/$", consumers.ProjectUpdateConsumer.as_asgi()
    ),
    re_path(r"ws/notifications/$", consumers.NotificationConsumer.as_asgi()),
]
