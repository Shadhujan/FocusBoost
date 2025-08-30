import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const ParentLogin: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toggleParentMode } = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin === "1234") {
      toggleParentMode();
      navigate('/parent-dashboard');
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-3xl p-8 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="flex items-center justify-center mb-6">
          <div className="bg-primary-100 p-4 rounded-full">
            <Lock className="text-primary-500" size={32} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-6">Parent Access</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6 relative">
            <label htmlFor="pin" className="block text-lg font-medium mb-2">
              Enter Parent PIN
            </label>
            <div className="relative">
              <input
                id="pin"
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="input pr-12"
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                required
              />
              <button 
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowPin(!showPin)}
              >
                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && <p className="text-error-500 mt-2">{error}</p>}
          </div>
          
          <div className="flex space-x-4">
            <button 
              type="button" 
              onClick={onClose}
              className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 flex-1"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary flex-1"
            >
              Continue
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ParentLogin;