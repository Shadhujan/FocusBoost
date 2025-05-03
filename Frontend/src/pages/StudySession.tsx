import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Shield } from 'lucide-react';
import Logo from '../components/shared/Logo';
import VideoFeed from '../components/child/VideoFeed';
import QuizModal from '../components/child/QuizModal';
import FocusTimer from '../components/child/FocusTimer';
import FocusPet from '../components/child/FocusPet';
import { useUser } from '../context/UserContext';

const StudySession: React.FC = () => {
  const navigate = useNavigate();
  const { selectedChild, addSession } = useUser();
  const [attentionScore, setAttentionScore] = useState(100);
  const [sessionTime, setSessionTime] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  // Redirect if no child is selected
  useEffect(() => {
    if (!selectedChild) {
      navigate('/profiles');
    }
  }, [selectedChild, navigate]);

  // Increase session time
  useEffect(() => {
    if (sessionEnded) return;
    
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 60000); // Increment every minute
    
    return () => clearInterval(timer);
  }, [sessionEnded]);

  // Randomly show quizzes to test attention
  useEffect(() => {
    if (sessionEnded) return;
    
    const interval = Math.floor(Math.random() * 5000) + 5000; // Between 5-10 minutes
    const quizTimer = setTimeout(() => {
      if (!showQuiz) {
        setShowQuiz(true);
      }
    }, interval);
    
    return () => clearTimeout(quizTimer);
  }, [showQuiz, sessionEnded]);

  const handleAttentionChange = (score: number) => {
    setAttentionScore(score);
  };

  const handleEndSession = () => {
    if (!selectedChild) return;
    
    setSessionEnded(true);
    
    // Add session to history
    const sessionData = {
      id: Date.now().toString(),
      childId: selectedChild.id,
      date: new Date().toISOString().split('T')[0],
      duration: Math.max(1, sessionTime), // Minimum 1 minute
      focusScore: Math.round(attentionScore),
      emotions: {
        happy: attentionScore > 80 ? 70 : attentionScore > 50 ? 40 : 20,
        neutral: attentionScore > 80 ? 20 : attentionScore > 50 ? 40 : 30,
        distracted: attentionScore > 80 ? 10 : attentionScore > 50 ? 20 : 50,
      }
    };
    
    addSession(sessionData);
    
    // Navigate back to profile selection after a delay
    setTimeout(() => {
      navigate('/profiles');
    }, 3000);
  };

  if (!selectedChild) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <button 
          onClick={() => navigate('/profiles')}
          className="flex items-center text-primary-500 hover:text-primary-600"
        >
          <ArrowLeft size={20} className="mr-1" />
          Back to Profiles
        </button>
        <Logo />
      </header>
      
      <main className="container mx-auto px-4 py-6">
        <motion.div 
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold">
            Hi, {selectedChild.name}! Let's get focused!
          </h1>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VideoFeed onAttentionChange={handleAttentionChange} />
          </div>
          
          <div className="space-y-6">
            <FocusTimer initialMinutes={25} onComplete={handleEndSession} />
            <FocusPet attentionScore={attentionScore} />
            
            <div className="card bg-primary-50 border border-primary-100">
              <h3 className="text-xl font-bold flex items-center mb-3">
                <BookOpen size={20} className="mr-2 text-primary-500" />
                Study Tips
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  <span>Sit up straight and stay still</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  <span>Look at the screen, not around the room</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  <span>Try to answer quiz questions correctly</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  <span>Take a short break if you feel tired</span>
                </li>
              </ul>
            </div>
            
            <div className="card bg-accent-50 border border-accent-100">
              <div className="flex items-center text-accent-700 mb-3">
                <Shield size={20} className="mr-2" />
                <h3 className="text-lg font-bold">Privacy Notice</h3>
              </div>
              <p className="text-sm text-gray-700">
                FocusBoost only tracks your attention. We never store video 
                or images of you. Only your parents can see your focus scores.
              </p>
            </div>
            
            <button 
              onClick={handleEndSession}
              className="w-full btn-error"
            >
              End Session
            </button>
          </div>
        </div>
      </main>
      
      <QuizModal 
        isOpen={showQuiz} 
        onClose={() => setShowQuiz(false)} 
        attentionScore={attentionScore}
      />
      
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
            <div className="bg-success-100 rounded-full p-4 inline-flex mb-4">
              <Check size={32} className="text-success-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Great job!</h2>
            <p className="text-xl mb-6">
              You've completed your focus session!
            </p>
            <div className="text-gray-600">Redirecting to profiles...</div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// Need to import Check icon
import { Check } from 'lucide-react';

export default StudySession;