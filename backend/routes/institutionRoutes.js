const express = require('express');
const multer = require('multer');
const { getInstitutionCertificates, uploadSingleRecord, uploadBulkRecords } = require('../controllers/institutionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Setup Multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

router.get('/:id/certificates', protect, getInstitutionCertificates);
router.post('/upload-single', protect, authorize('institution'), uploadSingleRecord);
router.post('/upload-records', protect, authorize('institution'), upload.single('file'), uploadBulkRecords);

module.exports = router;
