#!/usr/bin/env python3
"""
Test script to verify Haar cascade face detection with webcam
"""

import cv2
import os
import numpy as np
import time

def test_haar_cascade():
    """Test if Haar cascade can be loaded and used"""
    
    print("🔍 Testing Haar Cascade Face Detection...")
    print("=" * 50)
    
    # 1. Check OpenCV installation
    print(f"📦 OpenCV version: {cv2.__version__}")
    print(f"📁 Cascade directory: {cv2.data.haarcascades}")
    
    # 2. Check cascade file existence
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    print(f"📄 Cascade file exists: {os.path.exists(cascade_path)}")
    
    # 3. Try to load cascade
    try:
        face_cascade = cv2.CascadeClassifier(cascade_path)
        if face_cascade.empty():
            print("❌ Cascade file exists but failed to load!")
            return False
        else:
            print("✅ Cascade loaded successfully!")
    except Exception as e:
        print(f"❌ Error loading cascade: {e}")
        return False
    
    return True

def test_webcam_face_detection():
    """Test face detection with webcam"""
    print("\n📹 Testing face detection with webcam...")
    print("Press 'q' to quit, 's' to save test image")
    
    # Create testimages directory if it doesn't exist
    test_images_dir = "test/testimages"
    os.makedirs(test_images_dir, exist_ok=True)
    
    # Load cascade
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    
    # Open webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Could not open webcam!")
        return False
    
    print("✅ Webcam opened successfully")
    print("👤 Look at the camera to test face detection")
    print("📊 Green rectangles = detected faces")
    print(f"📁 Test images will be saved in: {test_images_dir}")
    
    frame_count = 0
    face_detected = False
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Failed to read from webcam")
            break
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )
        
        # Draw rectangles around faces
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, f'Face {len(faces)}', (x, y-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            face_detected = True
        
        # Add info text
        cv2.putText(frame, f'Faces detected: {len(faces)}', (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.putText(frame, 'Press q to quit, s to save', (10, 70), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Show frame
        cv2.imshow('Face Detection Test', frame)
        
        # Handle key presses
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('s'):
            # Save test image
            timestamp = int(time.time())
            filename = os.path.join(test_images_dir, f'face_detection_test_{timestamp}.jpg')
            cv2.imwrite(filename, frame)
            print(f"📸 Saved test image: {filename}")
        
        frame_count += 1
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    
    if face_detected:
        print("✅ Face detection working correctly!")
        return True
    else:
        print("⚠️ No faces detected during test")
        print("💡 Make sure you're looking at the camera")
        return False

def test_custom_paths():
    """Test custom cascade file paths"""
    print("\n🔍 Testing custom cascade paths...")
    
    custom_paths = [
        'models/haarcascade_frontalface_default.xml',
        'backend-main/models/haarcascade_frontalface_default.xml',
        '../models/haarcascade_frontalface_default.xml'
    ]
    
    for path in custom_paths:
        exists = os.path.exists(path)
        print(f"📄 {path}: {'✅ EXISTS' if exists else '❌ NOT FOUND'}")
        
        if exists:
            try:
                cascade = cv2.CascadeClassifier(path)
                if not cascade.empty():
                    print(f"✅ Successfully loaded from: {path}")
                else:
                    print(f"❌ Failed to load from: {path}")
            except Exception as e:
                print(f"❌ Error loading from {path}: {e}")

if __name__ == "__main__":
    print("🚀 Haar Cascade Face Detection Test with Webcam")
    print("=" * 50)
    
    # Test OpenCV cascade loading
    cascade_loaded = test_haar_cascade()
    
    if cascade_loaded:
        # Test with webcam
        webcam_success = test_webcam_face_detection()
        
        # Test custom paths
        test_custom_paths()
        
        print("\n" + "=" * 50)
        if webcam_success:
            print("🎉 Haar cascade is working perfectly!")
            print("✅ Your ML analyzer will crop faces for better accuracy")
        else:
            print("⚠️ Face detection may need adjustment")
            print("💡 Check lighting and camera position")
    else:
        print("❌ Cascade loading failed")
        print("💡 The ML analyzer will still work but without face cropping")
    
    print("\n📝 To see if it's working in your app, check the backend logs for:")
    print("   - '✅ Face detection cascade loaded from: ...'")
    print("   - 'Face detected and cropped: ...'") 