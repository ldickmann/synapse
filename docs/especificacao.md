# Especificação do site

O que a página precisa fazer, o piso de qualidade, os limites de desempenho, os critérios de aceite com a verificação de cada um e a direção visual. Quando uma regra muda, este arquivo e o teste que a prova mudam no mesmo PR.

## 1. Objetivo, públicos e ação principal

**Objetivo.** Ser o site profissional e o portfólio do Lucas e fazer quem chega querer conversar com ele.

**Públicos.**

- Dono ou responsável por negócio local (comércio, serviço, clínica, pousada, oficina, restaurante), em geral sem conhecimento técnico, que abre o link no celular, muitas vezes vindo do WhatsApp. É o público que guiou o conteúdo até aqui.
- Quem avalia o trabalho do Lucas como desenvolvedor front-end. O conteúdo para esse público (stack, trajetória, GitHub, LinkedIn e e-mail) ainda não existe e está no backlog.

**Ação principal.** Abrir uma conversa no WhatsApp com a mensagem pronta. O botão aparece na primeira tela e no contato, no fim da página. É um link comum, então funciona sem JavaScript e com movimento reduzido.

**Fatos da oferta.** Ficam só em `lib/` (`marca.ts`, `oferta.ts`, `contato.ts` e `trabalhos.ts`); o tom fica nos textos da página, em `lib/texto.ts`.

| Fato                                      | Valor                                                                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Nome                                      | Lucas Elias Dickmann                                                                                              |
| Profissão                                 | Desenvolvedor front-end                                                                                           |
| Cidade                                    | Navegantes, SC                                                                                                    |
| O que vende                               | Site institucional ou landing page; sistema ou painel sob medida; manutenção e evolução de site que já existe     |
| Região                                    | Navegantes e região, com atendimento presencial; à distância para todo o Brasil                                   |
| Atendimento                               | Direto, sem intermediário: quem conversa é quem constrói                                                          |
| Reunião presencial                        | Sim, em Navegantes e região                                                                                       |
| Preço e prazo                             | Não aparecem na página                                                                                            |
| Anos de experiência e formação            | Pendentes (§6); até lá, a frase que depende deles não aparece                                                     |
| Contato                                   | `https://wa.me/<55 + DDD + número>?text=<mensagem codificada>`, montado por `linkWhatsApp()`                      |
| Mensagem pronta                           | `Oi Lucas, vi seu site e quero conversar sobre um site para meu negócio.`                                         |
| Depoimentos, clientes, números, garantias | Não entram. Nada inventado.                                                                                       |
| Trabalhos                                 | Os que o Lucas libera, em `lib/trabalhos.ts`; só os que têm link aparecem (`TRABALHOS_REAIS`) e abrem em aba nova |

**Identidade.** Monograma DLK em SVG: a logo em três peças preenchidas (L, D e K), definida em `lib/marca.ts`, com as cores nos tokens `--color-sinapse-logo-*`. Aparece no cabeçalho, ao lado do nome, e em Quem faz. A mesma logo está no favicon e nos ícones de `app/` (`favicon.ico`, `icon0.svg`, `icon1.png` e `apple-icon.png`, pelas convenções de arquivo do Next) e nos dois ícones de `public/` que o manifesto (`app/manifest.json`) aponta.

## 2. Piso de qualidade

