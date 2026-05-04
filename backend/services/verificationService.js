const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// @desc Analyze certificate for tampering, forgery, and authenticity issues
// @param certificateData - Certificate object with file path
// @param institutionalData - Expected data from institution
// @returns Verification result and risk assessment
const analyzeAuthenticity = async (certificateData, institutionalData) => {
  try {
    const tamperFlags = [];
    const riskScore = { total: 0, factors: [] };

    // 1. Text Content Verification
    const textMatch = analyzeTextContent(
      certificateData.ocrData?.extractedText || '',
      institutionalData
    );
    
    if (!textMatch.studentNameMatch) {
      tamperFlags.push('student_name_mismatch');
      riskScore.factors.push({ type: 'text_mismatch', weight: 0.15 });
    }
    if (!textMatch.rollNumberMatch) {
      tamperFlags.push('roll_number_mismatch');
      riskScore.factors.push({ type: 'roll_mismatch', weight: 0.20 });
    }
    if (!textMatch.courseMatch) {
      tamperFlags.push('course_mismatch');
      riskScore.factors.push({ type: 'course_mismatch', weight: 0.10 });
    }

    // 2. Date Consistency Check
    const dateAnalysis = analyzeDateConsistency(
      certificateData.issueDate,
      certificateData.ocrData?.extractedFields?.graduationYear,
      institutionalData.expectedGraduationYear
    );
    
    if (dateAnalysis.hasInconsistency) {
      tamperFlags.push('date_inconsistency');
      riskScore.factors.push({ type: 'date_issue', weight: 0.12 });
    }

    // 3. Grade/CGPA Validity
    const gradeAnalysis = validateGrade(
      certificateData.grade,
      certificateData.ocrData?.extractedFields?.grade
    );
    
    if (gradeAnalysis.hasMismatch) {
      tamperFlags.push('grade_mismatch');
      riskScore.factors.push({ type: 'grade_mismatch', weight: 0.15 });
    }
    if (gradeAnalysis.isInvalid) {
      tamperFlags.push('invalid_grade_format');
      riskScore.factors.push({ type: 'invalid_grade', weight: 0.10 });
    }

    // 4. OCR Confidence Analysis
    const ocrConfidence = certificateData.ocrData?.confidence || 0;
    if (ocrConfidence < 0.7) {
      riskScore.factors.push({ type: 'low_ocr_confidence', weight: 0.08 });
    }

    // 5. Visual Tampering Indicators
    if (certificateData.filePath) {
      const visualAnalysis = await analyzeVisualIndicators(certificateData.filePath);
      tamperFlags.push(...visualAnalysis.detectedFlags);
      riskScore.factors.push(...visualAnalysis.riskFactors);
    }

    // 6. Check for Duplicate Certificate
    const duplicateStatus = await checkForDuplicates(
      certificateData.rollNumber,
      certificateData.studentName,
      certificateData._id
    );
    
    if (duplicateStatus.isDuplicate) {
      tamperFlags.push('duplicate_detected');
      riskScore.factors.push({ type: 'duplicate', weight: 0.25 });
    }

    // Calculate total risk score
    riskScore.total = riskScore.factors.reduce((sum, factor) => sum + factor.weight, 0);
    riskScore.total = Math.min(riskScore.total, 1.0); // Cap at 1.0

    // Determine authenticity status
    let status = 'valid';
    if (riskScore.total > 0.6) {
      status = 'fraud';
    } else if (riskScore.total > 0.3) {
      status = 'suspicious';
    } else if (tamperFlags.length > 0) {
      status = 'suspicious';
    }

    return {
      status,
      riskScore: riskScore.total,
      tamperFlags,
      details: {
        textVerification: textMatch,
        dateVerification: dateAnalysis,
        gradeVerification: gradeAnalysis,
        ocrConfidence,
        visualAnalysis: certificateData.filePath ? await analyzeVisualIndicators(certificateData.filePath) : null,
        duplicateCheck: duplicateStatus
      }
    };
  } catch (error) {
    console.error('Error analyzing authenticity:', error);
    return {
      status: 'error',
      riskScore: 0.5,
      tamperFlags: ['analysis_error'],
      error: error.message
    };
  }
};

