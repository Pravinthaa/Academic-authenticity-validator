const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const StudentRegistry = require('../models/StudentRegistry');
const VerificationLog = require('../models/VerificationLog');

const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

const cleanupUploadedFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.warn(`Unable to delete temp file ${filePath}:`, error.message);
    }
  }
};

// @desc    Upload and verify certificate
// @route   POST /api/certificates/upload
// @access  Public
exports.uploadCertificate = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { studentName, rollNumber, institutionId } = req.body;

    // Validate required fields
    if (!studentName || !rollNumber || !institutionId) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide studentName, rollNumber, and institutionId' 
      });
    }

    // Check if institution exists
    const institution = await User.findById(institutionId);
    if (!institution || institution.role !== 'institution') {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ 
        success: false, 
        message: 'Institution not found' 
      });
    }

    // Get file paths for reference documents
    const photoPath = req.files && req.files['studentPhoto'] ? `uploads/${req.files['studentPhoto'][0].filename}` : null;
    const signaturePath = req.files && req.files['studentSignature'] ? `uploads/${req.files['studentSignature'][0].filename}` : null;
    const secretarySignaturePath = req.files && req.files['secretarySignature'] ? `uploads/${req.files['secretarySignature'][0].filename}` : null;

    // Create certificate record
    const certificate = await Certificate.create({
      institution: institutionId,
      studentName,
      rollNumber,
      registerNumber: req.body.registerNumber,
      emisId: req.body.emisId,
      certificateSerialNo: req.body.certificateSerialNo,
      sessionAndYear: req.body.sessionAndYear,
      dateOfBirth: req.body.dateOfBirth,
      schoolName: req.body.schoolName,
      graduationYear: req.body.graduationYear || 2024,
      totalMarks: req.body.totalMarks,
      tmrCode: req.body.tmrCode,
      certificateId: req.body.certificateId || req.body.certificateSerialNo || `CERT-${Date.now()}`,
      filePath: req.files['certificate'][0].path,
      fileName: req.files['certificate'][0].filename,
      mimeType: req.files['certificate'][0].mimetype,
      fileSize: req.files['certificate'][0].size,
      studentPhotoUrl: photoPath,
      candidateSignatureUrl: signaturePath,
      secretarySignatureUrl: secretarySignaturePath,
      // AI Metadata
      hasPhoto: !!photoPath, 
      hasCandidateSignature: !!signaturePath,
      hasSecretarySignature: !!secretarySignaturePath
    });

    res.status(201).json({
      success: true,
      message: 'Certificate uploaded successfully',
      certificateId: certificate._id,
      data: certificate
    });

  } catch (error) {
    // Clean up file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Verify certificate authenticity
// @route   POST /api/certificates/verify
// @access  Public
exports.verifyCertificate = async (req, res, next) => {
  try {
    const { certificateId, rollNumber, studentName } = req.body;
    let certFile = null;

    // 1. Initial Search for existing record (if ID is provided)
    let groundTruth = null;
    if (certificateId) {
      groundTruth = await Certificate.findOne({ certificateId }).populate('institution');
    }

    // 2. If no image is provided, we can't do AI verification
    if (!req.file) {
      if (!groundTruth) {
        return res.status(404).json({ success: false, status: 'NOT_FOUND', message: 'No record found' });
      }
      return res.status(200).json({ success: true, status: groundTruth.status === 'active' ? 'valid' : 'revoked', certificate: groundTruth });
    }

    // 3. AI EXTRACTION & ANALYSIS (The Core Step)
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    
    const aiResponse = await axios.post(`${AI_SERVICE_BASE_URL}/validate`, formData, {
      headers: formData.getHeaders(),
      timeout: 90000
    });

    const aiResult = aiResponse.data;
    const ocrData = aiResult.steps?.ocr?.extracted_fields || {};
    const sealData = aiResult.steps?.seal_detection || {};

    // 4. FIND GROUND TRUTH BY AI-EXTRACTED DATA
    // We prioritize the Permanent Register Number extracted from the image
    const regNo = ocrData.register_number || req.body.registerNumber;
    groundTruth = await StudentRegistry.findOne({ registerNumber: regNo }).populate('institution');

    if (!groundTruth) {
      cleanupUploadedFile(req.file.path);
      return res.status(404).json({
        success: false,
        status: 'INVALID',
        message: 'No official board record found for this Register Number. Certificate is likely a forgery.',
        aiExtractions: ocrData
      });
    }

    // 5. DATA MATCHING (Textual Comparison)
    const dataMatches = {
      studentName: ocrData.student_name?.toLowerCase().includes(groundTruth.studentName.toLowerCase()) || groundTruth.studentName.toLowerCase().includes(ocrData.student_name?.toLowerCase()),
      registerNumber: ocrData.register_number === groundTruth.registerNumber,
      emisId: ocrData.emis_id === groundTruth.emisId,
      totalMarks: ocrData.total_marks === groundTruth.totalMarks,
      dateOfBirth: ocrData.date_of_birth === groundTruth.dateOfBirth,
      schoolName: ocrData.school_name?.toLowerCase().includes(groundTruth.schoolName.toLowerCase()) || groundTruth.schoolName.toLowerCase().includes(ocrData.school_name?.toLowerCase())
    };

    // 6. VISUAL VERIFICATION (AI Results)
    const visualVerification = {
      photoMatch: sealData.has_photo && !!groundTruth.studentPhotoUrl,
      candidateSignatureMatch: sealData.has_candidate_signature && !!groundTruth.candidateSignatureUrl,
      secretarySignatureMatch: sealData.has_secretary_signature,
      isTampered: aiResult.steps?.tamper_detection?.is_tampered || false
    };

    // 7. FINAL LOGGING
    const allTextMatch = Object.values(dataMatches).every(v => v === true);
    const allVisualMatch = visualVerification.photoMatch && visualVerification.candidateSignatureMatch && visualVerification.secretarySignatureMatch;

    const verificationLog = await VerificationLog.create({
      queryValue: regNo,
      queryType: 'registerNumber',
      result: allTextMatch && allVisualMatch ? 'found' : 'suspicious',
      verifiedBy: req.user ? req.user.id : null,
      ipAddress: req.ip || req.connection.remoteAddress,
      certificate: groundTruth._id,
      aiExtractions: ocrData,
      visualVerification: visualVerification,
      confidence: aiResult.confidence
    });

    cleanupUploadedFile(req.file.path);

    res.status(200).json({
      success: true,
      message: 'Comprehensive verification completed',
      verificationId: verificationLog._id,
      status: (allTextMatch && allVisualMatch && !visualVerification.isTampered) ? 'valid' : 'suspicious',
      certificate: groundTruth,
      dataMatches,
      visualVerification,
      aiExtractions: ocrData,
      confidence: aiResult.confidence,
      verifiedAt: new Date()
    });

  } catch (error) {
    if (req.file) cleanupUploadedFile(req.file.path);
    console.error('Verification Error:', error.message);
    next(error);
  }
};

// @desc    Get certificate by ID
// @route   GET /api/certificates/:id
// @access  Private
exports.getCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id).populate('institution', 'name email');
    
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all certificates for an institution
// @route   GET /api/certificates/institution/:institutionId
// @access  Private
exports.getInstitutionCertificates = async (req, res, next) => {
  try {
    // Check authorization
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.institutionId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access these certificates' 
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const certificates = await Certificate.find({ institution: req.params.institutionId })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Certificate.countDocuments({ institution: req.params.institutionId });

    res.status(200).json({
      success: true,
      count: certificates.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: certificates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke certificate
// @route   PUT /api/certificates/:id/revoke
// @access  Private (Institution/Admin only)
exports.revokeCertificate = async (req, res, next) => {
  try {
    let certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user._id.toString() !== certificate.institution.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to revoke this certificate' 
      });
    }

    certificate.status = 'revoked';
    certificate.revokedAt = new Date();
    certificate.revocationReason = req.body.reason || 'No reason provided';
    await certificate.save();

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully',
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get verification statistics
// @route   GET /api/certificates/stats/overview
// @access  Private (Admin only)
exports.getVerificationStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admin can access statistics' 
      });
    }

    const totalCertificates = await Certificate.countDocuments();
    const activeCertificates = await Certificate.countDocuments({ status: 'active' });
    const revokedCertificates = await Certificate.countDocuments({ status: 'revoked' });
    const totalVerifications = await VerificationLog.countDocuments();
    const foundVerifications = await VerificationLog.countDocuments({ result: 'found' });
    const suspiciousVerifications = await VerificationLog.countDocuments({ result: 'not_found' });

    // Verification trend (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentVerifications = await VerificationLog.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo } 
    });

    res.status(200).json({
      success: true,
      stats: {
        certificates: {
          total: totalCertificates,
          active: activeCertificates,
          revoked: revokedCertificates
        },
        verifications: {
          total: totalVerifications,
          found: foundVerifications,
          notFound: suspiciousVerifications,
          recentSevenDays: recentVerifications
        },
        verificationRate: totalCertificates > 0 ? ((foundVerifications / totalVerifications) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search certificates
// @route   GET /api/certificates/search
// @access  Private
exports.searchCertificates = async (req, res, next) => {
  try {
    const { query, type = 'all' } = req.query;

    if (!query) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    let searchCriteria = {};

    if (type === 'student' || type === 'all') {
      searchCriteria.$or = [
        { studentName: { $regex: query, $options: 'i' } },
        { rollNumber: { $regex: query, $options: 'i' } },
        { certificateId: { $regex: query, $options: 'i' } }
      ];
    }

    const results = await Certificate.find(searchCriteria)
      .limit(10)
      .populate('institution', 'name email');

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Extract details from a certificate (OCR)
// @route   POST /api/certificates/extract
// @access  Private
exports.extractCertificateDetails = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Send file to AI service for OCR extraction
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    if (req.body.certificateId) {
      formData.append('certificate_id', req.body.certificateId);
    }

    const aiResponse = await axios.post(`${AI_SERVICE_BASE_URL}/validate`, formData, {
      headers: formData.getHeaders(),
      timeout: 60000
    });

    // Clean up uploaded file
    cleanupUploadedFile(req.file.path);

    const responseData = aiResponse.data || {};
    
    // Extract OCR results from the pipeline response
    let extractedData = {};
    if (responseData.steps && responseData.steps.ocr && responseData.steps.ocr.status === 'success') {
      extractedData = responseData.steps.ocr.extracted_fields;
    } else {
      extractedData = responseData.ocr_data || responseData.extracted || responseData;
    }

    res.status(200).json({
      success: true,
      message: 'Details extracted successfully',
      data: extractedData
    });
  } catch (error) {
    // Clean up file on error
    if (req.file) {
      cleanupUploadedFile(req.file.path);
    }

    console.error('AI Service Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to extract certificate details',
      error: error.message
    });
  }
};

// @desc    Detect forgery or tampering (CNN, YOLO, SNN)
// @route   POST /api/certificates/analyze
// @access  Private
exports.analyzeCertificate = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Send file to AI service for full analysis
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    if (req.body.certificateId) {
      formData.append('certificate_id', req.body.certificateId);
    }

    const aiResponse = await axios.post(`${AI_SERVICE_BASE_URL}/validate`, formData, {
      headers: formData.getHeaders(),
      timeout: 90000
    });

    // Clean up uploaded file
    cleanupUploadedFile(req.file.path);

    const analysisData = aiResponse.data || {};
    
    // Structure the response to include specific model results requested
    const result = {
      finalDecision: analysisData.final_decision,
      confidence: analysisData.confidence,
      timestamp: analysisData.timestamp,
      models: {
        cnn: analysisData.steps?.tamper_detection || { status: 'not_run' },
        yolo: analysisData.steps?.seal_detection || { status: 'not_run' },
        snn: analysisData.steps?.signature_verification || { status: 'not_run' },
        ocr: analysisData.steps?.ocr || { status: 'not_run' }
      },
      isTampered: analysisData.steps?.tamper_detection?.is_tampered || false,
      hasSeal: analysisData.steps?.seal_detection?.has_seal || false
    };

    res.status(200).json({
      success: true,
      message: 'Certificate analysis completed',
      data: result
    });
  } catch (error) {
    // Clean up file on error
    if (req.file) {
      cleanupUploadedFile(req.file.path);
    }

    console.error('AI Service Analysis Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze certificate',
      error: error.message
    });
  }
};

// @desc    Get verification and analysis result
// @route   GET /api/certificates/:id/result
// @access  Private
exports.getVerificationResult = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found' });
    
    const logs = await VerificationLog.find({ certificate: req.params.id }).sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      message: 'Verification result retrieved', 
      data: {
        certificateStatus: certificate.status,
        verificationHistory: logs
      } 
    });
  } catch (error) {
    next(error);
  }
};
