import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import FoundersList from './components/FoundersList';
import SkillsList from './components/SkillsList';
import StartupsList from './components/StartupsList';
import HelpRequestsList from './components/HelpRequestsList';
import EventsList from './components/EventsList';
import AdminDashboard from './components/AdminDashboard';
import ProfileSetupModal from './components/ProfileSetupModal';
import AuthButtons from './components/AuthButtons';
import LogoutButton from './components/LogoutButton';
import Profile from './components/Profile';
import { useAdmin } from './hooks/useAdmin';
import { useProfileSetup } from './hooks/useProfileSetup';
import { Startup, Founder } from './types';

function App() {
  const { isLoading, error, isAuthenticated } = useAuth0();
  const { isAdmin } = useAdmin();
  const { needsProfileSetup, loading: profileLoading, completeProfileSetup } = useProfileSetup();
  const [activeTab, setActiveTab] = useState<'founders' | 'skills' | 'startups' | 'help-requests' | 'events' | 'admin'>('founders');
  const [startupToShow, setStartupToShow] = useState<Startup | null>(null);
  const [founderToShow, setFounderToShow] = useState<Founder | null>(null);

  const navigateToStartup = (startup: Startup) => {
    setActiveTab('startups');
    setStartupToShow(startup);
  };

  const navigateToFounder = (founder: Founder) => {
    setActiveTab('founders');
    setFounderToShow(founder);
  };

  // Redirect non-admin users away from admin-only tabs
  useEffect(() => {
    if (!isAdmin && (activeTab === 'skills' || activeTab === 'admin')) {
      setActiveTab('founders');
    }
  }, [isAdmin, activeTab]);





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
      {/* Profile Setup Modal */}
      <ProfileSetupModal 
        isOpen={needsProfileSetup && !isAdmin}
        onComplete={completeProfileSetup}
      />
      
      <header className="bg-sky-950 shadow-sm border-b border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white font-serif">Scrappy Founders Knowledge Base</h1>
            

            {/* User Profile and Logout */}
            <div className="flex items-center space-x-4">
              <Profile />
              <LogoutButton />
            </div>
          </div>
          <nav className="flex space-x-8 -mb-px">
            <button 
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'founders' 
                  ? 'border-blue-300 text-blue-100' 
                  : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('founders')}
            >
              Founders
            </button>
            {isAdmin && (
              <button 
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'skills' 
                    ? 'border-blue-300 text-blue-100' 
                    : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400'
                }`}
                onClick={() => setActiveTab('skills')}
              >
                Skills
              </button>
            )}
            <button 
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'startups' 
                  ? 'border-blue-300 text-blue-100' 
                  : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('startups')}
            >
              Startups
            </button>
            <button 
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'help-requests' 
                  ? 'border-blue-300 text-blue-100' 
                  : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('help-requests')}
            >
              Requests
            </button>
            <button 
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events' 
                  ? 'border-blue-300 text-blue-100' 
                  : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
            {isAdmin && (
              <button 
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin' 
                    ? 'border-blue-300 text-blue-100' 
                    : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400'
                }`}
                onClick={() => setActiveTab('admin')}
              >
                Admin
              </button>
            )}
          </nav>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'founders' && <FoundersList onStartupClick={navigateToStartup} founderToShow={founderToShow} onFounderShown={() => setFounderToShow(null)} />}
        {activeTab === 'skills' && isAdmin && <SkillsList />}
        {activeTab === 'startups' && <StartupsList startupToShow={startupToShow} onStartupShown={() => setStartupToShow(null)} onFounderClick={navigateToFounder} />}
        {activeTab === 'help-requests' && <HelpRequestsList onFounderClick={navigateToFounder} />}
        {activeTab === 'events' && <EventsList />}
        {activeTab === 'admin' && isAdmin && <AdminDashboard onNavigateToTab={setActiveTab} />}
      </main>
    </div>
  );
}

export default App;
