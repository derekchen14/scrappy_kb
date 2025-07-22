import React, { useState, useEffect, useMemo } from 'react';
import { Event, EventCreate } from '../types';
import { useAuthenticatedAPI } from '../hooks/useAuthenticatedAPI';
import { useAdmin } from '../hooks/useAdmin';
import Modal from './Modal';

type ViewType = 'card' | 'compact' | 'calendar';

const THEMES = ['hiking', 'poker', 'basketball', 'pickleball', 'roundtable', 'group dinner'];

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
    link: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEvents = async () => {
    try {
      const response = await publicAPI.get<Event[]>('/events/');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await authenticatedAPI.put(`/events/${editingEvent.id}`, formData);
      } else {
        await authenticatedAPI.post('/events/', formData);
      }
      fetchEvents();
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date_time: event.date_time,
      location: event.location || '',
      attendees: event.attendees || '',
      theme: event.theme || '',
      link: event.link || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await authenticatedAPI.delete(`/events/${id}`);
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date_time: '',
      location: '',
      attendees: '',
      theme: '',
      link: ''
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString();
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getThemeColor = (theme: string) => {
    const colors: { [key: string]: string } = {
      hiking: 'bg-green-100 text-green-800',
      poker: 'bg-red-100 text-red-800',
      basketball: 'bg-orange-100 text-orange-800',
      pickleball: 'bg-yellow-100 text-yellow-800',
      roundtable: 'bg-blue-100 text-blue-800',
      'group dinner': 'bg-purple-100 text-purple-800'
    };
    return colors[theme] || 'bg-gray-100 text-gray-800';
  };

  // Group events by date for calendar grid view
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: Event[] } = {};
    events.forEach(event => {
      const date = new Date(event.date_time);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    // Sort events within each date by time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
    });
    
    return grouped;
  }, [events]);

  // Generate calendar grid for current month
  const generateCalendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Find the Sunday before the first day (or the first day if it's Sunday)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 6 weeks of days (42 days total)
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth()).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const isCurrentMonth = currentDate.getMonth() === month;
      const dayEvents = eventsByDate[dateKey] || [];
      
      days.push({
        date: new Date(currentDate),
        dateKey,
        isCurrentMonth,
        events: dayEvents
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Group into weeks
    const weeks = [];
    for (let i = 0; i < 42; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return weeks;
  }, [currentMonth, eventsByDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
        // Don't go before January 2025
        if (newMonth.getFullYear() < 2025 || (newMonth.getFullYear() === 2025 && newMonth.getMonth() < 0)) {
          return new Date(2025, 0); // January 2025
        }
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
        // Don't go after December 2025
        if (newMonth.getFullYear() > 2025 || (newMonth.getFullYear() === 2025 && newMonth.getMonth() > 11)) {
          return new Date(2025, 11); // December 2025
        }
      }
      return newMonth;
    });
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
  }, [events]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h2 className="text-3xl font-bold text-gray-900">Events</h2>
          
          {/* View Switcher */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewType('calendar')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewType === 'calendar' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewType('card')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewType === 'card' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Card
            </button>
            <button
              onClick={() => setViewType('compact')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewType === 'compact' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Compact
            </button>
          </div>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Add Event
          </button>
        )}
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
            
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Date *</label>
                  <input
                    type="date"
                    value={formData.date_time ? formData.date_time.split('T')[0] : ''}
                    onChange={(e) => {
                      const timeValue = formData.date_time ? formData.date_time.split('T')[1] || '12:00' : '12:00';
                      setFormData({...formData, date_time: `${e.target.value}T${timeValue}`});
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Time *</label>
                  <input
                    type="time"
                    value={formData.date_time ? formData.date_time.split('T')[1] || '' : ''}
                    onChange={(e) => {
                      const dateValue = formData.date_time ? formData.date_time.split('T')[0] : new Date().toISOString().split('T')[0];
                      setFormData({...formData, date_time: `${dateValue}T${e.target.value}`});
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Theme</label>
                <select
                  value={formData.theme}
                  onChange={(e) => setFormData({...formData, theme: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a theme</option>
                  {THEMES.map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Event Link</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({...formData, link: e.target.value})}
                  placeholder="https://lu.ma/event or https://partiful.com/event"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Attendees</label>
                <textarea
                  value={formData.attendees}
                  onChange={(e) => setFormData({...formData, attendees: e.target.value})}
                  rows={2}
                  placeholder="List attendees (comma-separated or line-separated)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                >
                  {editingEvent ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewType === 'calendar' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <button
              onClick={() => navigateMonth('prev')}
              disabled={currentMonth.getFullYear() === 2025 && currentMonth.getMonth() === 0}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              disabled={currentMonth.getFullYear() === 2025 && currentMonth.getMonth() === 11}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-px mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {generateCalendarGrid.map((week, weekIndex) => 
                week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`min-h-[120px] bg-white p-2 ${
                      !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                    }`}
                  >
                    {/* Date Number */}
                    <div className="text-sm font-medium mb-1">
                      {day.date.getDate()}
                    </div>
                    
                    {/* Events for this day */}
                    <div className="space-y-1">
                      {day.events.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${getThemeColor(event.theme || '')}`}
                          title={`${event.title} - ${formatTime(event.date_time)}`}
                        >
                          <div className="font-medium truncate">
                            {formatTime(event.date_time)} {event.title}
                          </div>
                        </div>
                      ))}
                      
                      {/* Show "+X more" if there are more events */}
                      {day.events.length > 3 && (
                        <div className="text-xs text-gray-500 p-1">
                          +{day.events.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {events.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No events scheduled yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Card View */}
      {viewType === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map(event => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-2 flex items-center">📅 {formatDateTime(event.date_time)}</p>
                  {event.location && (
                    <p className="text-gray-500 mb-2 flex items-center">📍 {event.location}</p>
                  )}
                  {event.link && (
                    <p className="mb-2 flex items-center">
                      🔗 <a 
                        href={event.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline ml-1"
                      >
                        View Event →
                      </a>
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEdit(event)} 
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id)} 
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {event.theme && (
                <div className="mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getThemeColor(event.theme)}`}>
                    {event.theme}
                  </span>
                </div>
              )}
              
              {event.description && (
                <p className="text-gray-700 mb-3 flex items-start">📝 <span className="ml-1">{event.description}</span></p>
              )}
              
              {event.attendees && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">👥 Attendees:</h4>
                  <p className="text-sm text-gray-600 ml-5">{event.attendees}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Compact View */}
      {viewType === 'compact' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {sortedEvents.map(event => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="text-left w-full"
                >
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                      {event.title}
                    </h3>
                    {event.theme && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getThemeColor(event.theme)}`}>
                        {event.theme}
                      </span>
                    )}
                  </div>
                </button>
                
                <p className="text-xs text-gray-600">
                  {formatDate(event.date_time)} at {formatTime(event.date_time)}
                </p>
                
                {event.location && (
                  <p className="text-xs text-gray-500">📍 {event.location}</p>
                )}
                
                {event.link && (
                  <a 
                    href={event.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Event
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Details Modal */}
      <Modal
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || ''}
      >
        {selectedEvent && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedEvent.title}</h3>
              <p className="text-gray-600 mb-4">{formatDateTime(selectedEvent.date_time)}</p>
              
              {selectedEvent.location && (
                <p className="text-gray-500 mb-4">📍 {selectedEvent.location}</p>
              )}

              {selectedEvent.link && (
                <p className="mb-4">
                  <a 
                    href={selectedEvent.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    View Event →
                  </a>
                </p>
              )}

              {selectedEvent.theme && (
                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getThemeColor(selectedEvent.theme)}`}>
                    {selectedEvent.theme}
                  </span>
                </div>
              )}
              
              {selectedEvent.description && (
                <p className="text-gray-700 mb-4">{selectedEvent.description}</p>
              )}
              
              {selectedEvent.attendees && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Attendees:</h4>
                  <p className="text-gray-600">{selectedEvent.attendees}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      handleEdit(selectedEvent);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      handleDelete(selectedEvent.id);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
              {!isAdmin && (
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EventsList;