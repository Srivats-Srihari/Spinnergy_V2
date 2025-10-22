/**
 * server.js - patched by patch-fix-spinnergy.js
 * - Express server that serves the client/build static files
 * - Provides API endpoints for auth (simple placeholder), game (spin), nutrition proxy,
 *   and an OpenAI-powered food-only assistant (via axios POST to OpenAI)
 *
 * Important notes:
 *  - This file avoids ESM import/export compatibility issues by using CommonJS require.
 *  - It uses axios to call the OpenAI REST endpoints directly (no 'openai' package usage).
 *  - Ensure your .env contains the keys:
 *      OPENAI_API_KEY, NUTRITIONIX_APP_ID, NUTRITIONIX_APP_KEY
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();

// Basic middlewares
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// --- Simple in-memory user store (placeholder) ---
// You said you use Firebase in production; this is a safe fallback for local dev.
// Keep data ephemeral; replace with real DB or Firebase later.
const users = {}; // keyed by email
const sessions = {}; // token -> email

// Utility: create simple token (not crypto-grade)
function mkToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Auth endpoints (minimal, for compatibility)
 * - POST /api/auth/register { name, email, password, dietProfile? } -> { ok: true }
 * - POST /api/auth/login { email, password } -> { token, user }
 * - GET /api/auth/profile -> protected by ?token=...
 */
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, dietProfile } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: 'name,email,password required' });
    if (users[email]) return res.status(400).json({ message: 'User exists' });
    users[email] = {
      name,
      email,
      password: password, // for production, hash with bcrypt
      score: 0,
      history: [],
      dietProfile: dietProfile || null,
      createdAt: new Date().toISOString(),
    };
    return res.json({ ok: true, message: 'Registered' });
  } catch (err) {
    console.error('register err', err);
    return res.status(500).json({ message: 'register failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users[email];
    if (!user || user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = mkToken();
    sessions[token] = email;
    return res.json({ token, user: { name: user.name, email: user.email, score: user.score } });
  } catch (err) {
    return res.status(500).json({ message: 'login failed' });
  }
});

app.get('/api/auth/profile', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '') || req.query.token;
  if (!token || !sessions[token]) return res.status(401).json({ message: 'Not authorized' });
  const email = sessions[token];
  const user = users[email];
  return res.json({ name: user.name, email: user.email, score: user.score, dietProfile: user.dietProfile, history: user.history });
});

// --- Nutritionix proxy ---
// POST /api/nutrition { query: "2 idli" }
app.post('/api/nutrition', async (req, res) => {
  const Q = req.body && req.body.query;
  if (!Q) return res.status(400).json({ error: 'query required' });
  const APP_ID = process.env.NUTRITIONIX_APP_ID || '';
  const APP_KEY = process.env.NUTRITIONIX_APP_KEY || '';
  if (!APP_ID || !APP_KEY) {
    return res.status(500).json({ error: 'Nutritionix credentials not configured on server.' });
  }
  try {
    const response = await axios.post('https://trackapi.nutritionix.com/v2/natural/nutrients', { query: Q }, {
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': APP_ID,
        'x-app-key': APP_KEY
      },
      timeout: 10000
    });
    return res.json(response.data);
  } catch (err) {
    console.error('Nutritionix error', err && err.response && err.response.data ? err.response.data : err.message);
    return res.status(500).json({ error: 'Nutritionix API error', detail: err && err.response && err.response.data ? err.response.data : err.message });
  }
});

