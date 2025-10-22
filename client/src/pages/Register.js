import React, { useState } from 'react';
export default function RegisterPage() {
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const submit = async (e) => {
    e.preventDefault();
    const r = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password })});
    const j = await r.json();
    if (!r.ok) return alert(j.error || j.message || 'Register failed');
    localStorage.setItem('token', j.token);
    alert('Registered!');
    window.location.href = '/';
  };
  return (<div className="card"><h3>Register</h3><form onSubmit={submit}><div><label>Name<input value={name} onChange={e=>setName(e.target.value)} className="input" /></label></div><div><label>Email<input value={email} onChange={e=>setEmail(e.target.value)} className="input" /></label></div><div><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input" /></label></div><div><button className="btn btn-primary" type="submit">Register</button></div></form></div>);
}
