/**
 * Simple seed script for lowdb users (if your server uses lowdb)
 * Run: node server/scripts/seed-demo.js
 */
const fs = require('fs');
const path = require('path');
const dbFile = path.join(__dirname, '..', 'db.json');
let db = { users: [], leaderboard: [], chats: [], syncs: [] };
if (fs.existsSync(dbFile)) {
  db = JSON.parse(fs.readFileSync(dbFile,'utf8'));
}
db.users = db.users || [];
const demo = {
  id: 'u_demo',
  name: 'Demo User',
  email: 'demo@spinnergy.app',
  password: 'demo', // if you use bcrypt in server, replace with hashed password
  score: 123.4,
  meals: [],
  history: []
};
if (!db.users.find(u => u.id === demo.id)) db.users.push(demo);
db.leaderboard = db.leaderboard || [];
db.leaderboard.push({ id: demo.id, name: demo.name, score: demo.score });
fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
console.log('Seeded demo user to', dbFile);
