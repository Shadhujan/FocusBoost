import React, { useRef, useEffect, useState } from 'react';
import { apiService } from '../../services/apiService';

interface VideoFeedProps {
  sessionId: string;
  onAttentionChange?: (attentionScore: number) => void;
  onAnalysisUpdate?: (analysis: any) => void;
  isActive?: boolean;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ 
  sessionId, 
  onAttentionChange, 
  onAnalysisUpdate,
  isActive = true 
}) => {
  console.log("VideoFeed component rendered!");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            console.log('📹 Video stream loaded successfully');
          };
        }
      } catch (e) {
        console.error('Camera error:', e);
      }
    })();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        console.log('Camera stream stopped!');
      }
    };
  }, []);

  // ML Polling Effect
  useEffect(() => {
    if (isVideoReady) {
      console.log("ML polling loop STARTED!");

      // Analyze immediately
      captureAndAnalyze();

      // Then every 5 seconds
      const interval = setInterval(() => {
        captureAndAnalyze();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isVideoReady]);

  // Capture and analyze function
  const captureAndAnalyze = async () => {
    if (!videoRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      setError(null);

      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (canvas.width === 0 || canvas.height === 0) {
        console.error("❌ Canvas size is zero, skipping frame capture!");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
      if (!imageData || imageData.length < 100) {
        console.error("❌ No image data captured, skipping ML analysis!");
        return;
      }

      // Build ML analysis request
      const analysisRequest = {
        sessionId: sessionId,
        imageData: imageData,
        timestamp: Date.now(),
      };

      console.log("📤 Sending frame to backend for ML analysis!", {
        size: imageData.length,
        time: analysisRequest.timestamp,
      });

      // Call API
      const response = await apiService.analyzeImage(analysisRequest);

      if (response.success && response.data) {
        const analysis = response.data;
        
        console.log("📥 Analysis received:", {
          emotion: `${analysis.emotion.emotion} (${Math.round(analysis.emotion.confidence * 100)}%)`,
          learningState: `${analysis.learningState.learningState} (${Math.round(analysis.learningState.confidence * 100)}%)`,
          attentionScore: `${Math.round(analysis.attentionScore * 100)}%`
        });

        setCurrentAnalysis(analysis);
        setAnalysisCount(prev => prev + 1);
        setError(null);

        // Notify parent components
        if (onAttentionChange) {
          onAttentionChange(analysis.attentionScore * 100);
        }
        
        if (onAnalysisUpdate) {
          onAnalysisUpdate({
            emotion: analysis.emotion.emotion,
            emotionConfidence: analysis.emotion.confidence,
            learningState: analysis.learningState.learningState,
            learningConfidence: analysis.learningState.confidence,
            attentionScore: analysis.attentionScore,
            timestamp: analysis.timestamp
          });
        }
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('❌ Error during ML analysis:', error);
      setError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions for display
  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprise: '😲',
      fear: '😨',
      disgust: '🤢',
      neutral: '😐'
    };
    return emojiMap[emotion] || '😐';
  };

  const getLearningStateEmoji = (state: string) => {
    const emojiMap: Record<string, string> = {
      engagement: '🎯',
      boredom: '😴',
      confusion: '🤔',
      frustration: '😤'
    };
    return emojiMap[state] || '😐';
  };

  const getLearningStateColor = (state: string) => {
    const colorMap: Record<string, string> = {
      engagement: 'text-green-400',
      boredom: 'text-yellow-400',
      confusion: 'text-blue-400',
      frustration: 'text-red-400'
    };
    return colorMap[state] || 'text-gray-400';
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
      <div className="relative">
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-120 object-cover bg-gray-200"
          onLoadedMetadata={() => {
            setIsVideoReady(true);
            videoRef.current?.play();
            console.log("📹 Video stream loaded successfully");
          }}
        />
        
        {/* ML Results Overlay */}
        {currentAnalysis && (
          <div className="absolute top-4 left-4 right-4">
            <div className="bg-black bg-opacity-80 text-white p-3 rounded-xl space-y-2">
              
              {/* Analysis Count */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Analysis #{analysisCount}</span>
                <span className="text-gray-400">
                  {new Date(currentAnalysis.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              {/* Emotion Results */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Emotion:</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getEmotionEmoji(currentAnalysis.emotion.emotion)}</span>
                  <span className="capitalize">{currentAnalysis.emotion.emotion}</span>
                  <span className="text-green-400 text-xs">
                    {Math.round(currentAnalysis.emotion.confidence * 100)}%
                  </span>
                </div>
              </div>
              
              {/* Learning State Results */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Focus:</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getLearningStateEmoji(currentAnalysis.learningState.learningState)}</span>
                  <span className={`capitalize ${getLearningStateColor(currentAnalysis.learningState.learningState)}`}>
                    {currentAnalysis.learningState.learningState}
                  </span>
                  <span className="text-green-400 text-xs">
                    {Math.round(currentAnalysis.learningState.confidence * 100)}%
                  </span>
                </div>
              </div>
              
              {/* Attention Score */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Attention Score:</span>
                <span className="text-lg font-bold text-green-400">
                  {Math.round(currentAnalysis.attentionScore * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute bottom-4 right-4">
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              Analyzing...
            </div>
          </div>
        )}
        
        {/* Error display */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-red-500 text-white p-2 rounded-lg text-sm">
              {error}
            </div>
          </div>
        )}
      </div>
      
      {/* Status bar */}
      <div className="p-4 bg-gray-50 text-center">
        <p className="text-sm text-gray-600">
          🤖 <strong>AI Analysis:</strong> {isVideoReady ? 'Active' : 'Loading...'} 
          {analysisCount > 0 && ` • ${analysisCount} analyses completed`}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Emotion + Learning State Detection • Backend ML Processing • Every 5 seconds
        </p>
      </div>
    </div>
  );
};

export default VideoFeed; 