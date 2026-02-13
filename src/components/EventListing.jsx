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
    const { orgId, setOrgId } = useOrg();
    const [events, setEvents] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    const [showArchiveSuccess, setShowArchiveSuccess] = useState(false);
    const [archiveMessage, setArchiveMessage] = useState('');
    
    // Tab state: 'upcoming' or 'archived'
    const [activeTab, setActiveTab] = useState('upcoming');
    
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

    // For CSV upload modal
    const [showCsvUpload, setShowCsvUpload] = useState(false);
    const [selectedEventForUpload, setSelectedEventForUpload] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        // Check sessionStorage if context orgId is missing
        const currentOrgId = orgId || sessionStorage.getItem('orgId');
        if (currentOrgId && !orgId) {
            setOrgId(currentOrgId);
        }
        if (currentOrgId) {
            fetchEvents();
        } else {
            setError('No organization ID found');
            setLoading(false);
        }
    }, [orgId, setOrgId, activeTab]);

    const fetchEvents = () => {
        const currentOrgId = orgId || sessionStorage.getItem('orgId');
        if (!currentOrgId) return;
        
        setLoading(true);
        setError(null);
        
        // Choose endpoint based on active tab
        const endpoint = activeTab === 'upcoming' 
            ? `${apiBase}/org/event/list/upcoming`
            : `${apiBase}/org/event/list/archived`;

        authFetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orgId: currentOrgId })
        })
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(data => {
            setEvents(data || []);
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
                    return res.text();
                }
            })
            .then(() => {
                setShowDeleteSuccess(true);
            })
            .catch(err => {
                alert('Delete failed: ' + err.message);
            });
        }
    };

    const handleArchive = (eventId) => {
        if (window.confirm('Are you sure you want to archive this event? All results will be moved to the archive table.')) {
            authFetch(`${apiBase}/org/event/archive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId })
            })
            .then(res => {
                if (!res.ok) throw new Error('Archive failed');
                return res.json();
            })
            .then(data => {
                setArchiveMessage(`Event archived successfully. ${data.resultsArchived || 0} results archived.`);
                setShowArchiveSuccess(true);
            })
            .catch(err => {
                alert('Archive failed: ' + err.message);
            });
        }
    };

    const handleUnarchive = (eventId) => {
        if (window.confirm('Are you sure you want to unarchive this event? All results will be restored to the active table.')) {
            authFetch(`${apiBase}/org/event/unarchive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId })
            })
            .then(res => {
                if (!res.ok) throw new Error('Unarchive failed');
                return res.json();
            })
            .then(data => {
                setArchiveMessage(`Event unarchived successfully. ${data.resultsRestored || 0} results restored.`);
                setShowArchiveSuccess(true);
            })
            .catch(err => {
                alert('Unarchive failed: ' + err.message);
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

    const handleRowClick = (eventId) => {
        navigate(`/event/${eventId}`);
    };

    const handleCsvFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setCsvFile(e.target.files[0]);
        }
    };

    const handleCsvUpload = () => {
        if (!csvFile || !selectedEventForUpload) {
            alert('Please select both an event and a CSV file');
            return;
        }

        const formData = new FormData();
        formData.append('file', csvFile);
        formData.append('eventId', selectedEventForUpload);

        setUploadProgress('Uploading...');

        authFetch(`${apiBase}/org/event/upload-results-csv`, {
            method: 'POST',
            body: formData
        })
        .then(res => {
            if (!res.ok) throw new Error('Upload failed');
            return res.json();
        })
        .then(data => {
            setUploadProgress(null);
            alert(`CSV uploaded successfully!\nRows processed: ${data.rowsProcessed}\nRows failed: ${data.rowsFailed || 0}`);
            setShowCsvUpload(false);
            setCsvFile(null);
            setSelectedEventForUpload(null);
            fetchEvents();
        })
        .catch(err => {
            setUploadProgress(null);
            alert('Upload failed: ' + err.message);
        });
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
            
            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                borderBottom: '2px solid #e0e0e0'
            }}>
                <button
                    onClick={() => setActiveTab('upcoming')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'upcoming' ? '#007bff' : 'transparent',
                        color: activeTab === 'upcoming' ? '#fff' : '#333',
                        border: 'none',
                        borderBottom: activeTab === 'upcoming' ? '3px solid #0056b3' : 'none',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'upcoming' ? 'bold' : 'normal',
                        fontSize: '16px'
                    }}
                >
                    Upcoming Events
                </button>
                <button
                    onClick={() => setActiveTab('archived')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'archived' ? '#007bff' : 'transparent',
                        color: activeTab === 'archived' ? '#fff' : '#333',
                        border: 'none',
                        borderBottom: activeTab === 'archived' ? '3px solid #0056b3' : 'none',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'archived' ? 'bold' : 'normal',
                        fontSize: '16px'
                    }}
                >
                    Archived Events
                </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Filter by name"
                    value={filterName}
                    onChange={e => setFilterName(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        minWidth: '200px'
                    }}
                />
                <input
                    type="text"
                    placeholder="Filter by location"
                    value={filterLocation}
                    onChange={e => setFilterLocation(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        minWidth: '200px'
                    }}
                />
                <input
                    type="text"
                    placeholder="Filter by country"
                    value={filterCountry}
                    onChange={e => setFilterCountry(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        minWidth: '200px'
                    }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <label style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Filter by Year:</label>
                    <select
                        value={filterYear}
                        onChange={e => setFilterYear(e.target.value)}
                        style={{
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
                <button
                    style={{
                        padding: '8px 16px',
                        background: '#6c757d',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginLeft: 'auto',
                        marginRight: '8px'
                    }}
                    onClick={() => setShowCsvUpload(true)}
                >
                    Upload CSV Results
                </button>
                <button
                    style={{
                        padding: '8px 16px',
                        background: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                    onClick={() => setShowCreate(true)}
                >
                    Create New Event
                </button>
            </div>

            <div className="events-grid">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map(event => (
                        <div key={event.id} className="event-card">
                            <div className="event-card-header">
                                <h3 
                                    onClick={() => handleRowClick(event.id)}
                                    style={{ cursor: 'pointer', color: '#ffffff', margin: '0' }}
                                >
                                    {event.name}
                                </h3>
                            </div>
                            <div className="event-card-body">
                                <div className="event-detail">
                                    <span className="event-label">Date:</span>
                                    <span className="event-value">{formatDate(event.eventDt)}</span>
                                </div>
                                <div className="event-detail">
                                    <span className="event-label">Location:</span>
                                    <span className="event-value">{event.location}</span>
                                </div>
                                <div className="event-detail">
                                    <span className="event-label">Country:</span>
                                    <span className="event-value">{event.country}</span>
                                </div>
                            </div>
                            <div className="event-card-actions">
                                <button
                                    className="btn-race-setup"
                                    onClick={() => navigate(`/racesetup/${event.id}`)}
                                >
                                    Race Setup
                                </button>
                                <button
                                    className="btn-results"
                                    onClick={() => navigate(`/result/${event.id}`)}
                                >
                                    View Results
                                </button>
                                <button
                                    className="btn-delete"
                                    onClick={() => handleDelete(event.id)}
                                >
                                    Delete
                                </button>
                                {activeTab === 'upcoming' ? (
                                    <button
                                        className="btn-archive"
                                        onClick={() => handleArchive(event.id)}
                                    >
                                        Archive
                                    </button>
                                ) : (
                                    <button
                                        className="btn-unarchive"
                                        onClick={() => handleUnarchive(event.id)}
                                    >
                                        Unarchive
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                        <p>No events found</p>
                    </div>
                )}
            </div>

            {showCreate && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(0px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <form onSubmit={handleCreate} style={{
                        background: '#fff',
                        padding: '24px',
                        borderRadius: '8px',
                        minWidth: '400px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                    }}>
                        <h2>Create New Event</h2>
                        <input
                            type="text"
                            placeholder="Event Name"
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

            {showArchiveSuccess && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(0px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        padding: '32px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                        minWidth: '400px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <h2>Success</h2>
                            <p>{archiveMessage}</p>
                            <button
                                onClick={() => {
                                    setShowArchiveSuccess(false);
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
                </div>
            )}

            {showDeleteSuccess && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(0px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        padding: '32px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                        minWidth: '400px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <h2>Success</h2>
                            <p>Event deleted successfully!</p>
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
                </div>
            )}

            {showCsvUpload && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(0px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        padding: '32px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                        minWidth: '450px'
                    }}>
                        <h2 style={{ marginTop: 0 }}>Upload Event Results (CSV)</h2>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                Select Event:
                            </label>
                            <select
                                value={selectedEventForUpload || ''}
                                onChange={e => setSelectedEventForUpload(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="">-- Choose an event --</option>
                                {Array.isArray(events) && events.map(event => (
                                    <option key={event.id} value={event.id}>
                                        {event.name} ({formatDate(event.eventDt)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                Select CSV File:
                            </label>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleCsvFileChange}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            {csvFile && (
                                <p style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>
                                    Selected: {csvFile.name}
                                </p>
                            )}
                        </div>

                        <div style={{ 
                            background: '#f0f4f8',
                            padding: '12px',
                            borderRadius: '4px',
                            marginBottom: '20px',
                            fontSize: '12px',
                            lineHeight: '1.6'
                        }}>
                            <strong>CSV Format Requirements:</strong>
                            <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                                <li>First row must be headers (Pid, ChipCode, Bib, Name, etc.)</li>
                                <li>Names with commas should be enclosed in double quotes: "Smith, John"</li>
                                <li>Pid column is required (Participant ID)</li>
                                <li>Double quotes are automatically removed after import</li>
                            </ul>
                        </div>

                        <div style={{ 
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => {
                                    setShowCsvUpload(false);
                                    setCsvFile(null);
                                    setSelectedEventForUpload(null);
                                }}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd',
                                    background: '#fff',
                                    color: '#333',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCsvUpload}
                                disabled={uploadProgress !== null}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: uploadProgress ? '#ccc' : '#007bff',
                                    color: '#fff',
                                    cursor: uploadProgress ? 'not-allowed' : 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                {uploadProgress || 'Upload Results'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventListing;
