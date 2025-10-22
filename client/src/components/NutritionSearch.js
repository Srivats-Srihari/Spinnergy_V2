import React, { useState } from 'react';
import apiFetch from '../utils/api';

export default function NutritionSearch() {
  const [q, setQ] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!q) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await apiFetch('/api/nutrition', { method: 'POST', body: { query: q } });
      setResult(res);
    } catch (err) {
      alert('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3>Food Search</h3>
      <form onSubmit={handleSearch}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="e.g., 2 idli" style={{padding:'8px', width:'60%'}} />
        <button style={{marginLeft:8}} disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
      </form>

      {result && <pre style={{whiteSpace:'pre-wrap', marginTop:12, fontSize:13}}>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}