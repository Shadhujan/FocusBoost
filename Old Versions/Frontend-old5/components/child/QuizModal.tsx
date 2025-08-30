import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Check, X } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  attentionScore: number;
}

// Sample questions for demo
const questionBank: Question[] = [
  {
    id: 1,
    text: "What is 5 + 3?",
    options: ["7", "8", "9", "10"],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: 2,
    text: "Which animal can fly?",
    options: ["Dog", "Cat", "Bird", "Fish"],
    correctAnswer: 2,
    difficulty: 'easy'
  },
  {
    id: 3,
    text: "What is 7 × 6?",
    options: ["42", "36", "48", "54"],
    correctAnswer: 0,
    difficulty: 'medium'
  },
  {
    id: 4,
    text: "Which is NOT a primary color?",
    options: ["Red", "Blue", "Green", "Yellow"],
    correctAnswer: 3,
    difficulty: 'medium'
  },
  {
    id: 5,
    text: "How many sides does a hexagon have?",
    options: ["4", "5", "6", "8"],
    correctAnswer: 2,
    difficulty: 'hard'
  }
];

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, attentionScore }) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

  // Select a random question based on attention score
  useEffect(() => {
    if (isOpen) {
      let difficulty: 'easy' | 'medium' | 'hard';
      
      if (attentionScore < 50) {
        difficulty = 'easy';
      } else if (attentionScore < 80) {
        difficulty = 'medium';
      } else {
        difficulty = 'hard';
      }
      
      const filteredQuestions = questionBank.filter(q => q.difficulty === difficulty);
      const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
      setCurrentQuestion(filteredQuestions[randomIndex] || questionBank[0]);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  }, [isOpen, attentionScore]);

  const handleOptionSelect = (optionIndex: number) => {
    if (isCorrect !== null) return; // Already answered
    
    setSelectedOption(optionIndex);
    const correct = optionIndex === currentQuestion?.correctAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(score + 1);
    }
    
    setQuestionCount(questionCount + 1);
    
    // Show correct/incorrect for 1.5 seconds, then close or show next question
    setTimeout(() => {
      if (questionCount >= 4) {
        setTimeout(onClose, 500);
      } else {
        // Reset for next question
        setSelectedOption(null);
        setIsCorrect(null);
        
        // Get next question
        const filteredQuestions = questionBank.filter(q => 
          q.id !== currentQuestion?.id
        );
        const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
        setCurrentQuestion(filteredQuestions[randomIndex]);
      }
    }, 1500);
  };

  if (!isOpen || !currentQuestion) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-white rounded-3xl p-6 w-full max-w-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <div className="text-center mb-6">
            <div className="bg-primary-100 rounded-full p-3 inline-block mb-3">
              <BookOpen className="text-primary-500" size={28} />
            </div>
            <h2 className="text-2xl font-bold">Quick Quiz Time!</h2>
            <p className="text-gray-600 mt-1">Let's see what you've learned!</p>
          </div>
          
          <div className="mb-6">
            <p className="text-lg font-semibold mb-4">{currentQuestion.text}</p>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    selectedOption === index
                      ? isCorrect
                        ? 'bg-success-100 border-2 border-success-500'
                        : 'bg-error-100 border-2 border-error-500'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  disabled={selectedOption !== null}
                >
                  <div className="flex justify-between items-center">
                    <span>{option}</span>
                    {selectedOption === index && (
                      isCorrect ? (
                        <Check className="text-success-500" size={20} />
                      ) : (
                        <X className="text-error-500" size={20} />
                      )
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Question {questionCount + 1}/5</span>
            <span className="font-medium">Score: {score}</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuizModal;