This file lists the new endpoints added by Part2:
- POST /api/meal/add    { date, mealType, items: [{name, qty, calories?}], notes }
- GET  /api/meal/list   ?from=isoDate&to=isoDate  (returns last 90 days by default)
- GET  /api/food/autocomplete?q=...   (calls Nutritionix instant search)
- POST /api/microbit/sync  { deviceId, readings: [{energy: number, ts}] }  (protected)
- GET  /api/microbit/simulate (returns simulated energy readings)
- POST /api/game/spend  { points, reason }  (spend energy points on minigames)
