"""Registers URL routes as well as the confirm action using a "DRF (Django REST Framework) Router", 
which is essentially a way to automatically generate URL patterns for respective viewsets.
Also includes a health check/admin endpoint for monitoring service status."""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter
import os


class ApiRootView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return JsonResponse({
            'endpoints': {
                '/api/': ['GET'],
                '/api/ping/': ['GET'],
                '/api/service-logs/': ['GET', 'POST'],
                '/api/service-logs/{id}/': ['GET', 'PUT', 'PATCH', 'DELETE'],
                '/api/service-logs/{id}/confirm/': ['POST'],
                '/api/leaderboard/': ['GET'],
                '/api/auth/google/': ['POST'],
                '/api/auth/login/': ['POST'],
                '/api/auth/refresh/': ['POST'],
            }
        })

    def post(self, request):
        if request.data.get('id_token') is None:
            return Response({'detail': 'id_token missing'}, status=400)

        from .auth_views import GoogleAuthView
        return GoogleAuthView().post(request)


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
router.register(r'service-logs', ServiceHourViewSet, basename='servicelog')
from .auth_views import GoogleAuthView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns += [
    # API root: a readable listing of available API endpoints and typical HTTP methods.
    path('api/', ApiRootView.as_view()),
    path('api/', include(router.urls)),
    path('api/leaderboard/', LeaderboardView.as_view()),
    path('api/auth/google/', GoogleAuthView.as_view()),
    path('api/auth/login/', TokenObtainPairView.as_view()),
    path('api/auth/refresh/', TokenRefreshView.as_view()),
]