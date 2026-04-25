import { searchReliefCenters } from "../lib/relief-search.js";

export async function GET(req) {
  try {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    return Response.json(await searchReliefCenters(params));

  } catch (err) {
    console.error("Shelter route error:", err);
    return Response.json({ error: err.message }, { status: err.statusCode ?? 500 });
  }
}
