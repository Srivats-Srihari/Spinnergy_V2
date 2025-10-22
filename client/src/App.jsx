
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Nutrition from './pages/Nutrition';
import NutritionSearch from './pages/NutritionSearch';
import MealLogger from './pages/MealLogger';
import Leaderboards from './pages/Leaderboards';
import Minigames from './pages/Minigames';
import MicrobitSim from './pages/MicrobitSim';
import Chatbot from './pages/Chatbot';
import './styles/App.css';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [showBot, setShowBot] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Navbar user={user} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/nutrition" element={user ? <Nutrition /> : <Navigate to="/login" />} />
          <Route path="/nutrition-search" element={user ? <NutritionSearch /> : <Navigate to="/login" />} />
          <Route path="/meal-logger" element={user ? <MealLogger /> : <Navigate to="/login" />} />
          <Route path="/leaderboards" element={user ? <Leaderboards /> : <Navigate to="/login" />} />
          <Route path="/minigames" element={user ? <Minigames /> : <Navigate to="/login" />} />
          <Route path="/microbit" element={user ? <MicrobitSim /> : <Navigate to="/login" />} />
        </Routes>
        <button
          className="chatbot-toggle"
          onClick={() => setShowBot(!showBot)}>
          🍳
        </button>
        {showBot && <Chatbot onClose={() => setShowBot(false)} />}
      </div>
    </Router>
  );
}
