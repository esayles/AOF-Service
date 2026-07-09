"""Defines the ViewSet for ServiceHour model, including a custom action to confirm service hours."""

from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .emails import send_verification_request
from .models import ServiceHour, StudentProfile
from .serializer import FacultySerializer, ServiceHourSerializer, StudentProfileSerializer
from .permissions import IsFacultyOrAdminPermission

User = get_user_model()


class ServiceHourViewSet(viewsets.ModelViewSet):

    serializer_class = ServiceHourSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Students only ever see (and can only modify) their own logs.

        Faculty and admins see everything. Because detail routes go through
        this queryset too, a student requesting someone else's log gets a 404.
        """
        user = self.request.user
        qs = ServiceHour.objects.select_related("student__user", "confirmed_by")
        if getattr(user, "role", None) in ("faculty", "admin"):
            return qs
        return qs.filter(student__user=user)

    def perform_create(self, serializer):
        service_hour = serializer.save()
        # Notify the requested verifier (no-op if none was chosen).
        send_verification_request(service_hour)

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


class FacultyListView(APIView):
    """List faculty/admin users so the log form can offer real verifier choices."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = User.objects.filter(role__in=("faculty", "admin")).order_by("last_name", "first_name")
        serializer = FacultySerializer(qs, many=True)
        return Response(serializer.data)
