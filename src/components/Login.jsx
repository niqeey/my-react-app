import React, { useState } from 'react';
import { useOrg } from './OrgContext';
import { useNavigate } from 'react-router-dom';
import apiBase from '../apiBase';

const loginStyle = {
    background: 'rgba(187, 186, 192, 0.39)',
    padding: '32px 16px',
    borderRadius: '15px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    maxWidth: '350px',
    width: '95vw',
    margin: '40px auto'
};

const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '10px 0',
    borderRadius: '5px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    fontSize: '1rem'
};

const buttonStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
};


const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [popupType, setPopupType] = useState('error'); // 'success' or 'error'
    const { setOrgId } = useOrg();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const res = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                setMessage(data.message || 'Login Successful!');
                setPopupType('success');
                if (setOrgId && data.orgId) setOrgId(data.orgId);
            sessionStorage.setItem('orgId', data.orgId);
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('sessionId', data.sessionId);
            sessionStorage.setItem('sessionExpiryTime', data.sessionExpiryTime);
            sessionStorage.setItem('role', data.role);
                setShowPopup(true);
            } else {
                setMessage(data.message || 'Login failed');
                setPopupType('error');
                setShowPopup(true);
            }
        } catch (err) {
            setMessage('Network error');
            setPopupType('error');
            setShowPopup(true);
        }
    };

    const handlePopupOk = () => {
        setShowPopup(false);
        if (popupType === 'success') {
            navigate('/dashboard');
        }
    };

    return (
        <div>
            <div>
                <h1>My Pace Tracker</h1>
                <h2>--------------- Every Second Counts ---------------</h2>
            </div>
            <div style={loginStyle}>
                <h1>Timer Login</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        style={inputStyle}
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        style={inputStyle}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <button type="submit" style={buttonStyle}>Login</button>
                </form>
                {showPopup && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: '#fff',
                            padding: '32px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                            minWidth: '300px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                marginBottom: '16px',
                                color: popupType === 'success' ? '#222' : '#c00'
                            }}>
                                {message}
                            </div>
                            <button onClick={handlePopupOk} style={{
                                padding: '8px 24px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#007bff',
                                color: '#fff',
                                cursor: 'pointer'
                            }}>OK</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;