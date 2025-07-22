import React, { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';
import { Founder, Startup, HelpRequest } from '../types';

interface AdminStats {
  totalUsers: number;
  totalStartups: number;
  totalHelpRequests: number;
  visibleProfiles: number;
  hiddenProfiles: number;
}

interface AdminDashboardProps {
  onNavigateToTab?: (tab: 'founders' | 'startups' | 'help-requests' | 'events' | 'admin') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToTab }) => {
  const { publicAPI, authenticatedAPI } = useAuthenticatedAPI();
  const { isAdmin, userEmail } = useAdmin();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalStartups: 0,
    totalHelpRequests: 0,
    visibleProfiles: 0,
    hiddenProfiles: 0
  });
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [foundersRes, startupsRes, helpRequestsRes] = await Promise.all([
        publicAPI.get<Founder[]>('/founders/'),
        publicAPI.get<Startup[]>('/startups/'),
        publicAPI.get<HelpRequest[]>('/help-requests/')
      ]);

      const foundersData = foundersRes.data;
      const startupsData = startupsRes.data;
      const helpRequestsData = helpRequestsRes.data;

      // Calculate statistics
      const visibleCount = foundersData.filter(f => f.profile_visible !== false).length;
      const hiddenCount = foundersData.filter(f => f.profile_visible === false).length;

      setFounders(foundersData);
      setStats({
        totalUsers: foundersData.length,
        totalStartups: startupsData.length,
        totalHelpRequests: helpRequestsData.length,
        visibleProfiles: visibleCount,
        hiddenProfiles: hiddenCount
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  }, [publicAPI]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, fetchAdminData]);

  const toggleProfileVisibility = async (founderId: number, currentVisibility: boolean) => {
    try {
      const founder = founders.find(f => f.id === founderId);
      if (!founder) return;

      await authenticatedAPI.put(`/founders/${founderId}`, {
        ...founder,
        profile_visible: !currentVisibility
      });
      
      // Refresh data
      fetchAdminData();
    } catch (error) {
      console.error('Error toggling profile visibility:', error);
    }
  };

  const deleteUser = async (founderId: number) => {
    const founder = founders.find(f => f.id === founderId);
    if (!founder) return;

    if (window.confirm(`Are you sure you want to delete ${founder.name}? This action cannot be undone.`)) {
      try {
        await authenticatedAPI.delete(`/founders/${founderId}`);
        fetchAdminData();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600">You don't have admin privileges.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome, {userEmail}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
          <div className="text-sm font-medium text-gray-700">Total Users</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.totalStartups}</div>
          <div className="text-sm font-medium text-gray-700">Total Startups</div>
        </div>
        
        <div 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateToTab?.('help-requests')}
        >
          <div className="text-3xl font-bold text-purple-600">{stats.totalHelpRequests}</div>
          <div className="text-sm font-medium text-gray-700">Total Help Requests</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-emerald-600">{stats.visibleProfiles}</div>
          <div className="text-sm font-medium text-gray-700">Visible Profiles</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.hiddenProfiles}</div>
          <div className="text-sm font-medium text-gray-700">Hidden Profiles</div>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user profiles and visibility</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profile Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {founders.map(founder => (
                <tr key={founder.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{founder.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {founder.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      founder.profile_visible !== false 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {founder.profile_visible !== false ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => toggleProfileVisibility(founder.id, founder.profile_visible !== false)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        founder.profile_visible !== false
                          ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {founder.profile_visible !== false ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => deleteUser(founder.id)}
                      className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;