const FEMA_SHELTERS = [
  {
    place_id: "fema_001",
    name: "FEMA Distribution Center - LA",
    address: "Los Angeles, CA",
    coords: { lat: 34.0522, lng: -118.2437 },
    safety_scores: { wildfire: 9, earthquake: 8, tsunami: 6 },
    source: "fema_static",
    notes: "Official FEMA managed facility",
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
    is_federal: true,
  },
];

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