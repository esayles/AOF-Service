"""DANGER: drops and recreates the public schema — destroys ALL data.

Runs only when the RESET_DB environment variable is exactly "1", so it can
sit safely in the deploy pipeline as a no-op. Used to rebuild the production
database when migration history is unrecoverable (e.g., the pre-2026 schema
that predates the custom User model).

After a reset deploy succeeds, IMMEDIATELY unset RESET_DB, or the next
deploy will wipe the database again.
"""

import os

from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Drop and recreate the public schema (requires RESET_DB=1)."

    def handle(self, *args, **options):
        if os.environ.get("RESET_DB") != "1":
            self.stdout.write("RESET_DB != 1 — skipping schema reset (no-op).")
            return

        if connection.vendor != "postgresql":
            self.stdout.write(f"Vendor is {connection.vendor}, not postgresql — skipping.")
            return

        self.stdout.write(self.style.WARNING("RESET_DB=1 — DROPPING public schema..."))
        with connection.cursor() as cursor:
            cursor.execute("DROP SCHEMA public CASCADE;")
            cursor.execute("CREATE SCHEMA public;")
        self.stdout.write(self.style.SUCCESS(
            "Schema recreated. Unset RESET_DB now so future deploys keep data!"
        ))
