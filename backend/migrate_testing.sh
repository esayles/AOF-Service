#!/usr/bin/env bash
#
# Applies migrations to the *testing* (Vercel) database. Run from CI by
# .github/workflows/deploy-testing.yml on every push to dev.
#
# Why CI and not Vercel: Elastic Beanstalk runs migrate/ensure_admin via
# container_commands in .ebextensions/django.config, but Vercel never reads
# .ebextensions. The first attempt at an equivalent used "buildCommand" in
# vercel.json -- which Vercel silently ignores, because the legacy "builds"
# array in the same file puts the project in a mode where build settings do
# not apply ("Due to `builds` existing in your configuration file, the Build
# and Development Settings defined in your Project Settings will not apply").
# The hook never ran once between Sept 2 and Sept 7, so migration 0003 was
# missing from the testing database and every login returned a 500.
#
# Removing "builds" would mean restructuring the app to Vercel's zero-config
# Python layout, so migrations run from CI instead, where the log is visible
# and the job can be re-run on its own.
#
# Credentials come from GitHub secrets (TESTING_DB_*), never from this file.
#
set -euo pipefail

echo "===== AOF testing migrate: start ================================="

PY="$(command -v python3 || command -v python)"
echo "python: ${PY} ($("${PY}" --version 2>&1))"

# --- Guard: never let this silently succeed against throwaway sqlite -------
# settings/testing.py only switches to Postgres when DB_HOST is set. Without
# it, Django falls back to base.py's sqlite file, which lives in the CI runner
# and is discarded when the job ends: migrate and ensure_admin would both
# report success while changing nothing on the real database.
if [ -z "${DB_HOST:-}" ]; then
  echo "ERROR: DB_HOST is not set."
  echo "  settings/testing.py would fall back to sqlite, so migrate and"
  echo "  ensure_admin would run against a throwaway file and silently do"
  echo "  nothing. Fix: add the TESTING_DB_HOST / TESTING_DB_NAME /"
  echo "  TESTING_DB_USER / TESTING_DB_PASSWORD repository secrets, copying"
  echo "  the values from the Vercel backend project's environment variables."
  exit 1
fi
echo "DB_HOST is set -- Postgres path confirmed."

export DJANGO_SETTINGS_MODULE=aof_service.settings.testing

# settings/base.py raises RuntimeError at import time when these are absent.
# Nothing in migrate or ensure_admin talks to Google, so placeholders are
# enough to get the settings module to import. Real values, if configured for
# the build, are left untouched.
export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-build-step-only}"
export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-build-step-only}"

# Depending on the build pipeline, dependencies may not be installed yet at
# the point the build command runs.
if ! "${PY}" -c "import django" >/dev/null 2>&1; then
  echo "----- django not importable; installing requirements -------------"
  "${PY}" -m pip install --disable-pip-version-check -q -r requirements.txt
fi

echo "----- migrate ----------------------------------------------------"
"${PY}" manage.py migrate --noinput

echo "----- ensure_admin -----------------------------------------------"
for email in \
  campisin27@avonoldfarms.com \
  saylese@avonoldfarms.com \
  colettil27@avonoldfarms.com \
  wakefieldz27@avonoldfarms.com
do
  "${PY}" manage.py ensure_admin "${email}"
done

echo "===== AOF testing migrate: done =================================="
