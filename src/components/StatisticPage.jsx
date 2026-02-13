import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageWrapper from './PageWrapper';
import apiBase from '../apiBase';
import { authFetch } from '../utils/authFetch';

const columnDisplayNames = {
    cat: 'Cat',
    category: 'Category',
    registered: 'Registered',
    started: 'Started',
    didNotStart: 'Did Not Start',
    finished: 'Finished',
    didNotFinish: 'Did Not Finish',
    falseStart: 'False Start',
    noStartButFinished: 'No Start But Finished',
    disqualified: 'Disqualified'
};

const highlightRow = (row) =>
    row.category && row.category.toLowerCase().includes('total');

const StatisticPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventName, setEventName] = useState('');
    const [countdown, setCountdown] = useState(60000); // 60 seconds
    const intervalRef = useRef();
    const [collapsedDistances, setCollapsedDistances] = useState({});
    const [popupData, setPopupData] = useState(null);
    const [popupTitle, setPopupTitle] = useState('');
    const [popupVisible, setPopupVisible] = useState(false);

    // Heartbeat polling for latest data
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            console.log('Fetching statistics for eventId:', eventId);
            const response = await authFetch(`${apiBase}/statistic/full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId })
            });
            const result = await response.json();
            console.log('Statistics response:', result);
            console.log('Is array?', Array.isArray(result), 'Length:', result?.length);
            if (isMounted) setData(result);
            setLoading(false);
        };

        fetchData(); // Initial fetch

        // Get eventName from sessionStorage when component mounts or eventId changes
        const storedName = sessionStorage.getItem('eventName');
        if (storedName) setEventName(storedName);

        // Auto-refresh polling disabled
        // intervalRef.current = setInterval(() => {
        //     setCountdown(prev => {
        //         if (prev <= 1000) {
        //             fetchData();
        //             return 10000;
        //         }
        //         return prev - 1000;
        //     });
        // }, 1000);

        return () => {
            isMounted = false;
            // clearInterval(intervalRef.current);
        };
    }, [eventId]);

    // Manual reload handler
    const handleReload = () => {
        setCountdown(10000);
        setLoading(true);
        authFetch(`${apiBase}/statistic/full`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId })
        })
        .then(res => res.json())
        .then(result => setData(result))
        .finally(() => setLoading(false));
    };

    // Group data by distance
    const groupedData = (Array.isArray(data) ? data : []).reduce((acc, row) => {
        let dist = row.distance;
        if (dist === null || dist === undefined || dist === '') dist = 'ALL';
        if (!acc[dist]) acc[dist] = [];
        acc[dist].push(row);
        return acc;
    }, {});

    // Toggle collapse for a distance
    const toggleDistance = (distance) => {
        setCollapsedDistances((prev) => ({
            ...prev,
            [distance]: !prev[distance],
        }));
    };

    const columns = [
        'cat', 'category', 'registered', 'started', 'didNotStart',
        'finished', 'didNotFinish', 'falseStart', 'noStartButFinished', 'disqualified'
    ];

    const fetchPopupData = async (endpoint, title) => {
        try {
            const response = await authFetch(`${apiBase}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId }),
            });
            const data = await response.json();
            setPopupData(data);
            setPopupTitle(title);
            setPopupVisible(true);
        } catch (error) {
            console.error('Error fetching popup data:', error);
        }
    };

    return (
        <PageWrapper>
            {/* Back Button */}
            <div style={{ width: '100%', marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'none',
                        color: '#007bff',
                        border: 'none',
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                    }}
                >
                    <span style={{ fontSize: 20, marginRight: 6 }}>&larr;</span>
                    Back
                </button>
            </div>

            {/* Title and Refresh Button */}
            <div style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '24px 0 0 0',
                position: 'relative'
            }}>
                <h1 style={{
                    fontSize: 28,
                    textAlign: 'center',
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: '#555',
                    margin: 0,
                    flex: 1
                }}>
                    Statistic {eventName}
                </h1>
                <button
                    onClick={async () => {
                        try {
                            const res = await authFetch(`${apiBase}/report/event/statistic/xlsx`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ eventId })
                            });
                            if (!res.ok) {
                                alert('Failed to download Excel file.');
                                return;
                            }
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${eventName || 'event'}_statistic.xlsx`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(url);
                        } catch (err) {
                            console.error('Download error:', err);
                            alert('Error downloading file.');
                        }
                    }}
                    style={{
                        marginLeft: 16,
                        padding: '8px 16px',
                        fontSize: 15,
                        borderRadius: 4,
                        border: '1px solid #ddd',
                        background: '#28a745',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                        height: 36
                    }}
                >
                    Download
                </button>
                <button
                    onClick={handleReload}
                    style={{
                        marginLeft: 16,
                        padding: '8px 16px',
                        fontSize: 15,
                        borderRadius: 4,
                        border: '1px solid #ddd',
                        background: '#007bff',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                        height: 36
                    }}
                >
                    Refresh
                </button>
            </div>

            <p style={{
                color: '#555',
                marginBottom: 24,
                fontSize: 16,
                textAlign: 'center'
            }}>
                Overview of registration and participation by category.
            </p>

            {loading ? (
                <div style={{ fontSize: 18, color: '#888', marginTop: 40 }}>Loading statistics...</div>
            ) : (
                <div style={{
                    width: '100%',
                    overflowX: 'auto',
                    background: '#f7faff',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        tableLayout: 'fixed',
                        fontSize: 15
                    }}>
                        <colgroup>
                            <col style={{ width: '5%', minWidth: '40px', maxWidth: '60px' }} />
                            <col style={{ width: '20%', minWidth: '160px', maxWidth: '300px' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                {columns.map(col => {
                                    const isHyperlink = [
                                        'registered',
                                        'started',
                                        'didNotStart',
                                        'finished',
                                        'didNotFinish',
                                        'falseStart',
                                        'noStartButFinished',
                                        'disqualified'
                                    ].includes(col);

                                    const routes = {
                                        registered: `/registered/${eventId}`,
                                        started: `/started/${eventId}`,
                                        didNotStart: `/did-not-start/${eventId}`,
                                        finished: `/finished/${eventId}`,
                                        didNotFinish: `/did-not-finish/${eventId}`,
                                        falseStart: `/false-start/${eventId}`,
                                        noStartButFinished: `/no-start-but-finished/${eventId}`,
                                        disqualified: `/disqualified/${eventId}`
                                    };

                                    if (isHyperlink) {
                                        return (
                                            <th key={col} style={{
                                                background: '#e3f0ff',
                                                padding: '12px 6px',
                                                border: '1px solid #ddd',
                                                fontWeight: 600,
                                                color: '#007bff',
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                textDecoration: 'underline'
                                            }}>
                                                <Link to={routes[col]} style={{ color: '#007bff', textDecoration: 'none' }}>
                                                    {columnDisplayNames[col] || col}
                                                </Link>
                                            </th>
                                        );
                                    }

                                    // Normal column title
                                    return (
                                        <th key={col} style={{
                                            background: '#e3f0ff',
                                            padding: '12px 6px',
                                            border: '1px solid #ddd',
                                            fontWeight: 600,
                                            color: '#234',
                                            textAlign: col === 'category' ? 'left' : 'center',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {columnDisplayNames[col] || col}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedData)
    .sort(([a], [b]) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numB - numA;
        }
        return b.localeCompare(a, undefined, { numeric: true });
    })
    .map(([distance, rows]) => {
        const isZero = distance === 0 || distance === '0';
        return (
            <React.Fragment key={distance}>
                <tr>
                    <td
                        colSpan={columns.length}
                        style={{
                            background: '#e3f0ff',
                            fontWeight: 900,
                            fontSize: isZero ? 17 : 16,
                            cursor: isZero ? 'default' : 'pointer',
                            userSelect: 'none',
                            letterSpacing: isZero ? 1 : 0,
                            height: isZero ? 18 : undefined // adjust height for empty row if needed
                        }}
                        onClick={!isZero ? () => toggleDistance(distance) : undefined}
                    >
                        {!isZero ? (
                            <>
                                <span style={{ marginRight: 8 }}>
                                    {collapsedDistances[distance] ? '▶' : '▼'}
                                </span>
                                Distance: {distance}KM
                            </>
                        ) : (
                            // Empty for distance 0
                            ''
                        )}
                    </td>
                </tr>
                {/* Only show rows if not collapsed, or always show if distance=0 */}
                {(!collapsedDistances[distance] || isZero) && rows.map((row, idx) => {
                    const isLastRow = idx === rows.length - 1;
                    return (
                        <tr
                            key={idx}
                            style={{
                                background: isLastRow
                                    ? '#d2fadb'
                                    : highlightRow(row)
                                        ? '#e8fff5'
                                        : idx % 2 === 0
                                            ? '#fff'
                                            : '#f4f8fb',
                                fontWeight: isLastRow
                                    ? 700
                                    : highlightRow(row)
                                        ? 700
                                        : 400
                            }}
                        >
                            {columns.map((col, colIdx) => {
    const isHyperlink = [
        'registered',
        'started',
        'didNotStart',
        'finished',
        'didNotFinish',
        'falseStart',
        'noStartButFinished',
        'disqualified'
    ].includes(col);

    const endpoints = {
        registered: '/statistic/registration',
        started: '/statistic/startlist',
        didNotStart: '/statistic/dns',
        finished: '/statistic/finished',
        didNotFinish: `/statistic/dnf?eventId=${eventId}`,
        falseStart: '/statistic/fs',
        noStartButFinished: '/statistic/nsbf',
        disqualified: '/statistic/dq'
    };

    // Normal cell
    return (
        <td key={col} style={{
            padding: '10px 6px',
            border: '1px solid #e0e0e0',
            textAlign: typeof row[col] === 'number' ? 'right' : 'center',
            color: '#222',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        }}>
            {row[col]}
        </td>
    );
})}
                        </tr>
                    );
                })}
            </React.Fragment>
        );
    })}
                        </tbody>
                    </table>
                </div>
            )}
        </PageWrapper>
    );
};

export default StatisticPage;