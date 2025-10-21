/**
 * chatController.js
 *
 * Food-only chat: server-side enforces a narrow prompt template and stores messages for 30 days.
 * Uses OpenAI REST via openai npm (v4) or direct fetch if package mismatch — supports both.
 *
 * Expected env:
 *  - OPENAI_API_KEY
 *
 * Routes:
 *  POST /api/chat { message }  (protected)
 *  GET  /api/chat/history      (protected)
 *
 * Storage: db.data.chats = [{ userId, message, reply, createdAt }]
 */

const dayjs = require('dayjs');
const User = require('../models/User'); // if using mongoose in your server
let OpenAIClient;
try {
  const { OpenAI } = require('openai');
  OpenAIClient = (opts) => new OpenAI(opts);
} catch (e) {
  // older openai package fallback
  const { Configuration, OpenAIApi } = require('openai');
  OpenAIClient = (opts) => new OpenAIApi(new Configuration(opts));
}

const sanitize = (s) => (s || '').toString().trim().slice(0, 2000); // max length

function foodSystemPrompt() {
  return [
    "You are Spinnergy's food assistant. ONLY answer questions about food, nutrition, recipes, portion sizes, macronutrients, and healthy goals.",
    "If a user asks about medical advice, decline and recommend a professional.",
    "Do not provide calorie estimates unless asked; if you estimate, clarify it's an estimate and show a simple calculation.",
    "Keep answers friendly, concise (under 120 words), and practical. Provide one actionable tip or recipe step at the end.",
    "When possible, show portion swaps and approximate calorie ranges.",
    "If the user asks something outside food (finance, politics), politely say you only assist with food."
  ].join('\n');
}

async function postChat(req, res) {
  try {
    const db = req.app.get('db'); // lowdb or mongoose wrapper depending on your server
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return res.status(500).json({ error: 'OpenAI not configured' });
    const msg = sanitize(req.body.message);
    if (!msg) return res.status(400).json({ error: 'message required' });

    // Enforce that the user's input is food-related at a basic level — quick keyword check
    const foodKeywords = ['egg','rice','bread','calorie','protein','fat','carb','recipe','meal','diet','vegan','vegetarian','keto','bmi','portion','serving','nutrient','protein','carbohydrate','fat'];
    const isFood = foodKeywords.some(k => msg.toLowerCase().includes(k));
    if (!isFood) {
      // allow but gently redirect
      return res.json({ reply: "I only help with food-related questions. Try asking about recipes, portion sizes, or nutrition.", isRedirect: true });
    }

    // Build a safe prompt: system + user
    const system = foodSystemPrompt();
    // Use Chat Completion if supported; otherwise fall back to completion
    let replyText = '';
    try {
      const client = OpenAIClient({ apiKey: openaiKey });
      // prefer chat completions on new OpenAI client
      if (client.chat) {
        const r = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // default to an LLM
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: msg }
          ],
          max_tokens: 220,
          temperature: 0.6
        });
        replyText = (r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content) || 'Sorry, I cannot answer that.';
      } else {
        // older API
        const r = await client.createCompletion({
          model: 'text-davinci-003',
          prompt: system + '\n\nUser: ' + msg + '\nAssistant:',
          max_tokens: 220,
          temperature: 0.6,
        });
        replyText = r.data.choices[0].text.trim();
      }
    } catch (aiErr) {
      console.error('OpenAI error', aiErr && aiErr.message);
      replyText = 'Sorry — the food chat is currently unavailable.';
    }

    // persist in db (for 30 days retention)
    await db.read();
    db.data.chats = db.data.chats || [];
    db.data.chats.push({ id: 'c_'+Date.now(), userId: req.user.id, message: msg, reply: replyText, createdAt: Date.now() });
    // prune 30 days
    const THIRTY_DAYS = 30 * 24 * 3600 * 1000;
    db.data.chats = db.data.chats.filter(c => (Date.now() - c.createdAt) <= THIRTY_DAYS);
    await db.write();

    res.json({ reply: replyText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'chat error' });
  }
}

async function history(req, res) {
  try {
    const db = req.app.get('db');
    await db.read();
    const chats = (db.data.chats || []).filter(c => c.userId === req.user.id).slice(-200).map(c=>({ message: c.message, reply: c.reply, createdAt: c.createdAt }));
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'history failed' });
  }
}

module.exports = { postChat, history };
