import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HelpRequest, HelpRequestCreate, Founder } from '../types';
import { helpRequestAPI, founderAPI } from '../api';
import { useAuth0 } from '@auth0/auth0-react';
import { useAdmin } from '../hooks/useAdmin';

interface HelpRequestsListProps {
  searchQuery?: string;
  onFounderClick?: (founder: Founder) => void;
}

const HelpRequestsList: React.FC<HelpRequestsListProps> = ({ searchQuery = '', onFounderClick }) => {
  const { user } = useAuth0();
  const { isAdmin } = useAdmin();
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

  const getFounderName = useCallback((founderId: number) => {
    const founder = founders.find(f => f.id === founderId);
    return founder ? founder.name : 'Unknown';
  }, [founders]);

  const handleFounderClick = useCallback((founderId: number) => {
    if (onFounderClick) {
      const founder = founders.find(f => f.id === founderId);
      if (founder) {
        onFounderClick(founder);
      }
    }
  }, [founders, onFounderClick]);

  const canEditRequest = useCallback((request: HelpRequest) => {
    // Admin can edit any request
    if (isAdmin) {
      return true;
    }
    
    // Check if current user is the founder who made the request
    if (user?.email) {
      const requestFounder = founders.find(f => f.id === request.founder_id);
      return requestFounder?.email === user.email;
    }
    
    return false;
  }, [isAdmin, user, founders]);

  const getUrgencyClass = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHelpRequests = useMemo(() => {
    if (!searchQuery.trim()) {
      return helpRequests;
    }
    
    const query = searchQuery.toLowerCase();
    return helpRequests.filter(request => {
      const matchesTitle = request.title.toLowerCase().includes(query);
      const matchesDescription = request.description.toLowerCase().includes(query);
      const matchesCategory = request.category?.toLowerCase().includes(query);
      const matchesUrgency = request.urgency?.toLowerCase().includes(query);
      const matchesStatus = request.status?.toLowerCase().includes(query);
      const matchesFounder = getFounderName(request.founder_id).toLowerCase().includes(query);
      
      return matchesTitle || matchesDescription || matchesCategory || matchesUrgency || matchesStatus || matchesFounder;
    });
  }, [helpRequests, searchQuery, getFounderName]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Help Requests</h2>
        <button 
          onClick={() => setShowForm(true)} 
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Add Help Request
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">{editingRequest ? 'Edit Help Request' : 'Add New Help Request'}</h3>
            
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Founder *</label>
                <select
                  value={formData.founder_id}
                  onChange={(e) => setFormData({...formData, founder_id: parseInt(e.target.value)})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value={0}>Select a founder</option>
                  {founders.map(founder => (
                    <option key={founder.id} value={founder.id}>
                      {founder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Urgency</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {urgencyLevels.map(urgency => (
                    <option key={urgency} value={urgency}>
                      {urgency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                >
                  {editingRequest ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHelpRequests.map(request => (
          <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{request.title}</h3>
              {canEditRequest(request) && (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEdit(request)} 
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(request.id)} 
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">Requested by:</span> 
              <span 
                onClick={() => handleFounderClick(request.founder_id)}
                className="text-blue-600 hover:text-blue-800 cursor-pointer hover:underline transition-colors ml-1"
              >
                {getFounderName(request.founder_id)}
              </span>
            </p>
            
            <p className="text-gray-700 mb-4">{request.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {request.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {request.category}
                </span>
              )}
              
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyClass(request.urgency || 'Medium')}`}>
                {request.urgency || 'Medium'}
              </span>
              
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(request.status || 'Open')}`}>
                {request.status || 'Open'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HelpRequestsList;