"""
WebSocket URL routing for Django Channels
"""

from django.urls import re_path

from websocket_service.consumers import ProjectUpdateConsumer, TaskUpdateConsumer

from .consumers import NotificationConsumer

websocket_urlpatterns = [
    re_path(r"ws/notifications/$", NotificationConsumer.as_asgi()),  # type: ignore
    re_path(r"ws/projects/(?P<project_id>\d+)/$", ProjectUpdateConsumer.as_asgi()),  # type: ignore
    re_path(r"ws/projects/(?P<project_id>\d+)/tasks/$", TaskUpdateConsumer.as_asgi()),  # type: ignore
]