- Celular primeiro: tudo projetado em 390×844 e expandido para 768 e 1440. Sem rolagem horizontal.
- Primeira tela, sem rolar, em 390×844 e em 375×667: monograma, h1 com o que o Lucas oferece e botão de WhatsApp (X1).
- Contraste mínimo de 4,5:1 em texto corrido e de 3:1 em texto de 24 px ou mais e em elementos de interface. Os pares aprovados estão anotados em `app/tokens.css`.
- Foco visível em todo elemento interativo, com contorno de pelo menos 3 px (G12).
- Todo efeito de hover tem o mesmo estado por foco de teclado (X2).
- Movimento reduzido: a página fica estática e completa, sem sequência automática e sem inércia, com a exceção dos robôs (X4).
- Movimento automático: no máximo uma sequência orquestrada por página, sempre disparada por ação do visitante (toque ou passagem da rolagem) e executada uma vez.
- Paridade de texto: o texto de `main`, sem os nós `aria-hidden`, é o mesmo no modo normal, com movimento reduzido e sem JavaScript, e há um único `h1` (X3).
- Cor só em `app/tokens.css` (G26).
- Fontes servidas pelo próprio site, por `next/font` (G14).
- Rolagem nativa, sem sequestro de `wheel` ou `touchmove` (G15).
- Áudio: nenhum.
- Padrões proibidos: fundo creme com serifa e acento terracota; near-black com acento verde-ácido; layout de jornal com filetes; cards idênticos com a mesma sombra; rótulo em caixa alta acima de título; numeração 01/02/03 sem sequência real; uma palavra do título em itálico ou em outra cor; metadados separados por ponto médio; "→" em botões; monoespaçada em rótulos; Inter, Roboto ou Arial (G22).
- Texto em português do Brasil, com frases curtas, sem jargão, sem exagero e sem promessa que o Lucas não fez.

## 3. Stack

- Next.js com App Router, React e TypeScript. A página é estática (`○` no `next build`), exportada para `out/` (`output: 'export'`), a pasta que o Cloudflare Pages publica. Nada que precise de servidor.
- CSS próprio em `app/pagina.css`, com os tokens em `app/tokens.css`. O Tailwind 4 entra só pelo preflight do `app/globals.css`; tirá-lo está no backlog.
- Fontes por `next/font/google`, servidas pelo próprio site.
- Animação com CSS, SVG e canvas 2D, sem biblioteca. Nada de WebGL.
- Verificação: ESLint, Prettier, Playwright no Chromium, Lighthouse e `@next/bundle-analyzer`.
- pnpm, na versão do `packageManager` do `package.json`; Node na versão do `engines` e do `.nvmrc`.
- Versões exatas, sem `^` (`save-exact` no `.npmrc`), atualizadas pelo Dependabot. O pnpm só instala versão publicada há mais tempo que o `minimumReleaseAge`, declarado no `pnpm-workspace.yaml`: 1440 minutos (um dia), em modo não estrito (`minimumReleaseAgeStrict: false`).
- Pacote novo só com motivo escrito no commit. Ficam fora GSAP, Lenis, bibliotecas de 3D e CDN de fontes.
- O projeto roda em Windows: o `.npmrc` liga o `shell-emulator`, para os scripts com variável de ambiente na linha (como o `analisar`) funcionarem.

## 4. Desempenho no celular

**Aparelho de referência.** Android intermediário de 2021–2022 (classe Moto G ou Galaxy A3x).

| Medida                                                 | Limite                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| Lighthouse mobile (simulado, CPU 4× mais lenta)        | Performance ≥ 80; Acessibilidade ≥ 95; Boas práticas ≥ 90; SEO ≥ 90 |
| LCP, TBT e CLS (Lighthouse)                            | ≤ 2,5 s, ≤ 300 ms e ≤ 0,1                                           |
| Elemento de LCP (Lighthouse)                           | o `h1`                                                              |
| JS inicial, referenciado no HTML (Playwright, 390×844) | ≤ 200 kB codificado                                                 |
| JS carregado depois do HTML                            | ≤ 350 kB codificado                                                 |
| Transferência total da página                          | ≤ 900 kB                                                            |

**Como medir.**

1. `pnpm build && pnpm start` (porta 3000, ou a da variável `PORTA` nos scripts). O `pnpm start` serve `out/` (`scripts/servir.ts`), com gzip e os cabeçalhos de `public/_headers`.
2. `pnpm verificar:lighthouse`: `scripts/lighthouse.mjs` roda `lighthouse http://localhost:3000/ --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate --throttling.cpuSlowdownMultiplier=4 --only-categories=performance,accessibility,best-practices,seo --output=json --output=html --output-path=verificacao/lighthouse --chrome-flags=--headless`, imprime a tabela de notas e sai com 1 se algum limite falhar. Se o Lighthouse não rodar na máquina, a nota vem do PageSpeed Insights no endereço publicado.
3. `pnpm verificar:testes`: o G10 soma o que a página baixa em 390×844.
4. `pnpm analisar`: relatório do bundle analyzer em `.next/analyze/`, para achar o que pesa.

