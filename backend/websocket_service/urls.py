"""
URL routing for WebSocket service
"""

from django.urls import path

from .views import BroadcastActivityView, BroadcastProjectUpdateView

urlpatterns = [
    path(
        "broadcast/project-update/",
        BroadcastProjectUpdateView.as_view(),
        name="broadcast-project-update",
    ),
    path(
        "broadcast/activity/",
        BroadcastActivityView.as_view(),
        name="broadcast-activity",
    ),
]
