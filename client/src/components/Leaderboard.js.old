import React, { useEffect, useState } from 'react';
export default function Leaderboard(){
  const [list, setList] = useState([]);
  useEffect(()=> {
    async function fetchLB(){
      try {
        const r = await fetch('/api/game/leaderboard');
        const j = await r.json();
        setList(j || []);
      } catch (e) { console.error(e); }
    }
    fetchLB();
    const iv = setInterval(fetchLB, 5000);
    return ()=>clearInterval(iv);
  },[]);
  return (
    <div className="card" style={{marginTop:14}}>
      <h3>Leaderboards</h3>
      <ul style={{listStyle:'none', padding:0}}>
        {list.map((u, idx) => (
          <li key={u.id || idx} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(15,23,42,0.04)'}}>
            <div>{idx+1}. {u.name}</div>
            <div style={{fontWeight:700}}>{u.score}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
