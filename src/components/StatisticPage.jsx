import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // <-- import useNavigate

const columnDisplayNames = {
    cat: 'Cat',
    category: 'Category',
    registered: 'Registered',
    started: 'Started',
    didNotStart: 'Did Not Start',
    finished: 'Finished',
    didNotFinish: 'Did Not Finish',
    falseStart: 'False Start',
    noStartButFinished: 'No Start But Finished'
};

const highlightRow = (row) =>
    row.category && row.category.toLowerCase().includes('total');

const StatisticPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventName, setEventName] = useState('');

    useEffect(() => {
        // Get event name from sessionStorage
        const storedName = sessionStorage.getItem('eventName');
        setEventName(storedName || 'Event');

        fetch('/statistic/full', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId })
        })
        .then(res => res.json())
        .then(setData)
        .finally(() => setLoading(false));
    }, [eventId]);

    const columns = [
        'cat', 'category', 'registered', 'started', 'didNotStart',
        'finished', 'didNotFinish', 'falseStart', 'noStartButFinished'
    ];

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            background: 'linear-gradient(135deg, #e3f0ff 0%, #f9fafc 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
        }}>
            <div style={{
                minHeight: 'calc(100vh - 60px)',
                width: '100%',
                maxWidth: 1200,
                margin: '0 auto',
                padding: 32,
                background: 'rgba(255,255,255,0.97)',
                borderRadius: 16,
                boxShadow: '0 6px 32px rgba(0,0,0,0.10)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflowY: 'auto',
                paddingBottom: 100
            }}>
                {/* Back Button */}
                <div style={{ width: '100%', marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
                    <button
                        onClick={() => navigate(`/event/${eventId}`)}
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
                        Back to event
                    </button>
                </div>
                <h1 style={{
                    margin: '24px 0 8px 0',
                    fontSize: 28,
                    textAlign: 'center',
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: '#555'
                }}>
                    {eventName} Statistics
                </h1>
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
                                <col style={{ width: '5%', minWidth: '40px', maxWidth: '60px' }} /> {/* cat column */}
                                <col style={{ width: '20%', minWidth: '160px', maxWidth: '300px' }} /> {/* category column */}
                                {/* The rest will auto-distribute */}
                            </colgroup>
                            <thead>
                                <tr>
                                    {columns.map(col => (
                                        <th key={col} style={{
                                            background: '#e3f0ff',
                                            padding: '12px 6px',
                                            border: '5px solidrgb(3, 2, 2)',
                                            fontWeight: 600,
                                            color: '#234',
                                            textAlign: col === 'category' ? 'left' : 'center',
                                           // whiteSpace: 'nowrap', // prevent wrapping
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {columnDisplayNames[col] || col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, idx) => (
                                    <tr
                                        key={idx}
                                        style={{
                                            background: highlightRow(row) ? '#d1e7dd' : idx % 2 === 0 ? '#fff' : '#f4f8fb',
                                            fontWeight: highlightRow(row) ? 700 : 400
                                        }}
                                    >
                                        {columns.map(col => (
                                            <td key={col} style={{
                                                padding: '10px 6px',
                                                border: '1px solid #e0e0e0',
                                                textAlign: typeof row[col] === 'number' ? 'right' : (col === 'category' ? 'left' : 'center'),
                                                color: highlightRow(row) ? '#155724' : '#222',
                                                fontSize: highlightRow(row) ? 16 : 15,
                                                letterSpacing: highlightRow(row) ? 0.5 : 0,
                                                whiteSpace: 'nowrap', // prevent wrapping
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {row[col]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatisticPage;