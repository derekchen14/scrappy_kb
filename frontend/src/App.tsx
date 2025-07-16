import React, { useState, useEffect } from 'react';
import FoundersList from './components/FoundersList';
import SkillsList from './components/SkillsList';
import StartupsList from './components/StartupsList';
import HelpRequestsList from './components/HelpRequestsList';

function App() {
  const [activeTab, setActiveTab] = useState<'founders' | 'skills' | 'startups' | 'help-requests'>('founders');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const newTimeout = setTimeout(() => {
      // Search will be triggered by the 2-second delay
    }, 2000);
    
    setSearchTimeout(newTimeout);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    // Search is triggered immediately on submit
  };

  const handleSearchClick = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    // Search is triggered immediately on click
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sky-950 shadow-sm border-b border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white font-serif">Scrappy Founders Knowledge Base</h1>
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative mt-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-64 px-4 py-2 pl-10 pr-4 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleSearchClick}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
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
              Help Requests
            </button>
          </nav>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'founders' && <FoundersList searchQuery={searchQuery} />}
        {activeTab === 'skills' && <SkillsList searchQuery={searchQuery} />}
        {activeTab === 'startups' && <StartupsList searchQuery={searchQuery} />}
        {activeTab === 'help-requests' && <HelpRequestsList searchQuery={searchQuery} />}
      </main>
    </div>
  );
}

export default App;
