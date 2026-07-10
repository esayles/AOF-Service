from .base import *
import sys

DEBUG = False
ALLOWED_HOSTS = [os.environ.get('PRODUCTION_DOMAIN', '.elasticbeanstalk.com'), '.cloudfront.net']

if 'test' in sys.argv:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
else:
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

CORS_ALLOWED_ORIGINS = [
    os.environ.get('PRODUCTION_FRONTEND_URL', 'https://d1c725l9c1x9og.cloudfront.net'),
]

# Django's test client uses plain HTTP; redirecting it to HTTPS turns every
# test response into a 301, so disable the redirect under `manage.py test`.
SECURE_SSL_REDIRECT = 'test' not in sys.argv
# Production traffic arrives via CloudFront (HTTPS from the viewer, HTTP to
# EB). CloudFront reports the viewer's scheme in this header; trusting it
# prevents an infinite redirect loop with SECURE_SSL_REDIRECT.
SECURE_PROXY_SSL_HEADER = ('HTTP_CLOUDFRONT_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = [
    os.environ.get('PRODUCTION_FRONTEND_URL', 'https://d1c725l9c1x9og.cloudfront.net'),
]