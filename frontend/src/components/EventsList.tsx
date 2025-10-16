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
  Divider,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  ViewList as ViewListIcon,
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  Link as LinkIcon,
  History as HistoryIcon,
  Upcoming as UpcomingIcon,
} from '@mui/icons-material';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Event, EventCreate } from '../types';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';

const localizer = momentLocalizer(moment);

type ViewType = 'timeline' | 'calendar';

const THEMES = ['hiking', 'poker', 'basketball', 'pickleball', 'roundtable', 'group dinner'] as const;

const EventsList: React.FC = () => {
  const { authenticatedAPI, publicAPI } = useAuthenticatedAPI();
  const { isAdmin } = useAdmin();

  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewType, setViewType] = useState<ViewType>('timeline');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>('month');
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [formData, setFormData] = useState<EventCreate>({
    title: '',
    description: '',
    date_time: '',
    location: '',
    attendees: '',
    theme: '',
    link: '',
  });
  const [showLumaDialog, setShowLumaDialog] = useState(false);
  const [lumaUrl, setLumaUrl] = useState('');
  const [lumaLoading, setLumaLoading] = useState(false);
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

  const formatForDateTimeLocal = useCallback((isoString: string) => {
    try {
      const d = new Date(isoString);
      const pad = (n: number) => String(n).padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const min = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    } catch (e) {
      return '';
    }
  }, []);

  const fetchLumaAndPrefill = useCallback(async (url: string) => {
    setLumaLoading(true);
    try {
      const proxy = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
      const res = await fetch(proxy);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const text = await res.text();

      const jsonLdMatch = text.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      if (!jsonLdMatch) throw new Error('No JSON-LD script tag found');

      const jsonText = jsonLdMatch[1].trim();
      const parsed = JSON.parse(jsonText);

      const title = parsed.name || '';
      const description = parsed.description || '';
      const startDate = parsed.startDate || parsed.date || '';
      const location = parsed.location?.address || parsed.location?.name || '';

      setFormData({
        title,
        description,
        date_time: startDate ? formatForDateTimeLocal(startDate) : '',
        location,
        attendees: '',
        theme: '',
        link: url,
      });
      setEditingEvent(null);
      setShowLumaDialog(false);
      setShowForm(true);
    } catch (err: any) {
      console.error('Luma fetch/parse error:', err);
      setErrorMsg(err?.message || 'Failed to parse Luma link');
    } finally {
      setLumaLoading(false);
    }
  }, [formatForDateTimeLocal]);

  const formatDateTime = useCallback((dateTime: string) => new Date(dateTime).toLocaleString(), []);

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

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    const upcoming = sortedEvents.filter(event => new Date(event.date_time) >= now);
    const past = sortedEvents.filter(event => new Date(event.date_time) < now).reverse();
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [sortedEvents]);

  // Group events by date
  const groupEventsByDate = useCallback((events: Event[]) => {
    const groups: { date: string; events: Event[] }[] = [];
    const dateMap: { [key: string]: Event[] } = {};
    
    events.forEach(event => {
      const date = new Date(event.date_time);
      const dateKey = date.toDateString(); // Use unique key for grouping
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(event);
    });

    // Convert to array and format
    Object.keys(dateMap).forEach(dateKey => {
      const date = new Date(dateKey);
      const formatted = date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric'
      });
      groups.push({
        date: formatted,
        events: dateMap[dateKey]
      });
    });

    return groups;
  }, []);

  const upcomingByDate = useMemo(() => groupEventsByDate(upcomingEvents), [upcomingEvents, groupEventsByDate]);
  const pastByDate = useMemo(() => groupEventsByDate(pastEvents), [pastEvents, groupEventsByDate]);

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
            <ToggleButton value="timeline">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="calendar">
              <CalendarIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {isAdmin && (
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
            >
              Add Event
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<LinkIcon />}
              onClick={() => setShowLumaDialog(true)}
            >
              Add by Luma link
            </Button>
          </Box>
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

      {/* Luma Link Dialog */}
      <Dialog open={showLumaDialog} onClose={() => setShowLumaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Event from Luma URL</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Luma URL"
              type="url"
              value={lumaUrl}
              onChange={(e) => setLumaUrl(e.target.value)}
              fullWidth
              placeholder="https://luma.com/kl7casml"
            />
            {lumaLoading && <Typography>Fetching...</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLumaDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => fetchLumaAndPrefill(lumaUrl)}
            disabled={!lumaUrl || lumaLoading}
          >
            Fetch & Prefill
          </Button>
        </DialogActions>
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

      {/* Timeline View */}
      {viewType === 'timeline' && (
        <Box>
          {/* Upcoming Events Section */}
          {upcomingEvents.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', mb: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No upcoming events scheduled
              </Typography>
            </Paper>
          ) : (
            <Box mb={4}>
              {upcomingByDate.map((group, groupIndex) => (
                <Box key={group.date} sx={{ mb: 4 }}>
                  {/* Date Header - Outside cards */}
                  <Box 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 2,
                      ml: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'text.primary',
                        flexShrink: 0,
                      }}
                    />
                    <Typography 
                      variant="body1" 
                      fontWeight={700}
                      sx={{ 
                        color: 'text.primary',
                        fontSize: '0.95rem',
                      }}
                    >
                      {group.date}
                    </Typography>
                  </Box>

                  {/* Events for this date */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {group.events.map((event) => {
                      const eventDate = new Date(event.date_time);
                      const timeStr = eventDate.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      });

                      return (
                        <Card
                          key={event.id}
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              boxShadow: 3,
                            },
                          }}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                            <Box display="flex" justifyContent="space-between" alignItems="start" gap={2}>
                              <Box flexGrow={1}>
                                {/* Time */}
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  fontWeight={600}
                                  sx={{ mb: 0.5, fontSize: '0.875rem' }}
                                >
                                  {timeStr}
                                </Typography>

                                {/* Title */}
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 1, fontSize: '1.1rem' }}>
                                  {event.title}
                                </Typography>

                                {/* Description */}
                                {event.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
                                    {event.description}
                                  </Typography>
                                )}

                                {/* Location */}
                                {event.location && (
                                  <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
                                    <LocationOnIcon sx={{ fontSize: 18 }} color="action" />
                                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                                      {event.location}
                                    </Typography>
                                  </Box>
                                )}

                                {/* Attendees */}
                                {event.attendees && (
                                  <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
                                    <PeopleIcon sx={{ fontSize: 18 }} color="action" />
                                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                                      {event.attendees}
                                    </Typography>
                                  </Box>
                                )}

                                {/* Event Link */}
                                {event.link && (
                                  <Link
                                    href={event.link}
                                    target="_blank"
                                    rel="noopener"
                                    variant="body2"
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1, fontSize: '0.875rem' }}
                                  >
                                    <LinkIcon sx={{ fontSize: 16 }} />
                                    View Event
                                  </Link>
                                )}
                              </Box>

                              {/* Right side: Theme chip and admin actions */}
                              <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                                {event.theme && (
                                  <Chip 
                                    label={event.theme} 
                                    color={getThemeColor(event.theme)} 
                                    size="small"
                                    sx={{ height: 24 }}
                                  />
                                )}
                                {isAdmin && (
                                  <Box onClick={(e) => e.stopPropagation()} display="flex" gap={0.5}>
                                    <IconButton size="small" color="primary" onClick={() => handleEdit(event)}>
                                      <EditIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(event.id)}>
                                      <DeleteIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Past Events Section */}
          {pastEvents.length > 0 && (
            <Box>
              <Divider sx={{ my: 4 }} />
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={700} color="text.secondary">
                  Past Events ({pastEvents.length})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowPastEvents(!showPastEvents)}
                  startIcon={showPastEvents ? <UpcomingIcon /> : <HistoryIcon />}
                >
                  {showPastEvents ? 'Hide' : 'Show'} Past Events
                </Button>
              </Box>

              {showPastEvents && (
                <Box mb={4}>
                  {pastByDate.map((group) => (
                    <Box key={group.date} sx={{ mb: 4 }}>
                      {/* Date Header - Outside cards */}
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          mb: 2,
                          ml: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'text.disabled',
                            flexShrink: 0,
                          }}
                        />
                        <Typography 
                          variant="body1" 
                          fontWeight={700}
                          sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.95rem',
                          }}
                        >
                          {group.date}
                        </Typography>
                      </Box>

                      {/* Events for this date */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {group.events.map((event) => {
                          const eventDate = new Date(event.date_time);
                          const timeStr = eventDate.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          });

                          return (
                            <Card
                              key={event.id}
                              sx={{
                                cursor: 'pointer',
                                opacity: 0.85,
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  opacity: 1,
                                  boxShadow: 3,
                                },
                              }}
                              onClick={() => setSelectedEvent(event)}
                            >
                              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                <Box display="flex" justifyContent="space-between" alignItems="start" gap={2}>
                                  <Box flexGrow={1}>
                                    {/* Time */}
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary" 
                                      fontWeight={600}
                                      sx={{ mb: 0.5, fontSize: '0.875rem' }}
                                    >
                                      {timeStr}
                                    </Typography>

                                    {/* Title */}
                                    <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ mb: 1, fontSize: '1.1rem' }}>
                                      {event.title}
                                    </Typography>

                                    {/* Description */}
                                    {event.description && (
                                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
                                        {event.description}
                                      </Typography>
                                    )}

                                    {/* Location */}
                                    {event.location && (
                                      <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
                                        <LocationOnIcon sx={{ fontSize: 18 }} color="action" />
                                        <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                                          {event.location}
                                        </Typography>
                                      </Box>
                                    )}

                                    {/* Attendees */}
                                    {event.attendees && (
                                      <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
                                        <PeopleIcon sx={{ fontSize: 18 }} color="action" />
                                        <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                                          {event.attendees}
                                        </Typography>
                                      </Box>
                                    )}

                                    {/* Event Link */}
                                    {event.link && (
                                      <Link
                                        href={event.link}
                                        target="_blank"
                                        rel="noopener"
                                        variant="body2"
                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1, fontSize: '0.875rem' }}
                                      >
                                        <LinkIcon sx={{ fontSize: 16 }} />
                                        View Event
                                      </Link>
                                    )}
                                  </Box>

                                  {/* Right side: Theme chip and admin actions */}
                                  <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                                    {event.theme && (
                                      <Chip 
                                        label={event.theme} 
                                        color={getThemeColor(event.theme)} 
                                        size="small"
                                        sx={{ height: 24 }}
                                      />
                                    )}
                                    {isAdmin && (
                                      <Box onClick={(e) => e.stopPropagation()} display="flex" gap={0.5}>
                                        <IconButton size="small" color="primary" onClick={() => handleEdit(event)}>
                                          <EditIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(event.id)}>
                                          <DeleteIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
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
