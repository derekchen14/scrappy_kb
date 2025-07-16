import React, { useState, useEffect } from 'react';
import { Founder, FounderCreate, Skill, Startup } from '../types';
import { founderAPI, skillAPI, startupAPI } from '../api';

const FoundersList: React.FC = () => {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFounder, setEditingFounder] = useState<Founder | null>(null);
  const [formData, setFormData] = useState<FounderCreate>({
    name: '',
    email: '',
    bio: '',
    location: '',
    linkedin_url: '',
    twitter_url: '',
    github_url: '',
    skill_ids: [],
    startup_ids: []
  });

  useEffect(() => {
    fetchFounders();
    fetchSkills();
    fetchStartups();
  }, []);

  const fetchFounders = async () => {
    try {
      const response = await founderAPI.getAll();
      setFounders(response.data);
    } catch (error) {
      console.error('Error fetching founders:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await skillAPI.getAll();
      setSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

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
      if (editingFounder) {
        await founderAPI.update(editingFounder.id, formData);
      } else {
        await founderAPI.create(formData);
      }
      fetchFounders();
      resetForm();
    } catch (error) {
      console.error('Error saving founder:', error);
    }
  };

  const handleEdit = (founder: Founder) => {
    setEditingFounder(founder);
    setFormData({
      name: founder.name,
      email: founder.email,
      bio: founder.bio || '',
      location: founder.location || '',
      linkedin_url: founder.linkedin_url || '',
      twitter_url: founder.twitter_url || '',
      github_url: founder.github_url || '',
      skill_ids: founder.skills.map(skill => skill.id),
      startup_ids: founder.startups.map(startup => startup.id)
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this founder?')) {
      try {
        await founderAPI.delete(id);
        fetchFounders();
      } catch (error) {
        console.error('Error deleting founder:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      bio: '',
      location: '',
      linkedin_url: '',
      twitter_url: '',
      github_url: '',
      skill_ids: [],
      startup_ids: []
    });
    setEditingFounder(null);
    setShowForm(false);
  };

  const handleSkillToggle = (skillId: number) => {
    setFormData(prev => ({
      ...prev,
      skill_ids: prev.skill_ids?.includes(skillId)
        ? prev.skill_ids.filter(id => id !== skillId)
        : [...(prev.skill_ids || []), skillId]
    }));
  };

  const handleStartupToggle = (startupId: number) => {
    setFormData(prev => ({
      ...prev,
      startup_ids: prev.startup_ids?.includes(startupId)
        ? prev.startup_ids.filter(id => id !== startupId)
        : [...(prev.startup_ids || []), startupId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Founders</h2>
        <button 
          onClick={() => setShowForm(true)} 
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Add Founder
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">{editingFounder ? 'Edit Founder' : 'Add New Founder'}</h3>
            
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
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Twitter URL</label>
                <input
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => setFormData({...formData, twitter_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">GitHub URL</label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({...formData, github_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Skills</label>
                <div className="grid grid-cols-2 gap-2">
                  {skills.map(skill => (
                    <label key={skill.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.skill_ids?.includes(skill.id) || false}
                        onChange={() => handleSkillToggle(skill.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{skill.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Startups</label>
                <div className="grid grid-cols-2 gap-2">
                  {startups.map(startup => (
                    <label key={startup.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.startup_ids?.includes(startup.id) || false}
                        onChange={() => handleStartupToggle(startup.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{startup.name}</span>
                    </label>
                  ))}
                </div>
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
                  {editingFounder ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {founders.map(founder => (
          <div key={founder.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{founder.name}</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(founder)} 
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(founder.id)} 
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-2">{founder.email}</p>
            {founder.bio && <p className="text-gray-700 mb-3">{founder.bio}</p>}
            {founder.location && <p className="text-gray-500 mb-3 flex items-center">📍 {founder.location}</p>}
            
            <div className="flex space-x-4 mb-4">
              {founder.linkedin_url && (
                <a 
                  href={founder.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  LinkedIn
                </a>
              )}
              {founder.twitter_url && (
                <a 
                  href={founder.twitter_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Twitter
                </a>
              )}
              {founder.github_url && (
                <a 
                  href={founder.github_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  GitHub
                </a>
              )}
            </div>

            {founder.skills.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {founder.skills.map(skill => (
                    <span key={skill.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {founder.startups.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Startups:</h4>
                <div className="flex flex-wrap gap-2">
                  {founder.startups.map(startup => (
                    <span key={startup.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {startup.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoundersList;