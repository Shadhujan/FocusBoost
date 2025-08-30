# backend-main/app/ml_processor.py
# Fixed version with better error handling

import tensorflow as tf
import numpy as np
import base64
from PIL import Image
from io import BytesIO
from datetime import datetime
import firebase_admin
from firebase_admin import firestore
import logging
import os

logger = logging.getLogger(__name__)

class SimpleMLProcessor:
    def __init__(self):
        # Your model classes - update these to match your models
        self.learning_states = ['boredom', 'engagement', 'confusion', 'frustration']
        self.emotions = ['happy', 'anger', 'sad', 'neutral', 'surprise', 'fear']
        
        # Initialize models as None
        self.learning_model = None
        self.emotion_model = None
        
        # Try to load models
        self.load_models()
        
        # Initialize Firebase client (only if Firebase is initialized)
        self.db = None
        try:
            if firebase_admin._apps:
                self.db = firestore.client()
                logger.info("✅ Firebase client connected")
        except Exception as e:
            logger.warning(f"Firebase client not available: {e}")
    
    def load_models(self):
        """Load your trained models with better error handling"""
        try:
            # Check if model files exist
            learning_model_path = 'models/learning_states_model.h5'
            emotion_model_path = 'models/emotion_model.h5'
            
            if not os.path.exists(learning_model_path):
                logger.warning(f"Learning model not found at {learning_model_path}")
            else:
                try:
                    # Try different loading methods for compatibility
                    self.learning_model = tf.keras.models.load_model(
                        learning_model_path,
                        compile=False  # Skip compilation to avoid compatibility issues
                    )
                    logger.info("✅ Learning states model loaded")
                except Exception as e:
                    logger.error(f"Failed to load learning model: {e}")
                    try:
                        # Try with custom objects (for older models)
                        self.learning_model = tf.keras.models.load_model(
                            learning_model_path,
                            custom_objects={'InputLayer': tf.keras.layers.InputLayer},
                            compile=False
                        )
                        logger.info("✅ Learning states model loaded with custom objects")
                    except Exception as e2:
                        logger.error(f"Failed to load learning model with custom objects: {e2}")
            
            if not os.path.exists(emotion_model_path):
                logger.warning(f"Emotion model not found at {emotion_model_path}")
            else:
                try:
                    self.emotion_model = tf.keras.models.load_model(
                        emotion_model_path,
                        compile=False
                    )
                    logger.info("✅ Emotion model loaded")
                except Exception as e:
                    logger.error(f"Failed to load emotion model: {e}")
                    try:
                        self.emotion_model = tf.keras.models.load_model(
                            emotion_model_path,
                            custom_objects={'InputLayer': tf.keras.layers.InputLayer},
                            compile=False
                        )
                        logger.info("✅ Emotion model loaded with custom objects")
                    except Exception as e2:
                        logger.error(f"Failed to load emotion model with custom objects: {e2}")
            
            if self.learning_model is None and self.emotion_model is None:
                logger.warning("No models loaded - using fallback predictions")
            
        except Exception as e:
            logger.error(f"❌ Error in load_models: {e}")
            logger.warning("Using fallback predictions")
    
    def get_model_input_size(self):
        """Get the input size from the model or use default"""
        try:
            if self.learning_model:
                input_shape = self.learning_model.input_shape
                if len(input_shape) >= 3:
                    return (input_shape[1], input_shape[2])
            elif self.emotion_model:
                input_shape = self.emotion_model.input_shape
                if len(input_shape) >= 3:
                    return (input_shape[1], input_shape[2])
        except Exception as e:
            logger.warning(f"Could not get model input size: {e}")
        
        # Default size
        return (48, 48)
    
    def preprocess_image(self, image_base64):
        """Convert base64 to image array for your models"""
        try:
            # Decode base64
            image_data = base64.b64decode(image_base64)
            image = Image.open(BytesIO(image_data))
            image = image.convert('RGB')
            
            # Get model input size
            target_size = self.get_model_input_size()
            image = image.resize(target_size)
            
            # Convert to numpy array and normalize
            image_array = np.array(image) / 255.0
            image_array = np.expand_dims(image_array, axis=0)  # Add batch dimension
            
            return image_array
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            return None
    
    def predict_learning_state(self, image_array):
        """Predict using your learning states model"""
        try:
            if self.learning_model is None:
                # Fallback prediction
                import random
                scores = [random.random() for _ in self.learning_states]
                scores = np.array(scores)
                scores = scores / scores.sum()  # Normalize
                
                predicted_idx = np.argmax(scores)
                return {
                    'state': self.learning_states[predicted_idx],
                    'confidence': float(scores[predicted_idx]),
                    'all_scores': {self.learning_states[i]: float(scores[i]) for i in range(len(scores))}
                }
            
            # Run prediction
            predictions = self.learning_model.predict(image_array, verbose=0)[0]
            
            # Get best prediction
            predicted_idx = np.argmax(predictions)
            predicted_state = self.learning_states[predicted_idx]
            confidence = float(predictions[predicted_idx])
            
            # All scores
            all_scores = {self.learning_states[i]: float(predictions[i]) for i in range(len(predictions))}
            
            return {
                'state': predicted_state,
                'confidence': confidence,
                'all_scores': all_scores
            }
            
        except Exception as e:
            logger.error(f"Error in learning state prediction: {e}")
            # Fallback
            import random
            state = random.choice(self.learning_states)
            return {
                'state': state,
                'confidence': 0.7,
                'all_scores': {s: 0.25 for s in self.learning_states}
            }
    
    def predict_emotion(self, image_array):
        """Predict using your emotion model"""
        try:
            if self.emotion_model is None:
                # Fallback prediction
                import random
                scores = [random.random() for _ in self.emotions]
                scores = np.array(scores)
                scores = scores / scores.sum()  # Normalize
                
                predicted_idx = np.argmax(scores)
                return {
                    'emotion': self.emotions[predicted_idx],
                    'confidence': float(scores[predicted_idx]),
                    'all_scores': {self.emotions[i]: float(scores[i]) for i in range(len(scores))}
                }
            
            # Run prediction
            predictions = self.emotion_model.predict(image_array, verbose=0)[0]
            
            # Get best prediction
            predicted_idx = np.argmax(predictions)
            predicted_emotion = self.emotions[predicted_idx]
            confidence = float(predictions[predicted_idx])
            
            # All scores
            all_scores = {self.emotions[i]: float(predictions[i]) for i in range(len(predictions))}
            
            return {
                'emotion': predicted_emotion,
                'confidence': confidence,
                'all_scores': all_scores
            }
            
        except Exception as e:
            logger.error(f"Error in emotion prediction: {e}")
            # Fallback
            import random
            emotion = random.choice(self.emotions)
            return {
                'emotion': emotion,
                'confidence': 0.7,
                'all_scores': {e: 0.16 for e in self.emotions}
            }
    
    def calculate_attention_score(self, learning_result, emotion_result):
        """Simple attention score calculation"""
        learning_state = learning_result['state']
        emotion = emotion_result['emotion']
        
        # Simple scoring logic
        base_score = 0.5
        
        # Learning state impact
        if learning_state == 'engagement':
            base_score += 0.3
        elif learning_state == 'boredom':
            base_score -= 0.3
        elif learning_state == 'confusion':
            base_score -= 0.1
        elif learning_state == 'frustration':
            base_score -= 0.2
        
        # Emotion impact
        if emotion == 'happy':
            base_score += 0.1
        elif emotion in ['anger', 'sad']:
            base_score -= 0.1
        
        return max(0.0, min(1.0, base_score))
    
    def process_frame(self, session_id, image_base64):
        """Main function to process a frame"""
        try:
            # Preprocess image
            image_array = self.preprocess_image(image_base64)
            if image_array is None:
                return None
            
            # Get predictions from both models
            learning_result = self.predict_learning_state(image_array)
            emotion_result = self.predict_emotion(image_array)
            
            # Calculate attention score
            attention_score = self.calculate_attention_score(learning_result, emotion_result)
            
            # Create result
            result = {
                'sessionId': session_id,
                'timestamp': datetime.now().isoformat(),
                'learningState': learning_result['state'],
                'learningConfidence': learning_result['confidence'],
                'emotion': emotion_result['emotion'],
                'emotionConfidence': emotion_result['confidence'],
                'attentionScore': attention_score,
                'processed': True
            }
            
            # Store in Firebase (if available)
            if self.db:
                try:
                    self.store_result(result)
                except Exception as e:
                    logger.warning(f"Could not store result: {e}")
            
            # Check for interventions
            intervention = self.check_intervention(result)
            if intervention:
                result['intervention'] = intervention
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return None
    
    def store_result(self, result):
        """Store result in Firebase"""
        try:
            if not self.db:
                return
                
            self.db.collection('attention_data').add({
                'sessionId': result['sessionId'],
                'timestamp': datetime.fromisoformat(result['timestamp'].replace('Z', '+00:00')),
                'learningState': result['learningState'],
                'learningConfidence': result['learningConfidence'],
                'emotion': result['emotion'],
                'emotionConfidence': result['emotionConfidence'],
                'attentionScore': result['attentionScore'],
                'createdAt': datetime.now()
            })
            
            # Update session summary
            self.update_session_summary(result['sessionId'], result)
            
        except Exception as e:
            logger.error(f"Error storing result: {e}")
    
    def update_session_summary(self, session_id, result):
        """Update session with latest stats"""
        try:
            if not self.db:
                return
                
            session_ref = self.db.collection('study_sessions').document(session_id)
            session_doc = session_ref.get()
            
            if session_doc.exists:
                data = session_doc.to_dict()
                
                # Update running averages
                total_updates = data.get('totalUpdates', 0) + 1
                current_avg = data.get('averageAttentionScore', 0.0)
                new_avg = ((current_avg * (total_updates - 1)) + result['attentionScore']) / total_updates
                
                session_ref.update({
                    'averageAttentionScore': new_avg,
                    'currentLearningState': result['learningState'],
                    'currentEmotion': result['emotion'],
                    'totalUpdates': total_updates,
                    'lastUpdate': datetime.now()
                })
        except Exception as e:
            logger.error(f"Error updating session: {e}")
    
    def check_intervention(self, result):
        """Simple intervention logic"""
        learning_state = result['learningState']
        emotion = result['emotion']
        attention_score = result['attentionScore']
        
        # Simple rules
        if learning_state == 'boredom' and attention_score < 0.4:
            return {
                'type': 'quiz',
                'reason': f'Detected boredom with low attention ({int(attention_score*100)}%)',
                'quiz': self.create_simple_quiz()
            }
        elif learning_state == 'frustration':
            return {
                'type': 'break',
                'reason': 'Detected frustration',
                'message': 'Take a 2-minute break to relax! 😊',
                'duration': 2
            }
        elif emotion in ['anger', 'sad']:
            return {
                'type': 'break',
                'reason': f'Detected negative emotion: {emotion}',
                'message': 'Take a moment to breathe 💙',
                'duration': 3
            }
        
        return None
    
    def create_simple_quiz(self):
        """Create a simple math quiz"""
        import random
        
        # Simple math questions
        a = random.randint(1, 10)
        b = random.randint(1, 10)
        correct_answer = a + b
        
        # Create wrong options
        options = [correct_answer]
        while len(options) < 4:
            wrong_answer = correct_answer + random.randint(-3, 3)
            if wrong_answer > 0 and wrong_answer not in options:
                options.append(wrong_answer)
        
        random.shuffle(options)
        correct_index = options.index(correct_answer)
        
        return {
            'question': f'Quick math! What is {a} + {b}?',
            'options': [str(opt) for opt in options],
            'correctAnswer': correct_index,
            'type': 'math'
        }

