# app/account_schema/schema.py
# Updated with session management schemas

from pydantic import BaseModel, EmailStr, constr, Field
from typing import Optional, Dict, List, Any
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

# ===========================
# NEW: SESSION MANAGEMENT SCHEMAS
# ===========================

class SessionSettings(BaseModel):
    sessionDuration: int = 25          # minutes
    breakDuration: int = 5             # minutes
    difficultyLevel: str = "medium"    # easy, medium, hard
    subjects: List[str] = ["general"]
    enableQuizzes: bool = False
    enableBreakReminders: bool = True

class StartSessionRequest(BaseModel):
    childId: str
    subject: str
    plannedDuration: int               # seconds
    settings: Optional[SessionSettings] = None

class EndSessionRequest(BaseModel):
    sessionId: str
    endTime: str
    actualDuration: int                # seconds
    results: Optional[Dict[str, Any]] = None

class SessionResults(BaseModel):
    totalTime: int
    focusedTime: int
    distractedTime: int
    averageAttentionScore: float
    quizzesTaken: int
    correctAnswers: int
    xpEarned: int
    emotionSummary: Dict[str, int]

class StudySessionResponse(BaseModel):
    sessionId: str
    childId: str
    parentId: str
    subject: str
    startTime: str
    endTime: Optional[str] = None
    plannedDuration: int
    actualDuration: Optional[int] = None
    status: str                        # active, completed, paused, cancelled
    settings: SessionSettings
    results: Optional[SessionResults] = None
    createdAt: str
    updatedAt: str

class SessionSummary(BaseModel):
    sessionId: str
    duration: int
    focusedTime: int
    averageAttentionScore: float
    xpEarned: int

class StartSessionResponse(BaseModel):
    success: bool
    sessionId: str
    startTime: str
    message: str

class EndSessionResponse(BaseModel):
    success: bool
    sessionSummary: SessionSummary
    message: str

class SessionListResponse(BaseModel):
    success: bool
    sessions: List[StudySessionResponse]
    totalCount: int

class SessionAnalytics(BaseModel):
    totalSessions: int
    completedSessions: int
    totalStudyTime: int
    averageSessionLength: int
    averageFocusScore: float
    mostStudiedSubject: Optional[str]
    subjectDistribution: Dict[str, int]

class SessionAnalyticsResponse(BaseModel):
    success: bool
    analytics: SessionAnalytics
    period: str

class ActiveSessionsResponse(BaseModel):
    success: bool
    activeSessions: List[StudySessionResponse]
    count: int