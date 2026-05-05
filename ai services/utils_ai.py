"""
Utility functions for the AI Validation Service
"""
import logging
import os
import numpy as np
from pathlib import Path
from PIL import Image
import cv2
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def setup_logging(name, level=logging.INFO):
    """Setup logging for a module"""
    log = logging.getLogger(name)
    log.setLevel(level)
    return log


def allowed_file(filename, allowed_extensions={'pdf', 'jpg', 'jpeg', 'png'}):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def get_file_size_mb(file_path):
    """Get file size in MB"""
    return os.path.getsize(file_path) / (1024 * 1024)


def load_image(image_path):
    """Load image from file path"""
    try:
        if isinstance(image_path, str):
            img = Image.open(image_path)
        else:
            img = Image.open(image_path)
        return img
    except Exception as e:
        logger.error(f"Error loading image: {e}")
        return None


def preprocess_image_for_ocr(image_path, output_size=(1024, 1024)):
    """
    Preprocess image for OCR:
    - Convert to grayscale
    - Apply denoising
    - Enhance contrast
    - Resize
    """
    try:
        # Load image with OpenCV
        img = cv2.imread(str(image_path))
        if img is None:
            logger.error(f"Could not load image: {image_path}")
            return None
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply denoising (bilateral filter preserves edges)
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)
        
        # Apply Gaussian blur to reduce noise further
        blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)
        
        # Thresholding to get binary image (helps OCR)
        _, binary = cv2.threshold(blurred, 150, 255, cv2.THRESH_BINARY)
        
        # Resize if needed
        height, width = binary.shape
        if height != output_size[0] or width != output_size[1]:
            binary = cv2.resize(binary, output_size)
        
        logger.info(f"Image preprocessed: {image_path}")
        return binary
    except Exception as e:
        logger.error(f"Error preprocessing image: {e}")
        return None


def preprocess_image_for_model(image_path, target_size=(224, 224)):
    """Preprocess image for deep learning models (CNN, YOLO)"""
    try:
        img = cv2.imread(str(image_path))
        if img is None:
            return None
        
        # Resize
        img_resized = cv2.resize(img, target_size)
        
        # Normalize to [0, 1]
        img_normalized = img_resized.astype(np.float32) / 255.0
        
        return img_normalized
    except Exception as e:
        logger.error(f"Error in model preprocessing: {e}")
        return None


def extract_image_features(image_path):
    """Extract basic image features for analysis"""
    try:
        img = cv2.imread(str(image_path))
        if img is None:
            return None
        
        features = {
            'height': img.shape[0],
            'width': img.shape[1],
            'channels': img.shape[2] if len(img.shape) > 2 else 1,
            'size_kb': os.path.getsize(image_path) / 1024,
        }
        return features
    except Exception as e:
        logger.error(f"Error extracting image features: {e}")
        return None


def format_response(
    status="UNKNOWN",
    ocr_text="",
    tamper_flag=False,
    seals_detected=None,
    signature_match=None,
    is_duplicate=False,
    similarity_score=0.0,
    confidence_scores=None,
    error_message=None
):
    """Format validation response"""
    if seals_detected is None:
        seals_detected = []
    if confidence_scores is None:
        confidence_scores = {}
    
    return {
        'status': status,
        'timestamp': datetime.utcnow().isoformat(),
        'verification_results': {
            'ocr_text': ocr_text,
            'tamper_flag': tamper_flag,
            'seals_detected': seals_detected,
            'signature_match': signature_match,
            'is_duplicate': is_duplicate,
            'similarity_score': float(similarity_score),
        },
        'confidence_scores': confidence_scores,
        'error': error_message,
    }


def load_model_from_cache(model_name, model_dir):
    """Load model from cache directory"""
    model_path = model_dir / model_name
    if model_path.exists():
        logger.info(f"Loading model from cache: {model_name}")
        return True
    logger.warning(f"Model not found in cache: {model_name}")
    return False


def calculate_hamming_distance(hash1, hash2):
    """Calculate Hamming distance between two hashes"""
    try:
        return (hash1 != hash2).sum()
    except Exception as e:
        logger.error(f"Error calculating Hamming distance: {e}")
        return float('inf')


def is_valid_json_response(data):
    """Validate response is JSON serializable"""
    import json
    try:
        json.dumps(data)
        return True
    except (TypeError, ValueError):
        logger.error(f"Response data is not JSON serializable")
        return False


logger.info("✓ Utilities module loaded")
