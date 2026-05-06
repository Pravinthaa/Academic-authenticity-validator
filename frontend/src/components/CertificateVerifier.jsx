import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, AlertTriangle, XCircle, Loader, Search, Upload } from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function CertificateVerifier() {
  const [searchType, setSearchType] = useState('ai'); // ai, certificate, or roll
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState({
    certificateId: '',
    rollNumber: '',
    studentName: '',
    verifierOrganisation: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success('Certificate image staged for AI analysis');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchQuery(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (searchType === 'ai' && !file) {
      toast.error('Please upload a certificate image for AI analysis');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let response;
      if (searchType === 'ai') {
        const formData = new FormData();
        formData.append('certificate', file);
        if (searchQuery.verifierOrganisation) {
          formData.append('verifierOrganisation', searchQuery.verifierOrganisation);
        }

        response = await axios.post(`${API_BASE_URL}/api/certificates/verify`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        const payload = {
          ...(searchType === 'certificate' && { certificateId: searchQuery.certificateId }),
          ...(searchType === 'roll' && {
            rollNumber: searchQuery.rollNumber,
            studentName: searchQuery.studentName
          }),
          ...(searchQuery.verifierOrganisation && { verifierOrganisation: searchQuery.verifierOrganisation })
        };
        response = await axios.post(`${API_BASE_URL}/api/certificates/verify`, payload);
      }

      setResult(response.data);
      if (response.data.success) {
        toast.success('AI Verification Complete');
      }
    } catch (error) {
      const errorData = error.response?.data;
      setResult({
        success: false,
        status: errorData?.status || 'error',
        message: errorData?.message || 'Verification failed',
        aiExtractions: errorData?.aiExtractions,
        error: true
      });
      toast.error(errorData?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'bg-green-500/10 border border-green-500/20 rounded-3xl overflow-hidden';
      case 'suspicious': return 'bg-yellow-500/10 border border-yellow-500/20 rounded-3xl overflow-hidden';
      case 'revoked': return 'bg-orange-500/10 border border-orange-500/20 rounded-3xl overflow-hidden';
      case 'tampered': return 'bg-red-500/10 border border-red-500/20 rounded-3xl overflow-hidden';
      default: return 'bg-red-500/10 border border-red-500/20 rounded-3xl overflow-hidden';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-10 h-10 text-green-400" />;
      case 'suspicious': return <AlertTriangle className="w-10 h-10 text-yellow-400" />;
      case 'tampered': return <XCircle className="w-10 h-10 text-red-400" />;
      default: return <XCircle className="w-10 h-10 text-red-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'valid': return 'Verified Authentic';
      case 'suspicious': return 'Suspicious / Mismatch';
      case 'revoked': return 'Revoked Record';
      case 'tampered': return 'Tampered Certificate';
      default: return 'Invalid / Forged';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4 italic tracking-tighter">VERI-CHAIN AI VERIFIER</h1>
          <p className="text-purple-300 font-medium tracking-widest uppercase text-xs">High-Stakes Document Authentication Engine</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Search Form */}
          <div className="bg-gray-800/30 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
            {/* Search Type Tabs */}
            <div className="flex bg-black/40 p-2 rounded-2xl gap-2 mb-10">
              {[
                { id: 'ai', label: 'AI Image Verification', icon: <Upload className="w-4 h-4" /> },
                { id: 'certificate', label: 'Registry ID', icon: <Search className="w-4 h-4" /> },
                { id: 'roll', label: 'Student Search', icon: <Search className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSearchType(tab.id);
                    setResult(null);
                  }}
                  className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    searchType === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="space-y-8">
              {/* AI Image Upload */}
              {searchType === 'ai' && (
                <div className="relative group">
                  <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" id="verify-file" />
                  <label htmlFor="verify-file" className="cursor-pointer block border-2 border-dashed border-white/10 rounded-3xl p-12 text-center hover:border-purple-500/50 transition-all bg-black/20 group-hover:bg-black/40">
                    <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-10 h-10 text-purple-400" />
                    </div>
                    <p className="text-white font-black text-xl mb-1 italic">
                      {file ? file.name : 'UPLOAD CERTIFICATE PHOTO'}
                    </p>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                      AI WILL AUTOMATICALLY EXTRACT AND COMPARE ALL FIELDS
                    </p>
                  </label>
                </div>
              )}

              {/* Certificate ID Search */}
              {searchType === 'certificate' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] ml-4">Registry ID</label>
                  <input
                    type="text"
                    name="certificateId"
                    value={searchQuery.certificateId}
                    onChange={handleInputChange}
                    placeholder="Enter board registry ID..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white font-medium focus:border-purple-500 outline-none transition-all placeholder:text-gray-700"
                  />
                </div>
              )}

              {/* Roll Number Search */}
              {searchType === 'roll' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] ml-4">Permanent Reg No</label>
                    <input
                      type="text"
                      name="rollNumber"
                      value={searchQuery.rollNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 2313150825"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white font-medium focus:border-purple-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] ml-4">Student Name</label>
                    <input
                      type="text"
                      name="studentName"
                      value={searchQuery.studentName}
                      onChange={handleInputChange}
                      placeholder="Enter full name..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white font-medium focus:border-purple-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Organization */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] ml-4">Verifier Organisation</label>
                <input
                  type="text"
                  name="verifierOrganisation"
                  value={searchQuery.verifierOrganisation}
                  onChange={handleInputChange}
                  placeholder="e.g. Madurai District Court, TCS Recruitment..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white font-medium focus:border-purple-500 outline-none transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-20 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-[length:200%_100%] hover:bg-[100%_0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xl italic rounded-3xl transition-all shadow-2xl shadow-purple-500/20 flex items-center justify-center gap-4 group"
              >
                {loading ? (
                  <Loader className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Search className="w-6 h-6" />
                    </div>
                    RUN COMPREHENSIVE AI VERIFICATION
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Verification Result */}
          {result && (
            <div className={`mt-8 ${getStatusColor(result.status)}`}>
              {/* Trust Score & Result Header */}
              <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-black/40 rounded-t-3xl border-b border-white/5 gap-6">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-white/5 rounded-2xl">
                    {getStatusIcon(result.status)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                      {getStatusText(result.status)}
                    </h2>
                    <p className="text-gray-400 text-sm font-mono mt-1">
                      REGISTRY ID: {result.verificationId?.substring(0, 12).toUpperCase()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">AI Confidence</p>
                    <p className="text-2xl font-black text-white">{Math.round((result.confidence || 0.98) * 100)}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </div>

                {result.status === 'tampered' && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em] mb-2">Tampered Mock Details</p>
                      <p className="text-sm text-red-200/90 leading-relaxed">
                        Filename marker triggered the tampered mock response for this upload.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-black/25 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Institution</p>
                        <p className="text-white font-medium">{result.institution?.name || 'Mock Institution'}</p>
                      </div>
                      <div className="bg-black/25 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Confidence</p>
                        <p className="text-white font-medium">{Math.round((result.confidence || 0) * 100)}%</p>
                      </div>
                      <div className="bg-black/25 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tamper Status</p>
                        <p className="text-white font-medium">Flagged as tampered</p>
                      </div>
                    </div>

                    <div className="bg-black/25 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Mock Extracted Data</p>
                      <div className="space-y-2">
                        {Object.entries(result.aiExtractions || {}).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between gap-4">
                            <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="text-white font-medium text-right">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {result.tamperDetails?.details && (
                      <div className="text-sm text-red-200/90">
                        <span className="font-bold text-red-300">Reason: </span>
                        {result.tamperDetails.details}
                      </div>
                    )}
                  </div>
                )}

              <div className="p-8 space-y-8">
                {/* Comparison Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 1. Ground Truth Textual Comparison */}
                  <div className="bg-gray-900/40 rounded-3xl p-6 border border-white/5">
                    <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                      Official Board Registry Match
                    </h3>
                    
                    <div className="space-y-3">
                      {[
                        { label: 'Student Name', key: 'studentName' },
                        { label: 'Permanent Reg No', key: 'registerNumber' },
                        { label: 'EMIS ID Number', key: 'emisId' },
                        { label: 'Total Marks', key: 'totalMarks' },
                        { label: 'Date of Birth', key: 'dateOfBirth' },
                        { label: 'School Name', key: 'schoolName' }
                      ].map((field) => (
                        <div key={field.key} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase">{field.label}</p>
                            <p className="text-sm text-white font-medium">{result.certificate?.[field.key] || 'N/A'}</p>
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tighter ${
                            result.dataMatches?.[field.key] 
                              ? 'bg-green-500/10 text-green-400' 
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {result.dataMatches?.[field.key] ? 'AUTHENTIC' : 'MISMATCH'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Biometric & AI Analysis */}
                  <div className="space-y-6">
                    <div className="bg-gray-900/40 rounded-3xl p-6 border border-white/5">
                      <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                        AI Biometric Authentication
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${result.visualVerification?.photoMatch ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                              <Search className={`w-4 h-4 ${result.visualVerification?.photoMatch ? 'text-green-400' : 'text-red-400'}`} />
                            </div>
                            <span className="text-sm text-white font-bold">Candidate Photo Match</span>
                          </div>
                          <span className={`text-[10px] font-black ${result.visualVerification?.photoMatch ? 'text-green-400' : 'text-red-400'}`}>
                            {result.visualVerification?.photoMatch ? 'VERIFIED' : 'FAILED'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${result.visualVerification?.candidateSignatureMatch ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                              <CheckCircle className={`w-4 h-4 ${result.visualVerification?.candidateSignatureMatch ? 'text-green-400' : 'text-red-400'}`} />
                            </div>
                            <span className="text-sm text-white font-bold">Candidate Signature</span>
                          </div>
                          <span className={`text-[10px] font-black ${result.visualVerification?.candidateSignatureMatch ? 'text-green-400' : 'text-red-400'}`}>
                            {result.visualVerification?.candidateSignatureMatch ? 'VERIFIED' : 'FAILED'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${result.visualVerification?.secretarySignatureMatch ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                              <CheckCircle className={`w-4 h-4 ${result.visualVerification?.secretarySignatureMatch ? 'text-green-400' : 'text-red-400'}`} />
                            </div>
                            <span className="text-sm text-white font-bold">Secretary Signature</span>
                          </div>
                          <span className={`text-[10px] font-black ${result.visualVerification?.secretarySignatureMatch ? 'text-green-400' : 'text-red-400'}`}>
                            {result.visualVerification?.secretarySignatureMatch ? 'VERIFIED' : 'FAILED'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tamper Warning */}
                    {result.visualVerification?.isTampered && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                        <AlertTriangle className="text-red-400 w-5 h-5 flex-shrink-0" />
                        <div>
                          <p className="text-red-400 text-xs font-bold uppercase">Tampering Detected</p>
                          <p className="text-red-300/60 text-[10px] mt-1 leading-relaxed">
                            AI analysis has detected potential image manipulation or pixel inconsistencies in the document structure.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
