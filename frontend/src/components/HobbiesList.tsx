import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
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
  Chip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Hobby, HobbyCreate } from '../types';
import Modal from './Modal';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';

interface HobbiesListProps {
  searchQuery?: string;
}

const hobbyCategories = ['Sports', 'Arts', 'Music', 'Technology', 'Outdoor', 'Gaming', 'Reading', 'Other'];

const HobbiesList: React.FC<HobbiesListProps> = ({ searchQuery = '' }) => {
  const { publicAPI, authenticatedAPI } = useAuthenticatedAPI();
  const { isAdmin } = useAdmin();

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingHobby, setEditingHobby] = useState<Hobby | null>(null);
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);

  const [formData, setFormData] = useState<HobbyCreate>({
    name: '',
    category: '',
    description: '',
  });

  const fetchHobbies = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const response = await publicAPI.get<Hobby[]>('/hobbies/');
      setHobbies(response.data);
    } catch (error) {
      console.error('Error fetching hobbies:', error);
      setErr('Failed to load hobbies. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [publicAPI]);

  useEffect(() => {
    fetchHobbies();
  }, [fetchHobbies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Name is required.');
      return;
    }

    try {
      if (editingHobby) {
        await authenticatedAPI.put(`/hobbies/${editingHobby.id}`, formData);
      } else {
        await authenticatedAPI.post('/hobbies/', formData);
      }
      await fetchHobbies();
      resetForm();
    } catch (error) {
      console.error('Error saving hobby:', error);
      setErr('Failed to save hobby. Please try again.');
    }
  };

  const handleEdit = (hobby: Hobby) => {
    setEditingHobby(hobby);
    setFormData({
      name: hobby.name,
      category: hobby.category || '',
      description: hobby.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this hobby?')) return;

    try {
      await authenticatedAPI.delete(`/hobbies/${id}`);
      await fetchHobbies();
    } catch (error) {
      console.error('Error deleting hobby:', error);
      setErr('Failed to delete hobby. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', description: '' });
    setEditingHobby(null);
    setShowForm(false);
  };

  const truncateDescription = (text: string, maxLength: number = 100): string =>
    text.length <= maxLength ? text : `${text.substring(0, maxLength)}…`;

  const filteredHobbies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return hobbies;

    return hobbies.filter((hobby) => {
      const name = hobby.name.toLowerCase();
      const category = hobby.category?.toLowerCase() || '';
      const description = hobby.description?.toLowerCase() || '';
      return name.includes(q) || category.includes(q) || description.includes(q);
    });
  }, [hobbies, searchQuery]);

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={8}>
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading hobbies…
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3" fontWeight={700}>
          Hobbies
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
          disabled={!isAdmin}
        >
          Add Hobby
        </Button>
      </Box>

      {err && (
        <Alert severity="error" sx={{ mb: 3}} onClose={() => setErr(null)}>
          {err}
        </Alert>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={resetForm} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingHobby ? 'Edit Hobby' : 'Add New Hobby'}
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

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                >
                  <MenuItem value="">Select a category</MenuItem>
                  {hobbyCategories.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetForm}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={!isAdmin}>
              {editingHobby ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Hobbies List */}
      <Box>
        {filteredHobbies.map((hobby, index) => (
          <Box
            key={hobby.id}
            sx={{
              py: 2,
              px: 3,
              borderBottom: index < filteredHobbies.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => setSelectedHobby(hobby)}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body1" fontWeight={600}>
                  {hobby.name}
                </Typography>
                {hobby.category && (
                  <Chip label={hobby.category} color="secondary" size="small" />
                )}
              </Box>
              {isAdmin && (
                <Box onClick={(e) => e.stopPropagation()}>
                  <IconButton size="small" color="primary" onClick={() => handleEdit(hobby)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(hobby.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
            {hobby.description && (
              <Typography variant="body2" color="text.secondary" mt={1}>
                {hobby.description}
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      {/* Hobby Details Modal */}
      <Modal
        isOpen={selectedHobby !== null}
        onClose={() => setSelectedHobby(null)}
        title={selectedHobby?.name || ''}
        maxWidth="sm"
      >
        {selectedHobby && (
          <Box>
            {selectedHobby.category && (
              <Box mb={2}>
                <Chip label={selectedHobby.category} color="secondary" />
              </Box>
            )}

            {selectedHobby.description && (
              <Typography variant="body1" mb={3}>
                {selectedHobby.description}
              </Typography>
            )}

            <Box display="flex" justifyContent="flex-end" gap={2} pt={2} borderTop={1} borderColor="divider">
              {isAdmin ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setSelectedHobby(null);
                      handleEdit(selectedHobby);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setSelectedHobby(null);
                      handleDelete(selectedHobby.id);
                    }}
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <Button variant="outlined" onClick={() => setSelectedHobby(null)}>
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

export default HobbiesList;

