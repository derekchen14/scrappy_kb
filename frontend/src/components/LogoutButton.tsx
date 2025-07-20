import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const LogoutButton: React.FC = () => {
  const { logout, isAuthenticated } = useAuth0();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm mt-2 py-1 px-2 rounded-md transition-colors"
    >
      Log Out
    </button>
  );
};

export default LogoutButton;