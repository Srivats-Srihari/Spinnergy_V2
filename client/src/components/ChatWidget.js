import React, { useEffect, useState } from 'react';

export default function ChatWidget(){
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(()=> {
    // fetch recent chat history
    async function load(){
      if (!token) return;
      const r = await fetch('/api/chat/history', { headers:{ Authorization: 'Bearer ' + token }});
      if (!r.ok) return;
      const j = await r.json();
      setMsgs((j||[]).map(c=>({role:'assistant',text:c.reply, ts:c.createdAt})).reverse());
    }
    load();
  }, []);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMsgs(m=>[...m, { role:'user', text: userMsg, ts: Date.now() }]);
    setInput('');
    try {
      const r = await fetch('/api/chat', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: token ? 'Bearer '+token : '' }, body: JSON.stringify({ message: userMsg }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Chat failed');
      setMsgs(m=>[...m, { role:'assistant', text: j.reply, ts: Date.now() }]);
    } catch (e) {
      setMsgs(m=>[...m, { role:'assistant', text: 'Sorry — chat failed (server).', ts: Date.now() }]);
    }
  };

  return (
    <>
      <div className="chat-launch" onClick={()=>setOpen(true)}>💬</div>
      {open && (
        <div style={{position:'fixed', right:18, bottom:84, width:360, height:520, boxShadow:'0 10px 40px rgba(2,6,23,0.2)'}} className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontWeight:700}}>Food Chat</div>
            <div style={{display:'flex', gap:8}}>
              <button className="btn btn-ghost" onClick={()=>{ setOpen(false); }}>Close</button>
            </div>
          </div>
          <div style={{marginTop:8, height:420, overflow:'auto', display:'flex', flexDirection:'column', gap:8}}>
            {msgs.map((m, i) => (
              <div key={i} style={{alignSelf: m.role==='user' ? 'flex-end' : 'flex-start', background: m.role==='user' ? '#dcfce7' : '#f1f5f9', padding:8, borderRadius:8, maxWidth:'86%'}}>
                {m.text}
              </div>
            ))}
          </div>
          <div style={{display:'flex', gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} style={{flex:1}} placeholder="Ask about recipes, nutrition..." />
            <button className="btn btn-primary" onClick={send}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
