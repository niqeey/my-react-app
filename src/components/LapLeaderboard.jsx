import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiBase from '../apiBase';

const LapLeaderboard = () => {
    const { eventId } = useParams();
    const [categories, setCategories] = useState([]);
    const [selectedCatId, setSelectedCatId] = useState(null);
    const [eventName, setEventName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [catDetails, setCatDetails] = useState({});
    const [catDetailsLoading, setCatDetailsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

    // Load categories (no auth required)
    useEffect(() => {
        fetch(`${apiBase}/race/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId })
        })
        .then(res => res.json())
        .then(data => {
            const cats = Array.isArray(data) ? data : [];
            // Filter only LAP mode categories
            const lapCats = cats.filter(cat => cat.raceMode === 'LAP');
            setCategories(lapCats);
            if (lapCats.length > 0) {
                setEventName(lapCats[0].eventName || 'LAP Leaderboard');
                setSelectedCatId(lapCats[0].catId); // Select first category by default
            }
            setLoading(false);
        })
        .catch((err) => {
            console.error('Error loading categories:', err);
            setError('Failed to load categories');
            setLoading(false);
        });
    }, [eventId]);

    // Fetch LAP leaderboard data for all categories
    useEffect(() => {
        if (!categories || categories.length === 0) return;

        let isInitialLoad = true;

        const fetchAllCategories = () => {
            if (isInitialLoad) {
                setCatDetailsLoading(true);
            }

            Promise.all(
                categories.map(cat =>
                    fetch(`${apiBase}/public/leaderboard/lap/${eventId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ eventId, category: cat.cat })
                    })
                    .then(res => res.json())
                    .then(data => {
                        // Extract LAP data from CategoryResultListWrapper
                        const lapData = data.mode === 'LAP' ? data.data : [];
                        return { catId: cat.catId, data: lapData };
                    })
                    .catch(() => ({ catId: cat.catId, data: [] }))
                )
            )
            .then(results => {
                const next = {};
                results.forEach(r => { next[r.catId] = r.data; });
                setCatDetails(next);
                if (isInitialLoad) {
                    setCatDetailsLoading(false);
                    isInitialLoad = false;
                }
            })
            .catch(() => {
                if (isInitialLoad) {
                    setCatDetailsLoading(false);
                }
            });
        };

        // Initial fetch
        fetchAllCategories();

        // Set up auto-refresh every 2 seconds
        const intervalId = setInterval(fetchAllCategories, 2000);

        // Cleanup on unmount or dependency change
        return () => clearInterval(intervalId);
    }, [categories, eventId]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const prevBody = document.body.style.overflowX;
        const prevHtml = document.documentElement.style.overflowX;
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';

        return () => {
            document.body.style.overflowX = prevBody;
            document.documentElement.style.overflowX = prevHtml;
        };
    }, []);

    if (loading) return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            fontSize: '1.2rem',
            color: '#667eea'
        }}>
            Loading leaderboard...
        </div>
    );

    if (error) return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            fontSize: '1.2rem',
            color: '#d9534f'
        }}>
            {error}
        </div>
    );

    // Helper function to get maximum lap count from lap times
    const getMaxLaps = (participants) => {
        let max = 0;
        participants.forEach(p => {
            if (p.lapTimes) {
                const lapNumbers = Object.keys(p.lapTimes)
                    .map(key => parseInt(key.replace('time', '')))
                    .filter(num => !isNaN(num));
                if (lapNumbers.length > 0) {
                    max = Math.max(max, Math.max(...lapNumbers));
                }
            }
        });
        return max;
    };

    // Helper function to convert time string HH:MM:SS to seconds for comparison
    const timeToSeconds = (timeStr) => {
        if (!timeStr || timeStr === '-' || timeStr === '0') return Infinity;
        const parts = timeStr.split(':');
        if (parts.length !== 3) return Infinity;
        try {
            return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        } catch (e) {
            return Infinity;
        }
    };

    // Helper function to sort participants by max lap time (shortest first)
    const getSortedParticipants = (participants) => {
        const maxLaps = getMaxLaps(participants);
        
        // Create array with time on max lap for sorting
        const withMaxLapTime = participants.map(p => {
            const maxLapKey = `time${maxLaps}`;
            const maxLapTime = p.lapTimes ? p.lapTimes[maxLapKey] : null;
            const timeInSeconds = timeToSeconds(maxLapTime);
            return {
                ...p,
                maxLapTime: maxLapTime,
                maxLapSeconds: timeInSeconds
            };
        });

        // Sort by max lap time (ascending, shortest first), excluding times that are '-' or 0
        return withMaxLapTime.sort((a, b) => {
            // If both have valid times, sort by time
            if (a.maxLapSeconds !== Infinity && b.maxLapSeconds !== Infinity) {
                return a.maxLapSeconds - b.maxLapSeconds;
            }
            // If only one has valid time, it comes first
            if (a.maxLapSeconds !== Infinity) return -1;
            if (b.maxLapSeconds !== Infinity) return 1;
            // If neither has valid time, maintain order
            return 0;
        });
    };

    // Helper function to calculate lap count (count non-null lap times)
    const calculateLapCount = (participant) => {
        if (!participant.lapTimes) return 0;
        const lapNumbers = Object.keys(participant.lapTimes)
            .map(key => parseInt(key.replace('time', '')))
            .filter(num => !isNaN(num) && participant.lapTimes[`time${num}`]);
        return lapNumbers.length;
    };

    // Extract lap count from 3rd parameter of checkpointlist
    const getCheckpointCount = (checkpointlist) => {
        if (!checkpointlist) return 0;
        // checkpointlist format: "halflapDistance,fulllapDistance,numberOfLaps,totalDistance"
        // We need the 3rd parameter (index 2) which is numberOfLaps
        if (typeof checkpointlist === 'string') {
            const params = checkpointlist.split(',');
            if (params.length >= 3) {
                const lapCount = parseInt(params[2].trim());
                return isNaN(lapCount) ? 0 : lapCount;
            }
        }
        return 0;
    };

    // Helper function to calculate total time (time[maxLap] - timeStart)
    const calculateTotalTime = (participant) => {
        if (!participant.lapTimes) return '-';
        
        // Find the highest lap number with a time
        const lapNumbers = Object.keys(participant.lapTimes)
            .map(key => parseInt(key.replace('time', '')))
            .filter(num => !isNaN(num) && participant.lapTimes[`time${num}`]);
        
        if (lapNumbers.length === 0) return '-';
        
        const maxLapNum = Math.max(...lapNumbers);
        const maxLapTime = participant.lapTimes[`time${maxLapNum}`];
        
        if (!maxLapTime || !participant.timeStart) return '-';
        
        // Try to calculate the difference
        const maxLapSeconds = timeToSeconds(maxLapTime);
        const startSeconds = timeToSeconds(participant.timeStart);
        
        if (maxLapSeconds === Infinity || startSeconds === Infinity) return maxLapTime;
        
        const diffSeconds = maxLapSeconds - startSeconds;
        if (diffSeconds <= 0) return maxLapTime;
        
        // Convert back to HH:MM:SS format
        const hours = Math.floor(diffSeconds / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = Math.floor(diffSeconds % 60);
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: isMobile ? '16px 8px' : '32px 16px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                background: 'white',
                borderRadius: '12px 12px 0 0',
                padding: isMobile ? '20px 16px' : '32px',
                marginBottom: 0,
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{
                    margin: 0,
                    fontSize: isMobile ? '1.5rem' : '2rem',
                    fontWeight: 700,
                    color: '#2c3e50',
                    textAlign: 'center'
                }}>
                    🏆 LAP Leaderboard
                </h1>
                <p style={{
                    margin: '8px 0 0 0',
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    color: '#7f8c8d',
                    textAlign: 'center'
                }}>
                    {eventName}
                </p>
            </div>

            {/* Category Tabs */}
            {categories.length > 0 && (
                <div style={{
                    background: '#f8f9fa',
                    padding: isMobile ? '12px 8px' : '16px',
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    borderBottom: '3px solid #667eea',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    {categories.map((cat) => (
                        <button
                            key={cat.catId}
                            onClick={() => setSelectedCatId(cat.catId)}
                            style={{
                                padding: isMobile ? '10px 16px' : '14px 24px',
                                border: selectedCatId === cat.catId ? '3px solid #000' : '2px solid #dee2e6',
                                borderRadius: '8px',
                                fontWeight: selectedCatId === cat.catId ? '700' : '500',
                                fontSize: isMobile ? '0.9rem' : '1.05rem',
                                cursor: 'pointer',
                                background: selectedCatId === cat.catId ? '#fff700' : '#ffffff',
                                color: '#000000',
                                transition: 'all 0.3s ease',
                                whiteSpace: 'nowrap',
                                boxShadow: selectedCatId === cat.catId ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.08)'
                            }}
                        >
                            {cat.cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Category Content */}
            {catDetailsLoading ? (
                <div style={{
                    background: 'white',
                    borderRadius: '0 0 12px 12px',
                    padding: '40px',
                    textAlign: 'center',
                    color: '#667eea',
                    fontSize: '1.1rem'
                }}>
                    Loading results...
                </div>
            ) : categories.length === 0 ? (
                <div style={{
                    background: 'white',
                    borderRadius: '0 0 12px 12px',
                    padding: '40px',
                    textAlign: 'center',
                    color: '#7f8c8d',
                    fontSize: '1.1rem'
                }}>
                    No LAP categories found for this event
                </div>
            ) : (
                (() => {
                    const selectedCat = categories.find(cat => cat.catId === selectedCatId);
                    if (!selectedCat) return null;
                    
                    const participants = catDetails[selectedCat.catId] || [];
                    const sortedParticipants = getSortedParticipants(participants);
                    const checkpointCount = getCheckpointCount(selectedCat.checkpointlist);

                    return (
                        <div style={{
                            background: 'white',
                            borderRadius: '0 0 12px 12px',
                            padding: isMobile ? '16px 0' : '24px 0'
                        }}>
                            <p style={{
                                margin: isMobile ? '0 16px 16px 16px' : '0 24px 16px 24px',
                                fontSize: isMobile ? '1.1rem' : '1.3rem',
                                color: '#667eea',
                                fontWeight: 700,
                                textAlign: 'center',
                                backgroundColor: '#f0f4ff',
                                padding: isMobile ? '12px 16px' : '12px 24px',
                                borderRadius: '8px',
                                borderLeft: '4px solid #667eea'
                            }}>
                                <strong style={{fontSize: 'inherit'}}>{selectedCat.name}    </strong>
                                Laps: <strong style={{fontSize: 'inherit'}}>{checkpointCount || '0'}</strong>
                            </p>
                            {participants.length === 0 ? (
                                <p style={{ color: '#adb5bd', textAlign: 'center', padding: '20px 0', margin: isMobile ? '0 16px' : '0 24px' }}>
                                    No participants yet
                                </p>
                            ) : (
                                <div style={{ display: 'flex', width: 'calc(100% - ' + (isMobile ? '32px' : '48px') + ')', gap: 0, margin: isMobile ? '0 16px' : '0 24px' }}>
                                    {/* Fixed Columns */}
                                    <div style={{ 
                                        flex: '0 0 auto',
                                        borderRight: '2px solid #dee2e6',
                                        overflow: 'hidden'
                                    }}>
                                        <table style={{
                                            borderCollapse: 'collapse',
                                            fontSize: isMobile ? '0.85rem' : '0.95rem',
                                            width: 'auto',
                                            tableLayout: 'fixed'
                                        }}>
                                            <thead>
                                                <tr style={{ background: '#667eea', borderBottom: '3px solid #667eea', height: '52px' }}>
                                                    <th style={{...thStyle}}>Pos</th>
                                                    <th style={{...thStyle}}>Bib</th>
                                                    <th style={{...thStyle}}>Name</th>
                                                    <th style={{...thStyle}}>Laps</th>
                                                    <th style={{...thStyle}}>Total Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedParticipants.map((p, pIdx) => {
                                                    const lapCount = calculateLapCount(p);
                                                    const isFinalLap = checkpointCount > 0 && lapCount >= checkpointCount;
                                                    const isAlmostFinal = checkpointCount > 0 && lapCount >= (checkpointCount - 1);
                                                    
                                                    return (
                                                    <tr key={pIdx} style={{
                                                        borderBottom: '1px solid #e9ecef',
                                                        background: pIdx % 2 === 0 ? 'white' : '#f8f9fa',
                                                        height: '48px'
                                                    }}>
                                                        <td style={{...tdStyle, display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                            <span style={{fontWeight: 600}}>{pIdx + 1}</span>
                                                            {isFinalLap && <span style={{ fontSize: '1.6em', lineHeight: '1' }} title="Completed final lap">🥇</span>}
                                                            {!isFinalLap && isAlmostFinal && <span style={{ fontSize: '1.6em', lineHeight: '1' }} title="Almost finished">🔔</span>}
                                                        </td>
                                                        <td style={tdStyle}>{p.bib || '-'}</td>
                                                        <td style={{...tdStyle, fontWeight: 500}}>{p.name || '-'}</td>
                                                        <td style={tdStyle}>{calculateLapCount(p)}</td>
                                                        <td style={{...tdStyle, fontWeight: 600, color: '#667eea'}}>{calculateTotalTime(p)}</td>
                                                    </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Scrollable Lap Columns */}
                                    <div style={{ 
                                        flex: 1, 
                                        overflowX: 'auto',
                                        overflowY: 'hidden',
                                        minWidth: 0
                                    }}>
                                        <table style={{
                                            borderCollapse: 'collapse',
                                            fontSize: isMobile ? '0.85rem' : '0.95rem',
                                            width: '100%',
                                            tableLayout: 'auto'
                                        }}>
                                            <thead>
                                                <tr style={{ background: '#667eea', borderBottom: '3px solid #667eea', height: '52px' }}>
                                                    {[...Array(checkpointCount)].map((_, i) => (
                                                        <th key={i} style={thStyle}>Lap {i + 1}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedParticipants.map((p, pIdx) => (
                                                    <tr key={pIdx} style={{
                                                        borderBottom: '1px solid #e9ecef',
                                                        background: pIdx % 2 === 0 ? 'white' : '#f8f9fa',
                                                        height: '48px'
                                                    }}>
                                                        {[...Array(checkpointCount)].map((_, i) => {
                                                            const lapTimeKey = `time${i + 1}`;
                                                            const lapTime = p.lapTimes ? p.lapTimes[lapTimeKey] : null;
                                                            return (
                                                                <td key={i} style={tdStyle}>
                                                                    {lapTime || '-'}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()
            )}

            {/* Footer Note */}
            <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '0 0 12px 12px',
                padding: isMobile ? '16px' : '20px',
                marginTop: 0,
                textAlign: 'center',
                color: 'white',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
            }}>
                ℹ️ <strong>Note:</strong> This leaderboard shows LAP mode results with individual lap times.
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

const thStyle = {
    padding: '14px 10px',
    textAlign: 'left',
    fontWeight: 700,
    color: '#ffffff',
    backgroundColor: '#667eea',
    whiteSpace: 'nowrap',
    fontSize: '0.95rem'
};

const tdStyle = {
    padding: '10px 8px',
    color: '#495057'
};

const Footer = () => {
    const footerStyle = {
        padding: '32px 0 16px 0',
        borderRadius: '0 0 18px 18px',
        textAlign: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
    };

    const subtitleStyle = {
        margin: '12px 0 0 0',
        fontWeight: 400,
        color: '#fff',
        fontSize: '1.2rem',
        letterSpacing: 1,
        transition: 'opacity 0.2s',
        minHeight: '1.5em'
    };

    return (
        <div style={footerStyle}>
            <h1 style={{ margin: 0, fontWeight: 700, letterSpacing: 1, color: '#fff' }}>
                My Pace Tracker
            </h1>
            <div style={subtitleStyle}>
                --------------- Every Second Counts ---------------
            </div>
        </div>
    );
};

export default LapLeaderboard;
