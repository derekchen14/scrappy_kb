import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import FoundersList from './components/FoundersList';
import SkillsList from './components/SkillsList';
import StartupsList from './components/StartupsList';
import HelpRequestsList from './components/HelpRequestsList';
import AdminDashboard from './components/AdminDashboard';
import LoginButton from './components/LoginButton';
import LogoutButton from './components/LogoutButton';
import Profile from './components/Profile';
import { useAdmin } from './hooks/useAdmin';

function App() {
  const { isLoading, error, isAuthenticated } = useAuth0();
  const { isAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState<'founders' | 'skills' | 'startups' | 'help-requests' | 'admin'>('founders');





  if (isLoading) {
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
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Scrappy Founders Knowledge Base</h1>
          <p className="text-gray-600 mb-8">Please log in to access the knowledge base</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
        {activeTab === 'founders' && <FoundersList />}
        {activeTab === 'skills' && <SkillsList />}
        {activeTab === 'startups' && <StartupsList />}
        {activeTab === 'help-requests' && <HelpRequestsList />}
        {activeTab === 'admin' && isAdmin && <AdminDashboard />}
      </main>
    </div>
  );
}

export default App;
