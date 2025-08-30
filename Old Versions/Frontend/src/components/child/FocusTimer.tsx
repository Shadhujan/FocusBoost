import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, PlayCircle, PauseCircle, RefreshCw } from 'lucide-react';

interface FocusTimerProps {
  initialMinutes?: number;
  onComplete?: () => void;
}

const FocusTimer: React.FC<FocusTimerProps> = ({ 
  initialMinutes = 25,
  onComplete 
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(seconds => seconds - 1);
      }, 1000);
    } else if (secondsLeft === 0 && !isCompleted) {
      setIsActive(false);
      setIsCompleted(true);
      if (onComplete) onComplete();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, isCompleted, onComplete]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsCompleted(false);
    setSecondsLeft(initialMinutes * 60);
  };

  const formatTime = () => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = (1 - secondsLeft / (initialMinutes * 60)) * 100;

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Focus Timer</h3>
        {!isCompleted ? (
          <button
            onClick={toggleTimer}
            className="text-primary-500 hover:text-primary-600"
          >
            {isActive ? <PauseCircle size={24} /> : <PlayCircle size={24} />}
          </button>
        ) : (
          <button
            onClick={resetTimer}
            className="text-primary-500 hover:text-primary-600"
          >
            <RefreshCw size={20} />
          </button>
        )}
      </div>
      
      <div className="relative pt-1">
        <div className="flex items-center justify-center mb-2">
          <Clock className="text-primary-500 mr-2" size={20} />
          <div className="text-3xl font-bold tabular-nums">
            {formatTime()}
          </div>
        </div>
        
        <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-200">
          <motion.div 
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
              isCompleted ? 'bg-success-500' : 'bg-primary-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      
      {isCompleted ? (
        <div className="text-center bg-success-100 p-3 rounded-xl text-success-700 font-semibold">
          Great job! You completed your focus session.
        </div>
      ) : (
        <p className="text-sm text-gray-600 text-center">
          Stay focused for {initialMinutes} minutes!
        </p>
      )}
    </div>
  );
};

export default FocusTimer;