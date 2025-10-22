import React, { useEffect, useState } from 'react';
import apiFetch from '../utils/api';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  async function load() {
    try {
      const data = await apiFetch('/api/game/leaderboard');
      setLeaders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('leaderboard fetch', e);
    }
  }
  useEffect(() => { load(); const iv = setInterval(load, 8000); return () => clearInterval(iv); }, []);
  return (
    <div className="card">
      <h3>Leaderboard (Top)</h3>
      <ol>
        {leaders.map((u, i) => <li key={u.email}>{u.name} — {u.score} pts</li>)}
      </ol>
    </div>
  );
}