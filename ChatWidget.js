import React, { useState } from "react";
import axios from "axios";
import "./ChatWidget.css";

export default function ChatWidget({ user }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  async function sendMsg() {
    if (!input) return;
    const msg = input;
    setInput("");
    setMessages([...messages, { sender: "user", text: msg }]);
    const res = await axios.post("/api/chat", { message: msg, userId: user?._id });
    setMessages(m => [...m, { sender: "ai", text: res.data.reply }]);
  }

  return (
    <div className="chat-widget">
      <button className="chat-btn" onClick={() => setOpen(!open)}>💬</button>
      {open && (
        <div className="chat-box">
          <div className="chat-messages">
            {messages.map((m, i) => (
              <p key={i} className={m.sender === "user" ? "user-msg" : "ai-msg"}>{m.text}</p>
            ))}
          </div>
          <div className="chat-input">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about food..." />
            <button onClick={sendMsg}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

