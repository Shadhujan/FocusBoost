from pydantic import BaseModel, EmailStr, constr
from typing import Optional

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: constr(min_length=6)
    confirm_password: str
    country: Optional[str] = None
    agree_to_terms: bool

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    country: str 