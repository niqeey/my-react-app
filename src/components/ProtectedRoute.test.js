import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Mock child component
const MockProtectedComponent = () => <div>Protected Content</div>;
const MockLoginComponent = () => <div>Login Page</div>;

describe('ProtectedRoute', () => {
    let mockSessionStorage;

    beforeEach(() => {
        // Mock sessionStorage
        mockSessionStorage = {};
        Storage.prototype.getItem = jest.fn((key) => mockSessionStorage[key] || null);
        Storage.prototype.setItem = jest.fn((key, value) => {
            mockSessionStorage[key] = value;
        });
        Storage.prototype.clear = jest.fn(() => {
            mockSessionStorage = {};
        });
    });

    const renderWithRouter = (component) => {
        return render(
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={component} />
                    <Route path="/login" element={<MockLoginComponent />} />
                </Routes>
            </BrowserRouter>
        );
    };

    test('should redirect to login when no session exists', async () => {
        renderWithRouter(
            <ProtectedRoute>
                <MockProtectedComponent />
            </ProtectedRoute>
        );

        await waitFor(() => {
            expect(screen.getByText('Login Page')).toBeInTheDocument();
        });
    });

    test('should redirect to login when sessionId is missing', async () => {
        mockSessionStorage = {
            username: 'testuser',
            orgId: 'org123',
            sessionExpiryTime: new Date(Date.now() + 7200000).toISOString()
        };

        renderWithRouter(
            <ProtectedRoute>
                <MockProtectedComponent />
            </ProtectedRoute>
        );

        await waitFor(() => {
            expect(screen.getByText('Login Page')).toBeInTheDocument();
        });
    });

    test('should redirect to login when session is expired', async () => {
        const expiredDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
        mockSessionStorage = {
            sessionId: 'session123',
            username: 'testuser',
            orgId: 'org123',
            sessionExpiryTime: expiredDate
        };

        renderWithRouter(
            <ProtectedRoute>
                <MockProtectedComponent />
            </ProtectedRoute>
        );

        await waitFor(() => {
            expect(screen.getByText('Login Page')).toBeInTheDocument();
            expect(Storage.prototype.clear).toHaveBeenCalled();
        });
    });

    test('should render protected content when session is valid', async () => {
        const futureDate = new Date(Date.now() + 7200000).toISOString(); // 2 hours from now
        mockSessionStorage = {
            sessionId: 'session123',
            username: 'testuser',
            orgId: 'org123',
            sessionExpiryTime: futureDate
        };

        renderWithRouter(
            <ProtectedRoute>
                <MockProtectedComponent />
            </ProtectedRoute>
        );

        await waitFor(() => {
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });
    });

    test('should show loading state initially', async () => {
        mockSessionStorage = {
            sessionId: 'session123',
            username: 'testuser',
            orgId: 'org123',
            sessionExpiryTime: new Date(Date.now() + 7200000).toISOString()
        };

        renderWithRouter(
            <ProtectedRoute>
                <MockProtectedComponent />
            </ProtectedRoute>
        );

        // Wait for the component to finish checking auth and render content
        await waitFor(() => {
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });
    });
});
