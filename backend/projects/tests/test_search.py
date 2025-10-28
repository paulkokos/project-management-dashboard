"""
Tests for Elasticsearch search functionality
"""

import pytest
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from projects.models import Activity, Milestone, Project, Role, Tag, TeamMember


@pytest.mark.django_db
class TestSearchAPI(TestCase):
    """Test suite for Elasticsearch search endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()

        # Create users
        self.owner = User.objects.create_user(
            username="john_doe", email="john@example.com", password="testpass123"
        )
        self.other_user = User.objects.create_user(
            username="jane_smith", email="jane@example.com", password="testpass123"
        )
        self.admin_user = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="testpass123"
        )

        # Create roles
        self.lead_role = Role.objects.create(name="Lead")
        self.dev_role = Role.objects.create(name="Developer")

        # Create tags
        self.tag_mobile, _ = Tag.objects.get_or_create(name="mobile")
        self.tag_backend, _ = Tag.objects.get_or_create(name="backend")
        self.tag_urgent, _ = Tag.objects.get_or_create(name="urgent")

        # Create projects
        self.project1 = Project.objects.create(
            title="Mobile App Development",
            description="Build iOS and Android applications",
            owner=self.owner,
            status="active",
            health="healthy",
            progress=75,
        )
        self.project1.tags.add(self.tag_mobile)

        self.project2 = Project.objects.create(
            title="Backend API Development",
            description="Create RESTful API for mobile apps",
            owner=self.owner,
            status="active",
            health="at_risk",
            progress=50,
        )
        self.project2.tags.add(self.tag_backend)

        self.project3 = Project.objects.create(
            title="Data Migration Project",
            description="Migrate legacy data to new database",
            owner=self.other_user,
            status="archived",
            health="healthy",
            progress=100,
        )
        self.project3.tags.add(self.tag_urgent)

        # Create milestones for project1
        Milestone.objects.create(
            project=self.project1,
            title="Design Phase",
            description="UI/UX design for mobile apps",
            progress=100,
        )
        Milestone.objects.create(
            project=self.project1,
            title="Development Phase",
            description="Implementation of mobile features",
            progress=60,
        )

        # Add team members
        TeamMember.objects.create(
            project=self.project1, user=self.other_user, role=self.dev_role, capacity=80
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

    def test_search_unauthenticated(self):
        """Test that search requires authentication"""
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/search/search/", {"q": "mobile"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_search_missing_query(self):
        """Test that search requires query parameter"""
        response = self.client.get("/api/search/search/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    def test_search_basic_query(self):
        """Test basic full-text search"""
        response = self.client.get("/api/search/search/", {"q": "mobile"})
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert "facets" in response.data
        assert "total" in response.data

    def test_search_by_title(self):
        """Test searching by project title"""
        response = self.client.get("/api/search/search/", {"q": "Mobile App"})
        assert response.status_code == status.HTTP_200_OK
        # Should find project1
        results = response.data["results"]
        titles = [r["title"] for r in results]
        assert "Mobile App Development" in titles

    def test_search_by_description(self):
        """Test searching by project description"""
        response = self.client.get("/api/search/search/", {"q": "RESTful API"})
        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        titles = [r["title"] for r in results]
        assert "Backend API Development" in titles

    def test_search_by_tag(self):
        """Test searching by tag"""
        response = self.client.get("/api/search/search/", {"q": "backend"})
        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        titles = [r["title"] for r in results]
        assert "Backend API Development" in titles

    def test_search_filter_by_status(self):
        """Test filtering search results by status"""
        response = self.client.get(
            "/api/search/search/", {"q": "project", "status": "active"}
        )
        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        # All results should have status 'active'
        for result in results:
            assert result["status"] == "active"

    def test_search_filter_by_health(self):
        """Test filtering search results by health"""
        response = self.client.get(
            "/api/search/search/", {"q": "project", "health": "healthy"}
        )
        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        # All results should have health 'healthy'
        for result in results:
            assert result["health"] == "healthy"

    def test_search_filter_by_owner(self):
        """Test filtering search results by owner"""
        response = self.client.get(
            "/api/search/search/", {"q": "project", "owner": "john_doe"}
        )
        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        # All results should be owned by john_doe
        for result in results:
            assert result["owner"]["username"] == "john_doe"

    def test_search_permission_filtering(self):
        """Test that search only returns accessible projects"""
        # As owner, should see own projects and projects where user is team member
        response = self.client.get("/api/search/search/", {"q": "project"})
        assert response.status_code == status.HTTP_200_OK

        # Should NOT include project3 (owned by other_user, user not team member)
        results = response.data["results"]
        titles = [r["title"] for r in results]
        assert "Data Migration Project" not in titles

        # Should include project1 and project2 (owned by user)
        assert "Mobile App Development" in titles
        assert "Backend API Development" in titles

    def test_search_as_team_member(self):
        """Test search accessibility as team member"""
        # Authenticate as team member
        self.client.force_authenticate(user=self.other_user)

        response = self.client.get("/api/search/search/", {"q": "Mobile"})
        assert response.status_code == status.HTTP_200_OK

        # Should see project1 (is team member)
        results = response.data["results"]
        titles = [r["title"] for r in results]
        assert "Mobile App Development" in titles

    def test_search_as_admin(self):
        """Test that admin can see all projects"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get("/api/search/search/", {"q": "project"})
        assert response.status_code == status.HTTP_200_OK

        # Admin should see all projects
        results = response.data["results"]
        assert len(results) >= 3

    def test_search_pagination(self):
        """Test search result pagination"""
        response = self.client.get(
            "/api/search/search/", {"q": "project", "page": 1, "page_size": 10}
        )
        assert response.status_code == status.HTTP_200_OK
        assert "page" in response.data
        assert "page_size" in response.data
        assert "total_pages" in response.data
        assert response.data["page"] == 1
        assert response.data["page_size"] == 10

    def test_search_facets(self):
        """Test that search returns faceted results"""
        response = self.client.get("/api/search/search/", {"q": "project"})
        assert response.status_code == status.HTTP_200_OK
        assert "facets" in response.data

        facets = response.data["facets"]
        assert "statuses" in facets
        assert "healths" in facets
        assert "owners" in facets

    def test_search_empty_result(self):
        """Test search with no matching results"""
        response = self.client.get("/api/search/search/", {"q": "nonexistentquery123"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total"] == 0
        assert len(response.data["results"]) == 0

    def test_search_soft_deleted_excluded(self):
        """Test that soft-deleted projects are excluded from search"""
        # Soft delete project1
        self.project1.soft_delete()

        response = self.client.get("/api/search/search/", {"q": "Mobile"})
        assert response.status_code == status.HTTP_200_OK

        # Should not find deleted project
        results = response.data["results"]
        titles = [r["title"] for r in results]
        assert "Mobile App Development" not in titles

    def test_autocomplete_unauthenticated(self):
        """Test that autocomplete requires authentication"""
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/search/autocomplete/", {"q": "mob"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_autocomplete_minimum_length(self):
        """Test that autocomplete requires minimum 2 characters"""
        response = self.client.get("/api/search/autocomplete/", {"q": "a"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["suggestions"] == []

    def test_autocomplete_suggestions(self):
        """Test autocomplete suggestions"""
        response = self.client.get("/api/search/autocomplete/", {"q": "mob"})
        assert response.status_code == status.HTTP_200_OK

        suggestions = response.data["suggestions"]
        assert len(suggestions) > 0

        # Check suggestion structure
        for suggestion in suggestions:
            assert "title" in suggestion
            assert "id" in suggestion
            assert "type" in suggestion

    def test_autocomplete_prefix_matching(self):
        """Test that autocomplete does prefix matching"""
        response = self.client.get("/api/search/autocomplete/", {"q": "Mobile"})
        assert response.status_code == status.HTTP_200_OK

        suggestions = response.data["suggestions"]
        assert len(suggestions) > 0

        # Should find projects starting with 'Mobile'
        titles = [s["title"] for s in suggestions]
        assert any("Mobile" in title for title in titles)

    def test_autocomplete_limit(self):
        """Test autocomplete result limit"""
        response = self.client.get(
            "/api/search/autocomplete/", {"q": "project", "limit": 2}
        )
        assert response.status_code == status.HTTP_200_OK

        suggestions = response.data["suggestions"]
        assert len(suggestions) <= 2

    def test_autocomplete_permission_filtering(self):
        """Test that autocomplete respects permissions"""
        # Create another project owned by different user
        project_other = Project.objects.create(
            title="Secret Project",
            description="Only visible to owner",
            owner=self.other_user,
            status="active",
            health="healthy",
        )

        # As john_doe, should not see secret project in autocomplete
        response = self.client.get("/api/search/autocomplete/", {"q": "Secret"})
        assert response.status_code == status.HTTP_200_OK

        suggestions = response.data["suggestions"]
        titles = [s["title"] for s in suggestions]
        assert "Secret Project" not in titles

    def test_search_case_insensitive(self):
        """Test that search is case-insensitive"""
        response1 = self.client.get("/api/search/search/", {"q": "mobile"})
        response2 = self.client.get("/api/search/search/", {"q": "MOBILE"})
        response3 = self.client.get("/api/search/search/", {"q": "Mobile"})

        assert response1.status_code == status.HTTP_200_OK
        assert response2.status_code == status.HTTP_200_OK
        assert response3.status_code == status.HTTP_200_OK

        # All should return same number of results
        assert response1.data["total"] == response2.data["total"]
        assert response2.data["total"] == response3.data["total"]

    def test_search_multiple_filters(self):
        """Test search with multiple filters applied"""
        response = self.client.get(
            "/api/search/search/",
            {
                "q": "project",
                "status": "active",
                "health": "healthy",
                "owner": "john_doe",
            },
        )
        assert response.status_code == status.HTTP_200_OK

        results = response.data["results"]
        for result in results:
            assert result["status"] == "active"
            assert result["health"] == "healthy"
            assert result["owner"]["username"] == "john_doe"
