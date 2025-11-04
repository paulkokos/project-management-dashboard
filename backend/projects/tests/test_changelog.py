"""
Tests for Changelog/Activity tracking functionality
Tests field-level change tracking, changelog endpoint, and activity creation
"""

from datetime import datetime, timedelta

import pytest
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from projects.models import Activity, Project, Role, Tag


@pytest.mark.django_db
class ChangelogTests(TestCase):
    """Test changelog and activity tracking features"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()

        # Create test users
        self.owner = User.objects.create_user(
            username="owner", email="owner@test.com", password="testpass123"
        )
        self.editor = User.objects.create_user(
            username="editor", email="editor@test.com", password="testpass123"
        )
        self.viewer = User.objects.create_user(
            username="viewer", email="viewer@test.com", password="testpass123"
        )

        # Create tags
        self.tag1, _ = Tag.objects.get_or_create(
            name="urgent",
            defaults={"color": "#EF4444"}
        )
        self.tag2, _ = Tag.objects.get_or_create(
            name="backend",
            defaults={"color": "#3B82F6"}
        )

        # Create test project
        self.project = Project.objects.create(
            title="Test Project",
            description="Original description",
            owner=self.owner,
            status="active",
            health="healthy",
            progress=0,
        )
        self.project.tags.add(self.tag1)

    def test_activity_creation_on_project_update(self):
        """Test that activity is logged when project is updated"""
        self.client.force_authenticate(user=self.owner)

        update_data = {
            "title": "Updated Title",
            "status": "on_hold",
            "progress": 50,
        }

        response = self.client.patch(
            f"/api/projects/{self.project.id}/",
            update_data,
            format="json"
        )

        assert response.status_code == status.HTTP_200_OK

        # Check that activity was created
        activity = Activity.objects.filter(project=self.project).latest("created_at")
        assert activity is not None
        assert activity.activity_type == "updated"
        assert activity.user == self.owner
        assert "Updated Title" in activity.description or "title" in str(activity.changed_fields)

    def test_activity_tracks_changed_fields(self):
        """Test that activity tracks which fields were changed"""
        self.client.force_authenticate(user=self.owner)

        update_data = {
            "status": "archived",
            "health": "at_risk",
        }

        response = self.client.patch(
            f"/api/projects/{self.project.id}/",
            update_data,
            format="json"
        )

        assert response.status_code == status.HTTP_200_OK

        activity = Activity.objects.filter(project=self.project).latest("created_at")
        assert activity.changed_fields is not None
        assert "status" in activity.changed_fields
        assert "health" in activity.changed_fields

    def test_activity_stores_previous_values(self):
        """Test that activity stores previous field values"""
        self.client.force_authenticate(user=self.owner)

        # Update status
        update_data = {"status": "on_hold"}
        response = self.client.patch(
            f"/api/projects/{self.project.id}/",
            update_data,
            format="json"
        )

        assert response.status_code == status.HTTP_200_OK

        activity = Activity.objects.filter(project=self.project).latest("created_at")
        assert activity.previous_values is not None
        assert activity.previous_values.get("status") == "active"
        assert activity.new_values.get("status") == "on_hold"

    def test_changelog_endpoint_returns_activities(self):
        """Test that changelog endpoint returns project activities"""
        self.client.force_authenticate(user=self.owner)

        # Create some activities
        for i in range(5):
            Activity.objects.create(
                project=self.project,
                activity_type="updated",
                user=self.owner,
                description=f"Change {i}",
                changed_fields=["title"],
                previous_values={"title": f"Old Title {i}"},
                new_values={"title": f"New Title {i}"},
            )

        response = self.client.get(f"/api/projects/{self.project.id}/changelog/")

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) > 0

    def test_changelog_filtering_by_activity_type(self):
        """Test filtering changelog by activity type"""
        self.client.force_authenticate(user=self.owner)

        # Create activities of different types
        Activity.objects.create(
            project=self.project,
            activity_type="created",
            user=self.owner,
            description="Project created",
        )
        Activity.objects.create(
            project=self.project,
            activity_type="updated",
            user=self.owner,
            description="Project updated",
        )

        # Filter by activity type
        response = self.client.get(
            f"/api/projects/{self.project.id}/changelog/",
            {"activity_type": "updated"}
        )

        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", [])
        # Should only have updated activities
        for activity in results:
            assert activity["activity_type"] == "updated"

    def test_changelog_filtering_by_date_range(self):
        """Test filtering changelog by date range"""
        self.client.force_authenticate(user=self.owner)

        # Create activity in past
        past_activity = Activity.objects.create(
            project=self.project,
            activity_type="created",
            user=self.owner,
            description="Old activity",
            created_at=datetime.now() - timedelta(days=10),
        )

        # Create activity now
        Activity.objects.create(
            project=self.project,
            activity_type="updated",
            user=self.owner,
            description="Recent activity",
        )

        # Filter by date range (last 5 days)
        today = datetime.now().date()
        start_date = today - timedelta(days=5)

        response = self.client.get(
            f"/api/projects/{self.project.id}/changelog/",
            {
                "start_date": str(start_date),
                "end_date": str(today),
            }
        )

        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", [])
        # Should not include the old activity
        for activity in results:
            assert activity["description"] != "Old activity"

    def test_changelog_pagination(self):
        """Test changelog pagination"""
        self.client.force_authenticate(user=self.owner)

        # Create many activities
        for i in range(25):
            Activity.objects.create(
                project=self.project,
                activity_type="updated",
                user=self.owner,
                description=f"Change {i}",
            )

        # Test default page size
        response = self.client.get(f"/api/projects/{self.project.id}/changelog/")
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) <= 20  # Default page size

        # Test custom page size
        response = self.client.get(
            f"/api/projects/{self.project.id}/changelog/",
            {"page_size": 10}
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) <= 10

    def test_changelog_permissions(self):
        """Test that only authorized users can view changelog"""
        # Create a project owned by someone else
        other_user = User.objects.create_user(
            username="other", email="other@test.com", password="testpass123"
        )
        other_project = Project.objects.create(
            title="Other Project",
            description="Not mine",
            owner=other_user,
            status="active",
            health="healthy",
        )

        # Unauthenticated user should not access
        response = self.client.get(f"/api/projects/{other_project.id}/changelog/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Non-team member should not access
        self.client.force_authenticate(user=self.viewer)
        response = self.client.get(f"/api/projects/{other_project.id}/changelog/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_activity_includes_all_changelog_fields(self):
        """Test that activity serialization includes all changelog fields"""
        self.client.force_authenticate(user=self.owner)

        activity = Activity.objects.create(
            project=self.project,
            activity_type="updated",
            user=self.owner,
            description="Test update",
            metadata={"key": "value"},
            changed_fields=["title", "status"],
            previous_values={"title": "Old", "status": "active"},
            new_values={"title": "New", "status": "on_hold"},
            change_reason="User requested change",
        )

        response = self.client.get(f"/api/projects/{self.project.id}/changelog/")
        assert response.status_code == status.HTTP_200_OK

        results = response.data.get("results", [])
        found = False
        for entry in results:
            if entry["id"] == activity.id:
                found = True
                assert entry["activity_type"] == "updated"
                assert entry["user"]["username"] == "owner"
                assert entry["changed_fields"] == ["title", "status"]
                assert entry["previous_values"]["title"] == "Old"
                assert entry["new_values"]["title"] == "New"
                assert entry["change_reason"] == "User requested change"

        assert found, "Activity not found in changelog"

    def test_activity_creation_captures_description(self):
        """Test that meaningful descriptions are captured for activities"""
        self.client.force_authenticate(user=self.owner)

        update_data = {"title": "New Title"}
        self.client.patch(
            f"/api/projects/{self.project.id}/",
            update_data,
            format="json"
        )

        activity = Activity.objects.filter(project=self.project).latest("created_at")
        assert activity.description is not None
        assert len(activity.description) > 0
