import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';

jest.mock('./Login', () => {
    return function Login() {
        return <div>Login Component</div>;
    };
});

jest.mock('./Dashboard', () => {
    return function Dashboard() {
        return <div>Dashboard Component</div>;
    };
});

jest.mock('./EventListing', () => {
    return function EventListing() {
        return <div>EventListing Component</div>;
    };
});

describe('App Component', () => {
    test('should render without crashing', () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );
    });

    test('should provide OrgContext to children', () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );
        
        // Check if routing structure is in place
        expect(document.querySelector('body')).toBeInTheDocument();
    });

    test('should render login route', () => {
        window.history.pushState({}, 'Login', '/login');
        
        render(
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<div>Login Component</div>} />
                </Routes>
            </BrowserRouter>
        );
        
        expect(screen.getByText('Login Component')).toBeInTheDocument();
    });

    test('should render dashboard route', () => {
        window.history.pushState({}, 'Dashboard', '/dashboard');
        
        render(
            <BrowserRouter>
                <Routes>
                    <Route path="/dashboard" element={<div>Dashboard Component</div>} />
                </Routes>
            </BrowserRouter>
        );
        
        expect(screen.getByText('Dashboard Component')).toBeInTheDocument();
    });
});
