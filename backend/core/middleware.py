class SecurityHeadersMiddleware:
    """Add security headers for all responses."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        # Headers for security
        response = self.get_response(request)

        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["Referrer-Policy"] = "origin-when-cross-origin"
        response["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response["X-XSS-Protection"] = "1; mode=block"
        response["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        )
        return response
