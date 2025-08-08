# app/main.py
# Updated to include child management endpoints

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import logging
from firebase_admin import firestore
from datetime import datetime
import random
import string
import base64
import io
from PIL import Image
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from .session_management.session_api import (
    start_study_session, end_study_session, get_session_details,
    get_child_sessions, get_session_analytics, get_active_sessions
)

# Your existing imports
from .account_schema.schema import (
    UserRegister, UserLogin, 
    ChildCreate, ChildResponse, ChildUpdate,
    StartSessionRequest, EndSessionRequest, StartSessionResponse, 
    EndSessionResponse, SessionListResponse, SessionAnalyticsResponse,
    ActiveSessionsResponse
)
from .user_account.auth import register_user, login_user, forgot_password, get_all_users
from .ml_processing.ml_analyzer import ml_analyzer

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


# Pydantic models for ML endpoints
class ImageAnalysisRequest(BaseModel):
    sessionId: str
    imageData: str  # base64 encoded image
    timestamp: int = None

class MLAnalysisResponse(BaseModel):
    success: bool
    analysis: dict = None
    intervention: dict = None
    error: str = None
    
# Simple ML simulation for now (we'll add real models later)
def simulate_ml_analysis(image_data: str) -> dict:
    """Simulate ML analysis - replace this with real models later"""
    import random
    import time
    
    # Simulate processing time
    time.sleep(0.5)
    
    # Simulate realistic results
    emotions = ['happy', 'neutral', 'sad', 'surprise']
    learning_states = ['engagement', 'boredom', 'confusion', 'frustration']
    
    # Create realistic probabilities
    emotion = random.choice(emotions)
    learning_state = random.choice(learning_states)
    
    emotion_confidence = random.uniform(0.6, 0.95)
    learning_confidence = random.uniform(0.6, 0.95)
    
    # Calculate attention score
    attention_scores = {
        'engagement': 0.9,
        'confusion': 0.6,
        'boredom': 0.3,
        'frustration': 0.4
    }
    attention_score = attention_scores[learning_state] * learning_confidence
    
    return {
        'emotion': {
            'emotion': emotion,
            'confidence': emotion_confidence,
            'probabilities': {e: random.uniform(0.1, 0.9) if e == emotion else random.uniform(0.05, 0.2) for e in emotions}
        },
        'learningState': {
            'learningState': learning_state,
            'confidence': learning_confidence,
            'probabilities': {s: random.uniform(0.1, 0.9) if s == learning_state else random.uniform(0.05, 0.2) for s in learning_states}
        },
        'attentionScore': attention_score,
        'timestamp': int(time.time() * 1000),
        'intervention': {
            'needed': learning_state in ['boredom', 'confusion', 'frustration'] and learning_confidence > 0.7,
            'type': 'engaging_quiz' if learning_state == 'boredom' else 'helpful_hint' if learning_state == 'confusion' else 'encouragement',
            'reason': f'Child appears {learning_state}',
            'urgency': 'medium'
        }
    }
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

# Add these session routes after your existing child management endpoints
# ==========================================
# SESSION MANAGEMENT ENDPOINTS
# ==========================================

