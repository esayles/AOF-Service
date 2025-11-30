"""Registers URL routes as well as the confirm action using a "DRF (Django REST Framework) Router", 
which is essentially a way to automatically generate URL patterns for respective viewsets.
Also includes a health check/admin endpoint for monitoring service status."""

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
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
    path('/', health_check),
]

router = DefaultRouter()
from .views import ServiceHourViewSet
router.register(r'api/servicehours', ServiceHourViewSet, basename='servicehour')
from .auth_views import GoogleAuthView

urlpatterns += [
    path('', include(router.urls)),
    path('api/auth/google/', GoogleAuthView.as_view()),
]