import React, { memo, useCallback, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
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
        // Use this if you want to force re-auth each time:
        // authorizationParams: { prompt: 'login' },
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
        authorizationParams: { screen_hint: 'signup' }, // correct usage
      });
    } catch {
      setUiError('Could not start sign up. Please try again.');
      setRedirecting(null);
    }
  }, [loginWithRedirect, returnTo]);

  return (
    <div className="space-y-4">
      {uiError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {uiError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          type="button"
          onClick={handleLogin}
          disabled={disabled}
          aria-busy={redirecting === 'login'}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {redirecting === 'login' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 10a7 7 0 1114 0 7 7 0 01-14 0zm8-3a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
            </svg>
          )}
          <span>Log In</span>
        </button>

        <button
          type="button"
          onClick={handleSignUp}
          disabled={disabled}
          aria-busy={redirecting === 'signup'}
          className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {redirecting === 'signup' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a4 4 0 014 4v1h1a3 3 0 013 3v3a3 3 0 01-3 3h-1v1a4 4 0 11-8 0v-1H6a3 3 0 01-3-3V10a3 3 0 013-3h1V6a4 4 0 014-4z" />
            </svg>
          )}
          <span>Sign Up</span>
        </button>
      </div>
    </div>
  );
});
