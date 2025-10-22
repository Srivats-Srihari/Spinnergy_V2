import React, { useState } from 'react';
export default function LoginPage() {
  const [email,setEmail] = useState(''); const [password,setPassword]=useState('');
  const submit = async (e) => {
    e.preventDefault();
    const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password })});
    const j = await r.json();
    if (!r.ok) return alert(j.error || j.message || 'Login failed');
    localStorage.setItem('token', j.token);
    alert('Login ok');
    window.location.href = '/';
  };
  return (<div className="card"><h3>Login</h3><form onSubmit={submit}><div><label>Email<input value={email} onChange={e=>setEmail(e.target.value)} className="input" /></label></div><div><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input" /></label></div><div><button className="btn btn-primary" type="submit">Login</button></div></form></div>);
}
