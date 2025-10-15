import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Box,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  Divider,
  CircularProgress,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import BusinessIcon from '@mui/icons-material/Business';
import { Founder, Startup } from '../types';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';

interface ProfileProps {
  onViewProfile?: (founder: Founder) => void;
  onEditProfile?: (founder: Founder) => void;
  onStartupClick?: (startup: Startup) => void;
}

const Profile: React.FC<ProfileProps> = ({ onViewProfile, onEditProfile, onStartupClick }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const { authenticatedAPI } = useAuthenticatedAPI();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [myProfile, setMyProfile] = useState<Founder | null>(null);
  const open = Boolean(anchorEl);

  const fetchMyProfile = useCallback(async () => {
    try {
      const response = await authenticatedAPI.get('/api/my-profile');
      setMyProfile(response.data.founder);
    } catch (error) {
      console.error('Error fetching my profile:', error);
    }
  }, [authenticatedAPI]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyProfile();
    }
  }, [isAuthenticated, fetchMyProfile]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewProfile = () => {
    if (myProfile && onViewProfile) {
      const profileWithDefaults = {
        ...myProfile,
        skills: myProfile.skills || [],
        hobbies: myProfile.hobbies || [],
        startup: myProfile.startup || undefined
      };
      onViewProfile(profileWithDefaults);
    }
    handleClose();
  };

  const handleEditProfile = () => {
    if (myProfile && onEditProfile) {
      const profileWithDefaults = {
        ...myProfile,
        skills: myProfile.skills || [],
        hobbies: myProfile.hobbies || [],
        startup: myProfile.startup || undefined
      };
      onEditProfile(profileWithDefaults);
    }
    handleClose();
  };

  const handleStartupClick = async () => {
    const profileWithStartupId = myProfile as any;
    if (profileWithStartupId?.startup_id && onStartupClick) {
      try {
        const response = await authenticatedAPI.get(`/startups/${profileWithStartupId.startup_id}`);
        onStartupClick(response.data);
      } catch (error) {
        console.error('Error fetching startup:', error);
      }
    }
    handleClose();
  };

  if (isLoading) {
    return <CircularProgress size={24} sx={{ color: 'white' }} />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          px: 1.5,
          py: 0.75,
          borderRadius: 1,
          transition: 'background-color 0.2s',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <Avatar
          src={user.picture}
          alt={user.name}
          sx={{
            width: 32,
            height: 32,
            border: '2px solid',
            borderColor: 'primary.light',
          }}
        />
        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
          {myProfile?.name || user.name || user.email}
        </Typography>
        <KeyboardArrowDownIcon sx={{ color: 'white', fontSize: 20 }} />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
          },
        }}
      >
        <Box px={2} py={1.5}>
          <Typography variant="subtitle2" fontWeight={600}>
            {myProfile?.name || user.name || 'No name'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        
        {myProfile && (
          <>
            <Divider />
            <MenuItem onClick={handleViewProfile}>
              <PersonIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
              View Profile
            </MenuItem>
            <MenuItem onClick={handleEditProfile}>
              <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
              Edit Profile
            </MenuItem>
            {(myProfile as any)?.startup_id && (
              <MenuItem onClick={handleStartupClick}>
                <BusinessIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                View Startup
              </MenuItem>
            )}
          </>
        )}
      </Menu>
    </Box>
  );
};

export default Profile;
