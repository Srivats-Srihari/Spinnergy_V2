import React, { useState } from 'react';
import apiFetch from '../utils/api';

export default function SpinnerWheel() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSpin() {
    setSpinning(true);
    setResult(null);
    try {
      // call backend spin (backend will check session/token)
      const res = await apiFetch('/api/game/spin', { method: 'POST' });
      setResult(res);
    } catch (e) {
      alert('Spin failed: ' + e.message);
    } finally {
      setSpinning(false);
    }
  }

  return (
    <div className="card">
      <h3>Spin the Wheel</h3>
      <p>Earn energy points by spinning (demo).</p>
      <button onClick={handleSpin} disabled={spinning} style={{padding:'10px 14px',borderRadius:10}}>
        {spinning ? 'Spinning...' : 'Spin'}
      </button>
      {result && <div style={{marginTop:12}}>You won <strong>{result.value} pts</strong> — new score: {result.newScore}</div>}
    </div>
  );
}