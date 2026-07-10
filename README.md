# AOF Service Tracker

we should update this readme

## Creating .env files for loading private Google OAuth credentials (SECRET and ID)

**Install dotenv**

```
source venv/bin/activate
pip install python-dotenv
```

**Create a .env file in AOF Service root directory** 

Contents:
```
GOOGLE_CLIENT_ID=code_provided_upon_request
GOOGLE_CLIENT_SECRET=code_provided_upon_request
```

**Create another .env file in AOF-Service/frontend** 

Contents:
```
REACT_APP_GOOGLE_CLIENT_ID=code_provided_upon_request (same as one as GOOGLE_CLIENT_ID)
```





## To obtain an access token:



**Activate venv + import user data**

```

cd backend

source venv/bin/activate

python manage.py import_data

```

**Activate shell**

```

python manage.py shell

```

**Token relay**

```

from django.contrib.auth import get_user_model

from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

user = User.objects.get(email="YOUR AOF EMAIL")

refresh = RefreshToken.for_user(user)

access_token = refresh.access_token

print("ACCESS TOKEN:", str(access_token))

```

>if you load your token into local storage, make sure that you name it "access" 
