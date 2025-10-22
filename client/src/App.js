import React, { useEffect, useState } from 'react';
import SpinnerWheel from './components/SpinnerWheel';
import Leaderboard from './components/Leaderboard';
import NutritionSearch from './components/NutritionSearch';

function App() {
  const [view, setView] = useState('home');

  useEffect(() => {
    // quick client-side logging to detect blank UI
    console.log('App mounted - view', view);
  }, [view]);

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand">Spinnergy</div>
        <nav className="nav">
          <button onClick={() => setView('home')}>Home</button>
          <button onClick={() => setView('search')}>Food Search</button>
          <button onClick={() => setView('leaderboard')}>Leaderboards</button>
          <button onClick={() => setView('spin')}>Spin</button>
        </nav>
      </header>

      <main className="main">
        {view === 'home' && (
          <>
            <h1>Welcome to Spinnergy</h1>
            <p>Earn energy by being active, track meals, and spend points on mini-games.</p>
            <NutritionSearch />
            <Leaderboard />
          </>
        )}
        {view === 'search' && <NutritionSearch />}
        {view === 'leaderboard' && <Leaderboard />}
        {view === 'spin' && <SpinnerWheel />}
      </main>

      <footer className="footer">
        <small>Spinnergy — experimental demo</small>
      </footer>
    </div>
  );
}

export default App;
