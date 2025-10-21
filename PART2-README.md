Spinnergy Part2 notes:
- After running this generator, rebuild the client:
  npm --prefix client install
  npm --prefix client run build
  node scripts/build-and-copy.js
  npm start

- Add required keys to .env:
  NUTRITIONIX_APP_ID=
  NUTRITIONIX_APP_KEY=
  OPENAI_API_KEY=

- server.js (Part1) needs to require and call the extensions wiring function:
  const wireExtensions = require('./server-routes-extensions');
  wireExtensions(app, db, requireAuth);
  (If you used the Part1 server.js verbatim it already loads extra endpoints automatically; confirm it calls require('./server-routes-extensions') at startup.)

- Micro:bit sync endpoint accepts JSON payloads; use the MicrobitSim UI to test locally.
