import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { OrgProvider } from '../OrgContext';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

// Mock fetch
global.fetch = jest.fn();

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock sessionStorage
        Storage.prototype.setItem = jest.fn();
        Storage.prototype.getItem = jest.fn();
    });

    const renderLogin = () => {
        return render(
            <BrowserRouter>
                <OrgProvider>
                    <Login />
                </OrgProvider>
            </BrowserRouter>
        );
    };

    test('should render login form', () => {
        renderLogin();
        
        expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('should update username and password on input change', () => {
        renderLogin();
        
        const usernameInput = screen.getByPlaceholderText('Username');
        const passwordInput = screen.getByPlaceholderText('Password');
        
        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        
        expect(usernameInput.value).toBe('testuser');
        expect(passwordInput.value).toBe('password123');
    });

    test('should handle successful login', async () => {
        const mockResponse = {
            success: true,
            message: 'Login Successful!',
            orgId: 'org123',
            sessionId: 'session123',
            sessionExpiryTime: '2026-12-31T23:59:59',
            role: 'admin'
        };
        
        fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue(mockResponse)
        });
        
        renderLogin();
        
        const usernameInput = screen.getByPlaceholderText('Username');
        const passwordInput = screen.getByPlaceholderText('Password');
        const loginButton = screen.getByRole('button', { name: /login/i });
        
        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(loginButton);
        
        await waitFor(() => {
            expect(screen.getByText('Login Successful!')).toBeInTheDocument();
        });
        
        expect(sessionStorage.setItem).toHaveBeenCalledWith('orgId', 'org123');
        expect(sessionStorage.setItem).toHaveBeenCalledWith('username', 'testuser');
        expect(sessionStorage.setItem).toHaveBeenCalledWith('sessionId', 'session123');
        expect(sessionStorage.setItem).toHaveBeenCalledWith('role', 'admin');
    });

    test('should handle failed login', async () => {
        const mockResponse = {
            success: false,
            message: 'Invalid credentials'
        };
        
        fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue(mockResponse)
        });
        
        renderLogin();
        
        const usernameInput = screen.getByPlaceholderText('Username');
        const passwordInput = screen.getByPlaceholderText('Password');
        const loginButton = screen.getByRole('button', { name: /login/i });
        
        fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
        fireEvent.click(loginButton);
        
        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    test('should handle network error', async () => {
        fetch.mockRejectedValue(new Error('Network error'));
        
        renderLogin();
        
        const usernameInput = screen.getByPlaceholderText('Username');
        const passwordInput = screen.getByPlaceholderText('Password');
        const loginButton = screen.getByRole('button', { name: /login/i });
        
        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(loginButton);
        
        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument();
        });
    });

    test('should navigate to dashboard on successful login after clicking OK', async () => {
        const mockResponse = {
            success: true,
            message: 'Login Successful!',
            orgId: 'org123',
            sessionId: 'session123',
            sessionExpiryTime: '2026-12-31T23:59:59',
            role: 'admin'
        };
        
        fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue(mockResponse)
        });
        
        renderLogin();
        
        const usernameInput = screen.getByPlaceholderText('Username');
        const passwordInput = screen.getByPlaceholderText('Password');
        const loginButton = screen.getByRole('button', { name: /login/i });
        
        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(loginButton);
        
        await waitFor(() => {
            expect(screen.getByText('Login Successful!')).toBeInTheDocument();
        });
        
        const okButton = screen.getByRole('button', { name: /ok/i });
        fireEvent.click(okButton);
        
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
});
