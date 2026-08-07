import { getStore } from "@netlify/blobs";

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function formatarTexto(md = "") {
  let s = escapeHtml(md);
  s = s.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return s.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
}

export default async (req, context) => {
  const { slug } = context.params;
  const base = process.env.URL || new URL(req.url).origin;

  const [resProjetos, resConfig] = await Promise.all([
    fetch(`${base}/content/projetos.json`, { cache: "no-store" }),
    fetch(`${base}/content/config.json`, { cache: "no-store" })
  ]);
  const data = await resProjetos.json();
  const config = await resConfig.json().catch(() => ({}));
  const projeto = (data.projetos || []).find((p) => p.slug === slug);

  if (!projeto) {
    return new Response("Projeto não encontrado.", { status: 404 });
  }

  try {
    const ip = context.ip || "anon";
    const dia = new Date().toISOString().slice(0, 10);
    const vistos = getStore("edc-vistos");
    const chave = `${slug}:${ip}:${dia}`;
    const jaContado = await vistos.get(chave);
    if (!jaContado) {
      await vistos.set(chave, "1");
      const cliques = getStore("edc-cliques");
      const atual = parseInt((await cliques.get(slug)) || "0", 10);
      await cliques.set(slug, String(atual + 1));
    }
  } catch {
    // Nunca deixa a contagem quebrar a exibição da página.
  }

  let linkQuebrado = false;
  try {
    const status = getStore("edc-status");
    const info = await status.get(slug, { type: "json" });
    linkQuebrado = info?.broken === true;
  } catch {}

  const titulo = escapeHtml(projeto.titulo || "Projeto");
  const descricaoPlana = (projeto.descricao || "").replace(/[*_#>\[\]()]/g, "").slice(0, 160);
  const imagem = projeto.imagem || "";
  const galeria = (projeto.galeria || []).filter(Boolean);
  const urlPagina = `${base}/projetos/${slug}`;
  const tema = config.tema || "indigo";

  const classeSegmento =
    projeto.segmento === "Ensino Fundamental" ? "fund" :
    projeto.segmento === "Ensino Médio" ? "medio" : "na";
  const classeCategoria = projeto.categoria === "Jogos" ? "jogo" : "app";

  const html = `<!DOCTYPE html>
<html lang="pt-BR" data-tema="${tema}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titulo} — EDC: Games & Apps</title>
${descricaoPlana ? `<meta name="description" content="${escapeHtml(descricaoPlana)}">` : ""}
<meta property="og:title" content="${titulo} — EDC: Games & Apps">
${descricaoPlana ? `<meta property="og:description" content="${escapeHtml(descricaoPlana)}">` : ""}
${imagem ? `<meta property="og:image" content="${imagem}">` : ""}
<meta property="og:url" content="${urlPagina}">
<meta property="og:type" content="website">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}/assets/styles.css">
<style>
  .wrap-projeto{ max-width: 720px; margin: 0 auto; padding: 28px 20px 60px; }
  .capa{ border-radius: 18px; overflow: hidden; margin-bottom: 20px; background: var(--line); }
  .capa img{ width:100%; display:block; }
  .tags{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom: 12px; }
  .tag{ font-family:'JetBrains Mono',monospace; font-size:11px; padding:4px 10px; border-radius:999px; border:1px solid var(--line); color: var(--ink-dim); }
  h1{ font-family:'Baloo 2',sans-serif; font-size:28px; margin: 0 0 12px; }
  .desc{ font-size:15px; line-height:1.6; color: var(--ink-dim); margin: 0 0 10px; }
  .desc p{ margin: 0 0 10px; }
  .alunos{ font-size:13px; color: var(--ink-faint); font-style: italic; margin: 0 0 22px; }
  .galeria{ display:flex; gap:10px; overflow-x:auto; padding-bottom:8px; margin-bottom:24px; }
  .galeria img{ height:200px; border-radius:12px; flex-shrink:0; }
  .aviso{ background: var(--warn-bg); color: var(--warn); padding:10px 14px; border-radius:10px; font-size:13px; margin-bottom:20px; }
  .vazio{ color: var(--ink-faint); font-size: 14px; }
</style>
</head>
<body>
  <header class="site-nav"><div class="wrap nav-inner"><a href="/" class="voltar">← EDC: Games &amp; Apps</a></div></header>
  <main class="wrap-projeto">
    ${imagem ? `<div class="capa"><img src="${imagem}" alt="${titulo}"></div>` : ""}
    <div class="tags">
      ${projeto.ano ? `<span class="tag">${escapeHtml(projeto.ano)}</span>` : ""}
      ${projeto.segmento ? `<span class="tag app-tag ${classeSegmento}" style="border:1px solid var(--line);">${escapeHtml(projeto.segmento)}</span>` : ""}
      ${projeto.serie ? `<span class="tag">${escapeHtml(projeto.serie)}</span>` : ""}
      ${projeto.categoria ? `<span class="app-chip ${classeCategoria}">${escapeHtml(projeto.categoria)}</span>` : ""}
    </div>
    <h1>${titulo}</h1>
    ${projeto.descricao ? `<div class="desc">${formatarTexto(projeto.descricao)}</div>` : ""}
    ${projeto.alunos ? `<p class="alunos">Por: ${escapeHtml(projeto.alunos)}</p>` : ""}
    ${galeria.length ? `<div class="galeria">${galeria.map((src) => `<img src="${src}" alt="" loading="lazy">`).join("")}</div>` : ""}
    ${linkQuebrado ? `<p class="aviso">⚠ Este link pode estar indisponível no momento. Tente novamente mais tarde.</p>` : ""}
    ${projeto.link
      ? `<a class="btn-primario" href="${projeto.link}" target="_blank" rel="noopener">Abrir projeto ↗</a>`
      : `<p class="vazio">Link do projeto ainda não cadastrado.</p>`}
  </main>
</body>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
};

export const config = { path: "/projetos/:slug" };
