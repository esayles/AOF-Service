# AOF Service Tracker

**To get an access token:**

**on your computer, run:**

cd backend
-run the command to activate venv on your computer
python manage.py import_data

**then run:**

python manage.py shell

**then:**

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

user = User.objects.get(email=“YOUR_EMAIL”)

refresh = RefreshToken.for_user(user)
access_token = refresh.access_token

print("ACCESS:", str(access_token))
print("REFRESH:", str(refresh))
