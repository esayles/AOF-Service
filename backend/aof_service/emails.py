"""Email notifications for service-hour verification.

Uses Django's email framework, so the actual transport is controlled by
settings/environment variables (console backend locally, SMTP/Amazon SES
in production). Never hardcode credentials or recipients here.
"""

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_app_mail(subject, message, recipients):
    """Send one message, honouring the testing redirect. Never raises.

    Every outgoing email in the app should go through this function rather
    than calling send_mail directly, so two protections always apply:

    1. settings.EMAIL_TEST_REDIRECT_TO — when set (non-production
       deployments), the message is delivered to that single address instead
       of the real recipient. The intended recipients are kept in the subject
       so the redirected copy is still readable. This is what lets students
       exercise the verification flow without emailing faculty about hours
       that do not exist.
    2. Failures are logged, never raised. A broken mail server should not
       stop a student from logging their hours.

    Returns True when the message was handed to the mail backend.
    """
    recipients = [address for address in recipients if address]
    if not recipients:
        return False

    redirect_to = getattr(settings, "EMAIL_TEST_REDIRECT_TO", "")
    if redirect_to:
        subject = f"[TEST -> {', '.join(recipients)}] {subject}"
        recipients = [redirect_to]

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            recipients,
            fail_silently=False,
        )
        return True
    except Exception:
        logger.exception("Failed to send %r to %s", subject, ", ".join(recipients))
        return False


def send_verification_request(service_hour):
    """Notify the requested faculty verifier that a student logged hours."""
    verifier = service_hour.request_verifier
    if verifier is None or not verifier.email:
        return False

    student_user = service_hour.student.user

    # Each settings module defines this for its own deployment, so testing
    # email never points faculty at production and vice versa. If it is
    # somehow unset, omit the link rather than sending a wrong one.
    app_url = getattr(settings, "SERVICE_HOUR_APP_URL", "").rstrip("/")
    closing = (
        f"Please log in to {app_url} to confirm these hours.\n"
        if app_url
        else "Please log in to the AOF Service app to confirm these hours.\n"
    )

    subject = "Service Hour Verification Request"
    message = (
        f"Dear {verifier.first_name or verifier.username},\n\n"
        f"{student_user.first_name} {student_user.last_name} has logged "
        f"{service_hour.hours} service hour(s) on {service_hour.date_performed} "
        f"and requested your verification.\n\n"
        f"Description: {service_hour.description}\n\n"
        f"{closing}"
    )

    return send_app_mail(subject, message, [verifier.email])
