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