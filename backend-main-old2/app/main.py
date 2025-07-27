# app/main.py
# Updated to include child management endpoints

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import firestore
from datetime import datetime
import random
import string

# Your existing imports
from .account_schema.schema import (
    UserRegister, UserLogin, 
    ChildCreate, ChildResponse, ChildUpdate
)
from .user_account.auth import register_user, login_user, forgot_password, get_all_users
from .settings import settings

app = FastAPI(title=settings.PROJECT_NAME)

# Configure CORS (your existing setup)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper functions for child profiles
def generate_avatar_url(seed: str) -> str:
    """Generate avatar URL using DiceBear API"""
    return f"https://api.dicebear.com/7.x/adventurer/svg?seed={seed}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf&backgroundType=solid"

def generate_random_seed() -> str:
    """Generate random seed for avatar"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=10))

# ==========================================
# YOUR EXISTING AUTH ENDPOINTS (unchanged)
# ==========================================

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
    """Get all user details from Firebase."""
    return await get_all_users()

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}

# ==========================================
# NEW: CHILD MANAGEMENT ENDPOINTS
# ==========================================

@app.post("/api/children", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
async def create_child(child_data: ChildCreate):
    """Create child profile"""
    try:
        db = firestore.client()
        
        # Generate seed and avatar
        seed = child_data.seed or generate_random_seed()
        avatar_url = generate_avatar_url(seed)
        
        # Create child document
        child_doc = {
            'name': child_data.name,
            'age': child_data.age,
            'parentId': child_data.parentId,
            'avatar': avatar_url,
            'seed': seed,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        # Add to Firestore
        doc_ref = db.collection('children').add(child_doc)
        child_id = doc_ref[1].id
        
        return ChildResponse(
            id=child_id,
            name=child_data.name,
            age=child_data.age,
            parentId=child_data.parentId,
            avatar=avatar_url,
            seed=seed,
            createdAt=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating child: {str(e)}"
        )

@app.get("/api/children/{parent_id}")
async def get_children_by_parent(parent_id: str):
    """Get all children for parent"""
    try:
        db = firestore.client()
        
        children_ref = db.collection('children').where('parentId', '==', parent_id)
        children_docs = children_ref.stream()
        
        children = []
        for doc in children_docs:
            child_data = doc.to_dict()
            child_data['id'] = doc.id
            
            # Convert datetime to string
            if 'createdAt' in child_data:
                child_data['createdAt'] = child_data['createdAt'].isoformat()
            if 'updatedAt' in child_data:
                child_data['updatedAt'] = child_data['updatedAt'].isoformat()
            
            # Ensure avatar exists
            if 'avatar' not in child_data or not child_data['avatar']:
                seed = child_data.get('seed', generate_random_seed())
                child_data['avatar'] = generate_avatar_url(seed)
                child_data['seed'] = seed
            
            children.append(child_data)
        
        return {
            "success": True,
            "children": children,
            "count": len(children)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching children: {str(e)}"
        )

@app.get("/api/children/child/{child_id}")
async def get_child_by_id(child_id: str):
    """Get specific child by ID"""
    try:
        db = firestore.client()
        
        child_ref = db.collection('children').document(child_id)
        child_doc = child_ref.get()
        
        if not child_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found"
            )
        
        child_data = child_doc.to_dict()
        child_data['id'] = child_doc.id
        
        # Convert datetime to string
        if 'createdAt' in child_data:
            child_data['createdAt'] = child_data['createdAt'].isoformat()
        if 'updatedAt' in child_data:
            child_data['updatedAt'] = child_data['updatedAt'].isoformat()
        
        return {
            "success": True,
            "child": child_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching child: {str(e)}"
        )

@app.put("/api/children/{child_id}")
async def update_child(child_id: str, child_update: ChildUpdate):
    """Update child profile"""
    try:
        db = firestore.client()
        
        child_ref = db.collection('children').document(child_id)
        child_doc = child_ref.get()
        
        if not child_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found"
            )
        
        # Prepare update data
        update_data = {'updatedAt': datetime.now()}
        
        if child_update.name is not None:
            update_data['name'] = child_update.name
        if child_update.age is not None:
            update_data['age'] = child_update.age
        if child_update.seed is not None:
            update_data['seed'] = child_update.seed
            update_data['avatar'] = generate_avatar_url(child_update.seed)
        
        # Update document
        child_ref.update(update_data)
        
        # Return updated data
        updated_doc = child_ref.get()
        updated_data = updated_doc.to_dict()
        updated_data['id'] = updated_doc.id
        
        # Convert datetime to string
        if 'createdAt' in updated_data:
            updated_data['createdAt'] = updated_data['createdAt'].isoformat()
        if 'updatedAt' in updated_data:
            updated_data['updatedAt'] = updated_data['updatedAt'].isoformat()
        
        return {
            "success": True,
            "child": updated_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating child: {str(e)}"
        )

@app.delete("/api/children/{child_id}")
async def delete_child(child_id: str):
    """Delete child profile"""
    try:
        db = firestore.client()
        
        child_ref = db.collection('children').document(child_id)
        child_doc = child_ref.get()
        
        if not child_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found"
            )
        
        child_ref.delete()
        
        return {
            "success": True,
            "message": "Child profile deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting child: {str(e)}"
        )

# ==========================================
# UPDATED HEALTH CHECK
# ==========================================

@app.get("/health")
async def health_check():
    """Health check with child management"""
    try:
        db = firestore.client()
        
        # Test Firebase connection
        test_collection = db.collection('children').limit(1).stream()
        children_accessible = len(list(test_collection)) >= 0
        
        return {
            "status": "healthy",
            "features": {
                "authentication": "enabled",
                "child_management": "enabled",
                "firebase": "connected"
            },
            "endpoints": {
                "auth": ["/register", "/login", "/users"],
                "children": [
                    "POST /api/children",
                    "GET /api/children/{parent_id}",
                    "GET /api/children/child/{child_id}",
                    "PUT /api/children/{child_id}",
                    "DELETE /api/children/{child_id}"
                ]
            },
            "data": {
                "firebase_connection": "working",
                "children_collection": "accessible" if children_accessible else "error"
            }
        }
        
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "features": {
                "authentication": "enabled",
                "child_management": "error",
                "firebase": "error"
            }
        }