import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import { useOrg } from './OrgContext';
import { useNavigate } from 'react-router-dom';
import './EventListing.css';
import apiBase from '../apiBase';

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day} - ${month} - ${year}`;
};

const EventListing = () => {
    const { orgId } = useOrg();
    const [events, setEvents] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    
    // Filter states
    const [filterName, setFilterName] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterCountry, setFilterCountry] = useState('');
    const [filterYear, setFilterYear] = useState('');

    // For create event modal
    const [showCreate, setShowCreate] = useState(false);
    const [newEvent, setNewEvent] = useState({
        name: '',
        eventDt: '',
        location: '',
        country: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents();
        // eslint-disable-next-line
    }, [orgId]);

    const fetchEvents = () => {
        setLoading(true);
        authFetch(`${apiBase}/org/event/list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orgId })
        })
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(data => {
            // Sort by date descending (newer first)
            const sortedData = Array.isArray(data) 
                ? data.sort((a, b) => new Date(b.eventDt) - new Date(a.eventDt))
                : [];
            setEvents(sortedData);
            setLoading(false);
        })
        .catch(err => {
            setError(err.message);
            setLoading(false);
        });
    };

const handleDelete = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
        authFetch(`${apiBase}/org/event/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId })
        })
        .then(res => {
            if (!res.ok) throw new Error('Delete failed');
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return res.json();
            } else {
                return res.text(); // fallback for plain text
            }
        })
        .then(() => {
            setShowDeleteSuccess(true); // Show the success popup
        })
        .catch(err => {
            alert('Delete failed: ' + err.message);
        });
    }
};

    const handleCreate = (e) => {
        e.preventDefault();
        authFetch(`${apiBase}/org/event/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEvent)
        })
        .then(res => {
            if (!res.ok) throw new Error('Create failed');
            return res.json();
        })
        .then(() => {
            setShowCreate(false);
            setNewEvent({ name: '', eventDt: '', location: '', country: '' });
            fetchEvents();
        })
        .catch(err => {
            alert('Create failed: ' + err.message);
        });
    };

    // New: handle row click
    const handleRowClick = (eventId) => {
        navigate(`/event/${eventId}`);
    };

    // Filter events
    const filteredEvents = Array.isArray(events) ? events.filter(event => {
        const matchName = !filterName || event.name.toLowerCase().includes(filterName.toLowerCase());
        const matchLocation = !filterLocation || event.location.toLowerCase().includes(filterLocation.toLowerCase());
        const matchCountry = !filterCountry || event.country.toLowerCase().includes(filterCountry.toLowerCase());
        const matchYear = !filterYear || new Date(event.eventDt).getFullYear().toString() === filterYear;
        return matchName && matchLocation && matchCountry && matchYear;
    }) : [];

    // Get unique years for filter dropdown
    const availableYears = Array.isArray(events) 
        ? [...new Set(events.map(e => new Date(e.eventDt).getFullYear()))].sort((a, b) => b - a)
        : [];

    if (loading) return <div>Loading events...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="event-listing-container">
            <h1>Event Listing</h1>
            
            {/* Filter Section */}
            <div style={{
                background: '#f5f5f5',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <div style={{ flex: '1 1 200px' }}>
                    <input
                        type="text"
                        placeholder="Filter by name..."
                        value={filterName}
                        onChange={e => setFilterName(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                    <input
                        type="text"
                        placeholder="Filter by location..."
                        value={filterLocation}
                        onChange={e => setFilterLocation(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                </div>
                <div style={{ flex: '1 1 150px' }}>
                    <input
                        type="text"
                        placeholder="Filter by country..."
                        value={filterCountry}
                        onChange={e => setFilterCountry(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                </div>
                <div style={{ flex: '1 1 120px' }}>
                    <select
                        value={filterYear}
                        onChange={e => setFilterYear(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    >
                        <option value="">All Years</option>
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                {(filterName || filterLocation || filterCountry || filterYear) && (
                    <button
                        onClick={() => {
                            setFilterName('');
                            setFilterLocation('');
                            setFilterCountry('');
                            setFilterYear('');
                        }}
                        style={{
                            padding: '8px 16px',
                            background: '#6c757d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Clear Filters
                    </button>
                )}
            </div>
            
            <div className="event-table-container">
                <table className="event-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Date</th>
                            <th>Location</th>
                            <th>Country</th>
                            <th className="action-col" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvents.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
                                    {Array.isArray(events) && events.length > 0 
                                        ? 'No events match the filter criteria'
                                        : 'No events found'}
                                </td>
                            </tr>
                        ) : (
                            filteredEvents.map(event => (
                                <tr
                                    key={event.id}
                                    style={{ cursor: 'pointer' }}
                                    onClick={e => {
                                        // Prevent row click if clicking a button
                                        if (e.target.tagName === 'BUTTON') return;
                                        handleRowClick(event.id);
                                    }}
                                >
                                    <td>{event.name}</td>
                                    <td>{formatDate(event.eventDt)}</td>
                                    <td>{event.location}</td>
                                    <td>{event.country}</td>
                                    <td className="action-col" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <button
                                            style={{
                                                background: '#28a745',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '6px 12px',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => navigate(`/racesetup/${event.id}`)}
                                        >
                                            Race Setup
                                        </button>
                                        <button
                                            style={{
                                                background: '#007bff',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '6px 12px',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => navigate(`/topevent/${event.id}/B`)}
                                        >
                                            Top Event Page
                                        </button>
                                        <button
                                            style={{
                                                background: '#c00',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '6px 12px',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleDelete(event.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                    <button
                        style={{
                            background: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '10px 20px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                        onClick={() => setShowCreate(true)}
                    >
                        Create Event
                    </button>
                </div>
            </div>
            {showCreate && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <form
                        onSubmit={handleCreate}
                        style={{
                            background: '#fff',
                            padding: '32px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                            minWidth: '320px'
                        }}
                    >
                        <h2>Create Event</h2>
                        <input
                            type="text"
                            placeholder="Name"
                            value={newEvent.name}
                            onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                            required
                            style={{ width: '100%', marginBottom: '12px', padding: '8px' }}
                        />
                        <input
                            type="datetime-local"
                            placeholder="Event Date"
                            value={newEvent.eventDt}
                            onChange={e => setNewEvent({ ...newEvent, eventDt: e.target.value })}
                            required
                            style={{ width: '100%', marginBottom: '12px', padding: '8px' }}
                        />
                        <input
                            type="text"
                            placeholder="Location"
                            value={newEvent.location}
                            onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                            required
                            style={{ width: '100%', marginBottom: '12px', padding: '8px' }}
                        />
                        <input
                            type="text"
                            placeholder="Country"
                            value={newEvent.country}
                            onChange={e => setNewEvent({ ...newEvent, country: e.target.value })}
                            required
                            style={{ width: '100%', marginBottom: '12px', padding: '8px' }}
                        />
                        <div style={{ marginTop: '16px', textAlign: 'right' }}>
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                style={{
                                    marginRight: '12px',
                                    background: '#ccc',
                                    color: '#222',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '8px 16px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={{
                                    background: '#007bff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '8px 16px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {showDeleteSuccess && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(5px)',
                    transform: 'translate(-50%, -50%)',
                    background: '#fff',
                    padding: '32px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                    zIndex: 1000
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <h2>Event Deleted</h2>
                        <p>The event has been successfully deleted.</p>
                        <button
                            onClick={() => {
                                setShowDeleteSuccess(false);
                                fetchEvents();
                            }}
                            style={{
                                padding: '8px 24px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#007bff',
                                color: '#fff',
                                cursor: 'pointer',
                                marginTop: '16px'
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventListing;