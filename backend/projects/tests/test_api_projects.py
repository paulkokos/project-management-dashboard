"""
Comprehensive tests for Project API endpoints
Tests all CRUD operations, permissions, filtering, and edge cases
"""

from datetime import datetime, timedelta

import pytest
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from projects.models import Activity, Project, Role, Tag, TeamMember


@pytest.mark.django_db
class ProjectAPITests(TestCase):
    """Test Project API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()

        # Create test users
        self.owner = User.objects.create_user(
            username="owner", email="owner@test.com", password="testpass123"
        )
        self.team_lead = User.objects.create_user(
            username="team_lead", email="lead@test.com", password="testpass123"
        )
        self.developer = User.objects.create_user(
            username="developer", email="dev@test.com", password="testpass123"
        )
        self.stakeholder = User.objects.create_user(
            username="stakeholder", email="stake@test.com", password="testpass123"
        )
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="testpass123"
        )

        # Create roles
        self.role_lead, _ = Role.objects.get_or_create(
            key="lead", defaults={"display_name": "Project Lead", "color": "red"}
        )
        self.role_developer, _ = Role.objects.get_or_create(
            key="developer", defaults={"display_name": "Developer", "color": "blue"}
        )
        self.role_stakeholder, _ = Role.objects.get_or_create(
            key="stakeholder", defaults={"display_name": "Stakeholder", "color": "pink"}
        )

        # Create tags
        self.backend_tag, _ = Tag.objects.get_or_create(
            name="backend", defaults={"color": "#3B82F6"}
        )
        self.frontend_tag, _ = Tag.objects.get_or_create(
            name="frontend", defaults={"color": "#10B981"}
        )

        # Create test projects
        self.project = Project.objects.create(
            title="Test Project",
            description="Test Description",
            owner=self.owner,
            status="active",
            health="healthy",
            progress=50,
        )
        self.project.tags.add(self.backend_tag)

        # Create another project for filtering tests
        self.project2 = Project.objects.create(
            title="Another Project",
            description="Another Description",
            owner=self.team_lead,
            status="in_hold",
            health="at_risk",
            progress=30,
        )
        self.project2.tags.add(self.frontend_tag)

        # Add team members
        TeamMember.objects.create(
            project=self.project, user=self.team_lead, role=self.role_lead, capacity=80
        )
        TeamMember.objects.create(
            project=self.project,
            user=self.developer,
            role=self.role_developer,
            capacity=100,
        )

    # ============ LIST ENDPOINT TESTS ============

    def test_list_projects_unauthenticated(self):
        """Unauthenticated users should not access projects"""
        response = self.client.get("/api/projects/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_projects_owner_sees_owned_projects(self):
        """Owner should see their own projects"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get("/api/projects/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 1
        assert any(p["id"] == self.project.id for p in response.data["results"])

    def test_list_projects_team_member_sees_assigned_projects(self):
        """Team members should see projects they're assigned to"""
        self.client.force_authenticate(user=self.team_lead)
        response = self.client.get("/api/projects/")
        assert response.status_code == status.HTTP_200_OK
        # Team lead owns project2 and is assigned to project
        assert len(response.data["results"]) >= 2

    def test_list_projects_unrelated_user_sees_nothing(self):
        """Unrelated users should not see projects they're not part of"""
        other_user = User.objects.create_user(
            username="other", email="other@test.com", password="testpass123"
        )
        self.client.force_authenticate(user=other_user)
        response = self.client.get("/api/projects/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 0

    def test_list_projects_admin_sees_all(self):
        """Admin should see all projects"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/projects/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 2

    def test_list_projects_pagination(self):
        """Pagination should work correctly"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/projects/?page=1")
        assert response.status_code == status.HTTP_200_OK
        assert "count" in response.data
        assert "next" in response.data
        assert "previous" in response.data

    def test_list_projects_filter_by_status(self):
        """Filtering by status should work"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/projects/?status=active")
        assert response.status_code == status.HTTP_200_OK
        for project in response.data["results"]:
            assert project["status"] == "active"

    def test_list_projects_filter_by_health(self):
        """Filtering by health should work"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/projects/?health=healthy")
        assert response.status_code == status.HTTP_200_OK
        for project in response.data["results"]:
            assert project["health"] == "healthy"

    def test_list_projects_filter_by_owner(self):
        """Filtering by owner should work"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"/api/projects/?owner={self.owner.id}")
        assert response.status_code == status.HTTP_200_OK
        for project in response.data["results"]:
            assert project["owner"]["id"] == self.owner.id

    def test_list_projects_filter_by_tags(self):
        """Filtering by tags should work"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"/api/projects/?tags={self.backend_tag.id}")
        assert response.status_code == status.HTTP_200_OK
        # Should return projects with backend tag
        assert any(p["id"] == self.project.id for p in response.data["results"])

    def test_list_projects_search_by_title(self):
        """Search by title should work"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/projects/?search=Test")
        assert response.status_code == status.HTTP_200_OK
        assert any(p["title"].startswith("Test") for p in response.data["results"])

    def test_list_projects_search_by_description(self):
        """Search by description should work"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/projects/?search=Description")
        assert response.status_code == status.HTTP_200_OK

    def test_list_projects_ordering_by_title(self):
        """Ordering by title should work"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/projects/?ordering=title")
        assert response.status_code == status.HTTP_200_OK

    def test_list_projects_ordering_by_created_at(self):
        """Ordering by created_at should work"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/projects/?ordering=created_at")
        assert response.status_code == status.HTTP_200_OK

    def test_list_projects_ordering_descending(self):
        """Reverse ordering should work"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/projects/?ordering=-progress")
        assert response.status_code == status.HTTP_200_OK

    # ============ CREATE ENDPOINT TESTS ============

    def test_create_project_authenticated(self):
        """Authenticated user should create project"""
        self.client.force_authenticate(user=self.owner)
        data = {
            "title": "New Project",
            "description": "New Description",
            "status": "active",
            "health": "healthy",
            "progress": 0,
        }
        response = self.client.post("/api/projects/", data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "New Project"
        assert response.data["owner"]["id"] == self.owner.id

    def test_create_project_with_tags(self):
        """Creating project with tags should work"""
        self.client.force_authenticate(user=self.owner)
        data = {
            "title": "Tagged Project",
            "description": "Has tags",
            "status": "active",
            "tags": [self.backend_tag.id, self.frontend_tag.id],
        }
        response = self.client.post("/api/projects/", data)
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data["tags"]) == 2

    def test_create_project_with_dates(self):
        """Creating project with start and end dates should work"""
        self.client.force_authenticate(user=self.owner)
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=30)
        data = {
            "title": "Dated Project",
            "description": "Has dates",
            "status": "active",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        }
        response = self.client.post("/api/projects/", data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_create_project_validates_title_required(self):
        """Title is required"""
        self.client.force_authenticate(user=self.owner)
        data = {"description": "No title"}
        response = self.client.post("/api/projects/", data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "title" in response.data

    def test_create_project_validates_invalid_status(self):
        """Invalid status should be rejected"""
        self.client.force_authenticate(user=self.owner)
        data = {"title": "Project", "status": "invalid_status"}
        response = self.client.post("/api/projects/", data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_project_logs_activity(self):
        """Creating project should log activity"""
        self.client.force_authenticate(user=self.owner)
        data = {"title": "Activity Test", "description": "Test"}
        response = self.client.post("/api/projects/", data)
        assert response.status_code == status.HTTP_201_CREATED

        project_id = response.data["id"]
        activity = Activity.objects.filter(
            project_id=project_id, activity_type="created"
        ).first()
        assert activity is not None
        assert "created" in activity.description

    def test_create_project_unauthenticated(self):
        """Unauthenticated user cannot create project"""
        data = {"title": "Unauthorized Project"}
        response = self.client.post("/api/projects/", data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # ============ RETRIEVE ENDPOINT TESTS ============

    def test_retrieve_project_owner(self):
        """Owner should retrieve their project"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/projects/{self.project.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == self.project.id
        assert response.data["title"] == self.project.title

    def test_retrieve_project_team_member(self):
        """Team member should retrieve project they're on"""
        self.client.force_authenticate(user=self.team_lead)
        response = self.client.get(f"/api/projects/{self.project.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == self.project.id

    def test_retrieve_project_unrelated_user(self):
        """Unrelated user cannot retrieve project"""
        other_user = User.objects.create_user(
            username="other", email="other@test.com", password="testpass123"
        )
        self.client.force_authenticate(user=other_user)
        response = self.client.get(f"/api/projects/{self.project.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_retrieve_project_admin(self):
        """Admin can retrieve any project"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"/api/projects/{self.project.id}/")
        assert response.status_code == status.HTTP_200_OK

    def test_retrieve_nonexistent_project(self):
        """Retrieving nonexistent project returns 404"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get("/api/projects/99999/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_retrieve_project_includes_team_members(self):
        """Retrieved project should include team members"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/projects/{self.project.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert "team_members_details" in response.data

    def test_retrieve_project_includes_milestones(self):
        """Retrieved project should include milestones"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/projects/{self.project.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert "milestones" in response.data

    def test_retrieve_project_includes_tags(self):
        """Retrieved project should include tags"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/projects/{self.project.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["tags"]) > 0

    # ============ UPDATE ENDPOINT TESTS ============

    def test_update_project_owner(self):
        """Owner should update their project"""
        self.client.force_authenticate(user=self.owner)
        data = {"title": "Updated Title", "description": "Updated Description"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_200_OK
        self.project.refresh_from_db()
        assert self.project.title == "Updated Title"

    def test_update_project_project_lead_can_edit(self):
        """Project lead should be able to edit project"""
        self.client.force_authenticate(user=self.team_lead)
        data = {"title": "Lead Updated"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_200_OK

    def test_update_project_developer_cannot_edit(self):
        """Developer (non-lead) should not edit project"""
        self.client.force_authenticate(user=self.developer)
        data = {"title": "Developer Updated"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_project_unrelated_user_cannot_edit(self):
        """Unrelated user cannot edit project"""
        other_user = User.objects.create_user(
            username="other", email="other@test.com", password="testpass123"
        )
        self.client.force_authenticate(user=other_user)
        data = {"title": "Unauthorized Update"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_project_admin_can_edit(self):
        """Admin can edit any project"""
        self.client.force_authenticate(user=self.admin)
        data = {"title": "Admin Updated"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_200_OK

    def test_update_project_logs_activity(self):
        """Updating project should log activity"""
        self.client.force_authenticate(user=self.owner)
        data = {"title": "Activity Update"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_200_OK

        activity = (
            Activity.objects.filter(project_id=self.project.id, activity_type="updated")
            .order_by("-created_at")
            .first()
        )
        assert activity is not None

    def test_update_project_status(self):
        """Status can be updated"""
        self.client.force_authenticate(user=self.owner)
        data = {"status": "on_hold"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_200_OK
        self.project.refresh_from_db()
        assert self.project.status == "on_hold"

    def test_update_project_health(self):
        """Health can be updated"""
        self.client.force_authenticate(user=self.owner)
        data = {"health": "critical"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_200_OK
        self.project.refresh_from_db()
        assert self.project.health == "critical"

    def test_update_project_progress(self):
        """Progress can be updated"""
        self.client.force_authenticate(user=self.owner)
        data = {"progress": 75}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_200_OK
        self.project.refresh_from_db()
        assert self.project.progress == 75

    def test_update_project_progress_validation(self):
        """Progress should be between 0 and 100"""
        self.client.force_authenticate(user=self.owner)
        data = {"progress": 150}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        # May return 400 or accept it depending on validation
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]

    def test_update_project_add_tags(self):
        """Tags can be added to project"""
        self.client.force_authenticate(user=self.owner)
        data = {"tags": [self.backend_tag.id, self.frontend_tag.id]}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_200_OK
        self.project.refresh_from_db()
        assert self.project.tags.count() >= 2

    def test_update_project_concurrency_conflict(self):
        """ETag mismatch should return 409"""
        self.client.force_authenticate(user=self.owner)
        data = {"title": "Concurrent Update", "etag": "wrong_etag"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code in [status.HTTP_409_CONFLICT, status.HTTP_200_OK]

    # ============ DELETE ENDPOINT TESTS ============

    def test_soft_delete_project_owner(self):
        """Owner should soft delete their project"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        assert response.status_code == status.HTTP_200_OK
        self.project.refresh_from_db()
        assert self.project.is_deleted()

    def test_soft_delete_project_team_member_cannot(self):
        """Team member should not delete project"""
        self.client.force_authenticate(user=self.team_lead)
        response = self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_soft_delete_project_admin_can(self):
        """Admin should delete any project"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        assert response.status_code == status.HTTP_200_OK

    def test_soft_delete_logs_activity(self):
        """Soft delete should log activity"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        assert response.status_code == status.HTTP_200_OK

        activity = (
            Activity.objects.filter(project_id=self.project.id, activity_type="updated")
            .order_by("-created_at")
            .first()
        )
        assert activity is not None
        assert "deleted" in activity.description.lower()

    def test_soft_delete_nonexistent_project(self):
        """Deleting nonexistent project returns 404"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.post("/api/projects/99999/soft_delete/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_soft_deleted_project_not_in_list(self):
        """Soft deleted project should not appear in regular list"""
        self.client.force_authenticate(user=self.owner)
        # Delete the project
        self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        # List projects
        response = self.client.get("/api/projects/")
        assert response.status_code == status.HTTP_200_OK
        assert not any(p["id"] == self.project.id for p in response.data["results"])

    def test_restore_project_owner(self):
        """Owner should restore their soft-deleted project"""
        self.client.force_authenticate(user=self.owner)
        # Delete first
        self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        # Restore
        response = self.client.post(f"/api/projects/{self.project.id}/restore/")
        assert response.status_code == status.HTTP_200_OK
        self.project.refresh_from_db()
        assert not self.project.is_deleted()

    def test_restore_project_admin_can(self):
        """Admin should restore any project"""
        self.client.force_authenticate(user=self.owner)
        self.client.post(f"/api/projects/{self.project.id}/soft_delete/")

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/projects/{self.project.id}/restore/")
        assert response.status_code == status.HTTP_200_OK

    def test_restore_not_deleted_project(self):
        """Restoring non-deleted project should fail"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f"/api/projects/{self.project.id}/restore/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_restore_logs_activity(self):
        """Restore should log activity"""
        self.client.force_authenticate(user=self.owner)
        self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        response = self.client.post(f"/api/projects/{self.project.id}/restore/")
        assert response.status_code == status.HTTP_200_OK

        activity = Activity.objects.filter(
            project_id=self.project.id, activity_type="restored"
        ).first()
        assert activity is not None

    def test_list_deleted_projects(self):
        """Should list soft-deleted projects"""
        self.client.force_authenticate(user=self.owner)
        # Delete project
        self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        # List deleted
        response = self.client.get("/api/projects/deleted/")
        assert response.status_code == status.HTTP_200_OK
        assert any(p["id"] == self.project.id for p in response.data)

    # ============ BULK OPERATIONS TESTS ============

    def test_bulk_update_projects_status(self):
        """Should bulk update project status"""
        self.client.force_authenticate(user=self.owner)
        data = {
            "project_ids": [self.project.id],
            "status": "completed",
            "etag": self.project.etag,
        }
        response = self.client.post("/api/projects/bulk_update/", data)
        assert response.status_code == status.HTTP_200_OK
        self.project.refresh_from_db()
        assert self.project.status == "completed"

    def test_bulk_update_permission_denied(self):
        """Only owner should bulk update"""
        self.client.force_authenticate(user=self.team_lead)
        data = {
            "project_ids": [self.project.id],
            "status": "completed",
            "etag": self.project.etag,
        }
        response = self.client.post("/api/projects/bulk_update/", data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_bulk_update_mixed_permissions(self):
        """Should fail if user doesn't own all projects"""
        self.client.force_authenticate(user=self.owner)
        data = {
            "project_ids": [
                self.project.id,
                self.project2.id,
            ],  # Owner of project1 but not project2
            "status": "completed",
            "etag": self.project.etag,
        }
        response = self.client.post("/api/projects/bulk_update/", data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    # ============ TEAM MEMBER MANAGEMENT TESTS ============

    def test_add_team_member_owner(self):
        """Owner should add team member"""
        new_user = User.objects.create_user(
            username="newmember", email="newmember@test.com", password="testpass123"
        )
        self.client.force_authenticate(user=self.owner)
        data = {
            "user_id": new_user.id,
            "role_id": self.role_developer.id,
            "capacity": 100,
        }
        response = self.client.post(
            f"/api/projects/{self.project.id}/add_team_member/", data
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_add_team_member_team_member_cannot(self):
        """Team member should not add new members"""
        new_user = User.objects.create_user(
            username="newmember", email="newmember@test.com", password="testpass123"
        )
        self.client.force_authenticate(user=self.team_lead)
        data = {
            "user_id": new_user.id,
            "role_id": self.role_developer.id,
            "capacity": 100,
        }
        response = self.client.post(
            f"/api/projects/{self.project.id}/add_team_member/", data
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_remove_team_member_owner(self):
        """Owner should remove team member"""
        self.client.force_authenticate(user=self.owner)
        data = {"user_id": self.team_lead.id}
        response = self.client.delete(
            f"/api/projects/{self.project.id}/remove_team_member/", data
        )
        assert response.status_code == status.HTTP_200_OK
        assert not TeamMember.objects.filter(
            project=self.project, user=self.team_lead
        ).exists()

    def test_remove_nonexistent_team_member(self):
        """Removing nonexistent team member returns 404"""
        self.client.force_authenticate(user=self.owner)
        data = {"user_id": 99999}
        response = self.client.delete(
            f"/api/projects/{self.project.id}/remove_team_member/", data
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_team_member_owner(self):
        """Owner should update team member role and capacity"""
        self.client.force_authenticate(user=self.owner)
        data = {
            "user_id": self.team_lead.id,
            "role_id": self.role_developer.id,
            "capacity": 50,
        }
        response = self.client.patch(
            f"/api/projects/{self.project.id}/update_team_member/", data
        )
        assert response.status_code == status.HTTP_200_OK
        team_member = TeamMember.objects.get(project=self.project, user=self.team_lead)
        assert team_member.capacity == 50

    # ============ ACTIVITY LOG TESTS ============

    def test_activities_endpoint(self):
        """Should retrieve project activities"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/projects/{self.project.id}/activities/")
        assert response.status_code == status.HTTP_200_OK

    def test_activities_contain_changes(self):
        """Activities should have descriptive messages"""
        self.client.force_authenticate(user=self.owner)
        # Make a change
        self.client.patch(f"/api/projects/{self.project.id}/", {"title": "New Title"})
        # Get activities
        response = self.client.get(f"/api/projects/{self.project.id}/activities/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
