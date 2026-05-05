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
      index: true,
    },
    queryType: {
      type: String,
      enum: ['certificateId', 'rollNumber', 'user_action', 'upload'],
      required: true,
    },
    // Result of the verification
    result: {
      type: String,
      enum: ['found', 'not_found', 'revoked', 'uploaded', 'updated', 'deleted', 'verified', 'suspicious', 'fraud'],
      required: true,
    },
    // Who performed the verification (optional — public verifiers may not be logged in)
    verifiedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
    // IP address for audit trail
    ipAddress: {
      type: String,
    },
    // Optional: organisation name of verifier (e.g. company, gov body)
    verifierOrganisation: {
      type: String,
    },
    // Additional metadata
    metadata: {
      type: Map,
      of: String,
      default: new Map(),
    },
    // Risk assessment if applicable
    riskScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    // Tamper flags if detected
    tamperFlags: [{
      type: String,
      enum: ['signature_mismatch', 'seal_forgery', 'text_alteration', 'duplicate_detected', 'date_inconsistency']
    }],
    // AI Snapshots
    aiExtractions: {
      studentName: String,
      registerNumber: String,
      emisId: String,
      totalMarks: String,
      dateOfBirth: String,
      schoolName: String
    },
    visualVerification: {
      photoMatch: Boolean,
      candidateSignatureMatch: Boolean,
      secretarySignatureMatch: Boolean,
      isTampered: Boolean
    },
    confidence: Number
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups on queryValue and date
verificationLogSchema.index({ queryValue: 1 });
verificationLogSchema.index({ createdAt: -1 });
verificationLogSchema.index({ verifiedBy: 1, createdAt: -1 });
verificationLogSchema.index({ result: 1, createdAt: -1 });
verificationLogSchema.index({ certificate: 1 });

module.exports = mongoose.model('VerificationLog', verificationLogSchema);
