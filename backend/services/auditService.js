const VerificationLog = require('../models/VerificationLog');

// @desc Log all verification activities
const logVerification = async (verificationData) => {
  try {
    const log = await VerificationLog.create({
      certificate: verificationData.certificate || null,
      queryValue: verificationData.queryValue,
      queryType: verificationData.queryType,
      result: verificationData.result,
      verifiedBy: verificationData.verifiedBy || null,
      ipAddress: verificationData.ipAddress,
      verifierOrganisation: verificationData.verifierOrganisation,
      metadata: verificationData.metadata || {}
    });
    return log;
  } catch (error) {
    console.error('Error logging verification:', error);
    throw error;
  }
};

// @desc Log certificate upload activity
const logCertificateUpload = async (userId, certificateId, ipAddress, details = {}) => {
  try {
    const log = await VerificationLog.create({
      queryValue: certificateId,
      queryType: 'certificateId',
      result: 'uploaded',
      verifiedBy: userId,
      ipAddress,
      metadata: {
        action: 'certificate_upload',
        ...details
      }
    });
    return log;
  } catch (error) {
    console.error('Error logging upload:', error);
    throw error;
  }
};

// @desc Log user access
const logUserAccess = async (userId, action, ipAddress, details = {}) => {
  try {
    const log = await VerificationLog.create({
      queryValue: userId.toString(),
      queryType: 'user_action',
      result: action,
      verifiedBy: userId,
      ipAddress,
      metadata: {
        action,
        timestamp: new Date(),
        ...details
      }
    });
    return log;
  } catch (error) {
    console.error('Error logging user access:', error);
    throw error;
  }
};

// @desc Get verification logs for admin dashboard
const getVerificationLogs = async (filters = {}, limit = 100, skip = 0) => {
  try {
    const query = {};
    
    if (filters.verifiedBy) {
      query.verifiedBy = filters.verifiedBy;
    }
    
    if (filters.result) {
      query.result = filters.result;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.createdAt.$lte = new Date(filters.dateTo);
      }
    }

    const logs = await VerificationLog.find(query)
      .populate('certificate', 'certificateId studentName rollNumber')
      .populate('verifiedBy', 'name email')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await VerificationLog.countDocuments(query);

    return {
      logs,
      total,
      limit,
      skip,
      pages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error retrieving logs:', error);
    throw error;
  }
};

// @desc Generate audit report
const generateAuditReport = async (startDate, endDate) => {
  try {
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const totalVerifications = await VerificationLog.countDocuments(query);
    
    const resultBreakdown = await VerificationLog.aggregate([
      { $match: query },
      { $group: { _id: '$result', count: { $sum: 1 } } }
    ]);

    const topVerifiers = await VerificationLog.aggregate([
      { $match: query },
      { $match: { verifiedBy: { $ne: null } } },
      { $group: { _id: '$verifiedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'verifier' } }
    ]);

    const suspiciousActivities = await VerificationLog.find(query)
      .where('result').in(['not_found', 'revoked'])
      .limit(50)
      .sort({ createdAt: -1 })
      .populate('verifiedBy', 'name email');

    return {
      reportPeriod: { startDate, endDate },
      totalVerifications,
      resultBreakdown,
      topVerifiers,
      suspiciousActivities,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error generating audit report:', error);
    throw error;
  }
};

// @desc Get verification statistics
const getVerificationStatistics = async (days = 30) => {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const stats = await VerificationLog.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          found: { $sum: { $cond: [{ $eq: ['$result', 'found'] }, 1, 0] } },
          notFound: { $sum: { $cond: [{ $eq: ['$result', 'not_found'] }, 1, 0] } },
          revoked: { $sum: { $cond: [{ $eq: ['$result', 'revoked'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      period: { days, from: dateFrom, to: new Date() },
      dailyStats: stats,
      summary: {
        totalVerifications: stats.reduce((sum, s) => sum + s.total, 0),
        totalFound: stats.reduce((sum, s) => sum + s.found, 0),
        totalNotFound: stats.reduce((sum, s) => sum + s.notFound, 0),
        totalRevoked: stats.reduce((sum, s) => sum + s.revoked, 0)
      }
    };
  } catch (error) {
    console.error('Error calculating statistics:', error);
    throw error;
  }
};

module.exports = {
  logVerification,
  logCertificateUpload,
  logUserAccess,
  getVerificationLogs,
  generateAuditReport,
  getVerificationStatistics
};
