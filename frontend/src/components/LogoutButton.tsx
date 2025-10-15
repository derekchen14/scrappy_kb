import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

const LogoutButton: React.FC = () => {
  const { logout, isAuthenticated } = useAuth0();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant="outlined"
      color="inherit"
      size="small"
      startIcon={<LogoutIcon />}
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      sx={{
        color: 'white',
        borderColor: 'rgba(255, 255, 255, 0.5)',
        '&:hover': {
          borderColor: 'white',
          bgcolor: 'rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      Log Out
    </Button>
  );
};

export default LogoutButton;
