"""
URL Configuration for Project Management Dashboard
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.views import RegisterView

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # API Documentation
    # path("api/docs/", include_docs_urls(title="Project Management API")),
    # Authentication
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    # API Routes
    path("api/", include("projects.urls")),
    path("api/", include("core.urls")),
    path("api/", include("websocket_service.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
