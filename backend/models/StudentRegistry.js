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
      unique: true,
      index: true
    },
    emisId: {
      type: String,
      required: [true, 'EMIS ID is required'],
      index: true
    },
    certificateSerialNo: {
      type: String,
      required: [true, 'Certificate SL No is required'],
      unique: true,
      index: true
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
      default: 'MAR 2024'
    },
    totalMarks: {
      type: String,
      required: [true, 'Total Marks are required'],
    },
    tmrCode: String,
    
    // Biometric Master Copies (Ground Truth)
    studentPhotoUrl: String,
    candidateSignatureUrl: String,
    secretarySignatureUrl: String,

    // Audit Metadata
    isVerified: {
      type: Boolean,
      default: true // Board uploaded records are considered verified by default
    },
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
  }
);

// Performance Indexes
studentRegistrySchema.index({ registerNumber: 1 });
studentRegistrySchema.index({ emisId: 1 });
studentRegistrySchema.index({ certificateSerialNo: 1 });

module.exports = mongoose.model('StudentRegistry', studentRegistrySchema);
