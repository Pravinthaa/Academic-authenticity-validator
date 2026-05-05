/**
 * devRoutes.js — DEV ONLY
 * Exposes a /api/dev/db-view endpoint that returns all collections
 * for quick visual inspection during development.
 * Remove or gate this behind NODE_ENV checks before production.
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const StudentRegistry = require('../models/StudentRegistry');
const VerificationLog = require('../models/VerificationLog');

// GET /api/dev/db-view
router.get('/db-view', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  const [users, certificates, verificationLogs, studentRegistries] = await Promise.all([
    User.find().select('-password'),
    Certificate.find().populate('institution', 'name institutionDetails'),
    VerificationLog.find()
      .populate('certificate', 'certificateId studentName')
      .populate('verifiedBy', 'name email'),
    StudentRegistry.find().populate('institution', 'name')
  ]);

  res.json({ users, certificates, verificationLogs, studentRegistries });
});

module.exports = router;
