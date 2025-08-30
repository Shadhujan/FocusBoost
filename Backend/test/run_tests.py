#!/usr/bin/env python3
"""
Test runner for ML and face detection tests
"""

import os
import sys
import subprocess
import time

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"🚀 {title}")
    print("=" * 60)

def run_test(test_name, test_file):
    """Run a specific test"""
    print_header(f"Running {test_name}")
    
    try:
        # Change to the test directory
        test_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(test_dir)
        
        # Run the test
        result = subprocess.run([sys.executable, test_file], 
                              capture_output=False, 
                              text=True)
        
        if result.returncode == 0:
            print(f"✅ {test_name} completed successfully!")
            return True
        else:
            print(f"❌ {test_name} failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error running {test_name}: {e}")
        return False

def main():
    """Main test runner"""
    print_header("ML and Face Detection Test Suite")
    
    # Define tests
    tests = [
        ("Model Loading Test", "test_model_loading.py"),
        ("ML Prediction Test", "test_ml_prediction.py"),
        ("Face Detection Test", "face_detection_test.py"),
        ("Emotion Detection Test", "emotion_detection_test.py")
    ]
    
    # Run tests
    results = []
    for test_name, test_file in tests:
        if os.path.exists(test_file):
            success = run_test(test_name, test_file)
            results.append((test_name, success))
        else:
            print(f"❌ Test file not found: {test_file}")
            results.append((test_name, False))
    
    # Print summary
    print_header("Test Summary")
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if success:
            passed += 1
    
    print(f"\n📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your ML system is working correctly.")
    elif passed > 0:
        print("⚠️ Some tests passed. Check the failed tests above.")
    else:
        print("❌ All tests failed. Please check your setup.")
    
    # Show test images directory
    test_images_dir = "testimages"
    if os.path.exists(test_images_dir):
        images = [f for f in os.listdir(test_images_dir) if f.endswith(('.jpg', '.png'))]
        if images:
            print(f"\n📸 Test images saved in: {test_images_dir}/")
            print(f"   Found {len(images)} test images")

if __name__ == "__main__":
    main() 