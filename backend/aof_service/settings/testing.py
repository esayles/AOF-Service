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
