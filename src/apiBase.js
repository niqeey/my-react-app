const apiBase =
  process.env.NODE_ENV === 'production'
    ? 'https://api.mypacetracker.com'
    : '';

export default apiBase;