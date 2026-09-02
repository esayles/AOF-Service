"""Converts instances of ServiceHour to and from JSON representations
(used by the frontend with POST/GET requests)."""

from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import ServiceHour, StudentProfile

User = get_user_model()


class ServiceHourSerializer(serializers.ModelSerializer):
    # Students never choose this field: it is set from their authenticated
    # account. Faculty and admins use it when recording hours for a student.
    student = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all(),
        required=False,
    )
    student_name = serializers.SerializerMethodField(read_only=True)
    confirmed_by = serializers.PrimaryKeyRelatedField(read_only=True)
    confirmed_at = serializers.DateTimeField(read_only=True)
    request_verifier = serializers.PrimaryKeyRelatedField(
        required=False,
        allow_null=True,
        queryset=User.objects.filter(role__in=(User.FACULTY, User.ADMIN)),
    )

    class Meta:
        model = ServiceHour
        fields = [
            "id",
            "student",
            "student_name",
            "description",
            "hours",
            "date_performed",
            "confirmed_by",
            "confirmed_at",
            "request_verifier",
        ]

    #Returns student name.
    def get_student_name(self, obj):
        user = obj.student.user
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.username

    def validate_hours(self, value):
        if value <= 0:
            raise serializers.ValidationError("`hours` must be greater than 0")
        # Ensure that hours are in quarter-hour increments (0.25, 0.5, 0.75, etc.)
        if value % Decimal("0.25") != 0:
            raise serializers.ValidationError("`hours` must be in quarter-hour (0.25) increments")
        return value

    def validate_date_performed(self, value):
        if value > date.today():
            raise serializers.ValidationError("`date_performed` cannot be in the future")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        is_staff_user = getattr(user, "role", None) in (User.FACULTY, User.ADMIN)

        # Fixes error where a student can choose a different student when creating a ServiceHour obejct.
        if not is_staff_user and "student" in attrs:
            raise serializers.ValidationError({
                "student": "Only faculty or administrators can choose a student."
            })

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            raise serializers.ValidationError({
                "request": "Serializer requires request context with an authenticated user."
            })

        user = request.user
        if getattr(user, "role", None) in (User.FACULTY, User.ADMIN):
            if "student" not in validated_data:
                raise serializers.ValidationError({
                    "student": "Choose the student whose hours are being recorded."
                })
        elif hasattr(user, "student_profile") and user.student_profile is not None:
            validated_data["student"] = user.student_profile
        else:
            raise serializers.ValidationError({
                "student": "Unable to determine student — ensure the authenticated user has a StudentProfile."
            })

        return super().create(validated_data)


class StudentProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    total_hours = serializers.DecimalField(source="cached_total_hours", max_digits=7, decimal_places=2, read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "username",
            "first_name",
            "last_name",
            "year_in_school",
            "total_hours",
        ]


class FacultySerializer(serializers.ModelSerializer):
    """Listing of faculty/admin users so students can pick a verifier when logging actvisfty."""

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name"]


class StudentListSerializer(serializers.ModelSerializer):
    """A staff-only representation used when recording hours on behalf of a student."""

    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = StudentProfile
        fields = ["id", "first_name", "last_name", "email", "year_in_school"]


class UserManagementSerializer(serializers.ModelSerializer):
    """Safe user data exposed to application administrators."""

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role", "is_active"]


class UserRoleSerializer(serializers.ModelSerializer):
    """Allow admin to edit user roles (promote students working on the app to admin)"""

    class Meta:
        model = User
        fields = ["role"]
