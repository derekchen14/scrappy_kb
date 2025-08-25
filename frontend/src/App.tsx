import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import AuthButtons from './components/AuthButtons';
import LogoutButton from './components/LogoutButton';
import Profile from './components/Profile';
import { useAdmin } from './hooks/useAdmin';
import { useProfileSetup } from './hooks/useProfileSetup';
import { Startup, Founder } from './types';
// Lazily load tab panes (code-splitting)
const FoundersList = lazy(() => import(/* webpackChunkName: "tab-founders" */ './components/FoundersList'));
const SkillsList = lazy(() => import(/* webpackChunkName: "tab-skills" */ './components/SkillsList'));
const StartupsList = lazy(() => import(/* webpackChunkName: "tab-startups" */ './components/StartupsList'));
const HelpRequestsList = lazy(() => import(/* webpackChunkName: "tab-requests" */ './components/HelpRequestsList'));
const EventsList = lazy(() => import(/* webpackChunkName: "tab-events" */ './components/EventsList'));
const AdminDashboard = lazy(() => import(/* webpackChunkName: "tab-admin" */ './components/AdminDashboard'));
const ProfileSetupModal = lazy(() => import(/* webpackChunkName: "profile-setup" */ './components/ProfileSetupModal'));

type Tab = 'founders' | 'skills' | 'startups' | 'help-requests' | 'events' | 'admin';

function App() {
  const { isLoading, error, isAuthenticated } = useAuth0();
  const { isAdmin } = useAdmin();
  const { needsProfileSetup, loading: profileLoading, completeProfileSetup } = useProfileSetup();

  const [activeTab, setActiveTab] = useState<Tab>('founders');
  const [startupToShow, setStartupToShow] = useState<Startup | null>(null);
  const [founderToShow, setFounderToShow] = useState<Founder | null>(null);
  const [editFounderToShow, setEditFounderToShow] = useState<Founder | null>(null);

  // Stable callbacks (help memoized children & avoid re-renders)
  const navigateToStartup = useCallback((startup: Startup) => {
    setActiveTab('startups');
    setStartupToShow(startup);
  }, []);

  const navigateToFounder = useCallback((founder: Founder) => {
    setActiveTab('founders');
    setFounderToShow(founder);
  }, []);

  const handleViewProfile = useCallback((founder: Founder) => {
    setActiveTab('founders');
    setFounderToShow(founder);
  }, []);

  const handleEditProfile = useCallback((founder: Founder) => {
    setActiveTab('founders');
    setEditFounderToShow(founder);
  }, []);

  // Redirect non-admin users away from admin-only tabs
  useEffect(() => {
    if (!isAdmin && (activeTab === 'skills' || activeTab === 'admin')) {
      setActiveTab('founders');
    }
  }, [isAdmin, activeTab]);

  // Preload tab bundles on hover for snappy UX
  const preloadTab = useCallback((tab: Tab) => {
    switch (tab) {
      case 'founders':
        import(/* webpackPrefetch: true, webpackChunkName: "tab-founders" */ './components/FoundersList');
        break;
      case 'skills':
        import(/* webpackPrefetch: true, webpackChunkName: "tab-skills" */ './components/SkillsList');
        break;
      case 'startups':
        import(/* webpackPrefetch: true, webpackChunkName: "tab-startups" */ './components/StartupsList');
        break;
      case 'help-requests':
        import(/* webpackPrefetch: true, webpackChunkName: "tab-requests" */ './components/HelpRequestsList');
        break;
      case 'events':
        import(/* webpackPrefetch: true, webpackChunkName: "tab-events" */ './components/EventsList');
        break;
      case 'admin':
        import(/* webpackPrefetch: true, webpackChunkName: "tab-admin" */ './components/AdminDashboard');
        break;
    }
  }, []);

  // Shared skeleton for lazy tabs
  const MainFallback = (
    <div className="py-16 text-center text-gray-600">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      Loading…
    </div>
  );

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Authentication Error: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Scrappy Founders Knowledge Base</h1>
          <p className="text-gray-600 mb-8">Join our community of founders</p>
          <AuthButtons />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Profile Setup Modal (lazy) */}
      <Suspense fallback={null}>
        <ProfileSetupModal
          isOpen={needsProfileSetup && !isAdmin}
          onComplete={completeProfileSetup}
        />
      </Suspense>

      <header className="bg-sky-950 shadow-sm border-b border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white font-serif">Scrappy Founders Knowledge Base</h1>

            {/* User Profile and Logout */}
            <div className="flex items-center space-x-4">
              <Profile
                onViewProfile={handleViewProfile}
                onEditProfile={handleEditProfile}
                onStartupClick={navigateToStartup}
              />
              <LogoutButton />
            </div>
          </div>

          <nav className="flex space-x-8 -mb-px">
            <button
              onMouseEnter={() => preloadTab('founders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'founders'
                  ? 'border-blue-300 text-blue-100'
                  : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('founders')}
              aria-current={activeTab === 'founders' ? 'page' : undefined}
            >
              Founders
            </button>

            {isAdmin && (
              <button
                onMouseEnter={() => preloadTab('skills')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'skills'
                    ? 'border-blue-300 text-blue-100'
                    : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400'
                }`}
                onClick={() => setActiveTab('skills')}
                aria-current={activeTab === 'skills' ? 'page' : undefined}
              >
                Skills
              </button>
            )}

            <button
              onMouseEnter={() => preloadTab('startups')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'startups'
                  ? 'border-blue-300 text-blue-100'
                  : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('startups')}
              aria-current={activeTab === 'startups' ? 'page' : undefined}
            >
              Startups
            </button>

            <button
              onMouseEnter={() => preloadTab('help-requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'help-requests'
                  ? 'border-blue-300 text-blue-100'
                  : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('help-requests')}
              aria-current={activeTab === 'help-requests' ? 'page' : undefined}
            >
              Requests
            </button>

            <button
              onMouseEnter={() => preloadTab('events')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events'
                  ? 'border-blue-300 text-blue-100'
                  : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('events')}
              aria-current={activeTab === 'events' ? 'page' : undefined}
            >
              Events
            </button>

            {isAdmin && (
              <button
                onMouseEnter={() => preloadTab('admin')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin'
                    ? 'border-blue-300 text-blue-100'
                    : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400'
                }`}
                onClick={() => setActiveTab('admin')}
                aria-current={activeTab === 'admin' ? 'page' : undefined}
              >
                Admin
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={MainFallback}>
          {activeTab === 'founders' && (
            <FoundersList
              onStartupClick={navigateToStartup}
              founderToShow={founderToShow}
              onFounderShown={() => setFounderToShow(null)}
              editFounderToShow={editFounderToShow}
              onEditFounderShown={() => setEditFounderToShow(null)}
            />
          )}
          {activeTab === 'skills' && isAdmin && <SkillsList />}
          {activeTab === 'startups' && (
            <StartupsList
              startupToShow={startupToShow}
              onStartupShown={() => setStartupToShow(null)}
              onFounderClick={navigateToFounder}
            />
          )}
          {activeTab === 'help-requests' && <HelpRequestsList onFounderClick={navigateToFounder} />}
          {activeTab === 'events' && <EventsList />}
          {activeTab === 'admin' && isAdmin && <AdminDashboard onNavigateToTab={setActiveTab} />}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
