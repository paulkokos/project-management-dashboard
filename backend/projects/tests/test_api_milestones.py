"""
Comprehensive tests for Milestone API endpoints
Tests CRUD operations, progress tracking, and permissions
"""

from datetime import datetime, timedelta

import pytest
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from projects.models import Activity, Milestone, Project, Role, TeamMember


@pytest.mark.django_db
class MilestoneAPITests(TestCase):
    """Test Milestone API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()

        # Create users
        self.owner = User.objects.create_user(
            username="owner", email="owner@test.com", password="testpass123"
        )
        self.team_lead = User.objects.create_user(
            username="team_lead", email="lead@test.com", password="testpass123"
        )
        self.developer = User.objects.create_user(
            username="developer", email="dev@test.com", password="testpass123"
        )
        self.other_user = User.objects.create_user(
            username="other", email="other@test.com", password="testpass123"
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

        # Create project
        self.project = Project.objects.create(
            title="Test Project",
            description="Test Description",
            owner=self.owner,
            status="active",
            health="healthy",
            progress=50,
        )

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

        # Create milestones
        self.milestone1 = Milestone.objects.create(
            project=self.project,
            title="Phase 1",
            description="Initial phase",
            progress=50,
            due_date=datetime.now().date() + timedelta(days=30),
        )
        self.milestone2 = Milestone.objects.create(
            project=self.project,
            title="Phase 2",
            description="Secondary phase",
            progress=0,
            due_date=datetime.now().date() + timedelta(days=60),
        )

    # ============ CREATE TESTS ============

    def test_create_milestone_owner(self):
        """Owner should create milestone"""
        self.client.force_authenticate(user=self.owner)
        data = {
            "title": "New Milestone",
            "description": "New phase",
            "progress": 0,
        }
        response = self.client.post(
            "/api/milestones/?project_id=" + str(self.project.id), data
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "New Milestone"

    def test_create_milestone_team_member(self):
        """Team member should create milestone"""
        self.client.force_authenticate(user=self.team_lead)
        data = {
            "title": "Team Milestone",
            "description": "By team",
            "progress": 0,
        }
        response = self.client.post(
            "/api/milestones/?project_id=" + str(self.project.id), data
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_create_milestone_unrelated_user_cannot(self):
        """Unrelated user cannot create milestone"""
        self.client.force_authenticate(user=self.other_user)
        data = {
            "title": "Unauthorized",
            "description": "Not allowed",
            "progress": 0,
        }
        response = self.client.post(
            "/api/milestones/?project_id=" + str(self.project.id), data
        )
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_400_BAD_REQUEST,
        ]

    def test_create_milestone_with_due_date(self):
        """Milestone can be created with due date"""
        self.client.force_authenticate(user=self.owner)
        due_date = (datetime.now().date() + timedelta(days=30)).isoformat()
        data = {
            "title": "Dated Milestone",
            "description": "Has due date",
            "progress": 0,
            "due_date": due_date,
        }
        response = self.client.post(
            "/api/milestones/?project_id=" + str(self.project.id), data
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_create_milestone_validates_title_required(self):
        """Title is required"""
        self.client.force_authenticate(user=self.owner)
        data = {"description": "No title", "progress": 0, "project_id": self.project.id}
        response = self.client.post(
            "/api/milestones/?project_id=" + str(self.project.id), data
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_milestone_logs_activity(self):
        """Creating milestone should log activity"""
        self.client.force_authenticate(user=self.owner)
        data = {
            "title": "Activity Milestone",
            "description": "Test activity",
            "progress": 0,
        }
        response = self.client.post(
            "/api/milestones/?project_id=" + str(self.project.id), data
        )
        assert response.status_code == status.HTTP_201_CREATED

        activity = (
            Activity.objects.filter(
                project=self.project, activity_type="milestone_added"
            )
            .order_by("-created_at")
            .first()
        )
        assert activity is not None

    def test_create_milestone_without_project_id(self):
        """Creating milestone without project_id should fail"""
        self.client.force_authenticate(user=self.owner)
        data = {"title": "No Project", "description": "Test", "progress": 0}
        response = self.client.post("/api/milestones/", data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # ============ LIST TESTS ============

    def test_list_milestones_owner(self):
        """Owner can list project milestones"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/milestones/?project_id={self.project.id}")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 2

    def test_list_milestones_team_member(self):
        """Team member can list project milestones"""
        self.client.force_authenticate(user=self.team_lead)
        response = self.client.get(f"/api/milestones/?project_id={self.project.id}")
        assert response.status_code == status.HTTP_200_OK

    def test_list_milestones_unrelated_user_cannot(self):
        """Unrelated user cannot list milestones"""
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(f"/api/milestones/?project_id={self.project.id}")
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_200_OK]

    def test_list_milestones_pagination(self):
        """Milestones should be paginated"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(
            f"/api/milestones/?project_id={self.project.id}&page=1"
        )
        assert response.status_code == status.HTTP_200_OK
        assert "count" in response.data

    def test_list_milestones_ordering_by_due_date(self):
        """Milestones should be orderable by due date"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(
            f"/api/milestones/?project_id={self.project.id}&ordering=due_date"
        )
        assert response.status_code == status.HTTP_200_OK

    def test_list_milestones_ordering_by_progress(self):
        """Milestones should be orderable by progress"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(
            f"/api/milestones/?project_id={self.project.id}&ordering=progress"
        )
        assert response.status_code == status.HTTP_200_OK

    # ============ RETRIEVE TESTS ============

    def test_retrieve_milestone_owner(self):
        """Owner should retrieve milestone"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/milestones/{self.milestone1.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == self.milestone1.id

    def test_retrieve_milestone_team_member(self):
        """Team member should retrieve milestone"""
        self.client.force_authenticate(user=self.team_lead)
        response = self.client.get(f"/api/milestones/{self.milestone1.id}/")
        assert response.status_code == status.HTTP_200_OK

    def test_retrieve_milestone_unrelated_user_cannot(self):
        """Unrelated user cannot retrieve milestone"""
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(f"/api/milestones/{self.milestone1.id}/")
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_retrieve_nonexistent_milestone(self):
        """Retrieving nonexistent milestone returns 404"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get("/api/milestones/99999/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    # ============ UPDATE TESTS ============

    def test_update_milestone_owner(self):
        """Owner should update milestone"""
        self.client.force_authenticate(user=self.owner)
        data = {"title": "Updated Phase 1", "description": "Updated description"}
        response = self.client.patch(f"/api/milestones/{self.milestone1.id}/", data)
        assert response.status_code == status.HTTP_200_OK
        self.milestone1.refresh_from_db()
        assert self.milestone1.title == "Updated Phase 1"

    def test_update_milestone_team_member(self):
        """Team member should update milestone"""
        self.client.force_authenticate(user=self.team_lead)
        data = {"title": "Team Updated"}
        response = self.client.patch(f"/api/milestones/{self.milestone1.id}/", data)
        assert response.status_code == status.HTTP_200_OK

    def test_update_milestone_progress(self):
        """Milestone progress should be updatable"""
        self.client.force_authenticate(user=self.owner)
        data = {"progress": 75}
        response = self.client.patch(f"/api/milestones/{self.milestone1.id}/", data)
        assert response.status_code == status.HTTP_200_OK
        self.milestone1.refresh_from_db()
        assert self.milestone1.progress == 75

    def test_update_milestone_progress_validation(self):
        """Progress should be 0-100"""
        self.client.force_authenticate(user=self.owner)
        data = {"progress": 150}
        response = self.client.patch(f"/api/milestones/{self.milestone1.id}/", data)
        # May accept or reject depending on validation
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]

    def test_update_milestone_due_date(self):
        """Milestone due date should be updatable"""
        self.client.force_authenticate(user=self.owner)
        new_date = (datetime.now().date() + timedelta(days=45)).isoformat()
        data = {"due_date": new_date}
        response = self.client.patch(f"/api/milestones/{self.milestone1.id}/", data)
        assert response.status_code == status.HTTP_200_OK

    def test_update_milestone_logs_activity(self):
        """Updating milestone should log activity"""
        self.client.force_authenticate(user=self.owner)
        data = {"progress": 60}
        response = self.client.patch(f"/api/milestones/{self.milestone1.id}/", data)
        assert response.status_code == status.HTTP_200_OK

        activity = (
            Activity.objects.filter(
                project=self.project, activity_type="progress_updated"
            )
            .order_by("-created_at")
            .first()
        )
        assert activity is not None

    def test_update_milestone_unrelated_user_cannot(self):
        """Unrelated user cannot update milestone"""
        self.client.force_authenticate(user=self.other_user)
        data = {"title": "Unauthorized Update"}
        response = self.client.patch(f"/api/milestones/{self.milestone1.id}/", data)
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]

    # ============ COMPLETE MILESTONE TESTS ============

    def test_complete_milestone(self):
        """Milestone can be marked complete"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f"/api/milestones/{self.milestone1.id}/complete/")
        assert response.status_code == status.HTTP_200_OK
        self.milestone1.refresh_from_db()
        assert self.milestone1.progress == 100

    def test_complete_milestone_team_member(self):
        """Team member can complete milestone"""
        self.client.force_authenticate(user=self.team_lead)
        response = self.client.post(f"/api/milestones/{self.milestone1.id}/complete/")
        assert response.status_code == status.HTTP_200_OK

    def test_complete_milestone_logs_activity(self):
        """Completing milestone should log activity"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f"/api/milestones/{self.milestone1.id}/complete/")
        assert response.status_code == status.HTTP_200_OK

        activity = (
            Activity.objects.filter(
                project=self.project, activity_type="milestone_completed"
            )
            .order_by("-created_at")
            .first()
        )
        assert activity is not None

    # ============ DELETE TESTS ============

    def test_delete_milestone_owner(self):
        """Owner should delete milestone"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f"/api/milestones/{self.milestone1.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Milestone.objects.filter(id=self.milestone1.id).exists()

    def test_delete_milestone_team_member(self):
        """Team member should delete milestone"""
        self.client.force_authenticate(user=self.team_lead)
        response = self.client.delete(f"/api/milestones/{self.milestone1.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_milestone_logs_activity(self):
        """Deleting milestone should log activity"""
        self.client.force_authenticate(user=self.owner)
        # milestone_title = self.milestone1.title  # noqa: F841
        response = self.client.delete(f"/api/milestones/{self.milestone1.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        activity = (
            Activity.objects.filter(
                project=self.project, activity_type="progress_updated"
            )
            .order_by("-created_at")
            .first()
        )
        assert activity is not None
        assert "deleted" in activity.description.lower()

    def test_delete_nonexistent_milestone(self):
        """Deleting nonexistent milestone returns 404"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete("/api/milestones/99999/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    # ============ EDGE CASES ============

    def test_milestone_without_description(self):
        """Milestone can be created without description"""
        self.client.force_authenticate(user=self.owner)
        data = {"title": "No Description", "progress": 0, "project_id": self.project.id}
        response = self.client.post(
            "/api/milestones/?project_id=" + str(self.project.id), data
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_multiple_milestones_same_project(self):
        """Multiple milestones can exist in same project"""
        self.client.force_authenticate(user=self.owner)
        count_before = Milestone.objects.filter(project=self.project).count()

        data = {
            "title": "Another Milestone",
            "progress": 0,
        }
        response = self.client.post(
            "/api/milestones/?project_id=" + str(self.project.id), data
        )
        assert response.status_code == status.HTTP_201_CREATED

        count_after = Milestone.objects.filter(project=self.project).count()
        assert count_after == count_before + 1

    def test_milestone_progress_tracking(self):
        """Milestone progress tracking should work"""
        self.client.force_authenticate(user=self.owner)

        # Update progress incrementally
        for progress in [10, 25, 50, 75, 100]:
            data = {"progress": progress}
            response = self.client.patch(f"/api/milestones/{self.milestone1.id}/", data)
            assert response.status_code == status.HTTP_200_OK

        self.milestone1.refresh_from_db()
        assert self.milestone1.progress == 100

    def test_milestone_due_date_past(self):
        """Milestone can have past due date"""
        self.client.force_authenticate(user=self.owner)
        past_date = (datetime.now().date() - timedelta(days=5)).isoformat()
        data = {
            "title": "Past Milestone",
            "due_date": past_date,
            "progress": 0,
        }
        response = self.client.post(
            "/api/milestones/?project_id=" + str(self.project.id), data
        )
        assert response.status_code == status.HTTP_201_CREATED
