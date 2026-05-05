/**
 * Mongoose Models for Academic Authenticity Validator
 * Backend: Node.js/Express
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================================================
// USER SCHEMA & MODEL
// ============================================================================

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['admin', 'institution', 'verifier'],
    required: true,
    default: 'verifier'
  },
  institutionDetails: {
    organizationName: String,
    registrationNumber: String,
    address: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    contactPerson: String,
    phoneNumber: String,
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    }
  },
  profileImage: String,
  phoneNumber: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

// ============================================================================
// CERTIFICATE SCHEMA & MODEL
// ============================================================================

const certificateSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    index: true
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  graduationYear: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 10
  },
  grade: String,
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active',
    index: true
  },
  filePath: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    enum: ['image/jpeg', 'image/png', 'application/pdf'],
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'suspicious', 'fraud'],
    default: 'pending',
    index: true
  },
  tamperFlags: [String],
  ocrData: {
    extractedText: String,
    confidence: Number,
    extractedFields: {
      studentName: String,
      rollNumber: String,
      institution: String,
      course: String,
      issueDate: String
    }
  },
  aiVerificationResults: {
    tamperDetection: {
      isTampered: Boolean,
      confidence: Number
    },
    sealDetection: {
      hasSeal: Boolean,
      detectionCount: Number
    },
    signatureVerification: {
      match: Boolean,
      similarity: Number
    },
    duplicateDetection: {
      isDuplicate: Boolean,
      matchCount: Number
    },
    textSimilarity: {
      similarityScore: Number,
      status: String
    },
    finalDecision: {
      type: String,
      enum: ['VALID', 'INVALID', 'SUSPICIOUS']
    },
    confidence: Number,
    allResults: mongoose.Schema.Types.Mixed // For complete pipeline results
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes
certificateSchema.index({ rollNumber: 1 });
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ institution: 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ verificationStatus: 1 });
certificateSchema.index({ createdAt: -1 });

const Certificate = mongoose.model('Certificate', certificateSchema);

// ============================================================================
// VERIFICATION LOG SCHEMA & MODEL
// ============================================================================

const verificationLogSchema = new mongoose.Schema({
  certificate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
    required: true
  },
  queryValue: {
    type: String,
    required: true,
    index: true
  },
  queryType: {
    type: String,
    enum: ['rollNumber', 'certificateId', 'studentName', 'email', 'batch'],
    required: true
  },
  result: {
    type: String,
    enum: ['found', 'not_found', 'suspicious', 'fraud'],
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: String,
  verifierOrganisation: String,
  metadata: {
    userAgent: String,
    searchMethod: String,
    responseTime: Number, // in milliseconds
    additionalInfo: mongoose.Schema.Types.Mixed
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  aiVerificationDetails: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes
verificationLogSchema.index({ queryValue: 1 });
verificationLogSchema.index({ certificate: 1 });
verificationLogSchema.index({ queryType: 1 });
verificationLogSchema.index({ result: 1 });
verificationLogSchema.index({ verifiedBy: 1 });
verificationLogSchema.index({ createdAt: -1 });
verificationLogSchema.index({ updatedAt: -1 });
verificationLogSchema.index({ createdAt: -1, result: 1 });

const VerificationLog = mongoose.model('VerificationLog', verificationLogSchema);

// ============================================================================
// CERTIFICATE TEMPLATE SCHEMA & MODEL (Optional)
// ============================================================================

const certificateTemplateSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  templateName: {
    type: String,
    required: true
  },
  description: String,
  fields: [
    {
      fieldName: String,
      fieldType: String,
      required: Boolean
    }
  ],
  issuerSignature: String,
  sealLocation: {
    x: Number,
    y: Number,
    width: Number,
    height: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const CertificateTemplate = mongoose.model('CertificateTemplate', certificateTemplateSchema);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  User,
  Certificate,
  VerificationLog,
  CertificateTemplate
};
