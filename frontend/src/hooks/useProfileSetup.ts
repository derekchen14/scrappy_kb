import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthenticatedAPI } from './useAuthenticatedAPI';
import { Founder } from '../types';

export const useProfileSetup = () => {
  const { user, isAuthenticated } = useAuth0();
  const { authenticatedAPI } = useAuthenticatedAPI();
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [userFounder, setUserFounder] = useState<Founder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileSetup = async () => {
      if (!isAuthenticated || !user?.email) {
        setLoading(false);
        return;
      }

      try {
        // Use the new backend endpoint that handles profile linking
        const response = await authenticatedAPI.post('/auth/check-profile');
        const { has_profile, profile_linked, founder } = response.data;

        console.log('Profile check result:', { has_profile, profile_linked, founder });

        if (has_profile && founder) {
          setUserFounder(founder);
          // Check if profile is complete (has required fields)
          const isComplete = founder.name && 
                           founder.email && 
                           founder.linkedin_url;
          setNeedsProfileSetup(!isComplete);
        } else {
          // No founder profile exists, needs setup
          setNeedsProfileSetup(true);
          setUserFounder(null);
        }
      } catch (error) {
        console.error('Error checking profile setup:', error);
        // If there's an error, assume they need to set up profile
        setNeedsProfileSetup(true);
      } finally {
        setLoading(false);
      }
    };

    checkProfileSetup();
  }, [isAuthenticated, user?.email, authenticatedAPI]);

  const completeProfileSetup = () => {
    setNeedsProfileSetup(false);
  };

  return {
    needsProfileSetup,
    userFounder,
    loading,
    completeProfileSetup
  };
};