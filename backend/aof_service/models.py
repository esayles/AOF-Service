from django.contrib.auth.models import AbstractUser
from django.db import models

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

    def __str__(self):
        return f"{self.user.username} ({self.get_year_in_school_display()})"


class ServiceHour(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="service_hours")
    description = models.TextField()
    hours = models.DecimalField(max_digits=5, decimal_places=2)
    confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, limit_choices_to={"role": "faculty"})
    confirmed_at = models.DateTimeField(null=True, blank=True)
    date_performed = models.DateField()

    def __str__(self):
        return f"{self.student.user.username}: {self.hours} hours"
