// src/components/parent/SessionManager.tsx
// Parent-focused session management component

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Square, 
  Clock, 
  User, 
  AlertCircle,
  Activity,
  BookOpen
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { apiService, StudySession } from '../../services/apiService';

interface SessionManagerProps {
  selectedChildId: string | null;
}

const SessionManager: React.FC<SessionManagerProps> = ({ selectedChildId }) => {
  const { children } = useUser();
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionTime, setSessionTime] = useState(0);

  // Find current child
  const currentChild = children.find(child => child.id === selectedChildId);

  // Check for active session when child is selected
  useEffect(() => {
    if (selectedChildId) {
      checkForActiveSession();
    }
  }, [selectedChildId]);

  // Update timer every second for active sessions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeSession && activeSession.status === 'active') {
      interval = setInterval(() => {
        const now = new Date();
        const start = new Date(activeSession.startTime);
        const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
        setSessionTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  const checkForActiveSession = async () => {
    if (!selectedChildId) return;

    try {
      setLoading(true);
      console.log('🔍 Checking for active session for child:', selectedChildId);
      
      const result = await apiService.getChildSessions(selectedChildId, {
        limit: 1,
        statusFilter: 'active'
      });

      if (result.success && result.data?.sessions && result.data.sessions.length > 0) {
        const session = result.data.sessions[0];
        console.log('📍 Found active session:', session.sessionId);
        setActiveSession(session);
        
        // Calculate elapsed time
        const elapsed = Math.floor(
          (new Date().getTime() - new Date(session.startTime).getTime()) / 1000
        );
        setSessionTime(elapsed);
      } else {
        setActiveSession(null);
        setSessionTime(0);
      }
    } catch (error) {
      console.error('Error checking for active session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    setError(null);
    setLoading(true);

    try {
      console.log('⏹️ Parent ending session:', activeSession.sessionId);
      
      const endTime = new Date().toISOString();
      const result = await apiService.endSession({
        sessionId: activeSession.sessionId,
        endTime: endTime,
        actualDuration: sessionTime,
        results: {
          focusedTime: sessionTime,
          averageAttentionScore: 1.0,
          notes: 'Session ended by parent'
        }
      });

      if (result.success) {
        console.log('✅ Session ended by parent');
        setActiveSession(null);
        setSessionTime(0);
      } else {
        setError(result.error || 'Failed to end session');
      }
    } catch (error: any) {
      console.error('🚨 Error ending session:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!selectedChildId || !currentChild) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a child to view session status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Current Session</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <img 
            src={currentChild.avatar} 
            alt={currentChild.name}
            className="w-6 h-6 rounded-full"
          />
          <span>{currentChild.name}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-600">Loading session status...</span>
        </div>
      ) : activeSession ? (
        // Active session display
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-medium">Session Active</span>
          </div>

          <div className="mb-6">
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {formatTime(sessionTime)}
            </div>
            <div className="text-sm text-gray-600">
              Started: {new Date(activeSession.startTime).toLocaleTimeString()}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-primary-500" />
              <span className="capitalize">{activeSession.subject}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              <span>Target: {Math.floor(activeSession.plannedDuration / 60)}m</span>
            </div>
          </div>

          <button
            onClick={handleEndSession}
            disabled={loading}
            className="btn bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Square size={16} className="mr-2" />
            )}
            End Session
          </button>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 You can monitor and end your child's study session from here
            </p>
          </div>
        </motion.div>
      ) : (
        // No active session
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="font-medium text-gray-700 mb-2">No Active Session</h4>
          <p className="text-sm text-gray-500 mb-4">
            {currentChild.name} is not currently in a study session
          </p>
          <div className="text-xs text-gray-400">
            Sessions can be started from the child's profile selection page
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManager;