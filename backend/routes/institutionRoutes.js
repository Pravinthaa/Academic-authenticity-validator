const express = require('express');
const multer = require('multer');
const { getInstitutionCertificates, uploadSingleRecord, uploadBulkRecords, createInstitution } = require('../controllers/institutionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Setup Multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

const { uploadFile } = require('../middleware/uploadMiddleware');

router.post('/', protect, authorize('admin'), createInstitution);
router.get('/:id/certificates', protect, authorize('institution', 'admin'), getInstitutionCertificates);
router.post('/upload-single', protect, authorize('institution'), uploadFile.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'studentPhoto', maxCount: 1 },
  { name: 'studentSignature', maxCount: 1 },
  { name: 'secretarySignature', maxCount: 1 }
]), uploadSingleRecord);
router.post('/upload-records', protect, authorize('institution'), upload.single('file'), uploadBulkRecords);

module.exports = router;
