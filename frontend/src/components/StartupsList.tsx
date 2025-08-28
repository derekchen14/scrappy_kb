import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Startup, StartupCreate, Founder } from '../types';
import Modal from './Modal';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';
import { startupAPI } from '../api';
import CustomSelect from './CustomSelect';

interface StartupsListProps {
  searchQuery?: string;
  startupToShow?: Startup | null;
  onStartupShown?: () => void;
  onFounderClick?: (founder: Founder) => void;
}

const startupStages = [
  'Ideation',
  'Validation',
  'MVP',
  'Design Partners (pre-revenue)',
  'Customers (post-revenue)',
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B or later',
  'Scaling',
];

const industries = [
  'AI/ML/Deep Learning',
  'Deeptech',
  'DevTools',
  'Infrastructure / Cloud',
  'Agents',
  'Fintech',
  'Healthtech',
  'Biotech',
  'Edtech',
  'Martech',
  'Salestech',
  'Legaltech',
  'Insurtech',
  'Proptech',
  'Foodtech',
  'Industrialtech',
  'Ecommerce / Marketplaces',
  'Consumer',
  'Gaming',
  'Robotics',
  'Hardware / Devices',
  'Wearables',
  'Climate / Energy',
  'Mobility / Transportation',
  'Aerospace',
  'Social / Community',
  'Web3 / Crypto',
  'Security / Privacy',
];

const targetMarkets = [
  'Consumers / D2C',
  'SMBs',
  'Mid-Market',
  'Enterprises',
  'Developers / Engineers',
  'Startups',
  'Public Sector / Government',
  'Healthcare Providers',
  'Educational Institutions',
  'Nonprofits',
  'Marketplaces / Platforms',
  'Internal / In-house Teams',
];

const revenueOptions = [
  'Pre-revenue',
  '$1-10K',
  '$10-25K',
  '$25-50K',
  '$50-150K',
  '$150-500K',
  '$500-1M',
  '$1M+',
];

