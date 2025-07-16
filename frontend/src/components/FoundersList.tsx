import React, { useState, useEffect } from 'react';
import { Founder, FounderCreate, Skill, Startup } from '../types';
import { founderAPI, skillAPI, startupAPI } from '../api';

const FoundersList: React.FC = () => {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFounder, setEditingFounder] = useState<Founder | null>(null);
  const [formData, setFormData] = useState<FounderCreate>({
    name: '',
    email: '',
    bio: '',
    location: '',
    linkedin_url: '',
    twitter_url: '',
    github_url: '',
    skill_ids: [],
    startup_ids: []
  });

  useEffect(() => {
    fetchFounders();
    fetchSkills();
    fetchStartups();
  }, []);

  const fetchFounders = async () => {
    try {
      const response = await founderAPI.getAll();
      setFounders(response.data);
    } catch (error) {
      console.error('Error fetching founders:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await skillAPI.getAll();
      setSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

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
      if (editingFounder) {
        await founderAPI.update(editingFounder.id, formData);
      } else {
        await founderAPI.create(formData);
      }
      fetchFounders();
      resetForm();
    } catch (error) {
      console.error('Error saving founder:', error);
    }
  };

  const handleEdit = (founder: Founder) => {
    setEditingFounder(founder);
    setFormData({
      name: founder.name,
      email: founder.email,
      bio: founder.bio || '',
      location: founder.location || '',
      linkedin_url: founder.linkedin_url || '',
      twitter_url: founder.twitter_url || '',
      github_url: founder.github_url || '',
      skill_ids: founder.skills.map(skill => skill.id),
      startup_ids: founder.startups.map(startup => startup.id)
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this founder?')) {
      try {
        await founderAPI.delete(id);
        fetchFounders();
      } catch (error) {
        console.error('Error deleting founder:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      bio: '',
      location: '',
      linkedin_url: '',
      twitter_url: '',
      github_url: '',
      skill_ids: [],
      startup_ids: []
    });
    setEditingFounder(null);
    setShowForm(false);
  };

  const handleSkillToggle = (skillId: number) => {
    setFormData(prev => ({
      ...prev,
      skill_ids: prev.skill_ids?.includes(skillId)
        ? prev.skill_ids.filter(id => id !== skillId)
        : [...(prev.skill_ids || []), skillId]
    }));
  };

  const handleStartupToggle = (startupId: number) => {
    setFormData(prev => ({
      ...prev,
      startup_ids: prev.startup_ids?.includes(startupId)
        ? prev.startup_ids.filter(id => id !== startupId)
        : [...(prev.startup_ids || []), startupId]
    }));
  };

  return (
    <div className="founders-list">
      <div className="list-header">
        <h2>Founders</h2>
        <button onClick={() => setShowForm(true)} className="add-button">
          Add Founder
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <form onSubmit={handleSubmit} className="founder-form">
            <h3>{editingFounder ? 'Edit Founder' : 'Add New Founder'}</h3>
            
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
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows={3}
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

            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Twitter URL</label>
              <input
                type="url"
                value={formData.twitter_url}
                onChange={(e) => setFormData({...formData, twitter_url: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>GitHub URL</label>
              <input
                type="url"
                value={formData.github_url}
                onChange={(e) => setFormData({...formData, github_url: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Skills</label>
              <div className="checkbox-group">
                {skills.map(skill => (
                  <label key={skill.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.skill_ids?.includes(skill.id) || false}
                      onChange={() => handleSkillToggle(skill.id)}
                    />
                    {skill.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Startups</label>
              <div className="checkbox-group">
                {startups.map(startup => (
                  <label key={startup.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.startup_ids?.includes(startup.id) || false}
                      onChange={() => handleStartupToggle(startup.id)}
                    />
                    {startup.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-buttons">
              <button type="submit" className="submit-button">
                {editingFounder ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={resetForm} className="cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="founders-grid">
        {founders.map(founder => (
          <div key={founder.id} className="founder-card">
            <div className="founder-header">
              <h3>{founder.name}</h3>
              <div className="founder-actions">
                <button onClick={() => handleEdit(founder)} className="edit-button">
                  Edit
                </button>
                <button onClick={() => handleDelete(founder.id)} className="delete-button">
                  Delete
                </button>
              </div>
            </div>
            
            <p className="founder-email">{founder.email}</p>
            {founder.bio && <p className="founder-bio">{founder.bio}</p>}
            {founder.location && <p className="founder-location">📍 {founder.location}</p>}
            
            <div className="founder-links">
              {founder.linkedin_url && (
                <a href={founder.linkedin_url} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              )}
              {founder.twitter_url && (
                <a href={founder.twitter_url} target="_blank" rel="noopener noreferrer">
                  Twitter
                </a>
              )}
              {founder.github_url && (
                <a href={founder.github_url} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              )}
            </div>

            {founder.skills.length > 0 && (
              <div className="founder-skills">
                <h4>Skills:</h4>
                <div className="skills-tags">
                  {founder.skills.map(skill => (
                    <span key={skill.id} className="skill-tag">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {founder.startups.length > 0 && (
              <div className="founder-startups">
                <h4>Startups:</h4>
                <div className="startups-list">
                  {founder.startups.map(startup => (
                    <span key={startup.id} className="startup-tag">
                      {startup.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoundersList;