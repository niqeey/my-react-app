import React from 'react';

const loginStyle = {
    background: 'rgba(187, 186, 192, 0.39)', // semi-transparent white
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    maxWidth: '350px',
    margin: '60px auto'
};


const inputStyle = {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '5px',
    border: '1px solid #ccc',
    boxSizing: 'border-box'
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
    return (
        <div>
            <div>
                <h1>My Pace Tracker</h1>
                <h2>--------------- Every Second Counts ---------------</h2>
            </div>
            <div style={loginStyle}>
                <h1>Timer Login</h1>
                <form>
                    <input type="text" placeholder="Username" style={inputStyle} />
                    <input type="password" placeholder="Password" style={inputStyle} />
                    <button type="submit" style={buttonStyle}>Login</button>
                </form>
            </div>
        </div>
    );
};

export default Login;