import { getStore } from "@netlify/blobs";

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function estilos() {
  return `
    *{box-sizing:border-box;}
    body{margin:0;background:#F7F7FB;color:#14142B;font-family:'Manrope',sans-serif;}
    .nav{padding:16px 20px;border-bottom:1px solid #EAEAF2;background:#fff;}
    .voltar{color:#5B4FE8;text-decoration:none;font-weight:700;font-size:14px;}
    .wrap{max-width:720px;margin:0 auto;padding:28px 20px 60px;}
    .capa{border-radius:18px;overflow:hidden;margin-bottom:20px;background:#EAEAF2;}
    .capa img{width:100%;display:block;}
    .tags{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
    .tag{font-family:'JetBrains Mono',monospace;font-size:11px;padding:4px 10px;border-radius:999px;border:1px solid #EAEAF2;color:#5B5B72;}
    .tag.ano{color:#B8790B;border-color:#FFE3B0;}
    .tag.fund{color:#D6336C;border-color:#FFD3E0;}
    .tag.medio{color:#048B78;border-color:#B8F0E6;}
    h1{font-family:'Baloo 2',sans-serif;font-size:28px;margin:0 0 12px;}
    .desc{font-size:15px;line-height:1.6;color:#3A3A52;margin:0 0 10px;}
    .alunos{font-size:13px;color:#9C9CB0;font-style:italic;margin:0 0 22px;}
    .galeria{display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;margin-bottom:24px;scroll-snap-type:x mandatory;}
    .galeria img{height:200px;border-radius:12px;scroll-snap-align:start;flex-shrink:0;}
    .aviso{background:#FFF4E5;color:#8A5A00;border:1px solid #FFE3B0;padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:20px;}
    .botao{display:inline-block;background:#5B4FE8;color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:12px;font-size:15px;}
    .vazio{color:#9C9CB0;font-size:14px;}
  `;
}

export default async (req, context) => {
  const { slug } = context.params;
  const base = process.env.URL || new URL(req.url).origin;

  const res = await fetch(`${base}/content/projetos.json`, { cache: "no-store" });
  const data = await res.json();
  const projeto = (data.projetos || []).find((p) => p.slug === slug);

  if (!projeto) {
    return new Response("Projeto não encontrado.", { status: 404 });
  }

  // Contabiliza o acesso, no máximo uma vez por visitante a cada 24h.
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
  const descricao = escapeHtml(projeto.descricao || "");
  const imagem = projeto.imagem || "";
  const galeria = (projeto.galeria || []).filter(Boolean);
  const urlPagina = `${base}/projetos/${slug}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titulo} — EDC: Games & Apps</title>
${descricao ? `<meta name="description" content="${descricao}">` : ""}
<meta property="og:title" content="${titulo} — EDC: Games & Apps">
${descricao ? `<meta property="og:description" content="${descricao}">` : ""}
${imagem ? `<meta property="og:image" content="${imagem}">` : ""}
<meta property="og:url" content="${urlPagina}">
<meta property="og:type" content="website">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>${estilos()}</style>
</head>
<body>
  <header class="nav"><a href="/" class="voltar">← EDC: Games &amp; Apps</a></header>
  <main class="wrap">
    ${imagem ? `<div class="capa"><img src="${imagem}" alt="${titulo}"></div>` : ""}
    <div class="tags">
      ${projeto.ano ? `<span class="tag ano">${escapeHtml(projeto.ano)}</span>` : ""}
      ${projeto.segmento ? `<span class="tag ${projeto.segmento === "Ensino Fundamental" ? "fund" : "medio"}">${escapeHtml(projeto.segmento)}</span>` : ""}
      ${projeto.serie ? `<span class="tag">${escapeHtml(projeto.serie)}</span>` : ""}
    </div>
    <h1>${titulo}</h1>
    ${descricao ? `<p class="desc">${descricao}</p>` : ""}
    ${projeto.alunos ? `<p class="alunos">Por: ${escapeHtml(projeto.alunos)}</p>` : ""}
    ${galeria.length ? `<div class="galeria">${galeria.map((src) => `<img src="${src}" alt="" loading="lazy">`).join("")}</div>` : ""}
    ${linkQuebrado ? `<p class="aviso">⚠ Este link pode estar indisponível no momento. Tente novamente mais tarde.</p>` : ""}
    ${projeto.link
      ? `<a class="botao" href="${projeto.link}" target="_blank" rel="noopener">Abrir projeto ↗</a>`
      : `<p class="vazio">Link do projeto ainda não cadastrado.</p>`}
  </main>
</body>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
};

export const config = { path: "/projetos/:slug" };
