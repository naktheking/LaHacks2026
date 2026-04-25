import { resolveLocation } from "./geocode.js";
import { getFederalShelters, getStaticFederalShelters } from "./fema.js";
import { fetchAllDynamicShelters } from "./places.js";
import { fetchOpenStreetMapReliefCenters } from "./osm.js";
import { scrapeReliefCenterLinks } from "./web-scrape.js";
import { rankShelters } from "./ranker.js";

const DEFAULT_KEYWORDS = [
  {
    keyword: "Red Cross emergency shelter",
    safety: { wildfire: 9, earthquake: 7, tsunami: 5 },
    notes: "Official or partner-managed emergency shelter candidate.",
  },
  {
    keyword: "wildfire evacuation center",
    safety: { wildfire: 8, earthquake: 6, tsunami: 5 },
    notes: "Potential evacuation center. Confirm open status before traveling.",
  },
  {
    keyword: "community center emergency shelter",
    safety: { wildfire: 6, earthquake: 6, tsunami: 5 },
    notes: "Community facility that may be used during evacuations.",
  },
  {
    keyword: "public library emergency shelter",
    safety: { wildfire: 6, earthquake: 6, tsunami: 5 },
    notes: "Public facility that may offer daytime relief or information.",
  },
];

function uniqueByPlaceId(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.place_id || seen.has(item.place_id)) return false;
    seen.add(item.place_id);
    return true;
  });
}

async function settleSource(name, fn) {
  try {
    return { name, ok: true, data: await fn() };
  } catch (error) {
    return { name, ok: false, data: [], error: error.message };
  }
}

export async function searchReliefCenters(query) {
  const disaster = String(query.disaster ?? "wildfire").toLowerCase();
  const radiusKm = Math.min(Number(query.radiusKm ?? 50) || 50, 100);
  const location = await resolveLocation(query);

  const sourceResults = await Promise.all([
    settleSource("federal_static", async () => getStaticFederalShelters(location.lat, location.lng, radiusKm)),
    settleSource("openstreetmap", async () => fetchOpenStreetMapReliefCenters(location.lat, location.lng, radiusKm)),
    settleSource("google_places", async () =>
      fetchAllDynamicShelters(DEFAULT_KEYWORDS, location.lat, location.lng, disaster, radiusKm)
    ),
    settleSource("web_scrape", async () => scrapeReliefCenterLinks(location.label, disaster)),
  ]);

  const allShelters = uniqueByPlaceId(sourceResults.flatMap((source) => source.data)).map((s) => ({
    ...s,
    safety_rating: s.safety_scores?.[disaster] ?? s.safety_rating ?? 5,
  }));

  const geocodedShelters = allShelters.filter((s) => s.coords?.lat && s.coords?.lng);
  const webOnlyShelters = allShelters.filter((s) => !s.coords?.lat || !s.coords?.lng);
  const ranked = rankShelters(geocodedShelters, location.lat, location.lng);
  const sourceStatus = sourceResults.map(({ name, ok, error, data }) => ({
    name,
    ok,
    count: data.length,
    ...(error ? { error } : {}),
  }));

  return {
    disaster,
    query: {
      location: location.label,
      lat: location.lat,
      lng: location.lng,
      state: location.state,
      radiusKm,
      locationSource: location.source,
    },
    total: ranked.length + webOnlyShelters.length,
    sourceStatus,
    shelters: [...ranked, ...webOnlyShelters].slice(0, 24),
  };
}

export async function searchReliefCentersWithDb(query, db) {
  const result = await searchReliefCenters(query);
  if (!db) return result;

  const federalFromDb = await getFederalShelters(db, result.query.lat, result.query.lng);
  if (federalFromDb.length === 0) return result;

  const combined = uniqueByPlaceId([...federalFromDb, ...result.shelters]).map((s) => ({
    ...s,
    safety_rating: s.safety_scores?.[result.disaster] ?? s.safety_rating ?? 5,
  }));

  const ranked = rankShelters(
    combined.filter((s) => s.coords?.lat && s.coords?.lng),
    result.query.lat,
    result.query.lng
  );

  return {
    ...result,
    total: ranked.length,
    sourceStatus: [
      { name: "mongodb_federal_static", ok: true, count: federalFromDb.length },
      ...result.sourceStatus,
    ],
    shelters: ranked.slice(0, 24),
  };
}
