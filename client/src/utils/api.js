// client/src/utils/api.js
// Supplies a base API function the app can use. Uses REACT_APP_API_URL from env (set in build/deploy).
const API_URL = process.env.REACT_APP_API_URL || (window && window.__API_URL__) || 'http://localhost:5000/api';

export async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  // try parse JSON, but be robust to HTML error pages (avoid Unexpected token '<')
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.message || (data.error || 'API error'));
    return data;
  } catch (err) {
    // If parsing failed, include the text in the error for easier debugging.
    const msg = text && text.trim().startsWith('<') ? 'Server returned HTML. Check server or API_URL.' : err.message;
    throw new Error(msg + ' | Raw response: ' + text.slice(0, 1000));
  }
}
