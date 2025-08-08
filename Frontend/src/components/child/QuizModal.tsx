// src/components/child/QuizModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Star, Clock } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useUser } from '../../context/UserContext';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  attentionScore: number;
  sessionId: string;
  subject: string;
  learningState?: string;
}

const QuizModal: React.FC<QuizModalProps> = ({ 
  isOpen, 
  onClose, 
  attentionScore,
  sessionId,
  subject,
  learningState = 'neutral'
}) => {
  const { selectedChild } = useUser();
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    if (isOpen && selectedChild) {
      fetchQuiz();
      setStartTime(Date.now());
    }
  }, [isOpen]);

  const fetchQuiz = async () => {
    if (!selectedChild) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.generateQuiz({
        childId: selectedChild.id,
        sessionId: sessionId,
        subject: subject,
        attentionScore: attentionScore,
        learningState: learningState
      });
      
      if (response.success && response.data && response.data.quiz) {
        const rawQuiz = response.data.quiz as any;
        const hasShape = rawQuiz && typeof rawQuiz === 'object' && typeof rawQuiz.question === 'string' && Array.isArray(rawQuiz.options);
        if (!hasShape) {
          console.error('Quiz payload missing required fields:', rawQuiz);
          setError('No quiz available. Please try again.');
          setCurrentQuiz(null);
          return;
        }
        const normalizedQuiz = {
          ...rawQuiz,
          options: (rawQuiz.options || []).map((o: any) => String(o))
        };
        setCurrentQuiz(normalizedQuiz);
        console.log('📚 Quiz loaded:', normalizedQuiz.question);
      } else {
        console.error('Quiz not available or response malformed:', response);
        setError(response.error || 'No quiz available. Please try again.');
        setCurrentQuiz(null);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError('Failed to load quiz. Please try again.');
      setCurrentQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (index: number) => {
    if (selectedAnswer !== null || !currentQuiz) return;
    
    setSelectedAnswer(index);
    const correct = index === currentQuiz.correct_index;
    setIsCorrect(correct);
    
    // Calculate time taken
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    // Submit answer
    const result = await apiService.submitQuizAnswer({
      sessionId: sessionId,
      quizId: currentQuiz.quiz_id,
      selectedAnswer: index,
      correctAnswer: currentQuiz.correct_index,
      timeTaken: timeTaken,
      xpReward: currentQuiz.xp_reward
    });
    
    if (result.success && result.data) {
      setXpEarned(result.data.xpEarned);
    }
    
    setShowResult(true);
    
    // Auto close after showing result
    setTimeout(() => {
      handleClose();
    }, correct ? 3000 : 4000);
  };

  const handleClose = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentQuiz(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div 
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-3xl text-white">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center">
                🧠 Brain Boost Quiz!
              </h2>
              <button 
                onClick={handleClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Creating your quiz...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <button 
                  onClick={fetchQuiz}
                  className="btn-primary"
                >
                  Try Again
                </button>
              </div>
            ) : currentQuiz ? (
              <>
                {/* Question */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">{currentQuiz.question}</h3>
                  {currentQuiz.difficulty && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      currentQuiz.difficulty === 'easy' ? 'bg-green-100 text-green-600' :
                      currentQuiz.difficulty === 'hard' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {currentQuiz.difficulty.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                  {Array.isArray(currentQuiz.options) ? (
                    currentQuiz.options.map((option: string, index: number) => (
                      <motion.button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={selectedAnswer !== null}
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          selectedAnswer === null
                            ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer'
                            : selectedAnswer === index
                            ? isCorrect
                              ? 'bg-green-100 border-2 border-green-500'
                              : 'bg-red-100 border-2 border-red-500'
                            : index === currentQuiz.correct_index && showResult
                            ? 'bg-green-100 border-2 border-green-500'
                            : 'bg-gray-50'
                        }`}
                        whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
                        whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                      >
                        <div className="flex items-center">
                          <span className="text-lg font-bold mr-3">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span>{option}</span>
                        </div>
                      </motion.button>
                    ))
                  ) : (
                    <div className="text-sm text-gray-600">No options available.</div>
                  )}
                </div>

                {/* Hint (shown before answering) */}
                {!showResult && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                    <div className="flex items-start">
                      <Lightbulb className="text-yellow-500 mr-2 mt-1" size={20} />
                      <div>
                        <p className="font-semibold text-yellow-700">Need a hint?</p>
                        <p className="text-sm text-gray-700">{currentQuiz.hint}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Result */}
                {showResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-6 ${
                      isCorrect ? 'bg-green-50' : 'bg-orange-50'
                    }`}
                  >
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">
                        {isCorrect ? '🎉' : '🤔'}
                      </div>
                      <h4 className="text-xl font-bold mb-1">
                        {isCorrect ? 'Fantastic!' : 'Good Try!'}
                      </h4>
                      <p className="text-lg text-gray-700">
                        You earned <span className="font-bold text-yellow-600">+{xpEarned} XP</span>!
                      </p>
                    </div>
                    
                    <div className="border-t pt-4">
                      <p className="font-semibold mb-2">Explanation:</p>
                      <p className="text-gray-700">{currentQuiz.explanation}</p>
                      
                      {currentQuiz.fun_fact && (
                        <div className="mt-3 bg-white rounded-lg p-3">
                          <p className="text-sm">
                            <span className="font-semibold">✨ Fun Fact:</span> {currentQuiz.fun_fact}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuizModal;