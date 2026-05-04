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
      required: [true, 'Please add a roll number'],
      index: true,
    },
    course: {
      type: String,
      required: [true, 'Please add a course name'],
    },
    graduationYear: {
      type: Number,
      required: [true, 'Please add graduation year'],
    },
    grade: {
      type: String,
      required: [true, 'Please add grade/CGPA'],
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
