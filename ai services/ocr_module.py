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
            
            # Simple thresholding is often better for clear documents
            # Use adaptive thresholding instead of Otsu's for more robustness
            binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
            
            # Resize slightly to improve character recognition
            preprocessed = cv2.resize(binary, target_size)
            
            logger.debug(f"Image preprocessed to {target_size}")
            return preprocessed
        
        except Exception as e:
            logger.error(f"Error during image preprocessing: {e}")
            return None
    
    def extract_text(self, image_path, preprocess=False):
        """
        Extract all text from image using Tesseract
        
        Args:
            image_path: Path to certificate image
            preprocess: Whether to preprocess image first (default False for clear docs)
        
        Returns:
            Extracted text or empty string
        """
        try:
            if preprocess:
                img_array = self.preprocess_image(image_path)
                if img_array is None:
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
        Extract structured certificate fields
        """
        try:
            text = self.extract_text(image_path, preprocess=False)
            
            # Additional fallback with preprocessing if raw text is too short
            if len(text) < 100:
                logger.info("Raw OCR text too short, trying with preprocessing...")
                text = self.extract_text(image_path, preprocess=True)

            fields = {
                'student_name': self._extract_student_name(text),
                'roll_number': self._extract_roll_number(text),
                'register_number': self._extract_register_number(text),
                'emis_id': self._extract_emis_id(text),
                'certificate_serial_no': self._extract_serial_no(text),
                'session_and_year': self._extract_session(text),
                'school_name': self._extract_school(text),
                'total_marks': self._extract_total_marks(text),
                'date_of_birth': self._extract_dob(text),
                'issue_date': self._extract_date(text),
                'full_text': text,
            }
            
            # Clean up student name if it contains "NAME OF THE CANDIDATE"
            if "NAME OF THE" in fields['student_name']:
                 fields['student_name'] = fields['student_name'].split("CANDIDATE")[-1].strip()

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
        patterns = [
            r'NAME OF THE CANDIDATE\s*(.*?)\n([A-Z\s]+)',
            r'(?:Name|Student|Candidate)\s*[:=]?\s*([A-Z][a-zA-Z\s]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # If there are two groups, second one is often the actual name in multi-line cases
                name = match.group(2).strip() if len(match.groups()) > 1 else match.group(1).strip()
                # If it's a "MARK CERTIFICATE" placeholder or similar, skip
                if "MARK CERTIFICATE" in name:
                     # Try to find the line that actually looks like a name
                     lines = text.split('\n')
                     for i, line in enumerate(lines):
                         if "NAME OF THE CANDIDATE" in line:
                             if i + 1 < len(lines):
                                 name = lines[i+1].strip()
                                 if not name and i + 2 < len(lines):
                                     name = lines[i+2].strip()
                
                # Take first few words
                words = name.split()[:4]
                return ' '.join(words)
        
        # Fallback: look for uppercase names in a specific block
        return ""
    
    def _extract_roll_number(self, text):
        """Extract roll number from text"""
        patterns = [
            r'([67]\d{6})\s+MAR\s+\d{4}',
            r'ROLL\s*NO\s*\.?\s*OF\s*PASSING\s*(.*?)\n\s*(\d{7})',
            r'(?:Roll\s*No|Registration|Reg\s*No|Student\s*ID)\s*[:=]?\s*([A-Z0-9\-/]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(len(match.groups())).strip()
        
        return ""

    def _extract_register_number(self, text):
        """Extract permanent register number (10 digits)"""
        patterns = [
            r'PERMANENT REGISTER NUMBER\s+(\d{10})',
            r'PERMANENT REGISTER NO\s+(\d{10})',
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
        if not match:
             match = re.search(r'EMIS\s*ID\s*No\s*\.?\s*(\d+)', text, re.IGNORECASE)
        return match.group(1).strip() if match else ""

    def _extract_serial_no(self, text):
        """Extract Certificate SL No."""
        # Top right pattern
        match = re.search(r'(\d{8})', text)
        if match:
            return match.group(1).strip()
        
        match = re.search(r'CERTIFICATE SL\. NO\s*[:]\s*HSS\s*(\d+)', text, re.IGNORECASE)
        return match.group(1).strip() if match else ""

    def _extract_session(self, text):
        """Extract Session and Year (e.g. MAR 2024)"""
        match = re.search(r'([A-Z]{3}\s+20\d{2})', text)
        return match.group(1).strip() if match else ""

    def _extract_school(self, text):
        """Extract School Name"""
        patterns = [
            r'NAME OF THE SCHOOL\s*(.*?)\n',
            r'NAME OF THE SCHOOL\s*\n\s*([A-Z][A-Z\s\.,\-\&]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                school = match.group(len(match.groups())).strip().replace('\n', ' ')
                if "FBG" in school:
                    school = school.split("FBG")[0].strip()
                if school:
                    return school

        # Fallback: line-by-line search
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if "NAME OF THE SCHOOL" in line:
                if i + 1 < len(lines):
                    school = lines[i+1].strip()
                    if not school and i + 2 < len(lines):
                        school = lines[i+2].strip()
                    return school
        return ""

    def _extract_total_marks(self, text):
        """Extract Total Marks (numeric)"""
        # Look for the last occurrence of total marks (usually the final year)
        matches = re.findall(r'TOTAL MARKS\s*[:]?\s*(\d{4})', text, re.IGNORECASE)
        if matches:
            return matches[-1]
        
        # Fallback for "TOTAL MARKS 0590" format
        match = re.search(r'TOTAL\s*MARKS\s*(.*?)\s*(\d{4})', text, re.IGNORECASE)
        if match:
            return match.group(2)
        
        return ""

    def _extract_dob(self, text):
        """Extract Date of Birth"""
        match = re.search(r'DATE OF BIRTH\s*(\d{2}/\d{2}/\d{4})', text, re.IGNORECASE)
        if not match:
             # Look for just the date pattern
             match = re.search(r'(\d{2}/\d{2}/\d{4})', text)
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
