from fastapi import FastAPI, HTTPException, Depends
# from fastapi.security import OAuth2PasswordBearer
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from firebase_config import db, auth
from pydantic import BaseModel
import hashlib

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
async def home():
    return {"message": "Hello, FocusBoost Backend!"}

# Security Scheme
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
oauth2_scheme = HTTPBearer()

# Pydantic Models
class User(BaseModel):
    email: str
    password: str

class SessionStart(BaseModel):
    child_id: str

# Helper Functions
# def get_current_user(token: str = Depends(oauth2_scheme)):
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    token = credentials.credentials
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

@app.post("/login")
async def login(user: User):
    try:
        # Get user by email
        user_record = auth.get_user_by_email(user.email)
        
        # Create custom token
        custom_token = auth.create_custom_token(user_record.uid)
        
        return {
            "token": custom_token.decode(),
            "uid": user_record.uid
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

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
    

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8000) 