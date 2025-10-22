import React, { useEffect, useState } from "react";
import "../styles/App.css";

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then(setLeaders)
      .catch(() => console.error("Leaderboard fetch failed"));
  }, []);
  return (
    <div className="leaderboard">
      <h1>🏆 Top Players</h1>
      <table>
        <thead><tr><th>#</th><th>User</th><th>Energy Points</th></tr></thead>
        <tbody>
          {leaders.map((u, i) => (
            <tr key={i}><td>{i + 1}</td><td>{u.name}</td><td>{u.points}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default Leaderboard;
