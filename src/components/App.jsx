import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import EventSetup from './EventSetup';
import RaceSetup from './RaceSetup';
import RunnerSetup from './RunnerSetup';
import ResultPage from './ResultPage';
import FullResultingPage from './FullResultingPage';
import StatisticPage from './StatisticPage';


const greyOutStyle = {
    background: 'rgba(255, 255, 255, 0.23)',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    maxWidth: 1000,
    margin: '60px auto'
};

const Home = () => (
    <div>
        <h1>My Pace Tracker</h1>
        <h2>--------------- Every Second Counts ---------------</h2>
    </div>
);

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
                    |<Link to="/dashbaord">Dashboard</Link> 
                    |<Link to="/eventsetup">Event Setup</Link>  
                    |<Link to="/racesetup">Race Setup</Link>  
                    |<Link to="/runnersetup">Runner Setup</Link> 
                    |<Link to="/resultpage">Result</Link> 
                    |<Link to="/fullresultingpage">Full Result</Link> 
                    |<Link to="/statisticpage">Statistic</Link> 
                </>
            ) : null}
        </nav>
    );
};

const App = () => {
    return (
        <Router>
            <NavBar />
            <div className="main-content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;