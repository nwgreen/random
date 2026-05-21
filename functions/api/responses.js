// Cloudflare Pages Function -> /api/responses
// Requires KV namespace bound as SURVEY_KV.
// Responses are namespaced per survey via body.surveyId (POST) or ?surveyId= (GET/DELETE).

function kvKey(surveyId) {
  return surveyId ? `survey:${surveyId}:responses` : "responses";
}

function corsHeaders() {
  return { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}

function arr(v) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 30).map(x => String(x).slice(0, 80));
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...corsHeaders(), "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const surveyId = url.searchParams.get("surveyId") || "";
    const raw = await env.SURVEY_KV.get(kvKey(surveyId));
    return json(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return json([], 200);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    if (!body || !body.name || !body.freq) return json({ error: "name and freq required" }, 400);
    const surveyId = String(body.surveyId || "").slice(0, 40);
    const entry = {
      id: "r_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      ts: new Date().toISOString(),
      surveyId,
      name: String(body.name).slice(0, 120),
      freq: String(body.freq).slice(0, 60),
      relative: arr(body.relative),
      daypart: arr(body.daypart),
      before9: arr(body.before9),
      lunch: arr(body.lunch),
      after: arr(body.after),
      other: String(body.other || "").slice(0, 300),
      notes: String(body.notes || "").slice(0, 1000)
    };
    const key = kvKey(surveyId);
    const raw = await env.SURVEY_KV.get(key);
    const list = raw ? JSON.parse(raw) : [];
    list.push(entry);
    await env.SURVEY_KV.put(key, JSON.stringify(list));
    return json({ ok: true, count: list.length });
  } catch (e) {
    return json({ error: "could not save" }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const surveyId = url.searchParams.get("surveyId") || "";
    if (!id) return json({ error: "id required" }, 400);
    const key = kvKey(surveyId);
    const raw = await env.SURVEY_KV.get(key);
    const list = raw ? JSON.parse(raw) : [];
    const next = list.filter(r => r.id !== id);
    await env.SURVEY_KV.put(key, JSON.stringify(next));
    return json({ ok: true, count: next.length });
  } catch (e) {
    return json({ error: "could not delete" }, 500);
  }
}
