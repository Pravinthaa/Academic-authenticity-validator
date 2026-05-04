const { body, query, param, validationResult } = require('express-validator');

// Validation middleware for certificate upload
exports.validateCertificateUpload = [
  body('studentName')
    .trim()
    .notEmpty().withMessage('Student name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Student name must be between 2-100 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Student name can only contain letters and spaces'),
  
  body('rollNumber')
    .trim()
    .notEmpty().withMessage('Roll number is required')
    .isLength({ min: 2, max: 50 }).withMessage('Roll number must be between 2-50 characters'),
  
  body('institutionId')
    .notEmpty().withMessage('Institution ID is required')
    .isMongoId().withMessage('Invalid institution ID'),
  
  body('course')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Course name cannot exceed 100 characters'),
  
  body('graduationYear')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('Graduation year must be valid'),
  
  body('grade')
    .optional()
    .trim()
    .matches(/^([A-F][+\-]?|\d{1,3}\.?\d?|[0-4]\.\d{1,2})$/)
    .withMessage('Grade format is invalid'),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Validation middleware for certificate verification
exports.validateCertificateVerification = [
  body('certificateId')
    .optional()
    .trim(),
  
  body('rollNumber')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Roll number must be between 2-50 characters'),
  
  body('studentName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Student name must be between 2-100 characters'),
  
  body('institutionId')
    .optional()
    .isMongoId().withMessage('Invalid institution ID'),
  
  body('verifierOrganisation')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Organization name cannot exceed 100 characters'),
  
  (req, res, next) => {
    const { certificateId, rollNumber, studentName } = req.body;
    if (!certificateId && (!rollNumber || !studentName)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Provide either certificateId or both rollNumber and studentName' 
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Validation middleware for user registration
exports.validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isIn(['admin', 'institution', 'verifier']).withMessage('Invalid role'),
  
  body('institutionDetails.organizationName')
    .if(() => body('role').equals('institution'))
    .trim()
    .notEmpty().withMessage('Organization name is required for institutions')
    .isLength({ max: 200 }).withMessage('Organization name cannot exceed 200 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Validation middleware for user login
exports.validateUserLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Validation middleware for certificate revocation
exports.validateCertificateRevocation = [
  param('id')
    .isMongoId().withMessage('Invalid certificate ID'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Validation middleware for search
exports.validateSearch = [
  query('query')
    .trim()
    .notEmpty().withMessage('Search query is required')
    .isLength({ min: 2, max: 100 }).withMessage('Query must be between 2-100 characters'),
  
  query('type')
    .optional()
    .isIn(['all', 'student', 'certificate']).withMessage('Invalid search type'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Sanitize certificate data
exports.sanitizeCertificateData = (req, res, next) => {
  if (req.body.studentName) {
    req.body.studentName = req.body.studentName.replace(/[<>\"']/g, '');
  }
  if (req.body.rollNumber) {
    req.body.rollNumber = req.body.rollNumber.replace(/[<>\"']/g, '');
  }
  if (req.body.course) {
    req.body.course = req.body.course.replace(/[<>\"']/g, '');
  }
  next();
};

module.exports = exports;
