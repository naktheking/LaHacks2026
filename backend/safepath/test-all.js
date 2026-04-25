import { getKeywordsAndSafety } from "./app/api/lib/ai-keywords.js";
import { fetchAllDynamicShelters } from "./app/api/lib/places.js";
import { getDb } from "./app/api/lib/mongodb.js";
import { seedFederalShelters, getFederalShelters } from "./app/api/lib/fema.js";
import { rankShelters } from "./app/api/lib/ranker.js";

const LA = { lat: 34.0522, lng: -118.2437 };
let passed = 0;
let failed = 0;

function ok(label) {
  console.log(`  ✓ ${label}`);
  passed++;
}

function fail(label, err) {
  console.log(`  ✗ ${label}: ${err.message}`);
  failed++;
}

// ── 1. AI Keywords ───────────────────────────────────────────────────
console.log("\n── 1. AI keyword generation ──");
try {
  const keywords = await getKeywordsAndSafety("wildfire");
  if (!Array.isArray(keywords)) throw new Error("Not an array");
  if (keywords.length < 5) throw new Error(`Too few results: ${keywords.length}`);
  if (!keywords[0].keyword) throw new Error("Missing keyword field");
  if (!keywords[0].safety?.wildfire) throw new Error("Missing safety scores");
  ok(`Got ${keywords.length} keyword types`);
  ok(`First keyword: "${keywords[0].keyword}"`);
} catch (err) {
  fail("AI keywords", err);
}

// ── 2. Google Places ─────────────────────────────────────────────────
console.log("\n── 2. Google Places ──");
try {
  const mockKeywords = [
    { keyword: "Red Cross emergency shelter", safety: { wildfire: 9 }, notes: "test" },
    { keyword: "community center", safety: { wildfire: 6 }, notes: "test" },
  ];
  const shelters = await fetchAllDynamicShelters(mockKeywords, LA.lat, LA.lng, "wildfire");
  if (shelters.length === 0) throw new Error("No shelters returned — check GOOGLE_MAPS_KEY");
  if (!shelters[0].coords?.lat) throw new Error("Missing coords");
  if (!shelters[0].place_id) throw new Error("Missing place_id");
  ok(`Found ${shelters.length} places`);
  ok(`First result: "${shelters[0].name}" at ${shelters[0].address}`);
} catch (err) {
  fail("Google Places", err);
}

// ── 3. MongoDB ───────────────────────────────────────────────────────
console.log("\n── 3. MongoDB ──");
let db;
try {
  db = await getDb();
  ok("Connected to MongoDB");
} catch (err) {
  fail("MongoDB connection", err);
}

// ── 4. FEMA seeding ──────────────────────────────────────────────────
console.log("\n── 4. FEMA static shelters ──");
try {
  await seedFederalShelters(db);
  ok("Seeded federal shelters");

  const federal = await getFederalShelters(db, LA.lat, LA.lng);
  if (federal.length === 0) throw new Error("No federal shelters found near LA");
  ok(`Found ${federal.length} federal shelters near LA`);
} catch (err) {
  fail("FEMA shelters", err);
}

// ── 5. Ranker ────────────────────────────────────────────────────────
console.log("\n── 5. Ranker ──");
try {
  const mockShelters = [
    { name: "Far shelter",   coords: { lat: 34.15, lng: -118.35 }, safety_rating: 9 },
    { name: "Close shelter", coords: { lat: 34.06, lng: -118.25 }, safety_rating: 5 },
    { name: "Mid shelter",   coords: { lat: 34.10, lng: -118.30 }, safety_rating: 8 },
  ];
  const ranked = rankShelters(mockShelters, LA.lat, LA.lng);
  if (!ranked[0].score) throw new Error("Missing score field");
  if (ranked[0].dist_km === undefined) throw new Error("Missing dist_km field");
  ok(`Ranked ${ranked.length} shelters`);
  ok(`Top pick: "${ranked[0].name}" (score: ${ranked[0].score}, dist: ${ranked[0].dist_km}km)`);
} catch (err) {
  fail("Ranker", err);
}

// ── 6. Full API endpoint ─────────────────────────────────────────────
console.log("\n── 6. Full API endpoint ──");
try {
  const res = await fetch(
    `http://localhost:3000/api/shelters?lat=${LA.lat}&lng=${LA.lng}&disaster=wildfire`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.shelters) throw new Error("No shelters in response");
  if (data.shelters.length === 0) throw new Error("Empty shelters array");
  ok(`API returned ${data.total} shelters`);
  ok(`Top shelter: "${data.shelters[0].name}" (score: ${data.shelters[0].score})`);
} catch (err) {
  fail("Full API", err);
}

// ── Summary ──────────────────────────────────────────────────────────
console.log(`\n── Results: ${passed} passed, ${failed} failed ──`);
if (failed > 0) process.exit(1);