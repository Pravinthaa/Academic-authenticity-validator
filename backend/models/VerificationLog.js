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
    },
    queryType: {
      type: String,
      enum: ['certificateId', 'rollNumber'],
      required: true,
    },
    // Result of the verification
    result: {
      type: String,
      enum: ['found', 'not_found', 'revoked'],
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
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups on queryValue
verificationLogSchema.index({ queryValue: 1 });
verificationLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('VerificationLog', verificationLogSchema);
