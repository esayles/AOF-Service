from django.core.management.base import BaseCommand
from aof_service.models import User


class Command(BaseCommand):
    help = "Create admin users for dev testing after deployment"

    def add_arguments(self, parser):
        parser.add_argument("email", type=str)

    def handle(self, *args, **options):
        email = options["email"].strip().lower()

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "role": User.FACULTY_ADMIN,
            },
        )

        if created:
            user.set_unusable_password()
            user.save(update_fields=["password"])

            self.stdout.write(
                self.style.SUCCESS(
                    f"Created admin user: {email}"
                )
            )
        elif user.role != (role := self.admin_role_for(user)):
            user.role = role
            user.save(update_fields=["role"])

            self.stdout.write(
                self.style.SUCCESS(
                    f"Set {email} to {user.role}"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"{email} is already an admin."
                )
            )

    @staticmethod
    def admin_role_for(user):
        # Students on the admin list must stay students: faculty_admin would
        # stop them logging hours and let them verify other students' hours.
        # This also corrects students an earlier version made faculty_admin.
        if user.role in User.STUDENT_ROLES or hasattr(user, "student_profile"):
            return User.STUDENT_ADMIN
        return User.FACULTY_ADMIN
