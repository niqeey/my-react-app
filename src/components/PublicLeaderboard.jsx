import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiBase from '../apiBase';

const PublicLeaderboard = () => {
    const { eventId } = useParams();
    const [categories, setCategories] = useState([]);
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
            setCategories(cats);
            if (cats.length > 0) {
                setEventName(cats[0].eventName || 'Event Leaderboard');
            }
            setLoading(false);
        })
        .catch((err) => {
            console.error('Error loading categories:', err);
            setError('Failed to load categories');
            setLoading(false);
        });
    }, [eventId]);

    // Fetch leaderboard data for all categories
    useEffect(() => {
        if (!categories || categories.length === 0) return;

        let isInitialLoad = true;

        const fetchAllCategories = () => {
            if (isInitialLoad) {
                setCatDetailsLoading(true);
            }

            Promise.all(
                categories.map(cat =>
                    fetch(`${apiBase}/public/leaderboard/${eventId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ category: cat.cat })
                    })
                    .then(res => res.json())
                    .then(data => ({ catId: cat.catId, data }))
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

        // Set up auto-refresh every 2 seconds (silent updates)
        const interval = setInterval(fetchAllCategories, 2000);

        return () => clearInterval(interval);
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
        timeFinish: 'Time Finish',
        netTime: 'Net Time',
    };

    const columns = ['rankCat', 'bib', 'name', 'timeFinish', 'netTime'];

    // Medal emoji mapping
    const getMedal = (rank, topPrize) => {
        if (!topPrize || rank > topPrize) return '';
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return '🏅'; // Generic medal for ranks 4+
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 80px)',
            paddingBottom: 100,
            width: '99%',
            maxWidth: '100%',
            margin: 0,
            padding: isMobile ? '16px' : '24px',
            overflowX: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #ff4500 0%, #e63946 100%)',
                padding: isMobile ? '24px 16px' : '32px 24px',
                borderRadius: '12px',
                color: '#fff',
                margin: '0 16px 24px 16px',
                width: 'calc(100% - 32px)',
                boxSizing: 'border-box',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
                <h1 style={{ 
                    margin: 0, 
                    fontSize: isMobile ? '24px' : '32px',
                    fontWeight: 700, 
                    width: '90%'
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

            {/* Results Tables */}
            {catDetailsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#666' }}>
                    Loading results...
                </div>
            ) : categories.length > 0 ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '20px',
                    overflowX: 'auto',
                    padding: '0 16px 8px 16px',
                    scrollPadding: '0 16px 0 16px',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    {categories.map(cat => {
                        const data = catDetails[cat.catId] || [];
                        const topPrize = cat.topprize;

                        return (
                            <div key={cat.catId} style={{
                                background: '#fff',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                padding: isMobile ? '12px' : '16px',
                                minWidth: isMobile ? '90vw' : '700px',
                                flex: isMobile ? '0 0 90vw' : '1 0 700px'
                            }}>
                                <div style={{
                                    fontSize: isMobile ? '16px' : '18px',
                                    fontWeight: 700,
                                    marginBottom: '12px',
                                    color: '#333',
                                    textAlign: 'center'
                                }}>
                                    {cat.name}
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        minWidth: '600px',
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
                                            {data && data.length > 0 ? (
                                                data.map((row, index) => (
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
                                                                color: '#333'
                                                            }}>
                                                                {col === 'rankCat' && row[col] && getMedal(row[col], topPrize) ? (
                                                                    <span>
                                                                        {getMedal(row[col], topPrize)} {row[col]}
                                                                    </span>
                                                                ) : (
                                                                    formatTimeNoMs(row[col]) || row[col] || '-'
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={columns.length} style={{
                                                        textAlign: 'center',
                                                        padding: '24px',
                                                        color: '#666'
                                                    }}>
                                                        No results available for this category yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#f9f9f9',
                    borderRadius: '12px',
                    color: '#666'
                }}>
                    <p style={{ fontSize: '18px', margin: 0 }}>No results available yet.</p>
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
