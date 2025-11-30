from datetime import date, timedelta

from django.test import TestCase, RequestFactory

from aof_service.models import User, StudentProfile, ServiceHour
from aof_service.serializer import ServiceHourSerializer


class ServiceHourSerializerTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(username="student1", password="pass", email="s1@example.com")
        self.student_profile = StudentProfile.objects.create(user=self.user, year_in_school=StudentProfile.FRESHMAN)

        self.faculty = User.objects.create_user(username="faculty1", password="pass", email="f1@example.com", role=User.FACULTY)

    def test_serializer_accepts_valid_data(self):
        data = {
            "description": "Helped at community event",
            "hours": "3.50",
            "date_performed": date.today().isoformat(),
        }

        request = self.factory.post("/fake-path/")
        request.user = self.user

        serializer = ServiceHourSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid(), serializer.errors)

        obj = serializer.save()
        self.assertIsInstance(obj, ServiceHour)
        self.assertEqual(obj.student.pk, self.student_profile.pk)

    def test_hours_must_be_positive(self):
        data = {
            "description": "Negative time",
            "hours": "-1.00",
            "date_performed": date.today().isoformat(),
        }
        request = self.factory.post("/fake-path/")
        request.user = self.user
        serializer = ServiceHourSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("hours", serializer.errors)

    def test_date_performed_cannot_be_future(self):
        future = date.today() + timedelta(days=1)
        data = {
            "description": "Future time",
            "hours": "1.00",
            "date_performed": future.isoformat(),
        }
        request = self.factory.post("/fake-path/")
        request.user = self.user
        serializer = ServiceHourSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("date_performed", serializer.errors)

    def test_create_sets_student_from_request_user_if_missing(self):
        data = {
            "description": "Request-based create",
            "hours": "2.00",
            "date_performed": date.today().isoformat(),
        }

        request = self.factory.post("/fake-path/")
        request.user = self.user

        serializer = ServiceHourSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        obj = serializer.save()
        self.assertEqual(obj.student, self.student_profile)
