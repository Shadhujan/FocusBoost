# FocusBoost-Backend

1. Project Setup
1.1 Install Dependencies

```
## Create project folder
mkdir Backend
cd Backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate     # Windows

# Install packages
pip install fastapi uvicorn firebase-admin google-cloud-firestore python-jose[cryptography] python-multipart 
```

1.2 Initialize Firebase
>1.Go to Firebase Console → Create Project → FocusBoost.
>2.Enable Authentication (Email/Password).
>3.Create Firestore Database in test mode (for development).
>4.Generate Service Account Key:
>>* Project Settings → Service Accounts → Generate Private Key → Download serviceAccountKey.json.
>5.Place serviceAccountKey.json in your backend folder.

2. Firebase Configuration
2.1 Initialize Firebase Admin SDK
Create firebase_config.py:

```
python
import firebase_admin
from firebase_admin import credentials, firestore, auth

# Initialize Firebase Admin
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# Firestore Database
db = firestore.client()
```

3. FastAPI Setup
3.1 Create main.py
```
python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from firebase_config import db, auth
from pydantic import BaseModel
import hashlib

app = FastAPI()

# Security Scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Pydantic Models
class User(BaseModel):
    email: str
    password: str

class SessionStart(BaseModel):
    child_id: str

# Helper Functions
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@app.post("/register")
async def register(user: User):
    try:
        # Hash password (SHA-256 for simplicity)
        hashed_password = hashlib.sha256(user.password.encode()).hexdigest()
        
        # Create Firebase user
        firebase_user = auth.create_user(
            email=user.email,
            password=hashed_password
        )
        
        # Save to Firestore
        users_ref = db.collection("users").document(firebase_user.uid)
        users_ref.set({"email": user.email, "children": []})
        
        return {"uid": firebase_user.uid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/start_session")
async def start_session(session: SessionStart, user_id: str = Depends(get_current_user)):
    try:
        # Create new session in Firestore
        session_ref = db.collection("users").document(user_id)\
                        .collection("children").document(session.child_id)\
                        .collection("sessions").document()
        
        session_data = {
            "start_time": firestore.SERVER_TIMESTAMP,
            "status": "active"
        }
        
        session_ref.set(session_data)
        return {"session_id": session_ref.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

