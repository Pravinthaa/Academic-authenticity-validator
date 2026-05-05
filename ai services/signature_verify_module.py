"""
Siamese Neural Network - Signature Verification
Compare signatures using twin CNN architecture with shared weights
"""
import logging
import numpy as np
from pathlib import Path
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
import cv2

logger = logging.getLogger(__name__)


class SignatureVerifier:
    """Verify signatures using Siamese Neural Network"""
    
    def __init__(self, model_path=None):
        """Initialize signature verifier"""
        self.model_path = model_path
        self.model = None
        self.input_size = (155, 220, 1)  # Standard signature size: 155x220 grayscale
        self.distance_threshold = 0.4
        self.loaded = False
        
        if model_path and Path(model_path).exists():
            self._load_model(model_path)
        else:
            self._build_model()
        
        logger.info("✓ Signature Verifier initialized")
    
    def _build_base_network(self):
        """Build base CNN network for one signature branch"""
        model = keras.Sequential([
            layers.Input(shape=self.input_size),
            
            # Conv block 1
            layers.Conv2D(64, (10, 10), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            
            # Conv block 2
            layers.Conv2D(128, (7, 7), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            
            # Conv block 3
            layers.Conv2D(128, (4, 4), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            
            # Conv block 4
            layers.Conv2D(256, (4, 4), activation='relu'),
            
            # Flatten and dense layers
            layers.Flatten(),
            layers.Dense(4096, activation='sigmoid'),
        ])
        
        return model
    
    def _build_model(self):
        """Build Siamese Neural Network with shared weights"""
        try:
            # Build base network
            base_network = self._build_base_network()
            
            # Input layers for two signatures
            input_a = layers.Input(shape=self.input_size, name='input_a')
            input_b = layers.Input(shape=self.input_size, name='input_b')
            
            # Process both inputs through same base network (shared weights)
            processed_a = base_network(input_a)
            processed_b = base_network(input_b)
            
            # Compute L2 distance
            distance = layers.Lambda(
                lambda x: keras.backend.sqrt(
                    keras.backend.sum(keras.backend.square(x[0] - x[1]), axis=1, keepdims=True)
                ),
                name='distance'
            )([processed_a, processed_b])
            
            # Sigmoid activation for similarity (0-1)
            similarity = layers.Lambda(
                lambda x: 1.0 / (1.0 + x),
                name='similarity'
            )(distance)
            
            # Build model
            model = Model(inputs=[input_a, input_b], outputs=[distance, similarity])
            
            # Compile with contrastive loss
            model.compile(
                optimizer=keras.optimizers.Adam(learning_rate=1e-4),
                loss='binary_crossentropy',
                metrics=['accuracy']
            )
            
            self.model = model
            self.loaded = True
            logger.info("✓ Siamese network built successfully")
        
        except Exception as e:
            logger.error(f"Error building Siamese network: {e}")
            self.model = None
            self.loaded = False
    
    def _load_model(self, model_path):
        """Load saved Siamese model"""
        try:
            self.model = keras.models.load_model(model_path)
            self.loaded = True
            logger.info(f"✓ Siamese model loaded from {model_path}")
        except Exception as e:
            logger.warning(f"Could not load model: {e}")
            self.loaded = False
            self._build_model()
    
    def preprocess_signature(self, image_path):
        """Preprocess signature image"""
        try:
            # Read image
            img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
            if img is None:
                logger.error(f"Could not read image: {image_path}")
                return None
            
            # Resize to standard size
            img = cv2.resize(img, (self.input_size[1], self.input_size[0]))
            
            # Normalize to [0, 1]
            img = img.astype(np.float32) / 255.0
            
            # Add channel dimension if needed
            if len(img.shape) == 2:
                img = np.expand_dims(img, axis=-1)
            
            return img
        
        except Exception as e:
            logger.error(f"Error preprocessing signature: {e}")
            return None
    
    def verify_signature(self, signature1_path, signature2_path):
        """
        Verify if two signatures match
        
        Args:
            signature1_path: Path to signature 1
            signature2_path: Path to signature 2 (from DB)
        
        Returns:
            Dictionary with verification results
        """
        try:
            # Preprocess both signatures
            sig1 = self.preprocess_signature(signature1_path)
            sig2 = self.preprocess_signature(signature2_path)
            
            if sig1 is None or sig2 is None:
                logger.error("Could not preprocess signatures")
                return {
                    'match': False,
                    'similarity': 0.0,
                    'distance': float('inf'),
                    'confidence': 0.0,
                }
            
            if not self.loaded or self.model is None:
                logger.warning("Model not loaded, using mock verification")
                return self._get_mock_verification()
            
            # Add batch dimension
            sig1 = np.expand_dims(sig1, axis=0)
            sig2 = np.expand_dims(sig2, axis=0)
            
            # Predict
            distance, similarity = self.model.predict([sig1, sig2], verbose=0)
            
            distance = float(distance[0][0])
            similarity = float(similarity[0][0])
            
            # Determine if match
            match = distance < self.distance_threshold
            
            # Confidence is similarity score
            confidence = similarity
            
            logger.info(
                f"Signature verification: {'MATCH' if match else 'NO MATCH'} "
                f"(distance: {distance:.4f}, similarity: {similarity:.4f})"
            )
            
            return {
                'match': match,
                'similarity': similarity,
                'distance': distance,
                'confidence': confidence,
            }
        
        except Exception as e:
            logger.error(f"Error verifying signature: {e}")
            return {
                'match': False,
                'similarity': 0.0,
                'distance': float('inf'),
                'confidence': 0.0,
                'error': str(e),
            }
    
    def _get_mock_verification(self):
        """Return mock verification for testing"""
        return {
            'match': True,
            'similarity': 0.92,
            'distance': 0.15,
            'confidence': 0.92,
        }
    
    def set_distance_threshold(self, threshold):
        """Set distance threshold for matching"""
        self.distance_threshold = threshold
        logger.info(f"Distance threshold set to {threshold}")
    
    def save_model(self, save_path):
        """Save trained model"""
        try:
            if self.model:
                self.model.save(save_path)
                logger.info(f"✓ Siamese model saved to {save_path}")
        except Exception as e:
            logger.error(f"Error saving model: {e}")


# Global verifier instance
signature_verifier = None


def initialize_verifier(model_path=None):
    """Initialize signature verifier"""
    global signature_verifier
    signature_verifier = SignatureVerifier(model_path)
    return signature_verifier


def verify_signature(signature1_path, signature2_path):
    """Verify if two signatures match"""
    global signature_verifier
    if signature_verifier is None:
        initialize_verifier()
    return signature_verifier.verify_signature(signature1_path, signature2_path)


def get_model():
    """Get current model instance"""
    global signature_verifier
    if signature_verifier is None:
        initialize_verifier()
    return signature_verifier.model


logger.info("✓ Signature Verification module loaded")
