import React, { useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { Camera, CameraOff } from 'lucide-react';

interface VideoFeedProps {
  onAttentionChange?: (attentionScore: number) => void;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ onAttentionChange }) => {
  const [isActive, setIsActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [attentionScore, setAttentionScore] = useState(100);
  const webcamRef = React.useRef<Webcam>(null);

  // Simulate attention tracking with random fluctuations
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // In a real app, this would come from face tracking analysis
      // For demo purposes, we're using random values with a bias toward staying focused
      const change = Math.random() * 10 - 3; // Bias toward positive values
      const newScore = Math.max(0, Math.min(100, attentionScore + change));
      setAttentionScore(newScore);
      
      if (onAttentionChange) {
        onAttentionChange(newScore);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive, attentionScore, onAttentionChange]);

  const handleStartCamera = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // We don't need this stream, Webcam will create its own
      setIsActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setPermissionDenied(true);
    }
  };

  const getAttentionColor = () => {
    if (attentionScore > 80) return 'bg-success-500';
    if (attentionScore > 50) return 'bg-warning-400';
    return 'bg-error-500';
  };

  const getAttentionMessage = () => {
    if (attentionScore > 80) return 'Great focus!';
    if (attentionScore > 50) return 'Stay focused!';
    return 'Look at the screen!';
  };

  if (permissionDenied) {
    return (
      <div className="rounded-3xl bg-gray-100 p-6 flex flex-col items-center justify-center text-center">
        <CameraOff size={48} className="text-error-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">Camera Access Denied</h3>
        <p className="mb-4">We need camera access to track your attention. Please enable your camera in browser settings.</p>
        <button 
          onClick={() => setPermissionDenied(false)} 
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {!isActive ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <Camera size={48} className="text-primary-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Start Attention Tracking</h3>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            FocusBoost needs to see your face to help you stay focused. 
            We never store video - only attention scores!
          </p>
          <button 
            onClick={handleStartCamera}
            className="btn-primary"
          >
            Turn On Camera
          </button>
        </div>
      ) : (
        <div className="relative">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "user"
            }}
            className="w-full rounded-t-3xl"
          />
          
          {/* Attention indicator */}
          <motion.div 
            className={`absolute bottom-0 left-0 right-0 px-4 py-3 text-white ${getAttentionColor()} flex justify-between items-center`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="font-semibold">{getAttentionMessage()}</span>
            <div className="flex items-center">
              <div className="w-24 h-3 bg-white bg-opacity-30 rounded-full mr-2">
                <motion.div 
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${attentionScore}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span>{Math.round(attentionScore)}%</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VideoFeed;