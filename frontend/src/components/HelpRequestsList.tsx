import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HelpRequest, HelpRequestCreate, Founder } from '../types';
import { useAuth0 } from '@auth0/auth0-react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import CustomSelect from './CustomSelect';

interface HelpRequestsListProps {
  searchQuery?: string;
  onFounderClick?: (founder: Founder) => void;
}

const categories = ['Technical', 'Marketing', 'Funding', 'Legal', 'Design', 'Business Development', 'Other'];
const urgencyLevels = ['Low', 'Medium', 'High'] as const;
const statusOptions = ['Open', 'In Progress', 'Resolved'] as const;

const HelpRequestsList: React.FC<HelpRequestsListProps> = ({ searchQuery = '', onFounderClick }) => {
  const { user } = useAuth0();
  const { isAdmin } = useAdmin();
  const { publicAPI, authenticatedAPI } = useAuthenticatedAPI();

  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<HelpRequest | null>(null);
  const [formData, setFormData] = useState<HelpRequestCreate>({
    founder_id: 0,
    title: '',
    description: '',
    category: '',
    urgency: 'Medium',
    status: 'Open',
  });

  const currentFounder = useMemo(() => {
    const email = user?.email?.toLowerCase();
    if (!email) return null;
    return founders.find((f) => f.email?.toLowerCase() === email) || null;
  }, [user?.email, founders]);

  const foundersById = useMemo(() => {
    const m = new Map<number, Founder>();
    founders.forEach((f) => m.set(f.id, f));
    return m;
  }, [founders]);

  const getFounderName = useCallback(
    (founderId: number) => foundersById.get(founderId)?.name ?? 'Unknown',
    [foundersById]
  );

  const canEditRequest = useCallback(
    (request: HelpRequest) => {
      if (isAdmin) return true;
      const email = user?.email?.toLowerCase();
      if (!email) return false;
      const f = foundersById.get(request.founder_id);
      return f?.email?.toLowerCase() === email;
    },
    [isAdmin, user?.email, foundersById]
  );

  const handleFounderClick = useCallback(
    (founderId: number) => {
      if (!onFounderClick) return;
      const f = foundersById.get(founderId);
      if (f) onFounderClick(f);
    },
    [foundersById, onFounderClick]
  );

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        setErr(null);
        const [reqRes, foundersRes] = await Promise.all([
          publicAPI.get<HelpRequest[]>('/help-requests/'),
          publicAPI.get<Founder[]>('/founders/'),
        ]);
        if (ignore) return;
        setHelpRequests(reqRes.data);
        setFounders(foundersRes.data);
      } catch (e) {
        if (!ignore) setErr('Failed to load help requests. Please try again.');
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [publicAPI]);

  const refreshRequests = useCallback(async () => {
    try {
      const res = await publicAPI.get<HelpRequest[]>('/help-requests/');
      setHelpRequests(res.data);
    } catch (e) {
      console.error(e);
      setErr('Failed to refresh help requests.');
    }
  }, [publicAPI]);

  const resetForm = useCallback(() => {
    setFormData({
      founder_id: currentFounder ? currentFounder.id : 0,
      title: '',
      description: '',
      category: '',
      urgency: 'Medium',
      status: 'Open',
    });
    setEditingRequest(null);
    setShowForm(false);
  }, [currentFounder]);

  const startCreate = useCallback(() => {
    setEditingRequest(null);
    setFormData({
      founder_id: currentFounder ? currentFounder.id : 0,
      title: '',
      description: '',
      category: '',
      urgency: 'Medium',
      status: 'Open',
    });
    setShowForm(true);
  }, [currentFounder]);

  const handleEdit = useCallback((request: HelpRequest) => {
    setEditingRequest(request);
    setFormData({
      founder_id: request.founder_id,
      title: request.title,
      description: request.description,
      category: request.category || '',
      urgency: (request.urgency as typeof urgencyLevels[number]) || 'Medium',
      status: (request.status as typeof statusOptions[number]) || 'Open',
    });
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      if (!window.confirm('Are you sure you want to delete this help request?')) return;
      try {
        await authenticatedAPI.delete(`/help-requests/${id}`);
        await refreshRequests();
      } catch (e) {
        console.error(e);
        setErr('Failed to delete help request.');
      }
    },
    [authenticatedAPI, refreshRequests]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.founder_id) {
        alert('No founder associated with this request. Please contact an admin.');
        return;
      }
      if (!formData.title.trim() || !formData.description.trim()) {
        alert('Title and Description are required.');
        return;
      }
      try {
        if (editingRequest) {
          await authenticatedAPI.put(`/help-requests/${editingRequest.id}`, formData);
        } else {
          await authenticatedAPI.post('/help-requests/', formData);
        }
        await refreshRequests();
        resetForm();
      } catch (e: any) {
        console.error(e);
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.detail ||
          e?.message ||
          'Failed to save help request.';
        setErr(msg);
      }
    },
    [authenticatedAPI, editingRequest, formData, refreshRequests, resetForm]
  );

  const getUrgencyClass = (urgency?: string) => {
    switch (urgency) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-orange-100 text-orange-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHelpRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return helpRequests;
    return helpRequests.filter((r) => {
      const founderName = getFounderName(r.founder_id).toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.urgency?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q) ||
        founderName.includes(q)
      );
    });
  }, [helpRequests, searchQuery, getFounderName]);

  if (loading) {
    return (
      <div className="text-center py-12" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="text-gray-600 mt-4">Loading help requests…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Help Requests</h2>
        <button
          onClick={startCreate}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
          disabled={!isAdmin && !currentFounder}
          title={!isAdmin && !currentFounder ? 'Create requires a linked founder profile' : undefined}
        >
          Add Help Request
        </button>
      </div>

      {err && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>}

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingRequest ? 'Edit Help Request' : 'Add New Help Request'}
              </h3>

              <div className="space-y-2">
                {editingRequest || isAdmin ? (
                  <CustomSelect
                    label="Founder *"
                    value={String(formData.founder_id || 0)}
                    onChange={(v) => setFormData({ ...formData, founder_id: parseInt(v || '0', 10) || 0 })}
                    options={[
                      { label: 'Select a founder', value: '0' },
                      ...founders.map((f) => ({ label: f.name, value: String(f.id) })),
                    ]}
                  />
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {currentFounder?.name || 'Current User'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <CustomSelect
                  label="Category"
                  value={formData.category || ''}
                  onChange={(v) => setFormData({ ...formData, category: v || '' })}
                  options={[{ label: 'Select a category', value: '' }, ...categories.map((c) => ({ label: c, value: c }))]}
                />
              </div>

              <div className="space-y-2">
                <CustomSelect
                  label="Urgency"
                  value={formData.urgency || 'Medium'}
                  onChange={(v) => setFormData({ ...formData, urgency: v as (typeof urgencyLevels)[number] })}
                  options={urgencyLevels.map((u) => ({ label: u, value: u }))}
                />
              </div>

              <div className="space-y-2">
                <CustomSelect
                  label="Status"
                  value={formData.status || 'Open'}
                  onChange={(v) => setFormData({ ...formData, status: v as (typeof statusOptions)[number] })}
                  options={statusOptions.map((s) => ({ label: s, value: s }))}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                  {editingRequest ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHelpRequests.map((request) => (
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

            <div className="flex flex-wrap gap-2 mb-2">
              {request.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {request.category}
                </span>
              )}

              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyClass(request.urgency)}`}>
                {request.urgency || 'Medium'}
              </span>

              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(request.status)}`}>
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
