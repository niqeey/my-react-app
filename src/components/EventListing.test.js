import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, __setNavigate } from 'react-router-dom';
import EventListing from './EventListing';
import { OrgProvider } from './OrgContext';
import { authFetch } from '../utils/authFetch';

jest.mock('../utils/authFetch');

const mockNavigate = jest.fn();

describe('EventListing Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        __setNavigate(mockNavigate);
        sessionStorage.clear();
        sessionStorage.setItem('orgId', 'org123');
    });

    const renderEventListing = () => {
        return render(
            <BrowserRouter>
                <OrgProvider>
                    <EventListing />
                </OrgProvider>
            </BrowserRouter>
        );
    };

    const mockEvents = [
        {
            eventId: 'event1',
            name: 'Marathon 2026',
            eventDt: '2026-03-15',
            location: 'City Park',
            country: 'USA'
        },
        {
            eventId: 'event2',
            name: '5K Fun Run',
            eventDt: '2026-04-20',
            location: 'Beach Area',
            country: 'USA'
        }
    ];

    test('should render loading state initially', () => {
        authFetch.mockImplementation(() => new Promise(() => {}));
        renderEventListing();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('should render events after successful fetch', async () => {
        authFetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue(mockEvents)
        });

        renderEventListing();

        await waitFor(() => {
            expect(screen.getByText('Marathon 2026')).toBeInTheDocument();
            expect(screen.getByText('5K Fun Run')).toBeInTheDocument();
        });
    });

    test('should display error message on fetch failure', async () => {
        authFetch.mockRejectedValue(new Error('Network error'));

        renderEventListing();

        await waitFor(() => {
            expect(screen.getByText(/Network error/i)).toBeInTheDocument();
        });
    });

    test('should filter events by name', async () => {
        authFetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue(mockEvents)
        });

        renderEventListing();

        await waitFor(() => {
            expect(screen.getByText('Marathon 2026')).toBeInTheDocument();
        });

        const filterInput = screen.getByPlaceholderText(/filter by name/i);
        fireEvent.change(filterInput, { target: { value: 'Marathon' } });

        expect(screen.getByText('Marathon 2026')).toBeInTheDocument();
    });

    test('should switch between upcoming and archived tabs', async () => {
        authFetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue(mockEvents)
        });

        renderEventListing();

        await waitFor(() => {
            expect(screen.getByText('Marathon 2026')).toBeInTheDocument();
        });

        // Find and click the archived tab
        const archivedTab = screen.getByText(/archived/i);
        fireEvent.click(archivedTab);

        await waitFor(() => {
            expect(authFetch).toHaveBeenCalledWith(
                expect.stringContaining('/archived'),
                expect.any(Object)
            );
        });
    });

    test('should handle event deletion', async () => {
        authFetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue(mockEvents)
        });

        window.confirm = jest.fn().mockReturnValue(true);

        renderEventListing();

        await waitFor(() => {
            expect(screen.getByText('Marathon 2026')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        fireEvent.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalledWith(
            'Are you sure you want to delete this event?'
        );
    });

    test('should display no organization ID error when orgId is missing', async () => {
        sessionStorage.clear();

        renderEventListing();

        await waitFor(() => {
            expect(screen.getByText(/No organization ID found/i)).toBeInTheDocument();
        });
    });
});
