#!/usr/bin/env bash
#
# Build-time deploy hook for the Vercel *testing* backend.
#
# Elastic Beanstalk runs migrate/ensure_admin via container_commands in
# .ebextensions/django.config, but Vercel never reads .ebextensions -- so on
# the testing deployment nothing was applying migrations or creating admins.
# This script is the Vercel equivalent, wired up via "buildCommand" in
# vercel.json. It runs once per deployment in Vercel's build container, which
# already has the project's environment variables, so no secrets live here.
#
set -euo pipefail

echo "===== AOF deploy hook: start ====================================="

PY="$(command -v python3 || command -v python)"
echo "python: ${PY} ($("${PY}" --version 2>&1))"

# --- Guard: never let this silently succeed against throwaway sqlite -------
# settings/testing.py only switches to Postgres when DB_HOST is set. If it is
# missing here, Django falls back to base.py's sqlite file, which lives in the
# build container and is discarded the moment the build ends. migrate and
# ensure_admin would both report success while changing nothing.
if [ -z "${DB_HOST:-}" ]; then
  echo "ERROR: DB_HOST is not set in the BUILD environment."
  echo "  settings/testing.py would fall back to sqlite, so migrate and"
  echo "  ensure_admin would run against a throwaway file and silently do"
  echo "  nothing. Fix: in the Vercel project's Environment Variables, make"
  echo "  sure DB_HOST / DB_NAME / DB_USER / DB_PASSWORD are set AND that the"
  echo "  'Build' environment is ticked for each -- runtime-only variables are"
  echo "  not visible here."
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

echo "===== AOF deploy hook: done ======================================"