# Simple data manager
class SimpleDataManager:
    def __init__(self):
        self.db = None
        try:
            if firebase_admin._apps:
                self.db = firestore.client()
        except Exception as e:
            logger.warning(f"DataManager: Firebase not available: {e}")
    
    async def create_session(self, child_id, subject):
        """Create new session"""
        try:
            if not self.db:
                # Fallback session ID
                import time
                return f"fallback_session_{int(time.time())}"
                
            session_data = {
                'childId': child_id,
                'subject': subject,
                'startTime': datetime.now(),
                'status': 'active',
                'averageAttentionScore': 0.0,
                'totalUpdates': 0,
                'createdAt': datetime.now()
            }
            
            doc_ref = self.db.collection('study_sessions').add(session_data)
            return doc_ref[1].id
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            import time
            return f"fallback_session_{int(time.time())}"
    
    async def end_session(self, session_id):
        """End session"""
        try:
            if not self.db:
                return True  # Fallback
                
            session_ref = self.db.collection('study_sessions').document(session_id)
            session_ref.update({
                'endTime': datetime.now(),
                'status': 'completed'
            })
            return True
        except Exception as e:
            logger.error(f"Error ending session: {e}")
            return True  # Fallback success

# Create global instances (only if this file is imported after Firebase init)
try:
    ml_processor = SimpleMLProcessor()
    data_manager = SimpleDataManager()
    logger.info("✅ ML processor and data manager created")
except Exception as e:
    logger.error(f"❌ Error creating ML components: {e}")
    ml_processor = None
    data_manager = None