from django.db import migrations, models


class Migration(migrations.Migration):
    """Turn auto-approval off for new accounts only.

    AlterField changes the default applied to rows created from here on; it
    does not touch existing rows. Accounts created while 0003's default=True
    was in effect therefore keep auto-approving until someone switches the
    toggle off in the admin panel. That is deliberate — their current values
    are treated as settings to preserve, not as an accident to correct.
    """

    dependencies = [
        ('aof_service', '0003_user_auto_approve_service_hours'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='auto_approve_service_hours',
            field=models.BooleanField(default=False),
        ),
    ]
