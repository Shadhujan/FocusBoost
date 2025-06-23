import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, status
from ..account_schema.schema import UserRegister, UserLogin, UserResponse
import os
from typing import List, Dict, Any

# Initialize Firebase Admin with credentials file
cred = credentials.Certificate("app/firebase-credentials.json")
firebase_admin.initialize_app(cred)

async def register_user(user_data: UserRegister) -> UserResponse:
    try:
        # Check if passwords match
        if user_data.password != user_data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
        
        # Check if terms are agreed
        if not user_data.agree_to_terms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must agree to the terms and conditions"
            )

        # Create user in Firebase
        user = auth.create_user(
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.full_name
        )

        # Create custom claims for additional user data
        auth.set_custom_user_claims(
            user.uid,
            {
                "country": user_data.country
            }
        )

        return UserResponse(
            id=user.uid,
            full_name=user_data.full_name,
            email=user_data.email,
            country=user_data.country
        )

    except auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

async def login_user(user_data: UserLogin) -> dict:
    try:
        # Verify user credentials with Firebase
        user = auth.get_user_by_email(user_data.email)
        
        # Create custom token for the user
        custom_token = auth.create_custom_token(user.uid)
        
        return {
            "access_token": custom_token,
            "token_type": "bearer",
            "user_id": user.uid,
            "email": user.email,
            "full_name": user.display_name
        }

    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

async def forgot_password(email: str) -> dict:
    try:
        # Send password reset email
        auth.generate_password_reset_link(email)
        return {"message": "Password reset email sent successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

async def get_all_users() -> List[Dict[str, Any]]:
    try:
        # Get all users from Firebase
        users = auth.list_users()
        
        # Transform user data into a list of dictionaries
        user_list = []
        for user in users.users:
            # Get custom claims for additional user data
            custom_claims = user.custom_claims or {}
            
            user_data = {
                "uid": user.uid,
                "email": user.email,
                "display_name": user.display_name,
                "phone_number": user.phone_number,
                "photo_url": user.photo_url,
                "email_verified": user.email_verified,
                "disabled": user.disabled,
                "created_at": user.user_metadata.creation_timestamp,
                "last_sign_in": user.user_metadata.last_sign_in_timestamp,
                "country": custom_claims.get("country", ""),
                "provider_data": [
                    {
                        "provider_id": provider.provider_id,
                        "uid": provider.uid,
                        "display_name": provider.display_name,
                        "email": provider.email,
                        "phone_number": provider.phone_number,
                        "photo_url": provider.photo_url
                    }
                    for provider in user.provider_data
                ]
            }
            user_list.append(user_data)
            
        return user_list

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        ) 