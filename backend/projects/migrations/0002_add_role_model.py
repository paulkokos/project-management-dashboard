# Generated migration to add Role model and update TeamMember

import django.db.models.deletion
from django.db import migrations, models


def migrate_roles_to_fk(apps, schema_editor):
    """Migrate existing role values to Role model instances"""
    TeamMember = apps.get_model("projects", "TeamMember")
    Role = apps.get_model("projects", "Role")

    # Map old role strings to new Role objects
    role_mapping = {
        "lead": {
            "key": "lead",
            "display_name": "Project Lead",
            "color": "red",
            "bg_color": "bg-red-100",
            "text_color": "text-red-700",
            "border_color": "border-red-300",
            "sort_order": 1,
        },
        "developer": {
            "key": "developer",
            "display_name": "Developer",
            "color": "blue",
            "bg_color": "bg-blue-100",
            "text_color": "text-blue-700",
            "border_color": "border-blue-300",
            "sort_order": 2,
        },
        "designer": {
            "key": "designer",
            "display_name": "Designer",
            "color": "purple",
            "bg_color": "bg-purple-100",
            "text_color": "text-purple-700",
            "border_color": "border-purple-300",
            "sort_order": 3,
        },
        "qa": {
            "key": "qa",
            "display_name": "QA Engineer",
            "color": "green",
            "bg_color": "bg-green-100",
            "text_color": "text-green-700",
            "border_color": "border-green-300",
            "sort_order": 4,
        },
        "manager": {
            "key": "manager",
            "display_name": "Manager",
            "color": "orange",
            "bg_color": "bg-orange-100",
            "text_color": "text-orange-700",
            "border_color": "border-orange-300",
            "sort_order": 5,
        },
        "stakeholder": {
            "key": "stakeholder",
            "display_name": "Stakeholder",
            "color": "gray",
            "bg_color": "bg-gray-100",
            "text_color": "text-gray-700",
            "border_color": "border-gray-300",
            "sort_order": 6,
        },
    }

    # Create Role objects
    for role_key, role_data in role_mapping.items():
        Role.objects.get_or_create(key=role_key, defaults=role_data)

    # Update TeamMember instances
    for team_member in TeamMember.objects.all():
        if team_member.role and team_member.role in role_mapping:
            role_obj = Role.objects.get(key=team_member.role)
            team_member.role_id_new = role_obj
            team_member.save()


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0001_initial"),
    ]

    operations = [
        # Create Role model
        migrations.CreateModel(
            name="Role",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("version", models.IntegerField(default=1)),
                ("etag", models.CharField(editable=False, max_length=32)),
                ("key", models.CharField(max_length=50, unique=True)),
                ("display_name", models.CharField(max_length=100)),
                ("description", models.TextField(blank=True)),
                ("color", models.CharField(default="blue", max_length=20)),
                ("bg_color", models.CharField(default="bg-blue-100", max_length=50)),
                (
                    "text_color",
                    models.CharField(default="text-blue-700", max_length=50),
                ),
                (
                    "border_color",
                    models.CharField(default="border-blue-300", max_length=50),
                ),
                ("sort_order", models.IntegerField(default=0)),
            ],
            options={
                "ordering": ["sort_order", "display_name"],
                "abstract": False,
            },
        ),
        # Add role_id field to TeamMember as a foreign key (temporary)
        migrations.AddField(
            model_name="teammember",
            name="role_id_new",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="projects.role",
            ),
        ),
        # Migrate data from role CharField to role_id ForeignKey
        migrations.RunPython(migrate_roles_to_fk),
        # Remove the old role CharField
        migrations.RemoveField(
            model_name="teammember",
            name="role",
        ),
        # Rename role_id_new to role
        migrations.RenameField(
            model_name="teammember",
            old_name="role_id_new",
            new_name="role",
        ),
        # Update the ordering for TeamMember
        migrations.AlterModelOptions(
            name="teammember",
            options={
                "ordering": ["role__sort_order"],
                "unique_together": {("project", "user")},
            },
        ),
    ]
