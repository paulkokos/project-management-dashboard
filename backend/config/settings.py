"""
Django settings for Project Management Dashboard
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# import logging


try:
    from psycopg import IsolationLevel
    # Check if AUTOCOMMIT exists
    if hasattr(IsolationLevel, 'AUTOCOMMIT'):
        PSYCOPG3 = True
    else:
        PSYCOPG3 = False
        IsolationLevel = None
except ImportError:
    PSYCOPG3 = False
    IsolationLevel = None

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-change-me-in-production")
DEBUG = os.getenv("DEBUG", "False") == "True"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# CORS Configuration
CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000"
).split(",")

CORS_ALLOW_CREDENTIALS = True

# Application definition
INSTALLED_APPS = [
    # Django defaults
    "daphne",  # ASGI server for WebSocket support
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_extensions",
    "django_filters",
    "channels",
    "haystack",
    # Local apps
    "projects.apps.ProjectsConfig",
    "core.apps.CoreConfig",
    "websocket_service.apps.WebsocketServiceConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "core.middleware.SecurityHeadersMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Database
if os.getenv("TESTING") == "true":
    # Use SQLite for tests
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
            "TEST": {
                "NAME": ":memory:",
            },
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": os.getenv("DB_ENGINE", "django.db.backends.sqlite3"),
            "NAME": os.getenv("DB_NAME", BASE_DIR / "db.sqlite3"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", "postgres"),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
            "OPTIONS": (
                {
                    "isolation_level": IsolationLevel.AUTOCOMMIT if PSYCOPG3 else 0,
                }
                if PSYCOPG3
                else {}
            ),
            "TEST": {
                "NAME": "test_project_management",
            },
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Media files
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# REST Framework Configuration
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": int(os.getenv("PAGINATION_PAGE_SIZE", 20)),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
}

# JWT Configuration
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
}

# Channels Configuration (WebSocket)
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.getenv("REDIS_URL", "redis://localhost:6379/0")],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}

# Celery Configuration
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
# Caching
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.getenv("REDIS_CACHE_URL", "redis://localhost:6379/1"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}

# Search (Full-text search)
ELASTICSEARCH_DSL = {
    "default": {"hosts": os.getenv("ELASTICSEARCH_URL", "localhost:9200")},
}

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": os.getenv("DJANGO_LOG_LEVEL", "INFO"),
            "propagate": False,
        },
    },
}

# Sentry Configuration (Error tracking)
if os.getenv("SENTRY_DSN"):
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
    )

# Django Channels Configuration
ASGI_APPLICATION = "config.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [
                (os.getenv("REDIS_HOST", "redis"), int(os.getenv("REDIS_PORT", 6379)))
            ],
        },
    },
}

# Security Settings (Production)
if not DEBUG:
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "True") == "True"
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "True") == "True"
    CSRF_COOKIE_SECURE = os.getenv("CSRF_COOKIE_SECURE", "True") == "True"
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Haystack Configuration (Elasticsearch)
# Use SimpleBackend for testing/CI without Elasticsearch, ElasticsearchEngine for production
HAYSTACK_BACKEND = os.getenv("HAYSTACK_BACKEND", "simple")

if HAYSTACK_BACKEND == "simple":
    # Simple in-memory backend for testing
    HAYSTACK_CONNECTIONS = {
        "default": {
            "ENGINE": "haystack.backends.simple_backend.SimpleEngine",
        },
    }
    HAYSTACK_SIGNAL_PROCESSOR = "haystack.signals.BaseSignalProcessor"
else:
    # Production Elasticsearch backend
    HAYSTACK_CONNECTIONS = {
        "default": {
            "ENGINE": "haystack.backends.elasticsearch_backend.ElasticsearchEngine",
            "URL": os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200/"),
            "INDEX_NAME": "projects_index",
        },
    }
    HAYSTACK_SIGNAL_PROCESSOR = "haystack.signals.RealtimeSignalProcessor"

# Haystack search settings
HAYSTACK_SEARCH_RESULTS_PER_PAGE = 20
