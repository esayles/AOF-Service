# AOF Service Tracker


## Creating a .env file for loading private Google OAuth credentials (SECRET and ID)

**Install dotenv**

```
source venv/bin/activate
pip install python-dotenv
```

**Create a .env file in AOF Service root directory** 

Contents should be:
```
GOOGLE_CLIENT_ID=CODE_PROVIDED_UPON_REQUEST
GOOGLE_CLIENT_SECRET=CODE_PROVIDED_UPON_REQUEST
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

>if you load your token into local storage, make sure that you name it "access", or else the front end will look for the wrong thing. 
