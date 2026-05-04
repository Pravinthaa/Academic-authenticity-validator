const express = require('express');
const {
  uploadCertificate,
  verifyCertificate,
  getCertificate,
  getInstitutionCertificates,
  revokeCertificate,
  getVerificationStats,
  searchCertificates
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadFile } = require('../middleware/uploadMiddleware');
const {
  validateCertificateUpload,
  validateCertificateVerification,
  validateCertificateRevocation,
  validateSearch,
  sanitizeCertificateData
} = require('../middleware/validationMiddleware');

const router = express.Router();

// Public routes
router.post('/verify', validateCertificateVerification, verifyCertificate);

// Protected routes - upload certificate
router.post(
  '/upload',
  protect,
  authorize('institution', 'admin'),
  uploadFile.single('certificate'),
  validateCertificateUpload,
  sanitizeCertificateData,
  uploadCertificate
);

// Get certificate details
router.get('/:id', protect, getCertificate);

// Search certificates
router.get('/search', protect, validateSearch, searchCertificates);

// Institution routes
router.get('/institution/:institutionId', protect, getInstitutionCertificates);
router.put('/:id/revoke', protect, authorize('institution', 'admin'), validateCertificateRevocation, revokeCertificate);

// Admin routes
router.get('/stats/overview', protect, authorize('admin'), getVerificationStats);

module.exports = router;
