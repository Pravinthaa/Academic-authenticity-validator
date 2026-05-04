import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function CertificateUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    rollNumber: '',
    course: '',
    graduationYear: new Date().getFullYear(),
    grade: '',
    institutionId: ''
  });
  const [uploadResult, setUploadResult] = useState(null);
  const token = useAuthStore(state => state.token);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type and size
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Only PDF and image files (JPEG, PNG) are allowed');
        return;
      }

      if (selectedFile.size > maxSize) {
        toast.error('File size cannot exceed 10MB');
        return;
      }

      setFile(selectedFile);
      toast.success('File selected successfully');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a certificate file');
      return;
    }

    if (!formData.studentName || !formData.rollNumber || !formData.institutionId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('certificate', file);
      data.append('studentName', formData.studentName);
      data.append('rollNumber', formData.rollNumber);
      data.append('course', formData.course);
      data.append('graduationYear', formData.graduationYear);
      data.append('grade', formData.grade);
      data.append('institutionId', formData.institutionId);

      const response = await axios.post(
        'http://localhost:5000/api/certificates/upload',
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
        certificateId: response.data.certificateId,
        message: response.data.message,
        timestamp: new Date().toLocaleString()
      });

      // Reset form
      setFile(null);
      setFormData({
        studentName: '',
        rollNumber: '',
        course: '',
        graduationYear: new Date().getFullYear(),
        grade: '',
        institutionId: ''
      });

      toast.success('Certificate uploaded successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to upload certificate';
      toast.error(errorMessage);
      setUploadResult({
        success: false,
        message: errorMessage,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Certificate Upload</h1>
          <p className="text-purple-200">Upload academic certificates for verification</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Upload Form */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Certificate File *
                </label>
                <div className="relative border-2 border-dashed border-purple-500/40 rounded-lg p-8 hover:border-purple-500/60 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="certificate-file"
                  />
                  <label htmlFor="certificate-file" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-12 h-12 text-purple-400 mb-2" />
                    <span className="text-white font-medium">
                      {file ? file.name : 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-purple-300 text-sm mt-1">
                      PDF, JPEG, or PNG (max 10MB)
                    </span>
                  </label>
                </div>
              </div>

              {/* Student Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Student Name *
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className="w-full bg-gray-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Roll Number */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Roll/Registration Number *
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  placeholder="Enter roll number"
                  className="w-full bg-gray-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Course */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Course Name
                </label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  placeholder="e.g., Bachelor of Technology (B.Tech)"
                  className="w-full bg-gray-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Graduation Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full bg-gray-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Grade */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Grade/CGPA
                  </label>
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    placeholder="e.g., A+ or 3.8"
                    className="w-full bg-gray-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Institution ID */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Institution ID *
                </label>
                <input
                  type="text"
                  name="institutionId"
                  value={formData.institutionId}
                  onChange={handleInputChange}
                  placeholder="Institution MongoDB ID"
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
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Certificate
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className={`bg-gray-800/50 backdrop-blur-sm border rounded-2xl p-6 ${
              uploadResult.success
                ? 'border-green-500/20'
                : 'border-red-500/20'
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
                      Certificate ID: <span className="text-purple-300 font-mono">{uploadResult.certificateId}</span>
                    </p>
                  )}
                  <p className="text-gray-400 text-xs mt-2">
                    {uploadResult.timestamp}
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
