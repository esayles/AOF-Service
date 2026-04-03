# AOF Service Tracker



**To obtain an access token:**



**activate venv + import_user data**

```

cd backend

#run the command to activate venv on your machine

python manage.py import_data

```

**activate shell**

```

python manage.py shell

```

**token **

```

from django.contrib.auth import get_user_model

from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

user = User.objects.get(email="YOUR AOF EMAIL")

refresh = RefreshToken.for_user(user)

access_token = refresh.access_token

print("ACCESS TOKEN:", str(access_token))

```
