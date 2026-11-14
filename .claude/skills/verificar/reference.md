# Mapa de critério para verificação

Os critérios estão em `docs/especificacao.md` §5. Os títulos dos testes começam pelo código, então um critério roda sozinho com `pnpm verificar:testes tests/site.spec.ts -g "<código>"`. Os limites da coluna da direita são os de hoje: se o diff muda um deles, é mudança de regra e precisa estar na especificação no mesmo commit.

| Critério | O que garante                                         | Onde                                                   | Limite                                                                                                            |
| -------- | ----------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| G1       | install, lint, formatação, typecheck e build sem erro | CI (`.github/workflows/ci.yml`)                        | saída 0 em cada passo                                                                                             |
| G4       | todo link de WhatsApp igual a `linkWhatsApp()`        | `tests/site.spec.ts`                                   | pelo menos 1 link `https://wa.me/`                                                                                |
| G7       | movimento reduzido estático                           | `tests/site.spec.ts`                                   | menos de 0,5 % dos pixels diferentes em 3 s, robôs mascarados, diferença por canal acima de 16                    |
| G8       | notas, LCP, TBT e CLS                                 | `pnpm verificar:lighthouse` (`scripts/lighthouse.mjs`) | Performance 80, Acessibilidade 95, Boas práticas 90, SEO 90; LCP 2 500 ms, TBT 300 ms, CLS 0,1                    |
| G10      | orçamento de transferência e de JS em 390×844         | `tests/site.spec.ts`                                   | total 900 000 B, JS inicial 200 000 B, JS depois do HTML 350 000 B                                                |
| G11      | contraste                                             | Lighthouse, auditoria `color-contrast`                 | sem falha                                                                                                         |
| G12      | foco visível                                          | `tests/site.spec.ts`                                   | 5 elementos com `outline-width` de pelo menos 3 px e estilo diferente de `none`, em 1440                          |
| G14      | fontes servidas pelo site                             | `tests/site.spec.ts`                                   | nenhuma requisição a `fonts.googleapis.com` ou `fonts.gstatic.com`                                                |
| G15      | rolagem nativa                                        | `tests/site.spec.ts`                                   | `wheel` rola, sem `preventDefault` em `wheel` ou `touchmove`, `body` sem `overflow` `hidden` ou `clip`            |
| G19      | idioma                                                | `tests/site.spec.ts`                                   | `html[lang="pt-BR"]`                                                                                              |
| G21      | `lib/` sem visual                                     | `pnpm verificar:padroes`                               | sem `.css`, `.tsx` nem `className`                                                                                |
| G22      | padrões proibidos                                     | `pnpm verificar:padroes` e capturas                    | nenhuma violação; exceção só em `EXCECOES`                                                                        |
| G23      | LCP é texto                                           | Lighthouse                                             | elemento de LCP é o `h1`                                                                                          |
| G25      | capturas                                              | `pnpm verificar:screenshots`                           | primeira tela, pico e final em 375 e 1440, e foco em 1440, olhadas uma a uma                                      |
| G26      | cor só nos tokens                                     | `pnpm verificar:padroes`                               | nenhum literal de cor fora de `app/tokens.css`                                                                    |
| X1       | primeira tela e largura                               | `tests/site.spec.ts`                                   | em 375×667 e 390×844: monograma, `h1` e `whatsapp-hero` dentro da tela; `scrollWidth` até a largura da janela     |
| X2       | hover e foco iguais                                   | `tests/site.spec.ts`                                   | todo `[data-efeito]` com `data-ativo="true"` por hover e por Tab, em 1440                                         |
| X3       | paridade de texto                                     | `tests/site.spec.ts`                                   | texto de `main` igual nos três modos, mais de 100 caracteres, um `h1`, nenhuma palavra só na camada `aria-hidden` |
| X4       | movimento reduzido completo                           | `tests/site.spec.ts`                                   | pelo menos 3 `section`, todas visíveis sem rolar, e o mesmo texto do modo normal e da página sem JavaScript       |

Outros números que, se mudarem, afrouxam a verificação:

- `playwright.config.ts`: `timeout` de 90 s, `expect.timeout` de 10 s, sem `retries`.
- `tests/site.spec.ts`: `ENTRADA_MS` de 3 000 ms e o `timeout` de 20 s do `esperarEntrada()`.
- `scripts/checar-padroes.ts`: pastas `app`, `componentes` e `lib`; única exceção, `componentes/AssinaturaEncaixe.tsx` (fontes do G22 e G26).
