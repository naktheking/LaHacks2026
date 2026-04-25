const SEARCH_TERMS = [
  "wildfire evacuation shelter",
  "emergency shelter",
  "relief center",
  "evacuation center",
];

function stripHtml(value = "") {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractDuckDuckGoResults(html) {
  const results = [];
  const pattern = /<a rel="nofollow" class="result-link" href="([^"]+)">([\s\S]*?)<\/a>/g;
  let match;

  while ((match = pattern.exec(html)) && results.length < 8) {
    const url = match[1].replace(/&amp;/g, "&");
    const title = stripHtml(match[2]);
    if (!title || !url) continue;

    results.push({
      place_id: `web_${Buffer.from(url).toString("base64url").slice(0, 24)}`,
      name: title,
      address: "Check linked source for address",
      coords: undefined,
      safety_scores: { wildfire: 5 },
      safety_rating: 5,
      notes: "Web result that may mention a current shelter or evacuation center. Verify before traveling.",
      source: "web_scrape",
      source_priority: 3,
      source_url: url,
      is_federal: false,
    });
  }

  return results;
}

export async function scrapeReliefCenterLinks(locationLabel, disaster = "wildfire") {
  const location = locationLabel.split(",").slice(0, 2).join(", ");
  const query = `${disaster} ${SEARCH_TERMS.join(" OR ")} ${location}`;
  const params = new URLSearchParams({ q: query, kl: "us-en" });
  const res = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
    headers: {
      "User-Agent": "SafePath-LAHacks/1.0 (wildfire-relief-search)",
    },
  });

  if (!res.ok) {
    throw new Error(`Web scrape search returned ${res.status}`);
  }

  return extractDuckDuckGoResults(await res.text());
}
