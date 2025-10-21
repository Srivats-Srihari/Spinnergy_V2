/**
 * leaderboard.js
 *
 * Provides leaderboard functions backed by Redis (if REDIS_URL present) with a Mongo fallback.
 * Uses simple sorted-set semantics: score is numeric and higher is better.
 *
 * Env:
 *  - REDIS_URL (optional) e.g. redis://:password@host:6379
 *
 * If Redis is not available, we keep an in-memory map and persist to db.data.leaderboard (low-volume demo).
 */

const Redis = (() => {
  try { return require('ioredis'); } catch (e) { return null; }
})();

let redis = null;
if (process.env.REDIS_URL && Redis) {
  redis = new Redis(process.env.REDIS_URL);
  redis.on('error', (e) => console.warn('Redis error', e && e.message));
}

async function addScore(db, userId, name, score) {
  // If redis available, zadd
  if (redis) {
    await redis.zadd('spinnergy:leaderboard', score, JSON.stringify({ id: userId, name }));
    return;
  }
  // fallback: write into db.data.leaderboard array
  await db.read();
  db.data.leaderboard = db.data.leaderboard || [];
  const existing = db.data.leaderboard.find(x => x.id === userId);
  if (existing) existing.score = score, existing.name = name;
  else db.data.leaderboard.push({ id: userId, name, score });
  await db.write();
}

async function topN(db, n = 10) {
  if (redis) {
    const entries = await redis.zrevrange('spinnergy:leaderboard', 0, n - 1);
    return entries.map(e => {
      try { return JSON.parse(e); } catch { return { id: e, name: e, score: null }; }
    });
  }
  await db.read();
  const arr = (db.data.leaderboard || []).slice().sort((a,b)=>b.score-a.score).slice(0,n);
  return arr;
}

module.exports = { addScore, topN };