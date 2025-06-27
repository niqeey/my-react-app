export function authFetch(url, options = {}) {
    const authHeaders = {
        'orgId': sessionStorage.getItem('orgId') || '',
        'username': sessionStorage.getItem('username') || '',
        'sessionId': sessionStorage.getItem('sessionId') || '',
        'sessionExpiryTime': sessionStorage.getItem('sessionExpiryTime') || ''
    };
    options.headers = { ...(options.headers || {}), ...authHeaders };
    return fetch(url, options);
}