import React, { useState } from 'react';

export default function MicrobitSim(){
  const [readings, setReadings] = useState([]);
  const [deviceId, setDeviceId] = useState('demo-device-1');
  const token = localStorage.getItem('token');

  const addReading = () => {
    setReadings(r => [...r, { energy: Number((Math.random()*2+0.1).toFixed(2)), ts: Date.now() }]);
  };

  const send = async () => {
    try {
      const r = await fetch('/api/microbit/sync', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: token ? 'Bearer '+token : ''}, body: JSON.stringify({ deviceId, readings })});
      const j = await r.json();
      if (!r.ok) return alert(j.error || 'sync failed');
      alert('Synced: ' + j.points + ' pts received. New total: ' + j.newScore);
      setReadings([]);
    } catch (e) { alert('Error'); console.error(e); }
  };

  return (
    <div className="card">
      <h2>Micro:bit sync simulator</h2>
      <p>Use this screen to simulate a micro:bit sending energy readings. In real hardware you would POST the readings to /api/microbit/sync.</p>
      <div style={{display:'flex', gap:8}}>
        <input value={deviceId} onChange={e=>setDeviceId(e.target.value)} />
        <button className="btn btn-ghost" onClick={addReading}>Add reading</button>
        <button className="btn btn-primary" onClick={send}>Send to server</button>
      </div>
      <ul>
        {readings.map((r,idx)=>(<li key={idx}>{r.energy} J — {new Date(r.ts).toLocaleTimeString()}</li>))}
      </ul>
    </div>
  );
}
