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

export function rankShelters(shelters, userLat, userLng) {
  const distances = shelters.map(s =>
    getDistance(userLat, userLng, s.coords.lat, s.coords.lng)
  );
  const maxDist = Math.max(...distances) || 1;

  return shelters
    .map((s, i) => {
      const distScore = 1 - distances[i] / maxDist;
      const safetyScore = (s.safety_rating ?? 5) / 10;
      const federalBonus = s.is_federal ? 0.1 : 0;
      const score = distScore * 0.4 + safetyScore * 0.5 + federalBonus;
      return {
        ...s,
        dist_km: Math.round(distances[i] * 10) / 10,
        score: Math.round(score * 100) / 100,
      };
    })
    .sort((a, b) => b.score - a.score);
}