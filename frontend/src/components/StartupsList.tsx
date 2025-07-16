import React, { useState, useEffect } from 'react';
import { Startup, StartupCreate } from '../types';
import { startupAPI } from '../api';

const StartupsList: React.FC = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStartup, setEditingStartup] = useState<Startup | null>(null);
  const [formData, setFormData] = useState<StartupCreate>({
    name: '',
    description: '',
    industry: '',
    stage: '',
    website_url: '',
    team_size: undefined,
    location: ''
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
      team_size: startup.team_size || undefined,
      location: startup.location || ''
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
      team_size: undefined,
      location: ''
    });
    setEditingStartup(null);
    setShowForm(false);
  };

  const startupStages = ['Idea', 'MVP', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'IPO'];
  const industries = ['Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Entertainment', 'SaaS', 'Other'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Startups</h2>
        <button 
          onClick={() => setShowForm(true)} 
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Industry</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Team Size</label>
                <input
                  type="number"
                  min="1"
                  value={formData.team_size || ''}
                  onChange={(e) => setFormData({...formData, team_size: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
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
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors"
                >
                  {editingStartup ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {startups.map(startup => (
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
              
              {startup.team_size && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Team Size:</span>
                  <span className="text-sm text-gray-600">{startup.team_size}</span>
                </div>
              )}
              
              {startup.location && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Location:</span>
                  <span className="text-sm text-gray-600">📍 {startup.location}</span>
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
            
            <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200">
              Created: {new Date(startup.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StartupsList;