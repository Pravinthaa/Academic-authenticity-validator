const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// @desc Extract text from certificate images using OCR
// @param filePath - Path to the certificate file
// @returns Extracted text and metadata
const extractTextFromCertificate = async (filePath) => {
  try {
    let processedImagePath = filePath;

    // If it's a PDF or needs preprocessing, handle it
    const ext = path.extname(filePath).toLowerCase();
    
    // Preprocess image for better OCR accuracy
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
      // Enhance image before OCR
      const enhancedPath = filePath.replace(/\.[^.]+$/, '-enhanced.jpg');
      
      await sharp(filePath)
        .normalize()
        .modulate({ brightness: 1.2 })
        .toFile(enhancedPath);
      
      processedImagePath = enhancedPath;
    }

    // Run OCR with Tesseract
    const { data: { text, confidence } } = await Tesseract.recognize(
      processedImagePath,
      'eng',
      {
        logger: m => {
          // Log progress
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    // Clean up enhanced image if created
    if (processedImagePath !== filePath && fs.existsSync(processedImagePath)) {
      fs.unlinkSync(processedImagePath);
    }

    // Extract key fields from OCR text
    const extractedData = extractKeyFields(text);

    return {
      success: true,
      extractedText: text,
      confidence,
      extractedFields: extractedData,
      extractedAt: new Date()
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      success: false,
      error: error.message,
      extractedText: '',
      confidence: 0
    };
  }
};

// @desc Extract key certificate fields using regex and text analysis
const extractKeyFields = (text) => {
  const fields = {
    studentName: null,
    rollNumber: null,
    course: null,
    institution: null,
    graduationYear: null,
    grade: null,
    certificateNumber: null
  };

  try {
    // Split text into lines for easier processing
    const lines = text.split('\n').map(line => line.trim());

    // Look for patterns
    // Student Name (usually near beginning, multiple words)
    const namePattern = /(?:name|student|to|whom it may concern)[:\s]+([A-Za-z\s]{10,100})/gi;
    const nameMatch = text.match(namePattern);
    if (nameMatch) {
      fields.studentName = nameMatch[0].replace(/[^A-Za-z\s]/g, '').trim().substring(0, 50);
    }

    // Roll/Registration Number
    const rollPatterns = [
      /(?:roll|registration|reg\.?\s*no)[:\s]+([A-Z0-9\-\/]+)/gi,
      /\b([A-Z]{2,4}[0-9]{4,8})\b/g,
      /(?:roll?|reg)\s*(?:no\.?)?[:\s]+([A-Z0-9\-\/]+)/gi
    ];
    
    for (const pattern of rollPatterns) {
      const match = text.match(pattern);
      if (match) {
        fields.rollNumber = match[0].replace(/[^A-Z0-9\-\/]/gi, '').trim();
        break;
      }
    }

    // Course/Program Name
    const coursePattern = /(?:course|program|degree|award)[:\s]+([A-Za-z\s\(\)]{5,100})/gi;
    const courseMatch = text.match(coursePattern);
    if (courseMatch) {
      fields.course = courseMatch[0].replace(/[^A-Za-z\s\(\)]/g, '').trim().substring(0, 100);
    }

    // Institution Name
    const instPattern = /(?:university|college|institute|institution)[:\s]+([A-Za-z\s,]{5,100})/gi;
    const instMatch = text.match(instPattern);
    if (instMatch) {
      fields.institution = instMatch[0].replace(/[^A-Za-z\s,]/g, '').trim().substring(0, 100);
    }

    // Graduation Year (4 digit number between 1900-2100)
    const yearPattern = /\b(19\d{2}|20\d{2})\b/g;
    const yearMatches = text.match(yearPattern);
    if (yearMatches) {
      const year = parseInt(yearMatches[yearMatches.length - 1]);
      if (year >= 1900 && year <= 2100) {
        fields.graduationYear = year;
      }
    }

    // Grade/CGPA
    const gradePatterns = [
      /(?:grade|cgpa|gpa|marks)[:\s]+([A-F+\-]|\d+\.?\d*)/gi,
      /\b(?:grade|marks):\s*([A-F+\-]|\d+\.?\d*)\b/gi
    ];
    
    for (const pattern of gradePatterns) {
      const match = text.match(pattern);
      if (match) {
        fields.grade = match[0].replace(/[^A-F+\-\d.]/g, '').trim();
        break;
      }
    }

    // Certificate Number
    const certPattern = /(?:certificate|cert\.?|cert no)[:\s]+([A-Z0-9\-\/]+)/gi;
    const certMatch = text.match(certPattern);
    if (certMatch) {
      fields.certificateNumber = certMatch[0].replace(/[^A-Z0-9\-\/]/gi, '').trim();
    }

  } catch (error) {
    console.error('Error extracting key fields:', error);
  }

  return fields;
};

// @desc Detect tampering indicators based on visual analysis
const detectTamperingIndicators = async (imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    
    const tamperFlags = [];

    // Check for unusual image properties
    if (metadata.hasAlpha) {
      // Transparency layers might indicate manipulation
      // Note: This is a basic check; real implementation would be more sophisticated
    }

    // Check image metadata for signs of editing
    if (metadata.format !== 'png' && metadata.format !== 'jpeg') {
      tamperFlags.push('unusual_format');
    }

    // Check if image has been resized multiple times (lossy compression artifacts)
    // This is a simplified check
    if (metadata.density && metadata.density < 150) {
      tamperFlags.push('low_resolution');
    }

    return tamperFlags;
  } catch (error) {
    console.error('Error detecting tampering:', error);
    return [];
  }
};

// @desc Detect duplicate certificates using perceptual hashing
const detectDuplicates = async (imagePath, certificateModel) => {
  try {
    // This is a simplified implementation
    // In production, use pHash or similar algorithms
    
    const imageBuffer = fs.readFileSync(imagePath);
    const imageHash = require('crypto')
      .createHash('sha256')
      .update(imageBuffer)
      .digest('hex');

    // Look for similar certificates in database
    // Note: This is simplified; real implementation would use perceptual hashing
    
    return {
      isDuplicate: false,
      similarCertificates: [],
      hash: imageHash
    };
  } catch (error) {
    console.error('Error detecting duplicates:', error);
    return {
      isDuplicate: false,
      similarCertificates: [],
      error: error.message
    };
  }
};

module.exports = {
  extractTextFromCertificate,
  extractKeyFields,
  detectTamperingIndicators,
  detectDuplicates
};
