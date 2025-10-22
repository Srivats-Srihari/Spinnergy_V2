import express from "express";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import OpenAI from "openai";

dotenv.config();
const __dirname = path.resolve();
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const PORT = process.env.PORT || 5000;

// ====== MongoDB ======
mongoose.connect(process.env.MONGO_URI || "", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Mongo connected"))
  .catch(err => console.error("Mongo failed:", err.message));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  score: { type: Number, default: 0 },
  energyPoints: { type: Number, default: 0 },
  meals: { type: Array, default: [] },
  chatHistory: { type: Array, default: [] }
});
const User = mongoose.model("User", userSchema);

// ====== Auth Routes ======
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already used" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ====== Leaderboard ======
app.get("/api/leaderboard", async (req, res) => {
  const users = await User.find().sort({ energyPoints: -1 }).limit(15);
  res.json(users.map(u => ({ name: u.name, energyPoints: u.energyPoints })));
});

// ====== OpenAI Chat Assistant ======
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/chat", async (req, res) => {
  try {
    const { message, userId } = req.body;
    const user = await User.findById(userId);
    const prompt = [
      { role: "system", content: "You are a helpful AI assistant that only talks about food, nutrition, diet, recipes, and energy goals. No other topics are allowed." },
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: prompt,
    });

    const reply = response.choices[0].message.content;
    if (user) {
      user.chatHistory.push({ user: message, ai: reply, date: new Date() });
      if (user.chatHistory.length > 30) user.chatHistory.shift();
      await user.save();
    }
    res.json({ reply });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ====== Serve React build ======
const clientPath = path.join(__dirname, "client", "build");
app.use(express.static(clientPath));
app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(clientPath, "index.html")));

app.listen(PORT, () => console.log("✅ Spinnergy running on port", PORT));

