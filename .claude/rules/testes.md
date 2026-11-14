---
paths:
  - 'tests/**'
  - 'playwright.config.ts'
  - 'scripts/**'
---

# Testes, capturas e scripts de verificação

- **Rodar.** Os testes sobem `pnpm start` sozinhos, então o build vem antes: `pnpm build && pnpm verificar:testes`. Um só: `pnpm verificar:testes tests/site.spec.ts -g "X2"`. Variáveis opcionais: `PORTA` (padrão 3000) e `WORKERS` (padrão 3).
- **Servidor reaproveitado.** O `playwright.config.ts` usa `reuseExistingServer`: se houver um `pnpm dev` ou um build velho na porta, os testes rodam contra ele. Na dúvida, use outra `PORTA` ou pare o servidor antes.
- **Um critério, um teste.** O título começa pelo código do critério de `docs/especificacao.md` §5 (`'X2: …'`), para o `-g` achar. Critério novo entra na especificação e no teste no mesmo commit, e o `reference.md` da skill `verificar` ganha a linha dele.
- **Limite não se afrouxa para passar.** Os números dos testes (900 kB, 200 kB, 350 kB, 0,5 % de pixels, 3 px, 5 elementos) vêm da especificação. Teste falhando é sinal de regressão; mudar o limite é mudar a regra, com o Lucas e com a especificação no mesmo commit. Sem `test.only`, e `test.skip` só no CI com o motivo escrito ao lado.
- **Esperar por estado, não por tempo.** Use `esperarEntrada(page)`, `toHaveAttribute`, `toBeVisible` e `expect.poll`. Um `waitForTimeout` novo só quando o intervalo é o próprio critério, como os 3 s do G7.
- **Comparação de pixels.** Com movimento reduzido os robôs continuam se mexendo (exceção do X4), então toda comparação entre capturas mascara `.sinapse-robo` e `.sinapse-operador-faisca`, como no G7.
- **Viewports.** Celular em 390×844 e 375×667, com `isMobile`, `hasTouch` e `deviceScaleFactor: 2`; desktop em 1440×900. Use as constantes `CELULAR`, `CELULAR_375` e `DESKTOP` de `tests/site.spec.ts`.
- **Saída.** Capturas e resultados vão para `verificacao/`, que fica fora do git. Captura que entra na verificação visual é aberta e olhada, uma a uma.
- **Scripts.** `scripts/*.ts` rodam com `node` direto, sem compilar: só sintaxe que o Node consegue apagar (`erasableSyntaxOnly`). Os testes importam de `lib/` com a extensão (`../lib/contato.ts`).
- **`checar-padroes.ts`.** Exceção nova vai para `EXCECOES`, com o motivo no comentário; o script imprime as exceções a cada execução.
