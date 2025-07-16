import React, { useState, useEffect } from 'react';
import { Skill, SkillCreate } from '../types';
import { skillAPI } from '../api';

const SkillsList: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState<SkillCreate>({
    name: '',
    category: '',
    description: ''
  });

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await skillAPI.getAll();
      setSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSkill) {
        await skillAPI.update(editingSkill.id, formData);
      } else {
        await skillAPI.create(formData);
      }
      fetchSkills();
      resetForm();
    } catch (error) {
      console.error('Error saving skill:', error);
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category || '',
      description: skill.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      try {
        await skillAPI.delete(id);
        fetchSkills();
      } catch (error) {
        console.error('Error deleting skill:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: ''
    });
    setEditingSkill(null);
    setShowForm(false);
  };

  const skillCategories = ['Technical', 'Marketing', 'Business', 'Design', 'Sales', 'Product', 'Other'];

  return (
    <div className="skills-list">
      <div className="list-header">
        <h2>Skills</h2>
        <button onClick={() => setShowForm(true)} className="add-button">
          Add Skill
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <form onSubmit={handleSubmit} className="skill-form">
            <h3>{editingSkill ? 'Edit Skill' : 'Add New Skill'}</h3>
            
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
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Select a category</option>
                {skillCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="submit-button">
                {editingSkill ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={resetForm} className="cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="skills-grid">
        {skills.map(skill => (
          <div key={skill.id} className="skill-card">
            <div className="skill-header">
              <h3>{skill.name}</h3>
              <div className="skill-actions">
                <button onClick={() => handleEdit(skill)} className="edit-button">
                  Edit
                </button>
                <button onClick={() => handleDelete(skill.id)} className="delete-button">
                  Delete
                </button>
              </div>
            </div>
            
            {skill.category && (
              <p className="skill-category">
                <span className="category-tag">{skill.category}</span>
              </p>
            )}
            
            {skill.description && (
              <p className="skill-description">{skill.description}</p>
            )}
            
            <p className="skill-date">
              Created: {new Date(skill.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsList;