import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { Founder, FounderCreate, Skill, Startup, Hobby } from '../types';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
  existingData?: Partial<FounderCreate>;
}

const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  isOpen,
  onComplete,
  existingData,
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
  const [errorText, setErrorText] = useState<string | null>(null);

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
    auth0_user_id: existingData?.auth0_user_id || user?.sub,
    skill_ids: existingData?.skill_ids || [],
    startup_id: existingData?.startup_id,
    hobby_ids: existingData?.hobby_ids || [],
  });

  // Keep form data in sync when modal opens / props change
  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: existingData?.name || '',
      email: user?.email || '',
      bio: existingData?.bio || '',
      location: existingData?.location || '',
      linkedin_url: existingData?.linkedin_url || '',
      twitter_url: existingData?.twitter_url || '',
      github_url: existingData?.github_url || '',
      profile_image_url: existingData?.profile_image_url || '',
      profile_visible: existingData?.profile_visible ?? true,
      auth0_user_id: existingData?.auth0_user_id || user?.sub,
      skill_ids: existingData?.skill_ids || [],
      startup_id: existingData?.startup_id,
      hobby_ids: existingData?.hobby_ids || [],
    });
    setImagePreview(existingData?.profile_image_url || null);
    setSelectedImage(null);
    setErrorText(null);
  }, [isOpen, existingData, user?.email, user?.sub]);

  const fetchOptions = useCallback(async () => {
    try {
      const [skillsRes, startupsRes, hobbiesRes] = await Promise.all([
        publicAPI.get<Skill[]>('/skills/'),
        publicAPI.get<Startup[]>('/startups/'),
        publicAPI.get<Hobby[]>('/hobbies/'),
      ]);
      setSkills(skillsRes.data);
      setStartups(startupsRes.data);
      setHobbies(hobbiesRes.data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching options:', err);
      setErrorText('Failed to load dropdown options. Please retry.');
    }
  }, [publicAPI]);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen, fetchOptions]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    setUploadingImage(true);
    try {
      const fd = new FormData(); // avoid shadowing state 'formData'
      fd.append('file', selectedImage);

      const response = await authenticatedAPI.post('/upload-image/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.image_url as string;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error uploading image:', err);
      setErrorText('Image upload failed. You can try again or continue without a photo.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    // Basic required validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.linkedin_url.trim()) {
      setErrorText('Please fill in all required fields (Name, Email, LinkedIn URL).');
      return;
    }

    setSubmitting(true);
    try {
      const finalData: FounderCreate = { ...formData };

      // Upload image if selected
      if (selectedImage) {
        const imageUrl = await uploadImage();
        if (imageUrl) finalData.profile_image_url = imageUrl;
      }

      // Create or update
      if (existingData) {
        // Try to find an existing founder by email; update if found, otherwise create
        const foundersRes = await publicAPI.get<Founder[]>('/founders/');
        const existingFounder = foundersRes.data.find((f) => f.email === formData.email);
        if (existingFounder) {
          await authenticatedAPI.put(`/founders/${existingFounder.id}`, finalData);
        } else {
          await authenticatedAPI.post('/founders/', finalData);
        }
      } else {
        await authenticatedAPI.post('/founders/', finalData);
      }

      onComplete();
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Error saving profile:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Error saving profile. Please try again.';
      setErrorText(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkillToggle = (skillId: number) => {
    setFormData((prev) => ({
      ...prev,
      skill_ids: prev.skill_ids?.includes(skillId)
        ? prev.skill_ids.filter((id) => id !== skillId)
        : [...(prev.skill_ids || []), skillId],
    }));
  };

  const handleStartupChange = (startupId: number | undefined) => {
    setFormData((prev) => ({
      ...prev,
      startup_id: startupId,
    }));
  };

  const handleHobbyToggle = (hobbyId: number) => {
    setFormData((prev) => ({
      ...prev,
      hobby_ids: prev.hobby_ids?.includes(hobbyId)
        ? prev.hobby_ids.filter((id) => id !== hobbyId)
        : [...(prev.hobby_ids || []), hobbyId],
    }));
  };

  if (!isOpen) return null;

  const disabledAction = submitting || uploadingImage;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6" aria-busy={disabledAction}>
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {existingData ? 'Complete Your Profile' : 'Set Up Your Profile'}
            </h3>
            <p className="text-gray-600 mt-2">Please fill in your information to get started</p>
          </div>

          {errorText && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorText}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">LinkedIn URL *</label>
            <input
              type="url"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              onFocus={(e) => {
                if (!e.target.value) {
                  setFormData((prev) => ({ ...prev, linkedin_url: 'https://www.linkedin.com/in/' }));
                }
              }}
              required
              inputMode="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Twitter URL</label>
            <input
              type="url"
              value={formData.twitter_url}
              onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
              onFocus={(e) => {
                if (!e.target.value) {
                  setFormData((prev) => ({ ...prev, twitter_url: 'https://www.twitter.com/' }));
                }
              }}
              inputMode="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">GitHub URL</label>
            <input
              type="url"
              value={formData.github_url}
              onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
              onFocus={(e) => {
                if (!e.target.value) {
                  setFormData((prev) => ({ ...prev, github_url: 'https://www.github.com/' }));
                }
              }}
              inputMode="url"
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
                onChange={(e) => setFormData({ ...formData, profile_visible: e.target.checked })}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Profile Visible</span>
            </label>
            <p className="text-xs text-gray-500">When unchecked, only name and bio will be visible to others</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Skills</label>
            <div className="grid grid-cols-2 gap-2">
              {skills.map((skill) => (
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
              value={formData.startup_id ?? ''}
              onChange={(e) =>
                handleStartupChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">No startup</option>
              {startups.map((startup) => (
                <option key={startup.id} value={startup.id}>
                  {startup.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Hobbies</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {hobbies.map((hobby) => (
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
              disabled={disabledAction}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              {submitting ? 'Saving…' : uploadingImage ? 'Uploading…' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupModal;
