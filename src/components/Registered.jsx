import React, { useEffect, useState } from 'react';
import PageWrapper from './PageWrapper';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import apiBase from '../apiBase'; // Import apiBase
import { authFetch } from '../utils/authFetch';

const Registered = () => {
    const { eventId } = useParams(); // Get eventId from the URL
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [eventName, setEventName] = useState('');

    useEffect(() => {
        const fetchRegisteredParticipants = async () => {
            try {
                console.log('Fetching registered participants for eventId:', eventId);
                const response = await authFetch(`${apiBase}/statistic/registration`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventId }) // Use eventId from the URL
                });
                const result = await response.json();
                console.log('Registered participants response:', result);
                console.log('Is array?', Array.isArray(result), 'Length:', result?.length);
                setData(result);
            } catch (error) {
                console.error('Error fetching registered participants:', error);
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchRegisteredParticipants(); // Call the function only if eventId is available
        }

        // Get eventName from sessionStorage when component mounts or eventId changes
        const storedName = sessionStorage.getItem('eventName');
        if (storedName) setEventName(storedName);
    }, [eventId]); // Add eventId as a dependency

    return (
        <PageWrapper>
            <div style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.9)', // White background with 90% transparency
                borderRadius: '8px', // Optional: Add rounded corners for better aesthetics
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' // Optional: Add a subtle shadow
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
                <h2>Registered Participants</h2>
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
                            </tr>
                        </thead>
                        <tbody>
                            {(Array.isArray(data) ? data : []).map((participant, index) => (
                                <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <td style={{ border: '1px solid #ddd', padding: '10px 8px' }}>{participant.item}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '10px 8px' }}>{participant.category}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '10px 8px' }}>{participant.bib}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '10px 8px' }}>{participant.name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </PageWrapper>
    );
};

export default Registered;