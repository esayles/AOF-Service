"""Defines the ViewSet for ServiceHour model, including a custom action to confirm service hours."""

from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ServiceHour, StudentProfile
from .serializer import ServiceHourSerializer, StudentProfileSerializer
from .permissions import IsFacultyOrAdminPermission


class IsFacultyOrAdmin:

    @staticmethod
    def has_permission(user):
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return getattr(user, "role", None) in ("faculty", "admin")


class ServiceHourViewSet(viewsets.ModelViewSet):

    queryset = ServiceHour.objects.all()
    serializer_class = ServiceHourSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=("post",), url_path="confirm", permission_classes=(IsAuthenticated, IsFacultyOrAdminPermission))
    def confirm(self, request, pk=None):
        obj = self.get_object()
        obj.confirmed_by = request.user
        obj.confirmed_at = timezone.now()
        obj.save()

        serializer = self.get_serializer(obj)
        return Response(serializer.data)

class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return top student profiles ordered by cached_total_hours."""
        qs = StudentProfile.objects.order_by("-cached_total_hours")[:10]
        serializer = StudentProfileSerializer(qs, many=True)
        return Response(serializer.data)
