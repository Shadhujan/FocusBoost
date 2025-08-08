#app/ml_processing/ml_analyzer.py

import tensorflow as tf
import numpy as np
import cv2
import base64
from PIL import Image
import io
from typing import Dict, Any, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLAnalyzer:
    def __init__(self):
        """Initialize ML models for emotion and learning state detection"""
        self.emotion_model = None
        self.learning_model = None
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        self.learning_labels = ['boredom', 'confusion', 'engagement', 'frustration']
        self.models_loaded = False
        
    def load_models(self):
        """Load both ML models"""
        try:
            logger.info("Loading ML models...")
            
            # Load emotion model (FER-2013)
            self.emotion_model = tf.keras.models.load_model('models/emotion_model.h5')
            logger.info("✅ Emotion model loaded successfully")
            
            # Load learning state model (DaiSEE)  
            self.learning_model = tf.keras.models.load_model('models/learning_states_model.h5')
            logger.info("✅ Learning state model loaded successfully")
            
            self.models_loaded = True
            logger.info("🎉 All ML models loaded and ready!")
            
        except Exception as e:
            logger.error(f"❌ Error loading models: {str(e)}")
            self.models_loaded = False
            raise e
    
    def preprocess_image_for_emotion(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for emotion model (48x48 RGB for your model)"""
        try:
            # Always convert to RGB and resize
            if image.shape[2] == 1:
                # If single channel, convert to 3 channels by repeating
                rgb = np.repeat(image, 3, axis=2)
            else:
                rgb = cv2.cvtColor(image, cv2.COLOR_RGB2BGR) if image.shape[2] == 3 else image

            resized = cv2.resize(rgb, (48, 48))  # Your model expects 48x48x3

            # Normalize to 0-1
            normalized = resized.astype('float32') / 255.0

            # Add batch dimension (do NOT add -1 for channel! Just batch, height, width, 3)
            processed = np.expand_dims(normalized, axis=0)

            return processed
        except Exception as e:
            logger.error(f"Error preprocessing image for emotion: {str(e)}")
            raise e

    
    def preprocess_image_for_learning(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for learning state model"""
        try:
            # For DaiSEE model - adjust size based on your model architecture
            # Assuming VGG-like architecture (224x224x3)
            resized = cv2.resize(image, (224, 224))
            
            # Ensure RGB format
            if len(resized.shape) == 3 and resized.shape[2] == 3:
                rgb_image = resized
            else:
                rgb_image = cv2.cvtColor(resized, cv2.COLOR_GRAY2RGB)
            
            # Normalize to 0-1
            normalized = rgb_image.astype('float32') / 255.0
            
            # Add batch dimension
            processed = np.expand_dims(normalized, axis=0)
            
            return processed
        except Exception as e:
            logger.error(f"Error preprocessing image for learning state: {str(e)}")
            raise e
    
    def base64_to_image(self, base64_string: str) -> np.ndarray:
        """Convert base64 string to numpy array"""
        try:
            # Decode base64
            image_data = base64.b64decode(base64_string)
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB numpy array
            image_array = np.array(image.convert('RGB'))
            
            return image_array
        except Exception as e:
            logger.error(f"Error converting base64 to image: {str(e)}")
            raise e
    
    def detect_emotion(self, image: np.ndarray) -> Dict[str, Any]:
        """Detect emotion from image"""
        try:
            if not self.models_loaded or self.emotion_model is None:
                raise Exception("Emotion model not loaded")
            
            # Preprocess image
            processed_image = self.preprocess_image_for_emotion(image)
            
            # Get prediction
            predictions = self.emotion_model.predict(processed_image, verbose=0)
            probabilities = predictions[0]
            
            # Get top prediction
            predicted_index = np.argmax(probabilities)
            predicted_emotion = self.emotion_labels[predicted_index]
            confidence = float(probabilities[predicted_index])
            
            # Create probabilities dictionary
            emotion_probs = {
                label: float(prob) for label, prob in zip(self.emotion_labels, probabilities)
            }
            
            result = {
                'emotion': predicted_emotion,
                'confidence': float(confidence),
                'probabilities': emotion_probs
            }
            
            logger.info(f"😊 Emotion detected: {predicted_emotion} ({confidence:.2f})")
            return result
            
        except Exception as e:
            logger.error(f"Error detecting emotion: {str(e)}")
            raise e
    
    def detect_learning_state(self, image: np.ndarray) -> Dict[str, Any]:
        """Detect learning state from image"""
        try:
            if not self.models_loaded or self.learning_model is None:
                raise Exception("Learning state model not loaded")
            
            # Preprocess image
            processed_image = self.preprocess_image_for_learning(image)
            
            # Get prediction
            predictions = self.learning_model.predict(processed_image, verbose=0)
            probabilities = predictions[0]
            
            # Get top prediction
            predicted_index = np.argmax(probabilities)
            predicted_state = self.learning_labels[predicted_index]
            confidence = float(probabilities[predicted_index])
            
            # Create probabilities dictionary
            learning_probs = {
                label: float(prob) for label, prob in zip(self.learning_labels, probabilities)
            }
            
            result = {
                'learningState': predicted_state,
                'confidence': float(confidence),
                'probabilities': learning_probs
            }
            
            logger.info(f"🧠 Learning state detected: {predicted_state} ({confidence:.2f})")
            return result
            
        except Exception as e:
            logger.error(f"Error detecting learning state: {str(e)}")
            raise e
    
    def analyze_image(self, base64_image: str) -> Dict[str, Any]:
        """Analyze image for both emotion and learning state"""
        try:
            if not self.models_loaded:
                self.load_models()
            
            # Convert base64 to image
            image = self.base64_to_image(base64_image)
            
            # Get both predictions
            emotion_result = self.detect_emotion(image)
            learning_result = self.detect_learning_state(image)
            
            # Calculate attention score based on learning state
            attention_score = self.calculate_attention_score(
                learning_result['learningState'], 
                float(learning_result['confidence'])
            )
            
            # Combine results
            combined_result = {
                'emotion': emotion_result,
                'learningState': learning_result,
                'attentionScore': float(attention_score),
                'timestamp': int(np.datetime64('now').astype(int) / 1000000),  # milliseconds
                'intervention': self.check_intervention_needed(emotion_result, learning_result)
            }
            
            logger.info(f"📊 Analysis complete - Attention: {attention_score:.2f}")
            return combined_result
            
        except Exception as e:
            logger.error(f"Error analyzing image: {str(e)}")
            raise e
    
    def calculate_attention_score(self, learning_state: str, confidence: float) -> float:
        """Calculate attention score from learning state"""
        base_scores = {
            'engagement': 0.9,
            'confusion': 0.6,
            'boredom': 0.3,
            'frustration': 0.4
        }
        
        base_score = base_scores.get(learning_state, 0.5)
        return min(1.0, base_score * confidence)  # Weight by confidence
    
    def check_intervention_needed(self, emotion_result: Dict, learning_result: Dict) -> Dict[str, Any]:
        """Check if intervention is needed based on ML results"""
        learning_state = learning_result['learningState']
        learning_confidence = float(learning_result['confidence'])
        emotion = emotion_result['emotion']
        
        intervention = {
            'needed': False,
            'type': None,
            'reason': None,
            'urgency': 'low'
        }
        
        # Check for interventions (threshold of 0.7 confidence)
        if learning_confidence > 0.7:
            if learning_state == 'boredom':
                intervention = {
                    'needed': True,
                    'type': 'engaging_quiz',
                    'reason': 'Child appears bored',
                    'urgency': 'medium'
                }
            elif learning_state == 'confusion':
                intervention = {
                    'needed': True,
                    'type': 'helpful_hint',
                    'reason': 'Child appears confused',
                    'urgency': 'high'
                }
            elif learning_state == 'frustration':
                if emotion in ['angry', 'sad']:
                    intervention = {
                        'needed': True,
                        'type': 'break_suggestion',
                        'reason': 'Child appears frustrated and upset',
                        'urgency': 'high'
                    }
                else:
                    intervention = {
                        'needed': True,
                        'type': 'encouragement',
                        'reason': 'Child appears frustrated',
                        'urgency': 'medium'
                    }
        
        return intervention

# Global ML analyzer instance
ml_analyzer = MLAnalyzer()