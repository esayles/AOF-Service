"""API views for service hours, leaderboards, and user administration."""

import csv
from datetime import date
from decimal import Decimal
from io import TextIOWrapper

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import DecimalField, Q, Sum, Value
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models.functions import Coalesce

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .emails import send_approval_request
from .models import ServiceHour, StudentProfile, ensure_student_profile
from .serializer import (
    FacultySerializer,
    ServiceHourSerializer,
    StudentListSerializer,
    StudentProfileSerializer,
    UserManagementSerializer,
    UserRoleSerializer,
    ActivitySerializer,
)
from .permissions import IsAdminPermission, IsFacultyOrAdminPermission, IsSchoolActivityAdminPermission

User = get_user_model()
SCHOOL_YEAR_CUTOFF = date(2026, 6, 1)


class ServiceHourViewSet(viewsets.ModelViewSet):

    serializer_class = ServiceHourSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Students only ever see (and can only modify) their own logs.

        Faculty can only access logs that name them as the requested approver;
        administrators can access all logs. Detail routes use this queryset as
        well, so faculty cannot approve, edit, or decline another approver’s
        request.
        """
        user = self.request.user
        qs = ServiceHour.objects.select_related(
            "student__user", "confirmed_by", "request_verifier"
        )
        role = getattr(user, "role", None)
        if role == User.FACULTY_ADMIN and self.action not in ("list", "confirm"):
            return qs
        if role in User.FACULTY_ROLES:
            return qs.filter(request_verifier=user)
        if role == User.ADMIN:
            return qs
        return qs.filter(student__user=user)

    def perform_create(self, serializer):
        service_hour = serializer.save()
        user = self.request.user
        should_auto_approve = (
            user.role in (User.FACULTY, User.FACULTY_ADMIN)
            or (
                user.role in User.ADMIN_ROLES
                and user.auto_approve_service_hours
            )
        )

        if should_auto_approve:
            # A staff member entering hours directly is a viable approver, so
            # the log is immediately confirmed instead of creating another
            # pending approval.
            service_hour.confirmed_by = user
            service_hour.confirmed_at = timezone.now()
            service_hour.status = ServiceHour.CONFIRMED
            service_hour.save(update_fields=["confirmed_by", "confirmed_at", "status"])
        elif user.role in User.STUDENT_ROLES:
            # Notify the requested approver.
            send_approval_request(service_hour)

    # A method that allows faculty/admin to update students' service logs.
    def perform_update(self, serializer):
        if (
            self.request.user.role in User.FACULTY_ROLES
            and set(serializer.validated_data) - {"description", "hours", "date_performed"}
        ):
            raise PermissionDenied("Faculty can only update a service log's description, hours, or date.")
        if (
            self.request.user.role not in User.FACULTY_APPROVER_ROLES
            and serializer.instance.confirmed_by_id
        ):
            raise PermissionDenied("Confirmed service hours can only be changed by faculty or an administrator.")
        serializer.save()

    # A method allowing faculty and admin to delete service logs.
    def perform_destroy(self, instance):
        if (
            self.request.user.role not in User.FACULTY_APPROVER_ROLES
            and instance.confirmed_by_id
        ):
            raise PermissionDenied("Confirmed service hours can only be deleted by faculty or an administrator.")
        instance.delete()

    @action(detail=True, methods=("post",), url_path="confirm", permission_classes=(IsAuthenticated, IsFacultyOrAdminPermission))
    def confirm(self, request, pk=None):
        obj = self.get_object()
        if obj.status == ServiceHour.DECLINED:
            raise ValidationError({"detail": "This service log has been declined."})
        if obj.confirmed_by_id:
            raise ValidationError({"detail": "This service log has already been confirmed."})
        if (
            obj.request_verifier_id
            and obj.request_verifier_id != request.user.id
            and request.user.role not in User.ADMIN_ROLES
        ):
            raise PermissionDenied("Only the requested approver or an administrator can approve this log.")
        obj.confirmed_by = request.user
        obj.confirmed_at = timezone.now()
        obj.status = ServiceHour.CONFIRMED
        obj.save(update_fields=["confirmed_by", "confirmed_at", "status"])

        serializer = self.get_serializer(obj)
        return Response(serializer.data)

    @action(detail=True, methods=("post",), url_path="decline", permission_classes=(IsAuthenticated, IsFacultyOrAdminPermission))
    def decline(self, request, pk=None):
        """Keep a declined submission for the student's history, without its hours."""
        obj = self.get_object()
        if obj.status == ServiceHour.DECLINED:
            raise ValidationError({"detail": "This service log has already been declined."})
        if (
            obj.request_verifier_id
            and obj.request_verifier_id != request.user.id
            and request.user.role not in User.ADMIN_ROLES
        ):
            raise PermissionDenied("Only the requested approver or an administrator can decline this log.")

        obj.status = ServiceHour.DECLINED
        obj.save(update_fields=["status"])
        return Response(self.get_serializer(obj).data)
    
    # A method that allows students to retrieve their own service logs.
    @action(detail=False, methods=("get",), url_path="mine")
    def mine(self, request):
        queryset = self.get_queryset().filter(student__user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return the top students overall or within a requested school year."""
        period = request.query_params.get("period")
        if period not in (None, "last-year", "this-year"):
            raise ValidationError({"period": "Choose 'last-year' or 'this-year'."})

        if period is None:
            qs = StudentProfile.objects.order_by("-cached_total_hours")[:10]
            return Response(StudentProfileSerializer(qs, many=True).data)

        date_filter = (
            Q(service_hours__date_performed__lt=SCHOOL_YEAR_CUTOFF)
            if period == "last-year"
            else Q(service_hours__date_performed__gte=SCHOOL_YEAR_CUTOFF)
        )
        qs = StudentProfile.objects.select_related("user").annotate(
            period_hours=Coalesce(
                Sum(
                    "service_hours__hours",
                    filter=date_filter
                    & Q(service_hours__status__in=(ServiceHour.PENDING, ServiceHour.CONFIRMED)),
                ),
                Value(Decimal("0.00")),
                output_field=DecimalField(max_digits=7, decimal_places=2),
            )
        ).order_by("-period_hours", "user__last_name", "user__first_name")[:10]

        students = list(qs)
        results = StudentProfileSerializer(students, many=True).data
        for student, result in zip(students, results):
            result["total_hours"] = f"{student.period_hours:.2f}"
        return Response(results)


class AdminLeaderboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdminPermission]

    def get(self, request):
        """Return all students ranked by hours for an optional school-year period."""
        period = request.query_params.get("period", "total")
        if period not in ("total", "last-year", "this-year"):
            raise ValidationError({"period": "Choose 'total', 'last-year', or 'this-year'."})

        minimum_hours = request.query_params.get("minimum_hours")
        if minimum_hours not in (None, "30", "100"):
            raise ValidationError({"minimum_hours": "Choose 30 or 100."})

        date_filter = Q()
        if period == "last-year":
            date_filter = Q(service_hours__date_performed__lt=SCHOOL_YEAR_CUTOFF)
        elif period == "this-year":
            date_filter = Q(service_hours__date_performed__gte=SCHOOL_YEAR_CUTOFF)

        qs = StudentProfile.objects.filter(
            user__role__in=User.STUDENT_ROLES
        ).select_related("user").annotate(
            leaderboard_hours=Coalesce(
                Sum(
                    "service_hours__hours",
                    filter=date_filter
                    & Q(service_hours__status__in=(ServiceHour.PENDING, ServiceHour.CONFIRMED)),
                ),
                Value(Decimal("0.00")),
                output_field=DecimalField(max_digits=7, decimal_places=2),
            )
        )
        if minimum_hours is not None:
            qs = qs.filter(leaderboard_hours__gte=Decimal(minimum_hours))

        students = list(qs.order_by(
            "-leaderboard_hours", "user__last_name", "user__first_name", "user__id"
        ))
        results = StudentProfileSerializer(students, many=True).data
        for student, result in zip(students, results):
            result["total_hours"] = f"{student.leaderboard_hours:.2f}"
        return Response(results)


class AdminActivitiesView(APIView):
    """Return the school's complete service-activity history to admins."""

    permission_classes = [IsAuthenticated, IsSchoolActivityAdminPermission]

    def get(self, request):
        activities = ServiceHour.objects.select_related(
            "student__user", "request_verifier"
        ).order_by("-date_performed", "-id")
        return Response(ActivitySerializer(activities, many=True).data)


class FacultyListView(APIView):
    """List faculty/admin users so the log form can offer real approver choices."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = User.objects.filter(role__in=User.FACULTY_APPROVER_ROLES).order_by("last_name", "first_name")
        serializer = FacultySerializer(qs, many=True)
        return Response(serializer.data)


class StudentListView(APIView):
    """List students for the faculty/admin 'add hours' workflow."""

    permission_classes = [IsAuthenticated, IsFacultyOrAdminPermission]

    def get(self, request):
        qs = StudentProfile.objects.filter(user__role__in=User.STUDENT_ROLES).select_related("user").order_by(
            "user__last_name", "user__first_name", "user__email"
        )
        serializer = StudentListSerializer(qs, many=True)
        return Response(serializer.data)


def role_from_csv(role_value):
    """Map the formatted CSV role descriptions to application roles."""
    normalized = (role_value or "").casefold()
    if "student" in normalized and "admin" in normalized:
        return User.STUDENT_ADMIN
    if "admin" in normalized:
        return User.FACULTY_ADMIN
    if "staff" in normalized or "faculty" in normalized:
        return User.FACULTY
    return User.STUDENT


class AdminUserListView(APIView):
    """Return all user accounts for the admin portal."""

    permission_classes = [IsAuthenticated, IsAdminPermission]

    def get(self, request):
        users = User.objects.order_by("last_name", "first_name", "email")
        return Response(UserManagementSerializer(users, many=True).data)

class AdminStudentProfileView(APIView):
    """Return one student's activity history for administrators."""

    permission_classes = [IsAuthenticated, IsAdminPermission]

    def get(self, request, user_id):
        profile = get_object_or_404(
            StudentProfile.objects.select_related("user"),
            user_id=user_id,
            user__role__in=User.STUDENT_ROLES,
        )
        logs = ServiceHour.objects.filter(student=profile).select_related(
            "student__user", "confirmed_by", "request_verifier"
        ).order_by("-date_performed", "-id")
        return Response({
            "student": StudentProfileSerializer(profile).data,
            "service_logs": ServiceHourSerializer(logs, many=True).data,
        })


class AdminPreferencesView(APIView):
    permission_classes = [IsAuthenticated, IsAdminPermission]

    def get(self, request):
        return Response({
            "auto_approve_service_hours": request.user.auto_approve_service_hours,
        })

    def patch(self, request):
        if "auto_approve_service_hours" not in request.data:
            raise ValidationError({
                "auto_approve_service_hours": "This field is required."
            })

        value = request.data["auto_approve_service_hours"]

        if not isinstance(value, bool):
            raise ValidationError({
                "auto_approve_service_hours": "Must be true or false."
            })

        request.user.auto_approve_service_hours = value
        request.user.save(update_fields=["auto_approve_service_hours"])

        return Response({
            "auto_approve_service_hours": request.user.auto_approve_service_hours,
        })


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
                    if not user.is_app_admin and user.role != record["role"]:
                        user.role = record["role"]
                        changed_fields.append("role")
                    if changed_fields:
                        user.save(update_fields=changed_fields)
                        updated += 1
                    else:
                        unchanged += 1

                if user.role in User.STUDENT_ROLES:
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
            target_user.role in User.ADMIN_ROLES
            and (new_role is None or new_role not in User.ADMIN_ROLES)
        )
        if will_remove_admin and User.objects.filter(role__in=User.ADMIN_ROLES).count() <= 1:
            raise ValidationError({"role": "At least one administrator account must remain."})

    def patch(self, request, user_id):
        user = self.get_object(user_id)
        serializer = UserRoleSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.ensure_admin_remains(user, serializer.validated_data.get("role"))
        serializer.save()
        # A user demoted to student needs the profile their service logs hang off.
        ensure_student_profile(user)
        return Response(UserManagementSerializer(user).data)

    def delete(self, request, user_id):
        user = self.get_object(user_id)
        if user.pk == request.user.pk:
            raise PermissionDenied("You cannot delete your own account.")

        self.ensure_admin_remains(user)
        user.delete()
        return Response(status=204)
