import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import useAuthStore from '../store/authStore';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export default function CertificateUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState('single'); // single or bulk
  const [formData, setFormData] = useState({
    studentName: '',
    rollNumber: '',
    registerNumber: '',
    emisId: '',
    certificateSerialNo: '',
    sessionAndYear: 'MAR 2024',
    dateOfBirth: '',
    schoolName: '',
    graduationYear: 2024,
    totalMarks: '',
    tmrCode: '',
    institutionId: '',
    studentPhoto: null,
    studentSignature: null,
    secretarySignature: null
  });
  const [uploadResult, setUploadResult] = useState(null);
  const token = useAuthStore(state => state.token);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a Master ZIP file');
    
    setLoading(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/api/institutions/upload-records`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadResult({
        success: true,
        message: response.data.message,
        timestamp: new Date().toLocaleString()
      });
      toast.success('Bulk Registry & Biometric Import Successful!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (uploadMode === 'bulk') return handleBulkUpload(e);
    
    e.preventDefault();
    
    setLoading(true);
    try {
      const data = new FormData();
      
      // Append files
      if (file) data.append('certificate', file); // Optional master scan
      if (formData.studentPhoto) data.append('studentPhoto', formData.studentPhoto);
      if (formData.studentSignature) data.append('studentSignature', formData.studentSignature);
      if (formData.secretarySignature) data.append('secretarySignature', formData.secretarySignature);

      // Append all text fields
      Object.keys(formData).forEach(key => {
        if (!['studentPhoto', 'studentSignature', 'secretarySignature'].includes(key) && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });

      const response = await axios.post(
        `${API_BASE_URL}/api/institutions/upload-single`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadResult({
        success: true,
        message: 'Student enrolled in Master Registry successfully',
        timestamp: new Date().toLocaleString()
      });

      toast.success('Registry Entry Created Successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2 italic tracking-tight uppercase">Board Issuance Portal</h1>
          <p className="text-purple-200">Official Ground-Truth Registry & Certificate Management</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-gray-800/40 p-2 rounded-2xl mb-8 border border-white/5 w-fit mx-auto gap-2">
          <button 
            onClick={() => setUploadMode('single')}
            className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${uploadMode === 'single' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            Single Issuance
          </button>
          <button 
            onClick={() => setUploadMode('bulk')}
            className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${uploadMode === 'bulk' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            Bulk Registry Import (CSV)
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-gray-800/40 backdrop-blur-md border border-purple-500/20 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              {uploadMode === 'bulk' ? (
                /* BULK MODE UI */
                <div className="space-y-8">
                  <div className="bg-blue-500/5 p-10 rounded-2xl border border-blue-500/20 text-center">
                    <label className="block text-sm font-semibold text-blue-200 mb-6 uppercase tracking-wider italic">
                      Master Registry Package (.ZIP)
                    </label>
                    <div className="relative border-2 border-dashed border-blue-500/30 rounded-3xl p-12 hover:border-blue-500/50 transition-all cursor-pointer bg-black/20 group">
                      <input type="file" onChange={handleFileChange} accept=".zip" className="hidden" id="zip-file" />
                      <label htmlFor="zip-file" className="cursor-pointer flex flex-col items-center">
                        <Upload className="w-16 h-16 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                        <span className="text-white font-black text-xl italic">{file ? file.name : 'DROP MASTER BOARD ZIP'}</span>
                        <div className="mt-4 space-y-1">
                          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">ZIP must contain: registry.csv + image assets</p>
                          <p className="text-gray-500 text-[10px] uppercase font-bold">Image Format: [RegNo]_cert.jpg | [RegNo]_photo.jpg | [RegNo]_sig.jpg</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white font-black text-lg shadow-lg flex items-center justify-center gap-3 italic transition-all active:scale-95">
                    {loading ? <Loader className="animate-spin" /> : <><CheckCircle className="w-6 h-6" /> INITIATE MASTER REGISTRY IMPORT</>}
                  </button>
                </div>
              ) : (
                /* SINGLE MODE UI (Existing Form) */
                <>
                  {/* 1. File Upload Section */}
                  <div className="bg-purple-500/5 p-6 rounded-2xl border border-purple-500/10">
                    <label className="block text-sm font-semibold text-purple-200 mb-4 uppercase tracking-wider">
                      Official Mark Certificate (Master Copy)
                    </label>
                    <div className="relative border-2 border-dashed border-purple-500/30 rounded-xl p-8 hover:border-purple-500/50 transition-all cursor-pointer bg-black/20">
                      <input type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="cert-file" />
                      <label htmlFor="cert-file" className="cursor-pointer flex flex-col items-center">
                        <Upload className="w-10 h-10 text-purple-400 mb-2" />
                        <span className="text-white font-medium">{file ? file.name : 'Upload Certificate Image'}</span>
                      </label>
                    </div>
                  </div>

                  {/* 2. Board Identity Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-purple-300 uppercase mb-2">School Name</label>
                      <input name="schoolName" value={formData.schoolName} onChange={handleInputChange} className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none" placeholder="e.g. C E O A MATRIC. HR. SEC. SCHOOL" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-300 uppercase mb-2">Certificate SL No.</label>
                      <input name="certificateSerialNo" value={formData.certificateSerialNo} onChange={handleInputChange} className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none" placeholder="35141174" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-300 uppercase mb-2">EMIS ID No.</label>
                      <input name="emisId" value={formData.emisId} onChange={handleInputChange} className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none" placeholder="2010843333" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-300 uppercase mb-2">Session & Year</label>
                      <input name="sessionAndYear" value={formData.sessionAndYear} onChange={handleInputChange} className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none" />
                    </div>
                  </div>

                  {/* 3. Student Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-purple-500/10">
                    <div>
                      <label className="block text-xs font-bold text-purple-300 uppercase mb-2">Student Name (English)</label>
                      <input name="studentName" value={formData.studentName} onChange={handleInputChange} className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-300 uppercase mb-2">Date of Birth</label>
                      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-300 uppercase mb-2">Permanent Register No.</label>
                      <input name="registerNumber" value={formData.registerNumber} onChange={handleInputChange} className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-300 uppercase mb-2">Total Marks Obtained</label>
                      <input name="totalMarks" value={formData.totalMarks} onChange={handleInputChange} className="w-full bg-black/40 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none" placeholder="0589" />
                    </div>
                  </div>

                  {/* 4. AI Reference Documents */}
                  <div className="bg-blue-500/5 p-6 rounded-2xl border border-blue-500/10">
                    <h3 className="text-sm font-bold text-blue-300 uppercase mb-4 tracking-wider flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Ground-Truth Images (for AI Matching)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Candidate Photo</label>
                        <input type="file" accept="image/*" onChange={(e) => setFormData({...formData, studentPhoto: e.target.files[0]})} className="w-full text-[10px] text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-500/20 file:text-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Candidate Signature</label>
                        <input type="file" accept="image/*" onChange={(e) => setFormData({...formData, studentSignature: e.target.files[0]})} className="w-full text-[10px] text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-500/20 file:text-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secretary Signature</label>
                        <input type="file" accept="image/*" onChange={(e) => setFormData({...formData, secretarySignature: e.target.files[0]})} className="w-full text-[10px] text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-500/20 file:text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <input type="hidden" name="institutionId" value={formData.institutionId} />
                  
                  <button type="submit" disabled={loading} className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-[1.01] active:scale-[0.99] transition-all rounded-xl text-white font-bold text-lg shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3">
                    {loading ? <Loader className="animate-spin" /> : <><CheckCircle className="w-6 h-6" /> ISSUE CERTIFICATE TO VERI-CHAIN</>}
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className={`mt-8 bg-gray-800/50 backdrop-blur-sm border rounded-2xl p-6 ${
              uploadResult.success ? 'border-green-500/20' : 'border-red-500/20'
            }`}>
              <div className="flex items-start gap-4">
                {uploadResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <p className={uploadResult.success ? 'text-green-300' : 'text-red-300'}>
                    {uploadResult.message}
                  </p>
                  {uploadResult.certificateId && (
                    <p className="text-gray-300 text-sm mt-2">
                      Registry ID: <span className="text-purple-300 font-mono font-bold tracking-widest">{uploadResult.certificateId}</span>
                    </p>
                  )}
                  <p className="text-gray-400 text-xs mt-2 uppercase tracking-tighter">
                    Broadcasted: {uploadResult.timestamp}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
