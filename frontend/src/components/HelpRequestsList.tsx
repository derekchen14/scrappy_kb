import React, { useState, useEffect } from 'react';
import { HelpRequest, HelpRequestCreate, Founder } from '../types';
import { helpRequestAPI, founderAPI } from '../api';

const HelpRequestsList: React.FC = () => {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [founders, setFounders] = useState<Founder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<HelpRequest | null>(null);
  const [formData, setFormData] = useState<HelpRequestCreate>({
    founder_id: 0,
    title: '',
    description: '',
    category: '',
    urgency: 'Medium',
    status: 'Open'
  });

  useEffect(() => {
    fetchHelpRequests();
    fetchFounders();
  }, []);

  const fetchHelpRequests = async () => {
    try {
      const response = await helpRequestAPI.getAll();
      setHelpRequests(response.data);
    } catch (error) {
      console.error('Error fetching help requests:', error);
    }
  };

  const fetchFounders = async () => {
    try {
      const response = await founderAPI.getAll();
      setFounders(response.data);
    } catch (error) {
      console.error('Error fetching founders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRequest) {
        await helpRequestAPI.update(editingRequest.id, formData);
      } else {
        await helpRequestAPI.create(formData);
      }
      fetchHelpRequests();
      resetForm();
    } catch (error) {
      console.error('Error saving help request:', error);
    }
  };

  const handleEdit = (request: HelpRequest) => {
    setEditingRequest(request);
    setFormData({
      founder_id: request.founder_id,
      title: request.title,
      description: request.description,
      category: request.category || '',
      urgency: request.urgency || 'Medium',
      status: request.status || 'Open'
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this help request?')) {
      try {
        await helpRequestAPI.delete(id);
        fetchHelpRequests();
      } catch (error) {
        console.error('Error deleting help request:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      founder_id: 0,
      title: '',
      description: '',
      category: '',
      urgency: 'Medium',
      status: 'Open'
    });
    setEditingRequest(null);
    setShowForm(false);
  };

  const categories = ['Technical', 'Marketing', 'Funding', 'Legal', 'Design', 'Business Development', 'Other'];
  const urgencyLevels = ['Low', 'Medium', 'High'];
  const statusOptions = ['Open', 'In Progress', 'Resolved'];

  const getFounderName = (founderId: number) => {
    const founder = founders.find(f => f.id === founderId);
    return founder ? founder.name : 'Unknown';
  };

  const getUrgencyClass = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'urgency-high';
      case 'Medium': return 'urgency-medium';
      case 'Low': return 'urgency-low';
      default: return '';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Open': return 'status-open';
      case 'In Progress': return 'status-progress';
      case 'Resolved': return 'status-resolved';
      default: return '';
    }
  };

  return (
    <div className="help-requests-list">
      <div className="list-header">
        <h2>Help Requests</h2>
        <button onClick={() => setShowForm(true)} className="add-button">
          Add Help Request
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <form onSubmit={handleSubmit} className="help-request-form">
            <h3>{editingRequest ? 'Edit Help Request' : 'Add New Help Request'}</h3>
            
            <div className="form-group">
              <label>Founder *</label>
              <select
                value={formData.founder_id}
                onChange={(e) => setFormData({...formData, founder_id: parseInt(e.target.value)})}
                required
              >
                <option value={0}>Select a founder</option>
                {founders.map(founder => (
                  <option key={founder.id} value={founder.id}>
                    {founder.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
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
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Urgency</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({...formData, urgency: e.target.value})}
              >
                {urgencyLevels.map(urgency => (
                  <option key={urgency} value={urgency}>
                    {urgency}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-buttons">
              <button type="submit" className="submit-button">
                {editingRequest ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={resetForm} className="cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="help-requests-grid">
        {helpRequests.map(request => (
          <div key={request.id} className="help-request-card">
            <div className="request-header">
              <h3>{request.title}</h3>
              <div className="request-actions">
                <button onClick={() => handleEdit(request)} className="edit-button">
                  Edit
                </button>
                <button onClick={() => handleDelete(request.id)} className="delete-button">
                  Delete
                </button>
              </div>
            </div>
            
            <p className="request-founder">
              <strong>Requested by:</strong> {getFounderName(request.founder_id)}
            </p>
            
            <p className="request-description">{request.description}</p>
            
            <div className="request-meta">
              {request.category && (
                <span className="category-tag">{request.category}</span>
              )}
              
              <span className={`urgency-tag ${getUrgencyClass(request.urgency || 'Medium')}`}>
                {request.urgency || 'Medium'}
              </span>
              
              <span className={`status-tag ${getStatusClass(request.status || 'Open')}`}>
                {request.status || 'Open'}
              </span>
            </div>
            
            <p className="request-date">
              Created: {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HelpRequestsList;