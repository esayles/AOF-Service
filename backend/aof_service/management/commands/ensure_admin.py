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
                "role": User.ADMIN,
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
        elif user.role != User.ADMIN:
            user.role = User.ADMIN
            user.save(update_fields=["role"])

            self.stdout.write(
                self.style.SUCCESS(
                    f"Promoted existing user to admin: {email}"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"{email} is already an admin."
                )
            )
