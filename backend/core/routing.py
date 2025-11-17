"""
WebSocket URL routing for Django Channels
"""

from django.urls import re_path

from .consumers import NotificationConsumer
from websocket_service.consumers import ProjectUpdateConsumer, TaskUpdateConsumer

websocket_urlpatterns = [
    re_path(r"ws/notifications/$", NotificationConsumer.as_asgi()),
    re_path(r"ws/projects/(?P<project_id>\d+)/$", ProjectUpdateConsumer.as_asgi()),
    re_path(r"ws/projects/(?P<project_id>\d+)/tasks/$", TaskUpdateConsumer.as_asgi()),
]
