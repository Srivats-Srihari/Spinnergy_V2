import React, { useState } from 'react';
import FoodSearch from '../components/FoodSearch';

export default function FoodInfo(){
  const [detail, setDetail] = useState(null);
  const handleSelect = (s) => {
    setDetail(s);
  };
  return (
    <div className="card">
      <h2>Search Food</h2>
      <FoodSearch onSelect={handleSelect}/>
      <div style={{marginTop:12}}>
        {detail ? (
          <div>
            <h3>{detail.name}</h3>
            <p>Calories: {detail.calories || 'N/A'}</p>
            <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(detail.raw || detail, null, 2)}</pre>
          </div>
        ) : <div>Pick a food from suggestions above to see details.</div>}
      </div>
    </div>
  );
}
