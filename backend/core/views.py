"""
Core views
"""

from datetime import datetime, timezone

from django.contrib.auth.models import User
from django.core.cache import cache
from django.db import connection
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from projects.serializers import (
    ChangePasswordSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
)


class HealthCheckView(APIView):
    """Health check endpoint for load balancers and comprehensive system status"""

    authentication_classes = []
    permission_classes = []

    def _check_database(self):
        """Check database connectivity"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            return {"status": "healthy", "message": "Database connected"}
        except Exception as e:
            return {"status": "unhealthy", "message": f"Database error: {str(e)}"}

    def _check_cache(self):
        """Check Redis/cache connectivity"""
        try:
            cache.set("health_check", "ok", 10)
            value = cache.get("health_check")
            if value == "ok":
                return {"status": "healthy", "message": "Cache connected"}
            return {"status": "unhealthy", "message": "Cache read failed"}
        except Exception as e:
            return {"status": "unhealthy", "message": f"Cache error: {str(e)}"}

    def get(self, request):
        """Return comprehensive health status"""
        # Check dependencies
        db_health = self._check_database()
        cache_health = self._check_cache()

        # Determine overall status
        all_healthy = (
            db_health["status"] == "healthy" and cache_health["status"] == "healthy"
        )

        response_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "healthy" if all_healthy else "degraded",
            "message": (
                "API and all services operational"
                if all_healthy
                else "Some services may be unavailable"
            ),
            "services": {
                "api": {"status": "healthy", "message": "API is running"},
                "database": db_health,
                "cache": cache_health,
            },
        }

        http_status = (
            status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        return Response(response_data, status=http_status)


class RegisterView(CreateAPIView):
    """User registration endpoint.

    Allows unauthenticated users to create a new account. Returns JWT tokens
    upon successful registration.
    """

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """Create a new user and return JWT tokens."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserRegistrationSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class ChangePasswordView(APIView):
    """Change password endpoint for authenticated users.

    Allows authenticated users to change their password. Requires current
    password verification and password confirmation.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Change user password."""
        serializer = ChangePasswordSerializer(
            data=request.data, context={"user": request.user}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response(
            {"message": "Password changed successfully"}, status=status.HTTP_200_OK
        )
