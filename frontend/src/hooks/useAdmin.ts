import { useAuth0 } from '@auth0/auth0-react';
import { isAdminUser, canEditProfile, canDeleteUser, canToggleProfileVisibility } from '../utils/admin';

export const useAdmin = () => {
  const { user, isAuthenticated } = useAuth0();
  
  const userEmail = user?.email;
  const isAdmin = isAuthenticated && isAdminUser(userEmail);
  
  return {
    isAdmin,
    userEmail,
    canEditProfile: (profileOwnerEmail?: string) => canEditProfile(userEmail, profileOwnerEmail),
    canDeleteUser: () => canDeleteUser(userEmail),
    canToggleProfileVisibility: () => canToggleProfileVisibility(userEmail),
  };
};