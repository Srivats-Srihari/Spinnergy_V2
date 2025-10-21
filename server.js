/**
 * server.js - single-file express server (Part1)
 *
 * - Serves static client from ./public
 * - Provides API: /api/food (Nutritionix proxy), /api/game (spin simulation),
 *   /api/auth (simple lowdb user store for dev), /api/chat (proxy to OpenAI via axios)
 *
 * NOTE:
 * - This file uses Axios for external calls to avoid import mismatch problems with openai SDK versions.
 * - Replace lowdb with Mongo/Mongoose in Part2 for production persistence.
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Low, JSONFile } = require('lowdb');

dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();

// Simple lowdb setup (development only)
const dbFile = path.join(__dirname, 'data.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

async function initDb() {
  await db.read();
  db.data = db.data || { users: [], chats: [], leaderboard: [] };
  await db.write();
}
initDb().catch(console.error);

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '200kb' }));

// Static serve client
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Simple auth helpers (dev)
function issueToken(user) {
  const payload = { id: user.id, email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev_jwt_secret', { expiresIn: '2h' });
}
async function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'Missing token' });
  const token = h.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
    await db.read();
    const user = db.data.users.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ error: 'Invalid token user' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/* ---------- Authentication (dev) ---------- */
// POST /api/auth/register  { name, email, password, dietPrefs (optional) }
app.post('/api/auth/register', async (req, res) => {
  await db.read();
  const { name, email, password, dietPrefs } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  if (db.data.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const id = 'u_' + Date.now();
  const user = { id, name, email, password: hashed, score: 0, dietPrefs: dietPrefs || null, createdAt: Date.now(), history: [] };
  db.data.users.push(user);
  await db.write();
  const token = issueToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, score: user.score, dietPrefs: user.dietPrefs }});
});

// POST /api/auth/login { email, password }
app.post('/api/auth/login', async (req, res) => {
  await db.read();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = db.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = issueToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, score: user.score, dietPrefs: user.dietPrefs }});
});

// GET /api/auth/profile
app.get('/api/auth/profile', requireAuth, async (req, res) => {
  const user = req.user;
  res.json({ id: user.id, name: user.name, email: user.email, score: user.score, dietPrefs: user.dietPrefs, history: user.history || [] });
});

/* ---------- Food API (Nutritionix proxy) ----------
POST /api/food/search { query: "2 idli" }
*/
app.post('/api/food/search', async (req, res) => {
  const q = req.body && req.body.query;
  if (!q) return res.status(400).json({ error: 'query required' });

  const APP_ID = process.env.NUTRITIONIX_APP_ID || '';
  const APP_KEY = process.env.NUTRITIONIX_APP_KEY || '';
  if (!APP_ID || !APP_KEY) {
    return res.status(500).json({ error: 'Nutritionix not configured (set NUTRITIONIX_APP_ID & NUTRITIONIX_APP_KEY)'});
  }

  try {
    const r = await axios.post('https://trackapi.nutritionix.com/v2/natural/nutrients', { query: q }, {
      headers: {
        'x-app-id': APP_ID,
        'x-app-key': APP_KEY,
        'Content-Type': 'application/json'
      }
    });
    res.json(r.data);
  } catch (err) {
    console.error('Nutritionix error', err?.response?.data || err.message);
    res.status(500).json({ error: 'Nutritionix API error', detail: err?.response?.data || err.message });
  }
});

/* ---------- OpenAI food-only chat proxy ----------
POST /api/chat { message }
- Server ensures prompt enforces food-only domain.
- Uses axios to call OpenAI REST completions (text-davinci-003 / gpt-3.5-turbo if you configure)
*/
app.post('/api/chat', requireAuth, async (req, res) => {
  const message = (req.body && req.body.message) || '';
  if (!message) return res.status(400).json({ error: 'message required' });

  const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
  if (!OPENAI_KEY) return res.status(500).json({ error: 'OpenAI key not configured' });

  // Build a restricted system prompt so the assistant only talks about food, recipes, nutrition, and goals
  const systemPrompt = "You are FoodGPT — you only answer questions about food, nutrition, meals, recipes and diet goals. If the user asks for anything else, politely refuse and steer back to food topics.";

  try {
    // NOTE: Use the Chat Completions endpoint (gpt-3.5-turbo if available). Use axios to call OpenAI API.
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 400,
      temperature: 0.7
    };

    const r = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' }
    });

    const assistant = r.data.choices && r.data.choices[0] && r.data.choices[0].message && r.data.choices[0].message.content;
    // Save chat for 30 days in lowdb (timestamped)
    await db.read();
    db.data.chats = db.data.chats || [];
    db.data.chats.push({ id: 'c_' + Date.now(), userId: req.user.id, prompt: message, reply: assistant, createdAt: Date.now() });
    await db.write();
    res.json({ reply: assistant });
  } catch (err) {
    console.error('OpenAI error', err?.response?.data || err.message);
    res.status(500).json({ error: 'OpenAI error', detail: err?.response?.data || err.message });
  }
});

/* ---------- Game API (simulate energy points / spin) ---------- */
// POST /api/game/spin (protected) -> returns points and updated score
app.post('/api/game/spin', requireAuth, async (req, res) => {
  // simple segments
  const segments = [10,20,30,40,50,100];
  const idx = Math.floor(Math.random() * segments.length);
  const pts = segments[idx];

  await db.read();
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(400).json({ error: 'User not found' });
  user.score = (user.score || 0) + pts;
  user.history = user.history || [];
  user.history.push({ type: 'spin', points: pts, ts: Date.now() });
  // Update leaderboard
  db.data.leaderboard = db.data.leaderboard || [];
  const lbEntry = db.data.leaderboard.find(e => e.id === user.id);
  if (lbEntry) lbEntry.score = user.score;
  else db.data.leaderboard.push({ id: user.id, name: user.name, score: user.score });
  await db.write();

  // rotation degrees to animate the wheel on client (for fun)
  const degreesPer = 360 / segments.length;
  const landingRotation = 360 * 4 + idx * degreesPer + degreesPer / 2;

  res.json({ points: pts, newScore: user.score, landingRotation });
});

// GET /api/game/leaderboard
app.get('/api/game/leaderboard', async (req, res) => {
  await db.read();
  const lb = (db.data.leaderboard || []).slice().sort((a,b) => b.score - a.score).slice(0, 50);
  res.json(lb);
});

// GET /api/chat/history (user's chats, last 30 days)
app.get('/api/chat/history', requireAuth, async (req, res) => {
  await db.read();
  const thirtyDays = Date.now() - 30 * 24 * 3600 * 1000;
  const entries = (db.data.chats || []).filter(c => c.userId === req.user.id && c.createdAt >= thirtyDays);
  res.json(entries);
});

/* ---------- Fallback: serve index.html for any unknown GET (client-side routing).
   Avoid using app.route('*') which caused path-to-regexp errors on some setups.
*/
app.get(/.*/, (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  return res.status(200).send('Spinnergy server running — client not built. Run npm run build-client && npm run build-and-copy');
});

// Start
app.listen(PORT, () => {
  console.log('Spinnergy server running on port', PORT);
});
