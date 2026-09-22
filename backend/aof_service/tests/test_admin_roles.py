from importlib import import_module
from io import StringIO

from django.apps import apps
from django.core.management import call_command
from django.test import TestCase

from aof_service.models import User, StudentProfile

role_migration = import_module("aof_service.migrations.0006_alter_user_role")


def make_user(email, role, student=False):
    user = User.objects.create_user(username=email, email=email, password="pass", role=role)
    if student:
        StudentProfile.objects.create(user=user)
    return user


class EnsureAdminTests(TestCase):
    def run_command(self, email):
        call_command("ensure_admin", email, stdout=StringIO())
        return User.objects.get(email=email)

    def test_promotes_student_to_student_admin(self):
        make_user("kid@example.com", User.STUDENT, student=True)
        self.assertEqual(self.run_command("kid@example.com").role, User.STUDENT_ADMIN)

    def test_promotes_faculty_to_faculty_admin(self):
        make_user("teacher@example.com", User.FACULTY)
        self.assertEqual(self.run_command("teacher@example.com").role, User.FACULTY_ADMIN)

    def test_corrects_student_previously_made_faculty_admin(self):
        # Earlier versions made every listed user faculty_admin, students included.
        make_user("kid@example.com", User.FACULTY_ADMIN, student=True)
        self.assertEqual(self.run_command("kid@example.com").role, User.STUDENT_ADMIN)

    def test_leaves_existing_admins_alone(self):
        make_user("kid@example.com", User.STUDENT_ADMIN, student=True)
        make_user("teacher@example.com", User.FACULTY_ADMIN)
        self.assertEqual(self.run_command("kid@example.com").role, User.STUDENT_ADMIN)
        self.assertEqual(self.run_command("teacher@example.com").role, User.FACULTY_ADMIN)

    def test_creates_unknown_email_as_faculty_admin(self):
        self.assertEqual(self.run_command("new@example.com").role, User.FACULTY_ADMIN)

    def test_student_admin_keeps_student_abilities(self):
        make_user("kid@example.com", User.STUDENT, student=True)
        user = self.run_command("kid@example.com")
        self.assertTrue(user.acts_as_student)
        self.assertFalse(user.acts_as_faculty)


class LegacyAdminMigrationTests(TestCase):
    def test_splits_legacy_admins_by_student_profile(self):
        make_user("kid@example.com", User.ADMIN, student=True)
        make_user("teacher@example.com", User.ADMIN)
        make_user("plain@example.com", User.STUDENT, student=True)

        role_migration.migrate_legacy_admins(apps, None)

        roles = dict(User.objects.values_list("email", "role"))
        self.assertEqual(roles["kid@example.com"], User.STUDENT_ADMIN)
        self.assertEqual(roles["teacher@example.com"], User.FACULTY_ADMIN)
        self.assertEqual(roles["plain@example.com"], User.STUDENT)

    def test_reverse_restores_both_kinds_to_legacy_admin(self):
        make_user("kid@example.com", User.STUDENT_ADMIN, student=True)
        make_user("teacher@example.com", User.FACULTY_ADMIN)

        role_migration.restore_legacy_admins(apps, None)

        self.assertEqual(
            set(User.objects.values_list("role", flat=True)), {User.ADMIN}
        )
