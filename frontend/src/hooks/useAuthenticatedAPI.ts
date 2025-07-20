import { useAuth0 } from '@auth0/auth0-react';
import { createAuthenticatedAPI, publicAPI } from '../utils/auth-api';
import { useMemo } from 'react';

export const useAuthenticatedAPI = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const authenticatedAPI = useMemo(() => {
    if (!isAuthenticated) {
      return publicAPI;
    }

    return createAuthenticatedAPI(async () => {
      try {
        return await getAccessTokenSilently();
      } catch (error) {
        console.error('Failed to get access token:', error);
        throw error;
      }
    });
  }, [getAccessTokenSilently, isAuthenticated]);

  return { authenticatedAPI, publicAPI };
};