## 5. Critérios de aceite

Cada critério tem a verificação que o prova, agrupado aqui pelo comando que roda essa verificação. Os títulos dos testes começam pelo código do critério; para rodar um só: `pnpm verificar:testes tests/site.spec.ts -g "X2"`.

**No CI**, a cada PR:

- **G1.** `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm formatar:checar`, `pnpm typecheck` e `pnpm build` terminam sem erro.

**Nos testes do Playwright** (`pnpm verificar:testes`, `tests/site.spec.ts`, contra `pnpm start`):

- **G4.** Todo link de WhatsApp (`a[href^="https://wa.me/"]`) é igual a `linkWhatsApp()`, e há pelo menos um.
- **G7.** Com movimento reduzido, a página marca `data-motion="reduzido"`, e duas capturas com 3 s de intervalo depois da carga diferem em menos de 0,5 % dos pixels, com os robôs mascarados (X4).
- **G10.** Transferência e JS dentro dos limites do §4, somando o `transferSize` das respostas em 390×844.
- **G12.** Foco visível: depois de `Tab` repetido, cada um de 5 elementos focados mostra contorno de pelo menos 3 px, em 1440.
- **G14.** Nenhuma requisição a `fonts.googleapis.com` ou `fonts.gstatic.com`.
- **G15.** `mouse.wheel(0, 600)` altera `window.scrollY`; nenhum listener de `wheel` ou `touchmove` chama `preventDefault`; o `body` não tem `overflow: hidden`.
- **G19.** `html[lang="pt-BR"]`. Que todo o texto visível está em português se confere nas capturas.
- **G27.** Um script de `/_next/static` sai com `Cache-Control: public, max-age=31536000, immutable`, de `public/_headers`, e uma rota que não existe (`/nao-existe`) responde 404 com o `404.html` da exportação. Sem o `404.html`, o Cloudflare Pages trataria o site como SPA e serviria `/` em qualquer caminho; o `pnpm start` (`scripts/servir.ts`) faz o mesmo.
- **G28.** O `<head>` aponta `favicon.ico`, `icon0.svg`, `icon1.png`, `apple-icon.png` e o manifesto (`/manifest.json`), comparados pelo caminho, sem a query de hash do Next. Cada um responde 200 com o tipo certo. O manifesto traz o `NOME_COMPLETO` de `lib/marca.ts` e os dois ícones de `public/`, que também respondem 200. O `icon0.svg` não tem `<metadata>`: o gerador do favicon põe ali o crédito dele e as credenciais C2PA do SVG de origem, 15 kB que a aba não usa.
- **X1.** Em 375×667 e 390×844 não há rolagem horizontal, e monograma, h1 e botão de WhatsApp aparecem sem rolar.
- **X2.** Todo elemento com efeito (`data-efeito`) chega ao mesmo estado (`data-ativo="true"`) por hover e por foco, em 1440.
- **X3.** Paridade de texto (§2), comparando o modo normal, o movimento reduzido e a página sem JavaScript, e todo texto decorativo `aria-hidden` também existe fora dele.
- **X4.** Com movimento reduzido, a página fica estática e completa: todas as `section` visíveis antes de rolar e o mesmo texto do modo normal. Os robôs continuam se mexendo (poses, piscada, passeio na barra, operador, aceno), porque são quadros discretos de poucos pixels; param a sequência de carregamento, o marquee, a varredura, a digitação dos trechos e as entradas de texto.

**Na leitura dos arquivos** (`pnpm verificar:padroes`, `scripts/checar-padroes.ts`), em `app/`, `componentes/` e `lib/`:

- **G21.** `lib/` não contém `.css`, `.tsx` nem `className`: só dados e funções, sem visual.
- **G22.** Padrões proibidos do §2 ausentes: sem Inter, Roboto ou Arial; sem `font-mono` em rótulos; sem "→" em botões e links; sem caixa alta com espaçamento de letras em rótulos; sem numeração 01/02/03; sem ponto médio (`·`) em texto. O resto da lista se confere nas capturas.
- **G26.** Nenhum literal de cor (hex, `0xRRGGBB`, `rgb()`, `hsl()` ou `new Color('…')`) fora de `app/tokens.css`. Os canvas leem as cores dos tokens em runtime.

