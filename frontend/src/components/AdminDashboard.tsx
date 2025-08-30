import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';
import { Founder, Startup, HelpRequest } from '../types';
import CustomSelect from './CustomSelect';

/* =========================
   FileUploader (Admin only) - UPDATED
   - Now handles detailed API response for CSV uploads
   ========================= */
interface FileUploaderProps {
  onUploaded?: () => void;
  disabled?: boolean;
}

// Restrict to CSV MIME types
const ACCEPTED_MIME = [
  'text/csv',
  'application/csv',
  'text/plain', // Often used for CSV
];

// Update accept attribute for file input
const ACCEPT_ATTR = '.csv,text/csv';

// Define a type for the upload result state
interface UploadResult {
  created_count: number;
  errors: string[];
}

function FileUploader({ onUploaded, disabled }: FileUploaderProps) {
  const { authenticatedAPI } = useAuthenticatedAPI();
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  // State to hold structured upload results
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Updated validation for CSV files only
    const isAccepted = ACCEPTED_MIME.includes(file.type) || /\.csv$/i.test(file.name);

    if (!isAccepted) {
        setUploadResult({ created_count: 0, errors: ['Unsupported file type. Please upload a CSV file.'] });
        return;
    }

    setBusy(true);
    setUploadResult(null); // Clear previous results
    try {
      const form = new FormData();
      form.append('file', file);

      // 1. --- API ENDPOINT UPDATED ---
      // Use the new endpoint for CSV uploads
      const response = await authenticatedAPI.post<UploadResult>('/founders/upload-csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 2. --- DETAILED RESPONSE HANDLING ---
      // Set the structured result from the API
      setUploadResult(response.data);
      
      // Refresh parent data if at least one founder was created
      if (response.data.created_count > 0) {
        onUploaded?.();
      }

    } catch (e: any) {
      console.error('Upload failed', e);
      // Handle network or server errors
      const errorMsg = e.response?.data?.detail || 'Upload failed. Please check the file format and try again.';
      setUploadResult({ created_count: 0, errors: [errorMsg] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-900">Bulk import (CSV only)</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'} 
          ${busy || disabled ? 'opacity-60' : 'hover:bg-gray-50'}`}
      >
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v4h16v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="text-sm text-gray-700">
          Drag & drop your CSV file here, or{' '}
          <button
            type="button"
            className="font-medium text-blue-600 hover:underline focus:outline-none"
            onClick={() => inputRef.current?.click()}
            disabled={busy || disabled}
          >
            browse
          </button>
        </div>
        {/* 3. --- UI TEXT UPDATED --- */}
        <div className="text-xs text-gray-500">Max 25MB • CSV only</div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={busy || disabled}
        />
      </div>

      {/* 4. --- DETAILED RESULT DISPLAY --- */}
      {uploadResult && (
        <div className="text-sm space-y-3">
          {uploadResult.created_count > 0 && (
            <div className="rounded-md bg-green-50 p-3">
              <p className="font-medium text-green-800">
                Successfully created {uploadResult.created_count} new founder(s).
              </p>
            </div>
          )}
          {uploadResult.errors.length > 0 && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="font-medium text-red-800 mb-2">
                Encountered {uploadResult.errors.length} error(s):
              </p>
              <ul className="list-disc list-inside space-y-1 text-red-700 max-h-48 overflow-y-auto">
                {uploadResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


/* =========================
   Admin Dashboard (No changes needed below this line)
   ========================= */

interface AdminStats {
  totalUsers: number;
  totalStartups: number;
  totalHelpRequests: number;
  visibleProfiles: number;
  hiddenProfiles: number;
}

type Tab = 'founders' | 'startups' | 'help-requests' | 'events' | 'admin';

interface AdminDashboardProps {
  onNavigateToTab?: (tab: Tab) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToTab }) => {
  const { publicAPI, authenticatedAPI } = useAuthenticatedAPI();
  const { isAdmin, userEmail } = useAdmin();

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalStartups: 0,
    totalHelpRequests: 0,
    visibleProfiles: 0,
    hiddenProfiles: 0,
  });
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // UI helpers
  const [query, setQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden' | 'no-auth0'>('all');

  // Row-level mutation flags
  const [mutating, setMutating] = useState<Record<number, boolean>>({});

  // Abort in-flight fetch
  const fetchAbort = useRef<AbortController | null>(null);

  const nf = useMemo(() => new Intl.NumberFormat(), []);

  const fetchAdminData = useCallback(async () => {
    try {
      setErrorMsg(null);
      setLoading(true);

      fetchAbort.current?.abort();
      const controller = new AbortController();
      fetchAbort.current = controller;

      const [foundersRes, startupsRes, helpRequestsRes] = await Promise.all([
        publicAPI.get<Founder[]>('/founders/?limit=1000', { signal: controller.signal }),
        publicAPI.get<Startup[]>('/startups/?limit=1000', { signal: controller.signal }),
        publicAPI.get<HelpRequest[]>('/help-requests/?limit=1000', { signal: controller.signal }),
      ]);

      const foundersData = foundersRes.data;
      const startupsData = startupsRes.data;
      const helpRequestsData = helpRequestsRes.data;

      let visible = 0;
      let hidden = 0;
      for (const f of foundersData) {
        if (f.profile_visible !== false) visible += 1;
        else hidden += 1;
      }

      setFounders(foundersData);
      setStats({
        totalUsers: foundersData.length,
        totalStartups: startupsData.length,
        totalHelpRequests: helpRequestsData.length,
        visibleProfiles: visible,
        hiddenProfiles: hidden,
      });
      setLastUpdated(Date.now());
    } catch (err: any) {
      const code = err?.code || err?.name;
      if (code === 'ERR_CANCELED' || code === 'CanceledError' || code === 'AbortError') {
        // ignored
      } else {
        console.error('Error fetching admin data:', err);
        setErrorMsg('Failed to load admin data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [publicAPI]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAdminData();
    return () => {
      fetchAbort.current?.abort();
    };
  }, [isAdmin, fetchAdminData]);

  // Derived filtered founders
  const filteredFounders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return founders.filter((f) => {
      const isVisible = f.profile_visible !== false;
      const hasAuth0 = Boolean(f.auth0_user_id);

      if (visibilityFilter === 'visible' && !isVisible) return false;
      if (visibilityFilter === 'hidden' && isVisible) return false;
      if (visibilityFilter === 'no-auth0' && hasAuth0) return false;

      if (!q) return true;
      const hay = `${f.name ?? ''} ${f.email ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [founders, query, visibilityFilter]);

  // Recompute live visibility
  const liveVisibility = useMemo(() => {
    let vis = 0;
    let hid = 0;
    for (const f of founders) {
      if (f.profile_visible !== false) vis += 1;
      else hid += 1;
    }
    return { vis, hid };
  }, [founders]);

  const setRowMutating = (id: number, val: boolean) => {
    setMutating((m) => ({ ...m, [id]: val }));
  };

  const toggleProfileVisibility = useCallback(
    async (founderId: number, currentVisibility: boolean) => {
      const target = founders.find((f) => f.id === founderId);
      if (!target) return;

      const previous = target.profile_visible !== false;
      const next = !currentVisibility;

      setRowMutating(founderId, true);
      setFounders((prev) =>
        prev.map((f) => (f.id === founderId ? { ...f, profile_visible: next } : f))
      );

      try {
        await authenticatedAPI.put(`/founders/${founderId}`, {
          ...target,
          profile_visible: next,
        });
      } catch (err) {
        console.error('Error toggling profile visibility:', err);
        setFounders((prev) =>
          prev.map((f) => (f.id === founderId ? { ...f, profile_visible: previous } : f))
        );
        setErrorMsg('Failed to update visibility. Please retry.');
      } finally {
        setRowMutating(founderId, false);
      }
    },
    [authenticatedAPI, founders]
  );

  const deleteUser = useCallback(
    async (founderId: number) => {
      const target = founders.find((f) => f.id === founderId);
      if (!target) return;

      if (!window.confirm(`Are you sure you want to delete ${target.name}? This action cannot be undone.`)) {
        return;
      }

      setRowMutating(founderId, true);
      const snapshot = founders;
      setFounders((prev) => prev.filter((f) => f.id !== founderId));

      try {
        await authenticatedAPI.delete(`/founders/${founderId}`);
        setStats((s) => ({ ...s, totalUsers: s.totalUsers - 1 }));
      } catch (err) {
        console.error('Error deleting user:', err);
        setFounders(snapshot);
        setErrorMsg('Failed to delete user. Please retry.');
      } finally {
        setRowMutating(founderId, false);
      }
    },
    [authenticatedAPI, founders]
  );

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don&apos;t have admin privileges.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12" aria-busy="true" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading admin dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {userEmail}</p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAdminData}
            className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            title="Refresh data"
          >
            Refresh
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      {/* Admin-only bulk import */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Bulk import founders</h2>
        <p className="text-gray-600 mb-4">
          Upload a CSV table to parse and create new founder records. The process will skip any founders whose email already exists.
        </p>
        <FileUploader onUploaded={fetchAdminData} />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{nf.format(stats.totalUsers)}</div>
          <div className="text-sm font-medium text-gray-700">Total Users</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{nf.format(stats.totalStartups)}</div>
          <div className="text-sm font-medium text-gray-700">Total Startups</div>
        </div>

        <button
          type="button"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow"
          onClick={() => onNavigateToTab?.('help-requests')}
        >
          <div className="text-3xl font-bold text-purple-600">{nf.format(stats.totalHelpRequests)}</div>
          <div className="text-sm font-medium text-gray-700">Total Help Requests</div>
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-emerald-600">{nf.format(liveVisibility.vis)}</div>
          <div className="text-sm font-medium text-gray-700">Visible Profiles</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{nf.format(liveVisibility.hid)}</div>
          <div className="text-sm font-medium text-gray-700">Hidden Profiles</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search by name or email"
            className="w-full sm:w-72 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <CustomSelect
            label="Visibility"
            value={visibilityFilter}
            onChange={setVisibilityFilter}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Visible only', value: 'visible' },
              { label: 'Hidden only', value: 'hidden' },
              { label: 'No Auth0 linked', value: 'no-auth0' },
            ]}
          />
        </div>
        <div className="text-xs text-gray-500">
          Showing {nf.format(filteredFounders.length)} of {nf.format(founders.length)}
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user profiles and visibility</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profile Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auth0 Linked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredFounders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                filteredFounders.map((founder) => {
                  const isVisible = founder.profile_visible !== false;
                  const hasAuth0 = Boolean(founder.auth0_user_id);
                  const rowBusy = mutating[founder.id];

                  return (
                    <tr key={founder.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{founder.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="truncate max-w-[18rem] inline-block align-middle">
                          {founder.email}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isVisible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                          title={isVisible ? 'Profile is visible' : 'Profile is hidden'}
                        >
                          {isVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            hasAuth0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}
                          title={hasAuth0 ? 'Linked to Auth0' : 'No Auth0 user id'}
                        >
                          {hasAuth0 ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => toggleProfileVisibility(founder.id, isVisible)}
                          disabled={rowBusy}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                            isVisible
                              ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {isVisible ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => deleteUser(founder.id)}
                          disabled={rowBusy}
                          className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;