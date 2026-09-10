"""This file defines the database schema where a custom User model is created, 
along with related models forr StudentProfile (one-to-one with User), 
and ServiceHour entries that reference a student and records who/when it was confirmed."""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Sum
from decimal import Decimal
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver

class User(AbstractUser):
    email = models.EmailField(unique=True)
    
    STUDENT = "student"
    FACULTY = "faculty"
    ADMIN = "admin"

    ROLE_CHOICES = [
        (STUDENT, "Student"),
        (FACULTY, "Faculty"),
        (ADMIN, "Admin"),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=STUDENT)
    # Admins opt in to auto-approving the hours they enter themselves. Off by
    # default so a new administrator never silently self-approves before
    # deciding they want that; the toggle lives in the admin panel.
    auto_approve_service_hours = models.BooleanField(default=False)
    
    GOOGLE = "google"
    AUTH_PROVIDER_CHOICES = [
        (GOOGLE, "Google"),
    ]

    auth_provider = models.CharField(
        max_length=20,
        choices=AUTH_PROVIDER_CHOICES,
        default=GOOGLE,
        editable=False,
    )

    def __str__(self):
        return f"{self.username} ({self.role})"


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")

    FRESHMAN = "FR"
    SOPHOMORE = "SO"
    JUNIOR = "JR"
    SENIOR = "SR"
    POSTGRADUATE = "PG"
    YEAR_IN_SCHOOL_CHOICES = [
        (FRESHMAN, "Freshman"),
        (SOPHOMORE, "Sophomore"),
        (JUNIOR, "Junior"),
        (SENIOR, "Senior"),
        (POSTGRADUATE, "Postgraduate"),
    ]

    year_in_school = models.CharField(max_length=2, choices=YEAR_IN_SCHOOL_CHOICES, default=FRESHMAN)
    
    cached_total_hours = models.DecimalField(max_digits=7, decimal_places=2, default=Decimal("0.00"))

    def __str__(self):
        return f"{self.user.username} ({self.get_year_in_school_display()})"

    @property
    def total_hours(self):
        """Return service hours that have not been declined."""
        total = self.service_hours.exclude(status=ServiceHour.DECLINED).aggregate(total=Sum("hours"))["total"]
        return total if total is not None else Decimal("0.00")


class ServiceHour(models.Model):
    ## ServiceHour status choices
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DECLINED = "declined"
    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (CONFIRMED, "Confirmed"),
        (DECLINED, "Declined"),
    ]

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="service_hours")
    description = models.TextField()
    hours = models.DecimalField(max_digits=5, decimal_places=2)
    confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, limit_choices_to={"role": "faculty"})
    confirmed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    date_performed = models.DateField()
    request_verifier = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verification_requests",
        limit_choices_to={"role__in": ("faculty", "admin")},
        help_text="Faculty member the student asked to verify these hours.",
    )

    def __str__(self):
        return f"{self.student.user.username}: {self.hours} hours"


def ensure_student_profile(user):
    """Return the StudentProfile for a student user, creating it if missing.

    Profiles are normally created when an account is first seen by Google SSO,
    but accounts can also arrive through the Django admin, a management
    command, or the CSV import, and an existing faculty/admin account can be
    demoted to student later on. Any of those leaves a student without the
    profile every service log needs, so callers use this to fill the gap.
    Returns None for users who are not students.
    """
    if user is None or getattr(user, "pk", None) is None:
        return None
    if getattr(user, "role", None) != User.STUDENT:
        return None

    profile, _ = StudentProfile.objects.get_or_create(user=user)
    return profile


# Helper to recompute cached total for a StudentProfile
def _recompute_cached_total(student_profile):
    total = student_profile.service_hours.exclude(status=ServiceHour.DECLINED).aggregate(total=Sum("hours"))["total"] or Decimal("0.00")
    StudentProfile.objects.filter(pk=student_profile.pk).update(cached_total_hours=total)


@receiver(pre_save, sender=ServiceHour)
def servicehour_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = ServiceHour.objects.get(pk=instance.pk)
            instance._old_student_id = old.student_id
        except ServiceHour.DoesNotExist:
            instance._old_student_id = None


@receiver(post_save, sender=ServiceHour)
def servicehour_post_save(sender, instance, created, **kwargs):
    _recompute_cached_total(instance.student)
    old_id = getattr(instance, "_old_student_id", None)
    if old_id and old_id != instance.student_id:
        try:
            old_student = StudentProfile.objects.get(pk=old_id)
            _recompute_cached_total(old_student)
        except StudentProfile.DoesNotExist:
            pass


@receiver(post_delete, sender=ServiceHour)
def servicehour_post_delete(sender, instance, **kwargs):
    _recompute_cached_total(instance.student)

class LeaderboardEntry(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="leaderboard_entries")
    rank = models.PositiveIntegerField()
    total_hours = models.DecimalField(max_digits=7, decimal_places=2)

    class Meta:
        unique_together = ("student", "rank")
        ordering = ["rank"]

    def __str__(self):
        return f"Rank {self.rank}: {self.student.user.username} with {self.total_hours} hours"
