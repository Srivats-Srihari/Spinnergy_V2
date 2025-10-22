
import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import ChatBot from "./widgets/ChatBot";
import NutritionSearch from "./pages/NutritionSearch";
import MealLogger from "./pages/MealLogger";
import { useAuth } from "./context/AuthContext";
import "./ui.css";

export default function App() {
  const { user } = useAuth();

  return (
    <div className="App">
      <nav className="navbar">
        <h1 className="logo">⚡ Spinnergy</h1>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/nutrition">Nutrition</Link></li>
          <li><Link to="/meals">Meal Log</Link></li>
          <li><Link to="/leaderboard">Leaderboard</Link></li>
          <li>{user ? <Link to="/">Logout</Link> : <Link to="/login">Login</Link>}</li>
        </ul>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/nutrition" element={<NutritionSearch />} />
          <Route path="/meals" element={<MealLogger />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </main>
      <ChatBot />
    </div>
  );
}
