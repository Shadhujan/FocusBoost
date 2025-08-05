#app/ml_processing/ml_analyzer.py

import tensorflow as tf
import numpy as np
import cv2
import base64
from PIL import Image
import io

class MLAnalyzer:
    def __init__(self):
        self.emotion_model = None
        self.learning_model = None
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        self.learning_labels = ['boredom', 'confusion', 'engagement', 'frustration']
        self.models_loaded = False
        self.load_models()

    def load_models(self):
        if not self.models_loaded:
            self.emotion_model = tf.keras.models.load_model('models/emotion_model.h5')
            self.learning_model = tf.keras.models.load_model('models/learning_states_model.h5')
            self.models_loaded = True

    def base64_to_image(self, base64_string: str) -> np.ndarray:
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        return np.array(image.convert('RGB'))

    def preprocess_image_for_emotion(self, image: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        resized = cv2.resize(gray, (48, 48))
        normalized = resized.astype('float32') / 255.0
        return np.expand_dims(np.expand_dims(normalized, axis=0), axis=-1)

    def preprocess_image_for_learning(self, image: np.ndarray) -> np.ndarray:
        resized = cv2.resize(image, (224, 224))
        normalized = resized.astype('float32') / 255.0
        return np.expand_dims(normalized, axis=0)

    def detect_emotion(self, image: np.ndarray):
        processed = self.preprocess_image_for_emotion(image)
        preds = self.emotion_model.predict(processed)[0]
        idx = np.argmax(preds)
        return {
            "emotion": self.emotion_labels[idx],
            "confidence": float(preds[idx]),
            "probabilities": {label: float(prob) for label, prob in zip(self.emotion_labels, preds)}
        }

    def detect_learning_state(self, image: np.ndarray):
        processed = self.preprocess_image_for_learning(image)
        preds = self.learning_model.predict(processed)[0]
        idx = np.argmax(preds)
        return {
            "learningState": self.learning_labels[idx],
            "confidence": float(preds[idx]),
            "probabilities": {label: float(prob) for label, prob in zip(self.learning_labels, preds)}
        }

    def analyze_image(self, base64_image: str):
        image = self.base64_to_image(base64_image)
        emotion_result = self.detect_emotion(image)
        learning_result = self.detect_learning_state(image)
        # attention score can be calculated from learning state, e.g. engagement = high, boredom = low
        attention_map = {
            "engagement": 1.0,
            "confusion": 0.6,
            "frustration": 0.4,
            "boredom": 0.2
        }
        attention_score = attention_map.get(learning_result["learningState"], 0.5) * learning_result["confidence"]
        # ... intervention logic as before
        return {
            "emotion": emotion_result,
            "learningState": learning_result,
            "attentionScore": attention_score,
            "timestamp": int(np.datetime64('now').astype(int) / 1000000),
            # intervention logic can be added here
        }

ml_analyzer = MLAnalyzer()