
import React, { useState } from "react";
import "./ChatBot.css";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  async function sendMessage() {
    if (!input.trim()) return;
    const msg = input;
    setMessages([...messages, { sender: "user", text: msg }]);
    setInput("");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });
    const data = await res.json();
    setMessages(m => [...m, { sender: "ai", text: data.reply }]);
  }

  return (
    <>
      <button className="chat-toggle" onClick={() => setOpen(!open)}>
        💬 Chat
      </button>
      {open && (
        <div className="chatbox">
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.sender}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about food or nutrition..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
