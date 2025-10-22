
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar({ user }) {
  return (
    <nav className="navbar">
      <div className="logo">🥗 Spinnergy</div>
      <div className="links">
        <Link to="/">Home</Link>
        {user && (
          <>
            <Link to="/nutrition">Nutrition</Link>
            <Link to="/meal-logger">Meals</Link>
            <Link to="/leaderboards">Leaderboards</Link>
            <Link to="/minigames">Games</Link>
            <Link to="/microbit">Microbit</Link>
          </>
        )}
        {!user && <Link to="/login">Login</Link>}
      </div>
    </nav>
  );
}
