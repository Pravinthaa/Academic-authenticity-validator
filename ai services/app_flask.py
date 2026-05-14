"""
Academic Authenticity Validator - Flask AI Microservice
Main Flask application with /validate endpoint
"""
import logging
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
from datetime import datetime
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = Path('./uploads')
MODELS_FOLDER = Path('./models')
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

# Create folders
UPLOAD_FOLDER.mkdir(exist_ok=True)
MODELS_FOLDER.mkdir(exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_uploaded_file(file):
    """Save uploaded file and return path"""
    try:
        if file and file.filename and allowed_file(file.filename):
            # Generate unique filename
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_{file.filename}"
            filepath = UPLOAD_FOLDER / filename
            
            file.save(str(filepath))
            logger.info(f"File saved: {filepath}")
            
            return filepath
    except Exception as e:
        logger.error(f"Error saving file: {e}")
    
    return None


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Academic Authenticity Validator AI Service',
        'timestamp': datetime.utcnow().isoformat(),
    }), 200


@app.route('/validate', methods=['POST'])
def validate_certificate():
    """
    Main validation endpoint
    
    Expected POST data:
    - file: Certificate image (PDF/JPG/PNG)
    - certificate_id: (optional) Certificate ID for tracking
    - database_record: (optional) JSON with expected values
    - reference_signature: (optional) Reference signature for comparison
    
    Returns:
    Complete verification results with all 7 steps
    """
    try:
        logger.info(f"Validation request received from {request.remote_addr}")
        
        # Validate file upload
        if 'file' not in request.files:
            logger.warning("No file provided in request")
            return jsonify({
                'error': 'No file provided',
                'status': 'FAILED',
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            logger.warning("Empty filename")
            return jsonify({
                'error': 'Empty filename',
                'status': 'FAILED',
            }), 400
        
        # Save uploaded file
        filepath = save_uploaded_file(file)
        if filepath is None:
            logger.error("Failed to save uploaded file")
            return jsonify({
                'error': 'Invalid file format or size',
                'status': 'FAILED',
            }), 400
        
        # Get optional parameters
        certificate_id = request.form.get('certificate_id', str(datetime.utcnow().timestamp()))
        database_record = None
        
        if 'database_record' in request.form:
            try:
                import json
                database_record = json.loads(request.form.get('database_record'))
            except Exception as e:
                logger.warning(f"Could not parse database_record: {e}")
        
        reference_signature_path = None
        if 'reference_signature' in request.files:
            ref_file = request.files['reference_signature']
            if ref_file and allowed_file(ref_file.filename):
                reference_signature_path = save_uploaded_file(ref_file)
        
        # Run verification pipeline
        logger.info(f"Starting verification for certificate: {certificate_id}")
        
        from verify_pipeline_module import verify_certificate
        results = verify_certificate(
            certificate_path=str(filepath),
            certificate_id=certificate_id,
            database_record=database_record,
            reference_signature_path=reference_signature_path,
        )
        
        # Ensure all values are JSON serializable
        results = _make_json_serializable(results)
        
        logger.info(f"Verification complete: {results.get('final_decision')}")
        
        return jsonify(results), 200
    
    except Exception as e:
        logger.error(f"Error in validation: {e}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            'error': str(e),
            'status': 'ERROR',
            'timestamp': datetime.utcnow().isoformat(),
        }), 500


@app.route('/validate/batch', methods=['POST'])
def validate_batch():
    """
    Batch validation endpoint
    
    Expected POST data:
    - files: Multiple certificate images
    
    Returns:
    Array of verification results
    """
    try:
        logger.info("Batch validation request received")
        
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        results = []
        
        from verify_pipeline_module import verify_certificate
        
        for i, file in enumerate(files):
            logger.info(f"Processing file {i+1}/{len(files)}: {file.filename}")
            
            # Save and verify
            filepath = save_uploaded_file(file)
            if filepath:
                cert_result = verify_certificate(
                    certificate_path=str(filepath),
                    certificate_id=f"batch_{i}_{datetime.utcnow().timestamp()}"
                )
                cert_result = _make_json_serializable(cert_result)
                results.append(cert_result)
            else:
                results.append({
                    'filename': file.filename,
                    'status': 'FAILED',
                    'error': 'Invalid file format',
                })
        
        logger.info(f"Batch processing complete: {len(results)} files")
        
        return jsonify({
            'total': len(files),
            'processed': len(results),
            'results': results,
            'timestamp': datetime.utcnow().isoformat(),
        }), 200
    
    except Exception as e:
        logger.error(f"Error in batch validation: {e}")
        return jsonify({
            'error': str(e),
            'status': 'ERROR',
        }), 500


@app.route('/models/status', methods=['GET'])
def get_models_status():
    """Get status of all AI models"""
    try:
        status = {
            'ocr': _get_ocr_status(),
            'tamper_detection': _get_tamper_status(),
            'seal_detection': _get_seal_status(),
            'signature_verification': _get_signature_status(),
            'duplicate_detection': _get_duplicate_status(),
            'similarity_check': _get_similarity_status(),
            'timestamp': datetime.utcnow().isoformat(),
        }
        
        return jsonify(status), 200
    
    except Exception as e:
        logger.error(f"Error getting model status: {e}")
        return jsonify({'error': str(e)}), 500


def _get_ocr_status():
    """Check OCR module status"""
    try:
        import pytesseract
        return {'status': 'loaded', 'module': 'pytesseract'}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


def _get_tamper_status():
    """Check tamper detection module status"""
    try:
        from tamper_detect_module import get_model
        model = get_model()
        return {'status': 'loaded' if model else 'not_loaded', 'module': 'EfficientNetB0'}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


def _get_seal_status():
    """Check seal detection module status"""
    try:
        from seal_detect_module import get_model
        model = get_model()
        return {'status': 'loaded' if model else 'not_loaded', 'module': 'YOLOv8'}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


def _get_signature_status():
    """Check signature verification module status"""
    try:
        from signature_verify_module import get_model
        model = get_model()
        return {'status': 'loaded' if model else 'not_loaded', 'module': 'Siamese Network'}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


def _get_duplicate_status():
    """Check duplicate detection module status"""
    try:
        from duplicate_detect_module import get_database_stats
        stats = get_database_stats()
        return {
            'status': 'loaded',
            'module': 'pHash',
            'database_size': stats.get('total_certificates', 0),
        }
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


def _get_similarity_status():
    """Check similarity check module status"""
    try:
        from similarity_module import initialize_checker
        initialize_checker()
        return {'status': 'loaded', 'module': 'SBERT'}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


def _make_json_serializable(obj):
    """Convert numpy/special types to JSON serializable"""
    import numpy as np
    
    if isinstance(obj, dict):
        return {k: _make_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [_make_json_serializable(item) for item in obj]
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.integer, np.floating)):
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, (float, bool)):
        if isinstance(obj, float) and obj == float('inf'):
            return 999999.0
        return obj
    elif obj is None:
        return None
    else:
        return str(obj)


