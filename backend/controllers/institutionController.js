const Certificate = require('../models/Certificate');
const fs = require('fs');
const csv = require('csv-parser');
const User = require('../models/User');

// @desc    Add or manage institution records
// @route   POST /api/institutions
// @access  Private (Admin)
exports.createInstitution = async (req, res, next) => {
  try {
    const { name, email, password, institutionDetails } = req.body;

    // Check if institution already exists
    const existingInstitution = await User.findOne({ email });
    if (existingInstitution) {
      return res.status(400).json({
        success: false,
        message: 'Institution with this email already exists'
      });
    }

    const institution = await User.create({
      name,
      email,
      password,
      role: 'institution',
      institutionDetails
    });

    res.status(201).json({
      success: true,
      message: 'Institution created successfully',
      data: {
        _id: institution._id,
        name: institution.name,
        email: institution.email,
        role: institution.role,
        institutionDetails: institution.institutionDetails,
        createdAt: institution.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

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

// @desc    Add a single student record to the Master Registry
// @route   POST /api/institutions/upload-single
// @access  Private (Institution)
exports.uploadSingleRecord = async (req, res) => {
  try {
    if (req.user.role !== 'institution') {
      return res.status(403).json({ success: false, error: 'Only institutions can add records' });
    }

    const { 
      studentName, registerNumber, rollNumber, emisId, 
      certificateSerialNo, dateOfBirth, schoolName, 
      totalMarks, tmrCode, sessionAndYear 
    } = req.body;

    const recordExists = await StudentRegistry.findOne({ registerNumber });
    if (recordExists) {
      return res.status(400).json({ success: false, error: 'Student with this Register Number already exists in the Registry' });
    }

    // Process uploaded files if any
    const photoPath = req.files && req.files['studentPhoto'] ? `uploads/${req.files['studentPhoto'][0].filename}` : null;
    const signaturePath = req.files && req.files['studentSignature'] ? `uploads/${req.files['studentSignature'][0].filename}` : null;
    const secretaryPath = req.files && req.files['secretarySignature'] ? `uploads/${req.files['secretarySignature'][0].filename}` : null;

    const student = await StudentRegistry.create({
      institution: req.user.id,
      studentName,
      registerNumber,
      rollNumber,
      emisId,
      certificateSerialNo,
      dateOfBirth,
      schoolName,
      totalMarks,
      tmrCode,
      sessionAndYear: sessionAndYear || 'MAR 2024',
      studentPhotoUrl: photoPath,
      candidateSignatureUrl: signaturePath,
      secretarySignatureUrl: secretaryPath,
      uploadedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Student and biometric assets added to Master Registry successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const StudentRegistry = require('../models/StudentRegistry');
const AdmZip = require('adm-zip');
const path = require('path');

// @desc    Bulk upload certificate records via ZIP to Master Registry
// @route   POST /api/institutions/upload-records
// @access  Private (Institution)
exports.uploadBulkRecords = async (req, res) => {
  const tempDir = path.join(__dirname, `../temp_${Date.now()}`);
  const finalUploadsDir = path.join(__dirname, '../uploads');

  try {
    if (req.user.role !== 'institution') {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, error: 'Only institutions can perform bulk uploads' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a ZIP file containing the registry.csv and student assets' });
    }

    // 1. Extract ZIP
    const zip = new AdmZip(req.file.path);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    zip.extractAllTo(tempDir, true);

    // 2. Find CSV file
    const files = fs.readdirSync(tempDir);
    const csvFile = files.find(f => f.endsWith('.csv'));
    
    if (!csvFile) {
      cleanupDir(tempDir);
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'ZIP must contain a registry.csv file' });
    }

    const results = [];
    const errors = [];
    const stream = fs.createReadStream(path.join(tempDir, csvFile)).pipe(csv());

    // 3. Parse CSV and Map Images
    for await (const row of stream) {
      const regNo = row.registerNumber;
      
      if (!regNo || !row.studentName) {
        errors.push({ row, error: 'Missing registerNumber or studentName' });
        continue;
      }

      // Find assets in the extracted folder
      const findAsset = (suffix) => {
        const patterns = [
          `${regNo}_${suffix}.jpg`, `${regNo}_${suffix}.jpeg`, 
          `${regNo}_${suffix}.png`, `${regNo}_${suffix}.pdf`
        ];
        return files.find(f => patterns.includes(f.toLowerCase()));
      };

      const photoFile = findAsset('photo');
      const sigFile = findAsset('sig');

      // Move files to final uploads directory and get paths
      const processFile = (fileName) => {
        if (!fileName) return null;
        const oldPath = path.join(tempDir, fileName);
        const newName = `${Date.now()}-${fileName}`;
        const newPath = path.join(finalUploadsDir, newName);
        fs.renameSync(oldPath, newPath);
        return `uploads/${newName}`; // Relative path for DB
      };

      results.push({
        institution: req.user.id,
        studentName: row.studentName,
        registerNumber: regNo,
        rollNumber: row.rollNumber,
        emisId: row.emisId,
        certificateSerialNo: row.certificateSerialNo,
        sessionAndYear: row.sessionAndYear || 'MAR 2024',
        dateOfBirth: row.dateOfBirth,
        schoolName: row.schoolName,
        totalMarks: row.totalMarks,
        tmrCode: row.tmrCode,
        studentPhotoUrl: processFile(photoFile),
        candidateSignatureUrl: processFile(sigFile),
        uploadedBy: req.user.id
      });
    }

    // 4. Bulk Save to Master Registry
    if (results.length > 0) {
      await StudentRegistry.insertMany(results, { ordered: false });
    }

    // 5. Cleanup
    cleanupDir(tempDir);
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      message: `Master Registry Import Complete. ${results.length} students enrolled with biometric assets.`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    cleanupDir(tempDir);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Bulk Upload Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper for cleanup
function cleanupDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}
