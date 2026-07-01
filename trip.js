const { connectLambda, getStore } = require("@netlify/blobs");

const STORE_NAME = "itinerary";
const KEY = "trip-edits";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

exports.handler = async (event) => {
  connectLambda(event);
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: HEADERS, body: "" };
  }

  if (event.httpMethod === "GET") {
    const data = await store.get(KEY, { type: "json" });
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(data || {}) };
  }

  if (event.httpMethod === "POST") {
    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch (err) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "Invalid JSON" }) };
    }

    if (payload.panelId === undefined || typeof payload.html !== "string") {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "Request must include panelId and html" })
      };
    }

    const existing = (await store.get(KEY, { type: "json" })) || {};
    existing[payload.panelId] = payload.html;
    existing.__updatedAt = new Date().toISOString();
    await store.setJSON(KEY, existing);

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod === "DELETE") {
    await store.delete(KEY);
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: "Method not allowed" }) };
};
