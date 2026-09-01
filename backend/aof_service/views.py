"""API views for service hours, leaderboards, and user administration."""

import csv
from io import TextIOWrapper

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .emails import send_verification_request
from .models import ServiceHour, StudentProfile
from .serializer import (
    FacultySerializer,
    ServiceHourSerializer,
    StudentListSerializer,
    StudentProfileSerializer,
    UserManagementSerializer,
    UserRoleSerializer,
)
from .permissions import IsAdminPermission, IsFacultyOrAdminPermission

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
        qs = ServiceHour.objects.select_related(
            "student__user", "confirmed_by", "declined_by", "request_verifier"
        )
        if getattr(user, "role", None) == User.ADMIN:
            return qs
        if getattr(user, "role", None) == User.FACULTY:
            return qs.filter(request_verifier=user)
        return qs.filter(student__user=user)

    def perform_create(self, serializer):
        service_hour = serializer.save()
        is_self_submitted = service_hour.student.user_id == self.request.user.id
        if self.request.user.role in (User.FACULTY, User.ADMIN) and not is_self_submitted:
            # A staff member entering hours directly is a viable verifier, so the
            # log is immediately confirmed instead of creating another pending approval.
            service_hour.confirmed_by = self.request.user
            service_hour.confirmed_at = timezone.now()
            service_hour.save(update_fields=["confirmed_by", "confirmed_at"])
        else:
            # Student and self-submitted admin entries require verification.
            send_verification_request(service_hour)

    # A method that allows faculty/admin to update students' service logs.
    def perform_update(self, serializer):
        if (
            self.request.user.role not in (User.FACULTY, User.ADMIN)
            and serializer.instance.confirmed_by_id
        ):
            raise PermissionDenied("Confirmed service hours can only be changed by faculty or an administrator.")
        serializer.save()

    # A method allowing faculty and admin to delete service logs.
    def perform_destroy(self, instance):
        if (
            self.request.user.role not in (User.FACULTY, User.ADMIN)
            and instance.confirmed_by_id
        ):
            raise PermissionDenied("Confirmed service hours can only be deleted by faculty or an administrator.")
        instance.delete()

    @action(detail=True, methods=("post",), url_path="confirm", permission_classes=(IsAuthenticated, IsFacultyOrAdminPermission))
    def confirm(self, request, pk=None):
        obj = self.get_object()
        if obj.confirmed_by_id:
            raise ValidationError({"detail": "This service log has already been confirmed."})
        if obj.declined_by_id:
            raise ValidationError({"detail": "This service log has already been declined."})
        if (
            obj.request_verifier_id
            and obj.request_verifier_id != request.user.id
            and request.user.role != User.ADMIN
        ):
            raise PermissionDenied("Only the requested verifier or an administrator can confirm this log.")
        obj.confirmed_by = request.user
        obj.confirmed_at = timezone.now()
        obj.save()

        serializer = self.get_serializer(obj)
        return Response(serializer.data)

    # A method that allows faculty/admin to decline a pending verification request without deleting it.
    @action(detail=True, methods=("post",), url_path="decline", permission_classes=(IsAuthenticated, IsFacultyOrAdminPermission))
    def decline(self, request, pk=None):
        """Mark a pending verification request as declined without deleting it."""
        obj = self.get_object()
        if obj.confirmed_by_id:
            raise ValidationError({"detail": "This service log has already been confirmed."})
        if obj.declined_by_id:
            raise ValidationError({"detail": "This service log has already been declined."})
        if (
            obj.request_verifier_id
            and obj.request_verifier_id != request.user.id
            and request.user.role != User.ADMIN
        ):
            raise PermissionDenied("Only the requested verifier or an administrator can decline this log.")

        obj.declined_by = request.user
        obj.declined_at = timezone.now()
        obj.save(update_fields=["declined_by", "declined_at"])

        serializer = self.get_serializer(obj)
        return Response(serializer.data)
    
    # A method that allows students to retrieve their own service logs.
    @action(detail=False, methods=("get",), url_path="mine")
    def mine(self, request):
        queryset = self.get_queryset().filter(student__user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return top student profiles ordered by cached_total_hours."""
        qs = StudentProfile.objects.filter(cached_total_hours__gt=0).order_by("-cached_total_hours")
        serializer = StudentProfileSerializer(qs, many=True)
        return Response(serializer.data)


class FacultyListView(APIView):
    """List faculty/admin users so the log form can offer real verifier choices."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = User.objects.filter(role__in=("faculty", "admin")).order_by("last_name", "first_name")
        serializer = FacultySerializer(qs, many=True)
        return Response(serializer.data)


class StudentListView(APIView):
    """List students for the faculty/admin 'add hours' workflow."""

    permission_classes = [IsAuthenticated, IsFacultyOrAdminPermission]

    def get(self, request):
        qs = StudentProfile.objects.filter(user__role=User.STUDENT).select_related("user").order_by(
            "user__last_name", "user__first_name", "user__email"
        )
        serializer = StudentListSerializer(qs, many=True)
        return Response(serializer.data)


def role_from_csv(role_value):
    """Map the formatted CSV role descriptions to application roles."""
    normalized = (role_value or "").casefold()
    if "admin" in normalized:
        return User.ADMIN
    if "staff" in normalized or "faculty" in normalized:
        return User.FACULTY
    return User.STUDENT


class AdminUserListView(APIView):
    """Return all user accounts for the admin portal."""

    permission_classes = [IsAuthenticated, IsAdminPermission]

    def get(self, request):
        users = User.objects.order_by("last_name", "first_name", "email")
        return Response(UserManagementSerializer(users, many=True).data)


class AdminUserImportView(APIView):
    """Create or update user accounts from the CSV. (Allows us to import complete CSVs thoughout the year as new faculty/staff are added.)"""

    permission_classes = [IsAuthenticated, IsAdminPermission]
    parser_classes = [MultiPartParser, FormParser]

    required_headers = {"First Name", "Last Name", "Email 1", "Roles"}

    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            raise ValidationError({"file": "Choose a CSV file to upload."})
        if not upload.name.lower().endswith(".csv"):
            raise ValidationError({"file": "The upload must be a .csv file."})

        try:
            reader = csv.DictReader(TextIOWrapper(upload.file, encoding="utf-8-sig", newline=""))
            fieldnames = set(reader.fieldnames or [])
        except (UnicodeDecodeError, csv.Error) as exc:
            raise ValidationError({"file": f"Unable to read CSV: {exc}"}) from exc

        missing_headers = self.required_headers - fieldnames
        if missing_headers:
            raise ValidationError({
                "file": "Missing required column(s): " + ", ".join(sorted(missing_headers))
            })

        records, row_errors, seen_emails = [], [], set()
        for row_number, row in enumerate(reader, start=2):
            email = (row.get("Email 1") or "").strip().lower()
            first_name = (row.get("First Name") or "").strip()
            last_name = (row.get("Last Name") or "").strip()

            if not email or not first_name or not last_name:
                row_errors.append(f"Row {row_number}: first name, last name, and email are required.")
                continue
            try:
                validate_email(email)
            except DjangoValidationError:
                row_errors.append(f"Row {row_number}: invalid email address.")
                continue
            if email in seen_emails:
                row_errors.append(f"Row {row_number}: duplicate email address in CSV.")
                continue
            if User.objects.filter(username=email).exclude(email=email).exists():
                row_errors.append(f"Row {row_number}: username already belongs to another account.")
                continue

            seen_emails.add(email)
            records.append({
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "role": role_from_csv(row.get("Roles")),
            })

        if row_errors:
            raise ValidationError({"file": row_errors})
        if not records:
            raise ValidationError({"file": "The CSV has no user records."})

        created = updated = unchanged = student_profiles_created = 0
        with transaction.atomic():
            for record in records:
                user = User.objects.filter(email=record["email"]).first()
                if user is None:
                    user = User(
                        username=record["email"],
                        email=record["email"],
                        first_name=record["first_name"],
                        last_name=record["last_name"],
                        role=record["role"],
                    )
                    user.set_unusable_password()
                    user.save()
                    created += 1
                else:
                    changed_fields = []
                    for field in ("first_name", "last_name"):
                        if getattr(user, field) != record[field]:
                            setattr(user, field, record[field])
                            changed_fields.append(field)
                    if user.role != User.ADMIN and user.role != record["role"]:
                        user.role = record["role"]
                        changed_fields.append("role")
                    if changed_fields:
                        user.save(update_fields=changed_fields)
                        updated += 1
                    else:
                        unchanged += 1

                if user.role == User.STUDENT:
                    _, profile_created = StudentProfile.objects.get_or_create(user=user)
                    student_profiles_created += int(profile_created)

        return Response({
            "created": created,
            "updated": updated,
            "unchanged": unchanged,
            "student_profiles_created": student_profiles_created,
            "total_processed": len(records),
        })


class AdminUserDetailView(APIView):
    """Change a user's role or remove a user account from the admin portal."""

    permission_classes = [IsAuthenticated, IsAdminPermission]

    def get_object(self, user_id):
        return get_object_or_404(User, pk=user_id)

    @staticmethod
    def ensure_admin_remains(target_user, new_role=None):
        will_remove_admin = (
            target_user.role == User.ADMIN
            and (new_role is None or new_role != User.ADMIN)
        )
        if will_remove_admin and User.objects.filter(role=User.ADMIN).count() <= 1:
            raise ValidationError({"role": "At least one administrator account must remain."})

    def patch(self, request, user_id):
        user = self.get_object(user_id)
        if user.pk == request.user.pk:
            raise PermissionDenied("You cannot change your own administrator role.")

        serializer = UserRoleSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.ensure_admin_remains(user, serializer.validated_data.get("role"))
        serializer.save()
        return Response(UserManagementSerializer(user).data)

    def delete(self, request, user_id):
        user = self.get_object(user_id)
        if user.pk == request.user.pk:
            raise PermissionDenied("You cannot delete your own account.")

        self.ensure_admin_remains(user)
        user.delete()
        return Response(status=204)
