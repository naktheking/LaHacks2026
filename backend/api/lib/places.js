const PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

export async function fetchAllDynamicShelters(keywords, lat, lng, disaster) {
  const allResults = await Promise.all(
    keywords.map(({ keyword, safety, notes }) =>
      fetch(`${PLACES_URL}?location=${lat},${lng}&radius=25000&keyword=${encodeURIComponent(keyword)}&key=${process.env.GOOGLE_MAPS_KEY}`)
        .then(r => r.json())
        .then(d => (d.results ?? []).map(place => ({
          place_id: place.place_id,
          name: place.name,
          address: place.vicinity,
          coords: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          safety_scores: safety,
          safety_rating: safety[disaster] ?? 5,
          notes,
          source: "google_places",
          cachedAt: new Date(),
        })))
    )
  );

  const seen = new Set();
  return allResults.flat().filter(s => {
    if (seen.has(s.place_id)) return false;
    seen.add(s.place_id);
    return true;
  });
}