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
    ipfsHash: {
      type: String, // Future-proofing for blockchain integration
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Certificate', certificateSchema);
