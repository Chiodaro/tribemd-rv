import { getStore } from "@netlify/blobs";

const STORE = "tribemd-rv";
const KEY   = "app-state";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Write-Password",
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const store = getStore({ name: STORE, consistency: "strong" });
  const json  = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  // GET: load state (public, no password needed)
  if (req.method === "GET") {
    try {
      const data = await store.get(KEY, { type: "json" });
      return json(data ?? {});
    } catch {
      return json({});
    }
  }

  // POST: save state (password-protected)
  if (req.method === "POST") {
    const pwd = req.headers.get("X-Write-Password") ?? "";
    if (pwd !== process.env.APP_WRITE_PASSWORD) {
      return json({ ok: false, error: "Senha incorreta." }, 401);
    }
    try {
      const body = await req.json();
      await store.setJSON(KEY, body);
      return json({ ok: true });
    } catch (e) {
      return json({ ok: false, error: e.message }, 500);
    }
  }

  return new Response("Method not allowed", { status: 405, headers: cors });
};

export const config = { path: "/.netlify/functions/data" };
