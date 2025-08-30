#!/usr/bin/env python3
"""
Simple test to verify ML models can be loaded
"""

import os
import sys
import tensorflow as tf

# Add the parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def test_model_loading():
    """Test if ML models can be loaded"""
    print("🔧 Testing ML model loading...")
    
    try:
        # Change to backend-main directory
        backend_dir = os.path.join(os.path.dirname(__file__), '..')
        os.chdir(backend_dir)
        print(f"📁 Working directory: {os.getcwd()}")
        
        # Check if model files exist
        emotion_model_path = 'models/emotion_model.h5'
        learning_model_path = 'models/learning_states_model.h5'
        
        print(f"📄 Emotion model exists: {os.path.exists(emotion_model_path)}")
        print(f"📄 Learning model exists: {os.path.exists(learning_model_path)}")
        
        if not os.path.exists(emotion_model_path):
            print("❌ Emotion model not found!")
            return False
            
        if not os.path.exists(learning_model_path):
            print("❌ Learning model not found!")
            return False
        
        # Try to load models
        print("🔄 Loading emotion model...")
        emotion_model = tf.keras.models.load_model(emotion_model_path)
        print(f"✅ Emotion model loaded! Input shape: {emotion_model.input_shape}")
        
        print("🔄 Loading learning model...")
        learning_model = tf.keras.models.load_model(learning_model_path)
        print(f"✅ Learning model loaded! Input shape: {learning_model.input_shape}")
        
        # Test MLAnalyzer
        print("🔄 Testing MLAnalyzer...")
        from app.ml_processing.ml_analyzer import MLAnalyzer
        
        analyzer = MLAnalyzer()
        analyzer.load_models()
        
        print("✅ MLAnalyzer loaded successfully!")
        print(f"📊 Emotion model config: {analyzer.emotion_model_config}")
        print(f"📊 Learning model config: {analyzer.learning_model_config}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 ML Model Loading Test")
    print("=" * 50)
    
    success = test_model_loading()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 All models loaded successfully!")
        print("✅ Your ML system is ready for testing")
    else:
        print("❌ Model loading failed")
        print("💡 Check your model files and dependencies") 