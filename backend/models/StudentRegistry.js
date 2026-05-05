const mongoose = require('mongoose');

const studentRegistrySchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },

    // Board Identifiers
    registerNumber: {
      type: String,
      required: [true, 'Register Number is required'],
      unique: true, // ✅ index auto-created
    },

    emisId: {
      type: String,
      required: [true, 'EMIS ID is required'],
    },

    certificateSerialNo: {
      type: String,
      required: [true, 'Certificate SL No is required'],
      unique: true, // ✅ index auto-created
    },

    // Student Personal Data
    studentName: {
      type: String,
      required: [true, 'Student Name is required'],
    },

    dateOfBirth: {
      type: Date,
      required: [true, 'Date of Birth is required'],
    },

    schoolName: {
      type: String,
      required: [true, 'School Name is required'],
    },

    // Academic Records
    sessionAndYear: {
      type: String,
      default: 'MAR 2024',
    },

    totalMarks: {
      type: String,
      required: [true, 'Total Marks are required'],
    },

    tmrCode: String,

    // Biometric Master Copies
    studentPhotoUrl: String,
    candidateSignatureUrl: String,
    secretarySignatureUrl: String,

    // Audit Metadata
    isVerified: {
      type: Boolean,
      default: true,
    },

    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ================= INDEXES =================

// Fast lookup fields

studentRegistrySchema.index({ emisId: 1 });

// Institution + register lookup (important for real-world systems)
studentRegistrySchema.index({ institution: 1, registerNumber: 1 });

// Recent uploads
studentRegistrySchema.index({ createdAt: -1 });

// Fraud / duplicate detection
studentRegistrySchema.index({ emisId: 1, certificateSerialNo: 1 });

module.exports = mongoose.model('StudentRegistry', studentRegistrySchema);