"""
ASGI config for Project Management Dashboard project.
Supports both HTTP and WebSocket connections (via Django Channels).
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Initialize Django
django_asgi_app = get_asgi_application()

# Import WebSocket routing after Django initialization
from core.routing import websocket_urlpatterns

# Create the application with Channels support
application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)
