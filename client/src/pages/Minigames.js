import React, { useState } from 'react';

function spend(points) {
  const token = localStorage.getItem('token');
  return fetch('/api/game/spend', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: token ? 'Bearer '+token : '' }, body: JSON.stringify({ points, reason:'minigame' })});
}

export default function Minigames(){
  const [status, setStatus] = useState('');
  const play = async (cost) => {
    setStatus('Playing...');
    try {
      const r = await spend(cost);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'spend failed');
      setStatus('You played and spent ' + cost + ' pts. New score: ' + j.newScore);
    } catch (e) {
      setStatus('Error: ' + (e.message || e));
    }
  };

  return (
    <div className="card">
      <h2>Healthy Minigames</h2>
      <p>Spend energy points to play short, health-oriented microgames.</p>
      <div style={{display:'grid', gap:8}}>
        <div className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <h4>Balance Challenge</h4>
            <div>Stand on one leg for 30s (simulated)</div>
          </div>
          <div><button className="btn btn-primary" onClick={()=>play(5)}>Play (5 pts)</button></div>
        </div>

        <div className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <h4>Quick Yoga</h4>
            <div>Do a 1-minute breathing exercise (simulated)</div>
          </div>
          <div><button className="btn btn-primary" onClick={()=>play(8)}>Play (8 pts)</button></div>
        </div>
      </div>
      <div style={{marginTop:8}}>{status}</div>
    </div>
  );
}
