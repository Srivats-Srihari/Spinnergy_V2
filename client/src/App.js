import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css';
import './ui.css';
import Navbar from './components/Navbar';
import SpinnerWheel from './components/SpinnerWheel';
import Leaderboard from './components/Leaderboard';
import MealLog from './pages/MealLog';
import FoodInfo from './pages/FoodInfo';
import Minigames from './pages/Minigames';
import MicrobitSim from './pages/MicrobitSim';
import LeaderboardsAdvanced from './pages/LeaderboardsAdvanced';
import ChatWidget from './components/ChatWidget';

export default function App(){
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <div style={{display:'flex', gap:12}}>
          <div style={{flex:1}}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/meals" element={<MealLog />} />
              <Route path="/food" element={<FoodInfo />} />
              <Route path="/minigames" element={<Minigames />} />
              <Route path="/microbit" element={<MicrobitSim />} />
              <Route path="/leaderboards" element={<LeaderboardsAdvanced />} />
            </Routes>
          </div>
          <div style={{width:320}}>
            <div className="card" style={{marginBottom:12}}>
              <h4>Quick Wheel</h4>
              <SpinnerWheel />
            </div>
            <div className="card">
              <h4>Leaderboard</h4>
              <Leaderboard />
            </div>
          </div>
        </div>
        <ChatWidget />
      </div>
    </BrowserRouter>
  );
}

function Home(){
  return (
    <div>
      <div className="card">
        <h1>Welcome to Spinnergy</h1>
        <p>Earn energy points by logging meals, syncing your micro:bit, and playing healthy minigames.</p>
        <div style={{display:'flex',gap:8}}>
          <Link to="/food" className="btn btn-ghost">Food Search</Link>
          <Link to="/meals" className="btn btn-ghost">Meal Log</Link>
          <Link to="/microbit" className="btn btn-ghost">Micro:bit</Link>
          <Link to="/minigames" className="btn btn-primary">Play Minigames</Link>
        </div>
      </div>
      <div style={{height:12}}/>
    </div>
  );
}
