const User = require('../models/User');
const VerificationLog = require('../models/VerificationLog');
const Certificate = require('../models/Certificate');

/**
 * @desc    System activity overview
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin)
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalInstitutions,
      totalCertificates,
      totalVerifications,
      activeCertificates,
      revokedCertificates,
      foundVerifications,
      suspiciousVerifications,
      recentSevenDays
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'institution' }),
      Certificate.countDocuments(),
      VerificationLog.countDocuments({ queryType: { $in: ['certificateId', 'rollNumber', 'upload'] } }),
      Certificate.countDocuments({ status: 'active' }),
      Certificate.countDocuments({ status: 'revoked' }),
      VerificationLog.countDocuments({ result: 'found' }),
      VerificationLog.countDocuments({ result: { $in: ['not_found', 'suspicious', 'fraud'] } }),
      VerificationLog.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        queryType: { $in: ['certificateId', 'rollNumber', 'upload'] }
      })
    ]);

    const successRate = totalVerifications > 0 
      ? ((foundVerifications / totalVerifications) * 100).toFixed(1) 
      : 0;

    // Recent logs for the dashboard table
    const recentLogs = await VerificationLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('verifiedBy', 'name email role')
      .populate('certificate', 'certificateId studentName');

    res.status(200).json({ 
      success: true, 
      data: {
        totalUsers,
        totalInstitutions,
        totalCertificates,
        totalVerifications,
        foundVerifications,
        notFoundVerifications: suspiciousVerifications,
        successRate,
        verificationRate: successRate, // Consistency for frontend
        recentSevenDays,
        recentVerifications: recentSevenDays, // Map for frontend compatibility
        certificates: {
          total: totalCertificates,
          active: activeCertificates,
          revoked: revokedCertificates
        },
        recentLogs
      }
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard data' });
  }
};

/**
 * @desc    Logs of all operations
 * @route   GET /api/admin/activities
 * @access  Private (Admin)
 */
exports.getActivities = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Filter for verification activities (exclude internal user actions for this view)
    const query = { queryType: { $ne: 'user_action' } };

    const logs = await VerificationLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('verifiedBy', 'name email role')
      .populate('certificate', 'certificateId studentName');
      
    const total = await VerificationLog.countDocuments(query);

    res.status(200).json({ 
      success: true, 
      count: logs.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: logs 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate verification reports
 * @route   GET /api/admin/reports
 * @access  Private (Admin)
 */
exports.getReports = async (req, res, next) => {
  try {
    const [
      valid, 
      suspicious, 
      revoked, 
      fraud,
      byInstitution,
      activityTrend
    ] = await Promise.all([
      VerificationLog.countDocuments({ result: 'found' }),
      VerificationLog.countDocuments({ result: 'suspicious' }),
      VerificationLog.countDocuments({ result: 'revoked' }),
      VerificationLog.countDocuments({ result: 'fraud' }),
      VerificationLog.aggregate([
        { $match: { result: 'found' } },
        { $group: { _id: '$verifierOrganisation', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      VerificationLog.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ])
    ]);

    res.status(200).json({ 
      success: true, 
      data: { 
        summary: {
          valid, 
          suspicious, 
          revoked, 
          fraud,
          total: valid + suspicious + revoked + fraud
        },
        byInstitution,
        activityTrend,
        timestamp: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retrieve full audit trails
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin)
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // Full audit trail includes user actions
    const logs = await VerificationLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('verifiedBy', 'name email role')
      .populate('certificate', 'certificateId studentName');
      
    const total = await VerificationLog.countDocuments();

    res.status(200).json({ 
      success: true, 
      count: logs.length, 
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: logs 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List all system users
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new user account
 * @route   POST /api/admin/users
 * @access  Private (Admin)
 */
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role });
    
    // Log this action
    await VerificationLog.create({
      queryValue: email,
      queryType: 'user_action',
      result: 'verified',
      verifiedBy: req.user._id,
      metadata: { action: 'create_user', targetRole: role }
    });

    res.status(201).json({ 
      success: true, 
      data: { _id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a user account
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, status } = req.body;
    
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, status },
      { new: true, runValidators: true }
    ).select('-password');

    // Log this action
    await VerificationLog.create({
      queryValue: email,
      queryType: 'user_action',
      result: 'updated',
      verifiedBy: req.user._id,
      metadata: { action: 'update_user', userId: req.params.id }
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a user account
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    // Log this action
    await VerificationLog.create({
      queryValue: user.email,
      queryType: 'user_action',
      result: 'deleted',
      verifiedBy: req.user._id,
      metadata: { action: 'delete_user', userId: req.params.id }
    });

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
