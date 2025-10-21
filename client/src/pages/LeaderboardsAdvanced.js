import React, { useEffect, useState } from 'react';

export default function LeaderboardsAdvanced(){
  const [leaders, setLeaders] = useState([]);
  useEffect(()=> {
    async function load(){ const r = await fetch('/api/game/leaderboard'); const j = await r.json(); setLeaders(j); }
    load();
  }, []);

  // Different leaderboard presentations
  return (
    <div className="card">
      <h2>Leaderboards</h2>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div>
          <h4>Top overall</h4>
          <ol>
            {leaders.slice(0,10).map(u=> <li key={u.id}>{u.name} — {u.score}</li>)}
          </ol>
        </div>
        <div>
          <h4>Friendly leaderboard (rounded)</h4>
          <ol>
            {leaders.slice(0,10).map(u=> <li key={u.id}>{u.name} — {Math.round(u.score)}</li>)}
          </ol>
        </div>
      </div>
    </div>
  );
}
