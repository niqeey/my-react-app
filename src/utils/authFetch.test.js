import { authFetch } from '../authFetch';

// Mock fetch globally
global.fetch = jest.fn();

describe('authFetch', () => {
    let originalLocation;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        
        // Mock sessionStorage
        Storage.prototype.getItem = jest.fn((key) => {
            const store = {
                orgId: 'org123',
                username: 'testuser',
                sessionId: 'session123',
                sessionExpiryTime: '2026-12-31T23:59:59'
            };
            return store[key] || null;
        });
        
        Storage.prototype.setItem = jest.fn();
        Storage.prototype.clear = jest.fn();
        
        // Mock window.location
        originalLocation = window.location;
        delete window.location;
        window.location = { href: '' };
    });

    afterEach(() => {
        window.location = originalLocation;
    });

    test('should include auth headers in request', async () => {
        const mockResponse = {
            ok: true,
            json: jest.fn().mockResolvedValue({ data: 'test' })
        };
        fetch.mockResolvedValue(mockResponse);

        await authFetch('http://test.com/api/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        expect(fetch).toHaveBeenCalledWith('http://test.com/api/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'orgId': 'org123',
                'username': 'testuser',
                'sessionId': 'session123',
                'sessionExpiryTime': '2026-12-31T23:59:59'
            }
        });
    });

    test('should handle 401 unauthorized with JSON response', async () => {
        const mockResponse = {
            ok: false,
            status: 401,
            json: jest.fn().mockResolvedValue({
                error: 'Session expired',
                requireLogin: true
            })
        };
        fetch.mockResolvedValue(mockResponse);

        await expect(authFetch('http://test.com/api/test')).rejects.toThrow('Session expired');
        
        expect(sessionStorage.clear).toHaveBeenCalled();
        expect(window.location.href).toBe('/login');
    });

    test('should handle 401 unauthorized with non-JSON response', async () => {
        const mockResponse = {
            ok: false,
            status: 401,
            json: jest.fn().mockRejectedValue(new Error('Not JSON'))
        };
        fetch.mockResolvedValue(mockResponse);

        await expect(authFetch('http://test.com/api/test')).rejects.toThrow('Session expired. Please login again.');
        
        expect(sessionStorage.clear).toHaveBeenCalled();
        expect(window.location.href).toBe('/login');
    });

    test('should handle other error status codes with JSON', async () => {
        const mockResponse = {
            ok: false,
            status: 500,
            json: jest.fn().mockResolvedValue({
                message: 'Internal server error'
            })
        };
        fetch.mockResolvedValue(mockResponse);

        await expect(authFetch('http://test.com/api/test')).rejects.toThrow('Internal server error');
    });

    test('should handle other error status codes without JSON', async () => {
        const mockResponse = {
            ok: false,
            status: 500,
            json: jest.fn().mockRejectedValue(new Error('Not JSON'))
        };
        fetch.mockResolvedValue(mockResponse);

        await expect(authFetch('http://test.com/api/test')).rejects.toThrow('Request failed with status 500');
    });

    test('should return response for successful requests', async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({ data: 'success' })
        };
        fetch.mockResolvedValue(mockResponse);

        const response = await authFetch('http://test.com/api/test');
        
        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
    });

    test('should use empty strings when sessionStorage is empty', async () => {
        Storage.prototype.getItem = jest.fn(() => null);
        
        const mockResponse = {
            ok: true,
            json: jest.fn().mockResolvedValue({ data: 'test' })
        };
        fetch.mockResolvedValue(mockResponse);

        await authFetch('http://test.com/api/test');

        expect(fetch).toHaveBeenCalledWith('http://test.com/api/test', {
            headers: {
                'orgId': '',
                'username': '',
                'sessionId': '',
                'sessionExpiryTime': ''
            }
        });
    });
});
