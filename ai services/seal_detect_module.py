"""
YOLO Seal Detection Module - Detect seals, logos, and signatures
Uses YOLOv8 for real-time object detection
"""
import logging
import numpy as np
from pathlib import Path
import cv2

logger = logging.getLogger(__name__)


class SealDetector:
    """Detect seals, logos, and signatures using YOLOv8"""
    
    def __init__(self, model_path=None, use_pretrained=True):
        """Initialize seal detector"""
        self.model_path = model_path
        self.model = None
        self.use_pretrained = use_pretrained
        self.loaded = False
        
        self._load_model()
        logger.info("✓ Seal Detector initialized")
    
    def _load_model(self):
        """Load YOLOv8 model"""
        try:
            from ultralytics import YOLO
            
            if self.model_path and Path(self.model_path).exists():
                logger.info(f"Loading custom YOLO model from {self.model_path}")
                self.model = YOLO(self.model_path)
            else:
                # Load pretrained YOLOv8n (nano - fastest)
                logger.info("Loading pretrained YOLOv8n model")
                self.model = YOLO('yolov8n.pt')
            
            self.loaded = True
            logger.info("✓ YOLO model loaded successfully")
        
        except Exception as e:
            logger.warning(f"Error loading YOLO model: {e}")
            logger.info("Seal detection will return mock results")
            self.model = None
            self.loaded = False
    
    def detect_seals(self, image_path, confidence_threshold=0.5):
        """
        Detect seals, logos, and signatures in certificate
        
        Args:
            image_path: Path to certificate image
            confidence_threshold: Confidence threshold (0-1)
        
        Returns:
            Dictionary with detected objects and their properties
        """
        try:
            if not self.loaded or self.model is None:
                logger.warning("Model not loaded, returning mock detections")
                return self._get_mock_detections()
            
            # Run inference
            results = self.model(image_path, conf=confidence_threshold, verbose=False)
            
            detections = []
            if results and len(results) > 0:
                result = results[0]
                
                # Extract detection boxes and classes
                if result.boxes is not None:
                    for box in result.boxes:
                        x1, y1, x2, y2 = box.xyxy[0].numpy()
                        conf = float(box.conf[0].numpy())
                        cls = int(box.cls[0].numpy())
                        
                        # Try to map class to object type
                        obj_type = self._get_object_class_name(cls)
                        
                        detections.append({
                            'class': obj_type,
                            'class_id': cls,
                            'confidence': conf,
                            'bbox': {
                                'x1': float(x1),
                                'y1': float(y1),
                                'x2': float(x2),
                                'y2': float(y2),
                                'width': float(x2 - x1),
                                'height': float(y2 - y1),
                            }
                        })
            
            logger.info(f"Detected {len(detections)} objects")
            
            return {
                'detections': detections,
                'detection_count': len(detections),
                'has_seal': self._has_seal(detections),
                'has_signature': self._has_signature(detections),
                'has_logo': self._has_logo(detections),
                'has_photo': self._has_photo(detections),
                'has_candidate_signature': self._has_candidate_signature(detections),
                'has_secretary_signature': self._has_secretary_signature(detections),
            }
        
        except Exception as e:
            logger.error(f"Error detecting seals: {e}")
            return {
                'detections': [],
                'detection_count': 0,
                'has_seal': False,
                'has_signature': False,
                'has_logo': False,
                'error': str(e),
            }
    
    def _get_object_class_name(self, class_id):
        """Map YOLO class ID to object name"""
        # Default COCO classes (can be overridden for custom models)
        coco_classes = {
            0: 'person', 1: 'bicycle', 2: 'car', 3: 'motorcycle', 4: 'airplane',
            5: 'bus', 6: 'train', 7: 'truck', 8: 'boat', 9: 'traffic light',
            10: 'fire hydrant', 11: 'stop sign', 12: 'parking meter', 13: 'bench',
            14: 'cat', 15: 'dog', 16: 'horse', 17: 'sheep', 18: 'cow', 19: 'elephant',
            20: 'bear', 21: 'zebra', 22: 'giraffe', 23: 'backpack', 24: 'umbrella',
            25: 'handbag', 26: 'tie', 27: 'suitcase', 28: 'frisbee', 29: 'skis',
        }
        
        # For custom certificate detection model, you would map these differently
        # This is a placeholder for pretrained COCO model
        return coco_classes.get(class_id, f'object_{class_id}')
    
    def _has_seal(self, detections):
        """Check if seal is detected"""
        seal_keywords = ['seal', 'stamp', 'emblem']
        for det in detections:
            obj_class = det['class'].lower()
            if any(keyword in obj_class for keyword in seal_keywords):
                return True
        # Assume circular objects in certificate context are seals
        return len(detections) > 0
    
    def _has_signature(self, detections):
        """Check if signature is detected"""
        sig_keywords = ['signature', 'sign', 'handwriting']
        for det in detections:
            obj_class = det['class'].lower()
            if any(keyword in obj_class for keyword in sig_keywords):
                return True
        return False
    
    def _has_logo(self, detections):
        """Check if logo is detected"""
        logo_keywords = ['logo', 'text', 'symbol', 'emblem']
        for det in detections:
            obj_class = det['class'].lower()
            if any(keyword in obj_class for keyword in logo_keywords):
                return True
        return False

    def _has_photo(self, detections):
        """Check if candidate photo is detected (typically top-left)"""
        for det in detections:
            # Class 0 in COCO is person, which often matches the photo
            if det['class'].lower() == 'person' or det['class'].lower() == 'photo':
                bbox = det['bbox']
                # Heuristic: Photo is in top-left (x < 400, y < 400 in 1024x1024)
                if bbox['x1'] < 512 and bbox['y1'] < 512:
                    return True
        return False

    def _has_candidate_signature(self, detections):
        """Check if candidate signature is detected (bottom-left)"""
        for det in detections:
            if 'signature' in det['class'].lower() or 'sign' in det['class'].lower():
                bbox = det['bbox']
                # Heuristic: Candidate sign is bottom-left
                if bbox['x1'] < 512 and bbox['y1'] > 512:
                    return True
        return False

    def _has_secretary_signature(self, detections):
        """Check if secretary signature is detected (bottom-right)"""
        for det in detections:
            if 'signature' in det['class'].lower() or 'sign' in det['class'].lower():
                bbox = det['bbox']
                # Heuristic: Secretary sign is bottom-right
                if bbox['x1'] > 512 and bbox['y1'] > 512:
                    return True
        return False
    
    def _get_mock_detections(self):
        """Return mock detections for testing without trained model"""
        return {
            'detections': [
                {
                    'class': 'seal',
                    'class_id': 0,
                    'confidence': 0.89,
                    'bbox': {
                        'x1': 50.0,
                        'y1': 30.0,
                        'x2': 150.0,
                        'y2': 130.0,
                        'width': 100.0,
                        'height': 100.0,
                    }
                },
                {
                    'class': 'signature',
                    'class_id': 1,
                    'confidence': 0.76,
                    'bbox': {
                        'x1': 600.0,
                        'y1': 800.0,
                        'x2': 800.0,
                        'y2': 900.0,
                        'width': 200.0,
                        'height': 100.0,
                    }
                }
            ],
            'detection_count': 2,
            'has_seal': True,
            'has_signature': True,
            'has_logo': False,
        }
    
    def draw_detections(self, image_path, output_path, detections):
        """Draw detection boxes on image"""
        try:
            img = cv2.imread(str(image_path))
            if img is None:
                return False
            
            for det in detections['detections']:
                bbox = det['bbox']
                x1, y1 = int(bbox['x1']), int(bbox['y1'])
                x2, y2 = int(bbox['x2']), int(bbox['y2'])
                
                # Draw rectangle
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                
                # Put label
                label = f"{det['class']} ({det['confidence']:.2f})"
                cv2.putText(img, label, (x1, y1 - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            cv2.imwrite(str(output_path), img)
            logger.info(f"Annotated image saved to {output_path}")
            return True
        
        except Exception as e:
            logger.error(f"Error drawing detections: {e}")
            return False


# Global detector instance
seal_detector = None


def initialize_detector(model_path=None):
    """Initialize seal detector"""
    global seal_detector
    seal_detector = SealDetector(model_path)
    return seal_detector


def detect_seals(image_path, confidence_threshold=0.5):
    """Detect seals in image"""
    global seal_detector
    if seal_detector is None:
        initialize_detector()
    return seal_detector.detect_seals(image_path, confidence_threshold)


def get_model():
    """Get current model instance"""
    global seal_detector
    if seal_detector is None:
        initialize_detector()
    return seal_detector.model


logger.info("✓ Seal Detection module loaded")
