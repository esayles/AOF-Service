from datetime import date
from decimal import Decimal

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

        res = self.client.post("/api/service-logs/", payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        # response should include 'student' which is the profile id
        self.assertEqual(int(res.data["student"]), self.student_profile.pk)

    def test_student_cannot_confirm_servicehour(self):
        # create a servicehour with the student
        sh = ServiceHour.objects.create(student=self.student_profile, description="Test", hours=1.0, date_performed=date.today())

        self.client.force_authenticate(user=self.student_user)
        res = self.client.post(f"/api/service-logs/{sh.pk}/confirm/")
        self.assertEqual(res.status_code, 403)

    def test_faculty_can_confirm_servicehour(self):
        sh = ServiceHour.objects.create(student=self.student_profile, description="Test 2", hours=2.0, date_performed=date.today())

        self.client.force_authenticate(user=self.faculty_user)
        res = self.client.post(f"/api/service-logs/{sh.pk}/confirm/")
        self.assertEqual(res.status_code, 200, res.content)

        sh.refresh_from_db()
        self.assertEqual(sh.confirmed_by.pk, self.faculty_user.pk)
        self.assertIsNotNone(sh.confirmed_at)

class LeaderboardViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # a viewer user to authenticate for leaderboard requests
        self.viewer = User.objects.create_user(username="viewer", password="pass", email="viewer@example.com")

    def test_leaderboard_ordering_by_total_hours(self):
        # create three students with different totals: 5, 10, 7
        u1 = User.objects.create_user(username="stu_a", password="pass", email="a@example.com")
        p1 = StudentProfile.objects.create(user=u1, year_in_school=StudentProfile.FRESHMAN)
        ServiceHour.objects.create(student=p1, description="A", hours=Decimal("5.00"), date_performed=date.today())

        u2 = User.objects.create_user(username="stu_b", password="pass", email="b@example.com")
        p2 = StudentProfile.objects.create(user=u2, year_in_school=StudentProfile.FRESHMAN)
        ServiceHour.objects.create(student=p2, description="B", hours=Decimal("10.00"), date_performed=date.today())

        u3 = User.objects.create_user(username="stu_c", password="pass", email="c@example.com")
        p3 = StudentProfile.objects.create(user=u3, year_in_school=StudentProfile.FRESHMAN)
        ServiceHour.objects.create(student=p3, description="C", hours=Decimal("7.00"), date_performed=date.today())

        self.client.force_authenticate(user=self.viewer)
        res = self.client.get("/api/leaderboard/")
        self.assertEqual(res.status_code, 200, res.content)

        usernames = [r["username"] for r in res.data]
        self.assertEqual(usernames, ["stu_b", "stu_c", "stu_a"])  # 10, 7, 5
        totals = [r["total_hours"] for r in res.data]
        self.assertEqual(totals[0], "10.00")

    def test_leaderboard_limits_to_top_10(self):
        # create 12 students with increasing hours 1..12
        for i in range(1, 13):
            u = User.objects.create_user(username=f"stu_{i}", password="pass", email=f"{i}@example.com")
            p = StudentProfile.objects.create(user=u, year_in_school=StudentProfile.FRESHMAN)
            ServiceHour.objects.create(student=p, description=f"hours_{i}", hours=Decimal(f"{i}.00"), date_performed=date.today())

        self.client.force_authenticate(user=self.viewer)
        res = self.client.get("/api/leaderboard/")
        self.assertEqual(res.status_code, 200, res.content)
        # should be limited to top 10
        self.assertEqual(len(res.data), 10)
        # top should be the student with 12 hours
        self.assertEqual(res.data[0]["username"], "stu_12")
