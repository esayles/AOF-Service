from .base import *
import sys

DEBUG = False
ALLOWED_HOSTS = ['.vercel.app', 'localhost']

# The deployed testing backend (Vercel) needs a real database — the sqlite in
# base.py is read-only and ephemeral on serverless, so every write (and the
# unmigrated schema) fails. Use Postgres when DB_HOST is provided (Vercel env
# vars), but keep sqlite for `manage.py test` in CI and for local development
# without a database configured.
if 'test' not in sys.argv and os.environ.get('DB_HOST'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME'),
            'USER': os.environ.get('DB_USER'),
            'PASSWORD': os.environ.get('DB_PASSWORD'),
            'HOST': os.environ.get('DB_HOST'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }

# Verification emails from the testing deployment link back to the testing
# frontend, never to production.
SERVICE_HOUR_APP_URL = os.environ.get('SERVICE_HOUR_APP_URL', 'https://aof-service.vercel.app')

# This deployment is where students test. If it is ever configured to send
# real mail (EMAIL_BACKEND_MODE=smtp), EMAIL_TEST_REDIRECT_TO should be set in
# the same environment so practice submissions land in one mailbox instead of
# real faculty inboxes. Warn loudly rather than silently emailing teachers.
if EMAIL_BACKEND.endswith('smtp.EmailBackend') and not EMAIL_TEST_REDIRECT_TO:
    import warnings

    warnings.warn(
        "Testing settings are sending real email with no EMAIL_TEST_REDIRECT_TO "
        "set: student practice submissions will reach real faculty inboxes.",
        RuntimeWarning,
    )
