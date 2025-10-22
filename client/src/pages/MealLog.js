import React, { useEffect, useState } from 'react';

function isoDate(d){ return new Date(d).toISOString().slice(0,10); }

export default function MealLog(){
  const [meals, setMeals] = useState([]);
  const [items, setItems] = useState([{ name: '', calories: '' }]);
  const [mealType, setMealType] = useState('breakfast');
  const [date, setDate] = useState(isoDate(Date.now()));
  const token = localStorage.getItem('token');

  async function fetchList() {
    try {
      const r = await fetch('/api/meal/list');
      const j = await r.json();
      setMeals(j);
    } catch (e) { console.error(e); }
  }
  useEffect(()=>{ fetchList(); }, []);

  const addItem = ()=> setItems(it => [...it, { name:'', calories:'' }]);
  const updateItem = (idx, field, val) => setItems(it => it.map((x,i)=> i===idx?({...x,[field]:val}):x));
  const submit = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch('/api/meal/add', { method:'POST', headers:{'Content-Type':'application/json', Authorization: token ? 'Bearer '+token : ''}, body: JSON.stringify({ date, mealType, items })});
      const j = await r.json();
      if (!r.ok) return alert(j.error || 'failed');
      alert('Saved');
      setItems([{ name:'', calories:'' }]);
      fetchList();
    } catch (e) { alert('Error'); console.error(e); }
  };

  return (
    <div className="card">
      <h2>Meal logging (90 days)</h2>
      <form onSubmit={submit}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <label>Date <input type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>
          <label>Meal <select value={mealType} onChange={e=>setMealType(e.target.value)}>
            <option>breakfast</option><option>lunch</option><option>dinner</option><option>snack</option>
          </select></label>
        </div>

        <div style={{marginTop:10}}>
          <h4>Items</h4>
          {items.map((it, idx) => (
            <div key={idx} style={{display:'flex',gap:8,alignItems:'center', marginBottom:6}}>
              <input placeholder="food name" value={it.name} onChange={e=>updateItem(idx,'name',e.target.value)} style={{flex:1}} />
              <input placeholder="cal" value={it.calories} onChange={e=>updateItem(idx,'calories',e.target.value)} style={{width:88}} />
            </div>
          ))}
          <div><button type="button" className="btn btn-ghost" onClick={addItem}>Add item</button></div>
        </div>

        <div style={{marginTop:10}}>
          <button className="btn btn-primary" type="submit">Save Meal</button>
        </div>
      </form>

      <hr/>
      <h3>Recent (last 90 days)</h3>
      <div style={{maxHeight:300, overflow:'auto'}}>
        {meals.length===0 && <div>No meals logged</div>}
        {meals.map(m => (
          <div key={m.id} className="card" style={{marginBottom:8}}>
            <div style={{display:'flex', justifyContent:'space-between'}}><div>{new Date(m.date).toLocaleString()}</div><div>{m.mealType}</div></div>
            <ul>
              {m.items.map((it,i)=>(<li key={i}>{it.name} {it.calories?('- '+it.calories+' cal'):''}</li>))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