@app.route('/api/info', methods=['GET'])
def api_info():
    """Get API information"""
    return jsonify({
        'name': 'Academic Authenticity Validator - AI Service',
        'version': '1.0.0',
        'description': 'Certificate verification using AI/ML models',
        'endpoints': {
            '/health': 'Health check',
            '/validate': 'Single certificate validation (POST)',
            '/validate/batch': 'Batch certificate validation (POST)',
            '/models/status': 'AI models status check',
            '/api/info': 'API information',
        },
        'ai_models': [
            'Tesseract OCR',
            'EfficientNetB0 CNN (Tamper Detection)',
            'YOLOv8 (Seal Detection)',
            'Siamese Network (Signature Verification)',
            'pHash (Duplicate Detection)',
            'SBERT (Text Similarity)',
        ],
        'timestamp': datetime.utcnow().isoformat(),
    }), 200


@app.errorhandler(413)
def file_too_large(e):
    """Handle file too large error"""
    return jsonify({
        'error': f'File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.0f} MB',
        'status': 'FAILED',
    }), 413


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint not found',
        'status': 'NOT_FOUND',
    }), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    logger.error(f"Internal error: {e}")
    return jsonify({
        'error': 'Internal server error',
        'status': 'ERROR',
    }), 500


if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("Academic Authenticity Validator - AI Service")
    logger.info("=" * 60)
    logger.info(f"Upload folder: {UPLOAD_FOLDER}")
    logger.info(f"Models folder: {MODELS_FOLDER}")
    logger.info(f"Max file size: {MAX_FILE_SIZE / (1024*1024):.0f} MB")
    logger.info("=" * 60)
    
    # Run Flask app
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
        threaded=True,
    )
