"""Email notifications for service-hour verification.

Uses Django's email framework, so the actual transport is controlled by
settings/environment variables (console backend locally, SMTP/Amazon SES
in production). Never hardcode credentials or recipients here.
"""

import logging

from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_verification_request(service_hour):
    """Notify the requested faculty verifier that a student logged hours.

    Failures are logged, never raised — a broken mail server should not
    prevent a student from logging hours.
    """
    verifier = service_hour.request_verifier
    if verifier is None or not verifier.email:
        return False

    student_user = service_hour.student.user
    subject = "Service Hour Verification Request"
    message = (
        f"Dear {verifier.first_name or verifier.username},\n\n"
        f"{student_user.first_name} {student_user.last_name} has logged "
        f"{service_hour.hours} service hour(s) on {service_hour.date_performed} "
        f"and requested your verification.\n\n"
        f"Description: {service_hour.description}\n\n"
        f"Please log in to the AOF Service app to confirm these hours.\n"
    )

    try:
        send_mail(subject, message, None, [verifier.email], fail_silently=False)
        return True
    except Exception:
        logger.exception(
            "Failed to send verification email for ServiceHour %s", service_hour.pk
        )
        return False
