import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { FounderCreate, Skill, Startup, Hobby } from '../types';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
  existingData?: Partial<FounderCreate>;
}

const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ 
  isOpen, 
  onComplete, 
  existingData 
}) => {
  const { user } = useAuth0();
  const { authenticatedAPI, publicAPI } = useAuthenticatedAPI();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FounderCreate>({
    name: existingData?.name || '',
    email: user?.email || '',
    bio: existingData?.bio || '',
    location: existingData?.location || '',
    linkedin_url: existingData?.linkedin_url || '',
    twitter_url: existingData?.twitter_url || '',
    github_url: existingData?.github_url || '',
    profile_image_url: existingData?.profile_image_url || '',
    profile_visible: existingData?.profile_visible ?? true,
    skill_ids: existingData?.skill_ids || [],
    startup_id: existingData?.startup_id,
    hobby_ids: existingData?.hobby_ids || []
  });

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      if (existingData?.profile_image_url) {
        setImagePreview(existingData.profile_image_url);
      }
    }
  }, [isOpen, existingData]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOptions = async () => {
    try {
      const [skillsRes, startupsRes, hobbiesRes] = await Promise.all([
        publicAPI.get<Skill[]>('/skills/'),
        publicAPI.get<Startup[]>('/startups/'),
        publicAPI.get<Hobby[]>('/hobbies/')
      ]);
      
      setSkills(skillsRes.data);
      setStartups(startupsRes.data);
      setHobbies(hobbiesRes.data);
    } catch (error) {
      console.error('Error fetching options:', error);
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
    
    if (!formData.name || !formData.email || !formData.linkedin_url) {
      alert('Please fill in all required fields (Name, Email, LinkedIn URL)');
      return;
    }

    setSubmitting(true);
    try {
      let finalFormData = { ...formData };
      
      // Upload image if selected
      if (selectedImage) {
        const imageUrl = await uploadImage();
        if (imageUrl) {
          finalFormData.profile_image_url = imageUrl;
        }
      }
      
      // Create or update profile
      if (existingData) {
        // Update existing profile
        const founders = await publicAPI.get('/founders/');
        const existingFounder = founders.data.find((f: any) => f.email === user?.email);
        if (existingFounder) {
          await authenticatedAPI.put(`/founders/${existingFounder.id}`, finalFormData);
        }
      } else {
        // Create new profile
        await authenticatedAPI.post('/founders/', finalFormData);
      }
      
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {existingData ? 'Complete Your Profile' : 'Set Up Your Profile'}
            </h3>
            <p className="text-gray-600 mt-2">
              Please fill in your information to get started
            </p>
          </div>
        
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
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">Email cannot be changed</p>
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
              type="submit" 
              disabled={submitting || uploadingImage}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              {submitting ? 'Saving...' : (uploadingImage ? 'Uploading...' : 'Complete Profile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupModal;