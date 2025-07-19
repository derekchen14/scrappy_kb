import React, { useState, useEffect, useMemo } from 'react';
import { Startup, StartupCreate } from '../types';
import { startupAPI } from '../api';

interface StartupsListProps {
  searchQuery?: string;
}

const StartupsList: React.FC<StartupsListProps> = ({ searchQuery = '' }) => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStartup, setEditingStartup] = useState<Startup | null>(null);
  const [formData, setFormData] = useState<StartupCreate>({
    name: '',
    description: '',
    industry: '',
    stage: '',
    website_url: '',
    target_market: '',
    revenue_arr: ''
  });

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    try {
      const response = await startupAPI.getAll();
      setStartups(response.data);
    } catch (error) {
      console.error('Error fetching startups:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStartup) {
        await startupAPI.update(editingStartup.id, formData);
      } else {
        await startupAPI.create(formData);
      }
      fetchStartups();
      resetForm();
    } catch (error) {
      console.error('Error saving startup:', error);
    }
  };

  const handleEdit = (startup: Startup) => {
    setEditingStartup(startup);
    setFormData({
      name: startup.name,
      description: startup.description || '',
      industry: startup.industry || '',
      stage: startup.stage || '',
      website_url: startup.website_url || '',
      target_market: startup.target_market || '',
      revenue_arr: startup.revenue_arr || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this startup?')) {
      try {
        await startupAPI.delete(id);
        fetchStartups();
      } catch (error) {
        console.error('Error deleting startup:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      industry: '',
      stage: '',
      website_url: '',
      target_market: '',
      revenue_arr: ''
    });
    setEditingStartup(null);
    setShowForm(false);
  };

  const startupStages = [
    'Ideation',
    'Validation',
    'MVP',
    'Design Partners (pre-revenue)',
    'Customers (post-revenue)',
    'Pre-seed',
    'Seed',
    'Series A',
    'Series B or later',
    'Scaling'
  ];

  const industries = [
    'AI/ML/Deep Learning',
    'Deeptech',
    'DevTools',
    'Infrastructure / Cloud',
    'Agents',
    'Fintech',
    'Healthtech',
    'Biotech',
    'Edtech',
    'Martech',
    'Salestech',
    'Legaltech',
    'Insurtech',
    'Proptech',
    'Foodtech',
    'Industrialtech',
    'Ecommerce / Marketplaces',
    'Consumer',
    'Gaming',
    'Robotics',
    'Hardware / Devices',
    'Wearables',
    'Climate / Energy',
    'Mobility / Transportation',
    'Aerospace',
    'Social / Community',
    'Web3 / Crypto',
    'Security / Privacy'
  ];

  const targetMarkets = [
    'Consumers / D2C',
    'SMBs',
    'Mid-Market',
    'Enterprises',
    'Developers / Engineers',
    'Startups',
    'Public Sector / Government',
    'Healthcare Providers',
    'Educational Institutions',
    'Nonprofits',
    'Marketplaces / Platforms',
    'Internal / In-house Teams'
  ];

  const revenueOptions = [
    'Pre-revenue',
    '$1-10K',
    '$10-25K',
    '$25-50K',
    '$50-150K',
    '$150-500K',
    '$500-1M',
    '$1M+'
  ];

  const filteredStartups = useMemo(() => {
    if (!searchQuery.trim()) {
      return startups;
    }
    
    const query = searchQuery.toLowerCase();
    return startups.filter(startup => {
      const matchesName = startup.name.toLowerCase().includes(query);
      const matchesDescription = startup.description?.toLowerCase().includes(query);
      const matchesIndustry = startup.industry?.toLowerCase().includes(query);
      const matchesStage = startup.stage?.toLowerCase().includes(query);
      const matchesTargetMarket = startup.target_market?.toLowerCase().includes(query);
      const matchesRevenue = startup.revenue_arr?.toLowerCase().includes(query);
      
      return matchesName || matchesDescription || matchesIndustry || matchesStage || matchesTargetMarket || matchesRevenue;
    });
  }, [startups, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Startups</h2>
        <button 
          onClick={() => setShowForm(true)} 
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Add Startup
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">{editingStartup ? 'Edit Startup' : 'Add New Startup'}</h3>
            
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Industry</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select an industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({...formData, stage: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a stage</option>
                  {startupStages.map(stage => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Website URL</label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Target Market</label>
                <select
                  value={formData.target_market}
                  onChange={(e) => setFormData({...formData, target_market: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a target market</option>
                  {targetMarkets.map(market => (
                    <option key={market} value={market}>
                      {market}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Revenue ARR</label>
                <select
                  value={formData.revenue_arr}
                  onChange={(e) => setFormData({...formData, revenue_arr: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select revenue range</option>
                  {revenueOptions.map(revenue => (
                    <option key={revenue} value={revenue}>
                      {revenue}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                >
                  {editingStartup ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStartups.map(startup => (
          <div key={startup.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{startup.name}</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(startup)} 
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(startup.id)} 
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            
            {startup.description && (
              <p className="text-gray-700 mb-4">{startup.description}</p>
            )}
            
            <div className="space-y-3">
              {startup.industry && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Industry:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {startup.industry}
                  </span>
                </div>
              )}
              
              {startup.stage && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Stage:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {startup.stage}
                  </span>
                </div>
              )}
              
              {startup.target_market && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Target Market:</span>
                  <span className="text-sm text-gray-600">🎯 {startup.target_market}</span>
                </div>
              )}
              
              {startup.revenue_arr && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Revenue ARR:</span>
                  <span className="text-sm text-gray-600">💰 {startup.revenue_arr}</span>
                </div>
              )}
              
              {startup.website_url && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Website:</span>
                  <a 
                    href={startup.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {startup.website_url}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StartupsList;