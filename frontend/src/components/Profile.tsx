import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import PasswordChangeModal from './PasswordChangeModal';

const Profile: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const isAuth0DatabaseUser = () => {
    // Check if user is using Auth0 database (not social login)
    return user?.sub?.startsWith('auth0|');
  };

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
        <span className="text-sm font-medium">{user.name || user.email}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
              <div className="font-medium">{user.name}</div>
              <div className="text-gray-500">{user.email}</div>
            </div>
            
            {isAuth0DatabaseUser() && (
              <button
                onClick={() => {
                  setShowPasswordModal(true);
                  setShowDropdown(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Change Password
              </button>
            )}
            
            <div className="border-t border-gray-100">
              <div className="px-4 py-2 text-xs text-gray-500">
                {isAuth0DatabaseUser() ? 'Database Account' : 'Social Login'}
              </div>
            </div>
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

      <PasswordChangeModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};

export default Profile;