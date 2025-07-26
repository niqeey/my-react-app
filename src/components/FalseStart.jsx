import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import apiBase from '../apiBase'; // Adjust the path based on your project structure

const FalseStart = () => {
    const { eventId } = useParams(); // Get eventId from the URL
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [eventName, setEventName] = useState('');

    useEffect(() => {
        const fetchFalseStartParticipants = async () => {
            try {
                const response = await fetch(`${apiBase}/statistic/fs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventId }) // Use eventId from the URL
                });
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error('Error fetching False Start participants:', error);
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchFalseStartParticipants(); // Call the function only if eventId is available
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
            <h2>False Start Participants</h2>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '20px'
                }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Item</th>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Category</th>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Bib</th>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Name</th>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Time Start</th>
                            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Time Gun</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((participant, index) => (
                            <tr key={index}>
                                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{participant.item}</td>
                                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{participant.category}</td>
                                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{participant.bib}</td>
                                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{participant.name}</td>
                                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{participant.timeStart || 'N/A'}</td>
                                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{participant.timeGun || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default FalseStart;