const Certificate = require('../models/Certificate');
const VerificationLog = require('../models/VerificationLog');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

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

    // Create certificate record
    const certificate = await Certificate.create({
      institution: institutionId,
      studentName,
      rollNumber,
      course: req.body.course || 'Not provided',
      graduationYear: req.body.graduationYear || new Date().getFullYear(),
      grade: req.body.grade || 'Not provided',
      certificateId: `CERT-${Date.now()}`,
      filePath: req.file.path,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      fileSize: req.file.size
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
    const { certificateId, rollNumber, studentName, institutionId } = req.body;

    let searchCriteria = {};

    if (certificateId) {
      searchCriteria.certificateId = certificateId;
    } else if (rollNumber && studentName) {
      searchCriteria.rollNumber = rollNumber;
      searchCriteria.studentName = studentName;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide either certificateId or both rollNumber and studentName' 
      });
    }

    if (institutionId) {
      searchCriteria.institution = institutionId;
    }

    // Search for certificate
    const certificate = await Certificate.findOne(searchCriteria).populate('institution', 'name email institutionDetails');

    // Log verification attempt
    const verificationLog = await VerificationLog.create({
      queryValue: certificateId || rollNumber,
      queryType: certificateId ? 'certificateId' : 'rollNumber',
      result: certificate ? (certificate.status === 'active' ? 'found' : 'revoked') : 'not_found',
      verifiedBy: req.user ? req.user.id : null,
      ipAddress: req.ip || req.connection.remoteAddress,
      verifierOrganisation: req.body.verifierOrganisation,
      certificate: certificate ? certificate._id : null
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found in database',
        verificationId: verificationLog._id,
        status: 'invalid',
        details: {
          studentName: req.body.studentName,
          rollNumber: req.body.rollNumber,
          reason: 'No matching record found'
        }
      });
    }

    if (certificate.status === 'revoked') {
      return res.status(200).json({
        success: false,
        message: 'Certificate has been revoked',
        verificationId: verificationLog._id,
        status: 'revoked',
        details: certificate
      });
    }

    // Verify certificate data matches
    const dataMatches = {
      studentName: !studentName || certificate.studentName.toLowerCase() === studentName.toLowerCase(),
      rollNumber: !rollNumber || certificate.rollNumber === rollNumber,
      institution: !institutionId || certificate.institution._id.toString() === institutionId
    };

    const allMatch = Object.values(dataMatches).every(v => v);

    res.status(200).json({
      success: true,
      message: 'Certificate verification completed',
      verificationId: verificationLog._id,
      status: allMatch ? 'valid' : 'suspicious',
      certificate: {
        _id: certificate._id,
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        rollNumber: certificate.rollNumber,
        course: certificate.course,
        graduationYear: certificate.graduationYear,
        grade: certificate.grade,
        issueDate: certificate.issueDate,
        institution: certificate.institution,
        status: certificate.status
      },
      dataMatches,
      issueDate: certificate.issueDate,
      validFrom: certificate.issueDate,
      verifiedAt: new Date()
    });

  } catch (error) {
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
