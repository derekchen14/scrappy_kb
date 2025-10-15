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
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { Event, EventCreate } from '../types';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';

type ViewType = 'card' | 'compact' | 'calendar';

const THEMES = ['hiking', 'poker', 'basketball', 'pickleball', 'roundtable', 'group dinner'] as const;

const pad2 = (n: number) => String(n).padStart(2, '0');
const toDateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const MIN_MONTH = new Date(2025, 0, 1);
const MAX_MONTH = new Date(2025, 11, 1);

const EventsList: React.FC = () => {
  const { authenticatedAPI, publicAPI } = useAuthenticatedAPI();
  const { isAdmin } = useAdmin();

  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewType, setViewType] = useState<ViewType>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 6)); // July 2025
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

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {};
    for (const ev of events) {
      const dateKey = toDateKey(new Date(ev.date_time));
      (grouped[dateKey] ||= []).push(ev);
    }
    for (const dateKey of Object.keys(grouped)) {
      grouped[dateKey].sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
    }
    return grouped;
  }, [events]);

  const generateCalendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Array<{
      date: Date;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: Event[];
    }> = [];

    const cursor = new Date(startDate);
    const todayKey = toDateKey(new Date());

    for (let i = 0; i < 42; i++) {
      const date = new Date(cursor);
      const dateKey = toDateKey(date);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = dateKey === todayKey;

      days.push({
        date,
        dateKey,
        isCurrentMonth,
        isToday,
        events: eventsByDate[dateKey] || [],
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    const weeks: typeof days[] = [];
    for (let i = 0; i < 42; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [currentMonth, eventsByDate]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setDate(1);
      next.setMonth(next.getMonth() + (direction === 'prev' ? -1 : 1));
      if (next < MIN_MONTH) return new Date(MIN_MONTH);
      if (next > MAX_MONTH) return new Date(MAX_MONTH);
      return next;
    });
  }, []);

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
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <IconButton onClick={() => navigateMonth('prev')} disabled={currentMonth <= MIN_MONTH}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h5" fontWeight={600}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Typography>
            <IconButton onClick={() => navigateMonth('next')} disabled={currentMonth >= MAX_MONTH}>
              <ChevronRightIcon />
            </IconButton>
          </Box>

          <Paper sx={{ p: 2 }}>
            <Grid container spacing={1}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Grid key={day} sx={{ width: '14.28%', textAlign: 'center', p: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                    {day}
                  </Typography>
                </Grid>
              ))}
            </Grid>

            {generateCalendarGrid.map((week, weekIdx) => (
              <Grid container spacing={1} key={weekIdx} sx={{ mt: 0.5 }}>
                {week.map((day) => (
                  <Grid key={day.dateKey} sx={{ width: '14.28%', p: 0.5 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        minHeight: 100,
                        p: 1,
                        bgcolor: day.isToday ? 'primary.50' : day.isCurrentMonth ? 'background.paper' : 'action.hover',
                        borderColor: day.isToday ? 'primary.main' : 'divider',
                        borderWidth: day.isToday ? 2 : 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={day.isToday ? 700 : 500}
                        color={day.isCurrentMonth ? 'text.primary' : 'text.disabled'}
                      >
                        {day.date.getDate()}
                      </Typography>
                      <Box mt={0.5} display="flex" flexDirection="column" gap={0.5}>
                        {day.events.map((ev) => (
                          <Chip
                            key={ev.id}
                            label={ev.title}
                            size="small"
                            color={ev.theme ? getThemeColor(ev.theme) : 'default'}
                            onClick={() => setSelectedEvent(ev)}
                            sx={{
                              cursor: 'pointer',
                              height: 'auto',
                              '& .MuiChip-label': {
                                whiteSpace: 'normal',
                                fontSize: '0.65rem',
                                py: 0.25,
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ))}
          </Paper>
        </Box>
      )}

      {/* Card View */}
      {viewType === 'card' && (
        <Grid container spacing={3}>
          {sortedEvents.map((event) => (
            <Grid key={event.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 1.5 }}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      {event.title}
                    </Typography>
                    {isAdmin && (
                      <Box>
                        <IconButton size="small" color="primary" onClick={() => handleEdit(event)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(event.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <EventIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(event.date_time)}
                    </Typography>
                  </Box>

                  {event.location && (
                    <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {event.location}
                      </Typography>
                    </Box>
                  )}

                  {event.description && (
                    <Typography variant="body2" mb={2}>
                      {event.description}
                    </Typography>
                  )}

                  {event.attendees && (
                    <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                      <PeopleIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {event.attendees}
                      </Typography>
                    </Box>
                  )}

                  {event.theme && (
                    <Box mt={1}>
                      <Chip label={event.theme} size="small" color={getThemeColor(event.theme)} />
                    </Box>
                  )}

                  {event.link && (
                    <Box mt={1}>
                      <Link href={event.link} target="_blank" rel="noopener" variant="caption">
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <LinkIcon fontSize="small" />
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
            <Paper key={event.id} sx={{ p: 2, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box flexGrow={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {event.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(event.date_time)} at {formatTime(event.date_time)}
                    {event.location && ` • ${event.location}`}
                  </Typography>
                </Box>
                {event.theme && (
                  <Chip label={event.theme} size="small" color={getThemeColor(event.theme)} sx={{ mx: 2 }} />
                )}
                {isAdmin && (
                  <Box>
                    <IconButton size="small" color="primary" onClick={() => handleEdit(event)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(event.id)}>
                      <DeleteIcon fontSize="small" />
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
