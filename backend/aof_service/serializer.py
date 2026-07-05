"""Converts instances of ServiceHour to and from JSON representations
(used by the frontend with POST/GET requests)."""

from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import ServiceHour, StudentProfile

User = get_user_model()


class ServiceHourSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(read_only=True)
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
            "description",
            "hours",
            "date_performed",
            "confirmed_by",
            "confirmed_at",
            "request_verifier",
        ]

    def validate_hours(self, value):
        if value <= 0:
            raise serializers.ValidationError("`hours` must be greater than 0")
        return value

    def validate_date_performed(self, value):
        if value > date.today():
            raise serializers.ValidationError("`date_performed` cannot be in the future")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            user = request.user
            if hasattr(user, "student_profile") and user.student_profile is not None:
                validated_data["student"] = user.student_profile
            else:
                raise serializers.ValidationError({
                    "student": "Unable to determine student — ensure the authenticated user has a StudentProfile."
                })
        else:
            raise serializers.ValidationError({
                "request": "Serializer requires request context with an authenticated user."
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
    """Minimal listing of faculty/admin users so students can pick a verifier."""

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name"]
