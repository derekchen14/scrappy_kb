import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Founder, Startup } from '../types';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';

interface ProfileProps {
  onViewProfile?: (founder: Founder) => void;
  onEditProfile?: (founder: Founder) => void;
  onStartupClick?: (startup: Startup) => void;
}

const Profile: React.FC<ProfileProps> = ({ onViewProfile, onEditProfile, onStartupClick }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const { authenticatedAPI } = useAuthenticatedAPI();
  const [showDropdown, setShowDropdown] = useState(false);
  const [myProfile, setMyProfile] = useState<Founder | null>(null);

  const fetchMyProfile = useCallback(async () => {
    try {
      const response = await authenticatedAPI.get('/api/my-profile');
      setMyProfile(response.data.founder);
    } catch (error) {
      console.error('Error fetching my profile:', error);
    }
  }, [authenticatedAPI]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyProfile();
    }
  }, [isAuthenticated, fetchMyProfile]);

  const handleViewProfile = () => {
    if (myProfile && onViewProfile) {
      // Ensure arrays are initialized to prevent undefined errors
      const profileWithDefaults = {
        ...myProfile,
        skills: myProfile.skills || [],
        hobbies: myProfile.hobbies || [],
        startup: myProfile.startup || undefined
      };
      onViewProfile(profileWithDefaults);
      setShowDropdown(false);
    }
  };

  const handleEditProfile = () => {
    if (myProfile && onEditProfile) {
      // Ensure arrays are initialized to prevent undefined errors
      const profileWithDefaults = {
        ...myProfile,
        skills: myProfile.skills || [],
        hobbies: myProfile.hobbies || [],
        startup: myProfile.startup || undefined
      };
      onEditProfile(profileWithDefaults);
      setShowDropdown(false);
    }
  };

  const handleStartupClick = async () => {
    // Type assertion to access startup_id that exists in API response but not in TypeScript interface
    const profileWithStartupId = myProfile as any;
    if (profileWithStartupId?.startup_id && onStartupClick) {
      try {
        // Fetch the startup data using the startup_id
        const response = await authenticatedAPI.get(`/startups/${profileWithStartupId.startup_id}`);
        onStartupClick(response.data);
        setShowDropdown(false);
      } catch (error) {
        console.error('Error fetching startup:', error);
      }
    }
  };

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="relative">
      <div 
        className="flex items-center mt-2 space-x-3 text-white cursor-pointer hover:bg-blue-800 rounded-md px-2 py-1 transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {user.picture && (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full border-2 border-blue-300"
          />
        )}
        <span className="text-sm font-medium">{myProfile?.name || user.name || user.email}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
              <div className="font-medium">{myProfile?.name || user.name || 'No name'}</div>
              <div className="text-gray-500">{user.email}</div>
            </div>
            {myProfile && (
              <>
                <button
                  onClick={handleViewProfile}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cyan-100 hover:font-bold
                   hover:text-cyan-900 transition-all"
                >
                  View Profile
                </button>
                <button
                  onClick={handleEditProfile}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cyan-100 hover:font-bold
                   hover:text-cyan-900 transition-all"
                >
                  Edit Profile
                </button>
                {(myProfile as any)?.startup_id && (
                  <button
                    onClick={handleStartupClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cyan-100 hover:font-bold
                      hover:text-cyan-900 transition-all"
                  >
                    View Startup
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default Profile;