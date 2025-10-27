"""
Comprehensive tests for permissions and authorization
Tests role-based access control and security boundaries
Covers Pfizer compliance requirements for access control
"""

from datetime import datetime, timedelta

import pytest
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from projects.models import Activity, Project, Role, Tag, TeamMember


@pytest.mark.django_db
class PermissionTests(TestCase):
    """Test permission and authorization controls"""

    def setUp(self):
        """Set up users with different roles and permissions"""
        self.client = APIClient()

        # Create users
        self.owner = User.objects.create_user(
            username="owner", email="owner@test.com", password="testpass123"
        )
        self.project_lead = User.objects.create_user(
            username="project_lead", email="lead@test.com", password="testpass123"
        )
        self.manager = User.objects.create_user(
            username="manager", email="manager@test.com", password="testpass123"
        )
        self.developer = User.objects.create_user(
            username="developer", email="dev@test.com", password="testpass123"
        )
        self.qa_engineer = User.objects.create_user(
            username="qa", email="qa@test.com", password="testpass123"
        )
        self.stakeholder = User.objects.create_user(
            username="stakeholder", email="stakeholder@test.com", password="testpass123"
        )
        self.unrelated_user = User.objects.create_user(
            username="unrelated", email="unrelated@test.com", password="testpass123"
        )
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="testpass123"
        )

        # Create roles with specific permissions
        self.role_lead = Role.objects.create(
            key="lead", display_name="Project Lead", color="red"
        )
        self.role_manager = Role.objects.create(
            key="manager", display_name="Manager", color="orange"
        )
        self.role_developer = Role.objects.create(
            key="developer", display_name="Developer", color="blue"
        )
        self.role_qa = Role.objects.create(
            key="qa", display_name="QA Engineer", color="green"
        )
        self.role_stakeholder = Role.objects.create(
            key="stakeholder", display_name="Stakeholder", color="pink"
        )

        # Create test project
        self.project = Project.objects.create(
            title="Test Project",
            description="Test Description",
            owner=self.owner,
            status="active",
            health="healthy",
            progress=50,
        )

        # Assign team members with different roles
        TeamMember.objects.create(
            project=self.project,
            user=self.project_lead,
            role=self.role_lead,
            capacity=80,
        )
        TeamMember.objects.create(
            project=self.project, user=self.manager, role=self.role_manager, capacity=70
        )
        TeamMember.objects.create(
            project=self.project,
            user=self.developer,
            role=self.role_developer,
            capacity=100,
        )
        TeamMember.objects.create(
            project=self.project, user=self.qa_engineer, role=self.role_qa, capacity=90
        )
        TeamMember.objects.create(
            project=self.project,
            user=self.stakeholder,
            role=self.role_stakeholder,
            capacity=40,
        )

    # ============ PROJECT VIEW PERMISSIONS ============

    def test_owner_can_view_project(self):
        """Project owner can view their project"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/projects/{self.project.id}/")
        assert response.status_code == status.HTTP_200_OK

    def test_team_member_can_view_project(self):
        """Team members can view projects they're on"""
        for user in [
            self.project_lead,
            self.developer,
            self.qa_engineer,
            self.stakeholder,
        ]:
            self.client.force_authenticate(user=user)
            response = self.client.get(f"/api/projects/{self.project.id}/")
            assert (
                response.status_code == status.HTTP_200_OK
            ), f"{user.username} should view project"

    def test_unrelated_user_cannot_view_project(self):
        """Unrelated user cannot view project"""
        self.client.force_authenticate(user=self.unrelated_user)
        response = self.client.get(f"/api/projects/{self.project.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_can_view_any_project(self):
        """Admin can view any project"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"/api/projects/{self.project.id}/")
        assert response.status_code == status.HTTP_200_OK

    # ============ PROJECT EDIT PERMISSIONS ============

    def test_owner_can_edit_project(self):
        """Project owner can edit their project"""
        self.client.force_authenticate(user=self.owner)
        data = {"title": "Owner Updated"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_200_OK

    def test_project_lead_can_edit(self):
        """Project lead can edit project"""
        self.client.force_authenticate(user=self.project_lead)
        data = {"title": "Lead Updated"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_200_OK

    def test_manager_can_edit(self):
        """Manager can edit project"""
        self.client.force_authenticate(user=self.manager)
        data = {"title": "Manager Updated"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_200_OK

    def test_developer_cannot_edit_project(self):
        """Developer cannot edit project"""
        self.client.force_authenticate(user=self.developer)
        data = {"title": "Developer Updated"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_qa_cannot_edit_project(self):
        """QA engineer cannot edit project"""
        self.client.force_authenticate(user=self.qa_engineer)
        data = {"title": "QA Updated"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_stakeholder_cannot_edit_project(self):
        """Stakeholder (read-only) cannot edit project"""
        self.client.force_authenticate(user=self.stakeholder)
        data = {"title": "Stakeholder Updated"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unrelated_user_cannot_edit_project(self):
        """Unrelated user cannot edit project"""
        self.client.force_authenticate(user=self.unrelated_user)
        data = {"title": "Unrelated Updated"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_edit_any_project(self):
        """Admin can edit any project"""
        self.client.force_authenticate(user=self.admin)
        data = {"title": "Admin Updated"}
        response = self.client.patch(f"/api/projects/{self.project.id}/", data)
        assert response.status_code == status.HTTP_200_OK

    # ============ PROJECT DELETE PERMISSIONS ============

    def test_owner_can_delete_project(self):
        """Project owner can delete their project"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        assert response.status_code == status.HTTP_200_OK

    def test_project_lead_cannot_delete_project(self):
        """Project lead cannot delete project"""
        self.client.force_authenticate(user=self.project_lead)
        response = self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_developer_cannot_delete_project(self):
        """Developer cannot delete project"""
        self.client.force_authenticate(user=self.developer)
        response = self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_delete_any_project(self):
        """Admin can delete any project"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        assert response.status_code == status.HTTP_200_OK

    def test_unrelated_user_cannot_delete_project(self):
        """Unrelated user cannot delete project"""
        self.client.force_authenticate(user=self.unrelated_user)
        response = self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    # ============ PROJECT RESTORE PERMISSIONS ============

    def test_owner_can_restore_deleted_project(self):
        """Owner can restore their deleted project"""
        self.client.force_authenticate(user=self.owner)
        # Delete first
        self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        # Restore
        response = self.client.post(f"/api/projects/{self.project.id}/restore/")
        assert response.status_code == status.HTTP_200_OK

    def test_team_member_cannot_restore_project(self):
        """Team member cannot restore project"""
        self.client.force_authenticate(user=self.owner)
        self.client.post(f"/api/projects/{self.project.id}/soft_delete/")

        self.client.force_authenticate(user=self.project_lead)
        response = self.client.post(f"/api/projects/{self.project.id}/restore/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_restore_any_project(self):
        """Admin can restore any project"""
        self.client.force_authenticate(user=self.owner)
        self.client.post(f"/api/projects/{self.project.id}/soft_delete/")

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/projects/{self.project.id}/restore/")
        assert response.status_code == status.HTTP_200_OK

    # ============ TEAM MEMBER MANAGEMENT PERMISSIONS ============

    def test_owner_can_add_team_member(self):
        """Only owner can add team members"""
        new_user = User.objects.create_user(
            username="newmember", email="new@test.com", password="testpass123"
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

    def test_project_lead_cannot_add_team_member(self):
        """Project lead cannot add team members"""
        new_user = User.objects.create_user(
            username="newmember2", email="new2@test.com", password="testpass123"
        )
        self.client.force_authenticate(user=self.project_lead)
        data = {
            "user_id": new_user.id,
            "role_id": self.role_developer.id,
            "capacity": 100,
        }
        response = self.client.post(
            f"/api/projects/{self.project.id}/add_team_member/", data
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_developer_cannot_add_team_member(self):
        """Developer cannot add team members"""
        new_user = User.objects.create_user(
            username="newmember3", email="new3@test.com", password="testpass123"
        )
        self.client.force_authenticate(user=self.developer)
        data = {
            "user_id": new_user.id,
            "role_id": self.role_developer.id,
            "capacity": 100,
        }
        response = self.client.post(
            f"/api/projects/{self.project.id}/add_team_member/", data
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_owner_can_remove_team_member(self):
        """Only owner can remove team members"""
        self.client.force_authenticate(user=self.owner)
        data = {"user_id": self.developer.id}
        response = self.client.delete(
            f"/api/projects/{self.project.id}/remove_team_member/", data
        )
        assert response.status_code == status.HTTP_200_OK

    def test_team_member_cannot_remove_team_member(self):
        """Team member cannot remove team members"""
        self.client.force_authenticate(user=self.project_lead)
        data = {"user_id": self.developer.id}
        response = self.client.delete(
            f"/api/projects/{self.project.id}/remove_team_member/", data
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_owner_can_update_team_member(self):
        """Only owner can update team member role"""
        self.client.force_authenticate(user=self.owner)
        data = {
            "user_id": self.developer.id,
            "role_id": self.role_lead.id,
            "capacity": 75,
        }
        response = self.client.patch(
            f"/api/projects/{self.project.id}/update_team_member/", data
        )
        assert response.status_code == status.HTTP_200_OK

    def test_team_member_cannot_update_team_member(self):
        """Team member cannot update team member role"""
        self.client.force_authenticate(user=self.project_lead)
        data = {
            "user_id": self.developer.id,
            "role_id": self.role_lead.id,
            "capacity": 75,
        }
        response = self.client.patch(
            f"/api/projects/{self.project.id}/update_team_member/", data
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    # ============ MILESTONE PERMISSIONS ============

    def test_owner_can_create_milestone(self):
        """Owner can create milestone"""
        self.client.force_authenticate(user=self.owner)
        data = {
            "title": "Owner Milestone",
            "progress": 0,
            "project_id": self.project.id,
        }
        response = self.client.post(
            f"/api/milestones/?project_id={self.project.id}", data
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_team_member_can_create_milestone(self):
        """Team members can create milestone"""
        for user in [self.project_lead, self.developer]:
            self.client.force_authenticate(user=user)
            data = {
                "title": f"{user.username} Milestone",
                "progress": 0,
                "project_id": self.project.id,
            }
            response = self.client.post(
                f"/api/milestones/?project_id={self.project.id}", data
            )
            assert (
                response.status_code == status.HTTP_201_CREATED
            ), f"{user.username} should create milestone"

    def test_unrelated_user_cannot_create_milestone(self):
        """Unrelated user cannot create milestone"""
        self.client.force_authenticate(user=self.unrelated_user)
        data = {
            "title": "Unauthorized Milestone",
            "progress": 0,
            "project_id": self.project.id,
        }
        response = self.client.post(
            f"/api/milestones/?project_id={self.project.id}", data
        )
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_400_BAD_REQUEST,
        ]

    # ============ ADMIN OVERRIDE TESTS ============

    def test_admin_bypasses_all_restrictions(self):
        """Admin can perform any action"""
        self.client.force_authenticate(user=self.admin)

        # Create
        response = self.client.post(
            "/api/projects/", {"title": "Admin Project", "status": "active"}
        )
        assert response.status_code == status.HTTP_201_CREATED

        # View
        response = self.client.get(f"/api/projects/{self.project.id}/")
        assert response.status_code == status.HTTP_200_OK

        # Edit
        response = self.client.patch(
            f"/api/projects/{self.project.id}/", {"title": "Admin Edit"}
        )
        assert response.status_code == status.HTTP_200_OK

        # Delete
        response = self.client.post(f"/api/projects/{self.project.id}/soft_delete/")
        assert response.status_code == status.HTTP_200_OK

    # ============ BULK OPERATION PERMISSIONS ============

    def test_owner_can_bulk_update(self):
        """Owner can bulk update their projects"""
        # Create another project
        project2 = Project.objects.create(
            title="Project 2", owner=self.owner, status="active"
        )

        self.client.force_authenticate(user=self.owner)
        data = {
            "project_ids": [self.project.id, project2.id],
            "status": "completed",
            "etag": self.project.etag,
        }
        response = self.client.post("/api/projects/bulk_update/", data)
        assert response.status_code == status.HTTP_200_OK

    def test_user_cannot_bulk_update_others_projects(self):
        """User cannot bulk update projects they don't own"""
        self.client.force_authenticate(user=self.project_lead)
        data = {
            "project_ids": [self.project.id],
            "status": "completed",
            "etag": self.project.etag,
        }
        response = self.client.post("/api/projects/bulk_update/", data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    # ============ EMPTY TRASH PERMISSIONS ============

    def test_admin_can_empty_trash(self):
        """Only admin can empty trash"""
        self.client.force_authenticate(user=self.owner)
        self.client.post(f"/api/projects/{self.project.id}/soft_delete/")

        self.client.force_authenticate(user=self.admin)
        response = self.client.post("/api/projects/empty_trash/")
        assert response.status_code == status.HTTP_200_OK

    def test_non_admin_cannot_empty_trash(self):
        """Non-admin cannot empty trash"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.post("/api/projects/empty_trash/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    # ============ CROSS-PROJECT ACCESS TESTS ============

    def test_user_cannot_access_other_projects(self):
        """User cannot access projects they're not part of"""
        other_owner = User.objects.create_user(
            username="other_owner", email="other_owner@test.com", password="testpass123"
        )
        other_project = Project.objects.create(
            title="Other Project", owner=other_owner, status="active"
        )

        self.client.force_authenticate(user=self.unrelated_user)
        response = self.client.get(f"/api/projects/{other_project.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_list_only_shows_accessible_projects(self):
        """User's project list only shows projects they can access"""
        self.client.force_authenticate(user=self.developer)
        response = self.client.get("/api/projects/")
        assert response.status_code == status.HTTP_200_OK
        project_ids = [p["id"] for p in response.data["results"]]
        assert self.project.id in project_ids

    def test_admin_sees_all_projects(self):
        """Admin's list shows all projects regardless of ownership"""
        # Create unrelated project
        other_owner = User.objects.create_user(
            username="other", email="other@test.com", password="testpass123"
        )
        Project.objects.create(
            title="Hidden Project", owner=other_owner, status="active"
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/projects/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 2
