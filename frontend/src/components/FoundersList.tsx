import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Pagination,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ViewComfy as ViewComfyIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  GitHub as GitHubIcon,
  LocationOn as LocationOnIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { Founder, FounderCreate, Skill, Startup, Hobby } from '../types';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';
import Modal from './Modal';

type ViewType = 'table' | 'card' | 'compact';
type SortType = 'none' | 'asc' | 'desc';

interface FoundersListProps {
  onStartupClick?: (startup: Startup) => void;
  founderToShow?: Founder | null;
  onFounderShown?: () => void;
  editFounderToShow?: Founder | null;
  onEditFounderShown?: () => void;
}

const FoundersList: React.FC<FoundersListProps> = ({
  onStartupClick,
  founderToShow,
  onFounderShown,
  editFounderToShow,
  onEditFounderShown,
}) => {
  const { authenticatedAPI, publicAPI } = useAuthenticatedAPI();
  const { isAdmin, canEditProfile, canDeleteUser } = useAdmin();

  const [founders, setFounders] = useState<Founder[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFounder, setEditingFounder] = useState<Founder | null>(null);
  const [viewType, setViewType] = useState<ViewType>('table');
  const [selectedFounder, setSelectedFounder] = useState<Founder | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('none');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<FounderCreate>({
    name: '',
    email: '',
    bio: '',
    location: '',
    linkedin_url: '',
    twitter_url: '',
    github_url: '',
    profile_image_url: '',
    profile_visible: true,
    auth0_user_id: undefined,
    skill_ids: [],
    startup_id: undefined,
    hobby_ids: [],
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const [foundersRes, skillsRes, startupsRes, hobbiesRes] = await Promise.all([
        publicAPI.get<Founder[]>('/founders/', { signal: controller.signal }),
        publicAPI.get<Skill[]>('/skills/', { signal: controller.signal }),
        publicAPI.get<Startup[]>('/startups/', { signal: controller.signal }),
        publicAPI.get<Hobby[]>('/hobbies/', { signal: controller.signal }),
      ]);

      setFounders(foundersRes.data);
      setSkills(skillsRes.data);
      setStartups(startupsRes.data);
      setHobbies(hobbiesRes.data);
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return;
      console.error('Error loading lists:', err);
      setErrorMsg('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [publicAPI]);

  const fetchFounders = useCallback(async () => {
    try {
      setErrorMsg(null);
      const response = await publicAPI.get<Founder[]>('/founders/');
      setFounders(response.data);
    } catch (error) {
      console.error('Error fetching founders:', error);
      setErrorMsg('Failed to refresh founders. Please try again.');
    }
  }, [publicAPI]);

  useEffect(() => {
    fetchAll();
    return () => abortRef.current?.abort();
  }, [fetchAll]);

  useEffect(() => {
    if (founderToShow) {
      setSelectedFounder(founderToShow);
      onFounderShown?.();
    }
  }, [founderToShow, onFounderShown]);

  const isProfileVisible = useCallback((f: Founder): boolean => f.profile_visible ?? true, []);

  const handleEdit = useCallback(
    (founder: Founder, skipVisibilityCheck = false) => {
      if (!canEditProfile(founder.email)) {
        alert('You can only edit your own profile.');
        return;
      }

      if (!skipVisibilityCheck && !isProfileVisible(founder)) {
        alert('This profile is marked as not visible and cannot be edited from this view.');
        return;
      }

      setEditingFounder(founder);
      setFormData({
        name: founder.name,
        email: founder.email,
        bio: founder.bio || '',
        location: founder.location || '',
        linkedin_url: founder.linkedin_url,
        twitter_url: founder.twitter_url || '',
        github_url: founder.github_url || '',
        profile_image_url: founder.profile_image_url || '',
        profile_visible: founder.profile_visible ?? true,
        auth0_user_id: founder.auth0_user_id,
        skill_ids: founder.skills.map((s) => s.id),
        startup_id: founder.startup?.id,
        hobby_ids: founder.hobbies.map((h) => h.id),
      });
      setImagePreview(founder.profile_image_url || null);
      setShowForm(true);
    },
    [canEditProfile, isProfileVisible]
  );

  useEffect(() => {
    if (editFounderToShow) {
      handleEdit(editFounderToShow, true);
      onEditFounderShown?.();
    }
  }, [editFounderToShow, onEditFounderShown, handleEdit]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const uploadImage = useCallback(async (): Promise<string | null> => {
    if (!selectedImage) return null;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedImage);
      const response = await authenticatedAPI.post('/upload-image/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.image_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Image upload failed. Please try again.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  }, [authenticatedAPI, selectedImage]);

  const handleDelete = useCallback(
    async (id: number) => {
      if (!canDeleteUser()) {
        alert('You do not have permission to delete users.');
        return;
      }
      if (!window.confirm('Are you sure you want to delete this founder?')) return;

      try {
        await authenticatedAPI.delete(`/founders/${id}`);
        await fetchFounders();
      } catch (error) {
        console.error('Error deleting founder:', error);
        alert('Failed to delete founder. Please try again.');
      }
    },
    [authenticatedAPI, canDeleteUser, fetchFounders]
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      email: '',
      bio: '',
      location: '',
      linkedin_url: '',
      twitter_url: '',
      github_url: '',
      profile_image_url: '',
      profile_visible: true,
      auth0_user_id: undefined,
      skill_ids: [],
      startup_id: undefined,
      hobby_ids: [],
    });
    setEditingFounder(null);
    setShowForm(false);
    setSelectedImage(null);
    setImagePreview(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        let finalForm = { ...formData };

        if (selectedImage) {
          const imageUrl = await uploadImage();
          if (imageUrl) finalForm.profile_image_url = imageUrl;
        }

        if (editingFounder) {
          await authenticatedAPI.put(`/founders/${editingFounder.id}`, finalForm);
        } else {
          await authenticatedAPI.post('/founders/', finalForm);
        }
        await fetchFounders();
        resetForm();
      } catch (error: any) {
        console.error('Error saving founder:', error);
        if (error?.response) {
          alert(
            `Error saving profile: ${error.response.data?.message || error.response.data?.detail || 'Server error'}.`
          );
        } else if (error?.request) {
          alert('Error saving profile: Unable to connect to server. Please check your network.');
        } else {
          alert(`Error saving profile: ${error?.message || 'Unknown error'}.`);
        }
      }
    },
    [authenticatedAPI, editingFounder, formData, selectedImage, uploadImage, fetchFounders, resetForm]
  );

  const handleSkillToggle = useCallback((skillId: number) => {
    setFormData((prev) => ({
      ...prev,
      skill_ids: prev.skill_ids?.includes(skillId)
        ? prev.skill_ids.filter((id) => id !== skillId)
        : [...(prev.skill_ids || []), skillId],
    }));
  }, []);

  const handleStartupChange = useCallback((startupId: number | undefined) => {
    setFormData((prev) => ({ ...prev, startup_id: startupId }));
  }, []);

  const handleHobbyToggle = useCallback((hobbyId: number) => {
    setFormData((prev) => ({
      ...prev,
      hobby_ids: prev.hobby_ids?.includes(hobbyId)
        ? prev.hobby_ids.filter((id) => id !== hobbyId)
        : [...(prev.hobby_ids || []), hobbyId],
    }));
  }, []);

  const truncateDescription = useCallback((text: string, maxLength = 100): string => {
    if (!text) return '';
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '…';
  }, []);

  const getFounderIndustry = useCallback((founder: Founder): string | undefined => founder.startup?.industry, []);

  const handleNameSort = useCallback(() => {
    setSortType((prev) => (prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none'));
  }, []);

  const handleStartupChipClick = useCallback(
    (startup: Startup) => {
      if (onStartupClick) {
        setSelectedFounder(null);
        onStartupClick(startup);
      } else {
        setSelectedStartup(startup);
      }
    },
    [onStartupClick]
  );

  const collator = useMemo(() => new Intl.Collator(undefined, { sensitivity: 'base' }), []);

  const filteredFounders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = founders;

    if (q) {
      result = founders.filter((f) => {
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesEmail = f.email.toLowerCase().includes(q);
        const matchesBio = f.bio?.toLowerCase().includes(q);
        const matchesLocation = f.location?.toLowerCase().includes(q);
        const matchesSkills = f.skills.some(
          (s) => s.name.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)
        );
        const matchesStartup =
          !!f.startup &&
          (f.startup.name.toLowerCase().includes(q) ||
            f.startup.industry?.toLowerCase().includes(q) ||
            f.startup.description?.toLowerCase().includes(q));
        const matchesHobbies = f.hobbies.some(
          (h) => h.name.toLowerCase().includes(q) || h.category?.toLowerCase().includes(q)
        );
        return (
          matchesName ||
          matchesEmail ||
          !!matchesBio ||
          !!matchesLocation ||
          matchesSkills ||
          !!matchesStartup ||
          matchesHobbies
        );
      });
    }

    if (sortType === 'asc') {
      result = [...result].sort((a, b) => collator.compare(a.name, b.name));
    } else if (sortType === 'desc') {
      result = [...result].sort((a, b) => collator.compare(b.name, a.name));
    }

    return result;
  }, [founders, searchQuery, sortType, collator]);

  const paginatedFounders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFounders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFounders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredFounders.length / itemsPerPage) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortType]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={8}>
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading founders…
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={3}>
          <Typography variant="h3" fontWeight={700}>
            Founders
          </Typography>

          {/* View Switcher */}
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={(_, newView) => newView && setViewType(newView)}
            size="small"
          >
            <ToggleButton value="table">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="card">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="compact">
              <ViewComfyIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          {/* Search Bar */}
          <TextField
            placeholder="Search founders…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {isAdmin && (
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
            >
              Add Founder
            </Button>
          )}
        </Box>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={resetForm} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingFounder ? 'Edit Founder' : 'Add New Founder'}
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
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isAdmin}
                required
                fullWidth
                helperText={!isAdmin ? 'Email cannot be changed' : ''}
              />

              <TextField
                label="Bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />

              <TextField
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                fullWidth
              />

              <TextField
                label="LinkedIn URL"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                onFocus={(e) => {
                  if (!e.target.value) setFormData((p) => ({ ...p, linkedin_url: 'https://www.linkedin.com/in/' }));
                }}
                required
                fullWidth
              />

              <TextField
                label="Twitter URL"
                type="url"
                value={formData.twitter_url}
                onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                onFocus={(e) => {
                  if (!e.target.value) setFormData((p) => ({ ...p, twitter_url: 'https://www.twitter.com/' }));
                }}
                fullWidth
              />

              <TextField
                label="GitHub URL"
                type="url"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                onFocus={(e) => {
                  if (!e.target.value) setFormData((p) => ({ ...p, github_url: 'https://www.github.com/' }));
                }}
                fullWidth
              />

              <Box>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Profile Image
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'block', marginBottom: '8px' }}
                />
                {imagePreview && (
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Preview"
                    sx={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: 2, borderColor: 'divider' }}
                  />
                )}
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.profile_visible}
                    onChange={(e) => setFormData({ ...formData, profile_visible: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Profile Visible</Typography>
                    <Typography variant="caption" color="text.secondary">
                      When unchecked, only name and bio will be visible to others
                    </Typography>
                  </Box>
                }
              />

              <Box>
                <Typography variant="subtitle2" mb={1}>
                  Skills
                </Typography>
                <FormGroup sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                  {skills.map((skill) => (
                    <FormControlLabel
                      key={skill.id}
                      control={
                        <Checkbox
                          checked={formData.skill_ids?.includes(skill.id) || false}
                          onChange={() => handleSkillToggle(skill.id)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{skill.name}</Typography>}
                    />
                  ))}
                </FormGroup>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Startup</InputLabel>
                <Select
                  value={formData.startup_id != null ? String(formData.startup_id) : ''}
                  onChange={(e) => handleStartupChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  label="Startup"
                >
                  <MenuItem value="">No startup</MenuItem>
                  {startups.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography variant="subtitle2" mb={1}>
                  Hobbies
                </Typography>
                <FormGroup sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, maxHeight: 200, overflowY: 'auto' }}>
                  {hobbies.map((hobby) => (
                    <FormControlLabel
                      key={hobby.id}
                      control={
                        <Checkbox
                          checked={formData.hobby_ids?.includes(hobby.id) || false}
                          onChange={() => handleHobbyToggle(hobby.id)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{hobby.name}</Typography>}
                    />
                  ))}
                </FormGroup>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetForm}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={uploadingImage}>
              {uploadingImage ? 'Uploading…' : editingFounder ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Table View */}
      {viewType === 'table' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={handleNameSort}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      NAME
                    </Typography>
                    {sortType === 'asc' && <ArrowUpwardIcon fontSize="small" />}
                    {sortType === 'desc' && <ArrowDownwardIcon fontSize="small" />}
                  </Box>
                </TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Skills</TableCell>
                <TableCell>Startup</TableCell>
                <TableCell>Hobbies</TableCell>
                {isAdmin && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedFounders.map((founder) => (
                <TableRow key={founder.id} hover>
                  <TableCell>
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                        onClick={() => {
                          if (!isProfileVisible(founder)) {
                            alert('This profile is marked as not visible and details cannot be viewed.');
                            return;
                          }
                          setSelectedFounder(founder);
                        }}
                      >
                        {founder.name}
                      </Typography>
                      {isProfileVisible(founder) && founder.linkedin_url && (
                        <Link href={founder.linkedin_url} target="_blank" rel="noopener" variant="caption">
                          LinkedIn
                        </Link>
                      )}
                      {!isProfileVisible(founder) && (
                        <Typography variant="caption" color="text.disabled">
                          (profile hidden)
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {isProfileVisible(founder) ? founder.email : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {founder.location || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {founder.skills.slice(0, 2).map((skill) => (
                        <Chip key={skill.id} label={skill.name} size="small" color="primary" variant="outlined" />
                      ))}
                      {founder.skills.length > 2 && (
                        <Chip label={`+${founder.skills.length - 2}`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {founder.startup ? (
                      <Chip
                        label={founder.startup.name}
                        size="small"
                        color="success"
                        variant="outlined"
                        onClick={() => handleStartupChipClick(founder.startup!)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No startup
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {founder.hobbies.slice(0, 3).map((hobby) => (
                        <Chip key={hobby.id} label={hobby.name} size="small" color="secondary" variant="outlined" />
                      ))}
                      {founder.hobbies.length > 3 && (
                        <Chip label={`+${founder.hobbies.length - 3}`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {canEditProfile(founder.email) && (
                          <IconButton size="small" color="primary" onClick={() => handleEdit(founder)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        {canDeleteUser() && (
                          <IconButton size="small" color="error" onClick={() => handleDelete(founder.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Card View */}
      {viewType === 'card' && (
        <Grid container spacing={3}>
          {paginatedFounders.map((founder) => (
            <Grid key={founder.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 1.5 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      {founder.name}
                    </Typography>
                    {isAdmin && (
                      <Box>
                        {canEditProfile(founder.email) && (
                          <IconButton size="small" color="primary" onClick={() => handleEdit(founder)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        {canDeleteUser() && (
                          <IconButton size="small" color="error" onClick={() => handleDelete(founder.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </Box>

                  {isProfileVisible(founder) && (
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {founder.email}
                    </Typography>
                  )}
                  {founder.bio && (
                    <Typography variant="body2" mb={2}>
                      {founder.bio}
                    </Typography>
                  )}
                  {founder.location && (
                    <Box display="flex" alignItems="center" gap={0.5} mb={2}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {founder.location}
                      </Typography>
                    </Box>
                  )}

                  {isProfileVisible(founder) && (
                    <Box display="flex" gap={1} mb={2}>
                      {founder.linkedin_url && (
                        <IconButton size="small" href={founder.linkedin_url} target="_blank" rel="noopener">
                          <LinkedInIcon fontSize="small" />
                        </IconButton>
                      )}
                      {founder.twitter_url && (
                        <IconButton size="small" href={founder.twitter_url} target="_blank" rel="noopener">
                          <TwitterIcon fontSize="small" />
                        </IconButton>
                      )}
                      {founder.github_url && (
                        <IconButton size="small" href={founder.github_url} target="_blank" rel="noopener">
                          <GitHubIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}

                  {founder.skills.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary" mb={1}>
                        Skills
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {founder.skills.map((skill) => (
                          <Chip key={skill.id} label={skill.name} size="small" color="primary" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {founder.startup && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="text.secondary" mb={1}>
                        Startup
                      </Typography>
                      <Chip
                        label={founder.startup.name}
                        size="small"
                        color="success"
                        variant="outlined"
                        onClick={() => handleStartupChipClick(founder.startup!)}
                        sx={{ cursor: 'pointer' }}
                        icon={<BusinessIcon />}
                      />
                    </Box>
                  )}

                  {founder.hobbies.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" mb={1}>
                        Hobbies
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {founder.hobbies.map((hobby) => (
                          <Chip key={hobby.id} label={hobby.name} size="small" color="secondary" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Compact View */}
      {viewType === 'compact' && (
        <Grid container spacing={2}>
          {paginatedFounders.map((founder) => (
            <Grid key={founder.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%', xl: '16.67%' }, p: 1 }}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                  transition: 'box-shadow 0.3s',
                }}
                onClick={() => {
                  if (!isProfileVisible(founder)) {
                    alert('This profile is marked as not visible and details cannot be viewed.');
                    return;
                  }
                  setSelectedFounder(founder);
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {founder.name}
                    </Typography>
                    {getFounderIndustry(founder) && (
                      <Chip
                        label={getFounderIndustry(founder)}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  {founder.bio && (
                    <Typography variant="caption" color="text.secondary">
                      {truncateDescription(founder.bio, 80)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {filteredFounders.length > itemsPerPage && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Founder Details Modal */}
      <Modal
        isOpen={selectedFounder !== null}
        onClose={() => setSelectedFounder(null)}
        title={selectedFounder?.name || ''}
        maxWidth="md"
      >
        {selectedFounder && (
          <Box>
            <Box mb={3}>
              {isProfileVisible(selectedFounder) && (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {selectedFounder.email}
                </Typography>
              )}
              {selectedFounder.bio && (
                <Typography variant="body1" mb={2}>
                  {selectedFounder.bio}
                </Typography>
              )}
              {selectedFounder.location && (
                <Box display="flex" alignItems="center" gap={0.5} mb={2}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2">{selectedFounder.location}</Typography>
                </Box>
              )}

              {isProfileVisible(selectedFounder) && (
                <Box display="flex" gap={2} mb={3}>
                  {selectedFounder.linkedin_url && (
                    <Button
                      size="small"
                      startIcon={<LinkedInIcon />}
                      href={selectedFounder.linkedin_url}
                      target="_blank"
                      rel="noopener"
                    >
                      LinkedIn
                    </Button>
                  )}
                  {selectedFounder.twitter_url && (
                    <Button
                      size="small"
                      startIcon={<TwitterIcon />}
                      href={selectedFounder.twitter_url}
                      target="_blank"
                      rel="noopener"
                    >
                      Twitter
                    </Button>
                  )}
                  {selectedFounder.github_url && (
                    <Button
                      size="small"
                      startIcon={<GitHubIcon />}
                      href={selectedFounder.github_url}
                      target="_blank"
                      rel="noopener"
                    >
                      GitHub
                    </Button>
                  )}
                </Box>
              )}

              {selectedFounder.skills && selectedFounder.skills.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    Skills
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedFounder.skills.map((skill) => (
                      <Chip key={skill.id} label={skill.name} size="small" color="primary" />
                    ))}
                  </Box>
                </Box>
              )}

              {selectedFounder.startup && (
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    Startup
                  </Typography>
                  <Chip
                    label={selectedFounder.startup.name}
                    color="success"
                    onClick={() => handleStartupChipClick(selectedFounder.startup!)}
                    sx={{ cursor: 'pointer' }}
                    icon={<BusinessIcon />}
                  />
                </Box>
              )}

              {selectedFounder.hobbies && selectedFounder.hobbies.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    Hobbies
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedFounder.hobbies.map((hobby) => (
                      <Chip key={hobby.id} label={hobby.name} size="small" color="secondary" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            <Box display="flex" justifyContent="flex-end" gap={2} pt={2} borderTop={1} borderColor="divider">
              {canEditProfile(selectedFounder?.email) && (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    const f = selectedFounder;
                    setSelectedFounder(null);
                    if (f) handleEdit(f);
                  }}
                >
                  Edit
                </Button>
              )}
              {canDeleteUser() && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    const id = selectedFounder.id;
                    setSelectedFounder(null);
                    handleDelete(id);
                  }}
                >
                  Delete
                </Button>
              )}
              {!canEditProfile(selectedFounder?.email) && !canDeleteUser() && (
                <Button variant="outlined" onClick={() => setSelectedFounder(null)}>
                  Close
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Modal>

      {/* Startup Details Modal */}
      <Modal
        isOpen={selectedStartup !== null}
        onClose={() => setSelectedStartup(null)}
        title={selectedStartup?.name || ''}
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
                    <Chip label={selectedStartup.industry} color="secondary" size="small" />
                  </Box>
                </Grid>
              )}
              {selectedStartup.stage && (
                <Grid sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Stage
                  </Typography>
                  <Box mt={0.5}>
                    <Chip label={selectedStartup.stage} color="success" size="small" />
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

            <Box display="flex" justifyContent="flex-end" pt={2} borderTop={1} borderColor="divider">
              <Button variant="outlined" onClick={() => setSelectedStartup(null)}>
                Close
              </Button>
            </Box>
          </Box>
        )}
      </Modal>
    </Box>
  );
};

export default FoundersList;
