from datetime import date

from django.core import mail
from django.test import TestCase, override_settings

from aof_service.emails import send_approval_request
from aof_service.models import ServiceHour, StudentProfile, User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class ApprovalEmailTests(TestCase):
    def setUp(self):
        self.student_user = User.objects.create_user(
            username="student@example.com",
            email="student@example.com",
            password="pass",
            first_name="Sam",
            last_name="Student",
        )
        self.profile = StudentProfile.objects.create(user=self.student_user)
        self.faculty = User.objects.create_user(
            username="teacher@example.com",
            email="teacher@example.com",
            password="pass",
            first_name="Terry",
            last_name="Teacher",
            role=User.FACULTY,
        )

    def _log(self, approver=None):
        return ServiceHour.objects.create(
            student=self.profile,
            description="Raked leaves",
            hours=2,
            date_performed=date.today(),
            request_verifier=approver,
        )

    @override_settings(EMAIL_TEST_REDIRECT_TO="")
    def test_sends_to_requested_approver(self):
        self.assertTrue(send_approval_request(self._log(self.faculty)))
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["teacher@example.com"])
        self.assertEqual(mail.outbox[0].subject, "Service Hour Approval Request")
        self.assertIn("requested your approval", mail.outbox[0].body)

    @override_settings(EMAIL_TEST_REDIRECT_TO="inbox@example.com")
    def test_redirect_diverts_mail_away_from_faculty(self):
        self.assertTrue(send_approval_request(self._log(self.faculty)))
        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        # The teacher must not be contacted...
        self.assertEqual(sent.to, ["inbox@example.com"])
        # ...but the redirected copy still records who it was meant for.
        self.assertIn("teacher@example.com", sent.subject)
        self.assertTrue(sent.subject.startswith("[TEST ->"))

    @override_settings(EMAIL_TEST_REDIRECT_TO="", SERVICE_HOUR_APP_URL="https://service.example.com/")
    def test_body_links_to_configured_app_url(self):
        send_approval_request(self._log(self.faculty))
        # Trailing slash is stripped so the sentence reads cleanly.
        self.assertIn("https://service.example.com to approve", mail.outbox[0].body)

    @override_settings(EMAIL_TEST_REDIRECT_TO="", SERVICE_HOUR_APP_URL="")
    def test_missing_app_url_omits_link_rather_than_guessing(self):
        send_approval_request(self._log(self.faculty))
        body = mail.outbox[0].body
        self.assertIn("log in to the AOF Service app", body)
        self.assertNotIn("http", body)

    def test_no_approver_sends_nothing(self):
        self.assertFalse(send_approval_request(self._log(None)))
        self.assertEqual(len(mail.outbox), 0)
