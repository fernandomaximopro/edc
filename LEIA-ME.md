# EDC: Games & Apps — guia de configuração

## O que você recebeu
- `index.html` — a página inicial inteira (hero, carrossel de fotos, mais acessados, lançamentos, catálogo com filtros e "carregar mais"), tudo em um único arquivo.
- `content/projetos.json` — onde ficam os projetos. Editado pelo painel, você nunca abre isso na mão.
- `content/config.json` — os textos e o carrossel geral de fotos. Também editado pelo painel.
- `admin/` — o painel de administração (Decap CMS). É por ali que você cadastra tudo.
- `netlify/functions/` — três arquivos que rodam sozinhos nos bastidores do Netlify: geram a página própria de cada projeto, contam os acessos e verificam os links uma vez por dia. Você não precisa entender o conteúdo deles — só saber que existem.

## Passo 1 — Repositório Git
Assim como antes, o painel `/admin` só publica se o site estiver conectado a um repositório no GitHub (ou GitLab/Bitbucket). Suba esta pasta inteira para o mesmo repositório do seu site no Netlify (ou crie um novo e conecte pelo Netlify em "Import from Git").

## Passo 2 — Identity + Git Gateway
No painel do Netlify, dentro do site:
1. **Site configuration → Identity → Enable Identity**
2. Em **Registration**, escolha **Invite only**
3. Em **Identity → Services → Git Gateway**, clique em **Enable Git Gateway**
4. Em **Identity → Invite users**, convide seu e-mail

## Passo 3 — Netlify Blobs (contador de acessos e status dos links)
Não exige nenhuma conta nova: o Netlify Blobs já vem habilitado automaticamente em sites publicados a partir de um repositório Git. Não é preciso fazer nada além do passo 1.

## Passo 4 — Publicar um projeto
Acesse `seusite.netlify.app/admin`, faça login, e em **Projetos → Lista de projetos → Add "Projetos"** preencha:
- Título, **slug** (parte do link — ex. `corrida-espacial`), descrição
- Ano letivo, segmento, série, data de publicação
- Imagem de capa e, se quiser, fotos adicionais (galeria)
- Link do projeto do aluno
- Alunos/turma — **fica a seu critério preencher ou não**, conforme a autorização de imagem de cada caso

Publique. Em cerca de 1 minuto o site atualiza, e o projeto já tem sua própria página em `seusite.netlify.app/projetos/corrida-espacial`.

## Como cada funcionalidade nova funciona
- **"Mais acessados"**: conta acessos reais a cada página de projeto (1 por visitante a cada 24h, pra evitar que recarregar a página infle o número). A seção só aparece quando já existir pelo menos 1 clique registrado.
- **Aviso de link quebrado**: uma verificação roda sozinha todo dia às 6h, testando o link de cada projeto. Se algum estiver fora do ar, aparece um aviso discreto no card — o projeto não some do site, só fica sinalizado.
- **URL própria por projeto**: cada projeto vira uma página em `/projetos/seu-slug`, pronta pra compartilhar isoladamente (WhatsApp, redes da escola) já com prévia (imagem, título e descrição) puxada automaticamente.
- **"Carregar mais"**: o catálogo mostra 9 projetos por vez; o botão carrega mais 9 a cada clique.
- **Textos editáveis**: em **Configurações do site**, no painel, dá pra mudar o título da hero, subtítulos e os nomes de cada seção sem tocar em código.
- **Campos vazios nunca aparecem em branco**: se faltar nome do aluno, imagem, link ou galeria, o site simplesmente não desenha aquele espaço — sem "buracos" ou textos tipo "undefined".

## Sobre privacidade dos alunos
Nome de aluno e fotos com identificação visual só devem entrar quando a autorização de imagem já cobrir isso — a decisão de preencher ou não cada campo é sempre sua, projeto a projeto. Para o carrossel geral de "bastidores da turma", prefira fotos que não identifiquem o aluno (mãos, telas, grupo de costas/de longe) quando não houver certeza sobre a autorização.

## Trocar para o domínio da escola (mais pra frente)
Quando a direção aprovar, é só ir em **Site configuration → Domain management → Add a domain** e seguir o passo a passo do Netlify. Não exige nenhuma mudança no site em si.

## Testar localmente antes de publicar
O site (`index.html`) abre localmente com `npx serve .`, mas o contador de acessos, a verificação de links e as páginas `/projetos/...` só funcionam depois de publicado no Netlify (dependem dos bastidores do Netlify Functions e Blobs).
