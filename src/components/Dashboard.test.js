import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, __setNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';

const mockNavigate = jest.fn();

describe('Dashboard Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        __setNavigate(mockNavigate);
    });

    const renderDashboard = () => {
        return render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );
    };

    test('should render dashboard heading', () => {
        renderDashboard();
        expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    test('should render welcome message', () => {
        renderDashboard();
        expect(screen.getByText(/Welcome to your dashboard/i)).toBeInTheDocument();
    });

    test('should render navigation button', () => {
        renderDashboard();
        const button = screen.getByRole('button', { name: /Go to Event Listing Page/i });
        expect(button).toBeInTheDocument();
    });

    test('should navigate to event listing when button is clicked', () => {
        renderDashboard();
        const button = screen.getByRole('button', { name: /Go to Event Listing Page/i });
        
        fireEvent.click(button);
        
        expect(mockNavigate).toHaveBeenCalledWith('/eventlisting');
        expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    test('should have correct button styling', () => {
        renderDashboard();
        const button = screen.getByRole('button', { name: /Go to Event Listing Page/i });
        
        expect(button).toHaveStyle({
            background: '#007bff',
            color: '#fff',
            cursor: 'pointer'
        });
    });
});
