import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    const goToEventListing = () => {
        navigate('/eventlisting'); // Adjust this path if your Event Listing Page uses a different route
    };

    return (
        <div style={{ padding: 32, textAlign: 'center' }}>
            <h1>Dashboard</h1>
            <p style={{ fontSize: 16, color: '#444', margin: '16px 0 32px 0' }}>
                Welcome to your dashboard. Here you can access all event-related features and manage your activities.
                Click the button below to view the full list of events.
            </p>
            <button
                onClick={goToEventListing}
                style={{
                    padding: '12px 32px',
                    fontSize: 18,
                    borderRadius: 8,
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: 24
                }}
            >
                Go to Event Listing Page
            </button>
        </div>
    );
};

export default Dashboard;