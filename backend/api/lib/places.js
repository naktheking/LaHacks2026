const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";

export async function fetchAllDynamicShelters(keywords, lat, lng, disaster, radiusKm = 25) {
  if (!process.env.GOOGLE_MAPS_KEY) {
    return [];
  }

  const radiusMeters = Math.min(Math.round(radiusKm * 1000), 50000);
  const allResults = await Promise.all(
    keywords.map(({ keyword, safety, notes }) => {
      return fetch(PLACES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri",
        },
        body: JSON.stringify({
          textQuery: keyword,
          maxResultCount: 10,
          rankPreference: "DISTANCE",
          languageCode: "en",
          locationBias: {
            circle: {
              center: {
                latitude: lat,
                longitude: lng,
              },
              radius: radiusMeters,
            },
          },
        }),
      })
        .then((r) => {
          if (!r.ok) throw new Error(`Google Places returned ${r.status}`);
          return r.json();
        })
        .then((d) => {
          if (d.error) {
            throw new Error(`Google Places ${d.error.status} for "${keyword}": ${d.error.message}`);
          }

          return (d.places ?? []).map((place) => ({
            place_id: place.id,
            name: place.displayName?.text ?? "Unnamed place",
            address: place.formattedAddress ?? "Address not listed",
            coords: {
              lat: place.location.latitude,
              lng: place.location.longitude,
            },
            safety_scores: safety,
            safety_rating: safety[disaster] ?? 5,
            notes,
            source: "google_places",
            source_priority: 2,
            source_url: place.googleMapsUri,
            cachedAt: new Date(),
          }));
        })
    })
  );

  const seen = new Set();
  return allResults.flat().filter(s => {
    if (seen.has(s.place_id)) return false;
    seen.add(s.place_id);
    return true;
  });
}