const StartupsList: React.FC<StartupsListProps> = ({
  searchQuery = '',
  startupToShow,
  onStartupShown,
  onFounderClick,
}) => {
  const { publicAPI, authenticatedAPI } = useAuthenticatedAPI();
  const { isAdmin } = useAdmin();

  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingStartup, setEditingStartup] = useState<Startup | null>(null);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);

  const [startupFounders, setStartupFounders] = useState<Founder[]>([]);
  const [loadingFounders, setLoadingFounders] = useState(false);
  const [formData, setFormData] = useState<StartupCreate>({
    name: '',
    description: '',
    industry: '',
    stage: '',
    website_url: '',
    target_market: '',
    revenue_arr: '',
  });

  const fetchStartups = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const response = await publicAPI.get<Startup[]>('/startups/');
      setStartups(response.data);
    } catch (error) {
      console.error('Error fetching startups:', error);
      setErr('Failed to load startups. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [publicAPI]);

  useEffect(() => {
    fetchStartups();
  }, [fetchStartups]);

  const fetchStartupFounders = useCallback(
    async (startupId: number) => {
      try {
        setLoadingFounders(true);
        const response = await startupAPI.getFounders(startupId);
        setStartupFounders(response.data as Founder[]);
      } catch (error) {
        console.error('Failed to fetch startup founders:', error);
        setStartupFounders([]);
      } finally {
        setLoadingFounders(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedStartup) {
      fetchStartupFounders(selectedStartup.id);
    } else {
      setStartupFounders([]);
    }
  }, [selectedStartup, fetchStartupFounders]);

  useEffect(() => {
    if (startupToShow) {
      setSelectedStartup(startupToShow);
      onStartupShown?.();
    }
  }, [startupToShow, onStartupShown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Name is required.');
      return;
    }

    try {
      if (editingStartup) {
        await authenticatedAPI.put(`/startups/${editingStartup.id}`, formData);
      } else {
        await authenticatedAPI.post('/startups/', formData);
      }
      await fetchStartups();
      resetForm();
    } catch (error) {
      console.error('Error saving startup:', error);
      setErr('Failed to save startup. Please try again.');
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
      target_market: startup.target_market || '',
      revenue_arr: startup.revenue_arr || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this startup?')) return;

    try {
      await authenticatedAPI.delete(`/startups/${id}`);
      await fetchStartups();
    } catch (error) {
      console.error('Error deleting startup:', error);
      setErr('Failed to delete startup. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      industry: '',
      stage: '',
      website_url: '',
      target_market: '',
      revenue_arr: '',
    });
    setEditingStartup(null);
    setShowForm(false);
  };

  const handleFounderPillClick = (founder: Founder) => {
    if (onFounderClick) {
      setSelectedStartup(null);
      onFounderClick(founder);
    }
  };

  const filteredStartups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return startups;

    return startups.filter((s) => {
      const name = s.name.toLowerCase();
      const description = s.description?.toLowerCase() || '';
      const industry = s.industry?.toLowerCase() || '';
      const stage = s.stage?.toLowerCase() || '';
      const target = s.target_market?.toLowerCase() || '';
      const revenue = s.revenue_arr?.toLowerCase() || '';
      return (
        name.includes(q) ||
        description.includes(q) ||
        industry.includes(q) ||
        stage.includes(q) ||
        target.includes(q) ||
        revenue.includes(q)
      );
    });
  }, [startups, searchQuery]);

  if (loading) {
    return (
      <div className="text-center py-12" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="text-gray-600 mt-4">Loading startups…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Startups</h2>
        <button
          onClick={() => setShowForm(true)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Only admins can add startups' : undefined}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Add Startup
        </button>
      </div>

      {err && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingStartup ? 'Edit Startup' : 'Add New Startup'}
              </h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <CustomSelect
                  label="Industry"
                  value={formData.industry || ''}
                  onChange={(v) => setFormData({ ...formData, industry: v || '' })}
                  options={[{ label: 'Select an industry', value: '' }, ...industries.map((i) => ({ label: i, value: i }))]}
                />
              </div>

              <div className="space-y-2">
                <CustomSelect
                  label="Stage"
                  value={formData.stage || ''}
                  onChange={(v) => setFormData({ ...formData, stage: v || '' })}
                  options={[{ label: 'Select a stage', value: '' }, ...startupStages.map((s) => ({ label: s, value: s }))]}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Website URL</label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  onFocus={(e) => {
                    if (!e.target.value) {
                      setFormData((prev) => ({ ...prev, website_url: 'https://www.' }));
                    }
                  }}
                  inputMode="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <CustomSelect
                  label="Target Market"
                  value={formData.target_market || ''}
                  onChange={(v) => setFormData({ ...formData, target_market: v || '' })}
                  options={[{ label: 'Select a target market', value: '' }, ...targetMarkets.map((m) => ({ label: m, value: m }))]}
                />
              </div>

              <div className="space-y-2">
                <CustomSelect
                  label="Revenue ARR"
                  value={formData.revenue_arr || ''}
                  onChange={(v) => setFormData({ ...formData, revenue_arr: v || '' })}
                  options={[{ label: 'Select revenue range', value: '' }, ...revenueOptions.map((r) => ({ label: r, value: r }))]}
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
                <button
                  type="submit"
                  disabled={!isAdmin}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                >
                  {editingStartup ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStartups.map((startup) => (
          <div key={startup.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <button onClick={() => setSelectedStartup(startup)} className="text-left">
                <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                  {startup.name}
                </h3>
              </button>
              {isAdmin && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(startup)}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(startup.id)}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {startup.description && <p className="text-gray-700 mb-4">{startup.description}</p>}

            <div className="space-y-3">
              {startup.industry && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Industry:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {startup.industry}
                  </span>
                </div>
              )}

              {startup.stage && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Stage:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {startup.stage}
                  </span>
                </div>
              )}

              {startup.target_market && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Target Market:</span>
                  <span className="text-sm text-gray-600">🎯 {startup.target_market}</span>
                </div>
              )}

              {startup.revenue_arr && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Revenue ARR:</span>
                  <span className="text-sm text-gray-600">💰 {startup.revenue_arr}</span>
                </div>
              )}

              {startup.website_url && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Website:</span>
                  <a
                    href={startup.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {startup.website_url}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={selectedStartup !== null}
        onClose={() => setSelectedStartup(null)}
        title={selectedStartup?.name || ''}
      >
        {selectedStartup && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedStartup.name}</h3>

              {selectedStartup.description && (
                <p className="text-gray-700 mb-4">{selectedStartup.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedStartup.industry && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Industry:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {selectedStartup.industry}
                    </span>
                  </div>
                )}

                {selectedStartup.stage && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Stage:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {selectedStartup.stage}
                    </span>
                  </div>
                )}

                {selectedStartup.target_market && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Target Market:</span>
                    <span className="text-sm text-gray-600 flex items-center">🎯 {selectedStartup.target_market}</span>
                  </div>
                )}

                {selectedStartup.revenue_arr && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Revenue ARR:</span>
                    <span className="text-sm text-gray-600 flex items-center">💰 {selectedStartup.revenue_arr}</span>
                  </div>
                )}
              </div>

              {selectedStartup.website_url && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-700 block mb-1">Website:</span>
                  <a
                    href={selectedStartup.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {selectedStartup.website_url}
                  </a>
                </div>
              )}

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Founders
                  {loadingFounders ? '' : startupFounders.length ? ` (${startupFounders.length})` : ' (0)'}
                </h4>
                {loadingFounders ? (
                  <p className="text-sm text-gray-500">Loading founders…</p>
                ) : startupFounders.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {startupFounders.map((founder) => (
                      <span
                        key={founder.id}
                        onClick={() => handleFounderPillClick(founder)}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer transition-colors"
                      >
                        {founder.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No founders listed for this startup.</p>
                )}
              </div>
            </div>

            {isAdmin ? (
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedStartup(null);
                    handleEdit(selectedStartup);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedStartup(null);
                    handleDelete(selectedStartup.id);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedStartup(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StartupsList;
