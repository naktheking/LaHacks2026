const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const FALLBACK_LOCATIONS = {
  "los angeles": {
    label: "Los Angeles, California, United States",
    lat: 34.0522,
    lng: -118.2437,
    state: "CA",
  },
  "san francisco": {
    label: "San Francisco, California, United States",
    lat: 37.7749,
    lng: -122.4194,
    state: "CA",
  },
  sacramento: {
    label: "Sacramento, California, United States",
    lat: 38.5816,
    lng: -121.4944,
    state: "CA",
  },
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeState(address = {}) {
  const state = address.state_code ?? address["ISO3166-2-lvl4"]?.split("-").pop();
  return state?.toUpperCase();
}

export async function resolveLocation({ lat, lng, location }) {
  const parsedLat = toNumber(lat);
  const parsedLng = toNumber(lng);

  if (parsedLat !== undefined && parsedLng !== undefined) {
    return {
      label: location || `${parsedLat}, ${parsedLng}`,
      lat: parsedLat,
      lng: parsedLng,
      state: undefined,
      source: "coordinates",
    };
  }

  const query = String(location ?? "").trim();
  if (!query) {
    const error = new Error("Provide either location text or lat/lng coordinates.");
    error.statusCode = 400;
    throw error;
  }

  const fallback = FALLBACK_LOCATIONS[query.toLowerCase()];

  try {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      addressdetails: "1",
      countrycodes: "us",
      limit: "1",
    });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        "User-Agent": "SafePath-LAHacks/1.0 (wildfire-relief-search)",
      },
    });

    if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);

    const [place] = await res.json();
    if (place) {
      return {
        label: place.display_name,
        lat: Number(place.lat),
        lng: Number(place.lon),
        state: normalizeState(place.address),
        source: "nominatim",
      };
    }
  } catch (error) {
    if (!fallback) {
      throw new Error(`Could not geocode "${query}": ${error.message}`);
    }
  }

  if (fallback) {
    return { ...fallback, source: "local_fallback" };
  }

  const error = new Error(`Could not find a US location for "${query}".`);
  error.statusCode = 404;
  throw error;
}
