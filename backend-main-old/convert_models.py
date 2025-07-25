# backend-main/convert_models.py
# Script to convert your old models to new compatible format

import tensorflow as tf
import json
import h5py
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_model_config(config):
    """Fix the model configuration to remove batch_shape"""
    if isinstance(config, dict):
        # Handle batch_shape to input_shape conversion
        if 'batch_shape' in config:
            batch_shape = config['batch_shape']
            if batch_shape and len(batch_shape) > 1:
                config['input_shape'] = batch_shape[1:]  # Remove batch dimension
            del config['batch_shape']
        
        # Recursively fix nested configs
        for key, value in config.items():
            if isinstance(value, dict):
                config[key] = fix_model_config(value)
            elif isinstance(value, list):
                config[key] = [fix_model_config(item) if isinstance(item, dict) else item for item in value]
    
    return config

def convert_model(old_path, new_path):
    """Convert old model to new compatible format"""
    try:
        logger.info(f"Converting {old_path} to {new_path}")
        
        # Read the old model file
        with h5py.File(old_path, 'r') as f:
            # Get model config
            model_config = f.attrs.get('model_config')
            if model_config is None:
                raise ValueError("No model config found in file")
            
            # Parse and fix config
            config = json.loads(model_config.decode('utf-8'))
            fixed_config = fix_model_config(config)
            
            logger.info("Fixed model configuration")
            
            # Create model from fixed config
            try:
                model = tf.keras.models.model_from_json(json.dumps(fixed_config))
                logger.info("Model created from fixed config")
            except Exception as e:
                logger.warning(f"Could not create from config: {e}")
                # Fallback: create a simple compatible model
                model = create_fallback_model(old_path)
            
            # Load weights
            try:
                model.load_weights(old_path)
                logger.info("Weights loaded successfully")
            except Exception as e:
                logger.warning(f"Could not load weights: {e}")
                return False
            
            # Save in new format
            model.save(new_path, save_format='h5', include_optimizer=False)
            logger.info(f"✅ Model converted and saved to {new_path}")
            
            return True
            
    except Exception as e:
        logger.error(f"❌ Conversion failed: {e}")
        return False

def create_fallback_model(original_path):
    """Create a fallback model based on the original model's expected structure"""
    
    # Determine model type and create appropriate architecture
    if 'learning' in original_path.lower():
        # Learning states model: 4 classes
        input_shape = (224, 224, 3)  # From your error message
        num_classes = 4
        logger.info("Creating fallback learning states model")
    else:
        # Emotion model: 6 classes  
        input_shape = (48, 48, 3)   # From your error message
        num_classes = 6
        logger.info("Creating fallback emotion model")
    
    # Create a simple CNN model
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=input_shape),
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    # Compile the model
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def test_converted_model(model_path):
    """Test if the converted model loads properly"""
    try:
        model = tf.keras.models.load_model(model_path)
        logger.info(f"✅ Test passed: {model_path}")
        logger.info(f"Input shape: {model.input_shape}")
        logger.info(f"Output shape: {model.output_shape}")
        
        # Test prediction with dummy data
        import numpy as np
        dummy_input = np.random.random((1,) + model.input_shape[1:])
        prediction = model.predict(dummy_input, verbose=0)
        logger.info(f"Test prediction shape: {prediction.shape}")
        
        return True
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        return False

def main():
    """Main conversion script"""
    
    # Check if models directory exists
    if not os.path.exists('models'):
        logger.error("Models directory not found. Please create it and add your model files.")
        return
    
    # Define model paths
    models_to_convert = [
        ('models/learning_states_model.h5', 'models/learning_states_model_fixed.h5'),
        ('models/emotion_model.h5', 'models/emotion_model_fixed.h5')
    ]
    
    for old_path, new_path in models_to_convert:
        if os.path.exists(old_path):
            logger.info(f"\n{'='*50}")
            logger.info(f"Converting: {old_path}")
            
            success = convert_model(old_path, new_path)
            
            if success:
                # Test the converted model
                if test_converted_model(new_path):
                    logger.info(f"✅ Successfully converted: {old_path} -> {new_path}")
                    
                    # Optionally backup original and replace
                    backup_path = old_path + '.backup'
                    os.rename(old_path, backup_path)
                    os.rename(new_path, old_path)
                    logger.info(f"Original backed up to: {backup_path}")
                    logger.info(f"Fixed model is now at: {old_path}")
                else:
                    logger.error(f"Converted model failed testing: {new_path}")
            else:
                logger.error(f"Failed to convert: {old_path}")
        else:
            logger.warning(f"Model file not found: {old_path}")
    
    print(f"\n{'='*50}")
    print("Conversion complete!")
    print("You can now restart your backend server.")

if __name__ == "__main__":
    main()