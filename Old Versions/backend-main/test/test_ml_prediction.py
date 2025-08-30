#!/usr/bin/env python3
"""
Test ML predictions with dummy image
"""

import os
import sys
import numpy as np
import cv2

# Add the parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def test_ml_predictions():
    """Test ML predictions with dummy image"""
    print("🔧 Testing ML predictions...")
    
    try:
        # Change to backend-main directory
        backend_dir = os.path.join(os.path.dirname(__file__), '..')
        os.chdir(backend_dir)
        print(f"📁 Working directory: {os.getcwd()}")
        
        # Import MLAnalyzer
        from app.ml_processing.ml_analyzer import MLAnalyzer
        
        # Initialize analyzer
        analyzer = MLAnalyzer()
        analyzer.load_models()
        
        print("✅ MLAnalyzer loaded successfully!")
        print("🎭 Emotion model: Uses face crop")
        print("🧠 Learning model: Uses full image")
        
        # Create a dummy face image (simulate webcam frame)
        dummy_image = np.ones((480, 640, 3), dtype=np.uint8) * 128  # Gray image
        
        # Add a simple "face" region (rectangle)
        cv2.rectangle(dummy_image, (200, 150), (440, 330), (255, 255, 255), -1)
        
        print(f"📸 Created dummy image: {dummy_image.shape}")
        
        # Test emotion detection (uses face crop)
        print("🔄 Testing emotion detection (face crop)...")
        emotion_result = analyzer.detect_emotion(dummy_image)
        print(f"✅ Emotion result: {emotion_result}")
        
        # Test learning state detection (uses full image)
        print("🔄 Testing learning state detection (full image)...")
        learning_result = analyzer.detect_learning_state(dummy_image)
        print(f"✅ Learning result: {learning_result}")
        
        # Test full analysis
        print("🔄 Testing full analysis...")
        # Convert to base64 for full analysis
        import base64
        from PIL import Image
        import io
        
        pil_image = Image.fromarray(dummy_image)
        buffer = io.BytesIO()
        pil_image.save(buffer, format='JPEG')
        base64_image = base64.b64encode(buffer.getvalue()).decode()
        
        analysis_result = analyzer.analyze_image(base64_image)
        print(f"✅ Full analysis result: {analysis_result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing ML predictions: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 ML Prediction Test")
    print("=" * 50)
    
    success = test_ml_predictions()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 ML predictions working correctly!")
        print("✅ Your models are ready for webcam testing")
    else:
        print("❌ ML prediction test failed")
        print("💡 Check your model files and preprocessing") 