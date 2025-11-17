"""
ASGI config for Project Management Dashboard project.
Supports both HTTP and WebSocket connections (via Django Channels).

WebSocket Authentication:
- Uses AuthMiddlewareStack for session-based auth
- Also supports JWT tokens in Authorization header
- Consumers handle token extraction and validation
"""

import os
import urllib.parse

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Initialize Django
django_asgi_app = get_asgi_application()

# Import WebSocket routing after Django initialization
from core.routing import websocket_urlpatterns  # noqa: E402


class JWTAuthMiddleware:
    """
    Middleware to handle JWT authentication from query parameters.
    Browser WebSocket API doesn't support custom headers, so tokens come via query string.
    Falls back to session auth if JWT is not available.
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Try to get token from query string (WebSocket)
        query_string = scope.get("query_string", b"").decode("utf-8")
        if query_string:
            params = urllib.parse.parse_qs(query_string)
            if "token" in params:
                token = params["token"][0]
                scope["token"] = token

        # Also try Authorization header (REST)
        headers = dict(scope.get("headers", []))
        auth_header = headers.get(b"authorization", b"").decode("utf-8")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            scope["token"] = token

        await self.inner(scope, receive, send)


# Create the application with Channels support
application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddleware(
            AuthMiddlewareStack(URLRouter(websocket_urlpatterns))
        ),
    }
)
