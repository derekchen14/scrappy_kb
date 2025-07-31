import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Founder, FounderCreate, Skill, Startup, Hobby } from '../types';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';
import Modal from './Modal';

type ViewType = 'table' | 'card' | 'compact';
type SortType = 'none' | 'asc' | 'desc';

interface FoundersListProps {
  onStartupClick?: (startup: Startup) => void;
  founderToShow?: Founder | null;
  onFounderShown?: () => void;
  editFounderToShow?: Founder | null;
  onEditFounderShown?: () => void;
}

const FoundersList: React.FC<FoundersListProps> = ({ onStartupClick, founderToShow, onFounderShown, editFounderToShow, onEditFounderShown }) => {
  const { authenticatedAPI, publicAPI } = useAuthenticatedAPI();
  const { isAdmin, canEditProfile, canDeleteUser } = useAdmin();

  // Helper function to handle image URLs (both relative and absolute)
  // const getImageUrl = (imageUrl: string) => {
  //   if (!imageUrl) return '';
  //   if (imageUrl.startsWith('http')) {
  //     return imageUrl; // Already a complete URL
  //   }
  //   return `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}${imageUrl}`;
  // };
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('none');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
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
    auth0_user_id: undefined,
    skill_ids: [],
    startup_id: undefined,
    hobby_ids: []
  });

  useEffect(() => {
    fetchFounders();
    fetchSkills();
    fetchStartups();
    fetchHobbies();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (founderToShow) {
      setSelectedFounder(founderToShow);
      if (onFounderShown) {
        onFounderShown();
      }
    }
  }, [founderToShow, onFounderShown]);


  const fetchFounders = async () => {
    try {
      const response = await publicAPI.get<Founder[]>('/founders/');
      setFounders(response.data);
    } catch (error) {
      console.error('Error fetching founders:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await publicAPI.get<Skill[]>('/skills/');
      setSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const fetchStartups = async () => {
    try {
      const response = await publicAPI.get<Startup[]>('/startups/');
      setStartups(response.data);
    } catch (error) {
      console.error('Error fetching startups:', error);
    }
  };

  const fetchHobbies = async () => {
    try {
      const response = await publicAPI.get<Hobby[]>('/hobbies/');
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
      const formData = new FormData();
      formData.append('file', selectedImage);
      
      const response = await authenticatedAPI.post('/upload-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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
        await authenticatedAPI.put(`/founders/${editingFounder.id}`, finalFormData);
      } else {
        await authenticatedAPI.post('/founders/', finalFormData);
      }
      fetchFounders();
      resetForm();
    } catch (error: any) {
      console.error('Error saving founder:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        alert(`Error saving profile: ${error.response.data?.message || error.response.data?.detail || 'Server error'}. Please try again.`);
      } else if (error.request) {
        console.error('Request made but no response:', error.request);
        alert('Error saving profile: Unable to connect to server. This may be a CORS or network issue. Please try again.');
      } else {
        console.error('Error setting up request:', error.message);
        alert(`Error saving profile: ${error.message}. Please try again.`);
      }
    }
  };

  const handleEdit = useCallback((founder: Founder, skipVisibilityCheck = false) => {
    if (!canEditProfile(founder.email)) {
      alert('You can only edit your own profile.');
      return;
    }
    
    if (!skipVisibilityCheck && !isProfileVisible(founder)) {
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
      auth0_user_id: founder.auth0_user_id,
      skill_ids: founder.skills.map(skill => skill.id),
      startup_id: founder.startup?.id,
      hobby_ids: founder.hobbies.map(hobby => hobby.id)
    });
    setImagePreview(founder.profile_image_url || null);
    setShowForm(true);
  }, [canEditProfile, isProfileVisible]);

  const handleDelete = async (id: number) => {
    if (!canDeleteUser()) {
      alert('You do not have permission to delete users.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this founder?')) {
      try {
        await authenticatedAPI.delete(`/founders/${id}`);
        fetchFounders();
      } catch (error) {
        console.error('Error deleting founder:', error);
      }
    }
  };

  // Handle edit founder from external trigger (e.g., Profile dropdown)
  useEffect(() => {
    if (editFounderToShow) {
      handleEdit(editFounderToShow, true); // Skip visibility check for own profile
      if (onEditFounderShown) {
        onEditFounderShown();
      }
    }
  }, [editFounderToShow, onEditFounderShown, handleEdit]);

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
      auth0_user_id: undefined,
      skill_ids: [],
      startup_id: undefined,
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

  const handleStartupChange = (startupId: number | undefined) => {
    setFormData(prev => ({
      ...prev,
      startup_id: startupId
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

  const getFounderIndustry = (founder: Founder): string | undefined => {
    return founder.startup?.industry;
  };

  const isProfileVisible = (founder: Founder): boolean => {
    return founder.profile_visible ?? true;
  };

  const handleNameSort = () => {
    if (sortType === 'none') {
      setSortType('asc');
    } else if (sortType === 'asc') {
      setSortType('desc');
    } else {
      setSortType('none');
    }
  };

  const getSortIcon = () => {
    if (sortType === 'asc') {
      return '▲';
    } else if (sortType === 'desc') {
      return '▼';
    } else {
      return '';
    }
  };

  const handleStartupClick = (startup: Startup) => {
    if (onStartupClick) {
      setSelectedFounder(null); // Close founder modal
      onStartupClick(startup); // Navigate to startup tab and show startup modal
    } else {
      setSelectedStartup(startup); // Fallback to local modal
    }
  };

  const filteredFounders = useMemo(() => {
    // First filter by search query
    let result = founders;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = founders.filter(founder => {
        const matchesName = founder.name.toLowerCase().includes(query);
        const matchesEmail = founder.email.toLowerCase().includes(query);
        const matchesBio = founder.bio?.toLowerCase().includes(query);
        const matchesLocation = founder.location?.toLowerCase().includes(query);
        const matchesSkills = founder.skills.some(skill => 
          skill.name.toLowerCase().includes(query) || 
          skill.category?.toLowerCase().includes(query)
        );
        const matchesStartup = founder.startup && (
          founder.startup.name.toLowerCase().includes(query) || 
          founder.startup.industry?.toLowerCase().includes(query) ||
          founder.startup.description?.toLowerCase().includes(query)
        );
        const matchesHobbies = founder.hobbies.some(hobby => 
          hobby.name.toLowerCase().includes(query) || 
          hobby.category?.toLowerCase().includes(query)
        );
        
        return matchesName || matchesEmail || matchesBio || matchesLocation || matchesSkills || matchesStartup || matchesHobbies;
      });
    }

    // Then sort by name if requested
    if (sortType === 'asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === 'desc') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [founders, searchQuery, sortType]);

  const paginatedFounders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredFounders.slice(startIndex, endIndex);
  }, [filteredFounders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredFounders.length / itemsPerPage);

  // Reset to page 1 when search query or sort type changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortType]);

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
        
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search founder profiles ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 px-4 py-2 pl-10 pr-4 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => setShowForm(true)} 
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Add Founder
            </button>
          )}
        </div>
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
                  disabled={!isAdmin}
                  required
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    !isAdmin ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
                {!isAdmin && (
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                )}
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
                  onFocus={(e) => {
                    if (!e.target.value) {
                      setFormData({...formData, linkedin_url: 'https://www.linkedin.com/in/'});
                    }
                  }}
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
                  onFocus={(e) => {
                    if (!e.target.value) {
                      setFormData({...formData, twitter_url: 'https://www.twitter.com/'});
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">GitHub URL</label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({...formData, github_url: e.target.value})}
                  onFocus={(e) => {
                    if (!e.target.value) {
                      setFormData({...formData, github_url: 'https://www.github.com/'});
                    }
                  }}
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
                <label className="block text-sm font-medium text-gray-700">Startup</label>
                <select
                  value={formData.startup_id || ''}
                  onChange={(e) => handleStartupChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">No startup</option>
                  {startups.map(startup => (
                    <option key={startup.id} value={startup.id}>
                      {startup.name}
                    </option>
                  ))}
                </select>
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
                    <button
                      onClick={handleNameSort}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>NAME</span>
                      <span className="text-xs">{getSortIcon()}</span>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  {!isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Startup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hobbies
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedFounders.map((founder, index) => (
                  <tr key={founder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {/* {founder.profile_image_url && (
                          <img
                            src={getImageUrl(founder.profile_image_url)}
                            alt={founder.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )} */}
                        <div>
                          <button
                            onClick={() => {
                              if (!isProfileVisible(founder)) {
                                alert('This profile is marked as not visible and details cannot be viewed.');
                                return;
                              }
                              setSelectedFounder(founder);
                            }}
                            className="text-left"
                          >
                            <div className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                              {founder.name}
                            </div>
                          </button>
                          {isProfileVisible(founder) && founder.linkedin_url && (
                            <div className="text-sm">
                              <a 
                                href={founder.linkedin_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-blue-600 hover:underline transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {founder.linkedin_url}
                              </a>
                            </div>
                          )}
                          {!isProfileVisible(founder) && (
                            <div className="text-sm text-gray-400">
                              (profile hidden)
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {isProfileVisible(founder) ? founder.email : ""}
                    </td>
                    {!isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {founder.location || '-'}
                      </td>
                    )}
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
                        {founder.startup && (
                          <button
                            onClick={() => handleStartupClick(founder.startup!)}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-pointer"
                          >
                            {founder.startup.name}
                          </button>
                        )}
                        {!founder.startup && (
                          <span className="text-xs text-gray-500">No startup</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {founder.hobbies.slice(0, 3).map(hobby => (
                          <span key={hobby.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {hobby.name}
                          </span>
                        ))}
                        {founder.hobbies.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{founder.hobbies.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {canEditProfile(founder.email) && (
                          <button 
                            onClick={() => handleEdit(founder)} 
                            className="px-2 py-1 bg-sky-400 hover:bg-sky-700 text-white text-xs rounded transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {canDeleteUser() && (
                          <button 
                            onClick={() => handleDelete(founder.id)} 
                            className="px-2 py-1 bg-rose-400 hover:bg-rose-700 text-white text-xs rounded transition-colors"
                          >
                            Delete
                          </button>
                        )}
                        {!canEditProfile(founder.email) && !canDeleteUser() && (
                          <span className="text-xs text-gray-500">No actions available</span>
                        )}
                      </div>
                      </td>
                    )}
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
          {paginatedFounders.map(founder => (
            <div key={founder.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-4">
                  {/* {founder.profile_image_url && (
                    <img 
                      src={getImageUrl(founder.profile_image_url)}
                      alt={founder.name}
                      className="w-16 h-16 object-cover rounded-full border-2 border-gray-300"
                    />
                  )} */}
                  <h3 className="text-xl font-semibold text-gray-900">{founder.name}</h3>
                </div>
                <div className="flex space-x-2">
                  {canEditProfile(founder.email) && (
                    <button 
                      onClick={() => handleEdit(founder)} 
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  {canDeleteUser() && (
                    <button 
                      onClick={() => handleDelete(founder.id)} 
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              
              {isProfileVisible(founder) && (
                <p className="text-gray-600 mb-2">{founder.email}</p>
              )}
              {founder.bio && <p className="text-gray-700 mb-3">{founder.bio}</p>}
              {founder.location && <p className="text-gray-500 mb-3 flex items-center">📍 {founder.location}</p>}
              
              <div className="flex space-x-4 mb-4">
                {isProfileVisible(founder) && founder.linkedin_url && (
                  <a 
                    href={founder.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    LinkedIn
                  </a>
                )}
                {isProfileVisible(founder) && founder.twitter_url && (
                  <a 
                    href={founder.twitter_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Twitter
                  </a>
                )}
                {isProfileVisible(founder) && founder.github_url && (
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

              {founder.startup && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Startup:</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStartupClick(founder.startup!)}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-pointer"
                    >
                      {founder.startup.name}
                    </button>
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
          {paginatedFounders.map(founder => (
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
                    {getFounderIndustry(founder) && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {getFounderIndustry(founder)}
                      </span>
                    )}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredFounders.length)}
                </span>{' '}
                of <span className="font-medium">{filteredFounders.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === i + 1
                        ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
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
              <div className="flex items-center space-x-4 mb-4">
                {/* {selectedFounder.profile_image_url && (
                  <img
                    src={getImageUrl(selectedFounder.profile_image_url)}
                    alt={selectedFounder.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                  />
                )} */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedFounder.name}</h3>
                  {isProfileVisible(selectedFounder) && (
                    <p className="text-gray-600">{selectedFounder.email}</p>
                  )}
                </div>
              </div>
              
              {selectedFounder.bio && (
                <p className="text-gray-700 mb-4">{selectedFounder.bio}</p>
              )}
              
              {selectedFounder.location && (
                <p className="text-gray-500 mb-4">📍 {selectedFounder.location}</p>
              )}
              
              <div className="flex space-x-4 mb-4">
                {isProfileVisible(selectedFounder) && selectedFounder.linkedin_url && (
                  <a 
                    href={selectedFounder.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    LinkedIn
                  </a>
                )}
                {isProfileVisible(selectedFounder) && selectedFounder.twitter_url && (
                  <a 
                    href={selectedFounder.twitter_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Twitter
                  </a>
                )}
                {isProfileVisible(selectedFounder) && selectedFounder.github_url && (
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

              {selectedFounder.skills && selectedFounder.skills.length > 0 && (
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

              {selectedFounder.startup && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Startup:</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStartupClick(selectedFounder.startup!)}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-pointer"
                    >
                      {selectedFounder.startup.name}
                    </button>
                  </div>
                </div>
              )}

              {selectedFounder.hobbies && selectedFounder.hobbies.length > 0 && (
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
              {canEditProfile(selectedFounder?.email) && (
                <button
                  onClick={() => {
                    setSelectedFounder(null);
                    handleEdit(selectedFounder);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Edit
                </button>
              )}
              {canDeleteUser() && (
                <button
                  onClick={() => {
                    setSelectedFounder(null);
                    handleDelete(selectedFounder.id);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Delete
                </button>
              )}
              {!canEditProfile(selectedFounder?.email) && !canDeleteUser() && (
                <button
                  onClick={() => setSelectedFounder(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Startup Details Modal */}
      <Modal
        isOpen={selectedStartup !== null}
        onClose={() => setSelectedStartup(null)}
        title={selectedStartup?.name || ''}
      >
        {selectedStartup && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedStartup.name}</h3>
              
              {selectedStartup.description && (
                <p className="text-gray-700 mb-4">{selectedStartup.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedStartup.industry && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Industry:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {selectedStartup.industry}
                    </span>
                  </div>
                )}
                
                {selectedStartup.stage && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Stage:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {selectedStartup.stage}
                    </span>
                  </div>
                )}
                
                {selectedStartup.target_market && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Target Market:</span>
                    <span className="text-sm text-gray-600 flex items-center">🎯 {selectedStartup.target_market}</span>
                  </div>
                )}
                
                {selectedStartup.revenue_arr && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Revenue ARR:</span>
                    <span className="text-sm text-gray-600 flex items-center">💰 {selectedStartup.revenue_arr}</span>
                  </div>
                )}
              </div>
              
              {selectedStartup.website_url && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-700 block mb-1">Website:</span>
                  <a 
                    href={selectedStartup.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {selectedStartup.website_url}
                  </a>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedStartup(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FoundersList;