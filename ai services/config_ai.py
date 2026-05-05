"""
Configuration settings for the AI Validation Service
"""
import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
UPLOAD_DIR = BASE_DIR / "uploads"

# Ensure directories exist
MODELS_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)

# Flask Configuration
FLASK_ENV = os.getenv("FLASK_ENV", "development")
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False") == "True"
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

# Server Configuration
HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
PORT = int(os.getenv("AI_SERVICE_PORT", 5000))

# Model Configuration
MODEL_CACHE_DIR = MODELS_DIR
USE_GPU = os.getenv("USE_GPU", "True") == "True"

# OCR Configuration
TESSERACT_PATH = os.getenv("TESSERACT_PATH", r"C:\Program Files\Tesseract-OCR\tesseract.exe")

# Threshold Configurations
TAMPER_CONFIDENCE_THRESHOLD = 0.7
SEAL_DETECTION_CONFIDENCE = 0.5
SIGNATURE_DISTANCE_THRESHOLD = 0.4
PHASH_HAMMING_THRESHOLD = 10
SBERT_SIMILARITY_THRESHOLD_HIGH = 0.9
SBERT_SIMILARITY_THRESHOLD_LOW = 0.7

# File Upload Configuration
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

# Request Configuration
REQUEST_TIMEOUT = 30
MAX_RETRIES = 3

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Model URLs (for downloading)
YOLO_MODEL_URL = "https://github.com/ultralytics/assets/releases/download/v8.0.0/yolov8n.pt"
SBERT_MODEL_NAME = "all-MiniLM-L6-v2"

# MongoDB Configuration (for future integration)
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "certificate_validator")

print(f"✓ Configuration loaded")
print(f"  - Models directory: {MODELS_DIR}")
print(f"  - Upload directory: {UPLOAD_DIR}")
print(f"  - Flask env: {FLASK_ENV}")
print(f"  - Use GPU: {USE_GPU}")
