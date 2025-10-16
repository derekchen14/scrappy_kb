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
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  LinkedIn as LinkedInIcon,
  X as XIcon,
  GitHub as GitHubIcon,
  LocationOn as LocationOnIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Founder, FounderCreate, Skill, Startup, Hobby } from '../types';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';
import Modal from './Modal';

type ViewType = 'table' | 'card';
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
  
  // Filter states
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [selectedHobbyIds, setSelectedHobbyIds] = useState<number[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [hobbySearchQuery, setHobbySearchQuery] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [showHobbyDropdown, setShowHobbyDropdown] = useState(false);

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

  // Filtered skills based on search query
  const filteredSkills = useMemo(() => {
    if (!skillSearchQuery.trim()) return skills.slice(0, 6);
    const q = skillSearchQuery.toLowerCase();
    return skills.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6);
  }, [skills, skillSearchQuery]);

  // Filtered hobbies based on search query
  const filteredHobbies = useMemo(() => {
    if (!hobbySearchQuery.trim()) return hobbies.slice(0, 6);
    const q = hobbySearchQuery.toLowerCase();
    return hobbies.filter((h) => h.name.toLowerCase().includes(q)).slice(0, 6);
  }, [hobbies, hobbySearchQuery]);

  const filteredFounders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = founders;

    // Apply text search filter
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

    // Apply skill filter
    if (selectedSkillIds.length > 0) {
      result = result.filter((f) =>
        selectedSkillIds.every((skillId) => f.skills.some((s) => s.id === skillId))
      );
    }

    // Apply hobby filter
    if (selectedHobbyIds.length > 0) {
      result = result.filter((f) =>
        selectedHobbyIds.every((hobbyId) => f.hobbies.some((h) => h.id === hobbyId))
      );
    }

    // Apply sorting
    if (sortType === 'asc') {
      result = [...result].sort((a, b) => collator.compare(a.name, b.name));
    } else if (sortType === 'desc') {
      result = [...result].sort((a, b) => collator.compare(b.name, a.name));
    }

    return result;
  }, [founders, searchQuery, sortType, collator, selectedSkillIds, selectedHobbyIds]);

  const paginatedFounders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFounders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFounders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredFounders.length / itemsPerPage) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortType, selectedSkillIds, selectedHobbyIds]);

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
          </ToggleButtonGroup>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
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

      {/* Filters Row */}
      <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
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

        {/* Skills Filter */}
        <Box sx={{ position: 'relative', minWidth: 250 }}>
          <TextField
            placeholder="Filter by skills…"
            value={skillSearchQuery}
            onChange={(e) => setSkillSearchQuery(e.target.value)}
            onFocus={() => setShowSkillDropdown(true)}
            onBlur={() => setTimeout(() => setShowSkillDropdown(false), 200)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          {showSkillDropdown && filteredSkills.length > 0 && (
            <Paper
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                mt: 0.5,
                maxHeight: 200,
                overflow: 'auto',
                zIndex: 1000,
              }}
            >
              {filteredSkills.map((skill) => (
                <Box
                  key={skill.id}
                  sx={{
                    p: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => {
                    if (!selectedSkillIds.includes(skill.id)) {
                      setSelectedSkillIds([...selectedSkillIds, skill.id]);
                    }
                    setSkillSearchQuery('');
                    setShowSkillDropdown(false);
                  }}
                >
                  <Typography variant="body2">{skill.name}</Typography>
                  {selectedSkillIds.includes(skill.id) && (
                    <Chip label="Selected" size="small" color="primary" />
                  )}
                </Box>
              ))}
            </Paper>
          )}
        </Box>

        {/* Hobbies Filter */}
        <Box sx={{ position: 'relative', minWidth: 250 }}>
          <TextField
            placeholder="Filter by hobbies…"
            value={hobbySearchQuery}
            onChange={(e) => setHobbySearchQuery(e.target.value)}
            onFocus={() => setShowHobbyDropdown(true)}
            onBlur={() => setTimeout(() => setShowHobbyDropdown(false), 200)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          {showHobbyDropdown && filteredHobbies.length > 0 && (
            <Paper
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                mt: 0.5,
                maxHeight: 200,
                overflow: 'auto',
                zIndex: 1000,
              }}
            >
              {filteredHobbies.map((hobby) => (
                <Box
                  key={hobby.id}
                  sx={{
                    p: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => {
                    if (!selectedHobbyIds.includes(hobby.id)) {
                      setSelectedHobbyIds([...selectedHobbyIds, hobby.id]);
                    }
                    setHobbySearchQuery('');
                    setShowHobbyDropdown(false);
                  }}
                >
                  <Typography variant="body2">{hobby.name}</Typography>
                  {selectedHobbyIds.includes(hobby.id) && (
                    <Chip label="Selected" size="small" color="secondary" />
                  )}
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      </Box>

      {/* Selected Filters Display */}
      {(selectedSkillIds.length > 0 || selectedHobbyIds.length > 0) && (
        <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
          {selectedSkillIds.map((skillId) => {
            const skill = skills.find((s) => s.id === skillId);
            return skill ? (
              <Chip
                key={skillId}
                label={skill.name}
                color="primary"
                onDelete={() => setSelectedSkillIds(selectedSkillIds.filter((id) => id !== skillId))}
                deleteIcon={<CloseIcon />}
              />
            ) : null;
          })}
          {selectedHobbyIds.map((hobbyId) => {
            const hobby = hobbies.find((h) => h.id === hobbyId);
            return hobby ? (
              <Chip
                key={hobbyId}
                label={hobby.name}
                color="secondary"
                onDelete={() => setSelectedHobbyIds(selectedHobbyIds.filter((id) => id !== hobbyId))}
                deleteIcon={<CloseIcon />}
              />
            ) : null;
          })}
          {(selectedSkillIds.length > 0 || selectedHobbyIds.length > 0) && (
            <Button
              size="small"
              onClick={() => {
                setSelectedSkillIds([]);
                setSelectedHobbyIds([]);
              }}
            >
              Clear All
            </Button>
          )}
        </Box>
      )}

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
                <TableCell>Startup</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Skills</TableCell>
                <TableCell>Hobbies</TableCell>
                <TableCell>Socials</TableCell>
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
                      {isProfileVisible(founder) && (
                        <Typography variant="caption" color="text.secondary">
                          {founder.email}
                        </Typography>
                      )}
                      {!isProfileVisible(founder) && (
                        <Typography variant="caption" color="text.disabled">
                          (profile hidden)
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {founder.startup ? (
                      <Chip
                        label={founder.startup.name}
                        size="small"
                        color="success"
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
                    <Typography variant="body2" color="text.secondary">
                      {founder.location || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {founder.skills.slice(0, 2).map((skill) => (
                        <Chip
                          key={skill.id}
                          label={skill.name}
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!selectedSkillIds.includes(skill.id)) {
                              setSelectedSkillIds([...selectedSkillIds, skill.id]);
                            }
                          }}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                      {founder.skills.length > 2 && (
                        <Chip label={`+${founder.skills.length - 2}`} size="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {founder.hobbies.slice(0, 3).map((hobby) => (
                        <Chip
                          key={hobby.id}
                          label={hobby.name}
                          size="small"
                          color="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!selectedHobbyIds.includes(hobby.id)) {
                              setSelectedHobbyIds([...selectedHobbyIds, hobby.id]);
                            }
                          }}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                      {founder.hobbies.length > 3 && (
                        <Chip label={`+${founder.hobbies.length - 3}`} size="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {isProfileVisible(founder) && (
                      <Box display="flex" gap={0.5}>
                        {founder.linkedin_url && (
                          <IconButton
                            size="small"
                            href={founder.linkedin_url}
                            target="_blank"
                            rel="noopener"
                            sx={{ 
                              p: 0.5,
                              '&:hover': {
                                color: 'primary.main',
                                transform: 'scale(1.1)',
                                transition: 'all 0.2s ease-in-out'
                              }
                            }}
                          >
                            <LinkedInIcon sx={{ fontSize: '1.25rem' }} />
                          </IconButton>
                        )}
                        {founder.twitter_url && (
                          <IconButton
                            size="small"
                            href={founder.twitter_url}
                            target="_blank"
                            rel="noopener"
                            sx={{ 
                              p: 0.5,
                              '&:hover': {
                                color: 'primary.main',
                                transform: 'scale(1.1)',
                                transition: 'all 0.2s ease-in-out'
                              }
                            }}
                          >
                            <XIcon sx={{ fontSize: '1.25rem' }} />
                          </IconButton>
                        )}
                        {founder.github_url && (
                          <IconButton
                            size="small"
                            href={founder.github_url}
                            target="_blank"
                            rel="noopener"
                            sx={{ 
                              p: 0.5,
                              '&:hover': {
                                color: 'primary.main',
                                transform: 'scale(1.1)',
                                transition: 'all 0.2s ease-in-out'
                              }
                            }}
                          >
                            <GitHubIcon sx={{ fontSize: '1.25rem' }} />
                          </IconButton>
                        )}
                      </Box>
                    )}
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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mx: -1 }}>
          {paginatedFounders.map((founder) => (
            <Box key={founder.id} sx={{ flex: { xs: '1 1 100%', md: '0 0 calc(33.333% - 11px)' }, minWidth: 0, maxWidth: { xs: '100%', md: 'calc(33.333% - 11px)' } }}>
              <Card 
                sx={{ 
                  height: '350px',
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (!isProfileVisible(founder)) {
                    alert('This profile is marked as not visible and details cannot be viewed.');
                    return;
                  }
                  setSelectedFounder(founder);
                }}
              >
                <CardContent sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                    <Box>
                      <Typography variant="h5" fontWeight={700} mb={0.25}>
                        {founder.name}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={0.5} onClick={(e) => e.stopPropagation()}>
                      {isProfileVisible(founder) && founder.linkedin_url && (
                        <IconButton 
                          size="small" 
                          href={founder.linkedin_url} 
                          target="_blank" 
                          rel="noopener"
                          onClick={(e) => e.stopPropagation()}
                          sx={{ 
                            p: 0,
                            '&:hover': {
                              color: 'primary.main',
                              transform: 'scale(1.15)',
                              transition: 'all 0.2s ease-in-out'
                            }
                          }}
                        >
                          <LinkedInIcon sx={{ fontSize: '1.5rem' }} />
                        </IconButton>
                      )}
                      {isProfileVisible(founder) && founder.twitter_url && (
                        <IconButton 
                          size="small" 
                          href={founder.twitter_url} 
                          target="_blank" 
                          rel="noopener"
                          onClick={(e) => e.stopPropagation()}
                          sx={{ 
                            p: 0,
                            '&:hover': {
                              color: 'primary.main',
                              transform: 'scale(1.15)',
                              transition: 'all 0.2s ease-in-out'
                            }
                          }}
                        >
                          <XIcon sx={{ fontSize: '1.5rem' }} />
                        </IconButton>
                      )}
                      {isProfileVisible(founder) && founder.github_url && (
                        <IconButton 
                          size="small" 
                          href={founder.github_url} 
                          target="_blank" 
                          rel="noopener"
                          onClick={(e) => e.stopPropagation()}
                          sx={{ 
                            p: 0,
                            '&:hover': {
                              color: 'primary.main',
                              transform: 'scale(1.15)',
                              transition: 'all 0.2s ease-in-out'
                            }
                          }}
                        >
                          <GitHubIcon sx={{ fontSize: '1.5rem' }} />
                        </IconButton>
                      )}
                      {isAdmin && canEditProfile(founder.email) && (
                        <IconButton size="small" color="primary" onClick={() => handleEdit(founder)}>
                          <EditIcon />
                        </IconButton>
                      )}
                      {isAdmin && canDeleteUser() && (
                        <IconButton size="small" color="error" onClick={() => handleDelete(founder.id)}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  {founder.startup && (
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      gap={0.5} 
                      mb={0.75}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover .startup-icon': {
                          color: 'primary.main',
                        },
                        '&:hover .startup-text': {
                          color: 'primary.main',
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartupChipClick(founder.startup!);
                      }}
                    >
                      <BusinessIcon 
                        fontSize="small" 
                        color="action" 
                        className="startup-icon"
                        sx={{ fontSize: '1.125rem', transition: 'color 0.2s ease-in-out' }} 
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        fontWeight={600}
                        className="startup-text"
                        sx={{ 
                          fontSize: '0.9375rem',
                          transition: 'color 0.2s ease-in-out'
                        }}
                      >
                        {founder.startup.name}
                      </Typography>
                    </Box>
                  )}

                  {isProfileVisible(founder) && (
                    <Box display="flex" alignItems="center" gap={0.5} mb={0.75}>
                      <EmailIcon fontSize="small" color="action" sx={{ fontSize: '1rem' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        {founder.email}
                      </Typography>
                    </Box>
                  )}

                  {founder.location && (
                    <Box display="flex" alignItems="center" gap={0.5} mb={0.75}>
                      <LocationOnIcon fontSize="small" color="action" sx={{ fontSize: '1rem' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        {founder.location}
                      </Typography>
                    </Box>
                  )}

                  {founder.bio && (
                    <Tooltip title={founder.bio} arrow placement="top" enterDelay={500}>
                      <Box mb={0.75}>
                        <Typography 
                          variant="body2" 
                          lineHeight={1.4}
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.875rem',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {founder.bio}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}

                  <Box>
                    {founder.skills && founder.skills.length > 0 && (
                      <Box mb={0.75}>
                        <Typography variant="caption" fontWeight={600} mb={0.25} display="block" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          SKILLS
                        </Typography>
                        <Box display="flex" flexWrap="nowrap" gap={0.5} sx={{ overflow: 'hidden', alignItems: 'center' }}>
                          {founder.skills.slice(0, 3).map((skill) => (
                            <Chip 
                              key={skill.id} 
                              label={skill.name} 
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!selectedSkillIds.includes(skill.id)) {
                                  setSelectedSkillIds([...selectedSkillIds, skill.id]);
                                }
                              }}
                              sx={{ 
                                height: '20px', 
                                fontSize: '0.7rem', 
                                '& .MuiChip-label': { px: 1, py: 0 }, 
                                flexShrink: 0,
                                cursor: 'pointer',
                              }}
                            />
                          ))}
                          {founder.skills.length > 3 && (
                            <Chip 
                              label={`+${founder.skills.length - 3}`}
                              sx={{ height: '20px', fontSize: '0.7rem', '& .MuiChip-label': { px: 1, py: 0 }, flexShrink: 0 }}
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {founder.hobbies && founder.hobbies.length > 0 && (
                      <Box mb={0.5}>
                        <Typography variant="caption" fontWeight={600} mb={0.25} display="block" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          HOBBIES
                        </Typography>
                        <Box display="flex" flexWrap="nowrap" gap={0.5} sx={{ overflow: 'hidden', alignItems: 'center' }}>
                          {founder.hobbies.slice(0, 3).map((hobby) => (
                            <Chip 
                              key={hobby.id} 
                              label={hobby.name} 
                              color="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!selectedHobbyIds.includes(hobby.id)) {
                                  setSelectedHobbyIds([...selectedHobbyIds, hobby.id]);
                                }
                              }}
                              sx={{ 
                                height: '20px', 
                                fontSize: '0.7rem', 
                                '& .MuiChip-label': { px: 1, py: 0 }, 
                                flexShrink: 0,
                                cursor: 'pointer',
                              }}
                            />
                          ))}
                          {founder.hobbies.length > 3 && (
                            <Chip 
                              label={`+${founder.hobbies.length - 3}`}
                              sx={{ height: '20px', fontSize: '0.7rem', '& .MuiChip-label': { px: 1, py: 0 }, flexShrink: 0 }}
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>

                  <Box flexGrow={1} />
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
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
            {/* Top Section - Before Separator */}
            <Box mb={3}>
              {isProfileVisible(selectedFounder) && (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {selectedFounder.email}
                </Typography>
              )}

              {selectedFounder.startup && (
                <Box mb={2}>
                  <Chip
                    label={selectedFounder.startup.name}
                    color="success"
                    onClick={() => handleStartupChipClick(selectedFounder.startup!)}
                    sx={{ cursor: 'pointer' }}
                    icon={<BusinessIcon />}
                  />
                </Box>
              )}
            </Box>

            {/* Separator */}
            <Box borderTop={1} borderColor="divider" mb={3} />

            {/* Main Content Section */}
            <Box mb={3}>
              {selectedFounder.bio && (
                <Typography variant="body1" mb={2} sx={{ whiteSpace: 'pre-wrap' }}>
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
                      startIcon={<XIcon />}
                      href={selectedFounder.twitter_url}
                      target="_blank"
                      rel="noopener"
                    >
                      X (Twitter)
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

            <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
              {selectedStartup.industry && (
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
                  <Typography variant="caption" color="text.secondary">
                    Industry
                  </Typography>
                  <Box mt={0.5}>
                    <Chip label={selectedStartup.industry} color="secondary" size="small" />
                  </Box>
                </Box>
              )}
              {selectedStartup.stage && (
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
                  <Typography variant="caption" color="text.secondary">
                    Stage
                  </Typography>
                  <Box mt={0.5}>
                    <Chip label={selectedStartup.stage} color="success" size="small" />
                  </Box>
                </Box>
              )}
              {selectedStartup.target_market && (
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
                  <Typography variant="caption" color="text.secondary">
                    Target Market
                  </Typography>
                  <Typography variant="body2" mt={0.5}>
                    🎯 {selectedStartup.target_market}
                  </Typography>
                </Box>
              )}
              {selectedStartup.revenue_arr && (
                <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%' } }}>
                  <Typography variant="caption" color="text.secondary">
                    Revenue ARR
                  </Typography>
                  <Typography variant="body2" mt={0.5}>
                    💰 {selectedStartup.revenue_arr}
                  </Typography>
                </Box>
              )}
            </Box>

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
