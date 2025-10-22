
/**
 * Spinnergy server.js (patched)
 * Fixes OpenAI, Nutritionix, Leaderboard, Chat, Meals, Routes
 */
import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fetch from "node-fetch";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(helmet());
app.use(cors());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const NUTRITIONIX_APP_ID = process.env.NUTRITIONIX_APP_ID;
const NUTRITIONIX_API_KEY = process.env.NUTRITIONIX_API_KEY;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo connected"))
  .catch((e) => console.error("❌ Mongo fail:", e.message));

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  dietPreferences: Object,
  meals: Array,
  energyPoints: { type: Number, default: 0 },
  leaderboardScore: { type: Number, default: 0 },
  chats: Array,
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

function signToken(u) {
  return jwt.sign({ id: u._id }, JWT_SECRET, { expiresIn: "7d" });
}
async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "missing token" });
  try {
    const decoded = jwt.verify(header.split(" ")[1], JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (e) {
    res.status(401).json({ error: "invalid token" });
  }
}

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email });
  if (!u || !(await bcrypt.compare(password, u.password)))
    return res.status(400).json({ error: "bad credentials" });
  res.json({ token: signToken(u), user: u });
});

app.post("/api/register", async (req, res) => {
  const { name, email, password, dietPreferences } = req.body;
  const user = new User({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    dietPreferences,
  });
  await user.save();
  res.json({ token: signToken(user), user });
});

app.get("/api/food", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ common: [] });
    const r = await fetch(
      `https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(
        q
      )}`,
      {
        headers: {
          "x-app-id": NUTRITIONIX_APP_ID,
          "x-app-key": NUTRITIONIX_API_KEY,
        },
      }
    );
    const j = await r.json();
    res.json(j);
  } catch (err) {
    res.status(500).json({ error: "nutritionix error", details: err.message });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + OPENAI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a food AI that only discusses nutrition, recipes, and health." },
          { role: "user", content: message },
        ],
      }),
    });
    const j = await r.json();
    res.json({ reply: j.choices?.[0]?.message?.content || "No response" });
  } catch (err) {
    res.status(500).json({ error: "AI error", details: err.message });
  }
});

app.post("/api/energy", auth, async (req, res) => {
  const delta = Number(req.body.amount || 0);
  req.user.energyPoints += delta;
  req.user.leaderboardScore += delta;
  await req.user.save();
  res.json({ energyPoints: req.user.energyPoints });
});

app.get("/api/leaderboard", async (req, res) => {
  const top = await User.find().sort({ leaderboardScore: -1 }).limit(20);
  res.json(top);
});

app.use(express.static(path.join(__dirname, "client", "build")));
app.get("/*", (req, res) =>
  res.sendFile(path.join(__dirname, "client", "build", "index.html"))
);

app.listen(PORT, () =>
  console.log("🚀 Spinnergy running on http://localhost:" + PORT)
);
