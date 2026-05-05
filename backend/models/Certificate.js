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
      index: true,
    },
    registerNumber: {
      type: String,
      required: [true, 'Please add the permanent register number'],
      unique: true,
      index: true
    },
    emisId: {
      type: String,
      required: [true, 'Please add the EMIS ID number'],
      index: true
    },
    certificateSerialNo: {
      type: String,
      required: [true, 'Please add the certificate serial number (SL NO)'],
      unique: true,
      index: true
    },
    sessionAndYear: {
      type: String,
      required: [true, 'Please add the session and year of issue (e.g. MAR 2024)'],
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
      default: '2503 / GENERAL EDUCATION'
    },
    mediumOfInstruction: {
      type: String,
      default: 'ENGLISH'
    },
    tmrCode: {
      type: String,
      default: 'N/A'
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
        total: Number
      }
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
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
    },
    // File upload metadata
    filePath: {
      type: String,
    },
    fileName: {
      type: String,
    },
    mimeType: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    // Verification & Tampering Detection
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'suspicious', 'fraud'],
      default: 'pending',
    },
    tamperFlags: {
      type: [{
        type: String,
        enum: ['signature_mismatch', 'seal_forgery', 'text_alteration', 'duplicate_detected', 'date_inconsistency']
      }],
      default: [],
    },
    ocrData: {
      extractedText: String,
      confidence: Number,
      extractedAt: Date,
    },
    // Revocation info
    revokedAt: Date,
    revocationReason: String,
    // AI Extraction/Detection Flags
    hasPhoto: {
      type: Boolean,
      default: false
    },
    hasCandidateSignature: {
      type: Boolean,
      default: false
    },
    hasSecretarySignature: {
      type: Boolean,
      default: false
    },
    aiConfidence: {
      type: Number,
      default: 0
    },
    // Reference Images for Verification
    studentPhotoUrl: String,
    candidateSignatureUrl: String,
    secretarySignatureUrl: {
      type: String,
      default: '/assets/signatures/secretary_default.png'
    },
    // Blockchain/IPFS integration
    ipfsHash: {
      type: String,
    },
    blockchainHash: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ rollNumber: 1, institution: 1 });
certificateSchema.index({ createdAt: -1 });
certificateSchema.index({ status: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
