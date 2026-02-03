const isProd = process.env.NODE_ENV === 'production';
const envApiBase = process.env.REACT_APP_API_BASE;
const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';

let apiBase = isProd
  ? (envApiBase || 'https://api.mypacetracker.com')
  : (envApiBase || 'http://localhost:8080');

if (isProd && apiBase.includes('localhost')) {
  apiBase = browserOrigin || apiBase;
}

export default apiBase;