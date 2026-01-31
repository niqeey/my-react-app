import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = () => {
            const sessionId = sessionStorage.getItem('sessionId');
            const sessionExpiryTime = sessionStorage.getItem('sessionExpiryTime');
            const username = sessionStorage.getItem('username');
            const orgId = sessionStorage.getItem('orgId');

            // Check if all required session data exists
            if (!sessionId || !sessionExpiryTime || !username || !orgId) {
                setIsAuthenticated(false);
                return;
            }

            // Check if session has expired
            const expiryDate = new Date(sessionExpiryTime);
            const now = new Date();
            
            if (expiryDate <= now) {
                // Session expired, clear storage
                sessionStorage.clear();
                setIsAuthenticated(false);
                return;
            }

            setIsAuthenticated(true);
        };

        checkAuth();
    }, [location]);

    // Show loading state while checking authentication
    if (isAuthenticated === null) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#666'
            }}>
                Checking authentication...
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Render children if authenticated
    return children;
};

export default ProtectedRoute;
