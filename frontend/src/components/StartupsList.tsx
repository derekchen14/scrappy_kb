import React, { useState, useEffect } from 'react';
import { Startup, StartupCreate } from '../types';
import { startupAPI } from '../api';

const StartupsList: React.FC = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStartup, setEditingStartup] = useState<Startup | null>(null);
  const [formData, setFormData] = useState<StartupCreate>({
    name: '',
    description: '',
    industry: '',
    stage: '',
    website_url: '',
    team_size: undefined,
    location: ''
  });

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    try {
      const response = await startupAPI.getAll();
      setStartups(response.data);
    } catch (error) {
      console.error('Error fetching startups:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStartup) {
        await startupAPI.update(editingStartup.id, formData);
      } else {
        await startupAPI.create(formData);
      }
      fetchStartups();
      resetForm();
    } catch (error) {
      console.error('Error saving startup:', error);
    }
  };

  const handleEdit = (startup: Startup) => {
    setEditingStartup(startup);
    setFormData({
      name: startup.name,
      description: startup.description || '',
      industry: startup.industry || '',
      stage: startup.stage || '',
      website_url: startup.website_url || '',
      team_size: startup.team_size || undefined,
      location: startup.location || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this startup?')) {
      try {
        await startupAPI.delete(id);
        fetchStartups();
      } catch (error) {
        console.error('Error deleting startup:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      industry: '',
      stage: '',
      website_url: '',
      team_size: undefined,
      location: ''
    });
    setEditingStartup(null);
    setShowForm(false);
  };

  const startupStages = ['Idea', 'MVP', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'IPO'];
  const industries = ['Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Entertainment', 'SaaS', 'Other'];

  return (
    <div className="startups-list">
      <div className="list-header">
        <h2>Startups</h2>
        <button onClick={() => setShowForm(true)} className="add-button">
          Add Startup
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <form onSubmit={handleSubmit} className="startup-form">
            <h3>{editingStartup ? 'Edit Startup' : 'Add New Startup'}</h3>
            
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
              >
                <option value="">Select an industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({...formData, stage: e.target.value})}
              >
                <option value="">Select a stage</option>
                {startupStages.map(stage => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Website URL</label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({...formData, website_url: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Team Size</label>
              <input
                type="number"
                min="1"
                value={formData.team_size || ''}
                onChange={(e) => setFormData({...formData, team_size: e.target.value ? parseInt(e.target.value) : undefined})}
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="submit-button">
                {editingStartup ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={resetForm} className="cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="startups-grid">
        {startups.map(startup => (
          <div key={startup.id} className="startup-card">
            <div className="startup-header">
              <h3>{startup.name}</h3>
              <div className="startup-actions">
                <button onClick={() => handleEdit(startup)} className="edit-button">
                  Edit
                </button>
                <button onClick={() => handleDelete(startup.id)} className="delete-button">
                  Delete
                </button>
              </div>
            </div>
            
            {startup.description && (
              <p className="startup-description">{startup.description}</p>
            )}
            
            <div className="startup-details">
              {startup.industry && (
                <p className="startup-industry">
                  <strong>Industry:</strong> {startup.industry}
                </p>
              )}
              
              {startup.stage && (
                <p className="startup-stage">
                  <strong>Stage:</strong> <span className="stage-tag">{startup.stage}</span>
                </p>
              )}
              
              {startup.team_size && (
                <p className="startup-team">
                  <strong>Team Size:</strong> {startup.team_size}
                </p>
              )}
              
              {startup.location && (
                <p className="startup-location">
                  <strong>Location:</strong> 📍 {startup.location}
                </p>
              )}
              
              {startup.website_url && (
                <p className="startup-website">
                  <strong>Website:</strong> 
                  <a href={startup.website_url} target="_blank" rel="noopener noreferrer">
                    {startup.website_url}
                  </a>
                </p>
              )}
            </div>
            
            <p className="startup-date">
              Created: {new Date(startup.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StartupsList;