"""
URL routing for Core app
"""

from django.urls import path

from .views import ChangePasswordView, HealthCheckView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path(
        "users/me/change-password/",
        ChangePasswordView.as_view(),
        name="change-password",
    ),
]
