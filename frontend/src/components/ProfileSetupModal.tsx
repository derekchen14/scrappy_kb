import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Alert,
  Avatar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  FormGroup,
} from '@mui/material';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { Founder, FounderCreate, Skill, Startup, Hobby } from '../types';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
  existingData?: Partial<FounderCreate>;
}

const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ isOpen, onComplete, existingData }) => {
  const { user } = useAuth0();
  const { authenticatedAPI, publicAPI } = useAuthenticatedAPI();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [formData, setFormData] = useState<FounderCreate>({
    name: existingData?.name || '',
    email: user?.email || '',
    bio: existingData?.bio || '',
    location: existingData?.location || '',
    linkedin_url: existingData?.linkedin_url || '',
    twitter_url: existingData?.twitter_url || '',
    github_url: existingData?.github_url || '',
    profile_image_url: existingData?.profile_image_url || '',
    profile_visible: existingData?.profile_visible ?? true,
    auth0_user_id: existingData?.auth0_user_id || user?.sub,
    skill_ids: existingData?.skill_ids || [],
    startup_id: existingData?.startup_id,
    hobby_ids: existingData?.hobby_ids || [],
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: existingData?.name || '',
      email: user?.email || '',
      bio: existingData?.bio || '',
      location: existingData?.location || '',
      linkedin_url: existingData?.linkedin_url || '',
      twitter_url: existingData?.twitter_url || '',
      github_url: existingData?.github_url || '',
      profile_image_url: existingData?.profile_image_url || '',
      profile_visible: existingData?.profile_visible ?? true,
      auth0_user_id: existingData?.auth0_user_id || user?.sub,
      skill_ids: existingData?.skill_ids || [],
      startup_id: existingData?.startup_id,
      hobby_ids: existingData?.hobby_ids || [],
    });
    setImagePreview(existingData?.profile_image_url || null);
    setSelectedImage(null);
    setErrorText(null);
  }, [isOpen, existingData, user?.email, user?.sub]);

  const fetchOptions = useCallback(async () => {
    try {
      const [skillsRes, startupsRes, hobbiesRes] = await Promise.all([
        publicAPI.get<Skill[]>('/skills/'),
        publicAPI.get<Startup[]>('/startups/'),
        publicAPI.get<Hobby[]>('/hobbies/'),
      ]);
      setSkills(skillsRes.data);
      setStartups(startupsRes.data);
      setHobbies(hobbiesRes.data);
    } catch (err) {
      console.error('Error fetching options:', err);
      setErrorText('Failed to load dropdown options. Please retry.');
    }
  }, [publicAPI]);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen, fetchOptions]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedImage);
      const response = await authenticatedAPI.post('/upload-image/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.image_url as string;
    } catch (err) {
      console.error('Error uploading image:', err);
      setErrorText('Image upload failed. You can try again or continue without a photo.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    if (!formData.name.trim() || !formData.email.trim() || !formData.linkedin_url.trim()) {
      setErrorText('Please fill in all required fields (Name, Email, LinkedIn URL).');
      return;
    }
    setSubmitting(true);
    try {
      const finalData: FounderCreate = { ...formData };
      if (selectedImage) {
        const imageUrl = await uploadImage();
        if (imageUrl) finalData.profile_image_url = imageUrl;
      }
      if (existingData) {
        const foundersRes = await publicAPI.get<Founder[]>('/founders/');
        const existingFounder = foundersRes.data.find((f) => f.email === formData.email);
        if (existingFounder) {
          await authenticatedAPI.put(`/founders/${existingFounder.id}`, finalData);
        } else {
          await authenticatedAPI.post('/founders/', finalData);
        }
      } else {
        await authenticatedAPI.post('/founders/', finalData);
      }
      onComplete();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Error saving profile. Please try again.';
      setErrorText(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkillToggle = (skillId: number) => {
    setFormData((prev) => ({
      ...prev,
      skill_ids: prev.skill_ids?.includes(skillId)
        ? prev.skill_ids.filter((id) => id !== skillId)
        : [...(prev.skill_ids || []), skillId],
    }));
  };

  const handleStartupChange = (startupId: number | undefined) => {
    setFormData((prev) => ({
      ...prev,
      startup_id: startupId,
    }));
  };

  const handleHobbyToggle = (hobbyId: number) => {
    setFormData((prev) => ({
      ...prev,
      hobby_ids: prev.hobby_ids?.includes(hobbyId)
        ? prev.hobby_ids.filter((id) => id !== hobbyId)
        : [...(prev.hobby_ids || []), hobbyId],
    }));
  };

  const disabledAction = submitting || uploadingImage;

  return (
    <Dialog open={isOpen} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Typography variant="h5" fontWeight={600} align="center">
            {existingData ? 'Complete Your Profile' : 'Set Up Your Profile'}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mt={1}>
            Please fill in your information to get started
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={3}>
            {errorText && (
              <Alert severity="error">{errorText}</Alert>
            )}

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
              disabled
              fullWidth
              helperText="Email cannot be changed"
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
                if (!e.target.value) {
                  setFormData((prev) => ({ ...prev, linkedin_url: 'https://www.linkedin.com/in/' }));
                }
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
                if (!e.target.value) {
                  setFormData((prev) => ({ ...prev, twitter_url: 'https://www.twitter.com/' }));
                }
              }}
              fullWidth
            />

            <TextField
              label="GitHub URL"
              type="url"
              value={formData.github_url}
              onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
              onFocus={(e) => {
                if (!e.target.value) {
                  setFormData((prev) => ({ ...prev, github_url: 'https://www.github.com/' }));
                }
              }}
              fullWidth
            />

            <Box>
              <Typography variant="body2" fontWeight={500} mb={1}>
                Profile Image
              </Typography>
              <Button variant="outlined" component="label" fullWidth>
                Upload Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </Button>
              {imagePreview && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Avatar src={imagePreview} sx={{ width: 80, height: 80 }} />
                </Box>
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
                  <Typography variant="body2" fontWeight={500}>Profile Visible</Typography>
                  <Typography variant="caption" color="text.secondary">
                    When unchecked, only name and bio will be visible to others
                  </Typography>
                </Box>
              }
            />

            <Box>
              <Typography variant="body2" fontWeight={500} mb={1}>
                Skills
              </Typography>
              <FormGroup>
                <Grid container spacing={1}>
                  {skills.map((skill) => (
                    <Grid key={skill.id} sx={{ width: { xs: '100%', sm: '50%' }, p: 0.5 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.skill_ids?.includes(skill.id) || false}
                            onChange={() => handleSkillToggle(skill.id)}
                          />
                        }
                        label={<Typography variant="body2">{skill.name}</Typography>}
                      />
                    </Grid>
                  ))}
                </Grid>
              </FormGroup>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Startup</InputLabel>
              <Select
                value={formData.startup_id ? String(formData.startup_id) : ''}
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
              <Typography variant="body2" fontWeight={500} mb={1}>
                Hobbies
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                <FormGroup>
                  <Grid container spacing={1}>
                    {hobbies.map((hobby) => (
                      <Grid key={hobby.id} sx={{ width: { xs: '100%', sm: '50%' }, p: 0.5 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.hobby_ids?.includes(hobby.id) || false}
                              onChange={() => handleHobbyToggle(hobby.id)}
                            />
                          }
                          label={<Typography variant="body2">{hobby.name}</Typography>}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </FormGroup>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={disabledAction}
            startIcon={disabledAction ? <CircularProgress size={20} /> : null}
            fullWidth
            size="large"
          >
            {submitting ? 'Saving…' : uploadingImage ? 'Uploading…' : 'Complete Profile'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProfileSetupModal;
