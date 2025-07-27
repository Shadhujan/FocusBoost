# app/account_schema/schema.py
# ADD these child schemas to your existing file

from pydantic import BaseModel, EmailStr, constr, Field
from typing import Optional, Dict

# Your existing auth schemas (keep these unchanged)
class UserRegister(BaseModel):
    full_name: str = Field(..., alias="fullName")
    email: EmailStr
    password: constr(min_length=8)
    confirm_password: str = Field(..., alias="confirmPassword")

    class Config:
        populate_by_name = True
        str_strip_whitespace = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr

# NEW: Add these child schemas
class ChildCreate(BaseModel):
    name: str
    age: int
    parentId: str
    seed: Optional[str] = None

class ChildResponse(BaseModel):
    id: str
    name: str
    age: int
    parentId: str
    avatar: str
    seed: str
    createdAt: str

class ChildUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    seed: Optional[str] = None