import { getStore } from "@netlify/blobs";

export default async (req) => {
  const base = process.env.URL || new URL(req.url).origin;
  const res = await fetch(`${base}/content/projetos.json`, { cache: "no-store" });
  const data = await res.json();
  const projetos = data.projetos || [];
  const store = getStore("edc-status");

  await Promise.all(
    projetos.map(async (p) => {
      if (!p.link || !p.slug) return;
      let broken = false;
      try {
        const r = await fetch(p.link, {
          method: "GET",
          redirect: "follow",
          signal: AbortSignal.timeout(8000)
        });
        broken = !r.ok;
      } catch {
        broken = true;
      }
      await store.setJSON(p.slug, { broken, checadoEm: new Date().toISOString() });
    })
  );

  return new Response("ok");
};

// Roda todo dia às 6h. O Netlify detecta e agenda isso sozinho ao publicar.
export const config = { schedule: "0 6 * * *" };
