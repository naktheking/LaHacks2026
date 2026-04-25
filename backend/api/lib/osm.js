const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const TAG_QUERIES = [
  'node["amenity"="shelter"]',
  'way["amenity"="shelter"]',
  'node["social_facility"="shelter"]',
  'way["social_facility"="shelter"]',
  'node["emergency"="assembly_point"]',
  'way["emergency"="assembly_point"]',
  'node["amenity"="community_centre"]',
  'way["amenity"="community_centre"]',
  'node["amenity"="place_of_worship"]',
  'way["amenity"="place_of_worship"]',
];

function buildOverpassQuery(lat, lng, radiusMeters) {
  const clauses = TAG_QUERIES.map((tag) => `${tag}(around:${radiusMeters},${lat},${lng});`).join("\n");
  return `[out:json][timeout:18];(${clauses});out center tags 40;`;
}

function readableType(tags = {}) {
  if (tags.amenity === "shelter" || tags.social_facility === "shelter") return "Shelter";
  if (tags.emergency === "assembly_point") return "Assembly point";
  if (tags.amenity === "community_centre") return "Community center";
  if (tags.amenity === "place_of_worship") return "Place of worship";
  return "Relief location";
}

function addressFromTags(tags = {}) {
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  return [street, tags["addr:city"], tags["addr:state"], tags["addr:postcode"]]
    .filter(Boolean)
    .join(", ");
}

export async function fetchOpenStreetMapReliefCenters(lat, lng, radiusKm = 35) {
  const radiusMeters = Math.round(radiusKm * 1000);
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "SafePath-LAHacks/1.0 (wildfire-relief-search)",
    },
    body: new URLSearchParams({ data: buildOverpassQuery(lat, lng, radiusMeters) }),
  });

  if (!res.ok) {
    throw new Error(`OpenStreetMap Overpass returned ${res.status}`);
  }

  const data = await res.json();
  return (data.elements ?? [])
    .map((item) => {
      const tags = item.tags ?? {};
      const itemLat = item.lat ?? item.center?.lat;
      const itemLng = item.lon ?? item.center?.lon;
      if (!itemLat || !itemLng || !tags.name) return undefined;

      return {
        place_id: `osm_${item.type}_${item.id}`,
        name: tags.name,
        address: addressFromTags(tags) || tags["addr:full"] || "Address not listed",
        coords: { lat: itemLat, lng: itemLng },
        safety_scores: { wildfire: tags.emergency === "assembly_point" ? 7 : 6 },
        safety_rating: tags.emergency === "assembly_point" ? 7 : 6,
        notes: `${readableType(tags)} from OpenStreetMap. Call ahead or follow official evacuation instructions before traveling.`,
        source: "openstreetmap",
        source_priority: 2,
        source_url: `https://www.openstreetmap.org/${item.type}/${item.id}`,
        is_federal: false,
      };
    })
    .filter(Boolean);
}