// @desc Analyze text content for consistency
const analyzeTextContent = (extractedText, institutionalData) => {
  const result = {
    studentNameMatch: false,
    rollNumberMatch: false,
    courseMatch: false,
    details: {}
  };

  try {
    // Compare student name
    if (institutionalData.studentName) {
      const extractedName = extractedText.match(/(?:name|student|to)[:\s]+([A-Za-z\s]{5,})/i)?.[1] || '';
      result.studentNameMatch = levenshteinSimilarity(
        extractedName.toLowerCase(),
        institutionalData.studentName.toLowerCase()
      ) > 0.85;
      result.details.studentNameExtracted = extractedName;
    }

    // Compare roll number
    if (institutionalData.rollNumber) {
      const extractedRoll = extractedText.match(/(?:roll|registration|reg\.?\s*no)[:\s]+([A-Z0-9\-\/]+)/i)?.[1] || '';
      result.rollNumberMatch = extractedRoll.toUpperCase() === institutionalData.rollNumber.toUpperCase();
      result.details.rollNumberExtracted = extractedRoll;
    }

    // Compare course
    if (institutionalData.course) {
      const extractedCourse = extractedText.match(/(?:course|program|degree)[:\s]+([A-Za-z\s]{5,})/i)?.[1] || '';
      result.courseMatch = levenshteinSimilarity(
        extractedCourse.toLowerCase(),
        institutionalData.course.toLowerCase()
      ) > 0.80;
      result.details.courseExtracted = extractedCourse;
    }
  } catch (error) {
    console.error('Error analyzing text content:', error);
  }

  return result;
};

// @desc Check date consistency
const analyzeDateConsistency = (issueDate, ocrYear, expectedYear) => {
  const result = { hasInconsistency: false, issues: [] };

  try {
    const issueYear = new Date(issueDate).getFullYear();
    const currentYear = new Date().getFullYear();

    // Issue year should be reasonable
    if (issueYear > currentYear) {
      result.hasInconsistency = true;
      result.issues.push('future_issue_date');
    }

    if (issueYear < 1900) {
      result.hasInconsistency = true;
      result.issues.push('invalid_issue_date');
    }

    // Check if graduation year matches OCR extraction
    if (ocrYear && expectedYear) {
      if (Math.abs(ocrYear - expectedYear) > 1) {
        result.hasInconsistency = true;
        result.issues.push('graduation_year_mismatch');
      }
    }

    // Certificate issued within 6 months of graduation
    if (ocrYear && issueYear > ocrYear + 1) {
      result.hasInconsistency = true;
      result.issues.push('delayed_issuance');
    }

  } catch (error) {
    console.error('Error analyzing date:', error);
  }

  return result;
};

// @desc Validate grade format and value
const validateGrade = (databaseGrade, ocrGrade) => {
  const result = { hasMismatch: false, isInvalid: false };

  try {
    // Valid grade patterns
    const validGradePattern = /^([A-F][+\-]?|\d{1,3}\.?\d?|[0-4]\.\d{1,2})$/i;

    // Check if grades are valid
    if (databaseGrade && !validGradePattern.test(databaseGrade)) {
      result.isInvalid = true;
    }

    if (ocrGrade && !validGradePattern.test(ocrGrade)) {
      result.isInvalid = true;
    }

    // Check for mismatch between OCR and database
    if (ocrGrade && databaseGrade) {
      if (ocrGrade.toUpperCase() !== databaseGrade.toUpperCase()) {
        result.hasMismatch = true;
      }
    }

    // Suspicious patterns
    if (databaseGrade === 'A+' && ocrGrade === 'F') {
      result.hasMismatch = true;
    }

  } catch (error) {
    console.error('Error validating grade:', error);
  }

  return result;
};

// @desc Analyze visual indicators of tampering
const analyzeVisualIndicators = async (filePath) => {
  const detectedFlags = [];
  const riskFactors = [];

  try {
    const metadata = await sharp(filePath).metadata();

    // Check for suspicious image properties
    if (metadata.hasAlpha && metadata.format === 'png') {
      // Could indicate layer-based manipulation
      detectedFlags.push('alpha_channel_detected');
      riskFactors.push({ type: 'alpha_channel', weight: 0.05 });
    }

    // Check density (very low resolution)
    if (metadata.density && metadata.density < 100) {
      detectedFlags.push('low_resolution');
      riskFactors.push({ type: 'low_resolution', weight: 0.06 });
    }

    // Check for unusual aspect ratios
    const aspectRatio = metadata.width / metadata.height;
    if (aspectRatio < 0.5 || aspectRatio > 2.5) {
      detectedFlags.push('unusual_aspect_ratio');
      riskFactors.push({ type: 'aspect_ratio', weight: 0.03 });
    }

  } catch (error) {
    console.error('Error analyzing visual indicators:', error);
  }

  return { detectedFlags, riskFactors };
};

// @desc Check for duplicate certificates
const checkForDuplicates = async (rollNumber, studentName, currentCertId) => {
  // Simplified implementation - in production, use proper hash comparison
  return {
    isDuplicate: false,
    similarCertificates: [],
    confidence: 0
  };
};

// @desc Simple Levenshtein similarity calculation
const levenshteinSimilarity = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = matrix[len2][len1];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
};

module.exports = {
  analyzeAuthenticity,
  analyzeTextContent,
  analyzeDateConsistency,
  validateGrade,
  analyzeVisualIndicators,
  checkForDuplicates
};
