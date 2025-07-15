// Frontend/src/pages/StudySession.tsx
// Updated to integrate with your ML models and handle interventions

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VideoFeed from '../components/child/VideoFeed';
import QuizModal from '../components/child/QuizModal';
import FocusPet from '../components/child/FocusPet';
import FocusTimer from '../components/child/FocusTimer';
import { BookOpen, Coffee, AlertCircle, TrendingUp, Brain, Heart } from 'lucide-react';

interface AnalysisResult {
  learningState: 'boredom' | 'engagement' | 'confusion' | 'frustration';
  learningConfidence: number;
  emotion: 'happy' | 'anger' | 'sad' | 'neutral' | 'surprise' | 'fear';
  emotionConfidence: number;
  attentionScore: number;
  timestamp: string;
}

interface InterventionData {
  id?: string;
  type: 'quiz' | 'break' | 'hint';
  reason: string;
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  message?: string;
  duration?: number;
}

interface SessionStats {
  totalTime: number;
  averageAttention: number;
  learningStates: Record<string, number>;
  emotions: Record<string, number>;
  interventionCount: number;
  quizzesCompleted: number;
}

const StudySession: React.FC = () => {
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();
  
  // Session state
  const [sessionId] = useState(`session_${Date.now()}`);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalTime: 0,
    averageAttention: 0,
    learningStates: {},
    emotions: {},
    interventionCount: 0,
    quizzesCompleted: 0
  });
  
  // Intervention state
  const [activeIntervention, setActiveIntervention] = useState<InterventionData | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  
  // Analysis history for trends
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);

  // Start study session
  const startSession = async () => {
    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: childId,
          sessionId: sessionId,
          subject: 'general', // You can make this configurable
          startTime: new Date().toISOString()
        })
      });

      if (response.ok) {
        setIsSessionActive(true);
        setSessionStartTime(new Date());
        console.log('✅ Session started:', sessionId);
      } else {
        console.error('Failed to start session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  // End study session
  const endSession = async () => {
    try {
      const response = await fetch('/api/sessions/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          endTime: new Date().toISOString()
        })
      });

      if (response.ok) {
        setIsSessionActive(false);
        console.log('✅ Session ended:', sessionId);
        
        // Navigate to results or dashboard
        navigate(`/dashboard/child/${childId}`);
      } else {
        console.error('Failed to end session');
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // Handle analysis updates from VideoFeed
  const handleAnalysisUpdate = (analysis: AnalysisResult) => {
    setCurrentAnalysis(analysis);
    
    // Add to history for trends
    setAnalysisHistory(prev => {
      const newHistory = [...prev, analysis];
      // Keep only last 20 analyses for performance
      return newHistory.slice(-20);
    });

    // Update session stats
    setSessionStats(prev => {
      const newStats = { ...prev };
      
      // Update learning state counts
      newStats.learningStates = {
        ...prev.learningStates,
        [analysis.learningState]: (prev.learningStates[analysis.learningState] || 0) + 1
      };
      
      // Update emotion counts
      newStats.emotions = {
        ...prev.emotions,
        [analysis.emotion]: (prev.emotions[analysis.emotion] || 0) + 1
      };
      
      // Recalculate average attention
      const totalAnalyses = analysisHistory.length + 1;
      newStats.averageAttention = (
        (prev.averageAttention * (totalAnalyses - 1) + analysis.attentionScore) / totalAnalyses
      );
      
      return newStats;
    });
  };

  // Handle intervention triggers
  const handleInterventionTrigger = (intervention: InterventionData) => {
    setActiveIntervention(intervention);
    
    // Update intervention count
    setSessionStats(prev => ({
      ...prev,
      interventionCount: prev.interventionCount + 1
    }));

    // Show appropriate modal based on intervention type
    if (intervention.type === 'quiz') {
      setShowQuizModal(true);
    } else {
      // For breaks and hints, we'll show them inline
      setTimeout(() => {
        setActiveIntervention(null);
      }, 5000); // Auto-dismiss after 5 seconds
    }
  };

  // Handle quiz completion
  const handleQuizComplete = async (userAnswer: number, responseTime: number) => {
    if (!activeIntervention?.quiz) return;

    const isCorrect = userAnswer === activeIntervention.quiz.correctAnswer;
    
    try {
      // Submit quiz answer to backend
      const response = await fetch(`/api/quiz/${activeIntervention.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAnswer,
          responseTime,
          isCorrect
        })
      });

      if (response.ok) {
        // Update quiz completion count
        setSessionStats(prev => ({
          ...prev,
          quizzesCompleted: prev.quizzesCompleted + 1
        }));
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }

    // Close quiz modal
    setShowQuizModal(false);
    setActiveIntervention(null);
  };

  // Calculate session duration
  const getSessionDuration = () => {
    if (!sessionStartTime) return 0;
    return Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
  };

  // Get dominant learning state
  const getDominantLearningState = () => {
    const states = sessionStats.learningStates;
    return Object.keys(states).reduce((a, b) => states[a] > states[b] ? a : b, 'engagement');
  };

  // Get dominant emotion
  const getDominantEmotion = () => {
    const emotions = sessionStats.emotions;
    return Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b, 'neutral');
  };

  // Update session time every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSessionActive && sessionStartTime) {
      interval = setInterval(() => {
        setSessionStats(prev => ({
          ...prev,
          totalTime: getSessionDuration()
        }));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, sessionStartTime]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📚 Study Session
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Session ID: {sessionId}</span>
            {isSessionActive && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Active
              </span>
            )}
          </div>
        </div>

        {!isSessionActive ? (
          /* Pre-session setup */
          <div className="text-center py-12">
            <div className="card max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4">Ready to Focus? 🎯</h2>
              <p className="text-gray-600 mb-6">
                Start your AI-powered study session. We'll track your attention and help you stay focused!
              </p>
              <button 
                onClick={startSession}
                className="btn-primary btn-lg"
              >
                Start Session
              </button>
            </div>
          </div>
        ) : (
          /* Active session layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Video Feed */}
            <div className="lg:col-span-2 space-y-6">
              <VideoFeed 
                sessionId={sessionId}
                onAnalysisUpdate={handleAnalysisUpdate}
                onInterventionTrigger={handleInterventionTrigger}
              />
              
              {/* Intervention Alerts */}
              {activeIntervention && activeIntervention.type !== 'quiz' && (
                <div className="card border-l-4 border-yellow-500">
                  <div className="flex items-center gap-3 mb-2">
                    {activeIntervention.type === 'break' ? (
                      <Coffee className="text-orange-500" size={24} />
                    ) : (
                      <AlertCircle className="text-yellow-500" size={24} />
                    )}
                    <h3 className="font-semibold">
                      {activeIntervention.type === 'break' ? 'Break Suggestion' : 'Helpful Hint'}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-2">{activeIntervention.reason}</p>
                  {activeIntervention.message && (
                    <p className="font-medium">{activeIntervention.message}</p>
                  )}
                  {activeIntervention.duration && (
                    <p className="text-sm text-gray-500 mt-2">
                      Suggested duration: {activeIntervention.duration} minutes
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Stats and Controls */}
            <div className="space-y-6">
              
              {/* Session Timer */}
              <div className="card">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FocusTimer className="text-primary-500" size={20} />
                  Session Time
                </h3>
                <div className="text-2xl font-bold text-center">
                  {Math.floor(sessionStats.totalTime / 60)}:
                  {(sessionStats.totalTime % 60).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Current Analysis */}
              {currentAnalysis && (
                <div className="card">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="text-green-500" size={20} />
                    Current State
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Brain size={16} />
                        Learning:
                      </span>
                      <span className="font-medium capitalize">
                        {currentAnalysis.learningState}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Heart size={16} />
                        Mood:
                      </span>
                      <span className="font-medium capitalize">
                        {currentAnalysis.emotion}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Attention:</span>
                      <span className="font-bold text-lg">
                        {Math.round(currentAnalysis.attentionScore * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Stats */}
              <div className="card">
                <h3 className="font-semibold mb-3">Session Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Avg Attention:</span>
                    <span>{Math.round(sessionStats.averageAttention * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interventions:</span>
                    <span>{sessionStats.interventionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quizzes Completed:</span>
                    <span>{sessionStats.quizzesCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dominant State:</span>
                    <span className="capitalize">{getDominantLearningState()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dominant Mood:</span>
                    <span className="capitalize">{getDominantEmotion()}</span>
                  </div>
                </div>
              </div>

              {/* Focus Pet (if you have this component)
              <FocusPet 
                level={1}
                xp={sessionStats.quizzesCompleted * 10}
                attentionScore={currentAnalysis?.attentionScore || 0}
              /> */}

              {/* End Session Button */}
              <button 
                onClick={endSession}
                className="btn-accent w-full"
              >
                End Session
              </button>
            </div>
          </div>
        )}

        {/* Quiz Modal */}
        {showQuizModal && activeIntervention?.quiz && (
          <QuizModal
            question={activeIntervention.quiz.question}
            options={activeIntervention.quiz.options}
            onAnswer={handleQuizComplete}
            onClose={() => {
              setShowQuizModal(false);
              setActiveIntervention(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default StudySession;