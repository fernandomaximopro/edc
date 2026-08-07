import { getStore } from "@netlify/blobs";

export default async () => {
  const cliques = getStore("edc-cliques");
  const status = getStore("edc-status");

  const [listaCliques, listaStatus] = await Promise.all([
    cliques.list(),
    status.list()
  ]);

  const cliquesOut = {};
  await Promise.all(
    listaCliques.blobs.map(async (b) => {
      const v = await cliques.get(b.key);
      cliquesOut[b.key] = parseInt(v || "0", 10);
    })
  );

  const statusOut = {};
  await Promise.all(
    listaStatus.blobs.map(async (b) => {
      statusOut[b.key] = await status.get(b.key, { type: "json" });
    })
  );

  return new Response(JSON.stringify({ cliques: cliquesOut, status: statusOut }), {
    headers: { "content-type": "application/json", "cache-control": "no-cache" }
  });
};

export const config = { path: "/api/stats" };
