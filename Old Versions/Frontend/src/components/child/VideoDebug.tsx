import React, { useEffect, useRef } from 'react';

// This is a minimal camera test. It does not do any ML/AI, only shows the webcam.

const VideoDebug: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Try to start the camera when the component mounts
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current!.play();
            console.log('📹 Video loaded and playing!');
          };
        }
      } catch (e) {
        console.error('Camera error:', e);
      }
    })();

    // Cleanup: Stop camera when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    }
  }, []);

  return (
    <div style={{ textAlign: 'center', margin: 40 }}>
      <video ref={videoRef} style={{ width: 400, height: 300, background: '#e88' }} autoPlay playsInline muted />
      <div>Simple Camera Test</div>
    </div>
  );
};

export default VideoDebug;
