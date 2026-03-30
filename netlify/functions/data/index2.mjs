import { getStore } from "@netlify/blobs";

const STORE = "tribemd-rv";
const KEY = "app-state";

export default async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Write-Password",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  const store = getStore({ name: STORE, consistency: "strong" });
  if (req.method === "GET") {
    try {
      const data = await store.get(KEY, { type: "json" });
      return new Response(JSON.stringify(data ?? {}), { status: 200, headers });
    } catch { return new Response("{}", { status: 200, headers }); }
  }
  if (req.method === "POST") {
    const pwd = req.headers.get("X-Write-Password") ?? "";
    const correctPwd = Netlify.env.get("APP_WRITE_PASSWORD");
    if (!correctPwd || pwd !== correctPwd)
      return new Response(JSON.stringify({ ok: false, error: "Senha incorreta." }), { status: 401, headers });
    try {
      const body = await req.json();
      await store.setJSON(KEY, body);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers });
    }
  }
  return new Response("Method not allowed", { status: 405, headers });
};

export const config = { path: "/api/data" };
