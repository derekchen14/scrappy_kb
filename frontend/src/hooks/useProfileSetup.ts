import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthenticatedAPI } from './useAuthenticatedAPI';
import { Founder } from '../types';

export const useProfileSetup = () => {
  const { user, isAuthenticated } = useAuth0();
  const { publicAPI } = useAuthenticatedAPI();
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
        // Check if user has a founder profile
        const response = await publicAPI.get<Founder[]>('/founders/');
        const founders = response.data;
        const existingFounder = founders.find(f => f.email === user.email);

        if (existingFounder) {
          setUserFounder(existingFounder);
          // Check if profile is complete (has required fields)
          const isComplete = existingFounder.name && 
                           existingFounder.email && 
                           existingFounder.linkedin_url;
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
  }, [isAuthenticated, user?.email, publicAPI]);

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