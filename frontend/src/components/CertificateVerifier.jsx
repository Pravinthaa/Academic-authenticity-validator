import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, AlertTriangle, XCircle, Loader, Search } from 'lucide-react';

export default function CertificateVerifier() {
  const [searchType, setSearchType] = useState('certificate'); // certificate or roll
  const [searchQuery, setSearchQuery] = useState({
    certificateId: '',
    rollNumber: '',
    studentName: '',
    verifierOrganisation: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchQuery(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (searchType === 'certificate' && !searchQuery.certificateId) {
      toast.error('Please enter a certificate ID');
      return;
    }

    if (searchType === 'roll' && (!searchQuery.rollNumber || !searchQuery.studentName)) {
      toast.error('Please enter both roll number and student name');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        ...(searchType === 'certificate' && { certificateId: searchQuery.certificateId }),
        ...(searchType === 'roll' && {
          rollNumber: searchQuery.rollNumber,
          studentName: searchQuery.studentName
        }),
        ...(searchQuery.verifierOrganisation && { verifierOrganisation: searchQuery.verifierOrganisation })
      };

      const response = await axios.post(
        'http://localhost:5000/api/certificates/verify',
        payload
      );

      setResult({
        success: response.data.success,
        status: response.data.status,
        message: response.data.message,
        certificate: response.data.certificate,
        verificationId: response.data.verificationId,
        dataMatches: response.data.dataMatches,
        verifiedAt: response.data.verifiedAt,
        details: response.data.details
      });

      if (response.data.success) {
        toast.success('Certificate verified successfully!');
      } else {
        toast.error('Certificate verification failed');
      }
    } catch (error) {
      const errorData = error.response?.data;
      setResult({
        success: false,
        status: errorData?.status || 'error',
        message: errorData?.message || 'Verification failed',
        verificationId: errorData?.verificationId,
        details: errorData?.details,
        error: true
      });
      toast.error(errorData?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
        return 'bg-green-900/20 border-green-500/20';
      case 'invalid':
      case 'fraud':
        return 'bg-red-900/20 border-red-500/20';
      case 'suspicious':
        return 'bg-yellow-900/20 border-yellow-500/20';
      case 'revoked':
        return 'bg-orange-900/20 border-orange-500/20';
      default:
        return 'bg-gray-900/20 border-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      case 'invalid':
      case 'fraud':
        return <XCircle className="w-8 h-8 text-red-400" />;
      case 'suspicious':
      case 'revoked':
        return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'valid':
        return 'Certificate is Valid';
      case 'invalid':
        return 'Certificate is Invalid';
      case 'fraud':
        return 'Fraudulent Certificate';
      case 'suspicious':
        return 'Certificate is Suspicious';
      case 'revoked':
        return 'Certificate is Revoked';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Verify Certificate</h1>
          <p className="text-purple-200">Check the authenticity of academic certificates</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Search Form */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8">
            {/* Search Type Tabs */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => {
                  setSearchType('certificate');
                  setSearchQuery({
                    certificateId: '',
                    rollNumber: '',
                    studentName: '',
                    verifierOrganisation: ''
                  });
                  setResult(null);
                }}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  searchType === 'certificate'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Search by Certificate ID
              </button>
              <button
                onClick={() => {
                  setSearchType('roll');
                  setSearchQuery({
                    certificateId: '',
                    rollNumber: '',
                    studentName: '',
                    verifierOrganisation: ''
                  });
                  setResult(null);
                }}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  searchType === 'roll'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Search by Roll Number
              </button>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              {/* Certificate ID Search */}
              {searchType === 'certificate' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Certificate ID *
                  </label>
                  <input
                    type="text"
                    name="certificateId"
                    value={searchQuery.certificateId}
                    onChange={handleInputChange}
                    placeholder="Enter certificate ID"
                    className="w-full bg-gray-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              {/* Roll Number Search */}
              {searchType === 'roll' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      name="rollNumber"
                      value={searchQuery.rollNumber}
                      onChange={handleInputChange}
                      placeholder="Enter roll number"
                      className="w-full bg-gray-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      name="studentName"
                      value={searchQuery.studentName}
                      onChange={handleInputChange}
                      placeholder="Enter student name"
                      className="w-full bg-gray-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              {/* Organization (Optional) */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Your Organization (Optional)
                </label>
                <input
                  type="text"
                  name="verifierOrganisation"
                  value={searchQuery.verifierOrganisation}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC Company, Government Office"
                  className="w-full bg-gray-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Verify Certificate
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Verification Result */}
          {result && (
            <div className={`bg-gray-800/50 backdrop-blur-sm border-2 rounded-2xl p-8 ${getStatusColor(result.status)}`}>
              {/* Result Header */}
              <div className="flex items-start gap-4 mb-6">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">
                    {getStatusText(result.status)}
                  </h2>
                  <p className="text-gray-300 text-sm mt-1">
                    Verification ID: <span className="font-mono text-purple-300">{result.verificationId}</span>
                  </p>
                  <p className="text-gray-400 text-sm">
                    {new Date(result.verifiedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Certificate Details */}
              {result.certificate && (
                <div className="bg-gray-900/50 rounded-lg p-6 mb-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Student Name</p>
                      <p className="text-white font-medium">{result.certificate.studentName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Roll Number</p>
                      <p className="text-white font-medium">{result.certificate.rollNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Course</p>
                      <p className="text-white font-medium">{result.certificate.course}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Graduation Year</p>
                      <p className="text-white font-medium">{result.certificate.graduationYear}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Grade/CGPA</p>
                      <p className="text-white font-medium">{result.certificate.grade}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Issue Date</p>
                      <p className="text-white font-medium">
                        {new Date(result.certificate.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Matching Results */}
              {result.dataMatches && (
                <div className="bg-gray-900/50 rounded-lg p-6 space-y-3">
                  <p className="text-white font-medium mb-3">Data Verification:</p>
                  <div className="space-y-2">
                    {Object.entries(result.dataMatches).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        {value ? (
                          <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Verified
                          </span>
                        ) : (
                          <span className="text-red-400 text-sm font-medium flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Mismatch
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Details */}
              {result.error && result.details && (
                <div className="bg-gray-900/50 rounded-lg p-6">
                  <p className="text-white font-medium mb-2">Reason:</p>
                  <p className="text-gray-300">{result.details.reason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
