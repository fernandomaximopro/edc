// EDC: Games & Apps — funções compartilhadas entre index.html e catalogo.html

const ORDEM_SERIE = ['8º ano', '9º ano', '1ª série', '2ª série', '3ª série', 'Não se aplica'];

function escapeHtml(s){
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Formatação leve e segura: primeiro escapa tudo, depois libera só negrito, itálico e links.
function formatarTexto(md){
  if (!md) return '';
  let s = escapeHtml(md);
  s = s.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.split(/\n{2,}/).map(par => `<p>${par.replace(/\n/g, '<br>')}</p>`).join('');
  return s;
}

// Versão sem formatação, cortada, para os cards (resumo curto).
function resumirTexto(md, limite = 90){
  if (!md) return '';
  const plano = String(md).replace(/[*_#>\[\]()]/g, '').replace(/\s+/g, ' ').trim();
  return plano.length > limite ? plano.slice(0, limite).trim() + '…' : plano;
}

function aplicarTema(tema){
  document.documentElement.setAttribute('data-tema', tema || 'indigo');
}

async function carregarDados(){
  const [projetosRes, configRes, statsRes] = await Promise.allSettled([
    fetch('/content/projetos.json', { cache: 'no-store' }).then(r => r.json()),
    fetch('/content/config.json', { cache: 'no-store' }).then(r => r.json()),
    fetch('/api/stats', { cache: 'no-store' }).then(r => r.json())
  ]);
  return {
    projetos: projetosRes.status === 'fulfilled' ? (projetosRes.value.projetos || []) : [],
    config: configRes.status === 'fulfilled' ? configRes.value : {},
    cliques: statsRes.status === 'fulfilled' ? (statsRes.value.cliques || {}) : {},
    status: statsRes.status === 'fulfilled' ? (statsRes.value.status || {}) : {}
  };
}

function criarAppCard(p, status, { badge } = {}){
  const tpl = document.getElementById('tpl-app-card');
  const node = tpl.content.cloneNode(true);
  const a = node.querySelector('.app-card');
  a.href = `/projetos/${p.slug}`;

  const img = node.querySelector('.app-icone img');
  if (p.imagem){ img.src = p.imagem; img.alt = p.titulo || ''; }
  else { img.remove(); }

  if (badge){
    const b = node.querySelector('.app-badge');
    b.hidden = false;
    b.textContent = badge;
  }

  node.querySelector('.app-titulo').textContent = p.titulo || 'Projeto sem título';

  const serieTag = node.querySelector('.app-tag');
  if (p.serie){
    serieTag.textContent = p.serie;
    const classe = p.segmento === 'Ensino Fundamental' ? 'fund' : p.segmento === 'Ensino Médio' ? 'medio' : 'na';
    serieTag.classList.add(classe);
  } else {
    serieTag.remove();
  }

  const chip = node.querySelector('.app-chip');
  if (p.categoria){
    chip.textContent = p.categoria;
    chip.classList.add(p.categoria === 'Jogos' ? 'jogo' : 'app');
  } else {
    chip.remove();
  }

  const info = status[p.slug];
  if (info && info.broken){
    node.querySelector('.app-aviso').hidden = false;
  } else {
    node.querySelector('.app-aviso').remove();
  }

  return node;
}
