import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
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
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Skill, SkillCreate } from '../types';
import Modal from './Modal';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';

interface SkillsListProps {
  searchQuery?: string;
}

const skillCategories = ['Technical', 'Marketing', 'Business', 'Design', 'Sales', 'Product', 'Other'];

const SkillsList: React.FC<SkillsListProps> = ({ searchQuery = '' }) => {
  const { publicAPI, authenticatedAPI } = useAuthenticatedAPI();
  const { isAdmin } = useAdmin();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const [formData, setFormData] = useState<SkillCreate>({
    name: '',
    category: '',
    description: '',
  });

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const response = await publicAPI.get<Skill[]>('/skills/');
      setSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
      setErr('Failed to load skills. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [publicAPI]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Name is required.');
      return;
    }

    try {
      if (editingSkill) {
        await authenticatedAPI.put(`/skills/${editingSkill.id}`, formData);
      } else {
        await authenticatedAPI.post('/skills/', formData);
      }
      await fetchSkills();
      resetForm();
    } catch (error) {
      console.error('Error saving skill:', error);
      setErr('Failed to save skill. Please try again.');
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category || '',
      description: skill.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;

    try {
      await authenticatedAPI.delete(`/skills/${id}`);
      await fetchSkills();
    } catch (error) {
      console.error('Error deleting skill:', error);
      setErr('Failed to delete skill. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', description: '' });
    setEditingSkill(null);
    setShowForm(false);
  };

  const truncateDescription = (text: string, maxLength: number = 100): string =>
    text.length <= maxLength ? text : `${text.substring(0, maxLength)}…`;

  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return skills;

    return skills.filter((skill) => {
      const name = skill.name.toLowerCase();
      const category = skill.category?.toLowerCase() || '';
      const description = skill.description?.toLowerCase() || '';
      return name.includes(q) || category.includes(q) || description.includes(q);
    });
  }, [skills, searchQuery]);

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={8}>
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading skills…
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3" fontWeight={700}>
          Skills
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
          disabled={!isAdmin}
        >
          Add Skill
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
            {editingSkill ? 'Edit Skill' : 'Add New Skill'}
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
                  {skillCategories.map((c) => (
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
              {editingSkill ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Skills Grid */}
      <Grid container spacing={2}>
        {filteredSkills.map((skill) => (
          <Grid key={skill.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%', xl: '16.67%' }, p: 1 }}>
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': { boxShadow: 4 },
                transition: 'box-shadow 0.3s',
              }}
              onClick={() => setSelectedSkill(skill)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={1}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {skill.name}
                  </Typography>
                  {skill.category && (
                    <Chip label={skill.category} size="small" color="info" variant="outlined" />
                  )}
                </Box>
                {skill.description && (
                  <Typography variant="caption" color="text.secondary">
                    {truncateDescription(skill.description, 80)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Skill Details Modal */}
      <Modal
        isOpen={selectedSkill !== null}
        onClose={() => setSelectedSkill(null)}
        title={selectedSkill?.name || ''}
        maxWidth="sm"
      >
        {selectedSkill && (
          <Box>
            {selectedSkill.category && (
              <Box mb={2}>
                <Chip label={selectedSkill.category} color="info" />
              </Box>
            )}

            {selectedSkill.description && (
              <Typography variant="body1" mb={3}>
                {selectedSkill.description}
              </Typography>
            )}

            <Box display="flex" justifyContent="flex-end" gap={2} pt={2} borderTop={1} borderColor="divider">
              {isAdmin ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setSelectedSkill(null);
                      handleEdit(selectedSkill);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setSelectedSkill(null);
                      handleDelete(selectedSkill.id);
                    }}
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <Button variant="outlined" onClick={() => setSelectedSkill(null)}>
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

export default SkillsList;
