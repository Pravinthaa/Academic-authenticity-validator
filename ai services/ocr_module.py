"""
OCR Module - Extract text from certificates using Tesseract
"""
import logging
import pytesseract
import cv2
import numpy as np
from PIL import Image
import re

logger = logging.getLogger(__name__)


class OCRExtractor:
    """Extract text from certificate images using Tesseract OCR"""
    
    def __init__(self, tesseract_path=None):
        """Initialize OCR extractor"""
        self.tesseract_path = tesseract_path
        if tesseract_path:
            pytesseract.pytesseract.pytesseract_cmd = tesseract_path
        
        logger.info("✓ OCR Extractor initialized")
    
    def preprocess_image(self, image_path, target_size=(1024, 1024)):
        """
        Preprocess image for better OCR results:
        - Grayscale conversion
        - Denoising
        - Contrast enhancement
        - Binarization
        """
        try:
            # Read image
            img = cv2.imread(str(image_path))
            if img is None:
                logger.error(f"Could not read image: {image_path}")
                return None
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            logger.debug("Converted to grayscale")
            
            # Apply bilateral filter for denoising (preserves edges)
            denoised = cv2.bilateralFilter(gray, 9, 75, 75)
            
            # Apply CLAHE for contrast enhancement
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(denoised)
            
            # Gaussian blur
            blurred = cv2.GaussianBlur(enhanced, (3, 3), 0)
            
            # Thresholding (Otsu's binarization for adaptive threshold)
            _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Morphological operations to clean up
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)
            
            # Resize to target size
            preprocessed = cv2.resize(cleaned, target_size)
            
            logger.debug(f"Image preprocessed to {target_size}")
            return preprocessed
        
        except Exception as e:
            logger.error(f"Error during image preprocessing: {e}")
            return None
    
    def extract_text(self, image_path, preprocess=True):
        """
        Extract all text from image using Tesseract
        
        Args:
            image_path: Path to certificate image
            preprocess: Whether to preprocess image first
        
        Returns:
            Extracted text or empty string
        """
        try:
            if preprocess:
                img_array = self.preprocess_image(image_path)
                if img_array is None:
                    # Fallback to raw image
                    img = Image.open(image_path)
                else:
                    img = Image.fromarray(img_array)
            else:
                img = Image.open(image_path)
            
            # Extract text with Tesseract
            text = pytesseract.image_to_string(img, lang='eng')
            
            # Clean text
            text = self._clean_text(text)
            
            logger.info(f"OCR extraction successful. Extracted {len(text)} characters")
            return text
        
        except Exception as e:
            logger.error(f"Error during OCR extraction: {e}")
            return ""
    
    def extract_structured_fields(self, image_path):
        """
        Extract structured certificate fields:
        - Student name
        - Roll number
        - Institution name
        - Course name
        - Issue date
        
        Returns:
            Dictionary with extracted fields
        """
        try:
            text = self.extract_text(image_path, preprocess=True)
            
            fields = {
                'student_name': self._extract_student_name(text),
                'roll_number': self._extract_roll_number(text),
                'register_number': self._extract_register_number(text),
                'emis_id': self._extract_emis_id(text),
                'certificate_serial_no': self._extract_serial_no(text),
                'session_year': self._extract_session(text),
                'school_name': self._extract_school(text),
                'total_marks': self._extract_total_marks(text),
                'date_of_birth': self._extract_dob(text),
                'issue_date': self._extract_date(text),
                'full_text': text,
            }
            
            logger.info(f"Structured fields extracted")
            return fields
        
        except Exception as e:
            logger.error(f"Error extracting structured fields: {e}")
            return {
                'student_name': '',
                'roll_number': '',
                'institution_name': '',
                'course_name': '',
                'issue_date': '',
                'full_text': '',
            }
    
    def _clean_text(self, text):
        """Clean extracted text"""
        # Remove extra whitespace
        text = ' '.join(text.split())
        # Remove special characters but keep alphanumeric and common punctuation
        text = re.sub(r'[^a-zA-Z0-9\s\-/.,()]', '', text)
        return text.strip()
    
    def _extract_student_name(self, text):
        """Extract student name from text"""
        # Simple heuristic: look for "name" or "student" followed by a word
        patterns = [
            r'(?:Name|Student|Candidate)\s*[:=]?\s*([A-Z][a-zA-Z\s]+)',
            r'(?:Name|Student|Candidate)\s*([A-Z][a-zA-Z\s]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                # Take first 2-4 words as name
                words = name.split()[:4]
                return ' '.join(words)
        
        return ""
    
    def _extract_roll_number(self, text):
        """Extract roll number from text"""
        patterns = [
            r'([67]\d{6})\s+MAR\s+\d{4}', # Pattern seen in image: 6150916 MAR 2024
            r'(?:Roll\s*No|Registration|Reg\s*No|Student\s*ID)\s*[:=]?\s*([A-Z0-9\-/]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""

    def _extract_register_number(self, text):
        """Extract permanent register number (10 digits)"""
        patterns = [
            r'PERMANENT REGISTER NUMBER\s+(\d{10})',
            r'REGISTER\s+NUMBER\s+(\d{10})',
            r'(\d{10})'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return ""

    def _extract_emis_id(self, text):
        """Extract EMIS ID No."""
        match = re.search(r'EMIS ID No\.\s*(\d+)', text, re.IGNORECASE)
        return match.group(1).strip() if match else ""

    def _extract_serial_no(self, text):
        """Extract Certificate SL No."""
        match = re.search(r'CERTIFICATE SL\. NO\s*[:]\s*HSS\s*(\d+)', text, re.IGNORECASE)
        if not match:
            # Look for the top right large number
            match = re.search(r'HSS\s*(\d{8})', text)
        return match.group(1).strip() if match else ""

    def _extract_session(self, text):
        """Extract Session and Year (e.g. MAR 2024)"""
        match = re.search(r'([A-Z]{3}\s+20\d{2})', text)
        return match.group(1).strip() if match else ""

    def _extract_school(self, text):
        """Extract School Name"""
        match = re.search(r'NAME OF THE SCHOOL\s*(.*?)\n', text, re.IGNORECASE | re.DOTALL)
        if match:
            return match.group(1).strip().replace('\n', ' ')
        return ""

    def _extract_total_marks(self, text):
        """Extract Total Marks (numeric)"""
        match = re.search(r'TOTAL MARKS\s*[:]\s*(\d{4})', text, re.IGNORECASE)
        return match.group(1).strip() if match else ""

    def _extract_dob(self, text):
        """Extract Date of Birth"""
        match = re.search(r'DATE OF BIRTH\s*(\d{2}/\d{2}/\d{4})', text, re.IGNORECASE)
        return match.group(1).strip() if match else ""
    
    def _extract_institution(self, text):
        """Extract institution name from text"""
        patterns = [
            r'(?:Institute|Institution|University|College)\s*[:=]?\s*([A-Za-z\s&]+?)(?:\n|$)',
            r'(?:Institute|Institution|University|College)\s*[:=]?\s*([A-Za-z\s&]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_course(self, text):
        """Extract course name from text"""
        patterns = [
            r'(?:Course|Program|Degree|Qualification)\s*[:=]?\s*([A-Za-z\s\(\)]+?)(?:\n|$)',
            r'(?:Course|Program|Degree|Qualification)\s*[:=]?\s*([A-Za-z\s\(\)]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_date(self, text):
        """Extract issue date from text"""
        # Match common date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.
        patterns = [
            r'(?:Issued|Date|Issue\s*Date)\s*[:=]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def get_confidence(self, image_path):
        """
        Get OCR confidence scores (if available)
        Returns approximate confidence based on text length and clarity
        """
        try:
            img = Image.open(image_path)
            text = pytesseract.image_to_string(img, lang='eng')
            
            # Approximate confidence: more text = better recognition
            text_length = len(text.strip())
            
            if text_length > 500:
                confidence = 0.95
            elif text_length > 200:
                confidence = 0.85
            elif text_length > 50:
                confidence = 0.70
            else:
                confidence = 0.40
            
            return confidence
        except Exception as e:
            logger.error(f"Error getting OCR confidence: {e}")
            return 0.0


# Initialize global OCR extractor
ocr_extractor = None


def initialize_ocr(tesseract_path=None):
    """Initialize OCR extractor"""
    global ocr_extractor
    ocr_extractor = OCRExtractor(tesseract_path)
    return ocr_extractor


def extract_text(image_path, preprocess=True):
    """Extract text from image"""
    global ocr_extractor
    if ocr_extractor is None:
        initialize_ocr()
    return ocr_extractor.extract_text(image_path, preprocess)


def extract_fields(image_path):
    """Extract structured fields from image"""
    global ocr_extractor
    if ocr_extractor is None:
        initialize_ocr()
    return ocr_extractor.extract_structured_fields(image_path)


logger.info("✓ OCR module loaded")
