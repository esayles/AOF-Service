from datetime import date

from django.db import migrations, models


def repair_legacy_service_hour_dates(apps, schema_editor):
    ServiceHour = apps.get_model("aof_service", "ServiceHour")
    ServiceHour.objects.filter(date_performed__isnull=True).update(
        date_performed=date(1970, 1, 1)
    )


def set_existing_service_hour_statuses(apps, schema_editor):
    ServiceHour = apps.get_model("aof_service", "ServiceHour")
    ServiceHour.objects.filter(confirmed_by__isnull=False).update(status="confirmed")


class Migration(migrations.Migration):

    dependencies = [
        ("aof_service", "0004_alter_user_auto_approve_service_hours"),
    ]

    operations = [
        migrations.RunPython(
            repair_legacy_service_hour_dates,
            migrations.RunPython.noop,
        ),
        migrations.AddField(
            model_name="servicehour",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("confirmed", "Confirmed"),
                    ("declined", "Declined"),
                ],
                default="pending",
                max_length=10,
            ),
        ),
        migrations.RunPython(
            set_existing_service_hour_statuses,
            migrations.RunPython.noop,
        ),
    ]
