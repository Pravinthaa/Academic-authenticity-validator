const Certificate = require('../models/Certificate');
const fs = require('fs');
const csv = require('csv-parser');

// @desc    Get all certificates issued by an institution
// @route   GET /api/institutions/:id/certificates
// @access  Private (Institution/Admin)
exports.getInstitutionCertificates = async (req, res) => {
  try {
    // Basic verification - assume admin or the institution itself
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
       return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const certificates = await Certificate.find({ institution: req.params.id });

    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Upload a single certificate record
// @route   POST /api/institutions/upload-single
// @access  Private (Institution)
exports.uploadSingleRecord = async (req, res) => {
  try {
    if (req.user.role !== 'institution') {
      return res.status(403).json({ success: false, error: 'Only institutions can upload records' });
    }

    const { studentName, rollNumber, course, graduationYear, grade, certificateId, issueDate } = req.body;

    const certExists = await Certificate.findOne({ certificateId });
    if (certExists) {
      return res.status(400).json({ success: false, error: 'Certificate with this ID already exists' });
    }

    const certificate = await Certificate.create({
      institution: req.user.id,
      studentName,
      rollNumber,
      course,
      graduationYear,
      grade,
      certificateId,
      issueDate: issueDate || Date.now()
    });

    res.status(201).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Bulk upload certificate records via CSV
// @route   POST /api/institutions/upload-records
// @access  Private (Institution)
exports.uploadBulkRecords = async (req, res) => {
  try {
    if (req.user.role !== 'institution') {
        if(req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ success: false, error: 'Only institutions can upload records' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a CSV file' });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        // Expected CSV columns: studentName, rollNumber, course, graduationYear, grade, certificateId
        if (!data.certificateId || !data.studentName || !data.rollNumber) {
           errors.push({ row: data, error: 'Missing required fields' });
        } else {
           results.push({
             institution: req.user.id,
             studentName: data.studentName,
             rollNumber: data.rollNumber,
             course: data.course,
             graduationYear: data.graduationYear,
             grade: data.grade,
             certificateId: data.certificateId,
             issueDate: data.issueDate ? new Date(data.issueDate) : Date.now()
           });
        }
      })
      .on('end', async () => {
        // Remove file after processing
        fs.unlinkSync(req.file.path);

        if (results.length === 0) {
          return res.status(400).json({ success: false, error: 'No valid records found in CSV' });
        }

        try {
          // Bulk insert, unordered to continue on duplicates
          const inserted = await Certificate.insertMany(results, { ordered: false });
          res.status(201).json({
            success: true,
            message: `Successfully uploaded ${inserted.length} records.`,
            errors: errors.length > 0 ? errors : undefined
          });
        } catch (insertError) {
          // Handle partial success (e.g. duplicate key errors for some rows)
          if (insertError.code === 11000) {
             const insertedCount = insertError.insertedDocs ? insertError.insertedDocs.length : 0;
             res.status(201).json({
               success: true,
               message: `Uploaded ${insertedCount} records. Some records were skipped due to duplicate Certificate IDs.`,
               errorDetails: insertError.writeErrors
             });
          } else {
            res.status(500).json({ success: false, error: insertError.message });
          }
        }
      });

  } catch (error) {
    if(req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: error.message });
  }
};
