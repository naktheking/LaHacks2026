export async function getKeywordsAndSafety(disaster) {
  const prompt = `
You are a disaster response expert. For a "${disaster}" emergency in the US,
return a list of building types that serve as emergency shelters.

Respond ONLY with a JSON array, no markdown, no explanation:
[
  {
    "keyword": "Red Cross emergency shelter",
    "safety": { "wildfire": 9, "earthquake": 6, "tsunami": 4 },
    "notes": "Officially managed, highest priority"
  }
]

Include 8-10 types. Safety scores are 1-10.
  `.trim();

  const model = "gemma-3-27b-it";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1500,           // ← was 500, too low
          responseMimeType: "application/json", // ← forces clean JSON, no fences
        },
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemma API error ${res.status}: ${errorText}`);
  }

  const data = await res.json();

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!raw) {
    throw new Error("No text returned from Gemma");
  }

  return JSON.parse(raw);
}