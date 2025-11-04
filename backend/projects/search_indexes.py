"""
Elasticsearch search indexes for projects app
Using django-haystack for search functionality
"""

from haystack import indexes

from .models import Activity, Milestone, Project, Tag


class ProjectIndex(indexes.SearchIndex, indexes.Indexable):
    """
    Elasticsearch index for Project model
    Enables full-text search across project titles, descriptions, and tags
    """

    text = indexes.CharField(document=True, use_template=True)
    title = indexes.CharField(model_attr="title", boost=1.5)
    description = indexes.CharField(model_attr="description", null=True)
    owner = indexes.CharField(model_attr="owner__username")
    status = indexes.CharField(model_attr="status")
    health = indexes.CharField(model_attr="health")
    progress = indexes.IntegerField(model_attr="progress")
    created_at = indexes.DateTimeField(model_attr="created_at")
    updated_at = indexes.DateTimeField(model_attr="updated_at")
    tags = indexes.CharField()

    def get_model(self):
        return Project

    def index_queryset(self, using=None):
        """
        Return all non-deleted projects for indexing
        """
        return self.get_model().objects.filter(deleted_at__isnull=True)

    def prepare_tags(self, obj):
        """
        Extract tag names as searchable text
        """
        return " ".join([tag.name for tag in obj.tags.all()])


class MilestoneIndex(indexes.SearchIndex, indexes.Indexable):
    """
    Elasticsearch index for Milestone model
    Enables searching milestones by title, description, and project
    """

    text = indexes.CharField(document=True, use_template=True)
    title = indexes.CharField(model_attr="title", boost=1.5)
    description = indexes.CharField(model_attr="description", null=True)
    project = indexes.CharField(model_attr="project__title")
    status = indexes.CharField(model_attr="status", null=True)
    progress = indexes.IntegerField(model_attr="progress")
    created_at = indexes.DateTimeField(model_attr="created_at")
    updated_at = indexes.DateTimeField(model_attr="updated_at")

    def get_model(self):
        return Milestone

    def index_queryset(self, using=None):
        """
        Return all non-deleted milestones for indexing
        """
        return self.get_model().objects.filter(
            deleted_at__isnull=True, project__deleted_at__isnull=True
        )


class ActivityIndex(indexes.SearchIndex, indexes.Indexable):
    """
    Elasticsearch index for Activity model
    Enables searching activity logs by description and type
    """

    text = indexes.CharField(document=True, use_template=True)
    activity_type = indexes.CharField(model_attr="activity_type")
    description = indexes.CharField(model_attr="description")
    project = indexes.CharField(model_attr="project__title")
    actor = indexes.CharField(model_attr="actor__username")
    created_at = indexes.DateTimeField(model_attr="created_at")

    def get_model(self):
        return Activity

    def index_queryset(self, using=None):
        """
        Return all activities for indexing (keep historical data searchable)
        """
        return self.get_model().objects.all()


class TagIndex(indexes.SearchIndex, indexes.Indexable):
    """
    Elasticsearch index for Tag model
    Enables searching tags by name for autocomplete
    """

    text = indexes.CharField(document=True, use_template=True)
    name = indexes.CharField(model_attr="name", boost=2.0)
    color = indexes.CharField(model_attr="color", null=True)

    def get_model(self):
        return Tag

    def index_queryset(self, using=None):
        """
        Return all tags for indexing
        """
        return self.get_model().objects.all()
