// src/pages/StudySession.tsx
// Updated with backend session management and kid-friendly design

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  Shield, 
  // Check, 
  Star, 
  Trophy,
  Play,
  Square,
  // Pause
  Lightbulb,
  Coffee,
  AlertCircle
} from 'lucide-react';
import Logo from '../components/shared/Logo';
import VideoFeed from '../components/child/VideoFeed';
// import VideoDebug from '../components/child/VideoDebug';
import QuizModal from '../components/child/QuizModal';
// import MLStatusTest from '../components/test/MLStatusTest';
// import FocusTimer from '../components/child/FocusTimer';
import FocusPet from '../components/child/FocusPet';
import { useUser } from '../context/UserContext';
import { apiService, StudySession } from '../services/apiService';

const StudySessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedChild } = useUser();
  
  // Session state
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  
  // Session setup
  const [subject, setSubject] = useState('general');
  const [duration, setDuration] = useState(25); // minutes
  
  // Real-time data
  const [attentionScore, setAttentionScore] = useState(100);
  const [currentLearningState, setCurrentLearningState] = useState<string>('neutral');
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  
  // UI state
  const [showQuiz, setShowQuiz] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interventionQueue, setInterventionQueue] = useState<any[]>([]);
  const [isMLPaused, setIsMLPaused] = useState(false);
  const [currentIntervention, setCurrentIntervention] = useState<any>(null);

  // Redirect if no child is selected
  useEffect(() => {
    if (!selectedChild) {
      navigate('/profiles');
    }
  }, [selectedChild, navigate]);

  // Update session timer every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionStarted && sessionStartTime && !sessionEnded) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
        setSessionTime(elapsed);
        
        // Calculate XP (1 per minute)
        const minutes = Math.floor(elapsed / 60);
        setXpEarned(minutes);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionStarted, sessionStartTime, sessionEnded]);

  // Randomly show quizzes during session (simplified for now)
  useEffect(() => {
    if (!sessionStarted || sessionEnded || showQuiz) return;
    
    const interval = Math.floor(Math.random() * 300000) + 300000; // 5-10 minutes
    const quizTimer = setTimeout(() => {
      setShowQuiz(true);
    }, interval);
    
    return () => clearTimeout(quizTimer);
  }, [sessionStarted, sessionEnded, showQuiz]);

  // Intervention handling
  const handleInterventionNeeded = (intervention: any) => {
    console.log('📢 Intervention requested:', intervention);
    
    // Add to queue
    setInterventionQueue(prev => [...prev, intervention]);
    
    switch (intervention.type) {
      case 'engaging_quiz':
        handleQuizOpen();
        break;
      case 'helpful_hint':
        showHint(intervention.reason);
        setTimeout(() => handleQuizOpen(), 5000); // Quiz after hint
        break;
      case 'break_suggestion':
        showBreakSuggestion();
        break;
      case 'attention_check':
        handleQuizOpen(); // Simple quiz to re-engage
        break;
      default:
        console.log('Unknown intervention type:', intervention.type);
    }
  };

  const handleQuizOpen = () => {
    setShowQuiz(true);
    setIsMLPaused(true); // Pause ML during quiz
  };

  const handleQuizClose = () => {
    setShowQuiz(false);
    setIsMLPaused(false); // Resume ML after quiz
  };

  const showHint = (reason: string) => {
    setCurrentIntervention({
      type: 'hint',
      message: reason,
      icon: Lightbulb
    });
    
    setTimeout(() => {
      setCurrentIntervention(null);
    }, 5000);
  };

  const showBreakSuggestion = () => {
    setCurrentIntervention({
      type: 'break',
      message: "Time for a quick break! Take a deep breath and stretch.",
      icon: Coffee
    });
    
    setTimeout(() => {
      setCurrentIntervention(null);
    }, 8000);
  };

  const handleAnalysisUpdate = (analysis: any) => {
    console.log('📊 Analysis update:', analysis);
    setAttentionScore(analysis.attentionScore * 100);
    setCurrentLearningState(analysis.learningState || 'neutral');
    // Handle analysis updates if needed
  };

  const handleStartSession = async () => {
    if (!selectedChild) return;

    setError(null);
    setSessionLoading(true);

    try {
      console.log('▶️ Child starting session:', { child: selectedChild.name, subject, duration });
      
      const result = await apiService.startSession({
        childId: selectedChild.id,
        subject: subject,
        plannedDuration: duration * 60, // convert to seconds
        settings: {
          sessionDuration: duration,
          breakDuration: 5,
          difficultyLevel: 'medium',
          subjects: [subject],
          enableQuizzes: true,
          enableBreakReminders: true
        }
      });

      if (result.success && result.data) {
        console.log('✅ Session started successfully:', result.data.sessionId);
        
        // Get full session details
        const sessionResult = await apiService.getSession(result.data.sessionId);
        
        if (sessionResult.success && sessionResult.data) {
          setActiveSession(sessionResult.data.session);
          setSessionStarted(true);
          setSessionStartTime(new Date(result.data.startTime));
          setSessionTime(0);
          setXpEarned(0);
        }
      } else {
        setError(result.error || 'Failed to start session');
      }
    } catch (error: any) {
      console.error('🚨 Error starting session:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    setSessionLoading(true);

    try {
      console.log('⏹️ Child ending session:', activeSession.sessionId);
      
      const endTime = new Date().toISOString();
      const result = await apiService.endSession({
        sessionId: activeSession.sessionId,
        endTime: endTime,
        actualDuration: sessionTime,
        results: {
          focusedTime: Math.floor(sessionTime * (attentionScore / 100)),
          averageAttentionScore: attentionScore / 100,
          notes: 'Session completed by child'
        }
      });

      if (result.success && result.data) {
        console.log('✅ Session ended successfully');
        setSessionEnded(true);
        
        // Show completion modal for 3 seconds
        setTimeout(() => {
          navigate('/profiles');
        }, 3000);
      } else {
        setError(result.error || 'Failed to end session');
      }
    } catch (error: any) {
      console.error('🚨 Error ending session:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleAttentionChange = (score: number) => {
    setAttentionScore(score);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    if (!activeSession) return 0;
    const plannedSeconds = duration * 60;
    return Math.min((sessionTime / plannedSeconds) * 100, 100);
  };

  const getSubjectEmoji = (subject: string): string => {
    switch (subject.toLowerCase()) {
      case 'mathematics':
      case 'math':
        return '🔢';
      case 'reading':
      case 'literature':
        return '📚';
      case 'science':
        return '🔬';
      case 'writing':
        return '✍️';
      case 'history':
        return '📜';
      case 'art':
        return '🎨';
      default:
        return '📖';
    }
  };

  if (!selectedChild) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <button 
          onClick={() => navigate('/profiles')}
          className="flex items-center text-primary-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={20} className="mr-1" />
          Back to Profiles
        </button>
        <Logo />
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {!sessionStarted ? (
          // Session Setup Screen
          <motion.div 
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-8">
              <img 
                src={selectedChild.avatar} 
                alt={selectedChild.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg"
              />
              <h1 className="text-4xl font-bold mb-2">
                Hi, {selectedChild.name}! 👋
              </h1>
              <p className="text-xl text-gray-600">
                Ready to start a super focus session?
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">🎯 Choose Your Adventure!</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    📚 What are you studying today?
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-lg focus:border-primary-500 focus:outline-none"
                  >
                    <option value="general">📖 General Study</option>
                    <option value="mathematics">🔢 Math</option>
                    <option value="reading">📚 Reading</option>
                    <option value="science">🔬 Science</option>
                    <option value="writing">✍️ Writing</option>
                    <option value="history">📜 History</option>
                    <option value="art">🎨 Art</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    ⏰ How long do you want to study?
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-lg focus:border-primary-500 focus:outline-none"
                  >
                    <option value={15}>15 minutes ⚡</option>
                    <option value={20}>20 minutes 🚀</option>
                    <option value={25}>25 minutes 🎯</option>
                    <option value={30}>30 minutes 💪</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleStartSession}
                disabled={sessionLoading}
                className="btn-primary btn-xl w-full text-xl"
              >
                {sessionLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                ) : (
                  <Play size={24} className="mr-3" />
                )}
                Start My Focus Session! 🚀
              </button>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
              <h3 className="text-lg font-bold mb-3 flex items-center justify-center">
                <Star className="mr-2 text-yellow-500" />
                Focus Tips for Super Learners!
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start">
                  <span className="text-yellow-500 mr-2 text-lg">🧘</span>
                  <span>Sit up tall like a superhero</span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-500 mr-2 text-lg">👀</span>
                  <span>Keep your eyes on the screen</span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-500 mr-2 text-lg">🧠</span>
                  <span>Answer quiz questions to earn XP</span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-500 mr-2 text-lg">🎉</span>
                  <span>Have fun learning!</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // Active Session Screen
          <motion.div 
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-4xl">{getSubjectEmoji(subject)}</span>
              <div>
                <h1 className="text-3xl font-bold">
                  Great job, {selectedChild.name}! 🌟
                </h1>
                <p className="text-lg text-gray-600">Keep focusing and earn XP!</p>
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 max-w-md mx-auto">
              <div className="relative w-32 h-32 mx-auto mb-4">
                {/* Progress Ring */}
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - getProgressPercentage() / 100)}`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Timer Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {formatTime(sessionTime)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.floor(sessionTime / 60)} min
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-6 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">+{xpEarned}</div>
                  <div className="text-xs text-gray-600">XP Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{Math.round(attentionScore)}%</div>
                  <div className="text-xs text-gray-600">Focus Score</div>
                </div>
                {interventionQueue.length > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{interventionQueue.length}</div>
                    <div className="text-xs text-gray-600">Helps Given</div>
                  </div>
                )}
              </div>

              <button
                onClick={handleEndSession}
                disabled={sessionLoading}
                className="btn bg-red-500 hover:bg-red-600 text-white w-full"
              >
                {sessionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Square size={16} className="mr-2" />
                )}
                Finish Session
              </button>
            </div>
          </motion.div>
        )}

          {sessionStarted && activeSession?.sessionId && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <VideoFeed 
                  sessionId={activeSession.sessionId}
                  onAttentionChange={handleAttentionChange}
                  onInterventionNeeded={handleInterventionNeeded}
                  onAnalysisUpdate={handleAnalysisUpdate}
                  isPaused={isMLPaused}
                />
              </div>
            
            <div className="space-y-6">
              <FocusPet attentionScore={attentionScore} />
              
              <div className="card bg-blue-50 border border-blue-200">
                <h3 className="text-lg font-bold flex items-center mb-3">
                  <BookOpen size={20} className="mr-2 text-blue-500" />
                  Study Tips 💡
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">🧘</span>
                    <span>Sit up straight and stay still</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">👀</span>
                    <span>Look at the screen</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">🧠</span>
                    <span>Answer quiz questions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">⭐</span>
                    <span>Earn more XP points!</span>
                  </li>
                </ul>
              </div>
              
              <div className="card bg-green-50 border border-green-200">
                <div className="flex items-center text-green-700 mb-3">
                  <Shield size={20} className="mr-2" />
                  <h3 className="font-bold">Safe & Private 🛡️</h3>
                </div>
                <p className="text-sm text-gray-700">
                  We only check if you're focused. No videos or photos are saved! 
                  Only your parents can see your focus score.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* With this for the test: */}
          {/* {sessionStarted && (
            <VideoDebug />
          )} */}
      </main>
      
      <QuizModal 
        isOpen={showQuiz} 
        onClose={handleQuizClose} 
        attentionScore={attentionScore}
        sessionId={activeSession?.sessionId || ''}
        subject={subject}
        learningState={currentLearningState}
      />
      
      {/* Intervention Display */}
      {currentIntervention && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="bg-white rounded-3xl p-8 text-center max-w-md mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="bg-blue-100 rounded-full p-4 inline-flex mb-4">
              <currentIntervention.icon size={32} className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {currentIntervention.type === 'hint' ? '💡 Helpful Hint!' : '☕ Break Time!'}
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              {currentIntervention.message}
            </p>
            <div className="text-sm text-gray-500">
              {currentIntervention.type === 'hint' ? 'A quiz is coming next!' : 'Take a moment to refresh!'}
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {sessionEnded && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="bg-white rounded-3xl p-8 text-center max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="bg-green-100 rounded-full p-4 inline-flex mb-4">
              <Trophy size={32} className="text-green-500" />
            </div>
            <h2 className="text-3xl font-bold mb-2">🎉 Awesome Job!</h2>
            <p className="text-xl mb-4">
              You earned <span className="text-yellow-600 font-bold">+{xpEarned} XP</span>!
            </p>
            <p className="text-lg mb-6 text-gray-600">
              You focused for {formatTime(sessionTime)}! 
            </p>
            <div className="text-gray-500">Taking you back to profiles...</div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default StudySessionPage;