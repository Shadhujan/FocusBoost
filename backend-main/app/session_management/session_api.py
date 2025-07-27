# app/session_management/session_api.py
# Study Session Management API Implementation

from fastapi import HTTPException, status
from firebase_admin import firestore
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import uuid

# ===========================
# SESSION MANAGEMENT FUNCTIONS
# ===========================

async def start_study_session(session_data: Dict[str, Any]) -> Dict[str, Any]:
    """Start a new study session for a child"""
    try:
        db = firestore.client()
        
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        current_time = datetime.now(timezone.utc).isoformat()
        
        # Default settings if not provided
        default_settings = {
            'sessionDuration': session_data.get('plannedDuration', 1500) // 60,  # convert to minutes
            'breakDuration': 5,
            'difficultyLevel': 'medium',
            'subjects': [session_data.get('subject', 'general')],
            'enableQuizzes': False,
            'enableBreakReminders': True
        }
        
        settings = session_data.get('settings', default_settings)
        
        # Get parent ID from child document
        child_ref = db.collection('children').document(session_data['childId'])
        child_doc = child_ref.get()
        
        if not child_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found"
            )
        
        child_data = child_doc.to_dict()
        parent_id = child_data.get('parentId')
        
        # Check for existing active session for this child
        existing_sessions = db.collection('study_sessions')\
            .where('childId', '==', session_data['childId'])\
            .where('status', '==', 'active')\
            .limit(1)\
            .stream()
        
        if len(list(existing_sessions)) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Child already has an active session"
            )
        
        # Create session document
        session_doc = {
            'sessionId': session_id,
            'childId': session_data['childId'],
            'parentId': parent_id,
            'subject': session_data['subject'],
            'startTime': current_time,
            'endTime': None,
            'plannedDuration': session_data['plannedDuration'],
            'actualDuration': None,
            'status': 'active',
            'settings': settings,
            'results': None,
            'createdAt': current_time,
            'updatedAt': current_time
        }
        
        # Save session to Firestore
        session_ref = db.collection('study_sessions').document(session_id)
        session_ref.set(session_doc)
        
        print(f"✅ Session started successfully: {session_id}")
        
        return {
            "success": True,
            "sessionId": session_id,
            "startTime": current_time,
            "message": "Study session started successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error starting session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting session: {str(e)}"
        )

async def end_study_session(session_data: Dict[str, Any]) -> Dict[str, Any]:
    """End an active study session"""
    try:
        db = firestore.client()
        
        session_id = session_data['sessionId']
        
        # Get session document
        session_ref = db.collection('study_sessions').document(session_id)
        session_doc = session_ref.get()
        
        if not session_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        session_dict = session_doc.to_dict()
        
        # Check if session is active
        if session_dict.get('status') != 'active':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session is not active"
            )
        
        # Calculate session results
        actual_duration = session_data['actualDuration']
        xp_earned = calculate_xp_earned(actual_duration)
        
        results = {
            'totalTime': actual_duration,
            'focusedTime': actual_duration,  # Default to full time (ML will update this later)
            'distractedTime': 0,
            'averageAttentionScore': 1.0,  # Default high score (ML will update this later)
            'quizzesTaken': 0,
            'correctAnswers': 0,
            'xpEarned': xp_earned,
            'emotionSummary': {
                'happy': 80,
                'focused': 75,
                'distracted': 20,
                'frustrated': 5
            }
        }
        
        # Merge with provided results
        if session_data.get('results'):
            results.update(session_data['results'])
        
        # Update session document
        update_data = {
            'endTime': session_data['endTime'],
            'actualDuration': actual_duration,
            'status': 'completed',
            'results': results,
            'updatedAt': datetime.now(timezone.utc).isoformat()
        }
        
        session_ref.update(update_data)
        
        # Update daily analytics
        await update_daily_analytics(session_dict['childId'], actual_duration)
        
        print(f"✅ Session ended successfully: {session_id}")
        
        return {
            "success": True,
            "sessionSummary": {
                "sessionId": session_id,
                "duration": actual_duration,
                "focusedTime": results['focusedTime'],
                "averageAttentionScore": results['averageAttentionScore'],
                "xpEarned": results['xpEarned']
            },
            "message": "Study session completed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error ending session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error ending session: {str(e)}"
        )

async def get_session_details(session_id: str) -> Dict[str, Any]:
    """Get detailed information about a specific session"""
    try:
        db = firestore.client()
        
        session_ref = db.collection('study_sessions').document(session_id)
        session_doc = session_ref.get()
        
        if not session_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        session_data = session_doc.to_dict()
        
        return {
            "success": True,
            "session": session_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching session: {str(e)}"
        )

