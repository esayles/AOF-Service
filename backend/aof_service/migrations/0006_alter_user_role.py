from django.db import migrations, models


def migrate_legacy_admins(apps, schema_editor):
    # Legacy "admin" covered both kinds of administrator. Students among them
    # (the ones with a StudentProfile) become student admins so they keep
    # logging hours and do not gain faculty verification rights.
    User = apps.get_model("aof_service", "User")
    legacy = User.objects.filter(role="admin")
    legacy.filter(student_profile__isnull=False).update(role="student_admin")
    legacy.filter(student_profile__isnull=True).update(role="faculty_admin")


def restore_legacy_admins(apps, schema_editor):
    User = apps.get_model("aof_service", "User")
    User.objects.filter(role__in=("student_admin", "faculty_admin")).update(role="admin")


class Migration(migrations.Migration):
    dependencies = [
        ("aof_service", "0005_servicehour_status"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("student", "Student"),
                    ("faculty", "Faculty"),
                    ("student_admin", "Student Admin"),
                    ("faculty_admin", "Faculty Admin"),
                    ("admin", "Admin (legacy)"),
                ],
                default="student",
                max_length=14,
            ),
        ),
        migrations.RunPython(migrate_legacy_admins, restore_legacy_admins),
    ]
