// Frontend/src/components/child/VideoFeed.tsx
// Updated to work with your two ML models

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Brain, Heart } from 'lucide-react';

interface VideoFeedProps {
  sessionId: string;
  onAttentionChange?: (attentionScore: number) => void;
  onAnalysisUpdate?: (analysis: AnalysisResult) => void;
  onInterventionTrigger?: (intervention: InterventionData) => void;
}

interface AnalysisResult {
  learningState: 'boredom' | 'engagement' | 'confusion' | 'frustration';
  learningConfidence: number;
  emotion: 'happy' | 'anger' | 'sad' | 'neutral' | 'surprise' | 'fear';
  emotionConfidence: number;
  attentionScore: number;
  timestamp: string;
}

interface InterventionData {
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

const VideoFeed: React.FC<VideoFeedProps> = ({ 
  sessionId, 
  onAttentionChange, 
  onAnalysisUpdate,
  onInterventionTrigger 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Process frame and send to your ML backend
  const processFrame = useCallback(async () => {
    if (!webcamRef.current || isProcessing) return;

    setIsProcessing(true);
    
    try {
      // Capture frame from webcam
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        console.warn('No image captured');
        setIsProcessing(false);
        return;
      }

      // Send to your ML backend
      const response = await fetch('/api/analyze-base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          imageData: imageSrc.split(',')[1] // Remove data:image/jpeg;base64, prefix
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.analysis) {
        const analysis: AnalysisResult = result.analysis;
        
        // Update local state
        setCurrentAnalysis(analysis);
        setConnectionError(false);
        
        // Notify parent components
        if (onAttentionChange) {
          onAttentionChange(analysis.attentionScore);
        }
        if (onAnalysisUpdate) {
          onAnalysisUpdate(analysis);
        }
        
        // Handle interventions
        if (result.intervention && onInterventionTrigger) {
          onInterventionTrigger(result.intervention);
        }
        
      } else {
        console.error('Analysis failed:', result.error);
        setConnectionError(true);
      }
      
    } catch (error) {
      console.error('Error processing frame:', error);
      setConnectionError(true);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, isProcessing, onAttentionChange, onAnalysisUpdate, onInterventionTrigger]);

  // Start camera and processing
  const handleStartCamera = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: "user"
        } 
      });
      
      // We don't need this stream, Webcam will create its own
      stream.getTracks().forEach(track => track.stop());
      
      setIsActive(true);
      setPermissionDenied(false);
      setConnectionError(false);
      
      // Start processing frames every 3 seconds
      intervalRef.current = setInterval(() => {
        processFrame();
      }, 3000);
      
    } catch (err) {
      console.error("Error accessing camera:", err);
      setPermissionDenied(true);
    }
  };

  // Stop camera and processing
  const handleStopCamera = () => {
    setIsActive(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setCurrentAnalysis(null);
    setIsProcessing(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Get attention score color
  const getAttentionColor = () => {
    if (!currentAnalysis) return 'bg-gray-400';
    const score = currentAnalysis.attentionScore;
    if (score > 0.8) return 'bg-success-500';
    if (score > 0.5) return 'bg-warning-400';
    return 'bg-error-500';
  };

  // Get attention message
  const getAttentionMessage = () => {
    if (!currentAnalysis) return 'Starting analysis...';
    
    const { learningState, emotion, attentionScore } = currentAnalysis;
    
    if (learningState === 'engagement' && attentionScore > 0.8) {
      return 'Excellent focus! 🎯';
    } else if (learningState === 'boredom') {
      return 'Looking a bit bored 😴';
    } else if (learningState === 'confusion') {
      return 'Need help? 🤔';
    } else if (learningState === 'frustration') {
      return 'Take it easy! 😤';
    } else if (emotion === 'sad' || emotion === 'anger') {
      return 'Take a break if needed 💙';
    } else {
      return 'Keep going! 👍';
    }
  };

  // Get learning state emoji
  const getLearningStateEmoji = (state: string) => {
    switch (state) {
      case 'engagement': return '🎯';
      case 'boredom': return '😴';
      case 'confusion': return '🤔';
      case 'frustration': return '😤';
      default: return '😐';
    }
  };

  // Get emotion emoji
  const getEmotionEmoji = (emotion: string) => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'anger': return '😠';
      case 'surprise': return '😲';
      case 'fear': return '😨';
      case 'neutral': return '😐';
      default: return '😐';
    }
  };

  // Handle permission denied
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
          <h3 className="text-xl font-bold mb-2">Start AI Attention Tracking</h3>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            FocusBoost uses AI to track your learning state and emotions. 
            We never store video - only analysis results!
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
          {/* Main video feed */}
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "user",
              width: 640,
              height: 480
            }}
            className="w-full rounded-t-3xl"
          />
          
          {/* Hidden canvas for processing (if needed) */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {/* Processing indicator */}
          {isProcessing && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              Analyzing...
            </div>
          )}
          
          {/* Connection error indicator */}
          {connectionError && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
              Connection Error
            </div>
          )}
          
          {/* Main attention indicator */}
          <motion.div 
            className={`absolute bottom-0 left-0 right-0 px-4 py-3 text-white ${getAttentionColor()}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{getAttentionMessage()}</span>
              <div className="flex items-center">
                <div className="w-24 h-3 bg-white bg-opacity-30 rounded-full mr-2">
                  <motion.div 
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${currentAnalysis ? currentAnalysis.attentionScore * 100 : 0}%` 
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span>
                  {currentAnalysis ? Math.round(currentAnalysis.attentionScore * 100) : 0}%
                </span>
              </div>
            </div>
            
            {/* Learning state and emotion indicators */}
            {currentAnalysis && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Brain size={16} />
                  <span>Learning: {getLearningStateEmoji(currentAnalysis.learningState)}</span>
                  <span className="capitalize">{currentAnalysis.learningState}</span>
                  <span className="opacity-75">
                    ({Math.round(currentAnalysis.learningConfidence * 100)}%)
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Heart size={16} />
                  <span>Mood: {getEmotionEmoji(currentAnalysis.emotion)}</span>
                  <span className="capitalize">{currentAnalysis.emotion}</span>
                  <span className="opacity-75">
                    ({Math.round(currentAnalysis.emotionConfidence * 100)}%)
                  </span>
                </div>
              </div>
            )}
          </motion.div>
          
          {/* Stop button */}
          <button
            onClick={handleStopCamera}
            className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
            title="Stop Camera"
          >
            <CameraOff size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoFeed;