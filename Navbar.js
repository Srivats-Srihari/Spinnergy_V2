import React from 'react';
export default function Navbar(){
  return (
    <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:12}}>
      <div style={{fontWeight:700, color:'#075985'}}>Spinnergy</div>
      <div style={{display:'flex', gap:8}}>
        <a className="btn btn-ghost" href="#/login">Login</a>
        <a className="btn btn-ghost" href="#/register">Register</a>
      </div>
    </nav>
  );
}
