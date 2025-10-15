import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  People as PeopleIcon,
  Construction as SkillsIcon,
  SportsSoccer as HobbiesIcon,
  Business as BusinessIcon,
  Help as HelpIcon,
  Event as EventIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import AuthButtons from './components/AuthButtons';
import LogoutButton from './components/LogoutButton';
import Profile from './components/Profile';
import { useAdmin } from './hooks/useAdmin';
import { useProfileSetup } from './hooks/useProfileSetup';
import { useAuthenticatedAPI } from './hooks/useAuthenticatedAPI';
import { Startup, Founder } from './types';

// Lazily load tab panes (code-splitting)
const FoundersList = lazy(() => import(/* webpackChunkName: "tab-founders" */ './components/FoundersList'));
const SkillsList = lazy(() => import(/* webpackChunkName: "tab-skills" */ './components/SkillsList'));
const HobbiesList = lazy(() => import(/* webpackChunkName: "tab-hobbies" */ './components/HobbiesList'));
const StartupsList = lazy(() => import(/* webpackChunkName: "tab-startups" */ './components/StartupsList'));
const HelpRequestsList = lazy(() => import(/* webpackChunkName: "tab-requests" */ './components/HelpRequestsList'));
const EventsList = lazy(() => import(/* webpackChunkName: "tab-events" */ './components/EventsList'));
const AdminDashboard = lazy(() => import(/* webpackChunkName: "tab-admin" */ './components/AdminDashboard'));
const ProfileSetupModal = lazy(() => import(/* webpackChunkName: "profile-setup" */ './components/ProfileSetupModal'));

type TabType = 'founders' | 'skills' | 'hobbies' | 'startups' | 'help-requests' | 'events' | 'admin';

