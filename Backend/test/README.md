# ML and Face Detection Tests

This folder contains comprehensive tests for the ML models and face detection functionality.

## 📁 Folder Structure

```
test/
├── README.md                    # This file
├── run_tests.py                 # Test runner script
├── face_detection_test.py       # Basic face detection test
├── emotion_detection_test.py    # Emotion and learning state detection test
└── testimages/                  # Saved test images
    ├── face_detection_test_*.jpg
    └── emotion_detection_test_*.jpg
```

## 🚀 Quick Start

### Run All Tests
```bash
cd backend-main/test
python run_tests.py
```

### Run Individual Tests
```bash
# Face detection only
python face_detection_test.py

# Emotion detection only
python emotion_detection_test.py
```

## 📋 Test Descriptions

### 1. Face Detection Test (`face_detection_test.py`)
- **Purpose**: Tests Haar cascade face detection with webcam
- **Features**:
  - Real-time webcam feed
  - Green rectangles around detected faces
  - Face counter display
  - Save test images with 's' key
  - Quit with 'q' key

### 2. Emotion Detection Test (`emotion_detection_test.py`)
- **Purpose**: Tests ML models for emotion and learning state detection
- **Features**:
  - Real-time emotion prediction
  - Learning state detection
  - Color-coded face rectangles:
    - 🟢 Green = Happy
    - 🔵 Blue = Sad
    - 🔴 Red = Angry
    - 🟡 Yellow = Surprise
    - 🟣 Magenta = Fear
    - 🟠 Orange = Disgust
    - ⚪ Gray = Neutral
  - Confidence scores displayed
  - Console output every second

## 🎯 Test Instructions

### Face Detection Test
1. Run: `python face_detection_test.py`
2. Look at your webcam
3. Check for green rectangles around your face
4. Press 's' to save test image
5. Press 'q' to quit

### Emotion Detection Test
1. Run: `python emotion_detection_test.py`
2. Look at your webcam
3. Check color-coded rectangles and labels
4. Watch console for real-time predictions
5. Press 's' to save test image
6. Press 'q' to quit

## 📊 Expected Results

### ✅ Success Indicators
- **Face Detection**: Green rectangles around your face
- **Emotion Detection**: Color-coded rectangles with emotion labels
- **Console Output**: Regular prediction updates
- **Saved Images**: Test images in `testimages/` folder

### ❌ Troubleshooting
- **No webcam**: Check camera permissions
- **No faces detected**: Check lighting and camera position
- **Model errors**: Ensure ML models are in `models/` folder
- **Import errors**: Check Python path and dependencies

## 🔧 Requirements

### Dependencies
- OpenCV (`cv2`)
- TensorFlow/Keras
- NumPy
- ML models in `models/` folder:
  - `emotion_detection_model.h5`
  - `learning_states_model.h5`

### File Structure
```
backend-main/
├── app/
│   └── ml_processing/
│       └── ml_analyzer.py
├── models/
│   ├── emotion_detection_model.h5
│   └── learning_states_model.h5
└── test/
    └── [test files]
```

## 📸 Test Images

Test images are automatically saved in the `testimages/` folder with timestamps:
- `face_detection_test_[timestamp].jpg`
- `emotion_detection_test_[timestamp].jpg`

## 🐛 Debugging

### Common Issues
1. **"No module named 'app'":** Run from `backend-main/` directory
2. **"Model not found":** Check `models/` folder
3. **"Webcam not working":** Check camera permissions
4. **"Face not detected":** Improve lighting and camera angle

### Logs to Check
- Console output for prediction results
- Backend logs for ML analyzer initialization
- Test images for visual verification

## 🎉 Success Criteria

Your ML system is working correctly when:
- ✅ Face detection shows green rectangles
- ✅ Emotion detection shows color-coded labels
- ✅ Console shows regular prediction updates
- ✅ Test images are saved successfully
- ✅ No error messages in console

## 📝 Notes

- Tests use the same ML models as your main application
- Face detection uses OpenCV's Haar cascade
- Emotion detection supports both grayscale and RGB inputs
- Learning state detection uses the DaiSEE model (224x224x3)
- All tests are non-destructive and safe to run multiple times 