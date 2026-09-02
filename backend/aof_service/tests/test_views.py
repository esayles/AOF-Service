from datetime import date
from decimal import Decimal

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

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
        self.other_faculty_user = User.objects.create_user(username="faculty3", password="pass", email="f3@example.com", role=User.FACULTY)

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

    def test_student_cannot_choose_another_student_when_creating_a_log(self):
        other_user = User.objects.create_user(username="student3", password="pass", email="s3@example.com")
        other_profile = StudentProfile.objects.create(user=other_user)
        self.client.force_authenticate(user=self.student_user)

        res = self.client.post("/api/service-logs/", {
            "student": other_profile.pk,
            "description": "Attempt to alter another student",
            "hours": "1.00",
            "date_performed": date.today().isoformat(),
        }, format="json")

        self.assertEqual(res.status_code, 400, res.content)
        self.assertIn("student", res.data)

    #Tests that: user is student, creates a service hour with a requested verifier, and checks that a verification email is sent to the faculty member. The test uses Django's locmem email backend to capture the email in memory for assertions.
    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_student_create_with_verifier_sends_verification_email(self):
        self.client.force_authenticate(user=self.student_user)

        payload = {
            "description": "Volunteer shift",
            "hours": "3.00",
            "date_performed": date.today().isoformat(),
            "request_verifier": self.faculty_user.pk,
        }

        res = self.client.post("/api/service-logs/", payload, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.faculty_user.email])
        self.assertIn("verification request", mail.outbox[0].subject.lower())
        self.assertIn("Volunteer shift", mail.outbox[0].body)

    def test_student_cannot_confirm_servicehour(self):
        # create a servicehour with the student
        sh = ServiceHour.objects.create(student=self.student_profile, description="Test", hours=1.0, date_performed=date.today())

        self.client.force_authenticate(user=self.student_user)
        res = self.client.post(f"/api/service-logs/{sh.pk}/confirm/")
        self.assertEqual(res.status_code, 403)

    def test_faculty_can_confirm_servicehour(self):
        sh = ServiceHour.objects.create(
            student=self.student_profile,
            description="Test 2",
            hours=2.0,
            date_performed=date.today(),
            request_verifier=self.faculty_user,
        )

        self.client.force_authenticate(user=self.faculty_user)
        res = self.client.post(f"/api/service-logs/{sh.pk}/confirm/")
        self.assertEqual(res.status_code, 200, res.content)

        sh.refresh_from_db()
        self.assertEqual(sh.confirmed_by.pk, self.faculty_user.pk)
        self.assertIsNotNone(sh.confirmed_at)

    def test_faculty_only_sees_logs_requested_from_them(self):
        assigned_log = ServiceHour.objects.create(
            student=self.student_profile,
            description="Assigned to this faculty member",
            hours=Decimal("1.00"),
            date_performed=date.today(),
            request_verifier=self.faculty_user,
        )
        ServiceHour.objects.create(
            student=self.student_profile,
            description="Assigned to another faculty member",
            hours=Decimal("1.00"),
            date_performed=date.today(),
            request_verifier=self.other_faculty_user,
        )
        ServiceHour.objects.create(
            student=self.student_profile,
            description="No verifier requested",
            hours=Decimal("1.00"),
            date_performed=date.today(),
        )
        self.client.force_authenticate(user=self.faculty_user)

        res = self.client.get("/api/service-logs/")

        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual([log["id"] for log in res.data], [assigned_log.pk])

    def test_faculty_can_add_confirmed_hours_for_a_student(self):
        self.client.force_authenticate(user=self.faculty_user)

        res = self.client.post("/api/service-logs/", {
            "student": self.student_profile.pk,
            "description": "Faculty-recorded event",
            "hours": "2.50",
            "date_performed": date.today().isoformat(),
        }, format="json")

        self.assertEqual(res.status_code, 201, res.content)
        service_hour = ServiceHour.objects.get(pk=res.data["id"])
        self.assertEqual(service_hour.student, self.student_profile)
        self.assertEqual(service_hour.confirmed_by, self.faculty_user)
        self.assertIsNotNone(service_hour.confirmed_at)

    def test_admin_created_service_hours_remain_pending(self):
        admin_user = User.objects.create_user(
            username="admin2",
            password="pass",
            email="admin2@example.com",
            role=User.ADMIN,
        )
        self.client.force_authenticate(user=admin_user)

        res = self.client.post("/api/service-logs/", {
            "student": self.student_profile.pk,
            "description": "Admin test submission",
            "hours": "2.50",
            "date_performed": date.today().isoformat(),
        }, format="json")

        self.assertEqual(res.status_code, 201, res.content)
        service_hour = ServiceHour.objects.get(pk=res.data["id"])
        self.assertIsNone(service_hour.confirmed_by)
        self.assertIsNone(service_hour.confirmed_at)

    def test_faculty_can_edit_a_student_service_log(self):
        service_hour = ServiceHour.objects.create(
            student=self.student_profile,
            description="Original description",
            hours=Decimal("1.00"),
            date_performed=date.today(),
            request_verifier=self.faculty_user,
        )
        self.client.force_authenticate(user=self.faculty_user)

        res = self.client.patch(
            f"/api/service-logs/{service_hour.pk}/",
            {"description": "Corrected description", "hours": "1.50"},
            format="json",
        )

        self.assertEqual(res.status_code, 200, res.content)
        service_hour.refresh_from_db()
        self.assertEqual(service_hour.description, "Corrected description")
        self.assertEqual(service_hour.hours, Decimal("1.50"))

    def test_faculty_can_decline_a_pending_service_log(self):
        service_hour = ServiceHour.objects.create(
            student=self.student_profile,
            description="Declined submission",
            hours=Decimal("1.00"),
            date_performed=date.today(),
            request_verifier=self.faculty_user,
        )
        self.client.force_authenticate(user=self.faculty_user)

        res = self.client.delete(f"/api/service-logs/{service_hour.pk}/")

        self.assertEqual(res.status_code, 204, res.content)
        self.assertFalse(ServiceHour.objects.filter(pk=service_hour.pk).exists())

    def test_student_cannot_edit_confirmed_service_hours(self):
        service_hour = ServiceHour.objects.create(
            student=self.student_profile,
            description="Confirmed entry",
            hours=Decimal("1.00"),
            date_performed=date.today(),
            confirmed_by=self.faculty_user,
        )
        self.client.force_authenticate(user=self.student_user)

        res = self.client.patch(
            f"/api/service-logs/{service_hour.pk}/",
            {"hours": "2.00"},
            format="json",
        )

        self.assertEqual(res.status_code, 403, res.content)

    def test_students_list_is_staff_only(self):
        self.client.force_authenticate(user=self.student_user)
        self.assertEqual(self.client.get("/api/students/").status_code, 403)

        self.client.force_authenticate(user=self.faculty_user)
        res = self.client.get("/api/students/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.data[0]["id"], self.student_profile.pk)
        self.assertEqual(res.data[0]["email"], self.student_user.email)

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


class AdminUserManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin-user",
            password="pass",
            email="admin@example.com",
            role=User.ADMIN,
        )
        self.student = User.objects.create_user(
            username="student-user",
            password="pass",
            email="student@example.com",
            role=User.STUDENT,
        )

    def upload_csv(self, content):
        return self.client.post(
            "/api/admin/users/import/",
            {"file": SimpleUploadedFile("users_import.csv", content.encode("utf-8"), content_type="text/csv")},
            format="multipart",
        )

    def test_only_admins_can_list_or_import_users(self):
        self.client.force_authenticate(user=self.student)
        self.assertEqual(self.client.get("/api/admin/users/").status_code, 403)
        self.assertEqual(self.upload_csv("First Name,Last Name,Email 1,Roles\nNew,User,new@example.com,Student\n").status_code, 403)

    def test_admin_can_import_and_update_users_from_school_csv(self):
        existing = User.objects.create_user(
            username="existing@example.com",
            password="pass",
            email="existing@example.com",
            first_name="Old",
            last_name="Name",
            role=User.STUDENT,
        )
        self.client.force_authenticate(user=self.admin)
        csv_content = (
            "Person ID,Full Name,First Name,Preferred Name,Last Name,Email 1,Roles\n"
            '1,"New, Student",New,,Student,new@example.com,"Student (11-D)"\n'
            '2,"Faculty, Member",Faculty,,Member,faculty@example.com,Staff\n'
            '3,"Existing, Updated",Existing,,Updated,existing@example.com,Staff\n'
        )

        res = self.upload_csv(csv_content)

        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.data["created"], 2)
        self.assertEqual(res.data["updated"], 1)
        self.assertEqual(res.data["total_processed"], 3)
        new_student = User.objects.get(email="new@example.com")
        self.assertEqual(new_student.role, User.STUDENT)
        self.assertTrue(StudentProfile.objects.filter(user=new_student).exists())
        self.assertEqual(User.objects.get(email="faculty@example.com").role, User.FACULTY)
        existing.refresh_from_db()
        self.assertEqual(existing.last_name, "Updated")
        self.assertEqual(existing.role, User.FACULTY)

        list_response = self.client.get("/api/admin/users/")
        self.assertEqual(list_response.status_code, 200, list_response.content)
        self.assertIn("new@example.com", [user["email"] for user in list_response.data])

    def test_import_does_not_demote_an_existing_admin(self):
        self.client.force_authenticate(user=self.admin)
        csv_content = (
            "First Name,Last Name,Email 1,Roles\n"
            "Admin,User,admin@example.com,Student (12-B)\n"
        )

        res = self.upload_csv(csv_content)

        self.assertEqual(res.status_code, 200, res.content)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.role, User.ADMIN)

    def test_admin_can_change_another_users_role_and_remove_them(self):
        target = User.objects.create_user(
            username="target-user",
            password="pass",
            email="target@example.com",
            role=User.STUDENT,
        )
        self.client.force_authenticate(user=self.admin)

        update_res = self.client.patch(
            f"/api/admin/users/{target.pk}/",
            {"role": User.FACULTY},
            format="json",
        )

        self.assertEqual(update_res.status_code, 200, update_res.content)
        target.refresh_from_db()
        self.assertEqual(target.role, User.FACULTY)

        delete_res = self.client.delete(f"/api/admin/users/{target.pk}/")
        self.assertEqual(delete_res.status_code, 204, delete_res.content)
        self.assertFalse(User.objects.filter(pk=target.pk).exists())

    def test_admin_cannot_delete_or_demote_their_own_account(self):
        self.client.force_authenticate(user=self.admin)

        self.assertEqual(
            self.client.patch(
                f"/api/admin/users/{self.admin.pk}/",
                {"role": User.FACULTY},
                format="json",
            ).status_code,
            403,
        )
        self.assertEqual(self.client.delete(f"/api/admin/users/{self.admin.pk}/").status_code, 403)

    def test_invalid_csv_does_not_import_a_partial_set_of_users(self):
        self.client.force_authenticate(user=self.admin)
        csv_content = (
            "First Name,Last Name,Email 1,Roles\n"
            "Valid,Person,valid@example.com,Student\n"
            "Bad,Address,not-an-email,Staff\n"
        )

        res = self.upload_csv(csv_content)

        self.assertEqual(res.status_code, 400, res.content)
        self.assertFalse(User.objects.filter(email="valid@example.com").exists())
