import csv
import os

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db.models import Sum

# These CSVs contain real names/emails and must NEVER be committed to the
# repo (backend/aof_service/data/ is gitignored). Override the paths with env
# vars when the files live elsewhere (e.g. downloaded from a private S3 bucket).
USERS_CSV = os.environ.get('IMPORT_USERS_CSV', 'aof_service/data/users_import.csv')
HOURS_CSV = os.environ.get('IMPORT_HOURS_CSV', 'aof_service/data/hours_import.csv')

from aof_service.models import StudentProfile, ServiceHour

User = get_user_model()


def map_role(role_string):
    role_string = role_string.lower()
    if "student" in role_string:
        return "student"
    elif "staff" in role_string or "faculty" in role_string:
        return "faculty"
    return "student"


def normalize_name(first, last):
    return f"{first.strip().lower()} {last.strip().lower()}"


def parse_last_first(name_field):
    if not name_field or "," not in name_field:
        return None, None

    last, first = name_field.split(",", 1)
    return first.strip(), last.strip()


class Command(BaseCommand):
    help = "Import users and service hours from CSV"

    def handle(self, *args, **kwargs):

        for path in (USERS_CSV, HOURS_CSV):
            if not os.path.exists(path):
                raise CommandError(
                    f"CSV not found: {path}\n"
                    "Place the private CSVs in backend/aof_service/data/ (gitignored) "
                    "or set IMPORT_USERS_CSV / IMPORT_HOURS_CSV env vars."
                )

        name_to_email = {}
        created_users = 0

        # IMPORT USERS
        with open(USERS_CSV, encoding='utf-8-sig') as file:
            reader = csv.DictReader(file)

            for row in reader:
                email = row.get('Email 1', '').strip()
                roles = row.get('Roles', '')

                first = row.get('First Name', '').strip()
                last = row.get('Last Name', '').strip()

                if not email or not first or not last:
                    continue

                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'username': email,
                        'first_name': first,
                        'last_name': last,
                        'role': map_role(roles),
                    }
                )

                # Update names even for existing users
                if not user.first_name or not user.last_name:
                    user.first_name = first
                    user.last_name = last
                    user.save()

                if created:
                    created_users += 1

                full_name = normalize_name(first, last)

                if full_name not in name_to_email:
                    name_to_email[full_name] = email

        self.stdout.write(f"Users created: {created_users}")
        self.stdout.write("Users imported + name map built")

        # CREATE STUDENT PROFILES
        created_profiles = 0

        for user in User.objects.filter(role="student"):
            profile, created = StudentProfile.objects.get_or_create(user=user)
            if created:
                created_profiles += 1

        self.stdout.write(f"Profiles created: {created_profiles}")

        # IMPORT HOURS
        created_hours = 0

        with open(HOURS_CSV, encoding='utf-8-sig') as file:
            reader = csv.DictReader(file)

            for row in reader:
                name_field = row.get('Name')
                hours = row.get("2025-26 Service Hours")

                if not name_field or not hours:
                    continue

                first, last = parse_last_first(name_field)

                if not first or not last:
                    continue

                full_name = normalize_name(first, last)

                email = None

                for name_key, mapped_email in name_to_email.items():
                    parts = name_key.split()
                    first_key = parts[0]
                    last_key = parts[-1]

                    if last.lower() == last_key and (
                        first_key.startswith(first.lower()) or
                        first.lower().startswith(first_key)
                    ):
                        email = mapped_email
                        break

                if not email:
                    self.stdout.write(f"❌ No match for: {full_name}")
                    continue

                try:
                    user = User.objects.get(email=email)
                    profile = StudentProfile.objects.get(user=user)

                    #duplicates
                    obj, created = ServiceHour.objects.get_or_create(
                        student=profile,
                        hours=float(hours)
                    )

                    if created:
                        created_hours += 1

                except Exception as e:
                    self.stdout.write(f"Error for {full_name}: {e}")

        self.stdout.write(f"Service hours imported: {created_hours}")

        # UPDATE LEADERBOARD
        for profile in StudentProfile.objects.all():
            total = profile.service_hours.aggregate(
                total=Sum('hours')
            )['total'] or 0

            profile.cached_total_hours = total
            profile.save()

        self.stdout.write("Leaderboard updated")