async def get_child_sessions(
    child_id: str, 
    limit: int = 10, 
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    """Get list of sessions for a specific child"""
    try:
        db = firestore.client()
        
        # Build query
        query = db.collection('study_sessions').where('childId', '==', child_id)
        
        if status_filter:
            query = query.where('status', '==', status_filter)
        
        # Order by start time (most recent first)
        query = query.order_by('startTime', direction=firestore.Query.DESCENDING)
        
        if limit:
            query = query.limit(limit)
        
        # Execute query
        sessions_docs = query.stream()
        
        sessions = []
        for doc in sessions_docs:
            session_data = doc.to_dict()
            sessions.append(session_data)
        
        print(f"📊 Found {len(sessions)} sessions for child {child_id}")
        
        return {
            "success": True,
            "sessions": sessions,
            "totalCount": len(sessions)
        }
        
    except Exception as e:
        print(f"❌ Error fetching sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching sessions: {str(e)}"
        )

async def get_session_analytics(child_id: str, days: int = 7) -> Dict[str, Any]:
    """Get session analytics for a child over specified days"""
    try:
        db = firestore.client()
        
        # Calculate date range
        end_date = datetime.now(timezone.utc)
        start_date = end_date.replace(day=max(1, end_date.day - days))
        
        # Query sessions in date range
        query = db.collection('study_sessions').where('childId', '==', child_id)
        query = query.where('startTime', '>=', start_date.isoformat())
        query = query.where('startTime', '<=', end_date.isoformat())
        query = query.where('status', '==', 'completed')  # Only completed sessions
        
        sessions_docs = query.stream()
        sessions = [doc.to_dict() for doc in sessions_docs]
        
        # Calculate analytics
        analytics = calculate_session_analytics(sessions)
        
        print(f"📈 Calculated analytics for {len(sessions)} sessions")
        
        return {
            "success": True,
            "analytics": analytics,
            "period": f"{days} days"
        }
        
    except Exception as e:
        print(f"❌ Error calculating analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating analytics: {str(e)}"
        )

async def get_active_sessions() -> Dict[str, Any]:
    """Get all currently active sessions"""
    try:
        db = firestore.client()
        
        # Query active sessions
        query = db.collection('study_sessions').where('status', '==', 'active')
        sessions_docs = query.stream()
        
        active_sessions = []
        for doc in sessions_docs:
            session_data = doc.to_dict()
            
            # Calculate current duration
            start_time = datetime.fromisoformat(session_data['startTime'].replace('Z', '+00:00'))
            current_time = datetime.now(timezone.utc)
            current_duration = (current_time - start_time).total_seconds()
            
            session_data['currentDuration'] = int(current_duration)
            active_sessions.append(session_data)
        
        return {
            "success": True,
            "activeSessions": active_sessions,
            "count": len(active_sessions)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching active sessions: {str(e)}"
        )

# ===========================
# HELPER FUNCTIONS
# ===========================

def calculate_xp_earned(duration_seconds: int) -> int:
    """Calculate XP points based on session duration"""
    # 1 XP per minute, bonus for longer sessions
    minutes = duration_seconds // 60
    base_xp = minutes
    
    # Bonus for sessions over 20 minutes
    if minutes >= 20:
        base_xp += 10
    
    # Bonus for sessions over 30 minutes
    if minutes >= 30:
        base_xp += 20
    
    return max(base_xp, 1)  # Minimum 1 XP

async def update_daily_analytics(child_id: str, session_duration: int):
    """Update daily analytics for a child"""
    try:
        db = firestore.client()
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        
        analytics_id = f"{child_id}_{today}"
        analytics_ref = db.collection('session_analytics').document(analytics_id)
        
        # Get existing analytics or create new
        analytics_doc = analytics_ref.get()
        
        if analytics_doc.exists:
            data = analytics_doc.to_dict()
            daily_stats = data.get('dailyStats', {})
            
            # Update existing stats
            daily_stats['totalSessions'] = daily_stats.get('totalSessions', 0) + 1
            daily_stats['totalStudyTime'] = daily_stats.get('totalStudyTime', 0) + session_duration
            daily_stats['averageSessionLength'] = daily_stats['totalStudyTime'] / daily_stats['totalSessions']
        else:
            # Create new analytics
            daily_stats = {
                'totalSessions': 1,
                'totalStudyTime': session_duration,
                'averageSessionLength': session_duration,
                'averageFocusScore': 1.0,
                'subjectsStudied': [],
                'bestSession': {
                    'sessionId': '',
                    'focusScore': 1.0,
                    'duration': session_duration
                }
            }
        
        analytics_data = {
            'analyticsId': analytics_id,
            'childId': child_id,
            'date': today,
            'dailyStats': daily_stats,
            'trends': {
                'weeklyStudyTime': daily_stats['totalStudyTime'],
                'monthlyStudyTime': daily_stats['totalStudyTime'],
                'improvementTrend': 'stable',
                'consistencyScore': 0.8
            },
            'updatedAt': datetime.now(timezone.utc).isoformat()
        }
        
        if not analytics_doc.exists:
            analytics_data['createdAt'] = datetime.now(timezone.utc).isoformat()
        
        analytics_ref.set(analytics_data)
        print(f"📊 Updated daily analytics for child {child_id}")
        
    except Exception as e:
        print(f"⚠️ Error updating daily analytics: {str(e)}")

def calculate_session_analytics(sessions: List[Dict]) -> Dict[str, Any]:
    """Calculate comprehensive analytics from session list"""
    if not sessions:
        return {
            'totalSessions': 0,
            'completedSessions': 0,
            'totalStudyTime': 0,
            'averageSessionLength': 0,
            'averageFocusScore': 0,
            'mostStudiedSubject': None,
            'subjectDistribution': {}
        }
    
    completed_sessions = [s for s in sessions if s.get('status') == 'completed']
    total_time = sum(s.get('actualDuration', 0) for s in completed_sessions)
    
    # Subject frequency
    subjects = {}
    for session in sessions:
        subject = session.get('subject', 'unknown')
        subjects[subject] = subjects.get(subject, 0) + 1
    
    most_studied = max(subjects.keys(), key=lambda k: subjects[k]) if subjects else None
    
    # Average focus score (from results)
    focus_scores = []
    for session in completed_sessions:
        results = session.get('results', {})
        if results and 'averageAttentionScore' in results:
            focus_scores.append(results['averageAttentionScore'])
    
    avg_focus = sum(focus_scores) / len(focus_scores) if focus_scores else 1.0
    
    return {
        'totalSessions': len(sessions),
        'completedSessions': len(completed_sessions),
        'totalStudyTime': total_time,
        'averageSessionLength': total_time / len(completed_sessions) if completed_sessions else 0,
        'averageFocusScore': avg_focus,
        'mostStudiedSubject': most_studied,
        'subjectDistribution': subjects
    }