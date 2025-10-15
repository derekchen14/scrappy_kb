import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { HelpRequest, HelpRequestCreate, Founder } from '../types';
import { useAuth0 } from '@auth0/auth0-react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';

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

  const getUrgencyColor = (urgency?: string): 'error' | 'warning' | 'success' | 'default' => {
    switch (urgency) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status?: string): 'info' | 'warning' | 'success' | 'default' => {
    switch (status) {
      case 'Open':
        return 'info';
      case 'In Progress':
        return 'warning';
      case 'Resolved':
        return 'success';
      default:
        return 'default';
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
      <Box display="flex" flexDirection="column" alignItems="center" py={8}>
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading help requests…
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3" fontWeight={700}>
          Help Requests
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={startCreate}
          disabled={!isAdmin && !currentFounder}
        >
          Add Help Request
        </Button>
      </Box>

      {err && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErr(null)}>
          {err}
        </Alert>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={resetForm} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingRequest ? 'Edit Help Request' : 'Add New Help Request'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {editingRequest || isAdmin ? (
                <FormControl fullWidth required>
                  <InputLabel>Founder</InputLabel>
                  <Select
                    value={String(formData.founder_id || 0)}
                    onChange={(e) => setFormData({ ...formData, founder_id: parseInt(e.target.value, 10) || 0 })}
                    label="Founder"
                  >
                    <MenuItem value="0">Select a founder</MenuItem>
                    {founders.map((f) => (
                      <MenuItem key={f.id} value={String(f.id)}>
                        {f.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  label="Founder"
                  value={currentFounder?.name || 'Current User'}
                  disabled
                  fullWidth
                />
              )}

              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                fullWidth
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={4}
                required
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                >
                  <MenuItem value="">Select a category</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Urgency</InputLabel>
                <Select
                  value={formData.urgency || 'Medium'}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value as typeof urgencyLevels[number] })}
                  label="Urgency"
                >
                  {urgencyLevels.map((u) => (
                    <MenuItem key={u} value={u}>
                      {u}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status || 'Open'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof statusOptions[number] })}
                  label="Status"
                >
                  {statusOptions.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetForm}>Cancel</Button>
            <Button type="submit" variant="contained" color="success">
              {editingRequest ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Help Requests Grid */}
      <Grid container spacing={3}>
        {filteredHelpRequests.map((request) => (
          <Grid key={request.id} sx={{ width: { xs: '100%', sm: '50%', lg: '33.33%' }, p: 1.5 }}>
            <Card 
              sx={{ 
                height: '350px', 
                display: 'flex', 
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h5" fontWeight={700}>
                    {request.title}
                  </Typography>
                  {canEditRequest(request) && (
                    <Box>
                      <IconButton size="small" color="primary" onClick={() => handleEdit(request)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(request.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                <Box display="flex" alignItems="center" gap={0.5} mb={2}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Requested by:
                  </Typography>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    fontWeight={500}
                    onClick={() => handleFounderClick(request.founder_id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {getFounderName(request.founder_id)}
                  </Link>
                </Box>

                <Tooltip title={request.description} arrow placement="top" enterDelay={500}>
                  <Box>
                    <Typography 
                      variant="body2" 
                      mb={2} 
                      lineHeight={1.5}
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {request.description}
                    </Typography>
                  </Box>
                </Tooltip>

                <Box flexGrow={1} />

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {request.category && (
                    <Chip label={request.category} color="secondary" size="small" />
                  )}
                  <Chip
                    label={request.urgency || 'Medium'}
                    color={getUrgencyColor(request.urgency)}
                    size="small"
                  />
                  <Chip
                    label={request.status || 'Open'}
                    color={getStatusColor(request.status)}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HelpRequestsList;
