"""
SBERT Similarity Module - Text similarity verification
Compare OCR-extracted text with database records using Sentence Transformers
"""
import logging
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Tuple

logger = logging.getLogger(__name__)


class SimilarityChecker:
    """Verify text similarity using SBERT (Sentence BERT)"""
    
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        """Initialize similarity checker"""
        self.model_name = model_name
        self.model = None
        self.loaded = False
        
        self._load_model()
        
        # Thresholds
        self.high_threshold = 0.9  # Strong match
        self.low_threshold = 0.7   # Weak match / suspicious
        
        logger.info("✓ Similarity Checker initialized")
    
    def _load_model(self):
        """Load SBERT model"""
        try:
            from sentence_transformers import SentenceTransformer
            
            logger.info(f"Loading SBERT model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            self.loaded = True
            
            logger.info(f"✓ SBERT model loaded successfully")
            logger.info(f"  - Model name: {self.model_name}")
            logger.info(f"  - Vector dimension: {self.model.get_sentence_embedding_dimension()}")
        
        except Exception as e:
            logger.warning(f"Error loading SBERT model: {e}")
            logger.info("Similarity checking will use mock embeddings")
            self.model = None
            self.loaded = False
    
    def encode_text(self, text):
        """Encode text to embedding"""
        try:
            if not self.loaded or self.model is None:
                logger.warning("Model not loaded, using mock embedding")
                return self._get_mock_embedding(text)
            
            # Encode text
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding
        
        except Exception as e:
            logger.error(f"Error encoding text: {e}")
            return self._get_mock_embedding(text)
    
    def encode_texts(self, texts: List[str]):
        """Encode multiple texts to embeddings"""
        try:
            if not self.loaded or self.model is None:
                logger.warning("Model not loaded, using mock embeddings")
                return [self._get_mock_embedding(text) for text in texts]
            
            # Batch encode
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings
        
        except Exception as e:
            logger.error(f"Error encoding texts: {e}")
            return [self._get_mock_embedding(text) for text in texts]
    
    def compute_similarity(self, text1, text2):
        """
        Compute cosine similarity between two texts
        
        Args:
            text1: First text
            text2: Second text
        
        Returns:
            Similarity score (0-1)
        """
        try:
            # Encode texts
            emb1 = self.encode_text(text1)
            emb2 = self.encode_text(text2)
            
            # Compute cosine similarity
            similarity = cosine_similarity([emb1], [emb2])[0][0]
            
            return float(similarity)
        
        except Exception as e:
            logger.error(f"Error computing similarity: {e}")
            return 0.0
    
    def compare_ocr_with_database(self, ocr_text, database_records: List[str]):
        """
        Compare OCR-extracted text with database records
        
        Args:
            ocr_text: Text extracted from certificate
            database_records: List of known text records from database
        
        Returns:
            Dictionary with comparison results
        """
        try:
            if not database_records:
                logger.warning("No database records to compare")
                return {
                    'best_match': None,
                    'best_score': 0.0,
                    'all_matches': [],
                    'status': 'NO_DATABASE_RECORDS',
                }
            
            # Encode OCR text and database records
            ocr_emb = self.encode_text(ocr_text)
            db_embeddings = np.array(self.encode_texts(database_records))
            
            # Compute similarities
            similarities = cosine_similarity([ocr_emb], db_embeddings)[0]
            
            # Find best match
            best_idx = np.argmax(similarities)
            best_score = float(similarities[best_idx])
            
            # Classify
            if best_score >= self.high_threshold:
                status = 'VALID'
            elif best_score >= self.low_threshold:
                status = 'SUSPICIOUS'
            else:
                status = 'INVALID'
            
            # Create all matches list
            all_matches = [
                {
                    'record': database_records[i],
                    'similarity': float(similarities[i]),
                }
                for i in range(len(database_records))
            ]
            
            # Sort by similarity descending
            all_matches.sort(key=lambda x: x['similarity'], reverse=True)
            
            logger.info(
                f"Text similarity check: {status} "
                f"(best score: {best_score:.4f})"
            )
            
            return {
                'best_match': all_matches[0] if all_matches else None,
                'best_score': best_score,
                'all_matches': all_matches,
                'status': status,
            }
        
        except Exception as e:
            logger.error(f"Error comparing with database: {e}")
            return {
                'best_match': None,
                'best_score': 0.0,
                'all_matches': [],
                'status': 'ERROR',
                'error': str(e),
            }
    
    def verify_field_values(self, extracted_fields: dict, database_fields: dict):
        """
        Verify individual field values
        
        Args:
            extracted_fields: Fields extracted from certificate
            database_fields: Fields from database record
        
        Returns:
            Dictionary with field-wise verification
        """
        try:
            field_results = {}
            
            for field_name, extracted_value in extracted_fields.items():
                if not extracted_value:
                    field_results[field_name] = {
                        'value': extracted_value,
                        'similarity': 0.0,
                        'status': 'EMPTY',
                    }
                    continue
                
                database_value = database_fields.get(field_name, '')
                
                if not database_value:
                    field_results[field_name] = {
                        'value': extracted_value,
                        'similarity': 0.0,
                        'status': 'NO_DATABASE_VALUE',
                    }
                    continue
                
                # Compute similarity
                similarity = self.compute_similarity(extracted_value, database_value)
                
                # Classify
                if similarity >= self.high_threshold:
                    status = 'MATCH'
                elif similarity >= self.low_threshold:
                    status = 'PARTIAL_MATCH'
                else:
                    status = 'MISMATCH'
                
                field_results[field_name] = {
                    'extracted': extracted_value,
                    'database': database_value,
                    'similarity': similarity,
                    'status': status,
                }
            
            # Overall status
            matches = sum(1 for r in field_results.values() if r['status'] == 'MATCH')
            partial = sum(1 for r in field_results.values() if r['status'] == 'PARTIAL_MATCH')
            
            overall_status = 'VALID' if matches > 0 else ('SUSPICIOUS' if partial > 0 else 'INVALID')
            
            logger.info(f"Field verification: {overall_status} (Matches: {matches}, Partial: {partial})")
            
            return {
                'field_results': field_results,
                'overall_status': overall_status,
                'matches': matches,
                'partial_matches': partial,
            }
        
        except Exception as e:
            logger.error(f"Error verifying fields: {e}")
            return {
                'field_results': {},
                'overall_status': 'ERROR',
                'error': str(e),
            }
    
    def set_thresholds(self, high_threshold=0.9, low_threshold=0.7):
        """Set similarity thresholds"""
        self.high_threshold = high_threshold
        self.low_threshold = low_threshold
        logger.info(f"Thresholds set: High={high_threshold}, Low={low_threshold}")
    
    def _get_mock_embedding(self, text):
        """Generate mock embedding for testing without model"""
        np.random.seed(hash(text) % 2**32)
        return np.random.rand(384)  # all-MiniLM-L6-v2 outputs 384 dimensions


# Global checker instance
similarity_checker = None


def initialize_checker(model_name="all-MiniLM-L6-v2"):
    """Initialize similarity checker"""
    global similarity_checker
    similarity_checker = SimilarityChecker(model_name)
    return similarity_checker


def compute_similarity(text1, text2):
    """Compute similarity between two texts"""
    global similarity_checker
    if similarity_checker is None:
        initialize_checker()
    return similarity_checker.compute_similarity(text1, text2)


def compare_with_database(ocr_text, database_records: List[str]):
    """Compare OCR text with database records"""
    global similarity_checker
    if similarity_checker is None:
        initialize_checker()
    return similarity_checker.compare_ocr_with_database(ocr_text, database_records)


def verify_fields(extracted_fields: dict, database_fields: dict):
    """Verify field values"""
    global similarity_checker
    if similarity_checker is None:
        initialize_checker()
    return similarity_checker.verify_field_values(extracted_fields, database_fields)


logger.info("✓ Similarity Module loaded")
