from django.apps import AppConfig


class ProjectsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "projects"
    verbose_name = "Project Management"

    def ready(self):
        """Import signal handlers when the app is ready"""
        import projects.signals  # noqa: F401  # type: ignore
