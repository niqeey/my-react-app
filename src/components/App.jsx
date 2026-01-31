import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import EventSetup from './EventSetup';
import RaceSetup from './RaceSetup';
import RunnerSetup from './RunnerSetup';
import ResultPage from './ResultPage';
import FullResultingPage from './FullResultingPage';
import StatisticPage from './StatisticPage';
import { OrgProvider } from './OrgContext';
import EventListing from './EventListing';
import EventPage from './EventPage'; // adjust path if needed
import TopEventPage from './TopEventPage'; // <-- Add this import
import Registered from './Registered';
import Started from './Started';
import DidNotStart from './DidNotStart';
import Finished from './Finished';
import DidNotFinish from './DidNotFinish';
import FalseStart from './FalseStart';
import NoStartButFinished from './NoStartButFinished';
import Disqualified from './Disqualified';
import ProtectedRoute from './ProtectedRoute';

const headerStyle = {
    padding: '32px 0 16px 0',
    borderRadius: '0 0 18px 18px',
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
};

const flickerStyle = {
    margin: '12px 0 0 0',
    fontWeight: 400,
    color: '#4a4e69',
    fontSize: '1.2rem',
    letterSpacing: 1,
    transition: 'opacity 0.2s',
    minHeight: '1.5em'
};

const Home = () => {
    const [showFlicker, setShowFlicker] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowFlicker(f => !f);
        }, 600); // Flicker every 600ms
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={headerStyle}>
            <h1 style={{ margin: 0, fontWeight: 700, letterSpacing: 1 }}>My Pace Tracker</h1>
            <div
                style={{
                    ...flickerStyle,
                    opacity: showFlicker ? 1 : 0.2
                }}
            >
                --------------- Every Second Counts ---------------
            </div>
        </div>
    );
};

// Nav component that changes based on route and authentication
const NavBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const checkAuth = () => {
            const sessionId = sessionStorage.getItem('sessionId');
            const role = sessionStorage.getItem('role');
            setIsAuthenticated(!!sessionId);
            setUserRole(role || '');
        };
        checkAuth();
        
        // Listen for storage changes (logout in another tab)
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [location]);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            setIsAuthenticated(false);
            navigate('/login');
        }
    };

    // Home and Login pages
    if (location.pathname === '/' || location.pathname === '/login') {
        return (
            <nav>
                <Link to="/">Home</Link>
                {location.pathname !== '/login' && ' | '}
                {location.pathname !== '/login' && <Link to="/login">Login</Link>}
            </nav>
        );
    }

    // Authenticated pages - dynamic menu
    if (isAuthenticated) {
        return (
            <nav>
                <Link to="/dashboard">Dashboard</Link>
                {' | '}
                <Link to="/eventlisting">Event Listing</Link>
                {userRole === 'admin' && (
                    <>
                        {' | '}
                        <Link to="/eventsetup">Event Setup</Link>
                    </>
                )}
                {' | '}
                <button 
                    onClick={handleLogout}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#007bff',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                        font: 'inherit'
                    }}
                >
                    Logout
                </button>
            </nav>
        );
    }

    // Fallback
    return (
        <nav>
            <Link to="/">Home</Link>
            {' | '}
            <Link to="/login">Login</Link>
        </nav>
    );
};

const Footer = () => (
    
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
                © 2025 MyPaceTracker. All rights reserved.
            </footer>
);


const App = () => {
    return (
        <OrgProvider>
            <Router>
                <NavBar />
                <div className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/eventlisting" element={<ProtectedRoute><EventListing /></ProtectedRoute>} />
                        <Route path="/eventsetup" element={<ProtectedRoute><EventSetup /></ProtectedRoute>} />
                        <Route path="/racesetup/:eventId" element={<ProtectedRoute><RaceSetup /></ProtectedRoute>} />
                        <Route path="/runnersetup" element={<ProtectedRoute><RunnerSetup /></ProtectedRoute>} />
                        <Route path="/resultpage" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
                        <Route path="/fullresultingpage" element={<ProtectedRoute><FullResultingPage /></ProtectedRoute>} />
                        <Route path="/event/:eventId" element={<ProtectedRoute><EventPage /></ProtectedRoute>} />
                        <Route path="/topevent/:eventId/:category" element={<ProtectedRoute><TopEventPage /></ProtectedRoute>} />
                        <Route path="/statistic/:eventId" element={<ProtectedRoute><StatisticPage /></ProtectedRoute>} />
                        <Route path="/statisticpage" element={<ProtectedRoute><StatisticPage /></ProtectedRoute>} />
                        <Route path="/registered/:eventId" element={<ProtectedRoute><Registered /></ProtectedRoute>} />
                        <Route path="/started/:eventId" element={<ProtectedRoute><Started /></ProtectedRoute>} />
                        <Route path="/did-not-start/:eventId" element={<ProtectedRoute><DidNotStart /></ProtectedRoute>} />
                        <Route path="/finished/:eventId" element={<ProtectedRoute><Finished /></ProtectedRoute>} />
                        <Route path="/did-not-finish/:eventId" element={<ProtectedRoute><DidNotFinish /></ProtectedRoute>} />
                        <Route path="/false-start/:eventId" element={<ProtectedRoute><FalseStart /></ProtectedRoute>} />
                        <Route path="/no-start-but-finished/:eventId" element={<ProtectedRoute><NoStartButFinished /></ProtectedRoute>} />
                        <Route path="/disqualified/:eventId" element={<ProtectedRoute><Disqualified /></ProtectedRoute>} />
                    </Routes>
                </div>
                <Footer />
            </Router>
        </OrgProvider>
    );
};

export default App;