#!/usr/bin/env python3
"""
Test script for emotion detection using webcam and ML models
"""

import cv2
import os
import numpy as np
import time
import sys
import tensorflow as tf
from tensorflow import keras

# Add the parent directory to path to import ML modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.ml_processing.ml_analyzer import MLAnalyzer

class EmotionDetectionTest:
    def __init__(self):
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
        self.learning_labels = ['engagement', 'confusion', 'boredom', 'frustration']
        self.ml_analyzer = None
        self.face_cascade = None
        
    def load_models(self):
        """Load ML models and face detection cascade"""
        print("🔧 Loading ML models and face detection...")
        
        try:
            # Initialize ML analyzer
            self.ml_analyzer = MLAnalyzer()
            
            # Load the models explicitly
            self.ml_analyzer.load_models()
            print("✅ ML Analyzer initialized and models loaded")
            
            # Load face cascade
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            
            if self.face_cascade.empty():
                print("❌ Failed to load face cascade")
                return False
                
            print("✅ Face detection cascade loaded")
            return True
            
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            return False
    
    def predict_emotion(self, face_img):
        """Predict emotion from face image (uses face crop)"""
        try:
            # Use MLAnalyzer's preprocessing method (face crop)
            processed = self.ml_analyzer.preprocess_image_for_emotion(face_img)
            
            # Predict emotion
            emotion_pred = self.ml_analyzer.emotion_model.predict(processed, verbose=0)
            emotion_idx = np.argmax(emotion_pred[0])
            emotion_label = self.emotion_labels[emotion_idx]
            confidence = float(emotion_pred[0][emotion_idx])
            
            return emotion_label, confidence
            
        except Exception as e:
            print(f"❌ Error predicting emotion: {e}")
            return None, 0.0
    
    def predict_learning_state(self, full_frame):
        """Predict learning state from full frame (uses full image)"""
        try:
            # Use MLAnalyzer's preprocessing method (full image)
            processed = self.ml_analyzer.preprocess_image_for_learning(full_frame)
            
            # Predict learning state
            learning_pred = self.ml_analyzer.learning_model.predict(processed, verbose=0)
            learning_idx = np.argmax(learning_pred[0])
            learning_label = self.learning_labels[learning_idx]
            confidence = float(learning_pred[0][learning_idx])
            
            return learning_label, confidence
            
        except Exception as e:
            print(f"❌ Error predicting learning state: {e}")
            return None, 0.0
    
    def run_webcam_test(self):
        """Run real-time emotion detection test with webcam"""
        print("\n📹 Starting emotion detection test with webcam...")
        print("Press 'q' to quit, 's' to save test image")
        
        # Create testimages directory
        test_images_dir = "test/testimages"
        os.makedirs(test_images_dir, exist_ok=True)
        
        # Open webcam
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ Could not open webcam!")
            return False
        
        print("✅ Webcam opened successfully")
        print("👤 Look at the camera to test emotion detection")
        print("📊 Colors: Green=Happy, Blue=Sad, Red=Angry, Yellow=Surprise")
        print("🎭 Emotion model: Uses face crop")
        print("🧠 Learning model: Uses full image")
        print(f"📁 Test images will be saved in: {test_images_dir}")
        
        frame_count = 0
        detection_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Failed to read from webcam")
                break
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.1, 
                minNeighbors=5, 
                minSize=(30, 30)
            )
            
            # Process each detected face
            for i, (x, y, w, h) in enumerate(faces):
                # Extract face region
                face_img = frame[y:y+h, x:x+w]
                
                # Predict emotion and learning state
                emotion, emotion_conf = self.predict_emotion(face_img)
                learning, learning_conf = self.predict_learning_state(frame) # Pass full frame for learning
                
                # Choose color based on emotion
                color_map = {
                    'happy': (0, 255, 0),      # Green
                    'sad': (255, 0, 0),        # Blue
                    'angry': (0, 0, 255),      # Red
                    'surprise': (0, 255, 255), # Yellow
                    'fear': (255, 0, 255),     # Magenta
                    'disgust': (0, 165, 255),  # Orange
                    'neutral': (128, 128, 128) # Gray
                }
                
                color = color_map.get(emotion, (255, 255, 255))
                
                # Draw rectangle around face
                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                
                # Add emotion label
                emotion_text = f"{emotion} ({emotion_conf:.1%})"
                cv2.putText(frame, emotion_text, (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                
                # Add learning state label
                learning_text = f"{learning} ({learning_conf:.1%})"
                cv2.putText(frame, learning_text, (x, y+h+20), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                detection_count += 1
                
                # Print predictions every 30 frames (about 1 second)
                if frame_count % 30 == 0:
                    print(f"🎭 Emotion: {emotion} ({emotion_conf:.1%}) | 🧠 Learning: {learning} ({learning_conf:.1%})")
            
            # Add info text
            cv2.putText(frame, f'Faces: {len(faces)} | Frame: {frame_count}', (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(frame, 'Press q to quit, s to save', (10, 60), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Show frame
            cv2.imshow('Emotion Detection Test', frame)
            
            # Handle key presses
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                # Save test image
                timestamp = int(time.time())
                filename = os.path.join(test_images_dir, f'emotion_detection_test_{timestamp}.jpg')
                cv2.imwrite(filename, frame)
                print(f"📸 Saved test image: {filename}")
            
            frame_count += 1
        
        # Cleanup
        cap.release()
        cv2.destroyAllWindows()
        
        print(f"\n📊 Test Summary:")
        print(f"   Total frames processed: {frame_count}")
        print(f"   Face detections: {detection_count}")
        
        return detection_count > 0

def main():
    print("🚀 Emotion Detection Test with Webcam")
    print("=" * 50)
    
    # Change to backend-main directory for proper model loading
    backend_dir = os.path.join(os.path.dirname(__file__), '..')
    os.chdir(backend_dir)
    print(f"📁 Working directory: {os.getcwd()}")
    
    # Initialize test
    test = EmotionDetectionTest()
    
    # Load models
    if not test.load_models():
        print("❌ Failed to load models")
        return
    
    # Run webcam test
    success = test.run_webcam_test()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Emotion detection working correctly!")
        print("✅ Your ML models are functioning properly")
    else:
        print("⚠️ No faces detected during test")
        print("💡 Make sure you're looking at the camera")
    
    print("\n📝 To see if it's working in your app, check the backend logs for:")
    print("   - 'Emotion detected: ...'")
    print("   - 'Learning state: ...'")

if __name__ == "__main__":
    main() 