**No Lighthouse** (`pnpm verificar:lighthouse`, contra `pnpm start`):

- **G8.** Notas, LCP, TBT e CLS dentro dos limites do §4.
- **G11.** A auditoria `color-contrast` passa sem falhas.
- **G23.** O LCP é texto: o elemento de LCP é o `h1`.

**Nas capturas** (`pnpm verificar:screenshots`, em `verificacao/screenshots/`):

- **G25.** Primeira tela, pico (serviços no alto da tela) e final, em 375 e 1440, e foco em 1440. Mudança de interface se confere olhando cada uma.

A assinatura de autoria (`componentes/AssinaturaStory.tsx`, estilo Story) é autocontida, com paleta e fontes próprias, e fica fora das fontes do G22 e do G26 por exceção declarada em `scripts/checar-padroes.ts`, impressa a cada execução. O `app/icon0.svg` e o `app/manifest.json` ficam fora do G26 pela mesma via: são a arte e as cores do ícone da marca, e o manifesto não lê CSS. O "Developer" da assinatura, marcado com `lang="en"`, é a única exceção ao G19, que pede texto visível em português.

Os códigos que faltam na lista não são usados: G2 (índice das rotas), G3 (coberto pelo X1), G5 e G6 (versão sem WebGL), G9 e G24 (FPS da cena 3D), G16 e G17 (dica inativa e botão fixo) e G18 e G20 (comparação entre rotas). O G13 (imagem de prévia de 1200×630) volta com `app/opengraph-image.tsx`, que está no backlog.

## 6. Dados pendentes

| Dado                                                 | Onde entra                                  | Até lá                                                                                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Número definitivo do WhatsApp (55 + DDD + número)    | `lib/contato.ts` (`NUMERO_WHATSAPP`)        | o número atual; o link é montado igual                                                                                                                                   |
| Anos de experiência                                  | `lib/oferta.ts` (`ANOS_EXPERIENCIA`)        | `null`; a frase não aparece                                                                                                                                              |
| Formação ou certificação                             | `lib/oferta.ts` (`FORMACAO`)                | `null`; a frase não aparece                                                                                                                                              |
| Confirmação das duas últimas respostas das perguntas | `lib/oferta.ts` (`PERGUNTAS`)               | entram como estão escritas; saem se o Lucas não confirmar                                                                                                                |
| Trabalhos (imagem 4:3, nome, tipo e link)            | `lib/trabalhos.ts` e `public/trabalhos/`    | um real (Mãos de Tesoura) e dois reservados, que não aparecem                                                                                                            |
| Título definitivo da página                          | `lib/metadados.ts`                          | título provisório com o nome completo                                                                                                                                    |
| Domínio próprio                                      | `NEXT_PUBLIC_SITE_URL` (ver `.env.example`) | o endereço `https://dlk-systems.pages.dev`, em `NEXT_PUBLIC_SITE_URL` nas variáveis de produção do Cloudflare Pages; nos previews, o `CF_PAGES_URL` (`lib/metadados.ts`) |

Dado pendente é `null` em `lib/`, e o texto que depende dele não é renderizado (`linhasCondicionais()` em `lib/oferta.ts`). Nada é inventado para preencher o espaço.

## 7. Direção visual: Sinapse

Criada em 2026-10-10. O foco é layout, design, UI e UX, com micro-interações no centro.

