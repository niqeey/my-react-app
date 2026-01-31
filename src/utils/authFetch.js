export function authFetch(url, options = {}) {
    const authHeaders = {
        'orgId': sessionStorage.getItem('orgId') || '',
        'username': sessionStorage.getItem('username') || '',
        'sessionId': sessionStorage.getItem('sessionId') || '',
        'sessionExpiryTime': sessionStorage.getItem('sessionExpiryTime') || ''
    };
    
    options.headers = { ...(options.headers || {}), ...authHeaders };
    
    return fetch(url, options)
        .then(response => {
            // Handle 401 Unauthorized responses
            if (response.status === 401) {
                // Clear session storage
                sessionStorage.clear();
                
                // Parse error message if available
                return response.json()
                    .then(data => {
                        if (data.requireLogin) {
                            // Redirect to login page
                            window.location.href = '/login';
                        }
                        throw new Error(data.error || 'Unauthorized access');
                    })
                    .catch(err => {
                        // If response is not JSON, still redirect
                        window.location.href = '/login';
                        throw new Error('Session expired. Please login again.');
                    });
            }
            
            // Handle other error status codes
            if (!response.ok && response.status !== 401) {
                return response.json()
                    .then(data => {
                        throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
                    })
                    .catch(err => {
                        if (err.message) throw err;
                        throw new Error(`Request failed with status ${response.status}`);
                    });
            }
            
            return response;
        });
}
