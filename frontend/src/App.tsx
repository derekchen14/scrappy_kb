import React, { useState } from 'react';
import FoundersList from './components/FoundersList';
import SkillsList from './components/SkillsList';
import StartupsList from './components/StartupsList';
import HelpRequestsList from './components/HelpRequestsList';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'founders' | 'skills' | 'startups' | 'help-requests'>('founders');

  return (
    <div className="App">
      <header className="App-header">
        <h1>Founders Community CRM</h1>
        <nav className="tab-navigation">
          <button 
            className={activeTab === 'founders' ? 'active' : ''}
            onClick={() => setActiveTab('founders')}
          >
            Founders
          </button>
          <button 
            className={activeTab === 'skills' ? 'active' : ''}
            onClick={() => setActiveTab('skills')}
          >
            Skills
          </button>
          <button 
            className={activeTab === 'startups' ? 'active' : ''}
            onClick={() => setActiveTab('startups')}
          >
            Startups
          </button>
          <button 
            className={activeTab === 'help-requests' ? 'active' : ''}
            onClick={() => setActiveTab('help-requests')}
          >
            Help Requests
          </button>
        </nav>
      </header>
      
      <main className="App-main">
        {activeTab === 'founders' && <FoundersList />}
        {activeTab === 'skills' && <SkillsList />}
        {activeTab === 'startups' && <StartupsList />}
        {activeTab === 'help-requests' && <HelpRequestsList />}
      </main>
    </div>
  );
}

export default App;
