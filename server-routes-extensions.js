/**
 * server-routes-extensions.js
 *
 * Export a function that accepts (app, db, requireAuth) and wires extra endpoints.
 * This keeps server.js small. Part1 server.js can require and call this module.
 */
const express = require('express');
const { clampTo90Days, nutritionixAutocomplete } = require('./server-helpers');
const fs = require('fs');
const path = require('path');

module.exports = function wireExtensions(app, db, requireAuth) {
  const router = express.Router();

  // Add meal logging: users can add meals, view last 90 days
  // POST /api/meal/add
  router.post('/meal/add', requireAuth, async (req, res) => {
    await db.read();
    const user = db.data.users.find(u => u.id === req.user.id);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const { date, mealType, items, notes } = req.body;
    const ts = date ? Date.parse(date) : Date.now();
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items required' });
    }

    user.meals = user.meals || [];
    user.meals.push({ id: 'm_' + Date.now(), date: ts, mealType: mealType || 'other', items, notes: notes || '' });
    // Optionally compute calories sum if items have calories
    let totalCals = 0;
    for (const it of items) { if (it.calories) totalCals += Number(it.calories) || 0; }
    await db.write();
    res.json({ ok: true, totalCals });
  });

  // GET /api/meal/list?from=&to=
  router.get('/meal/list', requireAuth, async (req, res) => {
    await db.read();
    const { from: fromISO, to: toISO } = req.query;
    const { from, to } = clampTo90Days(fromISO, toISO);
    const user = db.data.users.find(u => u.id === req.user.id);
    if (!user) return res.json([]);
    const meals = (user.meals || []).filter(m => m.date >= from && m.date <= to).sort((a,b) => b.date - a.date);
    res.json(meals);
  });

  // Food autocomplete proxy
  router.get('/food/autocomplete', async (req, res) => {
    const q = req.query.q || '';
    const APP_ID = process.env.NUTRITIONIX_APP_ID || '';
    const APP_KEY = process.env.NUTRITIONIX_APP_KEY || '';
    try {
      const suggestions = await nutritionixAutocomplete(q, APP_ID, APP_KEY);
      res.json(suggestions);
    } catch (err) {
      res.status(500).json({ error: 'nutritionix error', detail: err.message });
    }
  });

  // Micro:bit sync (protected) - consumes posted readings and credits points to user
  // POST /api/microbit/sync { deviceId, readings: [{energy, ts}] }
  router.post('/microbit/sync', requireAuth, async (req, res) => {
    await db.read();
    const { deviceId, readings } = req.body;
    if (!readings || !Array.isArray(readings)) return res.status(400).json({ error: 'readings array required' });

    const user = db.data.users.find(u => u.id === req.user.id);
    if (!user) return res.status(400).json({ error: 'User not found' });

    // Sum energy and convert to points (1 J -> 1 point base for simulation)
    let points = 0;
    for (const r of readings) {
      points += Number(r.energy) || 0;
    }
    points = Math.round(points * 10) / 10; // round-ish
    user.score = (user.score || 0) + points;
    user.history = user.history || [];
    user.history.push({ type: 'microbit_sync', deviceId: deviceId || null, points, ts: Date.now(), rawCount: readings.length });
    // Optionally store last sync device
    user.lastDevice = deviceId || user.lastDevice || null;

    // Save sync record globally for admin / simulation
    db.data.syncs = db.data.syncs || [];
    db.data.syncs.push({ id: 's_' + Date.now(), userId: user.id, deviceId, points, ts: Date.now(), count: readings.length });

    await db.write();
    res.json({ ok: true, points, newScore: user.score });
  });

  // GET /api/microbit/simulate (public) - returns a simulated recent reading
  router.get('/microbit/simulate', (req, res) => {
    const sim = { energy: Number((Math.random() * 2 + 0.1).toFixed(2)), ts: Date.now() };
    res.json(sim);
  });

  // Spend points on a minigame or goal - POST /api/game/spend
  router.post('/game/spend', requireAuth, async (req, res) => {
    await db.read();
    const { points, reason } = req.body;
    const user = db.data.users.find(u => u.id === req.user.id);
    if (!user) return res.status(400).json({ error: 'User not found' });
    const p = Number(points) || 0;
    if (p <= 0) return res.status(400).json({ error: 'Invalid points' });
    if ((user.score || 0) < p) return res.status(400).json({ error: 'Not enough points' });
    user.score -= p;
    user.history = user.history || [];
    user.history.push({ type: 'spend', points: -p, reason: reason || 'game', ts: Date.now() });
    await db.write();
    res.json({ ok: true, newScore: user.score });
  });

  app.use('/api', router);
};
