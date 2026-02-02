import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import { authFetch } from '../utils/authFetch';
import apiBase from '../apiBase'; // Adjust the path based on your project structure

const NoStartButFinished = () => {
    const { eventId } = useParams(); // Get eventId from the URL
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [eventName, setEventName] = useState('');

    useEffect(() => {
        const fetchNoStartButFinishedParticipants = async () => {
            try {
                console.log('Fetching NSBF participants for eventId:', eventId);
                const response = await authFetch(`${apiBase}/statistic/nsbf`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventId }) // Use eventId from the URL
                });
                const result = await response.json();
                console.log('NSBF response:', result);
                console.log('Is array?', Array.isArray(result), 'Length:', result?.length);
                setData(result);
            } catch (error) {
                console.error('Error fetching No Start But Finished participants:', error);
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchNoStartButFinishedParticipants(); // Call the function only if eventId is available
        }

        // Get eventName from sessionStorage when component mounts or eventId changes
        const storedName = sessionStorage.getItem('eventName');
        if (storedName) setEventName(storedName);
    }, [eventId]); // Add eventId as a dependency

    return (
        <div style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.9)', // White background with 90% transparency
            borderRadius: '8px', // Rounded corners
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' // Subtle shadow
        }}>
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
            <h1 style={{
                fontSize: 28,
                textAlign: 'center',
                fontWeight: 700,
                letterSpacing: 1,
                color: '#555',
                margin: 0,
                flex: 1
            }}> {eventName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <h2>No Start But Finished Participants</h2>
                <button
                    onClick={async () => {
                        try {
                            const res = await authFetch(`${apiBase}/report/event/nsbf/xlsx`, {
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
                            a.download = `${eventName || 'event'}_no_start_but_finished.xlsx`;
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
                        background: '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '10px 28px',
                        fontWeight: 'bold',
                        fontSize: 16,
                        cursor: 'pointer'
                    }}
                >
                    Download
                </button>
            </div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '20px'
                }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ border: '1px solid #ddd', padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Item</th>
                            <th style={{ border: '1px solid #ddd', padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Category</th>
                            <th style={{ border: '1px solid #ddd', padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Bib</th>
                            <th style={{ border: '1px solid #ddd', padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                            <th style={{ border: '1px solid #ddd', padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Time Start</th>
                            <th style={{ border: '1px solid #ddd', padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Time Gun</th>
                            <th style={{ border: '1px solid #ddd', padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Time Finish</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(Array.isArray(data) ? data : []).map((participant, index) => (
                            <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                                <td style={{ border: '1px solid #ddd', padding: '10px 8px' }}>{participant.item}</td>
                                <td style={{ border: '1px solid #ddd', padding: '10px 8px' }}>{participant.category}</td>
                                <td style={{ border: '1px solid #ddd', padding: '10px 8px' }}>{participant.bib}</td>
                                <td style={{ border: '1px solid #ddd', padding: '10px 8px' }}>{participant.name}</td>
                                <td style={{ border: '1px solid #ddd', padding: '10px 8px' }}>{participant.timeStart || 'N/A'}</td>
                                <td style={{ border: '1px solid #ddd', padding: '10px 8px' }}>{participant.timeGun || 'N/A'}</td>
                                <td style={{ border: '1px solid #ddd', padding: '10px 8px' }}>{participant.timeFinish || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default NoStartButFinished;