// --- OpenAI food-only assistant endpoint (server-side) ---
// POST /api/ai/chat { message: "I want a high-protein breakfast", token? }
// This endpoint will *only* allow food/nutrition/recipe/goal related prompts.
// We perform a conservative check that forbids non-food topics (basic safeguard).
app.post('/api/ai/chat', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) return res.status(500).json({ message: 'OPENAI_API_KEY not configured' });

    const userMessage = (req.body && req.body.message) ? String(req.body.message).trim() : '';
    if (!userMessage) return res.status(400).json({ message: 'message is required' });

    // Simple safety: only allow when message contains food-related keywords OR asks about recipes/nutrients
    const lower = userMessage.toLowerCase();
    const foodKeywords = ['food', 'recipe', 'recipes', 'calorie', 'calories', 'protein', 'carb', 'carbohydrate', 'fat', 'meal', 'breakfast', 'lunch', 'dinner', 'snack', 'nutrition', 'nutrient', 'diet', 'weight', 'lose weight', 'gain weight', 'ingredients', 'vitamin', 'iron', 'sodium', 'cholesterol', 'sugar', 'fiber', 'recipe ideas'];
    const allowed = foodKeywords.some(k => lower.includes(k)) || lower.includes('how to make') || lower.includes('how many calories') || lower.includes('macro');
    if (!allowed) {
      return res.status(400).json({ message: 'This assistant only answers food, nutrition and recipe related questions.' });
    }

    // Build prompt that constrains model to food domain
    const systemPrompt = "You are FoodBot, a helpful assistant that ONLY answers questions about food, nutrition, recipes, and healthy goals. If the user asks anything outside this domain, politely decline.";
    const payload = {
      model: "gpt-4o-mini", // change to your preferred model; fallback will be handled
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.7
    };

    // Call OpenAI REST Chat Completions (POST)
    const openAiRes = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    const aiText = openAiRes.data && openAiRes.data.choices && openAiRes.data.choices[0] && openAiRes.data.choices[0].message
      ? openAiRes.data.choices[0].message.content
      : '';

    // Save chat for 30 days? (simple in-memory store here; production should use DB)
    // We'll include optional save if token provided (associate with session)
    try {
      const token = (req.headers.authorization || '').replace('Bearer ', '') || req.query.token;
      if (token && sessions[token]) {
        const email = sessions[token];
        const u = users[email];
        if (!u.chats) u.chats = [];
        u.chats.push({ message: userMessage, reply: aiText, ts: new Date().toISOString() });
        // prune chats older than 30 days
        const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
        u.chats = u.chats.filter(c => new Date(c.ts).getTime() >= cutoff);
      }
    } catch (e) {
      console.warn('could not save chat', e.message);
    }

    return res.json({ reply: aiText });
  } catch (err) {
    console.error('AI chat error', err && err.response && err.response.data ? err.response.data : err.message);
    return res.status(500).json({ message: 'AI error', detail: err && err.response && err.response.data ? err.response.data : err.message });
  }
});

// --- Game endpoints: spin, leaderboard, history ---
// POST /api/game/spin  (protected: requires token in header or query param)
app.post('/api/game/spin', (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '') || req.query.token;
    if (!token || !sessions[token]) return res.status(401).json({ message: 'Not authorized' });
    const email = sessions[token];
    const user = users[email];
    if (!user) return res.status(400).json({ message: 'User not found' });

    const segments = [10, 20, 30, 40, 50, 100];
    const idx = Math.floor(Math.random() * segments.length);
    const points = segments[idx];
    user.score += points;
    user.history.push({ points, date: new Date().toISOString() });

    // compute landing rotation for front-end animation
    const degreesPer = 360 / segments.length;
    const landingRotation = 360 * 5 + idx * degreesPer + degreesPer / 2;

    return res.json({ value: points, newScore: user.score, landingRotation });
  } catch (err) {
    return res.status(500).json({ message: 'spin error' });
  }
});

app.get('/api/game/leaderboard', (req, res) => {
  try {
    const arr = Object.values(users).map(u => ({ name: u.name, email: u.email, score: u.score || 0 }));
    const top = arr.sort((a,b) => (b.score||0) - (a.score||0)).slice(0, 20);
    return res.json(top);
  } catch (err) {
    return res.status(500).json({ message: 'leaderboard error' });
  }
});

app.get('/api/game/history', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '') || req.query.token;
  if (!token || !sessions[token]) return res.status(401).json({ message: 'Not authorized' });
  const email = sessions[token];
  const user = users[email];
  return res.json(user.history || []);
});

// --- Microbit / device import endpoint ---
// POST /api/device/import-energy { email, points }  -- for sending microbit-collected energy
// In production, this should be authenticated and idempotent.
app.post('/api/device/import-energy', (req, res) => {
  try {
    const { email, points } = req.body;
    if (!email || typeof points !== 'number') return res.status(400).json({ message: 'email & points required' });
    const user = users[email];
    if (!user) return res.status(404).json({ message: 'user not found' });
    user.score += points;
    user.history.push({ points, date: new Date().toISOString(), source: 'microbit' });
    return res.json({ ok: true, newScore: user.score });
  } catch (err) {
    return res.status(500).json({ message: 'device import error' });
  }
});

// --- Serve client/build static files (after all /api/* routes) ---
// This must be AFTER API routes to avoid path-to-regexp wildcard issues.
const clientBuildPath = path.join(__dirname, 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
  console.log('Serving frontend from', clientBuildPath);
  app.use(express.static(clientBuildPath));

  // Always serve index.html for other routes (SPA)
  app.get('*', (req, res) => {
    const indexHtml = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(indexHtml)) {
      return res.sendFile(indexHtml);
    } else {
      return res.status(404).send('index.html not found - build the client');
    }
  });
} else {
  console.warn('client/build not found — serve instructions: build the react app (cd client && npm run build)');
  // If client not built, expose a small page to help debugging
  app.get('/', (req, res) => {
    res.send('<h2>Spinnergy server running — client not built. Run <code>cd client && npm install && npm run build</code></h2>');
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error', err && err.stack ? err.stack : err);
  res.status(500).json({ message: 'Server error' });
});

// Start
app.listen(PORT, () => {
  console.log('Spinnergy server listening on', PORT);
});
