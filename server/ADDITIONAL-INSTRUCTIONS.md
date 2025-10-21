Make sure your server.js (single-service) includes:
- require('./server/src/routes/chat') and app.use('/api/chat', chatRoutes)
- set the lowdb or mongoose 'db' object onto app: app.set('db', db);
- include the leaderboard utility: const { addScore } = require('./server/src/utils/leaderboard');
- ensure auth middleware sets req.user = { id, name, ... } from token.

Env vars needed:
- OPENAI_API_KEY
- NUTRITIONIX_APP_ID
- NUTRITIONIX_APP_KEY
- MONGO_URI (optional)
- REDIS_URL (optional)
