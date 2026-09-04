
# AOF Service Tracker

we should update this readme

### 1. Environment Variables

Install dotenv for managing private credentials:

```bash
source venv/bin/activate
pip install python-dotenv
```

#### Backend Configuration

Create a `.env` file in the AOF Service root directory with your Google OAuth credentials:

```
GOOGLE_CLIENT_ID=code_provided_upon_request
GOOGLE_CLIENT_SECRET=code_provided_upon_request
```

#### Frontend Configuration

Create a `.env` file in `AOF-Service/frontend`:

```
REACT_APP_GOOGLE_CLIENT_ID=code_provided_upon_request
```

> **Note:** Use the same value as `GOOGLE_CLIENT_ID` from the backend

---

## Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver 
```

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

---

## Authentication

### Getting an Access Token

#### 1. Import User Data

```bash
cd backend
source venv/bin/activate
python manage.py import_data
```

#### 2. Open Django Shell

```bash
python manage.py shell
```

#### 3. Generate Token

```python
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()
user = User.objects.get(email="YOUR_AOF_EMAIL")

refresh = RefreshToken.for_user(user)
access_token = refresh.access_token

print("ACCESS TOKEN:", str(access_token))
```

>if you load your token into local storage, make sure that you name it "access"


## Active Changes:

- Admin Debug menu --> Working
- Declined requests Changes
- Fix approval email bug (Sayles)
