"""
Views for authentication-related endpoints.

"""

import os
import logging

from django.contrib.auth import get_user_model
from django.db import IntegrityError

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken

from google.oauth2 import id_token
from google.auth.transport.requests import Request as GoogleRequest

from .models import StudentProfile

User = get_user_model()
logger = logging.getLogger(__name__)


class GoogleAuthView(APIView):
    """
    Exchange a Google id_token for JWT tokens.
    Creates the user if they do not already exist.
    
 """

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        token = request.data.get("id_token")
        if not token:
            return Response(
                {"detail": "id_token missing"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        google_client_id = os.environ.get("GOOGLE_CLIENT_ID")
        if not google_client_id:
            logger.error("GOOGLE_CLIENT_ID not configured")
            return Response(
                {"detail": "server misconfiguration"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                GoogleRequest(),
                audience=google_client_id,
            )
        except Exception as exc:
            logger.warning("Invalid Google id_token: %s", exc)
            return Response(
                {"detail": "invalid id_token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = idinfo.get("email")
        email_verified = idinfo.get("email_verified", False)

        if not email or not email_verified:
            return Response(
                {"detail": "verified email required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = email.strip().lower()

        # Use email as username (truncate if needed)
        username_candidate = email
        try:
            max_len = User._meta.get_field("username").max_length
        except Exception:
            max_len = 150
        username_candidate = username_candidate[:max_len]

        user = User.objects.filter(email=email).first()
        created = False

        if not user:
            try:
                user = User.objects.create(
                    email=email,
                    username=username_candidate,
                )
            except IntegrityError:
                return Response(
                    {"detail": "unable to create user"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.set_unusable_password()
            user.role = User.STUDENT
            user.save()

            StudentProfile.objects.get_or_create(user=user)
            created = True

        refresh = RefreshToken.for_user(user)

        logger.info(
            "Google SSO login successful for %s (created=%s)",
            email,
            created,
        )

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.pk,
                    "email": user.email,
                    "username": user.username,
                },
            }
        )
