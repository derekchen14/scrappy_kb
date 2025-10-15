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
  Divider,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { Startup, StartupCreate, Founder } from '../types';
import Modal from './Modal';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';
import { startupAPI } from '../api';

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
      <Box display="flex" flexDirection="column" alignItems="center" py={8}>
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading startups…
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3" fontWeight={700}>
          Startups
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
          disabled={!isAdmin}
        >
          Add Startup
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
            {editingStartup ? 'Edit Startup' : 'Add New Startup'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Industry</InputLabel>
                <Select
                  value={formData.industry || ''}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  label="Industry"
                >
                  <MenuItem value="">Select an industry</MenuItem>
                  {industries.map((i) => (
                    <MenuItem key={i} value={i}>
                      {i}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Stage</InputLabel>
                <Select
                  value={formData.stage || ''}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  label="Stage"
                >
                  <MenuItem value="">Select a stage</MenuItem>
                  {startupStages.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Website URL"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                onFocus={(e) => {
                  if (!e.target.value) {
                    setFormData((prev) => ({ ...prev, website_url: 'https://www.' }));
                  }
                }}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Target Market</InputLabel>
                <Select
                  value={formData.target_market || ''}
                  onChange={(e) => setFormData({ ...formData, target_market: e.target.value })}
                  label="Target Market"
                >
                  <MenuItem value="">Select a target market</MenuItem>
                  {targetMarkets.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Revenue ARR</InputLabel>
                <Select
                  value={formData.revenue_arr || ''}
                  onChange={(e) => setFormData({ ...formData, revenue_arr: e.target.value })}
                  label="Revenue ARR"
                >
                  <MenuItem value="">Select revenue range</MenuItem>
                  {revenueOptions.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetForm}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={!isAdmin}>
              {editingStartup ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Startups List */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mx: -1 }}>
        {filteredStartups.map((startup) => (
          <Box key={startup.id} sx={{ flex: { xs: '1 1 100%', md: '0 0 calc(33.333% - 11px)' }, minWidth: 0, maxWidth: { xs: '100%', md: 'calc(33.333% - 11px)' } }}>
            <Card
              sx={{ 
                height: '350px',
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedStartup(startup)}
            >
              <CardContent sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h5" fontWeight={700}>
                    {startup.name}
                  </Typography>
                  {isAdmin && (
                    <Box onClick={(e) => e.stopPropagation()}>
                      <IconButton size="small" color="primary" onClick={() => handleEdit(startup)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(startup.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {startup.description && (
                  <Tooltip title={startup.description} arrow placement="top" enterDelay={500}>
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
                        {startup.description}
                      </Typography>
                    </Box>
                  </Tooltip>
                )}

                <Box flexGrow={1}>
                  {(startup.industry || startup.stage) && (
                    <Box mb={2}>
                      <Box display="flex" gap={2}>
                        {startup.industry && (
                          <Box flex={1}>
                            <Typography variant="caption" fontWeight={600} mb={1} display="block" color="text.secondary">
                              INDUSTRY
                            </Typography>
                            <Chip label={startup.industry} color="secondary" size="small" />
                          </Box>
                        )}
                        {startup.stage && (
                          <Box flex={1}>
                            <Typography variant="caption" fontWeight={600} mb={1} display="block" color="text.secondary">
                              STAGE
                            </Typography>
                            <Chip label={startup.stage} color="success" size="small" />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}

                  {(startup.target_market || startup.revenue_arr) && (
                    <Box mb={2}>
                      <Box display="flex" gap={2}>
                        {startup.target_market && (
                          <Box flex={1}>
                            <Typography variant="caption" fontWeight={600} mb={1} display="block" color="text.secondary">
                              TARGET MARKET
                            </Typography>
                            <Typography variant="body2">
                              🎯 {startup.target_market}
                            </Typography>
                          </Box>
                        )}
                        {startup.revenue_arr && (
                          <Box flex={1}>
                            <Typography variant="caption" fontWeight={600} mb={1} display="block" color="text.secondary">
                              REVENUE ARR
                            </Typography>
                            <Typography variant="body2">
                              💰 {startup.revenue_arr}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>

                {startup.website_url && (
                  <Box mt={2} pt={2} borderTop={1} borderColor="divider">
                    <Link
                      href={startup.website_url}
                      target="_blank"
                      rel="noopener"
                      variant="body2"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <LanguageIcon fontSize="small" />
                      Website
                    </Link>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Startup Details Modal */}
      <Modal
        isOpen={selectedStartup !== null}
        onClose={() => setSelectedStartup(null)}
        title={selectedStartup?.name || ''}
        maxWidth="md"
      >
        {selectedStartup && (
          <Box>
            {selectedStartup.description && (
              <Typography variant="body1" mb={3}>
                {selectedStartup.description}
              </Typography>
            )}

            <Grid container spacing={2} mb={3}>
              {selectedStartup.industry && (
                <Grid sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Industry
                  </Typography>
                  <Box mt={0.5}>
                    <Chip label={selectedStartup.industry} color="secondary" />
                  </Box>
                </Grid>
              )}
              {selectedStartup.stage && (
                <Grid sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Stage
                  </Typography>
                  <Box mt={0.5}>
                    <Chip label={selectedStartup.stage} color="success" />
                  </Box>
                </Grid>
              )}
              {selectedStartup.target_market && (
                <Grid sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Target Market
                  </Typography>
                  <Typography variant="body2" mt={0.5}>
                    🎯 {selectedStartup.target_market}
                  </Typography>
                </Grid>
              )}
              {selectedStartup.revenue_arr && (
                <Grid sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Revenue ARR
                  </Typography>
                  <Typography variant="body2" mt={0.5}>
                    💰 {selectedStartup.revenue_arr}
                  </Typography>
                </Grid>
              )}
            </Grid>

            {selectedStartup.website_url && (
              <Box mb={3}>
                <Typography variant="caption" color="text.secondary">
                  Website
                </Typography>
                <Box mt={0.5}>
                  <Link href={selectedStartup.website_url} target="_blank" rel="noopener">
                    {selectedStartup.website_url}
                  </Link>
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" mb={2}>
                Founders
                {!loadingFounders && ` (${startupFounders.length})`}
              </Typography>
              {loadingFounders ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Loading founders…
                  </Typography>
                </Box>
              ) : startupFounders.length > 0 ? (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {startupFounders.map((founder) => (
                    <Chip
                      key={founder.id}
                      label={founder.name}
                      onClick={() => handleFounderPillClick(founder)}
                      color="primary"
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No founders listed for this startup.
                </Typography>
              )}
            </Box>

            <Box display="flex" justifyContent="flex-end" gap={2} pt={3} mt={3} borderTop={1} borderColor="divider">
              {isAdmin ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setSelectedStartup(null);
                      handleEdit(selectedStartup);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setSelectedStartup(null);
                      handleDelete(selectedStartup.id);
                    }}
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <Button variant="outlined" onClick={() => setSelectedStartup(null)}>
                  Close
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Modal>
    </Box>
  );
};

export default StartupsList;
