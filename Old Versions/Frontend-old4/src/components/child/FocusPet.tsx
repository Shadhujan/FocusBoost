import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FocusPetProps {
  attentionScore: number;
}

const FocusPet: React.FC<FocusPetProps> = ({ attentionScore }) => {
  const [mood, setMood] = useState<'happy' | 'neutral' | 'sad'>('neutral');
  const [message, setMessage] = useState('Im here to help you focus!');

  useEffect(() => {
    if (attentionScore > 80) {
      setMood('happy');
      setMessage('Amazing focus! Keep it up!');
    } else if (attentionScore > 50) {
      setMood('neutral');
      setMessage('Youre doing okay. Stay focused!');
    } else {
      setMood('sad');
      setMessage('Oops! Lets get back to work.');
    }
  }, [attentionScore]);

  const getEmoji = () => {
    switch (mood) {
      case 'happy':
        return '🦊';
      case 'neutral':
        return '🦊';
      case 'sad':
        return '🦊';
      default:
        return '🦊';
    }
  };

  const getMoodClass = () => {
    switch (mood) {
      case 'happy':
        return 'bg-success-100 text-success-700';
      case 'neutral':
        return 'bg-secondary-100 text-secondary-700';
      case 'sad':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`card ${getMoodClass()}`}>
      <div className="flex items-center">
        <motion.div 
          className="text-5xl mr-4"
          animate={{ 
            y: [0, -8, 0],
            rotate: mood === 'happy' ? [0, -5, 5, 0] : 0
          }}
          transition={{ 
            duration: mood === 'happy' ? 2 : 4,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          {getEmoji()}
        </motion.div>
        
        <div>
          <h3 className="font-bold text-lg">Foxy</h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={message}
            className="text-sm"
          >
            {message}
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default FocusPet;