**Modelo.** [meesverberne.com](https://meesverberne.com/): nome gigante, marquee, bloco "sobre" com coordenadas e telefone, título de trabalhos com letras espalhadas ("W O RK") e contato em pedaços ("C ON NECT"). No lugar dos pássaros do modelo entram mini IAs em pixel art, trechos de script, binários e redes neurais.

**Técnica.** Sem WebGL: CSS, SVG e canvas 2D. O invólucro (`componentes/Pagina.tsx`) fica sempre em `data-render="css"`, com `data-motion` (`"normal"` ou `"reduzido"`) e `data-pronto` (`true` depois da hidratação, quando entram os canvas e os efeitos por JavaScript). O HTML do servidor já traz o texto inteiro e o quadriculado em CSS.

**Paleta** (`app/tokens.css`, única fonte de cor do site). Tirada da nebulosa de Carina vista pelo Webb, no ponto mais forte de cada região da imagem. O fundo é o céu escuro, não a poeira clara. Todos os nomes levam o prefixo `--color-sinapse-`.

| Grupo        | Tokens                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Céu          | `fundo-baixo` #04101d, `fundo` #071a30, `fundo-alto` #0f3a5c, `ceu` #1f7fb0, `azul` #5ad2f0 (névoa ciano), `linha` #1d5a85, `poeira` #8aa0b8 |
| Crista       | `acento` #ff8a2a (7,2:1 no fundo), `brasa` #d9471a, `pessego` #ffb37a, `dourado` #ffd166, `rosa` #ff6b9d, `estrela` #fff6e0                  |
| Poeira densa | `ferrugem` #7a2e18 (contato), `marrom` #2e1912 (rodapé)                                                                                      |
| Texto        | `texto` #fff1d6 (15:1 no fundo), `texto-suave` #d9b88a (9:1)                                                                                 |

**Movimento.** `--ease-sinapse-pulso` (`cubic-bezier(0.2, 0.9, 0.3, 1)`) e `--ease-sinapse-pixel` (`steps(6, end)`); 140 ms em hover e foco, 420 ms para revelar e abrir, 1 300 ms no carregamento. Raios: 0 nos pixels e 2 px nos botões.

**Fontes.** Archivo Black no display (só o peso 400) e Space Grotesk no texto e nos trechos de script (400, 500 e 700), por `next/font/google` no `app/layout.tsx`.

**Seções, na ordem.** Textos em `lib/texto.ts`; fatos nos outros arquivos de `lib/`.

1. **Carregamento:** sequência só em CSS ("iniciando sinapses") que vem no HTML, roda uma vez e some sozinha. É `aria-hidden` e não aparece com movimento reduzido.
2. **Cabeçalho fixo:** monograma, nome, navegação por âncoras (Serviços, Trabalhos, Quem, Perguntas, Contato) e uma mini IA que passeia pela barra.
3. **Hero (`#topo`):** o nome completo gigante, uma palavra por linha (abreviado, no máximo, para "Lucas E. Dickmann"), que decodifica de 0 e 1 para as letras. Depois, o marquee de papéis, o h1 `Faço o site do seu negócio em Navegantes.`, o apoio e o botão de WhatsApp.
4. **Serviços (`#servicos`):** título gigante, os três serviços, uma frase gigante do atendimento e a rede neural em canvas (16 entradas, duas camadas ocultas de 28 neurônios, três saídas). Uma onda de ativação atravessa a rede a cada 2,6 s, e passar sobre um serviço força a saída dele a vencer. Um robô operador caminha até a rede e a liga com uma batidinha.
5. **Trabalhos (`#trabalhos`):** "T RA BA LHOS" em pedaços, como o "W O RK" do modelo. Os trabalhos de `TRABALHOS_REAIS` abrem em aba nova.
6. **Quem faz (`#quem`):** texto de `lib/`, as coordenadas de Navegantes, o telefone formatado, trechos de script, uma faixa de bits e um pente de memória RAM cujas células acendem em leitura e escrita.
7. **Perguntas (`#perguntas`):** as de `lib/oferta.ts`.
8. **Contato (`#contato`):** "C ON TATO" em três pedaços que chegam em tempos diferentes, o texto de contato e o botão grande de WhatsApp. O rodapé fica fora de `main`.

**Fundo.** A nebulosa em pixels num canvas 2D: céu marinho com estrelas em cima, azul aberto no meio e, embaixo, a crista de poeira desenhada por ruído em blocos, igual em toda visita. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro e apagam em meio segundo. Sem laço de animação quando não há faísca.

**Texto decorativo.** Trechos de script, bits, endereços da memória e as camadas que ciclam 0 e 1 são `aria-hidden` ou desenhados por `content: attr(...)`, para não entrarem na paridade de texto (X3). Os robôs são SVG de 12×14 células com cor por `currentColor` e trocam de pose em quadros segurados por tempos desiguais, sem interpolação, como o pássaro do modelo.

**Pedido do Lucas.** Criatividade e detalhe nas transições, nos carregamentos e nas interações: "expressivo, interativo e harmônico".
