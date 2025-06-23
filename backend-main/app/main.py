from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .account_schema.schema import UserRegister, UserLogin
from .user_account.auth import register_user, login_user, forgot_password, get_all_users
from .settings import settings

app = FastAPI(title=settings.PROJECT_NAME)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    return await register_user(user_data)

@app.post("/login")
async def login(user_data: UserLogin):
    return await login_user(user_data)

@app.post("/forgot-password")
async def reset_password(email: str):
    return await forgot_password(email)

@app.get("/users", status_code=status.HTTP_200_OK)
async def get_users():
    """
    Get all user details from Firebase.
    Returns a list of users with their complete information.
    """
    return await get_all_users()

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}
