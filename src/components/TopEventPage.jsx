import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import apiBase from '../apiBase';

const TopEventPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [eventName, setEventName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCatId, setSelectedCatId] = useState(null);
    const [selectedCat, setSelectedCat] = useState(null);
    const [catDetail, setCatDetail] = useState(null);
    const [catDetailLoading, setCatDetailLoading] = useState(false);

    // Detect if the user is on mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Format time values by removing milliseconds
    function formatTimeNoMs(val) {
        if (typeof val !== 'string') return val;
        // Remove .xxx if present (milliseconds)
        return val.replace(/\.\d{1,3}$/, '');
    }

    // Load categories
    useEffect(() => {
        authFetch(`${apiBase}/race/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId })
        })
        .then(res => res.json())
        .then(data => {
            const cats = Array.isArray(data) ? data : data.categories || [];
            setCategories(cats);
            if (cats.length > 0) {
                setEventName(cats[0].eventName || '');
                sessionStorage.setItem('eventName', cats[0].eventName || '');
                setSelectedCatId(cats[0].catId);
                setSelectedCat(cats[0]);
            } else {
                setEventName('');
                sessionStorage.removeItem('eventName');
            }
            setLoading(false);
        })
        .catch(() => {
            setError('Failed to load categories');
            setLoading(false);
        });
    }, [eventId]);

    // Fetch report on tab click
    const fetchCategoryData = (silent = false) => {
        if (!selectedCat) return;
        if (!silent) {
            setCatDetailLoading(true);
            setCatDetail(null);
        }
        authFetch(`${apiBase}/report/event/category/top`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventId,
                category: selectedCat.cat
            })
        })
        .then(res => res.json())
        .then(data => {
            // Handle both old array format and new wrapper format
            if (data && typeof data === 'object' && data.data !== undefined) {
                // New wrapper format: {mode, data}
                setCatDetail(data.data);
            } else if (Array.isArray(data)) {
                // Old array format for backward compatibility
                setCatDetail(data);
            } else {
                setCatDetail(null);
            }
            if (!silent) {
                setCatDetailLoading(false);
            }
        })
        .catch(() => {
            if (!silent) {
                setCatDetail(null);
                setCatDetailLoading(false);
            }
        });
    };

    useEffect(() => {
        fetchCategoryData();
    }, [selectedCat, eventId]);

    // Auto-refresh disabled
    // useEffect(() => {
    //     if (!selectedCat || selectedCat.raceMode !== 'LAP') return;
    //     
    //     const intervalId = setInterval(() => {
    //         fetchCategoryData(true); // silent = true
    //     }, 5000);

    //     return () => clearInterval(intervalId);
    // }, [selectedCat, eventId]);

    if (loading) return <div>Loading categories...</div>;
    if (error) return <div>{error}</div>;

    // Column display name mapping
    const columnDisplayNames = {
        rank1Cat: 'Rank',
        bib: 'Bib',
        name: 'Name',
        timeStart: 'TimeStart',
        timeFinish: 'TimeFinish',
        officialTime: 'OfficialTime',
        netTime: 'NetTime',
    };

    // Get dynamic columns based on cplist or raceMode
    let columns = [];
    if (Array.isArray(catDetail) && catDetail.length > 0) {
        // Check if this is LAP mode
        const isLapMode = selectedCat && selectedCat.raceMode === 'LAP';
        
        if (isLapMode) {
            // LAP mode: build columns based on checkpointlist
            // checkpointlist format: "200,400,12,5000" where:
            // 1st = halflap distance, 2nd = fulllap distance, 3rd = lap count, 4th = total distance
            columns = [
                'bib', 'name', 'lap', 'timeStart', 'timeFinish'
            ];
            
            // Parse checkpointlist to determine number of lap times
            if (selectedCat.checkpointlist) {
                const parts = selectedCat.checkpointlist.split(',');
                const lapCount = parseInt(parts[2]) || 0;
                
                // Add time columns for each lap
                for (let i = 1; i <= lapCount; i++) {
                    const timeKey = `time${i}`;
                    columns.push(timeKey);
                    columnDisplayNames[timeKey] = `Lap ${i}`;
                }
            }
            
            // Process display data to calculate lap numbers dynamically
            catDetail = catDetail.map(row => {
                // Calculate lap = highest lap number with data
                let maxLap = null;
                for (let i = 1; i <= 99; i++) {
                    if (row[`time${i}`] !== null && row[`time${i}`] !== undefined) {
                        maxLap = i;
                    }
                }
                return {
                    ...row,
                    lap: maxLap // Override lap with calculated value
                };
            });
        } else {
            // NORMAL mode: build columns from cplist (checkpoint list in response)
            columns = [
                'rank1Cat', 'bib', 'name', 'officialTime', 'netTime', 'timeStart'
            ];

            // Parse cplist for CP columns
            const cplist = catDetail[0].cplist
                ? catDetail[0].cplist.split(',').map(cp => cp.trim().replace('Time', 'time')) // Convert "TimeCP1" to "timeCP1"
                : [];

            // Dynamically rename timeCP columns
            const availableTimeCPs = cplist.filter(cp => /^timeCP\d+$/.test(cp)); // Ensure valid timeCP keys
            availableTimeCPs.forEach((key, index) => {
                columnDisplayNames[key] = `Split_${index + 1}`;
                if (!columns.includes(key)) columns.push(key); // Add to columns if not already present
            });

            // Always show finish and official/net time
            if (!columns.includes('timeFinish')) columns.push('timeFinish');
        }
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                width: '100vw',
                background: 'rgba(255,255,255,0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '0 2vw'
            }}
        >
            <div
                style={{
                    minHeight: 'calc(100vh - 60px)',
                    width: '100%',
                    maxWidth: 1000,
                    margin: '0 auto',
                    padding: '4vw 2vw 24px 2vw',
                    background: 'rgba(255,255,255,0.97)',
                    borderRadius: 12,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Title row with Statistic button beside */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    gap: 16
                }}>
                    <h1 style={{ margin: '24px 0 16px 0', fontSize: 24, textAlign: 'center', flex: 'none',
                    color: '#555' }}>
                        {eventName ? eventName : 'Event Categories'}
                    </h1>
                </div>
                {/* Tabs and Print Button */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        onClick={() => navigate(`/statistic/${eventId}`)}
                        style={{
                            background: 'rgba(128, 109, 247, 0.89)',
                            color: 'rgba(0, 0, 0, 0.89)',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 20px',
                            fontWeight: 'bold',
                            fontSize: 16,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                            marginLeft: 16,
                            height: 40
                        }}
                    >
                        Statistic
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.catId}
                            onClick={() => {
                                setSelectedCatId(cat.catId);
                                setSelectedCat(cat);
                            }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 6,
                                border: selectedCatId === cat.catId ? '2px solid #007bff' : '1px solid #ccc',
                                background: selectedCatId === cat.catId ? '#e3f0ff' : '#f7f7f7',
                                color: selectedCatId === cat.catId ? '#007bff' : '#333',
                                fontWeight: selectedCatId === cat.catId ? 'bold' : 'normal',
                                cursor: 'pointer',
                                minWidth: 60
                            }}
                        >
                            {cat.cat}
                        </button>
                    ))}
                    
                </div>
                {/* Selected category name below buttons, above table */}
                {selectedCat && (
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between', // <-- align left and right
                            fontWeight: 'bold',
                            fontSize: 18,
                            marginBottom: 8,
                            color: '#333'
                        }}
                    >
                        <span>
                            {selectedCat.cat} - {selectedCat.name}
                        </span>
                        <button
                            onClick={async () => {
                                if (!selectedCat) return;
                                const orgId = sessionStorage.getItem('orgId');
                                const res = await authFetch(`${apiBase}/report/event/category/top/xlsx`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'OrgId': orgId
                                    },
                                    body: JSON.stringify({
                                        eventId,
                                        category: selectedCat.cat
                                    })
                                });
                                if (!res.ok) {
                                    alert('Failed to download Excel file.');
                                    return;
                                }
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${eventName || 'event'}_${selectedCat.cat}_top.xlsx`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                window.URL.revokeObjectURL(url);
                            }}
                            style={{
                                background: '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                padding: '10px 28px',
                                fontWeight: 'bold',
                                fontSize: 16,
                                cursor: selectedCat ? 'pointer' : 'not-allowed',
                                opacity: selectedCat ? 1 : 0.5
                            }}
                            disabled={!selectedCat}
                        >
                            Download
                        </button>
                    </div>
                )}
                {/* Category Detail Table */}
                {catDetailLoading ? (
                    <div>Loading details...</div>
                ) : catDetail && columns.length > 0 ? (
                    <div style={{ width: '100%' }}>
                        <div style={{
                            width: '100%',
                            overflowX: 'auto', // enables horizontal scroll
                        }}>
                            <table
                                style={{
                                    width: '100%',
                                    minWidth: 'min-content', // allows table to expand beyond container
                                    tableLayout: 'auto', // let browser size columns naturally
                                    borderCollapse: 'collapse',
                                    marginTop: 0,
                                    fontSize: '1rem'
                                }}
                            >
                                <thead>
                                    <tr>
                                        {columns.map((key) => {
                                            return (
                                                <th
                                                    key={key}
                                                    style={{
                                                        textAlign: 'left',
                                                        padding: '8px 12px',
                                                        background: '#f0f6ff',
                                                        fontSize: 13,
                                                        fontWeight: 'bold',
                                                        whiteSpace: 'nowrap', // prevent column wrapping
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        border: '1px solid #ddd',
                                                    }}
                                                >
                                                    {columnDisplayNames[key] || key}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {catDetail.map((row, idx) => (
                                        <tr
                                            key={idx}
                                            style={{
                                                background: idx % 2 === 0 ? '#fff' : '#f7f7f7'
                                            }}
                                        >
                                            {columns.map((key, i) => {
                                                return (
                                                    <td
                                                        key={i}
                                                        style={{
                                                            padding: '8px 12px',
                                                            fontSize: 12,
                                                            whiteSpace: 'nowrap', // prevent cell wrapping
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            border: '1px solid #ddd',
                                                        }}
                                                    >
                                                        {row[key] !== undefined
                                                            ? (isMobile && (
                                                                key === 'officialTime' ||
                                                                key === 'netTime' ||
                                                                key === 'timeStart' ||
                                                                key === 'timeFinish' ||
                                                                /^time\d+$/.test(key) ||
                                                                /^timeCP\d+$/.test(key)
                                                            )
                                                                ? formatTimeNoMs(row[key]) // Format time for mobile view
                                                                : row[key])
                                                            : ''}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div style={{ color: '#888', textAlign: 'center' }}>Select a category to view details.</div>
                )}
            </div>
            {/* Download Excel Button */}
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '24px 0',
                    paddingBottom: 80 // Add extra bottom padding so footer does not block
                }}
            >
                
            </div>
            <footer
                style={{
                    width: '100%',
                    height: 60,
                    background: 'rgba(240,246,255,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    color: '#888',
                    position: 'fixed',
                    left: 0,
                    bottom: 0,
                    zIndex: 10
                }}
            >
                © 2025 MyPaceTracker
            </footer>
        </div>
    );
};

export default TopEventPage;