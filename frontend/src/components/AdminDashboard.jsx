import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader, Users, FileCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsResponse, logsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/admin/activities`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 20 }
        })
      ]);

      setStats(statsResponse.data.data);
      setLogs(logsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black">
        <div className="flex items-center gap-3 text-white">
          <Loader className="w-8 h-8 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const certificateData = stats?.certificates || {};
  const verificationData = {
    found: stats?.foundVerifications || 0,
    notFound: stats?.notFoundVerifications || 0,
    total: stats?.totalVerifications || 0,
    recentVerifications: stats?.recentVerifications || 0,
    successRate: stats?.successRate || 0
  };

  const chartData = [
    { name: 'Active', value: certificateData.active || 0, fill: '#10b981' },
    { name: 'Revoked', value: certificateData.revoked || 0, fill: '#ef4444' }
  ];

  const verificationChartData = [
    { name: 'Found', value: verificationData.found || 0, fill: '#3b82f6' },
    { name: 'Not Found', value: verificationData.notFound || 0, fill: '#f59e0b' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-purple-200">System Overview & Statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Certificates */}
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm mb-2">Total Certificates</p>
                <p className="text-3xl font-bold text-white">{certificateData.total || 0}</p>
              </div>
              <FileCheck className="w-12 h-12 text-blue-400 opacity-50" />
            </div>
          </div>

          {/* Active Certificates */}
          <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm mb-2">Active</p>
                <p className="text-3xl font-bold text-white">{certificateData.active || 0}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-400 opacity-50" />
            </div>
          </div>

          {/* Revoked Certificates */}
          <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-200 text-sm mb-2">Revoked</p>
                <p className="text-3xl font-bold text-white">{certificateData.revoked || 0}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-400 opacity-50" />
            </div>
          </div>

          {/* Verifications */}
          <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm mb-2">Verifications</p>
                <p className="text-3xl font-bold text-white">{verificationData.total || 0}</p>
              </div>
              <Users className="w-12 h-12 text-purple-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Certificate Status Distribution */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-6">Certificate Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Verification Results */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-6">Verification Results</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={verificationChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.1)" />
                <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.5)" />
                <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(55, 65, 81, 0.9)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [value, 'Count']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <p className="text-gray-300 text-sm mb-2">Recent Verifications (7 days)</p>
            <p className="text-2xl font-bold text-blue-400">{verificationData.recentVerifications || 0}</p>
            <p className="text-gray-400 text-xs mt-2">Last week's activity</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <p className="text-gray-300 text-sm mb-2">Verification Success Rate</p>
            <p className="text-2xl font-bold text-green-400">
              {stats?.verificationRate || '0'}%
            </p>
            <p className="text-gray-400 text-xs mt-2">Of all verifications</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <p className="text-gray-300 text-sm mb-2">Suspicious/Fraudulent</p>
            <p className="text-2xl font-bold text-red-400">
              {verificationData.notFound || 0}
            </p>
            <p className="text-gray-400 text-xs mt-2">Not found in database</p>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-6">Recent Verification Activities</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-500/20">
                  <th className="text-left py-3 px-4 text-purple-300">Activity</th>
                  <th className="text-left py-3 px-4 text-purple-300">Query</th>
                  <th className="text-left py-3 px-4 text-purple-300">Result</th>
                  <th className="text-left py-3 px-4 text-purple-300">Verified By</th>
                  <th className="text-left py-3 px-4 text-purple-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => {
                    const userName = log.verifiedBy?.name || log.verifierOrganisation || 'Public';
                    return (
                      <tr key={log._id} className="border-b border-purple-500/10 hover:bg-gray-700/30 transition-colors">
                        <td className="py-3 px-4 text-gray-300 capitalize">{log.queryType || 'lookup'}</td>
                        <td className="py-3 px-4 text-gray-300">{log.queryValue}</td>
                        <td className="py-3 px-4 text-gray-300">{log.result}</td>
                        <td className="py-3 px-4 text-gray-300">{userName}</td>
                        <td className="py-3 px-4 text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-gray-400">
                      No recent activity logs available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
