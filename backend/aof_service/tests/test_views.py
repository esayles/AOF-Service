from datetime import date

from django.test import TestCase

from rest_framework.test import APIClient

from aof_service.models import User, StudentProfile, ServiceHour


class ServiceHourViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # create student user and profile
        self.student_user = User.objects.create_user(username="student2", password="pass", email="s2@example.com")
        self.student_profile = StudentProfile.objects.create(user=self.student_user, year_in_school=StudentProfile.FRESHMAN)

        # create faculty user
        self.faculty_user = User.objects.create_user(username="faculty2", password="pass", email="f2@example.com", role=User.FACULTY)

    def test_student_create_without_student_uses_request_user(self):
        self.client.force_authenticate(user=self.student_user)

        payload = {
            "description": "Community service",
            "hours": "4.00",
            "date_performed": date.today().isoformat(),
        }

        res = self.client.post("/api/servicehours/", payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        # response should include 'student' which is the profile id
        self.assertEqual(int(res.data["student"]), self.student_profile.pk)

    def test_student_cannot_confirm_servicehour(self):
        # create a servicehour with the student
        sh = ServiceHour.objects.create(student=self.student_profile, description="Test", hours=1.0, date_performed=date.today())

        self.client.force_authenticate(user=self.student_user)
        res = self.client.post(f"/api/servicehours/{sh.pk}/confirm/")
        self.assertEqual(res.status_code, 403)

    def test_faculty_can_confirm_servicehour(self):
        sh = ServiceHour.objects.create(student=self.student_profile, description="Test 2", hours=2.0, date_performed=date.today())

        self.client.force_authenticate(user=self.faculty_user)
        res = self.client.post(f"/api/servicehours/{sh.pk}/confirm/")
        self.assertEqual(res.status_code, 200, res.content)

        sh.refresh_from_db()
        self.assertEqual(sh.confirmed_by.pk, self.faculty_user.pk)
        self.assertIsNotNone(sh.confirmed_at)