function App() {
  const { isLoading, error, isAuthenticated, user, logout } = useAuth0();
  const { isAdmin } = useAdmin();
  const { needsProfileSetup, loading: profileLoading, completeProfileSetup } = useProfileSetup();
  const { authenticatedAPI } = useAuthenticatedAPI();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activeTab, setActiveTab] = useState<TabType>('founders');
  const [startupToShow, setStartupToShow] = useState<Startup | null>(null);
  const [founderToShow, setFounderToShow] = useState<Founder | null>(null);
  const [editFounderToShow, setEditFounderToShow] = useState<Founder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [myProfile, setMyProfile] = useState<Founder | null>(null);

  // Stable callbacks (help memoized children & avoid re-renders)
  const navigateToStartup = useCallback((startup: Startup) => {
    setActiveTab('startups');
    setStartupToShow(startup);
  }, []);

  const navigateToFounder = useCallback((founder: Founder) => {
    setActiveTab('founders');
    setFounderToShow(founder);
  }, []);

  const handleViewProfile = useCallback((founder: Founder) => {
    setActiveTab('founders');
    setFounderToShow(founder);
  }, []);

  const handleEditProfile = useCallback((founder: Founder) => {
    setActiveTab('founders');
    setEditFounderToShow(founder);
  }, []);

  // Drawer handlers
  const toggleDrawer = useCallback((open: boolean) => {
    setDrawerOpen(open);
  }, []);

  const handleNavigation = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setDrawerOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout({ logoutParams: { returnTo: window.location.origin } });
    setDrawerOpen(false);
  }, [logout]);

  // Fetch my profile for drawer
  useEffect(() => {
    const fetchMyProfile = async () => {
      if (isAuthenticated) {
        try {
          const response = await authenticatedAPI.get('/api/my-profile');
          setMyProfile(response.data.founder);
        } catch (error) {
          console.error('Error fetching my profile:', error);
        }
      }
    };
    fetchMyProfile();
  }, [isAuthenticated, authenticatedAPI]);

  // Redirect non-admin users away from admin-only tabs
  useEffect(() => {
    if (!isAdmin && (activeTab === 'skills' || activeTab === 'hobbies' || activeTab === 'admin')) {
      setActiveTab('founders');
    }
  }, [isAdmin, activeTab]);

  // Preload tab bundles on hover for snappy UX
  const preloadTab = useCallback((tab: TabType) => {
    switch (tab) {
      case 'founders':
        import(/* webpackPrefetch: true, webpackChunkName: "tab-founders" */ './components/FoundersList');
        break;
      case 'skills':
        import(/* webpackPrefetch: true, webpackChunkName: "tab-skills" */ './components/SkillsList');
        break;
      case 'hobbies':
        import(/* webpackPrefetch: true, webpackChunkName: "tab-hobbies" */ './components/HobbiesList');
        break;
      case 'startups':
        import(/* webpackPrefetch: true, webpackChunkName: "tab-startups" */ './components/StartupsList');
        break;
      case 'help-requests':
        import(/* webpackPrefetch: true, webpackChunkName: "tab-requests" */ './components/HelpRequestsList');
        break;
      case 'events':
        import(/* webpackPrefetch: true, webpackChunkName: "tab-events" */ './components/EventsList');
        break;
      case 'admin':
        import(/* webpackPrefetch: true, webpackChunkName: "tab-admin" */ './components/AdminDashboard');
        break;
    }
  }, []);

  // Tab index mapping
  const getTabIndex = (tab: TabType): number => {
    const tabs = ['founders', isAdmin ? 'skills' : null, isAdmin ? 'hobbies' : null, 'startups', 'help-requests', 'events', isAdmin ? 'admin' : null].filter(Boolean);
    return tabs.indexOf(tab);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const tabs: TabType[] = ['founders', ...(isAdmin ? ['skills' as TabType, 'hobbies' as TabType] : []), 'startups', 'help-requests', 'events', ...(isAdmin ? ['admin' as TabType] : [])];
    setActiveTab(tabs[newValue]);
  };

  // Shared skeleton for lazy tabs
  const MainFallback = (
    <Box display="flex" justifyContent="center" alignItems="center" py={8}>
      <Box textAlign="center">
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading…
        </Typography>
      </Box>
    </Box>
  );

  if (isLoading || profileLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <Box textAlign="center">
          <CircularProgress size={64} />
          <Typography variant="body1" color="text.secondary" mt={2}>
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6">Authentication Error</Typography>
          <Typography variant="body2">{error.message}</Typography>
        </Alert>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <Box textAlign="center" maxWidth={500} px={3}>
          <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
            Scrappy Founders Knowledge Base
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Join our community of founders
          </Typography>
          <AuthButtons />
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      minHeight="100vh" 
      sx={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)',
      }}
    >
      {/* Profile Setup Modal (lazy) */}
      <Suspense fallback={null}>
        <ProfileSetupModal
          isOpen={needsProfileSetup && !isAdmin}
          onComplete={completeProfileSetup}
        />
      </Suspense>

      <AppBar position="static" elevation={1}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {/* Mobile: Burger Menu */}
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => toggleDrawer(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component="h1"
            sx={{
              flexGrow: 1,
              fontFamily: '"Merriweather", "Georgia", serif',
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.5rem' },
            }}
          >
            {isMobile ? 'Scrappy Founders' : 'Scrappy Founders Knowledge Base'}
          </Typography>

          {/* Desktop: User Profile and Logout */}
          {!isMobile && (
            <Box display="flex" alignItems="center" gap={2}>
              <Profile
                onViewProfile={handleViewProfile}
                onEditProfile={handleEditProfile}
                onStartupClick={navigateToStartup}
              />
              <LogoutButton />
            </Box>
          )}
        </Toolbar>

        {/* Desktop: Tabs Navigation */}
        {!isMobile && (
          <Tabs
            value={getTabIndex(activeTab)}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{
              bgcolor: 'primary.main',
              borderTop: 1,
              borderColor: 'primary.dark',
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: 'white',
                },
                '&:hover': {
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                },
              },
            }}
          >
            <Tab
              label="Founders"
              onMouseEnter={() => preloadTab('founders')}
            />
            {isAdmin && (
              <Tab
                label="Skills"
                onMouseEnter={() => preloadTab('skills')}
              />
            )}
            {isAdmin && (
              <Tab
                label="Hobbies"
                onMouseEnter={() => preloadTab('hobbies')}
              />
            )}
            <Tab
              label="Startups"
              onMouseEnter={() => preloadTab('startups')}
            />
            <Tab
              label="Requests"
              onMouseEnter={() => preloadTab('help-requests')}
            />
            <Tab
              label="Events"
              onMouseEnter={() => preloadTab('events')}
            />
            {isAdmin && (
              <Tab
                label="Admin"
                onMouseEnter={() => preloadTab('admin')}
              />
            )}
          </Tabs>
        )}
      </AppBar>

      {/* Mobile: Drawer Navigation */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: 'background.paper',
          },
        }}
      >
        <Box sx={{ width: 280 }} role="presentation">
          {/* User Profile Section */}
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Avatar
                src={user?.picture}
                alt={user?.name}
                sx={{
                  width: 48,
                  height: 48,
                  border: '2px solid',
                  borderColor: 'primary.light',
                }}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {user?.email}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Profile Actions */}
          {myProfile && (
            <List>
              <ListItem disablePadding>
                <ListItemButton onClick={() => {
                  if (myProfile) {
                    handleViewProfile(myProfile);
                  }
                }}>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="View Profile" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => {
                  if (myProfile) {
                    handleEditProfile(myProfile);
                  }
                }}>
                  <ListItemIcon>
                    <EditIcon />
                  </ListItemIcon>
                  <ListItemText primary="Edit Profile" />
                </ListItemButton>
              </ListItem>
              {(myProfile as any)?.startup_id && (
                <ListItem disablePadding>
                  <ListItemButton onClick={async () => {
                    const profileWithStartupId = myProfile as any;
                    if (profileWithStartupId?.startup_id) {
                      try {
                        const response = await authenticatedAPI.get(`/startups/${profileWithStartupId.startup_id}`);
                        navigateToStartup(response.data);
                      } catch (error) {
                        console.error('Error fetching startup:', error);
                      }
                    }
                    setDrawerOpen(false);
                  }}>
                    <ListItemIcon>
                      <BusinessIcon />
                    </ListItemIcon>
                    <ListItemText primary="View Startup" />
                  </ListItemButton>
                </ListItem>
              )}
            </List>
          )}

          <Divider />

          {/* Navigation Items */}
          <List>
            <ListItem disablePadding>
              <ListItemButton 
                selected={activeTab === 'founders'}
                onClick={() => handleNavigation('founders')}
              >
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="Founders" />
              </ListItemButton>
            </ListItem>

            {isAdmin && (
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activeTab === 'skills'}
                  onClick={() => handleNavigation('skills')}
                >
                  <ListItemIcon>
                    <SkillsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Skills" />
                </ListItemButton>
              </ListItem>
            )}

            {isAdmin && (
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activeTab === 'hobbies'}
                  onClick={() => handleNavigation('hobbies')}
                >
                  <ListItemIcon>
                    <HobbiesIcon />
                  </ListItemIcon>
                  <ListItemText primary="Hobbies" />
                </ListItemButton>
              </ListItem>
            )}

            <ListItem disablePadding>
              <ListItemButton 
                selected={activeTab === 'startups'}
                onClick={() => handleNavigation('startups')}
              >
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText primary="Startups" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton 
                selected={activeTab === 'help-requests'}
                onClick={() => handleNavigation('help-requests')}
              >
                <ListItemIcon>
                  <HelpIcon />
                </ListItemIcon>
                <ListItemText primary="Help Requests" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton 
                selected={activeTab === 'events'}
                onClick={() => handleNavigation('events')}
              >
                <ListItemIcon>
                  <EventIcon />
                </ListItemIcon>
                <ListItemText primary="Events" />
              </ListItemButton>
            </ListItem>

            {isAdmin && (
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activeTab === 'admin'}
                  onClick={() => handleNavigation('admin')}
                >
                  <ListItemIcon>
                    <AdminIcon />
                  </ListItemIcon>
                  <ListItemText primary="Admin" />
                </ListItemButton>
              </ListItem>
            )}
          </List>

          <Divider />

          {/* Logout */}
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
        <Suspense fallback={MainFallback}>
          {activeTab === 'founders' && (
            <FoundersList
              onStartupClick={navigateToStartup}
              founderToShow={founderToShow}
              onFounderShown={() => setFounderToShow(null)}
              editFounderToShow={editFounderToShow}
              onEditFounderShown={() => setEditFounderToShow(null)}
            />
          )}
          {activeTab === 'skills' && isAdmin && <SkillsList />}
          {activeTab === 'hobbies' && isAdmin && <HobbiesList />}
          {activeTab === 'startups' && (
            <StartupsList
              startupToShow={startupToShow}
              onStartupShown={() => setStartupToShow(null)}
              onFounderClick={navigateToFounder}
            />
          )}
          {activeTab === 'help-requests' && <HelpRequestsList onFounderClick={navigateToFounder} />}
          {activeTab === 'events' && <EventsList />}
          {activeTab === 'admin' && isAdmin && <AdminDashboard onNavigateToTab={setActiveTab} />}
        </Suspense>
      </Container>
    </Box>
  );
}

export default App;
