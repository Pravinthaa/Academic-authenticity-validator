const express = require('express');
const {
  getDashboard,
  getActivities,
  getReports,
  getAuditLogs,
  getUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/activities', getActivities);
router.get('/reports', getReports);
router.get('/audit-logs', getAuditLogs);

router.route('/users')
  .get(getUsers)
  .post(createUser);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
