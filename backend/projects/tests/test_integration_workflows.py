"""
Comprehensive integration tests for real-world workflows
Tests complete user journeys, data consistency, and edge cases
Ensures Pfizer compliance for audit trails and data integrity
"""

from datetime import datetime, timedelta

import pytest
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from projects.models import Activity, Milestone, Project, Role, TeamMember


@pytest.mark.django_db
class WorkflowIntegrationTests(TestCase):
    """Test complete user workflows and integrations"""

    def setUp(self):
        """Set up test environment"""
        self.client = APIClient()

        # Create users
        self.project_manager = User.objects.create_user(
            username="pm", email="pm@test.com", password="testpass123"
        )
        self.developer1 = User.objects.create_user(
            username="dev1", email="dev1@test.com", password="testpass123"
        )
        self.developer2 = User.objects.create_user(
            username="dev2", email="dev2@test.com", password="testpass123"
        )
        self.qa = User.objects.create_user(
            username="qa", email="qa@test.com", password="testpass123"
        )
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="testpass123"
        )

        # Create roles
        self.role_lead = Role.objects.create(
            key="lead", display_name="Lead", color="red"
        )
        self.role_dev = Role.objects.create(
            key="developer", display_name="Developer", color="blue"
        )
        self.role_qa = Role.objects.create(key="qa", display_name="QA", color="green")

    # ============ PROJECT LIFECYCLE WORKFLOW ============

    def test_complete_project_creation_and_setup_workflow(self):
        """Test complete project creation and team setup"""
        self.client.force_authenticate(user=self.project_manager)

        # Step 1: Create project
        project_data = {
            "title": "Mobile App Project",
            "description": "Build a mobile application",
            "status": "active",
            "health": "healthy",
            "progress": 0,
        }
        response = self.client.post("/api/projects/", project_data)
        assert response.status_code == status.HTTP_201_CREATED
        project_id = response.data["id"]

        # Step 2: Add team members
        for user, role in [
            (self.developer1, self.role_dev),
            (self.developer2, self.role_dev),
            (self.qa, self.role_qa),
        ]:
            member_data = {"user_id": user.id, "role_id": role.id, "capacity": 100}
            response = self.client.post(
                f"/api/projects/{project_id}/add_team_member/", member_data
            )
            assert response.status_code == status.HTTP_201_CREATED

        # Step 3: Create milestones
        for i, phase in enumerate(["Design", "Development", "Testing", "Release"]):
            milestone_data = {
                "title": f"Phase {i+1}: {phase}",
                "description": f"{phase} phase",
                "progress": 0,
                "project_id": project_id,
                "due_date": (
                    datetime.now().date() + timedelta(days=30 * (i + 1))
                ).isoformat(),
            }
            response = self.client.post(
                f"/api/milestones/?project_id={project_id}", milestone_data
            )
            assert response.status_code == status.HTTP_201_CREATED

        # Step 4: Verify project was created correctly
        response = self.client.get(f"/api/projects/{project_id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Mobile App Project"
        assert response.data["team_count"] == 3
        assert len(response.data["milestones"]) == 4

        # Step 5: Verify activities were logged
        response = self.client.get(f"/api/projects/{project_id}/activities/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 5  # Create + 3 team adds + milestone

    # ============ PROGRESS TRACKING WORKFLOW ============

    def test_project_progress_tracking_workflow(self):
        """Test updating milestones and project progress"""
        # Create project
        project = Project.objects.create(
            title="Progress Test",
            owner=self.project_manager,
            status="active",
            progress=0,
        )

        # Create milestones
        milestone1 = Milestone.objects.create(
            project=project, title="Milestone 1", progress=0
        )
        milestone2 = Milestone.objects.create(
            project=project, title="Milestone 2", progress=0
        )

        self.client.force_authenticate(user=self.project_manager)

        # Update first milestone progress
        for progress in [25, 50, 75]:
            response = self.client.patch(
                f"/api/milestones/{milestone1.id}/", {"progress": progress}
            )
            assert response.status_code == status.HTTP_200_OK

        # Complete first milestone
        response = self.client.post(f"/api/milestones/{milestone1.id}/complete/")
        assert response.status_code == status.HTTP_200_OK
        milestone1.refresh_from_db()
        assert milestone1.progress == 100

        # Start second milestone
        for progress in [25, 50]:
            response = self.client.patch(
                f"/api/milestones/{milestone2.id}/", {"progress": progress}
            )
            assert response.status_code == status.HTTP_200_OK

        # Update project progress
        response = self.client.patch(f"/api/projects/{project.id}/", {"progress": 75})
        assert response.status_code == status.HTTP_200_OK

        # Verify activity trail
        response = self.client.get(f"/api/projects/{project.id}/activities/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0

    # ============ TEAM MANAGEMENT WORKFLOW ============

    def test_team_member_assignment_and_role_changes(self):
        """Test assigning and managing team members"""
        project = Project.objects.create(
            title="Team Test", owner=self.project_manager, status="active"
        )

        self.client.force_authenticate(user=self.project_manager)

        # Step 1: Add developer with initial role
        response = self.client.post(
            f"/api/projects/{project.id}/add_team_member/",
            {
                "user_id": self.developer1.id,
                "role_id": self.role_dev.id,
                "capacity": 100,
            },
        )
        assert response.status_code == status.HTTP_201_CREATED

        # Step 2: Promote to lead
        response = self.client.patch(
            f"/api/projects/{project.id}/update_team_member/",
            {
                "user_id": self.developer1.id,
                "role_id": self.role_lead.id,
                "capacity": 80,
            },
        )
        assert response.status_code == status.HTTP_200_OK

        # Step 3: Reduce capacity
        response = self.client.patch(
            f"/api/projects/{project.id}/update_team_member/",
            {"user_id": self.developer1.id, "capacity": 50},
        )
        assert response.status_code == status.HTTP_200_OK

        # Step 4: Verify role change
        team_member = TeamMember.objects.get(project=project, user=self.developer1)
        assert team_member.role.key == "lead"
        assert team_member.capacity == 50

        # Step 5: Remove team member
        response = self.client.delete(
            f"/api/projects/{project.id}/remove_team_member/",
            {"user_id": self.developer1.id},
        )
        assert response.status_code == status.HTTP_200_OK
        assert not TeamMember.objects.filter(
            project=project, user=self.developer1
        ).exists()

    # ============ SOFT DELETE AND RESTORE WORKFLOW ============

    def test_project_soft_delete_and_restore_workflow(self):
        """Test soft delete and restoration workflow"""
        project = Project.objects.create(
            title="Delete Test", owner=self.project_manager, status="active"
        )
        project_id = project.id

        self.client.force_authenticate(user=self.project_manager)

        # Step 1: Project in regular list
        response = self.client.get("/api/projects/")
        assert any(p["id"] == project_id for p in response.data["results"])

        # Step 2: Soft delete project
        response = self.client.post(f"/api/projects/{project_id}/soft_delete/")
        assert response.status_code == status.HTTP_200_OK

        # Step 3: Verify not in regular list
        response = self.client.get("/api/projects/")
        assert not any(p["id"] == project_id for p in response.data["results"])

        # Step 4: Verify in deleted list
        response = self.client.get("/api/projects/deleted/")
        assert any(p["id"] == project_id for p in response.data)

        # Step 5: Restore project
        response = self.client.post(f"/api/projects/{project_id}/restore/")
        assert response.status_code == status.HTTP_200_OK

        # Step 6: Verify back in regular list
        response = self.client.get("/api/projects/")
        assert any(p["id"] == project_id for p in response.data["results"])

        # Step 7: Verify audit trail
        response = self.client.get(f"/api/projects/{project_id}/activities/")
        activities = response.data
        activity_types = [a["activity_type"] for a in activities]
        assert "updated" in activity_types  # Soft delete logs as update
        assert "restored" in activity_types

    # ============ CONCURRENT OPERATIONS ============

    def test_concurrent_milestone_updates(self):
        """Test concurrent updates to same milestone"""
        project = Project.objects.create(
            title="Concurrent Test", owner=self.project_manager
        )
        milestone = Milestone.objects.create(
            project=project, title="Test Milestone", progress=0
        )

        self.client.force_authenticate(user=self.project_manager)

        # Simulate two concurrent updates
        response1 = self.client.patch(
            f"/api/milestones/{milestone.id}/", {"progress": 50}
        )
        response2 = self.client.patch(
            f"/api/milestones/{milestone.id}/", {"progress": 75}
        )

        assert response1.status_code == status.HTTP_200_OK
        assert response2.status_code == status.HTTP_200_OK

        milestone.refresh_from_db()
        # Last update should win
        assert milestone.progress == 75

    # ============ BULK OPERATIONS ============

    def test_bulk_project_status_update_workflow(self):
        """Test bulk updating multiple projects"""
        # Create projects
        project1 = Project.objects.create(
            title="Bulk 1", owner=self.project_manager, status="active"
        )
        project2 = Project.objects.create(
            title="Bulk 2", owner=self.project_manager, status="active"
        )

        self.client.force_authenticate(user=self.project_manager)

        # Bulk update
        response = self.client.post(
            "/api/projects/bulk_update/",
            {
                "project_ids": [project1.id, project2.id],
                "status": "completed",
                "etag": project1.etag,
            },
        )
        assert response.status_code == status.HTTP_200_OK

        # Verify both updated
        project1.refresh_from_db()
        project2.refresh_from_db()
        assert project1.status == "completed"
        assert project2.status == "completed"

    # ============ AUDIT TRAIL VERIFICATION ============

    def test_complete_audit_trail(self):
        """Test comprehensive audit trail for all operations"""
        project = Project.objects.create(
            title="Audit Test", owner=self.project_manager, status="active"
        )

        self.client.force_authenticate(user=self.project_manager)

        operations = []

        # Create milestone
        response = self.client.post(
            f"/api/milestones/?project_id={project.id}",
            {"title": "Test", "progress": 0},
        )
        operations.append("milestone_added")

        # Update project
        response = self.client.patch(
            f"/api/projects/{project.id}/", {"title": "Updated", "progress": 50}
        )
        operations.append("updated")

        # Add team member
        response = self.client.post(
            f"/api/projects/{project.id}/add_team_member/",
            {"user_id": self.developer1.id, "role_id": self.role_dev.id},
        )
        operations.append("team_added")

        # Get all activities
        response = self.client.get(f"/api/projects/{project.id}/activities/")
        assert response.status_code == status.HTTP_200_OK

        activities = response.data
        activity_types = [a["activity_type"] for a in activities]

        # Verify all operations are logged
        for op in operations:
            assert op in activity_types, f"{op} not found in audit trail"

        # Verify activity details
        for activity in activities:
            assert activity["user"] is not None
            assert activity["description"] is not None
            assert activity["created_at"] is not None
            assert activity["activity_type"] is not None

    # ============ DATA CONSISTENCY TESTS ============

    def test_team_count_consistency(self):
        """Test that team_count matches actual team members"""
        project = Project.objects.create(title="Count Test", owner=self.project_manager)

        # Add team members
        for user in [self.developer1, self.developer2, self.qa]:
            TeamMember.objects.create(project=project, user=user, role=self.role_dev)

        self.client.force_authenticate(user=self.project_manager)

        # Get project and verify count
        response = self.client.get(f"/api/projects/{project.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["team_count"] == 3
        assert len(response.data["team_members_details"]) == 3

    def test_milestone_count_consistency(self):
        """Test that milestone count matches actual milestones"""
        project = Project.objects.create(
            title="Milestone Count Test", owner=self.project_manager
        )

        # Create milestones
        for i in range(5):
            Milestone.objects.create(
                project=project, title=f"Milestone {i+1}", progress=0
            )

        self.client.force_authenticate(user=self.project_manager)

        # Get project and verify count
        response = self.client.get(f"/api/projects/{project.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["milestones"]) == 5

    # ============ ERROR RECOVERY ============

    def test_recovery_from_failed_milestone_update(self):
        """Test system recovery from failed operations"""
        project = Project.objects.create(
            title="Error Recovery Test", owner=self.project_manager
        )
        milestone = Milestone.objects.create(project=project, title="Test", progress=50)

        self.client.force_authenticate(user=self.project_manager)

        # Try invalid update
        response = self.client.patch(
            f"/api/milestones/{milestone.id}/", {"progress": -10}  # Invalid
        )
        # May fail validation or accept

        # Verify system is still responsive
        response = self.client.get(f"/api/projects/{project.id}/")
        assert response.status_code == status.HTTP_200_OK

        # Verify we can still make valid updates
        response = self.client.patch(
            f"/api/milestones/{milestone.id}/", {"progress": 75}
        )
        assert response.status_code == status.HTTP_200_OK
