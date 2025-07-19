import React, { useState, useEffect, useMemo } from 'react';
import { Founder, FounderCreate, Skill, Startup, Hobby } from '../types';
import { founderAPI, skillAPI, startupAPI, imageAPI, hobbyAPI } from '../api';
import Modal from './Modal';

type ViewType = 'table' | 'card' | 'compact';

interface FoundersListProps {
  searchQuery?: string;
}

const FoundersList: React.FC<FoundersListProps> = ({ searchQuery = '' }) => {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFounder, setEditingFounder] = useState<Founder | null>(null);
  const [viewType, setViewType] = useState<ViewType>('table');
  const [selectedFounder, setSelectedFounder] = useState<Founder | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<FounderCreate>({
    name: '',
    email: '',
    bio: '',
    location: '',
    linkedin_url: '',
    twitter_url: '',
    github_url: '',
    profile_image_url: '',
    profile_visible: true,
    skill_ids: [],
    startup_ids: [],
    hobby_ids: []
  });

  useEffect(() => {
    fetchFounders();
    fetchSkills();
    fetchStartups();
    fetchHobbies();
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

  const fetchHobbies = async () => {
    try {
      const response = await hobbyAPI.getAll();
      setHobbies(response.data);
    } catch (error) {
      console.error('Error fetching hobbies:', error);
    }
  };


  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;
    
    setUploadingImage(true);
    try {
      const response = await imageAPI.upload(selectedImage);
      return response.data.image_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalFormData = { ...formData };
      
      // Upload image if selected
      if (selectedImage) {
        const imageUrl = await uploadImage();
        if (imageUrl) {
          finalFormData.profile_image_url = imageUrl;
        }
      }
      
      if (editingFounder) {
        await founderAPI.update(editingFounder.id, finalFormData);
      } else {
        await founderAPI.create(finalFormData);
      }
      fetchFounders();
      resetForm();
    } catch (error) {
      console.error('Error saving founder:', error);
    }
  };

  const handleEdit = (founder: Founder) => {
    if (!isProfileVisible(founder)) {
      alert('This profile is marked as not visible and cannot be edited from this view.');
      return;
    }
    
    setEditingFounder(founder);
    setFormData({
      name: founder.name,
      email: founder.email,
      bio: founder.bio || '',
      location: founder.location || '',
      linkedin_url: founder.linkedin_url,
      twitter_url: founder.twitter_url || '',
      github_url: founder.github_url || '',
      profile_image_url: founder.profile_image_url || '',
      profile_visible: founder.profile_visible ?? true,
      skill_ids: founder.skills.map(skill => skill.id),
      startup_ids: founder.startups.map(startup => startup.id),
      hobby_ids: founder.hobbies.map(hobby => hobby.id)
    });
    setImagePreview(founder.profile_image_url || null);
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
      profile_image_url: '',
      profile_visible: true,
      skill_ids: [],
      startup_ids: [],
      hobby_ids: []
    });
    setEditingFounder(null);
    setShowForm(false);
    setSelectedImage(null);
    setImagePreview(null);
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

  const handleHobbyToggle = (hobbyId: number) => {
    setFormData(prev => ({
      ...prev,
      hobby_ids: prev.hobby_ids?.includes(hobbyId)
        ? prev.hobby_ids.filter(id => id !== hobbyId)
        : [...(prev.hobby_ids || []), hobbyId]
    }));
  };

  const truncateDescription = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getFounderIndustries = (founder: Founder): string[] => {
    return founder.startups.map(startup => startup.industry).filter(Boolean) as string[];
  };

  const isProfileVisible = (founder: Founder): boolean => {
    return founder.profile_visible ?? true;
  };

  const filteredFounders = useMemo(() => {
    if (!searchQuery.trim()) {
      return founders;
    }
    
    const query = searchQuery.toLowerCase();
    return founders.filter(founder => {
      const matchesName = founder.name.toLowerCase().includes(query);
      const matchesEmail = founder.email.toLowerCase().includes(query);
      const matchesBio = founder.bio?.toLowerCase().includes(query);
      const matchesLocation = founder.location?.toLowerCase().includes(query);
      const matchesSkills = founder.skills.some(skill => 
        skill.name.toLowerCase().includes(query) || 
        skill.category?.toLowerCase().includes(query)
      );
      const matchesStartups = founder.startups.some(startup => 
        startup.name.toLowerCase().includes(query) || 
        startup.industry?.toLowerCase().includes(query) ||
        startup.description?.toLowerCase().includes(query)
      );
      const matchesHobbies = founder.hobbies.some(hobby => 
        hobby.name.toLowerCase().includes(query) || 
        hobby.category?.toLowerCase().includes(query)
      );
      
      return matchesName || matchesEmail || matchesBio || matchesLocation || matchesSkills || matchesStartups || matchesHobbies;
    });
  }, [founders, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h2 className="text-3xl font-bold text-gray-900">Founders</h2>
          
          {/* View Switcher */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewType('table')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewType === 'table' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewType('card')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewType === 'card' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Card
            </button>
            <button
              onClick={() => setViewType('compact')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewType === 'compact' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Compact
            </button>
          </div>
        </div>
        
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
                <label className="block text-sm font-medium text-gray-700">LinkedIn URL *</label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                  required
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
                <label className="block text-sm font-medium text-gray-700">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-20 h-20 object-cover rounded-full border-2 border-gray-300"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.profile_visible}
                    onChange={(e) => setFormData({...formData, profile_visible: e.target.checked})}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Profile Visible</span>
                </label>
                <p className="text-xs text-gray-500">When unchecked, only name and bio will be visible to others</p>
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Hobbies</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {hobbies.map(hobby => (
                    <label key={hobby.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.hobby_ids?.includes(hobby.id) || false}
                        onChange={() => handleHobbyToggle(hobby.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{hobby.name}</span>
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
                  disabled={uploadingImage}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                >
                  {uploadingImage ? 'Uploading...' : (editingFounder ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewType === 'table' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Startups
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFounders.map(founder => (
                  <tr key={founder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{founder.name}</div>
                      {founder.bio && (
                        <div className="text-sm text-gray-500">{truncateDescription(founder.bio, 50)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {founder.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {founder.location || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {founder.skills.slice(0, 2).map(skill => (
                          <span key={skill.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {skill.name}
                          </span>
                        ))}
                        {founder.skills.length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{founder.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {founder.startups.slice(0, 2).map(startup => (
                          <span key={startup.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {startup.name}
                          </span>
                        ))}
                        {founder.startups.length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{founder.startups.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(founder)} 
                          className="px-2 py-1 bg-sky-400 hover:bg-sky-700 text-white text-xs rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(founder.id)} 
                          className="px-2 py-1 bg-rose-400 hover:bg-rose-700 text-white text-xs rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card View */}
      {viewType === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFounders.map(founder => (
            <div key={founder.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-4">
                  {founder.profile_image_url && (
                    <img 
                      src={`http://localhost:8000${founder.profile_image_url}`}
                      alt={founder.name}
                      className="w-16 h-16 object-cover rounded-full border-2 border-gray-300"
                    />
                  )}
                  <h3 className="text-xl font-semibold text-gray-900">{founder.name}</h3>
                </div>
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

              {founder.hobbies.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Hobbies:</h4>
                  <div className="flex flex-wrap gap-2">
                    {founder.hobbies.map(hobby => (
                      <span key={hobby.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {hobby.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Compact View */}
      {viewType === 'compact' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {filteredFounders.map(founder => (
            <div key={founder.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (!isProfileVisible(founder)) {
                      alert('This profile is marked as not visible and details cannot be viewed.');
                      return;
                    }
                    setSelectedFounder(founder);
                  }}
                  className="text-left w-full"
                >
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                      {founder.name}
                    </h3>
                    {getFounderIndustries(founder).slice(0, 2).map((industry, index) => (
                      <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {industry}
                      </span>
                    ))}
                  </div>
                </button>
                
                {founder.bio && (
                  <p className="text-xs text-gray-600">
                    {truncateDescription(founder.bio, 80)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Founder Details Modal */}
      <Modal
        isOpen={selectedFounder !== null}
        onClose={() => setSelectedFounder(null)}
        title={selectedFounder?.name || ''}
      >
        {selectedFounder && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedFounder.name}</h3>
              <p className="text-gray-600 mb-4">{selectedFounder.email}</p>
              
              {selectedFounder.bio && (
                <p className="text-gray-700 mb-4">{selectedFounder.bio}</p>
              )}
              
              {selectedFounder.location && (
                <p className="text-gray-500 mb-4">📍 {selectedFounder.location}</p>
              )}
              
              <div className="flex space-x-4 mb-4">
                {selectedFounder.linkedin_url && (
                  <a 
                    href={selectedFounder.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    LinkedIn
                  </a>
                )}
                {selectedFounder.twitter_url && (
                  <a 
                    href={selectedFounder.twitter_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Twitter
                  </a>
                )}
                {selectedFounder.github_url && (
                  <a 
                    href={selectedFounder.github_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    GitHub
                  </a>
                )}
              </div>

              {selectedFounder.skills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFounder.skills.map(skill => (
                      <span key={skill.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedFounder.startups.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Startups:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFounder.startups.map(startup => (
                      <span key={startup.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {startup.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedFounder.hobbies.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Hobbies:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFounder.hobbies.map(hobby => (
                      <span key={hobby.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {hobby.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedFounder(null);
                  handleEdit(selectedFounder);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setSelectedFounder(null);
                  handleDelete(selectedFounder.id);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FoundersList;