from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient

from aof_service.models import User, StudentProfile


class GoogleAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('aof_service.auth_views.id_token.verify_oauth2_token')
    def test_google_auth_creates_user_and_returns_tokens(self, mock_verify):
        mock_verify.return_value = {
            'email': 'student3@example.com',
            'sub': '12345',
            'email_verified': True,
        }

        res = self.client.post('/api/auth/google/', {'id_token': 'fake-token'}, format='json')
        self.assertEqual(res.status_code, 200, res.content)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertIn('user', res.data)

        user = User.objects.get(email='student3@example.com')
        self.assertIsNotNone(user)
        self.assertTrue(hasattr(user, 'student_profile'))

    def test_google_auth_missing_token_returns_400(self):
        res = self.client.post('/api/auth/google/', {}, format='json')
        self.assertEqual(res.status_code, 400)

    @patch('aof_service.auth_views.id_token.verify_oauth2_token')
    def test_google_auth_invalid_token_returns_400(self, mock_verify):
        mock_verify.side_effect = ValueError('invalid')

        res = self.client.post('/api/auth/google/', {'id_token': 'bad'}, format='json')
        self.assertEqual(res.status_code, 400)

    @patch('aof_service.auth_views.id_token.verify_oauth2_token')
    def test_api_root_post_with_google_token(self, mock_verify):
        mock_verify.return_value = {
            'email': 'student4@example.com',
            'sub': '12345',
            'email_verified': True,
        }

        res = self.client.post('/api/', {'id_token': 'fake-token'}, format='json')
        self.assertEqual(res.status_code, 200, res.content)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertIn('user', res.data)

        user = User.objects.get(email='student4@example.com')
        self.assertIsNotNone(user)
        self.assertTrue(hasattr(user, 'student_profile'))
