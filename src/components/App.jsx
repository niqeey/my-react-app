import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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

const greyOutStyle = {
    background: 'rgba(255, 255, 255, 0.23)',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    maxWidth: 1000,
    margin: '60px auto'
};

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

// Nav component that changes based on route
const NavBar = () => {
    const location = useLocation();
    return (
        <nav>
            {location.pathname === '/' ? (
                <>
                    <Link to="/">Home</Link> | <Link to="/login">Login</Link>
                </>
            ) : location.pathname === '/login' ? (
                <>
                    <Link to="/">Home</Link>
                </>
            ) : location.pathname === '/dashboard' ? (
                <>
                    <Link to="/">Home</Link> 
                    |<Link to="/dashboard">Dashboard</Link> 
                    |<Link to="/eventsetup">Event Setup</Link> 
                    |<Link to="/eventlisting">Event Listing</Link>  
                    |<Link to="/racesetup">Race Setup</Link>  
                    |<Link to="/runnersetup">Runner Setup</Link> 
                    |<Link to="/resultpage">Result</Link> 
                    |<Link to="/fullresultingpage">Full Result</Link> 
                    |<Link to="/statisticpage">Statistic</Link> 
                </>
            ) : (
                <>
                    <Link to="/">Home</Link>
                    |<Link to="/dashboard">Dashboard</Link> 
                </>
            )}
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
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/eventlisting" element={<EventListing />} />
                        <Route path="/racesetup/:eventId" element={<RaceSetup />} />
                        <Route path="/event/:eventId" element={<EventPage />} />
                        <Route path="/topevent/:eventId/:category" element={<TopEventPage />} /> {/* <-- Add this line */}
                        <Route path="/statistic/:eventId" element={<StatisticPage />} /> {/* <-- Add this line */}
                        <Route path="/registered/:eventId" element={<Registered />} />
                        <Route path="/started/:eventId" element={<Started />} />
                        <Route path="/did-not-start/:eventId" element={<DidNotStart />} />
                        <Route path="/finished/:eventId" element={<Finished />} />
                        <Route path="/did-not-finish/:eventId" element={<DidNotFinish />} /> {/* Adjusted path */}
                        <Route path="/false-start/:eventId" element={<FalseStart />} />
                        <Route path="/no-start-but-finished/:eventId" element={<NoStartButFinished />} />
                        <Route path="/disqualified/:eventId" element={<Disqualified />} />
                    </Routes>
                </div>
                <Footer />
            </Router>
        </OrgProvider>
    );
};

export default App;