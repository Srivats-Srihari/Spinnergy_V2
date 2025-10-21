Spinnergy PART 1 - usage

1) Install at root:
   npm install

2) Build client and copy build to server/public:
   npm run build-client
   node scripts/build-and-copy.js

(Or run:)
   npm run build-and-copy

3) Start server:
   npm start

4) Open http://localhost:8080

IMPORTANT:
- Copy .env.example to .env and fill NUTRITIONIX_APP_ID, NUTRITIONIX_APP_KEY, and OPENAI_API_KEY if you want those features.
- This is PART 1: run Part 2 & Part 3 generators to finish the full feature list (AI persistence, micro:bit sync handlers, meal logging UI).
