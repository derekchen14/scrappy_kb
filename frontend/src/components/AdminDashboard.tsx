import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';
import { Founder, Startup, HelpRequest } from '../types';

interface FileUploaderProps {
  onUploaded?: () => void;
  disabled?: boolean;
}

const ACCEPTED_MIME = ['text/csv', 'application/csv', 'text/plain'];
const ACCEPT_ATTR = '.csv,text/csv';

interface UploadResult {
  created_count: number;
  errors: string[];
}

function FileUploader({ onUploaded, disabled }: FileUploaderProps) {
  const { authenticatedAPI } = useAuthenticatedAPI();
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const isAccepted = ACCEPTED_MIME.includes(file.type) || /\.csv$/i.test(file.name);

    if (!isAccepted) {
      setUploadResult({ created_count: 0, errors: ['Unsupported file type. Please upload a CSV file.'] });
      return;
    }

    setBusy(true);
    setUploadResult(null);
    try {
      const form = new FormData();
      form.append('file', file);

      const response = await authenticatedAPI.post<UploadResult>('/founders/upload-csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadResult(response.data);

      if (response.data.created_count > 0) {
        onUploaded?.();
      }
    } catch (e: any) {
      console.error('Upload failed', e);
      const errorMsg = e.response?.data?.detail || 'Upload failed. Please check the file format and try again.';
      setUploadResult({ created_count: 0, errors: [errorMsg] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} mb={2}>
        Bulk import (CSV only)
      </Typography>
      <Paper
        variant="outlined"
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
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 4,
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: dragOver ? 'primary.main' : 'divider',
          bgcolor: dragOver ? 'action.hover' : 'background.paper',
          opacity: busy || disabled ? 0.6 : 1,
          transition: 'all 0.2s',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: 'action.active' }} />
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Drag & drop your CSV file here, or{' '}
            <Button
              component="span"
              size="small"
              onClick={() => inputRef.current?.click()}
              disabled={busy || disabled}
              sx={{ textTransform: 'none', p: 0, minWidth: 0 }}
            >
              browse
            </Button>
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Max 25MB • CSV only
          </Typography>
        </Box>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={busy || disabled}
        />
      </Paper>

      {uploadResult && (
        <Box mt={2}>
          {uploadResult.created_count > 0 && (
            <Alert severity="success" sx={{ mb: 1 }}>
              Successfully created {uploadResult.created_count} new founder(s).
            </Alert>
          )}
          {uploadResult.errors.length > 0 && (
            <Alert severity="error">
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                Encountered {uploadResult.errors.length} error(s):
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0, maxHeight: 200, overflowY: 'auto' }}>
                {uploadResult.errors.map((error, index) => (
                  <li key={index}>
                    <Typography variant="caption">{error}</Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}

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

  const [query, setQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden' | 'no-auth0'>('all');

  const [mutating, setMutating] = useState<Record<number, boolean>>({});

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
      <Box textAlign="center" py={8}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You don't have admin privileges.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={8}>
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading admin dashboard…
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="end" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h3" fontWeight={700}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Welcome, {userEmail}
          </Typography>
          {lastUpdated && (
            <Typography variant="caption" color="text.disabled">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchAdminData}
        >
          Refresh
        </Button>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* Bulk Import */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Bulk import founders
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Upload a CSV table to parse and create new founder records. The process will skip any founders whose email already exists.
        </Typography>
        <FileUploader onUploaded={fetchAdminData} />
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '20%' }, p: 1.5 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary.main" fontWeight={700}>
                {nf.format(stats.totalUsers)}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Total Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '20%' }, p: 1.5 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main" fontWeight={700}>
                {nf.format(stats.totalStartups)}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Total Startups
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '20%' }, p: 1.5 }}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            onClick={() => onNavigateToTab?.('help-requests')}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="secondary.main" fontWeight={700}>
                {nf.format(stats.totalHelpRequests)}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Total Help Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '20%' }, p: 1.5 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: 'success.main' }} fontWeight={700}>
                {nf.format(liveVisibility.vis)}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Visible Profiles
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid sx={{ width: { xs: '100%', sm: '50%', md: '20%' }, p: 1.5 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: 'warning.main' }} fontWeight={700}>
                {nf.format(liveVisibility.hid)}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Hidden Profiles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" justifyContent="space-between">
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              size="small"
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as any)}
                label="Visibility"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="visible">Visible only</MenuItem>
                <MenuItem value="hidden">Hidden only</MenuItem>
                <MenuItem value="no-auth0">No Auth0 linked</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Showing {nf.format(filteredFounders.length)} of {nf.format(founders.length)}
          </Typography>
        </Box>
      </Paper>

      {/* User Management Table */}
      <Paper>
        <Box px={3} py={2} borderBottom={1} borderColor="divider">
          <Typography variant="h6" fontWeight={600}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user profiles and visibility
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Profile Status</TableCell>
                <TableCell>Auth0 Linked</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFounders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No users match your filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFounders.map((founder) => {
                  const isVisible = founder.profile_visible !== false;
                  const hasAuth0 = Boolean(founder.auth0_user_id);
                  const rowBusy = mutating[founder.id];

                  return (
                    <TableRow key={founder.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {founder.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {founder.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={isVisible ? 'Visible' : 'Hidden'}
                          size="small"
                          color={isVisible ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={hasAuth0 ? 'Yes' : 'No'}
                          size="small"
                          color={hasAuth0 ? 'info' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <IconButton
                            size="small"
                            color={isVisible ? 'warning' : 'success'}
                            onClick={() => toggleProfileVisibility(founder.id, isVisible)}
                            disabled={rowBusy}
                          >
                            {isVisible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deleteUser(founder.id)}
                            disabled={rowBusy}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
