from pydantic import BaseModel, EmailStr, constr, Field
from typing import Optional

class UserRegister(BaseModel):
    # these field names and aliases now exactly match your front-end keys
    full_name: str                 = Field(..., alias="fullName")
    email:      EmailStr
    password:   constr(min_length=8)
    confirm_password: str         = Field(..., alias="confirmPassword")

    class Config:
        populate_by_name = True        # ← was allow_population_by_field_name
        str_strip_whitespace = True    # ← was anystr_strip_whitespace

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    #country: str 