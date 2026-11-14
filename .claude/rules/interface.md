---
paths:
  - 'app/**'
  - 'componentes/**'
---

# Interface

Vale para `app/` e `componentes/`. Cada item aponta o critério de `docs/especificacao.md` §5 e o que o prova.

- **Cor (G26).** Literal de cor (hex, `rgb()`, `hsl()`) só em `app/tokens.css`, com o prefixo `--color-sinapse-`. No CSS, use `var(--color-sinapse-…)`; no canvas, leia o token com `getComputedStyle(raiz).getPropertyValue('--color-sinapse-…')`, como `Fundo.tsx` e `Rede.tsx`. Prova: `pnpm verificar:padroes`.
- **Contraste.** Texto corrido com pelo menos 4,5:1 sobre o fundo; texto de 24 px ou mais e elementos de interface com 3:1. Cor nova entra em `tokens.css` com a razão anotada no comentário, como as que já estão lá. Prova: auditoria `color-contrast` do Lighthouse (G11).
- **Foco (G12).** Todo elemento interativo mostra contorno de pelo menos 3 px no `:focus-visible`. A regra geral está no começo de `app/pagina.css`; não a anule com `outline: none` sem pôr outro contorno de 3 px.
- **Hover e foco (X2).** Elemento com efeito leva `data-efeito`, `data-ativo={ativo ? 'true' : 'false'}` e os `props` de `useAtivo()` (`componentes/ativo.ts`), como em `BotaoWhatsApp.tsx`. O CSS do efeito usa `[data-ativo="true"]`, não `:hover` sozinho.
- **Paridade de texto (X3).** O texto de `main` fora dos nós `aria-hidden` é o mesmo no modo normal, com movimento reduzido e sem JavaScript, e há um único `h1`. O HTML do servidor já traz o texto inteiro; efeito por JavaScript não acrescenta nem tira palavra. Texto decorativo vai em nó `aria-hidden` ou em `content: attr(...)`, e cada palavra dele também existe fora da camada.
- **Movimento reduzido (X4).** Com `data-motion="reduzido"`, a página fica estática e completa: toda `section` visível sem rolar, sem sequência automática e sem inércia. O que para fica no bloco "Movimento reduzido" do fim de `app/pagina.css`. Os robôs continuam se mexendo, por decisão registrada ali. Componente novo recebe `movimento` de `Pagina.tsx` e só anima com ele `true`; `useRevelar()` já começa visível.
- **Uma sequência orquestrada por página.** Já existe: o carregamento. Movimento automático novo só é disparado por ação do visitante (toque ou passagem da rolagem) e roda uma vez.
- **Rolagem nativa (G15).** Nada de `preventDefault` em `wheel` ou `touchmove`, nem `overflow: hidden` no `body`.
- **Padrões proibidos (G22).** Inter, Roboto ou Arial; monoespaçada ou `font-mono` em rótulos; "→" em botões e links (nem em comentário, nestas pastas); rótulo em caixa alta com espaçamento de letras; numeração 01/02/03 sem sequência real; ponto médio entre metadados; uma palavra do título em itálico ou em outra cor; cards idênticos com a mesma sombra; layout de jornal com filetes. Fontes só por `next/font` em `app/layout.tsx`.
- **Celular primeiro.** Projete em 390×844 e confira 375×667, 768 e 1440. A primeira tela mostra monograma, `h1` e o botão de WhatsApp sem rolar, sem rolagem horizontal (X1).

Mudou a interface: rode `pnpm verificar:screenshots` com `pnpm start` rodando e olhe cada captura de `verificacao/screenshots/`.
