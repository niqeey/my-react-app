import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiBase from '../apiBase';

const PublicLeaderboard = () => {
    const { eventId } = useParams();
    const [categories, setCategories] = useState([]);
    const [eventName, setEventName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCat, setSelectedCat] = useState(null);
    const [catDetail, setCatDetail] = useState(null);
    const [catDetailLoading, setCatDetailLoading] = useState(false);
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
            setCategories(cats);
            if (cats.length > 0) {
                setEventName(cats[0].eventName || 'Event Leaderboard');
                setSelectedCat(cats[0]);
            }
            setLoading(false);
        })
        .catch((err) => {
            console.error('Error loading categories:', err);
            setError('Failed to load categories');
            setLoading(false);
        });
    }, [eventId]);

    // Fetch leaderboard data when category is selected
    useEffect(() => {
        if (!selectedCat) return;
        setCatDetailLoading(true);
        setCatDetail(null);
        fetch(`${apiBase}/public/leaderboard/${eventId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category: selectedCat.cat
            })
        })
        .then(res => res.json())
        .then(data => {
            setCatDetail(data);
            setCatDetailLoading(false);
        })
        .catch(() => {
            setCatDetail(null);
            setCatDetailLoading(false);
        });
    }, [selectedCat, eventId]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Format time values by removing milliseconds
    function formatTimeNoMs(val) {
        if (!val || val === '-' || val === '00:00:00.000') return '-';
        // If it's already a string with time format, remove milliseconds
        if (typeof val === 'string' && val.includes(':')) {
            const parts = val.split('.');
            return parts[0];
        }
        // If it's a number or non-time string, return as-is
        return val;
    }

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px' }}>
            Loading leaderboard...
        </div>
    );
    
    if (error) return (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#d32f2f' }}>
            {error}
        </div>
    );

    // Column display name mapping
    const columnDisplayNames = {
        rankCat: 'Rank',
        bib: 'Bib',
        name: 'Name',
        timeStart: 'Time Start',
        timeFinish: 'Time Finish',
        officialTime: 'Official Time',
        netTime: 'Net Time',
    };

    // Get dynamic columns based on cplist
    let columns = [];
    if (Array.isArray(catDetail) && catDetail.length > 0) {
        const cplist = catDetail[0].cplist || '';
        const baseCols = ['rankCat', 'bib', 'name'];
        // Convert TimeCP1 -> timeCP1 to match API response keys
        const cpCols = cplist ? cplist.split(',').map(cp => {
            const trimmed = cp.trim();
            return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
        }) : [];
        // Reordered: timeStart, then checkpoints, then timeFinish, officialTime, netTime
        columns = [...baseCols, 'timeStart', ...cpCols, 'timeFinish', 'officialTime', 'netTime'];
    }

    return (
        <div style={{
            minHeight: 'calc(100vh - 80px)',
            paddingBottom: 100,
            maxWidth: isMobile ? '100%' : 1400,
            margin: '0 auto',
            padding: isMobile ? '16px' : '24px'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: isMobile ? '24px 16px' : '32px 24px',
                borderRadius: '12px',
                color: '#fff',
                marginBottom: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
                <h1 style={{ 
                    margin: 0, 
                    fontSize: isMobile ? '24px' : '32px',
                    fontWeight: 700 
                }}>
                    🏆 Leaderboard
                </h1>
                <p style={{ 
                    margin: '8px 0 0 0', 
                    fontSize: isMobile ? '14px' : '16px',
                    opacity: 0.9 
                }}>
                    {eventName}
                </p>
            </div>

            {/* Category Tabs */}
            {categories.length > 0 && (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    overflowX: 'auto',
                    padding: '4px'
                }}>
                    {categories.map(cat => (
                        <button
                            key={cat.catId}
                            onClick={() => setSelectedCat(cat)}
                            style={{
                                padding: isMobile ? '10px 16px' : '12px 24px',
                                fontSize: isMobile ? '14px' : '16px',
                                fontWeight: selectedCat?.catId === cat.catId ? 600 : 400,
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: selectedCat?.catId === cat.catId 
                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    : '#f5f5f5',
                                color: selectedCat?.catId === cat.catId ? '#fff' : '#333',
                                boxShadow: selectedCat?.catId === cat.catId 
                                    ? '0 2px 8px rgba(102, 126, 234, 0.4)'
                                    : 'none',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {cat.category} ({cat.distance}KM)
                        </button>
                    ))}
                </div>
            )}

            {/* Results Table */}
            {catDetailLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#666' }}>
                    Loading results...
                </div>
            ) : catDetail && catDetail.length > 0 ? (
                <div style={{
                    overflowX: 'auto',
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    padding: isMobile ? '12px' : '16px'
                }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        minWidth: isMobile ? '600px' : 'auto',
                        fontSize: isMobile ? '13px' : '15px'
                    }}>
                        <thead>
                            <tr>
                                {columns.map(col => (
                                    <th key={col} style={{
                                        background: '#f5f5f5',
                                        padding: '12px 8px',
                                        border: '1px solid #ddd',
                                        fontWeight: 600,
                                        textAlign: 'left',
                                        position: col === 'rankCat' ? 'sticky' : 'static',
                                        left: col === 'rankCat' ? 0 : 'auto',
                                        zIndex: col === 'rankCat' ? 2 : 1
                                    }}>
                                        {columnDisplayNames[col] || col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {catDetail.map((row, index) => (
                                <tr key={index} style={{ 
                                    background: index % 2 === 0 ? '#fff' : '#fafafa',
                                    borderBottom: '1px solid #e0e0e0'
                                }}>
                                    {columns.map(col => (
                                        <td key={col} style={{
                                            padding: '10px 8px',
                                            border: '1px solid #ddd',
                                            position: col === 'rankCat' ? 'sticky' : 'static',
                                            left: col === 'rankCat' ? 0 : 'auto',
                                            background: col === 'rankCat' ? (index % 2 === 0 ? '#fff' : '#fafafa') : 'transparent',
                                            fontWeight: col === 'rankCat' ? 600 : 400,
                                            color: col === 'rankCat' && index < 3 ? '#d4af37' : '#333'
                                        }}>
                                            {col === 'rankCat' && index < 3 && (
                                                <span style={{ marginRight: '4px' }}>
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                                </span>
                                            )}
                                            {formatTimeNoMs(row[col]) || row[col] || '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#f9f9f9',
                    borderRadius: '12px',
                    color: '#666'
                }}>
                    <p style={{ fontSize: '18px', margin: 0 }}>No results available for this category yet.</p>
                </div>
            )}

            {/* Footer Note */}
            <div style={{
                marginTop: '32px',
                padding: '16px',
                background: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffc107',
                fontSize: '14px',
                color: '#856404'
            }}>
                ℹ️ <strong>Note:</strong> This leaderboard shows only participants who have finished the race without disqualification.
            </div>
        </div>
    );
};

export default PublicLeaderboard;
