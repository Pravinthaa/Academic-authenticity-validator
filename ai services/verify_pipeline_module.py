"""
Verification Pipeline - Integrate all 6 AI modules into complete verification workflow
"""
import logging
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)


class VerificationPipeline:
    """Complete certificate verification pipeline"""
    
    def __init__(self):
        """Initialize all modules"""
        self._initialize_modules()
        logger.info("✓ Verification Pipeline initialized")
    
    def _initialize_modules(self):
        """Lazy load modules"""
        self.ocr_module = None
        self.tamper_module = None
        self.seal_module = None
        self.signature_module = None
        self.duplicate_module = None
        self.similarity_module = None
    
    def _get_ocr_module(self):
        """Get OCR module (lazy load)"""
        if self.ocr_module is None:
            try:
                from ocr_module import initialize_ocr
                initialize_ocr()
                self.ocr_module = True
            except Exception as e:
                logger.error(f"Error loading OCR module: {e}")
                return False
        return True
    
    def _get_tamper_module(self):
        """Get tamper detection module (lazy load)"""
        if self.tamper_module is None:
            try:
                from tamper_detect_module import initialize_detector
                initialize_detector()
                self.tamper_module = True
            except Exception as e:
                logger.error(f"Error loading tamper module: {e}")
                return False
        return True
    
    def _get_seal_module(self):
        """Get seal detection module (lazy load)"""
        if self.seal_module is None:
            try:
                from seal_detect_module import initialize_detector
                initialize_detector()
                self.seal_module = True
            except Exception as e:
                logger.error(f"Error loading seal module: {e}")
                return False
        return True
    
    def _get_signature_module(self):
        """Get signature verification module (lazy load)"""
        if self.signature_module is None:
            try:
                from signature_verify_module import initialize_verifier
                initialize_verifier()
                self.signature_module = True
            except Exception as e:
                logger.error(f"Error loading signature module: {e}")
                return False
        return True
    
    def _get_duplicate_module(self):
        """Get duplicate detection module (lazy load)"""
        if self.duplicate_module is None:
            try:
                from duplicate_detect_module import initialize_detector
                initialize_detector()
                self.duplicate_module = True
            except Exception as e:
                logger.error(f"Error loading duplicate module: {e}")
                return False
        return True
    
    def _get_similarity_module(self):
        """Get similarity module (lazy load)"""
        if self.similarity_module is None:
            try:
                from similarity_module import initialize_checker
                initialize_checker()
                self.similarity_module = True
            except Exception as e:
                logger.error(f"Error loading similarity module: {e}")
                return False
        return True
    
    def verify_certificate(
        self,
        certificate_path,
        certificate_id=None,
        database_record=None,
        reference_signature_path=None
    ):
        """
        Complete 7-step verification pipeline
        
        Step 1: OCR - Extract text
        Step 2: CNN - Check for tampering
        Step 3: YOLO - Detect seals/signatures
        Step 4: SNN - Verify signature authenticity
        Step 5: pHash - Check for duplicates
        Step 6: SBERT - Text similarity verification
        Step 7: Decision logic - Combine all results
        
        Args:
            certificate_path: Path to certificate image
            certificate_id: Certificate ID for tracking
            database_record: Expected database values for verification
            reference_signature_path: Path to reference signature for comparison
        
        Returns:
            Complete verification results
        """
        try:
            logger.info(f"Starting verification pipeline for: {certificate_path}")
            
            results = {
                'certificate_id': certificate_id,
                'certificate_path': str(certificate_path),
                'timestamp': datetime.utcnow().isoformat(),
                'steps': {},
                'final_decision': None,
                'confidence': 0.0,
            }
            
            # Step 1: OCR Text Extraction
            logger.info("Step 1: OCR Text Extraction...")
            try:
                from ocr_module import extract_fields
                ocr_fields = extract_fields(certificate_path)
                results['steps']['ocr'] = {
                    'status': 'success',
                    'extracted_fields': ocr_fields,
                }
                logger.info(f"  ✓ OCR complete")
            except Exception as e:
                logger.error(f"  ✗ OCR failed: {e}")
                results['steps']['ocr'] = {'status': 'failed', 'error': str(e)}
                ocr_fields = {}
            
            # Step 2: Tamper Detection
            logger.info("Step 2: Tamper Detection...")
            try:
                from tamper_detect_module import detect_tampering
                tamper_result = detect_tampering(certificate_path)
                tamper_flag = tamper_result.get('is_tampered', False)
                results['steps']['tamper_detection'] = {
                    'status': 'success',
                    'is_tampered': tamper_flag,
                    'confidence': tamper_result.get('confidence', 0.0),
                    'details': tamper_result,
                }
                logger.info(f"  ✓ Tamper detection: {'TAMPERED' if tamper_flag else 'ORIGINAL'}")
            except Exception as e:
                logger.error(f"  ✗ Tamper detection failed: {e}")
                results['steps']['tamper_detection'] = {'status': 'failed', 'error': str(e)}
                tamper_flag = False
            
            # Step 3: Seal/Logo Detection
            logger.info("Step 3: Seal/Logo Detection...")
            try:
                from seal_detect_module import detect_seals
                seal_result = detect_seals(certificate_path)
                seals_detected = seal_result.get('detections', [])
                has_seal = seal_result.get('has_seal', False)
                results['steps']['seal_detection'] = {
                    'status': 'success',
                    'has_seal': has_seal,
                    'has_signature': seal_result.get('has_signature', False),
                    'has_photo': seal_result.get('has_photo', False),
                    'has_candidate_signature': seal_result.get('has_candidate_signature', False),
                    'has_secretary_signature': seal_result.get('has_secretary_signature', False),
                    'detection_count': len(seals_detected),
                    'detections': seals_detected,
                }
                logger.info(f"  ✓ Seal detection: {len(seals_detected)} objects detected")
            except Exception as e:
                logger.error(f"  ✗ Seal detection failed: {e}")
                results['steps']['seal_detection'] = {'status': 'failed', 'error': str(e)}
                has_seal = False
                seals_detected = []
            
            # Step 4: Signature Verification
            logger.info("Step 4: Signature Verification...")
            signature_match = None
            try:
                if reference_signature_path:
                    from signature_verify_module import verify_signature
                    sig_result = verify_signature(certificate_path, reference_signature_path)
                    signature_match = sig_result.get('match', False)
                    results['steps']['signature_verification'] = {
                        'status': 'success',
                        'match': signature_match,
                        'confidence': sig_result.get('confidence', 0.0),
                        'details': sig_result,
                    }
                    logger.info(f"  ✓ Signature verification: {'MATCH' if signature_match else 'NO MATCH'}")
                else:
                    logger.info("  ⊘ No reference signature provided (skipped)")
                    results['steps']['signature_verification'] = {
                        'status': 'skipped',
                        'reason': 'No reference signature',
                    }
            except Exception as e:
                logger.error(f"  ✗ Signature verification failed: {e}")
                results['steps']['signature_verification'] = {'status': 'failed', 'error': str(e)}
            
            # Step 5: Duplicate Detection
            logger.info("Step 5: Duplicate Detection...")
            is_duplicate = False
            try:
                from duplicate_detect_module import check_duplicate
                dup_result = check_duplicate(certificate_path, certificate_id)
                is_duplicate = dup_result.get('is_duplicate', False)
                results['steps']['duplicate_detection'] = {
                    'status': 'success',
                    'is_duplicate': is_duplicate,
                    'min_distance': dup_result.get('min_distance', float('inf')),
                    'match_count': len(dup_result.get('matches', [])),
                    'details': dup_result,
                }
                logger.info(f"  ✓ Duplicate check: {'DUPLICATE' if is_duplicate else 'UNIQUE'}")
            except Exception as e:
                logger.error(f"  ✗ Duplicate detection failed: {e}")
                results['steps']['duplicate_detection'] = {'status': 'failed', 'error': str(e)}
            
            # Step 6: Text Similarity Verification
            logger.info("Step 6: Text Similarity Verification...")
            similarity_score = 0.0
            try:
                if database_record and ocr_fields.get('full_text'):
                    from similarity_module import compare_with_database
                    
                    db_text = database_record.get('full_text', '')
                    if db_text:
                        sim_result = compare_with_database(
                            ocr_fields['full_text'],
                            [db_text]
                        )
                        similarity_score = sim_result.get('best_score', 0.0)
                        results['steps']['text_similarity'] = {
                            'status': 'success',
                            'similarity_score': similarity_score,
                            'status_classification': sim_result.get('status', 'UNKNOWN'),
                            'details': sim_result,
                        }
                        logger.info(f"  ✓ Text similarity: {similarity_score:.4f}")
                    else:
                        logger.info("  ⊘ No database text to compare (skipped)")
                        results['steps']['text_similarity'] = {
                            'status': 'skipped',
                            'reason': 'No database record',
                        }
                else:
                    logger.info("  ⊘ No database record or OCR text (skipped)")
                    results['steps']['text_similarity'] = {
                        'status': 'skipped',
                        'reason': 'Missing database record or OCR text',
                    }
            except Exception as e:
                logger.error(f"  ✗ Text similarity failed: {e}")
                results['steps']['text_similarity'] = {'status': 'failed', 'error': str(e)}
            
            # Step 7: Decision Logic
            logger.info("Step 7: Decision Logic...")
            final_decision, confidence = self._make_decision(
                tamper_flag=tamper_flag,
                similarity_score=similarity_score,
                is_duplicate=is_duplicate,
                signature_match=signature_match,
                has_seal=has_seal,
                seals_detected=seals_detected,
            )
            
            results['final_decision'] = final_decision
            results['confidence'] = confidence
            
            logger.info(f"✓ Verification complete: {final_decision} (confidence: {confidence:.2f})")
            
            return results
        
        except Exception as e:
            logger.error(f"Error in verification pipeline: {e}")
            return {
                'certificate_id': certificate_id,
                'timestamp': datetime.utcnow().isoformat(),
                'final_decision': 'ERROR',
                'error': str(e),
                'confidence': 0.0,
            }
    
    def _make_decision(self, tamper_flag, similarity_score, is_duplicate,
                      signature_match, has_seal, seals_detected):
        """
        Decision logic combining all verification results
        
        Rules:
        - If tampered → INVALID
        - If duplicate → INVALID
        - If similarity < 0.7 → INVALID
        - If no seal → SUSPICIOUS
        - If signature_match = False (and provided) → SUSPICIOUS
        - If all checks pass → VALID
        """
        reasons = []
        
        # Check tampering
        if tamper_flag:
            reasons.append("Tampering detected")
            return 'INVALID', 0.1
        
        # Check duplicates
        if is_duplicate:
            reasons.append("Duplicate certificate detected")
            return 'INVALID', 0.2
        
        # Check text similarity
        if similarity_score > 0 and similarity_score < 0.7:
            reasons.append(f"Low text similarity: {similarity_score:.2f}")
            return 'INVALID', max(0.3, similarity_score)
        
        # Check seals
        if not has_seal and len(seals_detected) == 0:
            reasons.append("No seals/signatures detected")
            confidence = 0.5 if similarity_score > 0.7 else 0.3
            return 'SUSPICIOUS', confidence
        
        # Check signature
        if signature_match is not None and not signature_match:
            reasons.append("Signature verification failed")
            confidence = 0.6 if similarity_score > 0.7 else 0.4
            return 'SUSPICIOUS', confidence
        
        # All checks passed
        if similarity_score > 0.7 or similarity_score == 0:
            return 'VALID', min(0.95, max(0.85, similarity_score))
        
        return 'VALID', 0.8


# Global pipeline instance
verification_pipeline = None


def initialize_pipeline():
    """Initialize verification pipeline"""
    global verification_pipeline
    verification_pipeline = VerificationPipeline()
    return verification_pipeline


def verify_certificate(certificate_path, certificate_id=None, database_record=None,
                      reference_signature_path=None):
    """Verify certificate using complete pipeline"""
    global verification_pipeline
    if verification_pipeline is None:
        initialize_pipeline()
    return verification_pipeline.verify_certificate(
        certificate_path,
        certificate_id,
        database_record,
        reference_signature_path
    )


logger.info("✓ Verification Pipeline module loaded")
