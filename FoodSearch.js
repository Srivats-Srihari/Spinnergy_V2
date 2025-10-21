import React, { useEffect, useState, useRef } from 'react';

function useDebounce(value, ms=300){
  const [v,setV] = useState(value);
  useEffect(()=> {
    const t = setTimeout(()=> setV(value), ms);
    return ()=>clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function FoodSearch({ onSelect }) {
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 350);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=> {
    if (!dq || dq.length < 2) return setSuggestions([]);
    setLoading(true);
    let cancelled=false;
    fetch('/api/food/autocomplete?q=' + encodeURIComponent(dq)).then(r=>r.json()).then(j=>{
      if (cancelled) return;
      setSuggestions(j || []);
    }).catch(e=> {
      console.error(e);
      setSuggestions([]);
    }).finally(()=>setLoading(false));
    return ()=>{ cancelled=true; };
  }, [dq]);

  return (
    <div style={{position:'relative'}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search food, e.g. 2 idli" style={{width:'100%', padding:8}} />
      {loading && <div style={{position:'absolute',right:6,top:8}}>...</div>}
      {suggestions && suggestions.length>0 && (
        <div className="card" style={{position:'absolute', top:42, left:0, right:0, zIndex:30, maxHeight:260, overflow:'auto'}}>
          {suggestions.map((s,idx)=>(
            <div key={s.id || idx} style={{padding:8, display:'flex', justifyContent:'space-between', cursor:'pointer'}} onClick={()=>{ onSelect && onSelect(s); setQ(''); setSuggestions([]); }}>
              <div>{s.name}</div>
              <div style={{color:'#6b7280'}}>{s.calories ? s.calories+' cal' : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
