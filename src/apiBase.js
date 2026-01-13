const apiBase =
  process.env.NODE_ENV === 'production'
    ? 'https://api.mypacetracker.com'
    : 'http://localhost:8080';

export default apiBase;