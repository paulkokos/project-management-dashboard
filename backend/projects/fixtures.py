"""
Fixtures for project management models
"""

import random
from datetime import datetime, timedelta

from django.contrib.auth.models import User

from .models import Activity, Milestone, Project, Role, Tag, TeamMember


def create_admin_user():
    """Create admin superuser"""
    admin, created = User.objects.get_or_create(
        username="admin",
        defaults={
            "email": "admin@example.com",
            "is_staff": True,
            "is_superuser": True,
        },
    )
    if created or not admin.has_usable_password():
        admin.set_password("admin123")
        admin.save()
    return admin


def create_test_users():
    """Create test users"""
    users = []
    for i in range(10):
        user, created = User.objects.get_or_create(
            username=f"user{i}",
            defaults={
                "email": f"user{i}@paulkokos.yahoo.gr",
                "first_name": f"User {i}",
                "last_name": "Test",
            },
        )
        if created or not user.has_usable_password():
            user.set_password("testpass123")
            user.save()
        users.append(user)
    return users


def create_test_tags():
    """Create test tags"""
    tags_data = [
        {"name": "backend", "color": "#3B82F6", "description": "Backend development"},
        {"name": "frontend", "color": "#10B981", "description": "Frontend development"},
        {
            "name": "devops",
            "color": "#F59E0B",
            "description": "DevOps and infrastructure",
        },
        {
            "name": "documentation",
            "color": "#8B5CF6",
            "description": "Documentation tasks",
        },
        {"name": "bug-fix", "color": "#EF4444", "description": "Bug fixes"},
        {"name": "feature", "color": "#06B6D4", "description": "New features"},
    ]

    tags = []
    for tag_data in tags_data:
        tag, created = Tag.objects.get_or_create(
            name=tag_data["name"],
            defaults={
                "color": tag_data["color"],
                "description": tag_data["description"],
            },
        )
        tags.append(tag)
    return tags


