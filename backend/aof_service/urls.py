"""Registers URL routes as well as the confirm action using a "DRF (Django REST Framework) Router", 
which is essentially a way to automatically generate URL patterns for respective viewsets.
Also includes a health check/admin endpoint for monitoring service status."""

from django.contrib import admin
from django.urls import path, include
from django.views.decorators.http import require_GET
from django.http import JsonResponse
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
    path('api/ping/', health_check),
    path('', health_check),
]

router = DefaultRouter()
from .views import ServiceHourViewSet, LeaderboardView
# Register viewsets without the 'api/' prefix; we'll mount the router under '/api/' below.
router.register(r'servicehours', ServiceHourViewSet, basename='servicehour')
from .auth_views import GoogleAuthView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns += [
    path('api/', include(router.urls)),
    # API root: a readable listing of available API endpoints and typical HTTP methods.
    path('api/', require_GET(lambda request: JsonResponse({
        'endpoints': {
            '/api/': ['GET'],
            '/api/ping/': ['GET'],
            '/api/servicehours/': ['GET', 'POST'],
            '/api/servicehours/{id}/': ['GET', 'PUT', 'PATCH', 'DELETE'],
            '/api/servicehours/{id}/confirm/': ['POST'],
            '/api/leaderboard/': ['GET'],
            '/api/auth/google/': ['POST'],
            '/api/auth/login/': ['POST'],
            '/api/auth/refresh/': ['POST'],
        }
    }))),
    path('api/leaderboard/', LeaderboardView.as_view()),
    path('api/auth/google/', GoogleAuthView.as_view()),
    path('api/auth/login/', TokenObtainPairView.as_view()),
    path('api/auth/refresh/', TokenRefreshView.as_view()),
]