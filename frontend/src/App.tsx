import React, { useState } from 'react';
import FoundersList from './components/FoundersList';
import SkillsList from './components/SkillsList';
import StartupsList from './components/StartupsList';
import HelpRequestsList from './components/HelpRequestsList';

function App() {
  const [activeTab, setActiveTab] = useState<'founders' | 'skills' | 'startups' | 'help-requests'>('founders');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 shadow-sm border-b border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white">Scrappy Founders Knowledge Base</h1>
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
        {activeTab === 'founders' && <FoundersList />}
        {activeTab === 'skills' && <SkillsList />}
        {activeTab === 'startups' && <StartupsList />}
        {activeTab === 'help-requests' && <HelpRequestsList />}
      </main>
    </div>
  );
}

export default App;
