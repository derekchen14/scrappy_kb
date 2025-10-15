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
} from '@mui/material';
import AuthButtons from './components/AuthButtons';
import LogoutButton from './components/LogoutButton';
import Profile from './components/Profile';
import { useAdmin } from './hooks/useAdmin';
import { useProfileSetup } from './hooks/useProfileSetup';
import { Startup, Founder } from './types';

// Lazily load tab panes (code-splitting)
const FoundersList = lazy(() => import(/* webpackChunkName: "tab-founders" */ './components/FoundersList'));
const SkillsList = lazy(() => import(/* webpackChunkName: "tab-skills" */ './components/SkillsList'));
const StartupsList = lazy(() => import(/* webpackChunkName: "tab-startups" */ './components/StartupsList'));
const HelpRequestsList = lazy(() => import(/* webpackChunkName: "tab-requests" */ './components/HelpRequestsList'));
const EventsList = lazy(() => import(/* webpackChunkName: "tab-events" */ './components/EventsList'));
const AdminDashboard = lazy(() => import(/* webpackChunkName: "tab-admin" */ './components/AdminDashboard'));
const ProfileSetupModal = lazy(() => import(/* webpackChunkName: "profile-setup" */ './components/ProfileSetupModal'));

type TabType = 'founders' | 'skills' | 'startups' | 'help-requests' | 'events' | 'admin';

function App() {
  const { isLoading, error, isAuthenticated } = useAuth0();
  const { isAdmin } = useAdmin();
  const { needsProfileSetup, loading: profileLoading, completeProfileSetup } = useProfileSetup();

  const [activeTab, setActiveTab] = useState<TabType>('founders');
  const [startupToShow, setStartupToShow] = useState<Startup | null>(null);
  const [founderToShow, setFounderToShow] = useState<Founder | null>(null);
  const [editFounderToShow, setEditFounderToShow] = useState<Founder | null>(null);

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

  // Redirect non-admin users away from admin-only tabs
  useEffect(() => {
    if (!isAdmin && (activeTab === 'skills' || activeTab === 'admin')) {
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
    const tabs = ['founders', isAdmin ? 'skills' : null, 'startups', 'help-requests', 'events', isAdmin ? 'admin' : null].filter(Boolean);
    return tabs.indexOf(tab);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const tabs: TabType[] = ['founders', ...(isAdmin ? ['skills' as TabType] : []), 'startups', 'help-requests', 'events', ...(isAdmin ? ['admin' as TabType] : [])];
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
    <Box minHeight="100vh" bgcolor="background.default">
      {/* Profile Setup Modal (lazy) */}
      <Suspense fallback={null}>
        <ProfileSetupModal
          isOpen={needsProfileSetup && !isAdmin}
          onComplete={completeProfileSetup}
        />
      </Suspense>

      <AppBar position="static" elevation={1}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Typography
            variant="h6"
            component="h1"
            sx={{
              flexGrow: 1,
              fontFamily: '"Merriweather", "Georgia", serif',
              fontWeight: 700,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            Scrappy Founders Knowledge Base
          </Typography>

          {/* User Profile and Logout */}
          <Box display="flex" alignItems="center" gap={2}>
            <Profile
              onViewProfile={handleViewProfile}
              onEditProfile={handleEditProfile}
              onStartupClick={navigateToStartup}
            />
            <LogoutButton />
          </Box>
        </Toolbar>

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
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
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
