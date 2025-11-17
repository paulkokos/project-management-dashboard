#!/usr/bin/env python
"""Debug test script to check API responses"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from projects.models import Project, Role, TeamMember, Comment

# Create test users
owner = User.objects.create_user(username='owner_debug', password='pass', email='owner@test.com')
member = User.objects.create_user(username='member_debug', password='pass', email='member@test.com')
unrelated = User.objects.create_user(username='unrelated_debug', password='pass', email='unrelated@test.com')

# Create test data
project = Project.objects.create(
    title="Test Project", owner=owner, description="Test project"
)

role, _ = Role.objects.get_or_create(
    key="developer", defaults={"display_name": "Developer", "color": "blue"}
)
TeamMember.objects.create(
    project=project, user=member, role=role, capacity=100
)

# Create comment
comment = Comment.objects.create(
    content="Test comment", author=owner, project=project
)

# Test with unrelated user
client = APIClient()
client.force_authenticate(user=unrelated)
response = client.get(f"/api/comments/?project_id={project.id}")
print(f"Unrelated user GET /api/comments/ - Status: {response.status_code}")
print(f"Response data: {response.data if hasattr(response, 'data') else response.content}")

# Test with authenticated owner
client.force_authenticate(user=owner)
response = client.get(f"/api/comments/?project_id={project.id}")
print(f"\nOwner GET /api/comments/ - Status: {response.status_code}")
print(f"Response data: {response.data if hasattr(response, 'data') else response.content}")
