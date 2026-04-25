const FEMA_SHELTERS = [
  {
    place_id: "fema_001",
    name: "FEMA Distribution Center - LA",
    address: "Los Angeles, CA",
    coords: { lat: 34.0522, lng: -118.2437 },
    safety_scores: { wildfire: 9, earthquake: 8, tsunami: 6 },
    source: "fema_static",
    notes: "Official FEMA managed facility",
    source_url: "https://www.fema.gov/locations/california",
    source_priority: 0,
    is_federal: true,
  },
  {
    place_id: "fema_002",
    name: "Red Cross LA Chapter HQ",
    address: "2700 Wilshire Blvd, Los Angeles, CA",
    coords: { lat: 34.0577, lng: -118.4765 },
    safety_scores: { wildfire: 9, earthquake: 7, tsunami: 5 },
    source: "fema_static",
    notes: "Red Cross managed shelter",
    source_url: "https://www.redcross.org/get-help/disaster-relief-and-recovery-services/find-an-open-shelter.html",
    source_priority: 1,
    is_federal: true,
  },
  {
    place_id: "fema_003",
    name: "California Governor's Office of Emergency Services",
    address: "3650 Schriever Ave, Mather, CA",
    coords: { lat: 38.5656, lng: -121.2969 },
    safety_scores: { wildfire: 8, earthquake: 7, tsunami: 5 },
    source: "state_official_static",
    source_url: "https://www.caloes.ca.gov/",
    source_priority: 1,
    notes: "State emergency management office; use for official incident and evacuation guidance",
    is_federal: false,
  },
];

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function seedFederalShelters(db) {
  const col = db.collection("shelters_static");
  const count = await col.countDocuments();
  if (count > 0) return;
  await col.insertMany(FEMA_SHELTERS);
  console.log(`Seeded ${FEMA_SHELTERS.length} federal shelters`);
}

export async function getFederalShelters(db, lat, lng, radiusKm = 50) {
  const delta = radiusKm / 111;
  return db.collection("shelters_static").find({
    "coords.lat": { $gte: lat - delta, $lte: lat + delta },
    "coords.lng": { $gte: lng - delta, $lte: lng + delta },
  }).toArray();
}

export function getStaticFederalShelters(lat, lng, radiusKm = 50) {
  return FEMA_SHELTERS.filter((shelter) => {
    const distance = getDistance(lat, lng, shelter.coords.lat, shelter.coords.lng);
    return distance <= radiusKm;
  });
}
