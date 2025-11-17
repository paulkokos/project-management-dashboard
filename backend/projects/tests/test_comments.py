"""
Comprehensive tests for comment models, serializers, and API endpoints.
Tests comment CRUD operations, permissions, and activity tracking.
"""

import pytest
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from projects.models import Comment, Project, Role, TeamMember


@pytest.mark.django_db
class CommentModelTests(TestCase):
    """Test Comment model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@test.com", password="testpass123"
        )
        self.project = Project.objects.create(
            title="Test Project",
            owner=self.user,
            description="Test project for comments",
        )

    def test_create_comment(self):
        """Test creating a new comment"""
        comment = Comment.objects.create(
            content="This is a test comment", author=self.user, project=self.project
        )
        assert comment.id is not None
        assert comment.content == "This is a test comment"
        assert comment.author == self.user
        assert comment.project == self.project
        assert comment.parent_comment is None
        assert comment.deleted_at is None

    def test_comment_string_representation(self):
        """Test comment __str__ method"""
        comment = Comment.objects.create(
            content="A" * 60, author=self.user, project=self.project
        )
        assert "testuser" in str(comment)
        assert "..." in str(comment)

    def test_comment_soft_delete(self):
        """Test soft delete functionality"""
        comment = Comment.objects.create(
            content="Test comment", author=self.user, project=self.project
        )
        comment.soft_delete()

        assert comment.deleted_at is not None
        assert Comment.objects.filter(id=comment.id).count() == 0
        assert Comment.all_objects.filter(id=comment.id).count() == 1

    def test_comment_restore(self):
        """Test restoring a soft-deleted comment"""
        comment = Comment.objects.create(
            content="Test comment", author=self.user, project=self.project
        )
        comment.soft_delete()
        assert comment.deleted_at is not None

        comment.restore()
        assert comment.deleted_at is None
        assert Comment.objects.filter(id=comment.id).count() == 1

    def test_mark_edited(self):
        """Test marking comment as edited"""
        comment = Comment.objects.create(
            content="Original content", author=self.user, project=self.project
        )
        assert comment.edit_count == 0
        assert not comment.is_edited

        comment.mark_edited()
        assert comment.edit_count == 1
        assert comment.is_edited

        comment.mark_edited()
        assert comment.edit_count == 2

    def test_reply_count(self):
        """Test reply count calculation"""
        parent_comment = Comment.objects.create(
            content="Parent comment", author=self.user, project=self.project
        )
        assert parent_comment.reply_count == 0

        # Create replies
        for i in range(3):
            Comment.objects.create(
                content=f"Reply {i}",
                author=self.user,
                project=self.project,
                parent_comment=parent_comment,
            )
        assert parent_comment.reply_count == 3

        # Soft delete a reply - should not count
        reply = parent_comment.replies.first()
        reply.soft_delete()
        assert parent_comment.reply_count == 2

    def test_nested_replies(self):
        """Test getting nested replies"""
        parent = Comment.objects.create(
            content="Parent", author=self.user, project=self.project
        )

        replies = [
            Comment.objects.create(
                content=f"Reply {i}",
                author=self.user,
                project=self.project,
                parent_comment=parent,
            )
            for i in range(3)
        ]

        nested_replies = parent.get_nested_replies()
        assert nested_replies.count() == 3
        assert list(nested_replies) == list(
            sorted(replies, key=lambda r: r.created_at, reverse=True)
        )


@pytest.mark.django_db
class CommentAPITests(TestCase):
    """Test Comment API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username="owner", email="owner@test.com", password="testpass123"
        )
        self.member = User.objects.create_user(
            username="member", email="member@test.com", password="testpass123"
        )
        self.unrelated = User.objects.create_user(
            username="unrelated", email="unrelated@test.com", password="testpass123"
        )

        self.project = Project.objects.create(
            title="Test Project", owner=self.owner, description="Test project"
        )

        # Add member to project
        role, _ = Role.objects.get_or_create(
            key="developer", defaults={"display_name": "Developer", "color": "blue"}
        )
        TeamMember.objects.create(
            project=self.project, user=self.member, role=role, capacity=100
        )

    def test_list_comments_unauthenticated(self):
        """Test listing comments requires authentication"""
        response = self.client.get(f"/api/comments/?project_id={self.project.id}")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_comments_unauthorized(self):
        """Test unrelated user cannot view project comments"""
        self.client.force_authenticate(user=self.unrelated)
        response = self.client.get(f"/api/comments/?project_id={self.project.id}")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_comments_authorized(self):
        """Test project owner can list comments"""
        comment = Comment.objects.create(
            content="Test comment", author=self.owner, project=self.project
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/comments/?project_id={self.project.id}")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["id"] == comment.id
        assert response.data[0]["content"] == "Test comment"

    def test_create_comment(self):
        """Test creating a comment"""
        self.client.force_authenticate(user=self.owner)
        data = {"content": "New comment", "project_id": self.project.id}
        response = self.client.post("/api/comments/", data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["content"] == "New comment"
        assert response.data["author"]["username"] == "owner"

    def test_create_reply(self):
        """Test creating a reply to a comment"""
        parent = Comment.objects.create(
            content="Parent comment", author=self.owner, project=self.project
        )

        self.client.force_authenticate(user=self.member)
        data = {
            "content": "This is a reply",
            "parent_comment": parent.id,
            "project_id": self.project.id,
        }
        response = self.client.post("/api/comments/", data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["parent_comment"] == parent.id

    def test_create_comment_empty_content(self):
        """Test creating comment with empty content fails"""
        self.client.force_authenticate(user=self.owner)
        data = {"content": "", "project_id": self.project.id}
        response = self.client.post("/api/comments/", data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_comment_exceeds_max_length(self):
        """Test creating comment exceeding max length fails"""
        self.client.force_authenticate(user=self.owner)
        data = {"content": "a" * 5001, "project_id": self.project.id}
        response = self.client.post("/api/comments/", data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_retrieve_comment(self):
        """Test retrieving a single comment with replies"""
        parent = Comment.objects.create(
            content="Parent comment", author=self.owner, project=self.project
        )

        for i in range(2):
            Comment.objects.create(
                content=f"Reply {i}",
                author=self.member,
                project=self.project,
                parent_comment=parent,
            )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/comments/{parent.id}/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == parent.id
        assert response.data["reply_count"] == 2
        assert len(response.data["replies"]) == 2

    def test_update_comment_author(self):
        """Test author can update their comment"""
        comment = Comment.objects.create(
            content="Original content", author=self.owner, project=self.project
        )

        self.client.force_authenticate(user=self.owner)
        data = {"content": "Updated content"}
        response = self.client.patch(f"/api/comments/{comment.id}/", data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["content"] == "Updated content"

        comment.refresh_from_db()
        assert comment.edit_count == 1

    def test_update_comment_non_author(self):
        """Test non-author cannot update comment"""
        comment = Comment.objects.create(
            content="Original content", author=self.owner, project=self.project
        )

        self.client.force_authenticate(user=self.member)
        data = {"content": "Hacked content"}
        response = self.client.patch(f"/api/comments/{comment.id}/", data)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_comment_author(self):
        """Test author can delete their comment"""
        comment = Comment.objects.create(
            content="To be deleted", author=self.owner, project=self.project
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f"/api/comments/{comment.id}/")

        assert response.status_code == status.HTTP_204_NO_CONTENT

        comment.refresh_from_db()
        assert comment.deleted_at is not None

    def test_delete_comment_non_author(self):
        """Test non-author cannot delete comment"""
        comment = Comment.objects.create(
            content="Protected content", author=self.owner, project=self.project
        )

        self.client.force_authenticate(user=self.member)
        response = self.client.delete(f"/api/comments/{comment.id}/")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_reply_to_deleted_comment_fails(self):
        """Test cannot reply to deleted comment"""
        parent = Comment.objects.create(
            content="Parent comment", author=self.owner, project=self.project
        )
        parent.soft_delete()

        self.client.force_authenticate(user=self.member)
        data = {
            "content": "Reply attempt",
            "parent_comment": parent.id,
            "project_id": self.project.id,
        }
        response = self.client.post("/api/comments/", data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_filter_comments_by_project(self):
        """Test filtering comments by project"""
        other_project = Project.objects.create(title="Other Project", owner=self.owner)

        comment1 = Comment.objects.create(
            content="Comment in project 1", author=self.owner, project=self.project
        )

        comment2 = Comment.objects.create(  # noqa: F841
            content="Comment in project 2", author=self.owner, project=other_project
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/comments/?project_id={self.project.id}")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["id"] == comment1.id
