"""
pHash Duplicate Detection Module
Detect duplicate certificates using perceptual hashing
"""
import logging
import imagehash
from PIL import Image
from pathlib import Path
import json

logger = logging.getLogger(__name__)


class DuplicateDetector:
    """Detect duplicate certificates using perceptual hashing"""
    
    def __init__(self, hash_db_path=None):
        """Initialize duplicate detector"""
        self.hash_db_path = hash_db_path or Path("./hash_database.json")
        self.hash_database = self._load_hash_database()
        self.hamming_threshold = 10  # Hamming distance threshold for duplicates
        
        logger.info("✓ Duplicate Detector initialized")
    
    def _load_hash_database(self):
        """Load hash database from file"""
        try:
            if self.hash_db_path.exists():
                with open(self.hash_db_path, 'r') as f:
                    db = json.load(f)
                    logger.info(f"Loaded {len(db)} hashes from database")
                    return db
        except Exception as e:
            logger.warning(f"Could not load hash database: {e}")
        
        return {}
    
    def _save_hash_database(self):
        """Save hash database to file"""
        try:
            with open(self.hash_db_path, 'w') as f:
                json.dump(self.hash_database, f, indent=2)
                logger.info(f"Hash database saved with {len(self.hash_database)} entries")
        except Exception as e:
            logger.error(f"Error saving hash database: {e}")
    
    def compute_phash(self, image_path, hash_size=8):
        """
        Compute perceptual hash of image
        
        Args:
            image_path: Path to image
            hash_size: Size of hash (default 8x8 = 64 bits)
        
        Returns:
            ImageHash object or None
        """
        try:
            img = Image.open(image_path)
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Compute pHash
            phash = imagehash.phash(img, hash_size=hash_size)
            
            logger.debug(f"pHash computed: {phash}")
            return phash
        
        except Exception as e:
            logger.error(f"Error computing pHash: {e}")
            return None
    
    def compute_ahash(self, image_path, hash_size=8):
        """Compute average hash (faster alternative)"""
        try:
            img = Image.open(image_path)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            ahash = imagehash.average_hash(img, hash_size=hash_size)
            return ahash
        except Exception as e:
            logger.error(f"Error computing aHash: {e}")
            return None
    
    def compute_dhash(self, image_path, hash_size=8):
        """Compute difference hash (robust to changes)"""
        try:
            img = Image.open(image_path)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            dhash = imagehash.dhash(img, hash_size=hash_size)
            return dhash
        except Exception as e:
            logger.error(f"Error computing dHash: {e}")
            return None
    
    def hamming_distance(self, hash1, hash2):
        """Calculate Hamming distance between two hashes"""
        try:
            return hash1 - hash2
        except Exception as e:
            logger.error(f"Error calculating Hamming distance: {e}")
            return float('inf')
    
    def check_duplicate(self, image_path, certificate_id=None):
        """
        Check if certificate is duplicate of any in database
        
        Args:
            image_path: Path to certificate image
            certificate_id: Certificate ID for tracking
        
        Returns:
            Dictionary with duplicate detection results
        """
        try:
            # Compute hashes
            phash = self.compute_phash(image_path)
            ahash = self.compute_ahash(image_path)
            dhash = self.compute_dhash(image_path)
            
            if phash is None:
                logger.error("Could not compute hash")
                return {
                    'is_duplicate': False,
                    'matches': [],
                    'closest_match': None,
                    'min_distance': float('inf'),
                }
            
            # Search in database
            closest_match = None
            min_distance = float('inf')
            matches = []
            
            for cert_id, stored_hashes in self.hash_database.items():
                if cert_id == certificate_id:
                    continue  # Skip self
                
                try:
                    stored_phash = imagehash.ImageHash(
                        bytes.fromhex(stored_hashes.get('phash', ''))
                    ) if stored_hashes.get('phash') else None
                    
                    if stored_phash:
                        distance = self.hamming_distance(phash, stored_phash)
                        
                        if distance < min_distance:
                            min_distance = distance
                            closest_match = {
                                'certificate_id': cert_id,
                                'distance': distance,
                                'is_match': distance < self.hamming_threshold,
                            }
                        
                        if distance < self.hamming_threshold:
                            matches.append({
                                'certificate_id': cert_id,
                                'distance': distance,
                            })
                except Exception as e:
                    logger.debug(f"Error comparing with {cert_id}: {e}")
                    continue
            
            is_duplicate = len(matches) > 0
            
            logger.info(
                f"Duplicate check: {'DUPLICATE' if is_duplicate else 'UNIQUE'} "
                f"(matches: {len(matches)}, min distance: {min_distance})"
            )
            
            return {
                'is_duplicate': is_duplicate,
                'matches': matches,
                'closest_match': closest_match,
                'min_distance': min_distance,
                'hashes': {
                    'phash': str(phash),
                    'ahash': str(ahash),
                    'dhash': str(dhash),
                }
            }
        
        except Exception as e:
            logger.error(f"Error checking duplicate: {e}")
            return {
                'is_duplicate': False,
                'matches': [],
                'closest_match': None,
                'min_distance': float('inf'),
                'error': str(e),
            }
    
    def add_to_database(self, image_path, certificate_id):
        """Add certificate hash to database"""
        try:
            phash = self.compute_phash(image_path)
            ahash = self.compute_ahash(image_path)
            dhash = self.compute_dhash(image_path)
            
            if phash is None:
                return False
            
            self.hash_database[certificate_id] = {
                'phash': str(phash),
                'ahash': str(ahash),
                'dhash': str(dhash),
                'image_path': str(image_path),
            }
            
            self._save_hash_database()
            logger.info(f"Added certificate {certificate_id} to hash database")
            return True
        
        except Exception as e:
            logger.error(f"Error adding to database: {e}")
            return False
    
    def get_database_stats(self):
        """Get database statistics"""
        return {
            'total_certificates': len(self.hash_database),
            'hamming_threshold': self.hamming_threshold,
            'database_path': str(self.hash_db_path),
        }
    
    def set_hamming_threshold(self, threshold):
        """Set Hamming distance threshold for duplicate detection"""
        self.hamming_threshold = threshold
        logger.info(f"Hamming threshold set to {threshold}")
    
    def clear_database(self):
        """Clear hash database (USE WITH CAUTION)"""
        self.hash_database = {}
        self._save_hash_database()
        logger.warning("Hash database cleared")


# Global detector instance
duplicate_detector = None


def initialize_detector(hash_db_path=None):
    """Initialize duplicate detector"""
    global duplicate_detector
    duplicate_detector = DuplicateDetector(hash_db_path)
    return duplicate_detector


def check_duplicate(image_path, certificate_id=None):
    """Check if image is duplicate"""
    global duplicate_detector
    if duplicate_detector is None:
        initialize_detector()
    return duplicate_detector.check_duplicate(image_path, certificate_id)


def add_to_database(image_path, certificate_id):
    """Add image hash to database"""
    global duplicate_detector
    if duplicate_detector is None:
        initialize_detector()
    return duplicate_detector.add_to_database(image_path, certificate_id)


def get_database_stats():
    """Get database statistics"""
    global duplicate_detector
    if duplicate_detector is None:
        initialize_detector()
    return duplicate_detector.get_database_stats()


logger.info("✓ Duplicate Detection module loaded")
