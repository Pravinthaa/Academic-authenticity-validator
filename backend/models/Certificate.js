const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },

    studentName: {
      type: String,
      required: [true, 'Please add a student name'],
    },

    rollNumber: {
      type: String,
      required: [true, 'Please add a roll number (Examination Roll No)'],
    },

    registerNumber: {
      type: String,
      required: [true, 'Please add the permanent register number'],
      unique: true, // ✅ enough
    },

    emisId: {
      type: String,
      required: [true, 'Please add the EMIS ID number'],
    },

    certificateSerialNo: {
      type: String,
      required: [true, 'Please add the certificate serial number (SL NO)'],
      unique: true, // ✅ enough
    },

    sessionAndYear: {
      type: String,
      required: [true, 'Please add the session and year of issue'],
    },

    dateOfBirth: {
      type: Date,
      required: [true, 'Please add date of birth'],
    },

    course: {
      type: String,
      default: 'Higher Secondary Course (Class 12)',
    },

    schoolName: {
      type: String,
      required: [true, 'Please add school name'],
    },

    groupCode: {
      type: String,
      default: '2503 / GENERAL EDUCATION',
    },

    mediumOfInstruction: {
      type: String,
      default: 'ENGLISH',
    },

    tmrCode: {
      type: String,
      default: 'N/A',
    },

    graduationYear: {
      type: Number,
      required: [true, 'Please add year of passing'],
    },

    totalMarks: {
      type: String,
      required: [true, 'Please add total marks obtained'],
    },

    marks: [
      {
        subject: String,
        theory: Number,
        practical: Number,
        internal: Number,
        total: Number,
      },
    ],

    grade: {
      type: String,
      default: 'N/A',
    },

    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    certificateId: {
      type: String,
      required: [true, 'Please add a certificate ID'],
      unique: true, // ✅ enough (REMOVED index:true)
    },

    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
    },

    filePath: String,
    fileName: String,
    mimeType: String,
    fileSize: Number,

    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'suspicious', 'fraud'],
      default: 'pending',
    },

    tamperFlags: [
      {
        type: String,
        enum: [
          'signature_mismatch',
          'seal_forgery',
          'text_alteration',
          'duplicate_detected',
          'date_inconsistency',
        ],
      },
    ],

    ocrData: {
      extractedText: String,
      confidence: Number,
      extractedAt: Date,
    },

    revokedAt: Date,
    revocationReason: String,

    hasPhoto: { type: Boolean, default: false },
    hasCandidateSignature: { type: Boolean, default: false },
    hasSecretarySignature: { type: Boolean, default: false },

    aiConfidence: { type: Number, default: 0 },

    studentPhotoUrl: String,
    candidateSignatureUrl: String,

    secretarySignatureUrl: {
      type: String,
      default: '/assets/signatures/secretary_default.png',
    },

    ipfsHash: String,
    blockchainHash: String,
  },
  {
    timestamps: true,
  }
);

// ================= INDEXES =================

// Fast lookup by certificateId (already indexed via unique, but useful for clarity)


// Search by roll number within institution
certificateSchema.index({ rollNumber: 1, institution: 1 });

// EMIS quick lookup
certificateSchema.index({ emisId: 1 });

// Admin dashboards / recent uploads
certificateSchema.index({ createdAt: -1 });

// Status filtering
certificateSchema.index({ status: 1 });

// 🔥 Fraud / duplicate detection
certificateSchema.index({ registerNumber: 1, certificateSerialNo: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);