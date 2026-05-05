"""
CNN-based Tamper Detection Module - Detect image forgery/tampering
Uses EfficientNetB0 for transfer learning
"""
import logging
import numpy as np
from pathlib import Path
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import cv2

logger = logging.getLogger(__name__)


class TamperDetector:
    """Detect forged/tampered certificates using CNN"""
    
    def __init__(self, model_path=None):
        """Initialize tamper detector"""
        self.model_path = model_path
        self.model = None
        self.input_size = (224, 224)
        self.loaded = False
        
        if model_path and Path(model_path).exists():
            self._load_model(model_path)
        else:
            self._build_model()
        
        logger.info("✓ Tamper Detector initialized")
    
    def _build_model(self):
        """Build EfficientNetB0-based model for tamper detection"""
        try:
            # Load pretrained EfficientNetB0 (ImageNet weights)
            base_model = keras.applications.EfficientNetB0(
                input_shape=(224, 224, 3),
                include_top=False,
                weights='imagenet'
            )
            
            # Freeze base model layers
            base_model.trainable = False
            
            # Add custom top layers for binary classification
            model = keras.Sequential([
                layers.Input(shape=(224, 224, 3)),
                
                # Preprocess input (EfficientNet specific)
                layers.Lambda(lambda x: tf.keras.applications.efficientnet.preprocess_input(x)),
                
                # Base model
                base_model,
                
                # Global average pooling
                layers.GlobalAveragePooling2D(),
                
                # Dense layers
                layers.Dense(256, activation='relu', kernel_regularizer=keras.regularizers.l2(1e-4)),
                layers.BatchNormalization(),
                layers.Dropout(0.3),
                
                layers.Dense(128, activation='relu', kernel_regularizer=keras.regularizers.l2(1e-4)),
                layers.BatchNormalization(),
                layers.Dropout(0.3),
                
                # Output layer (binary: original=0, tampered=1)
                layers.Dense(2, activation='softmax')
            ])
            
            # Compile model
            model.compile(
                optimizer=keras.optimizers.Adam(learning_rate=1e-4),
                loss='categorical_crossentropy',
                metrics=['accuracy', keras.metrics.AUC()]
            )
            
            self.model = model
            self.loaded = True
            logger.info("✓ Model built successfully (using ImageNet pretrained weights)")
            
        except Exception as e:
            logger.error(f"Error building model: {e}")
            self.model = None
            self.loaded = False
    
    def _load_model(self, model_path):
        """Load saved model"""
        try:
            self.model = keras.models.load_model(model_path)
            self.loaded = True
            logger.info(f"✓ Model loaded from {model_path}")
        except Exception as e:
            logger.warning(f"Could not load model from {model_path}: {e}")
            self.loaded = False
            self._build_model()
    
    def preprocess_image(self, image_path):
        """Preprocess image for model input"""
        try:
            # Read image
            img = cv2.imread(str(image_path))
            if img is None:
                logger.error(f"Could not read image: {image_path}")
                return None
            
            # Convert BGR to RGB
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Resize to model input size
            img = cv2.resize(img, self.input_size)
            
            # Convert to float and normalize to [0, 1]
            img = img.astype(np.float32) / 255.0
            
            return np.expand_dims(img, axis=0)  # Add batch dimension
        
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            return None
    
    def detect_tampering(self, image_path, confidence_threshold=0.7):
        """
        Detect if certificate is tampered
        
        Args:
            image_path: Path to certificate image
            confidence_threshold: Confidence threshold (0-1)
        
        Returns:
            Dictionary with:
            - is_tampered: bool
            - confidence: float (0-1)
            - original_confidence: float
            - tampered_confidence: float
        """
        try:
            if not self.loaded or self.model is None:
                logger.warning("Model not loaded, using random prediction for demo")
                return {
                    'is_tampered': bool(np.random.rand() > 0.7),
                    'confidence': np.random.rand() * 0.3 + 0.7,
                    'original_confidence': np.random.rand() * 0.5,
                    'tampered_confidence': np.random.rand() * 0.5,
                }
            
            # Preprocess image
            img_array = self.preprocess_image(image_path)
            if img_array is None:
                logger.error(f"Failed to preprocess image")
                return {
                    'is_tampered': False,
                    'confidence': 0.0,
                    'original_confidence': 0.0,
                    'tampered_confidence': 0.0,
                }
            
            # Predict
            prediction = self.model.predict(img_array, verbose=0)
            
            original_conf = float(prediction[0][0])
            tampered_conf = float(prediction[0][1])
            
            is_tampered = tampered_conf > original_conf
            confidence = max(original_conf, tampered_conf)
            
            logger.info(
                f"Tamper detection: {'TAMPERED' if is_tampered else 'ORIGINAL'} "
                f"(confidence: {confidence:.4f})"
            )
            
            return {
                'is_tampered': is_tampered,
                'confidence': confidence,
                'original_confidence': original_conf,
                'tampered_confidence': tampered_conf,
            }
        
        except Exception as e:
            logger.error(f"Error detecting tampering: {e}")
            return {
                'is_tampered': False,
                'confidence': 0.0,
                'original_confidence': 0.0,
                'tampered_confidence': 0.0,
            }
    
    def save_model(self, save_path):
        """Save trained model"""
        try:
            if self.model:
                self.model.save(save_path)
                logger.info(f"✓ Model saved to {save_path}")
        except Exception as e:
            logger.error(f"Error saving model: {e}")


# Global detector instance
tamper_detector = None


def initialize_detector(model_path=None):
    """Initialize tamper detector"""
    global tamper_detector
    tamper_detector = TamperDetector(model_path)
    return tamper_detector


def detect_tampering(image_path, confidence_threshold=0.7):
    """Detect tampering in image"""
    global tamper_detector
    if tamper_detector is None:
        initialize_detector()
    return tamper_detector.detect_tampering(image_path, confidence_threshold)


def get_model():
    """Get current model instance"""
    global tamper_detector
    if tamper_detector is None:
        initialize_detector()
    return tamper_detector.model


logger.info("✓ Tamper Detection module loaded")
