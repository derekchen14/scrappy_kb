import React, { memo, useCallback, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button, Alert, Box, CircularProgress } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import type { RedirectLoginOptions } from '@auth0/auth0-spa-js';

// Gate: only uses the Auth0 hook and returns early safely
export default function AuthButtons(): JSX.Element | null {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  if (isAuthenticated) return null;
  return (
    <AuthButtonsInner
      loginWithRedirect={loginWithRedirect}
      isLoading={isLoading}
    />
  );
}

type InnerProps = {
  isLoading: boolean;
  loginWithRedirect: (options?: RedirectLoginOptions) => Promise<void>;
};

// Inner: all other hooks live here (no conditional rendering before hooks)
const AuthButtonsInner = memo(function AuthButtonsInner({
  loginWithRedirect,
  isLoading,
}: InnerProps) {
  const [redirecting, setRedirecting] = useState<null | 'login' | 'signup'>(null);
  const [uiError, setUiError] = useState<string | null>(null);

  const disabled = isLoading || redirecting !== null;
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  const handleLogin = useCallback(async () => {
    setUiError(null);
    setRedirecting('login');
    try {
      await loginWithRedirect({
        appState: { returnTo },
      });
    } catch {
      setUiError('Could not start login. Please try again.');
      setRedirecting(null);
    }
  }, [loginWithRedirect, returnTo]);

  const handleSignUp = useCallback(async () => {
    setUiError(null);
    setRedirecting('signup');
    try {
      await loginWithRedirect({
        appState: { returnTo },
        authorizationParams: { screen_hint: 'signup' },
      });
    } catch {
      setUiError('Could not start sign up. Please try again.');
      setRedirecting(null);
    }
  }, [loginWithRedirect, returnTo]);

  return (
    <Box>
      {uiError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {uiError}
        </Alert>
      )}

      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleLogin}
          disabled={disabled}
          startIcon={redirecting === 'login' ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
          sx={{
            py: 1.5,
            px: 4,
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Log In
        </Button>

        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={handleSignUp}
          disabled={disabled}
          startIcon={redirecting === 'signup' ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
          sx={{
            py: 1.5,
            px: 4,
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Sign Up
        </Button>
      </Box>
    </Box>
  );
});
