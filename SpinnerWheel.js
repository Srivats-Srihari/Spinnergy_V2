import React, { useState, useContext } from 'react';

export default function SpinnerWheel(){
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);

  const handleSpin = async () => {
    setSpinning(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/game/spin', {
        method: 'POST', headers: { 'Content-Type':'application/json', Authorization: token ? 'Bearer '+token : '' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Spin failed');
      setResult(data);
    } catch (e) {
      alert(e.message || e);
    } finally {
      setSpinning(false);
    }
  };

  return (
    <div>
      <div style={{width:220, height:220, borderRadius:220, border:'6px solid #ddd', display:'flex', alignItems:'center', justifyContent:'center', margin:'12px auto'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:22, fontWeight:700}}>Wheel</div>
          <div style={{fontSize:12, color:'#6b7280'}}>Spin to earn points</div>
        </div>
      </div>
      <div style={{textAlign:'center'}}>
        <button className="btn btn-primary" onClick={handleSpin} disabled={spinning}>{spinning ? 'Spinning...' : 'Spin'}</button>
        {result && <div style={{marginTop:12}}>You earned <strong>{result.points}</strong> pts — total {result.newScore}</div>}
      </div>
    </div>
  );
}
