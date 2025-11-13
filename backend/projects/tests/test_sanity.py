"""Sanity tests to verify application structure"""

import pytest
from django.contrib.auth.models import User
from django.test import TestCase

from projects.models import Activity, Milestone, Project, Tag, TeamMember


class ProjectModelTests(TestCase):
    """Basic sanity tests for Project model"""

    def setUp(self):
        """Create test user"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_project_creation(self):
        """Test that we can create a project"""
        project = Project.objects.create(
            title="Test Project", description="Test", owner=self.user, status="active"
        )
        assert project.id is not None
        assert project.title == "Test Project"
        assert project.owner == self.user

    def test_project_defaults(self):
        """Test project default values"""
        project = Project.objects.create(title="Default Test", owner=self.user)
        assert project.status == "active"
        assert project.health == "healthy"
        assert project.progress == 0


class TagModelTests(TestCase):
    """Basic sanity tests for Tag model"""

    def test_tag_creation(self):
        """Test that we can create a tag"""
        tag, _ = Tag.objects.get_or_create(
            name="backend", defaults={"color": "#FF0000"}
        )
        assert tag.id is not None
        assert tag.name == "backend"

    def test_tag_uniqueness(self):
        """Test that tag names must be unique"""
        Tag.objects.create(name="frontend", color="#00FF00")
        with pytest.raises(Exception):
            Tag.objects.create(name="frontend", color="#0000FF")


class MilestoneModelTests(TestCase):
    """Basic sanity tests for Milestone model"""

    def setUp(self):
        """Create test project"""
        user = User.objects.create_user(username="testuser", password="testpass123")
        self.project = Project.objects.create(title="Test", owner=user)

    def test_milestone_creation(self):
        """Test that we can create a milestone"""
        milestone = Milestone.objects.create(
            project=self.project, title="Sprint 1", progress=50
        )
        assert milestone.id is not None
        assert milestone.project == self.project


class ApplicationStructureTests(TestCase):
    """Tests to verify application is properly structured"""

    def test_models_exist(self):
        """Verify all required models exist"""
        from projects import models

        assert hasattr(models, "Project")
        assert hasattr(models, "Tag")
        assert hasattr(models, "Milestone")
        assert hasattr(models, "TeamMember")
        assert hasattr(models, "Activity")

    def test_serializers_exist(self):
        """Verify serializers are available"""
        from projects import serializers

        assert hasattr(serializers, "ProjectListSerializer")
        assert hasattr(serializers, "ProjectDetailSerializer")
        assert hasattr(serializers, "TagSerializer")

    def test_views_exist(self):
        """Verify views are properly configured"""
        from projects import views

        assert hasattr(views, "ProjectViewSet")
        assert hasattr(views, "TagViewSet")