@app.post("/api/sessions/start", response_model=StartSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(session_data: StartSessionRequest):
    """Start a new study session for a child"""
    session_dict = {
        'childId': session_data.childId,
        'subject': session_data.subject,
        'plannedDuration': session_data.plannedDuration,
        'settings': session_data.settings.dict() if session_data.settings else None
    }
    return await start_study_session(session_dict)

@app.post("/api/sessions/{session_id}/end", response_model=EndSessionResponse)
async def end_session(session_id: str, end_data: EndSessionRequest):
    """End an active study session"""
    # Ensure session_id matches
    if end_data.sessionId != session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session ID mismatch"
        )
    
    session_dict = {
        'sessionId': end_data.sessionId,
        'endTime': end_data.endTime,
        'actualDuration': end_data.actualDuration,
        'results': end_data.results
    }
    return await end_study_session(session_dict)

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Get detailed information about a specific session"""
    return await get_session_details(session_id)

@app.get("/api/sessions/child/{child_id}", response_model=SessionListResponse)
async def get_sessions_by_child(
    child_id: str,
    limit: int = 10,
    status_filter: str = None
):
    """Get list of sessions for a specific child"""
    return await get_child_sessions(child_id, limit, status_filter)

@app.get("/api/sessions/child/{child_id}/analytics", response_model=SessionAnalyticsResponse)
async def get_child_analytics(child_id: str, days: int = 7):
    """Get session analytics for a child over specified days"""
    return await get_session_analytics(child_id, days)

@app.get("/api/sessions/active", response_model=ActiveSessionsResponse)
async def get_active_sessions_endpoint():
    """Get all currently active sessions (for admin/monitoring)"""
    return await get_active_sessions()

@app.post("/api/sessions/{session_id}/pause")
async def pause_session(session_id: str):
    """Pause an active session (for future use)"""
    try:
        from firebase_admin import firestore
        from datetime import datetime, timezone
        
        db = firestore.client()
        
        session_ref = db.collection('study_sessions').document(session_id)
        session_doc = session_ref.get()
        
        if not session_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        session_data = session_doc.to_dict()
        
        if session_data.get('status') != 'active':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session is not active"
            )
        
        # Update session status
        session_ref.update({
            'status': 'paused',
            'pausedAt': datetime.now(timezone.utc).isoformat(),
            'updatedAt': datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "message": "Session paused successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error pausing session: {str(e)}"
        )

@app.post("/api/sessions/{session_id}/resume")
async def resume_session(session_id: str):
    """Resume a paused session (for future use)"""
    try:
        from firebase_admin import firestore
        from datetime import datetime, timezone
        
        db = firestore.client()
        
        session_ref = db.collection('study_sessions').document(session_id)
        session_doc = session_ref.get()
        
        if not session_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        session_data = session_doc.to_dict()
        
        if session_data.get('status') != 'paused':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session is not paused"
            )
        
        # Update session status
        session_ref.update({
            'status': 'active',
            'resumedAt': datetime.now(timezone.utc).isoformat(),
            'updatedAt': datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "message": "Session resumed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resuming session: {str(e)}"
        )

# ==========================================
# ML ANALYSIS ENDPOINTS
# ==========================================
@app.post("/api/analyze-image", response_model=MLAnalysisResponse)
async def analyze_image(request: ImageAnalysisRequest):
    # """
    # Analyze uploaded image for emotion and learning state detection
    # Currently using simulation - will connect to real models next
    # """
    try:
        logger.info(f"📸 Analyzing image for session: {request.sessionId}")
        print("🚀 Received ML analysis request for session:", request.sessionId)
        
        # For now, use simulation (we'll add real ML models next)
        #analysis_result = simulate_ml_analysis(request.imageData)

        # Use real ML analyzer
        analysis_result = ml_analyzer.analyze_image(request.imageData)
        
        # Store the analysis data in database
        db = firestore.client()
        
        # Save to session_data collection for real-time tracking
        session_data = {
            'sessionId': request.sessionId,
            'timestamp': analysis_result['timestamp'],
            'emotion': analysis_result['emotion']['emotion'],
            'emotionConfidence': analysis_result['emotion']['confidence'],
            'learningState': analysis_result['learningState']['learningState'],
            'learningConfidence': analysis_result['learningState']['confidence'],
            'attentionScore': analysis_result['attentionScore'],
            'emotionProbabilities': analysis_result['emotion']['probabilities'],
            'learningProbabilities': analysis_result['learningState']['probabilities'],
            'createdAt': datetime.utcnow().isoformat()
        }
        
        # Add to database
        db.collection('session_data').add(session_data)
        
        # Check if intervention is needed
        intervention_data = None
        if analysis_result['intervention']['needed']:
            intervention_data = {
                'sessionId': request.sessionId,
                'type': analysis_result['intervention']['type'],
                'reason': analysis_result['intervention']['reason'],
                'urgency': analysis_result['intervention']['urgency'],
                'timestamp': analysis_result['timestamp'],
                'triggered': True
            }
            
            # Save intervention to database
            db.collection('interventions').add(intervention_data)
            
            logger.warning(f"⚠️ Intervention needed: {intervention_data['type']} - {intervention_data['reason']}")
        
        logger.info(f"✅ Analysis complete for session {request.sessionId}")
        logger.info(f"😊 Emotion: {analysis_result['emotion']['emotion']} ({analysis_result['emotion']['confidence']:.2f})")
        logger.info(f"🧠 Learning State: {analysis_result['learningState']['learningState']} ({analysis_result['learningState']['confidence']:.2f})")
        logger.info(f"📊 Attention Score: {analysis_result['attentionScore']:.2f}")
        print("✅ Analysis result:", analysis_result)
        
        return MLAnalysisResponse(
            success=True,
            analysis=analysis_result,
            intervention=intervention_data
        )
        
    except Exception as e:
        logger.error(f"❌ Error analyzing image: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"ML analysis failed: {str(e)}"
        )

