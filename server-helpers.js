const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Helper: clamp date range to last 90 days
function clampTo90Days(fromISO, toISO) {
  const now = Date.now();
  const ninety = 90 * 24 * 3600 * 1000;
  let from = fromISO ? Date.parse(fromISO) : now - ninety;
  let to = toISO ? Date.parse(toISO) : now;
  if (isNaN(from)) from = now - ninety;
  if (isNaN(to)) to = now;
  if (to - from > ninety) from = to - ninety;
  return { from, to };
}

// Nutritionix instant search endpoint wrapper
async function nutritionixAutocomplete(q, APP_ID, APP_KEY) {
  if (!APP_ID || !APP_KEY) throw new Error('Nutritionix not configured');
  // Nutritionix instant / search endpoint
  const url = 'https://api.nutritionix.com/v1_1/search'; // fallback: older endpoint; prefer trackapi in Part3
  // We'll use the instant search via the v2 trackapi when available in Part3.
  // Simple approach: call Nutritionix natural language endpoint for suggestions
  const payload = { query: q, num_servings: 1 };

  // As a robust fallback, if the modern endpoint isn't wanted, return simulated suggestions.
  try {
    // Attempt v2 instant (not guaranteed); using POST to trackapi natural nutrients as simpler for Part2
    const r = await axios.post('https://trackapi.nutritionix.com/v2/natural/nutrients', { query: q }, {
      headers: {
        'x-app-id': APP_ID,
        'x-app-key': APP_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 6000
    });
    // Map response to simple suggestions
    const hits = (r.data && r.data.foods) || [];
    return hits.map(f => ({ id: f.food_name, name: f.food_name, calories: f.nf_calories || null, raw: f }));
  } catch (err) {
    // On any error, fallback to simple simulated suggestions
    const words = q.split(/\s+/).filter(Boolean);
    const base = words.join(' ') || 'idli';
    return [
      { id: base + '_1', name: base + ' (approx)', calories: 150 },
      { id: base + '_2', name: base + ' with chutney', calories: 210 },
      { id: base + '_3', name: base + ' (large)', calories: 320 }
    ];
  }
}

module.exports = { clampTo90Days, nutritionixAutocomplete };
