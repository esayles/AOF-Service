"""Give existing student accounts the StudentProfile their service logs need.

Profiles used to be created only when Google SSO first saw an account, so
students added another way — the Django admin, a management command, or a
role change from faculty/admin — could not log hours at all.
"""

from django.db import migrations


def create_missing_student_profiles(apps, schema_editor):
    User = apps.get_model("aof_service", "User")
    StudentProfile = apps.get_model("aof_service", "StudentProfile")

    missing = User.objects.filter(role="student", student_profile__isnull=True)
    StudentProfile.objects.bulk_create(
        [StudentProfile(user=user) for user in missing]
    )


class Migration(migrations.Migration):

    dependencies = [
        ("aof_service", "0005_servicehour_status"),
    ]

    operations = [
        migrations.RunPython(
            create_missing_student_profiles,
            migrations.RunPython.noop,
        ),
    ]