@app.get("/api/sessions/{session_id}/ml-data")
async def get_session_ml_data(session_id: str, limit: int = 50):
    """
    Get ML analysis data for a specific session
    """
    try:
        db = firestore.client()
        
        # Get recent ML data for this session
        docs = db.collection('session_data')\
                .where('sessionId', '==', session_id)\
                .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                .limit(limit)\
                .stream()
        
        ml_data = [doc.to_dict() for doc in docs]
        
        return {
            "success": True,
            "data": ml_data,
            "count": len(ml_data)
        }
        
    except Exception as e:
        logger.error(f"Error fetching ML data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions/{session_id}/interventions")
async def get_session_interventions(session_id: str):
    """
    Get intervention history for a specific session
    """
    try:
        db = firestore.client()
        
        # Get interventions for this session
        docs = db.collection('interventions')\
                .where('sessionId', '==', session_id)\
                .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                .stream()
        
        interventions = [doc.to_dict() for doc in docs]
        
        return {
            "success": True,
            "interventions": interventions,
            "count": len(interventions)
        }
        
    except Exception as e:
        logger.error(f"Error fetching interventions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/status")
async def get_ml_status():
    """
    Check ML system status
    """
    try:
        return {
            "success": True,
            "models_loaded": True,  # Simulation mode
            "simulation_mode": True,
            "emotion_model": True,
            "learning_model": True,
            "emotion_labels": ['happy', 'neutral', 'sad', 'surprise'],
            "learning_labels": ['engagement', 'boredom', 'confusion', 'frustration'],
            "message": "ML system ready (simulation mode)"
        }
        
    except Exception as e:
        logger.error(f"Error checking ML status: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "models_loaded": False
        }
# ==========================================
# UPDATED HEALTH CHECK
# ==========================================

@app.get("/health")
async def health_check():
    """Health check with session management"""
    try:
        from firebase_admin import firestore
        
        db = firestore.client()
        
        # Test Firebase connection
        test_collection = db.collection('children').limit(1).stream()
        children_accessible = len(list(test_collection)) >= 0
        
        # Test sessions collection
        test_sessions = db.collection('study_sessions').limit(1).stream()
        sessions_accessible = len(list(test_sessions)) >= 0
        
        return {
            "status": "healthy",
            "features": {
                "authentication": "enabled",
                "child_management": "enabled",
                "session_management": "enabled",
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
                ],
                "sessions": [
                    "POST /api/sessions/start",
                    "POST /api/sessions/{session_id}/end",
                    "GET /api/sessions/{session_id}",
                    "GET /api/sessions/child/{child_id}",
                    "GET /api/sessions/child/{child_id}/analytics",
                    "GET /api/sessions/active",
                    "POST /api/sessions/{session_id}/pause",
                    "POST /api/sessions/{session_id}/resume"
                ]
            },
            "data": {
                "firebase_connection": "working",
                "children_collection": "accessible" if children_accessible else "error",
                "sessions_collection": "accessible" if sessions_accessible else "error"
            }
        }
        
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "features": {
                "authentication": "enabled",
                "child_management": "enabled", 
                "session_management": "error",
                "firebase": "error"
            }
        }