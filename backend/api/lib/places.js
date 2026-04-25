const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.text();
  const data = body ? JSON.parse(body) : {};

  if (!response.ok) {
    throw new Error(`Google Places returned ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

function mapPlace(place, safety, disaster, notes) {
  if (!place.location?.latitude || !place.location?.longitude) return undefined;

  return {
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
  };
}

export async function fetchAllDynamicShelters(keywords, lat, lng, disaster, radiusKm = 25, locationLabel = "") {
  const apiKey = process.env.GOOGLE_MAPS_KEY ?? process.env.GOOGLE_PLACES_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_KEY is missing in backend/.env");
  }

  const radiusMeters = Math.min(Math.round(radiusKm * 1000), 50000);
  const locationText = locationLabel && !locationLabel.includes(", -")
    ? ` near ${locationLabel.split(",").slice(0, 2).join(", ")}`
    : " nearby";

  const allResults = await Promise.all(
    keywords.map(({ keyword, safety, notes }) => {
      const body = {
        textQuery: `${keyword}${locationText}`,
        pageSize: 8,
        rankPreference: "RELEVANCE",
        languageCode: "en",
        regionCode: "US",
        locationBias: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng,
            },
            radius: radiusMeters,
          },
        },
      };

      return fetchJson(PLACES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri",
        },
        body: JSON.stringify(body),
      })
        .then((d) => {
          if (d.error) {
            throw new Error(`Google Places ${d.error.status} for "${keyword}": ${d.error.message}`);
          }

          if (process.env.DEBUG_GOOGLE_PLACES === "true") {
            console.log(`Google Places "${body.textQuery}" -> ${d.places?.length ?? 0}`);
          }

          return (d.places ?? [])
            .map((place) => mapPlace(place, safety, disaster, notes))
            .filter(Boolean);
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
