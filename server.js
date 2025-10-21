// -------------------------------
// Spinnergy Unified Server
// -------------------------------

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { OpenAI } from "openai";
import admin from "firebase-admin";

// -------------------------------
// Environment setup
// -------------------------------
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// For __dirname compatibility with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------------
// Middleware
// -------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(cors());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// -------------------------------
// MongoDB connection
// -------------------------------
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connect failed:", err.message));
} else {
  console.warn("⚠️ No MongoDB URI found. MongoDB features disabled.");
}

// -------------------------------
// Firebase Admin SDK
// -------------------------------
try {
  const firebaseConfig = {
    type: process.env.FB_TYPE,
    project_id: process.env.FB_PROJECT_ID,
    private_key_id: process.env.FB_PRIVATE_KEY_ID,
    private_key: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.FB_CLIENT_EMAIL,
    client_id: process.env.FB_CLIENT_ID,
    auth_uri: process.env.FB_AUTH_URI,
    token_uri: process.env.FB_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FB_AUTH_CERT_URL,
    client_x509_cert_url: process.env.FB_CLIENT_CERT_URL,
  };
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(firebaseConfig) });
    console.log("✅ Firebase initialized");
  }
} catch (err) {
  console.warn("⚠️ Firebase not configured:", err.message);
}

// -------------------------------
// LowDB fallback for caching
// -------------------------------
const dbFile = path.join(__dirname, "cache.json");
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { chats: [], meals: [], goals: [], energyPoints: 0 });
await db.read();
await db.write();

// -------------------------------
// OpenAI API setup
// -------------------------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -------------------------------
// Nutritionix API setup
// -------------------------------
const NUTRITIONIX_APP_ID = process.env.NUTRITIONIX_APP_ID;
const NUTRITIONIX_APP_KEY = process.env.NUTRITIONIX_APP_KEY;

// -------------------------------
// Schemas (Mongo)
// -------------------------------
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  preferences: Object,
  goals: Object,
  meals: Array,
  energyPoints: { type: Number, default: 0 },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

// -------------------------------
// Auth routes
// -------------------------------
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, preferences } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed, preferences });
    await user.save();
    res.json({ message: "✅ Registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "✅ Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------
// Nutritionix search
// -------------------------------
app.get("/api/nutritionix/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query" });
  try {
    const response = await fetch("https://trackapi.nutritionix.com/v2/search/instant?query=" + query, {
      headers: {
        "x-app-id": NUTRITIONIX_APP_ID,
        "x-app-key": NUTRITIONIX_APP_KEY,
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Nutritionix API failed" });
  }
});

// -------------------------------
// AI Chatbot (Food-only assistant)
// -------------------------------
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const prompt = `You are Spinnergy, a friendly nutrition and food chatbot. Only answer questions related to food, recipes, health, and diet. User asked: ${message}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    const reply = completion.choices[0].message.content;
    db.data.chats.push({ message, reply, date: new Date().toISOString() });
    await db.write();

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chatbot unavailable" });
  }
});

// -------------------------------
// Microbit energy sync (simulated)
// -------------------------------
app.post("/api/microbit/sync", async (req, res) => {
  try {
    const { energy } = req.body;
    db.data.energyPoints += Number(energy) || 0;
    await db.write();
    res.json({ message: "Energy synced", total: db.data.energyPoints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------
// Leaderboard simulation
// -------------------------------
app.get("/api/leaderboard", async (req, res) => {
  try {
    const users = await User.find().sort({ energyPoints: -1 }).limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------
// Serve frontend (React)
// -------------------------------
const clientPath = path.join(__dirname, "client", "build");
app.use(express.static(clientPath));

// Serve React app correctly
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from React
app.use(express.static(path.join(__dirname, "client", "build")));

// API routes above here ...

// Fallback route — serve React for any non-API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Spinnergy server running on port ${PORT}`);
});
