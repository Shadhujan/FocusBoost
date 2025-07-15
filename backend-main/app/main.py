from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, firestore
import uvicorn
import logging
from contextlib import asynccontextmanager

from .settings import settings
from .ml_processor import SimpleMLPredictor, SimpleInterventionManager, SimpleDataManager
from .websocket_manager import WebSocketManager
from .auth import get_current_user, router as auth_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global instances
ml_predictor = None
intervention_manager = None
data_manager = None
websocket_manager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global ml_predictor, intervention_manager, data_manager, websocket_manager
    
    try:
        # Initialize Firebase
        if not firebase_admin._apps:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred, {
                'projectId': settings.FIREBASE_PROJECT_ID,
            })
        
        # Initialize ML components
        ml_predictor = SimpleMLPredictor()
        intervention_manager = SimpleInterventionManager()
        data_manager = SimpleDataManager()
        websocket_manager = WebSocketManager()
        
        logger.info("✅ Application startup complete")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🔄 Application shutdown")

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["authentication"])

# =======================================
# ML ANALYSIS ENDPOINTS
# =======================================

from pydantic import BaseModel
from typing import Optional, Dict, Any

class AnalyzeFrameRequest(BaseModel):
    sessionId: str
    imageData: str  # base64 encoded image

class AnalysisResponse(BaseModel):
    success: bool
    analysis: Optional[Dict[str, Any]] = None
    intervention: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@app.post(f"{settings.API_V1_STR}/analyze-base64", response_model=AnalysisResponse)
async def analyze_frame(
    request: AnalyzeFrameRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Analyze frame using your two ML models"""
    try:
        # Verify user authentication
        current_user = await get_current_user(credentials.credentials)
        
        # Analyze with ML models
        analysis_result = ml_predictor.analyze_frame(request.imageData)
        if not analysis_result:
            raise HTTPException(
                status_code=400, 
                detail="Failed to analyze image"
            )
        
        # Store results
        doc_id = await data_manager.store_analysis(request.sessionId, analysis_result)
        
        # Update session summary
        await data_manager.update_session_summary(request.sessionId, analysis_result)
        
        # Check for interventions
        intervention_type = intervention_manager.should_trigger_intervention(analysis_result)
        intervention = None
        
        if intervention_type:
            intervention = await intervention_manager.create_intervention(
                request.sessionId, intervention_type, analysis_result
            )
        
        # Send WebSocket update
        if websocket_manager:
            await websocket_manager.send_analysis_update(request.sessionId, analysis_result)
        
        return AnalysisResponse(
            success=True,
            analysis={
                'learningState': analysis_result['learning_state']['state'],
                'learningConfidence': analysis_result['learning_state']['confidence'],
                'emotion': analysis_result['emotion']['emotion'],
                'emotionConfidence': analysis_result['emotion']['confidence'],
                'attentionScore': analysis_result['attention_score'],
                'timestamp': analysis_result['timestamp']
            },
            intervention=intervention
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analyze_frame: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )

# =======================================
# SESSION MANAGEMENT ENDPOINTS
# =======================================

class StartSessionRequest(BaseModel):
    childId: str
    subject: str = "general"
    startTime: str

class EndSessionRequest(BaseModel):
    sessionId: str
    endTime: str

@app.post(f"{settings.API_V1_STR}/sessions/start")
async def start_session(
    request: StartSessionRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Start a new study session"""
    try:
        current_user = await get_current_user(credentials.credentials)
        
        # Verify child belongs to user
        child_doc = firestore.client().collection('children').document(request.childId).get()
        if not child_doc.exists:
            raise HTTPException(status_code=404, detail="Child not found")
        
        child_data = child_doc.to_dict()
        if child_data['parentId'] != current_user['uid']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Create session
        session_id = await data_manager.create_session(request.childId, request.subject)
        
        return {
            'success': True,
            'sessionId': session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post(f"{settings.API_V1_STR}/sessions/end")
async def end_session(
    request: EndSessionRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """End a study session"""
    try:
        current_user = await get_current_user(credentials.credentials)
        
        # End session
        success = await data_manager.end_session(request.sessionId)
        
        if success:
            return {
                'success': True,
                'sessionId': request.sessionId
            }
        else:
            raise HTTPException(status_code=404, detail="Session not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get(f"{settings.API_V1_STR}/session/{{session_id}}/summary")
async def get_session_summary(
    session_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get session summary"""
    try:
        current_user = await get_current_user(credentials.credentials)
        
        summary = await data_manager.get_session_summary(session_id)
        
        if summary:
            return {
                'success': True,
                'data': summary
            }
        else:
            raise HTTPException(status_code=404, detail="Session not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =======================================
# WEBSOCKET ENDPOINT
# =======================================

@app.websocket(f"/ws/{{session_id}}")
async def websocket_endpoint(websocket, session_id: str):
    """WebSocket endpoint for real-time communication"""
    if websocket_manager:
        await websocket_manager.connect(websocket, session_id)
    else:
        await websocket.close(code=1000)

# =======================================
# HEALTH CHECK
# =======================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "ml_models_loaded": ml_predictor is not None,
        "firebase_connected": len(firebase_admin._apps) > 0
    }

# =======================================
# RUN APPLICATION
# =======================================

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )