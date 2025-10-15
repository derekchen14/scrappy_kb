import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Link,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Event, EventCreate } from '../types';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';

const localizer = momentLocalizer(moment);

type ViewType = 'card' | 'compact' | 'calendar';

const THEMES = ['hiking', 'poker', 'basketball', 'pickleball', 'roundtable', 'group dinner'] as const;

const EventsList: React.FC = () => {
  const { authenticatedAPI, publicAPI } = useAuthenticatedAPI();
  const { isAdmin } = useAdmin();

  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewType, setViewType] = useState<ViewType>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>('month');
  const [formData, setFormData] = useState<EventCreate>({
    title: '',
    description: '',
    date_time: '',
    location: '',
    attendees: '',
    theme: '',
    link: '',
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fetchAbort = useRef<AbortController | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setErrorMsg(null);
      fetchAbort.current?.abort();
      const controller = new AbortController();
      fetchAbort.current = controller;

      const response = await publicAPI.get<Event[]>('/events/', { signal: controller.signal });
      setEvents(response.data);
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return;
      console.error('Error fetching events:', err);
      setErrorMsg('Failed to load events. Please try again.');
    }
  }, [publicAPI]);

  useEffect(() => {
    fetchEvents();
    return () => fetchAbort.current?.abort();
  }, [fetchEvents]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (editingEvent) {
          await authenticatedAPI.put(`/events/${editingEvent.id}`, formData);
        } else {
          await authenticatedAPI.post('/events/', formData);
        }
        await fetchEvents();
        setFormData({
          title: '',
          description: '',
          date_time: '',
          location: '',
          attendees: '',
          theme: '',
          link: '',
        });
        setEditingEvent(null);
        setShowForm(false);
      } catch (error) {
        console.error('Error saving event:', error);
        setErrorMsg('Failed to save event. Please try again.');
      }
    },
    [authenticatedAPI, editingEvent, formData, fetchEvents]
  );

  const handleEdit = useCallback((ev: Event) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title,
      description: ev.description || '',
      date_time: ev.date_time,
      location: ev.location || '',
      attendees: ev.attendees || '',
      theme: ev.theme || '',
      link: ev.link || '',
    });
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      if (!window.confirm('Are you sure you want to delete this event?')) return;
      try {
        await authenticatedAPI.delete(`/events/${id}`);
        await fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        setErrorMsg('Failed to delete event. Please try again.');
      }
    },
    [authenticatedAPI, fetchEvents]
  );

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      date_time: '',
      location: '',
      attendees: '',
      theme: '',
      link: '',
    });
    setEditingEvent(null);
    setShowForm(false);
  }, []);

  const formatDateTime = useCallback((dateTime: string) => new Date(dateTime).toLocaleString(), []);
  const formatDate = useCallback((dateTime: string) => new Date(dateTime).toLocaleDateString(), []);
  const formatTime = useCallback(
    (dateTime: string) => new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    []
  );

  const getThemeColor = useCallback((theme: string): 'success' | 'error' | 'warning' | 'info' | 'secondary' | 'default' => {
    const colors: Record<string, any> = {
      hiking: 'success',
      poker: 'error',
      basketball: 'warning',
      pickleball: 'warning',
      roundtable: 'info',
      'group dinner': 'secondary',
    };
    return colors[theme] || 'default';
  }, []);

  // Convert events to react-big-calendar format
  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.date_time),
      end: new Date(new Date(event.date_time).getTime() + 2 * 60 * 60 * 1000), // Default 2-hour duration
      resource: event, // Store the full event object
    }));
  }, [events]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()),
    [events]
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={3}>
          <Typography variant="h3" fontWeight={700}>
            Events
          </Typography>

          {/* View Switcher */}
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={(_, newView) => newView && setViewType(newView)}
            size="small"
          >
            <ToggleButton value="calendar">
              <CalendarIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="card">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="compact">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
          >
            Add Event
          </Button>
        )}
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* Event Form Dialog */}
      <Dialog open={showForm} onClose={resetForm} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingEvent ? 'Edit Event' : 'Add New Event'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                fullWidth
              />

              <Grid container spacing={2}>
                <Grid sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <TextField
                    label="Date & Time"
                    type="datetime-local"
                    value={formData.date_time}
                    onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                  <TextField
                    label="Location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />

              <TextField
                label="Attendees"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                fullWidth
                placeholder="Comma-separated names or 'All'"
              />

              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={formData.theme || ''}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  label="Theme"
                >
                  <MenuItem value="">None</MenuItem>
                  {THEMES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                fullWidth
                placeholder="Meeting link or event URL"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={resetForm}>Cancel</Button>
            <Button type="submit" variant="contained" color="success">
              {editingEvent ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Calendar View */}
      {viewType === 'calendar' && (
        <Box sx={{ height: 'calc(100vh - 250px)', minHeight: 500 }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            date={calendarDate}
            view={calendarView}
            onNavigate={(date) => setCalendarDate(date)}
            onView={(view) => setCalendarView(view)}
            onSelectEvent={(event) => setSelectedEvent(event.resource)}
            style={{ height: '100%' }}
            popup
            eventPropGetter={(event) => {
              const theme = event.resource?.theme;
              const colors: Record<string, string> = {
                'hiking': '#4CAF50',
                'poker': '#9C27B0',
                'basketball': '#FF9800',
                'pickleball': '#2196F3',
                'roundtable': '#F44336',
                'group dinner': '#E91E63',
              };
              return {
                style: {
                  backgroundColor: theme ? colors[theme] : '#3174ad',
                  borderRadius: '4px',
                  opacity: 0.9,
                  border: 'none',
                  display: 'block',
                  cursor: 'pointer',
                }
              };
            }}
          />
        </Box>
      )}

      {/* Card View */}
      {viewType === 'card' && (
        <Grid container spacing={3}>
          {sortedEvents.map((event) => (
            <Grid key={event.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 1.5 }}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedEvent(event)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
                    <Typography variant="h4" fontWeight={800} sx={{ fontSize: '1.5rem' }}>
                      {event.title}
                    </Typography>
                    {isAdmin && (
                      <Box onClick={(e) => e.stopPropagation()}>
                        <IconButton size="small" color="primary" onClick={() => handleEdit(event)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(event.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <EventIcon fontSize="medium" color="action" />
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                      {formatDateTime(event.date_time)}
                    </Typography>
                  </Box>

                  {event.location && (
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <LocationOnIcon fontSize="medium" color="action" />
                      <Typography variant="body1" color="text.secondary">
                        {event.location}
                      </Typography>
                    </Box>
                  )}

                  {event.description && (
                    <Typography variant="body1" mb={3} lineHeight={1.6}>
                      {event.description}
                    </Typography>
                  )}

                  {event.attendees && (
                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                      <PeopleIcon fontSize="medium" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {event.attendees}
                      </Typography>
                    </Box>
                  )}

                  {event.theme && (
                    <Box mb={2}>
                      <Chip label={event.theme} color={getThemeColor(event.theme)} />
                    </Box>
                  )}

                  {event.link && (
                    <Box>
                      <Link 
                        href={event.link} 
                        target="_blank" 
                        rel="noopener" 
                        variant="body2"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <LinkIcon />
                          Event Link
                        </Box>
                      </Link>
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
        <Box>
          {sortedEvents.map((event) => (
            <Paper 
              key={event.id} 
              sx={{ 
                p: 3, 
                mb: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }
              }}
              onClick={() => setSelectedEvent(event)}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box flexGrow={1}>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(event.date_time)} at {formatTime(event.date_time)}
                    {event.location && ` • ${event.location}`}
                  </Typography>
                </Box>
                {event.theme && (
                  <Chip label={event.theme} color={getThemeColor(event.theme)} sx={{ mx: 2 }} />
                )}
                {isAdmin && (
                  <Box onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" color="primary" onClick={() => handleEdit(event)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(event.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Event Details Dialog */}
      <Dialog open={selectedEvent !== null} onClose={() => setSelectedEvent(null)} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle>{selectedEvent.title}</DialogTitle>
            <DialogContent>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <EventIcon color="action" />
                  <Typography variant="body2">{formatDateTime(selectedEvent.date_time)}</Typography>
                </Box>

                {selectedEvent.location && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOnIcon color="action" />
                    <Typography variant="body2">{selectedEvent.location}</Typography>
                  </Box>
                )}

                {selectedEvent.description && (
                  <Typography variant="body2">{selectedEvent.description}</Typography>
                )}

                {selectedEvent.attendees && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <PeopleIcon color="action" />
                    <Typography variant="body2">{selectedEvent.attendees}</Typography>
                  </Box>
                )}

                {selectedEvent.theme && (
                  <Box>
                    <Chip label={selectedEvent.theme} color={getThemeColor(selectedEvent.theme)} />
                  </Box>
                )}

                {selectedEvent.link && (
                  <Link href={selectedEvent.link} target="_blank" rel="noopener">
                    Event Link
                  </Link>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              {isAdmin && (
                <>
                  <Button startIcon={<EditIcon />} onClick={() => {
                    setSelectedEvent(null);
                    handleEdit(selectedEvent);
                  }}>
                    Edit
                  </Button>
                  <Button color="error" startIcon={<DeleteIcon />} onClick={() => {
                    setSelectedEvent(null);
                    handleDelete(selectedEvent.id);
                  }}>
                    Delete
                  </Button>
                </>
              )}
              <Button onClick={() => setSelectedEvent(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default EventsList;
