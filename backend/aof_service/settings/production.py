from .base import *

DEBUG = False
ALLOWED_HOSTS = [os.environ.get('PRODUCTION_DOMAIN', '.elasticbeanstalk.com'), '.cloudfront.net']

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

# Production security settings
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = [
    os.environ.get('PRODUCTION_FRONTEND_URL', 'https://d1c725l9c1x9og.cloudfront.net'),
]