def create_test_projects(users, tags):
    """Create test projects with diverse data for testing"""
    projects_data = [
        {
            "title": "Vaccine Development Platform",
            "description": "Build a comprehensive platform for vaccine research and development tracking across clinical trials",
            "owner_index": 0,
            "status": "active",
            "health": "healthy",
            "progress": 65,
            "tags": [tags[0], tags[1]],  # backend, frontend
            "start_offset": 30,  # days ago
            "end_offset": 90,  # days in future
        },
        {
            "title": "Patient Portal Enhancement",
            "description": "Modernize patient-facing portal with improved UX, appointment scheduling, and prescription management",
            "owner_index": 1,
            "status": "active",
            "health": "at_risk",
            "progress": 40,
            "tags": [tags[1], tags[3]],  # frontend, documentation
            "start_offset": 60,
            "end_offset": 45,  # Approaching deadline
        },
        {
            "title": "Drug Efficacy Analytics Engine",
            "description": "Implement advanced analytics engine for analyzing drug efficacy data from clinical trials",
            "owner_index": 2,
            "status": "active",
            "health": "healthy",
            "progress": 80,
            "tags": [tags[0], tags[2]],  # backend, devops
            "start_offset": 45,
            "end_offset": 15,
        },
        {
            "title": "Regulatory Compliance System",
            "description": "Migrate legacy compliance tracking to FDA-compliant cloud-based system for pharmaceutical regulations",
            "owner_index": 3,
            "status": "in_hold",
            "health": "critical",
            "progress": 20,
            "tags": [tags[0], tags[2]],  # backend, devops
            "start_offset": 10,
            "end_offset": 5,  # Overdue soon
        },
        {
            "title": "Prescription Management System",
            "description": "Implement secure prescription management system with pharmacist integration and patient notifications",
            "owner_index": 4,
            "status": "active",
            "health": "healthy",
            "progress": 55,
            "tags": [tags[0], tags[4]],  # backend, bug-fix
            "start_offset": 35,
            "end_offset": 75,
        },
        {
            "title": "Clinical Trial Data Portal",
            "description": "Establish comprehensive clinical trial data collection and reporting portal for research teams",
            "owner_index": 5,
            "status": "active",
            "health": "healthy",
            "progress": 30,
            "tags": [tags[1], tags[3]],  # frontend, documentation
            "start_offset": 20,
            "end_offset": 120,
        },
        {
            "title": "Supply Chain Visibility System",
            "description": "Optimize pharmaceutical supply chain visibility and inventory management across distribution centers",
            "owner_index": 6,
            "status": "active",
            "health": "at_risk",
            "progress": 45,
            "tags": [tags[0], tags[1], tags[2]],  # backend, frontend, devops
            "start_offset": 55,
            "end_offset": 20,
        },
        {
            "title": "Medical Information Knowledge Base",
            "description": "Create comprehensive knowledge base for medical information and drug interactions documentation",
            "owner_index": 7,
            "status": "active",
            "health": "healthy",
            "progress": 90,
            "tags": [tags[1], tags[3], tags[5]],  # frontend, documentation, feature
            "start_offset": 90,
            "end_offset": 5,  # Almost complete
        },
    ]

    projects = []
    today = datetime.now().date()

    for project_data in projects_data:
        owner = users[project_data["owner_index"]]
        start_date = today - timedelta(days=project_data["start_offset"])
        end_date = today + timedelta(days=project_data["end_offset"])

        # Delete duplicates first, then create
        Project.objects.filter(title=project_data["title"], owner=owner).delete()

        project, created = Project.objects.get_or_create(
            title=project_data["title"],
            owner=owner,
            defaults={
                "description": project_data["description"],
                "status": project_data["status"],
                "health": project_data["health"],
                "progress": project_data["progress"],
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        if created:
            # Add tags
            project.tags.set(project_data["tags"])
            project.save()

        projects.append(project)

    return projects


def create_test_team_members(projects, users):
    """Create team members for projects with random role assignment"""
    # Create or get roles
    roles = {}
    role_configs = [
        {
            "key": "lead",
            "display_name": "Project Lead",
            "color": "red",
            "bg_color": "bg-red-100",
            "text_color": "text-red-700",
            "border_color": "border-red-300",
            "sort_order": 1,
        },
        {
            "key": "developer",
            "display_name": "Developer",
            "color": "blue",
            "bg_color": "bg-blue-100",
            "text_color": "text-blue-700",
            "border_color": "border-blue-300",
            "sort_order": 2,
        },
        {
            "key": "designer",
            "display_name": "Designer",
            "color": "purple",
            "bg_color": "bg-purple-100",
            "text_color": "text-purple-700",
            "border_color": "border-purple-300",
            "sort_order": 3,
        },
        {
            "key": "qa",
            "display_name": "QA Engineer",
            "color": "green",
            "bg_color": "bg-green-100",
            "text_color": "text-green-700",
            "border_color": "border-green-300",
            "sort_order": 4,
        },
        {
            "key": "manager",
            "display_name": "Manager",
            "color": "orange",
            "bg_color": "bg-orange-100",
            "text_color": "text-orange-700",
            "border_color": "border-orange-300",
            "sort_order": 5,
        },
        {
            "key": "stakeholder",
            "display_name": "Stakeholder",
            "color": "pink",
            "bg_color": "bg-pink-100",
            "text_color": "text-pink-700",
            "border_color": "border-pink-300",
            "sort_order": 6,
        },
    ]

    for role_config in role_configs:
        role, _ = Role.objects.get_or_create(
            key=role_config["key"],
            defaults={
                "display_name": role_config["display_name"],
                "color": role_config["color"],
                "bg_color": role_config["bg_color"],
                "text_color": role_config["text_color"],
                "border_color": role_config["border_color"],
                "sort_order": role_config["sort_order"],
            },
        )
        roles[role_config["key"]] = role

    # Assign team members to projects with RANDOM roles for permission testing
    role_keys = list(roles.keys())

    for project in projects:
        for user in users:
            # Skip project owner (they're not added as team member)
            if user == project.owner:
                continue

            # Assign random role to user for this project
            random_role = roles[random.choice(role_keys)]
            capacity = random.randint(50, 100)

            TeamMember.objects.get_or_create(
                project=project,
                user=user,
                defaults={
                    "role": random_role,
                    "capacity": capacity,
                },
            )


def create_test_milestones(projects):
    """Create 5 milestones per project with varied progress"""
    milestone_templates = [
        {
            "title": "Requirements & Planning",
            "description": "Gather requirements, define scope, and create project plan",
            "days_offset": 14,
            "progress_range": (0, 30),
        },
        {
            "title": "Design & Architecture",
            "description": "Design system architecture and create design mockups",
            "days_offset": 28,
            "progress_range": (20, 60),
        },
        {
            "title": "Development Sprint 1",
            "description": "Implement core features and functionality",
            "days_offset": 42,
            "progress_range": (40, 80),
        },
        {
            "title": "Testing & QA",
            "description": "Comprehensive testing, bug fixes, and quality assurance",
            "days_offset": 56,
            "progress_range": (30, 100),
        },
        {
            "title": "Deployment & Launch",
            "description": "Final preparation, deployment, and launch",
            "days_offset": 70,
            "progress_range": (0, 50),
        },
    ]

    today = datetime.now().date()

    for project in projects:
        for i, template in enumerate(milestone_templates):
            # Calculate due date based on project's end date
            if project.end_date:
                # Spread milestones evenly towards the project end date
                milestone_due_date = today + timedelta(days=template["days_offset"])
                # Ensure milestone is before project end date
                if milestone_due_date > project.end_date:
                    milestone_due_date = project.end_date - timedelta(days=5 - i)
            else:
                milestone_due_date = today + timedelta(days=template["days_offset"])

            # Assign progress based on project progress and milestone order
            min_progress, max_progress = template["progress_range"]
            if i <= (
                project.progress // 20
            ):  # Earlier milestones should be more complete
                lower = max(min_progress, project.progress - 20)
                upper = max_progress
                progress = (
                    random.randint(lower, min(upper, 100))
                    if lower <= upper
                    else random.randint(min_progress, max_progress)
                )
            else:
                lower = min_progress
                upper = min(max_progress, max(project.progress // 2, min_progress))
                progress = random.randint(lower, upper)

            progress = max(0, min(100, progress))  # Clamp between 0-100

            Milestone.objects.get_or_create(
                project=project,
                title=f"{project.title} - {template['title']}",
                due_date=milestone_due_date,
                defaults={
                    "description": template["description"],
                    "progress": progress,
                },
            )


def seed_database():
    """Seed database with test data"""
    print("Creating admin user...")
    admin = create_admin_user()
    print(f"   ✓ Admin: {admin.username}")

    print("Creating test users...")
    users = create_test_users()

    print("Creating test tags...")
    tags = create_test_tags()

    print("Creating test projects...")
    projects = create_test_projects(users, tags)

    print("Creating team members...")
    create_test_team_members(projects, users)

    print("Creating milestones...")
    create_test_milestones(projects)

    print("✅ Database seeding complete!")
    print(f"   - Admin: 1")
    print(f"   - Users: {User.objects.count() - 1}")
    print(f"   - Tags: {Tag.objects.count()}")
    print(f"   - Projects: {Project.objects.count()}")
    print(f"   - Team Members: {TeamMember.objects.count()}")
    print(f"   - Milestones: {Milestone.objects.count()}")
