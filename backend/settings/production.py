from .base import *

DEBUG = False
ALLOWED_HOSTS = [os.environ.get('PRODUCTION_DOMAIN', '.elasticbeanstalk.com')]
