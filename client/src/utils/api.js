// Helper to call backend API with base URL from env
const API_URL = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.replace(/\/$/, '')) || '';

export async function apiFetch(endpoint, options = {}) {
  const url = API_URL ? `${API_URL}${endpoint}` : endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const opts = Object.assign({ method: 'GET', headers: { 'Content-Type': 'application/json' } }, options);
  if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
  const res = await fetch(url, opts);
  const txt = await res.text();
  try {
    const json = JSON.parse(txt);
    if (!res.ok) throw new Error(json.message || 'API error');
    return json;
  } catch (e) {
    // If response is not JSON, return raw text for debugging
    if (!res.ok) throw new Error(txt || 'API error');
    return txt;
  }
}

export default apiFetch;