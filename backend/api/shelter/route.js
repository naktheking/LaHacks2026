import { getDb } from "../lib/mongodb";
import { getKeywordsAndSafety } from "../lib/ai-keywords";
import { fetchAllDynamicShelters } from "../lib/places";
import { getFederalShelters, seedFederalShelters } from "../lib/fema";
import { rankShelters } from "../lib/ranker";

export async function GET(req) {
  try {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const lat = Number(params.lat);
    const lng = Number(params.lng);
    const disaster = params.disaster ?? "wildfire";

    if (!lat || !lng) {
      return Response.json({ error: "lat and lng required" }, { status: 400 });
    }

    const db = await getDb();
    await seedFederalShelters(db);

    const cacheKey = `${Math.round(lat * 10) / 10}_${Math.round(lng * 10) / 10}_${disaster}`;
    const cached = await db.collection("shelters_dynamic").find({ cacheKey }).toArray();

    let dynamicShelters;
    if (cached.length > 0) {
      dynamicShelters = cached.map(({ _id, ...s }) => s);
    } else {
      const keywordData = await getKeywordsAndSafety(disaster);
      dynamicShelters = await fetchAllDynamicShelters(keywordData, lat, lng, disaster);
      if (dynamicShelters.length > 0) {
        await db.collection("shelters_dynamic").insertMany(
          dynamicShelters.map(s => ({ ...s, cacheKey }))
        );
      }
    }

    const staticShelters = await getFederalShelters(db, lat, lng);
    const allShelters = [...staticShelters, ...dynamicShelters].map(s => ({
      ...s,
      safety_rating: s.safety_scores?.[disaster] ?? s.safety_rating ?? 5,
    }));

    const ranked = rankShelters(allShelters, lat, lng);

    return Response.json({ disaster, total: ranked.length, shelters: ranked.slice(0, 20) });

  } catch (err) {
    console.error("Shelter route error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}