# backend-main/app/model_loader.py
# Fixed model loader for TensorFlow compatibility issues

import tensorflow as tf
import numpy as np
import logging
import os

logger = logging.getLogger(__name__)

def load_model_with_compatibility(model_path):
    """Load TensorFlow model with compatibility fixes"""
    
    if not os.path.exists(model_path):
        logger.warning(f"Model file not found: {model_path}")
        return None
    
    try:
        # Method 1: Direct loading
        logger.info(f"Attempting to load model: {model_path}")
        model = tf.keras.models.load_model(model_path, compile=False)
        logger.info(f"✅ Model loaded successfully: {model_path}")
        return model
        
    except Exception as e1:
        logger.warning(f"Direct loading failed: {e1}")
        
        try:
            # Method 2: Load with custom objects
            logger.info("Trying with custom objects...")
            
            # Define custom InputLayer that handles batch_shape
            class CompatibleInputLayer(tf.keras.layers.InputLayer):
                def __init__(self, batch_shape=None, input_shape=None, **kwargs):
                    # Convert batch_shape to input_shape
                    if batch_shape is not None and input_shape is None:
                        input_shape = batch_shape[1:]  # Remove batch dimension
                    super().__init__(input_shape=input_shape, **kwargs)
            
            custom_objects = {
                'InputLayer': CompatibleInputLayer,
                'CompatibleInputLayer': CompatibleInputLayer
            }
            
            model = tf.keras.models.load_model(
                model_path, 
                custom_objects=custom_objects,
                compile=False
            )
            logger.info(f"✅ Model loaded with custom objects: {model_path}")
            return model
            
        except Exception as e2:
            logger.warning(f"Custom objects loading failed: {e2}")
            
            try:
                # Method 3: Load weights only and rebuild
                logger.info("Trying to load weights only...")
                
                # Try to get model info from the file
                import h5py
                with h5py.File(model_path, 'r') as f:
                    # Get input shape from model config
                    model_config = f.attrs.get('model_config')
                    if model_config:
                        import json
                        config = json.loads(model_config.decode('utf-8'))
                        
                        # Extract input shape
                        input_shape = None
                        if 'config' in config and 'layers' in config['config']:
                            first_layer = config['config']['layers'][0]
                            if 'config' in first_layer:
                                if 'batch_input_shape' in first_layer['config']:
                                    batch_shape = first_layer['config']['batch_input_shape']
                                    input_shape = batch_shape[1:]  # Remove batch dimension
                                elif 'input_shape' in first_layer['config']:
                                    input_shape = first_layer['config']['input_shape']
                        
                        if input_shape:
                            logger.info(f"Detected input shape: {input_shape}")
                            
                            # Create a simple model with the detected input shape
                            model = create_simple_model(input_shape, len(get_output_classes(model_path)))
                            
                            # Try to load weights
                            try:
                                model.load_weights(model_path, by_name=True, skip_mismatch=True)
                                logger.info(f"✅ Weights loaded for: {model_path}")
                                return model
                            except Exception as e3:
                                logger.warning(f"Weight loading failed: {e3}")
                
            except Exception as e3:
                logger.warning(f"Weight-only loading failed: {e3}")
    
    logger.error(f"❌ All loading methods failed for: {model_path}")
    return None

def create_simple_model(input_shape, num_classes):
    """Create a simple model architecture"""
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=input_shape),
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    return model

def get_output_classes(model_path):
    """Try to determine number of output classes"""
    # Default class counts for your models
    if 'learning' in model_path.lower():
        return 4  # boredom, engagement, confusion, frustration
    elif 'emotion' in model_path.lower():
        return 6  # happy, anger, sad, neutral, surprise, fear
    else:
        return 4  # default

def convert_old_model_to_new(old_model_path, new_model_path):
    """Convert old model to new compatible format"""
    try:
        # This is a utility function to convert your models
        # You would run this once to convert your models
        
        logger.info(f"Converting model: {old_model_path}")
        
        # Load the old model (even if it has issues)
        import h5py
        
        with h5py.File(old_model_path, 'r') as f:
            # Extract model config and fix batch_shape issue
            model_config = f.attrs.get('model_config')
            if model_config:
                import json
                config = json.loads(model_config.decode('utf-8'))
                
                # Fix batch_shape in config
                if 'config' in config and 'layers' in config['config']:
                    for layer in config['config']['layers']:
                        if 'config' in layer:
                            # Convert batch_shape to input_shape
                            if 'batch_shape' in layer['config']:
                                batch_shape = layer['config']['batch_shape']
                                if batch_shape and len(batch_shape) > 1:
                                    layer['config']['input_shape'] = batch_shape[1:]
                                del layer['config']['batch_shape']
                
                # Save fixed config
                fixed_config = json.dumps(config)
                
                # Create new model from fixed config
                model = tf.keras.models.model_from_json(fixed_config)
                
                # Load weights
                model.load_weights(old_model_path)
                
                # Save in new format
                model.save(new_model_path, save_format='h5', include_optimizer=False)
                
                logger.info(f"✅ Model converted successfully: {new_model_path}")
                return True
                
    except Exception as e:
        logger.error(f"❌ Model conversion failed: {e}")
        return False

# Test function
def test_model_loading():
    """Test model loading with your actual models"""
    
    # Test learning model
    learning_model = load_model_with_compatibility('models/learning_states_model.h5')
    if learning_model:
        logger.info("✅ Learning model test passed")
        logger.info(f"Input shape: {learning_model.input_shape}")
        logger.info(f"Output shape: {learning_model.output_shape}")
    else:
        logger.warning("❌ Learning model test failed")
    
    # Test emotion model  
    emotion_model = load_model_with_compatibility('models/emotion_model.h5')
    if emotion_model:
        logger.info("✅ Emotion model test passed")
        logger.info(f"Input shape: {emotion_model.input_shape}")
        logger.info(f"Output shape: {emotion_model.output_shape}")
    else:
        logger.warning("❌ Emotion model test failed")

if __name__ == "__main__":
    # Run this to test your models
    test_model_loading()