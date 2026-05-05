const mongoose = require('mongoose');

const verificationLogSchema = new mongoose.Schema(
  {
    // The certificate that was looked up (null if not found)
    certificate: {
      type: mongoose.Schema.ObjectId,
      ref: 'Certificate',
      default: null,
    },

    // The certificate ID or roll number that was queried
    queryValue: {
      type: String,
      required: [true, 'Please provide the queried value'],
      // ❌ removed index: true to avoid duplication
    },

    queryType: {
      type: String,
      enum: ['certificateId', 'rollNumber', 'user_action', 'upload'],
      required: true,
    },

    // Result of the verification
    result: {
      type: String,
      enum: [
        'found',
        'not_found',
        'revoked',
        'uploaded',
        'updated',
        'deleted',
        'verified',
        'suspicious',
        'fraud'
      ],
      required: true,
    },

    // Who performed the verification
    verifiedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },

    // IP address for audit trail
    ipAddress: String,

    // Organisation name of verifier
    verifierOrganisation: String,

    // Additional metadata
    metadata: {
      type: Map,
      of: String,
      default: new Map(),
    },

    // Risk score (AI-based)
    riskScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    // Tamper flags
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

    // AI extracted data snapshot
    aiExtractions: {
      studentName: String,
      registerNumber: String,
      emisId: String,
      totalMarks: String,
      dateOfBirth: String,
      schoolName: String,
    },

    // Visual verification results
    visualVerification: {
      photoMatch: Boolean,
      candidateSignatureMatch: Boolean,
      secretarySignatureMatch: Boolean,
      isTampered: Boolean,
    },

    // Overall confidence score
    confidence: Number,
  },
  {
    timestamps: true,
  }
);


// ================= INDEXES =================

// Fast lookup by searched value
verificationLogSchema.index({ queryValue: 1 });

// Time-based queries (recent activity)
verificationLogSchema.index({ createdAt: -1 });

// User activity tracking
verificationLogSchema.index({ verifiedBy: 1, createdAt: -1 });

// Analytics (result trends)
verificationLogSchema.index({ result: 1, createdAt: -1 });

// Certificate-based lookups
verificationLogSchema.index({ certificate: 1 });

// 🔥 Advanced: fraud / repeated query detection
verificationLogSchema.index({ queryValue: 1, result: 1 });


// ================= MODEL EXPORT =================

module.exports = mongoose.model('VerificationLog', verificationLogSchema);