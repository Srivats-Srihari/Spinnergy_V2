import React, { useState, useEffect } from "react";
import "../styles/App.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/foodbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages([...newMessages, { sender: "bot", text: data.reply }]);
    } catch {
      setMessages([...newMessages, { sender: "bot", text: "⚠️ AI unavailable." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-page">
      <h1>🍽️ Ask Spinnergy AI</h1>
      <div className="chatbox">
        {messages.map((m, i) => (
          <div key={i} className={m.sender === "user" ? "msg-user" : "msg-bot"}>
            {m.text}
          </div>
        ))}
        {loading && <p className="loading">Thinking...</p>}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          placeholder="Ask about recipes or nutrition..."
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot;
