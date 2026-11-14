# CLAUDE.md

Site profissional e portfólio do Lucas Elias Dickmann: uma página estática em `/` (Next.js com App Router, React e TypeScript), em português do Brasil, sem WebGL. As regras do site ficam em `docs/especificacao.md`. Antes de mexer no que uma seção cobre, leia a seção: §2 piso de qualidade, §4 desempenho, §5 critérios de aceite, §6 dados pendentes e §7 direção visual.

## Comandos

```sh
pnpm lint
pnpm formatar                 # Prettier em tudo; pnpm formatar:checar só confere, como o CI
pnpm typecheck                # next typegen && tsc --noEmit, sem precisar do build
pnpm verificar:padroes        # G21, G22 e G26 por leitura dos arquivos
pnpm build
pnpm verificar:testes         # Playwright contra pnpm start; precisa do build antes
pnpm verificar:testes tests/site.spec.ts -g "X2"   # um teste só, pelo código do critério
```

- `/verificar` roda tudo isso, lê o diff e reporta com a evidência. Rode antes de dizer que uma tarefa está pronta.
- Capturas e Lighthouse precisam de `pnpm start` rodando: `pnpm verificar:screenshots` (olhe cada imagem em `verificacao/screenshots/`) e `pnpm verificar:lighthouse`.

## Convenções que o código não mostra

- Cor só em `app/tokens.css` (G26). Os canvas leem os tokens `--color-sinapse-*` em runtime, com `getComputedStyle`; nunca um literal de cor em `.tsx` ou em `pagina.css`.
- Texto decorativo (trechos de script, bits, 0 e 1) fica em nó `aria-hidden` ou é desenhado por `content: attr(...)`, para não mudar o texto da página (X3).
- Todo efeito de hover tem `data-efeito` e um `data-ativo` que fica igual por hover e por foco de teclado, com `useAtivo()` de `componentes/ativo.ts` (X2).
- Com movimento reduzido, a página fica estática e completa (X4). Os robôs são a exceção decidida: continuam se mexendo, e por isso o G7 os mascara.
- Fatos só em `lib/`, sem visual: dado pendente é `null`, e a frase que depende dele não aparece (`linhasCondicionais()` em `lib/oferta.ts`). Nada é inventado para preencher.
- Regra que muda leva `docs/especificacao.md` e o teste que a prova no mesmo commit.

## Fluxo

- Cada tarefa numa branch `<tipo>/<assunto>` a partir de `develop`, nunca em `develop` ou `main`.
- Commits em Conventional Commits, com o tipo em inglês e a descrição em português (`fix(contato): corrige o foco do botão grande`). Tipos, escopos e quebras estão em `CONTRIBUTING.md`; o commitlint barra o que fugir do padrão.
- A tarefa termina nos commits, com a árvore limpa e um aviso ao Lucas: lista de commits, comandos de push, título e descrição sugeridos para o PR no formato de `.github/pull_request_template.md`. O `/fechar-fase` monta esse aviso.
- Push, PR, merge e release são do Lucas. O `.claude/settings.json` nega `git push`, `gh pr create`, `gh pr merge`, `gh release` e `vercel`.
- O release-please escreve o `CHANGELOG.md`, o `.release-please-manifest.json` e o `version` do `package.json`; o `pnpm-lock.yaml` só muda pelo pnpm.

## Hooks deste repositório

- Depois de cada edição, o Prettier formata o arquivo; não precisa rodar `pnpm formatar` a cada passo.
- Ao terminar uma resposta com mudança em `app/`, `componentes/`, `lib/`, `tests/` ou `scripts/`, o `Stop` roda typecheck e lint e devolve o erro. Corrija e rode de novo o comando que falhou antes de encerrar: a parada seguinte não é barrada outra vez. Se nada mudou nessas pastas desde a última verificação que passou, ele não roda.

## Armadilhas

- Windows: o `shell-emulator` do pnpm (`.npmrc` e `pnpm-workspace.yaml`) faz scripts com variável na linha, como o `analisar`, funcionarem. Num comando do PowerShell, a variável vai antes: `$env:PORTA = '3100'; pnpm verificar:testes`.
- O Playwright reaproveita o servidor que estiver na porta (`reuseExistingServer`). Com `pnpm dev` na 3000, os testes rodam contra o servidor de desenvolvimento; use outra `PORTA`.
- Os scripts `.ts` de `scripts/` rodam direto no Node (`node scripts/checar-padroes.ts`), que só remove os tipos: nada de `enum`, `namespace` ou outra sintaxe que o `erasableSyntaxOnly` recusa.
- Deploy só pelo push: a Vercel publica pela integração com o GitHub (`main` em produção, `develop` com preview fixo). Não há deploy pela linha de comando.
- O Lighthouse local costuma falhar nesta máquina. Nesse caso, a nota vem do PageSpeed Insights no endereço publicado.
