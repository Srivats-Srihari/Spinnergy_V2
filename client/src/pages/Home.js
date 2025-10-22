import React from "react";
import { Link } from "react-router-dom";
import "../styles/App.css";

const Home = () => (
  <div className="home-container">
    <h1>🍽️ Welcome to Spinnergy</h1>
    <p>Plan meals, spin ideas, and track calories all in one place.</p>

    <div className="home-buttons">
      <Link to="/wheel"><button>🎡 Spin a Meal</button></Link>
      <Link to="/nutrition"><button>🥗 Nutrition</button></Link>
      <Link to="/leaderboard"><button>🏆 Leaderboard</button></Link>
    </div>
  </div>
);

export default Home;
