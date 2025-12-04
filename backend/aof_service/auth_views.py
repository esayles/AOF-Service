"""Views for authentication-related endpoints."""

from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken

from google.oauth2 import id_token

from .models import StudentProfile

User = get_user_model()


class GoogleAuthView(APIView):
    """Exchange a Google id_token for a JWT and ensure the user exists in the local database."""

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        token = request.data.get('id_token')
        if not token:
            return Response({'detail': 'id_token missing'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from google.auth.transport.requests import Request as GoogleRequest
        except Exception as exc:
            return Response({'detail': 'server misconfiguration: google auth transport requires `requests`', 'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(token, GoogleRequest())
        except Exception as exc:
            return Response({'detail': 'invalid id_token', 'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # Get email and sub
        email = idinfo.get('email')
        if not email:
            return Response({'detail': 'id_token does not contain email'}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(email=email, defaults={
            'username': email.split('@')[0],
        })

        if not hasattr(user, 'student_profile'):
            user.role = getattr(user, 'role', 'student')
            user.save()
            StudentProfile.objects.get_or_create(user=user)

        # Issue JWTs
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.pk,
                'email': user.email,
                'username': user.username,
            }
        })
