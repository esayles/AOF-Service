from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
import os

def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'environment': os.environ.get('DJANGO_SETTINGS_MODULE'),
        'debug': os.environ.get('DEBUG', 'False'),
        'allowed_hosts': os.environ.get('ALLOWED_HOSTS', 'not set'),
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check),
    path('/', health_check)
]