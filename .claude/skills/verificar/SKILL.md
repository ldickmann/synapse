---
name: verificar
description: Verifica a mudança atual de ponta a ponta (lint, formatação, typecheck, padrões, build e Playwright), lê o diff, confere que nenhum teste ou limite foi afrouxado e reporta cada etapa com a evidência. Use antes de dizer que uma tarefa está pronta, antes do último commit de uma mudança em app/, componentes/, lib/, tests/ ou scripts/, e quando pedirem para verificar ou testar.
allowed-tools:
  - Bash(pnpm start *)
  - PowerShell(pnpm start *)
---

# Verificar

Esta skill só verifica e reporta. Corrigir é o passo seguinte da tarefa, e depois a verificação roda de novo do começo.

## Contexto

- Branch: !`git branch --show-current`
- Fora de commit: !`git status --short`
- Commits desde develop: !`git log --oneline develop..HEAD || true`
- Arquivos mudados desde develop: !`git diff --stat develop...HEAD || true`

## 1. Comandos

Rode na ordem, um por vez, e guarde de cada um o resultado e a evidência (a linha de resumo da saída). Se um falhar, continue com os que não dependem dele; os testes dependem do build.

1. `pnpm lint`
2. `pnpm formatar:checar`
3. `pnpm typecheck`
4. `pnpm verificar:padroes`
5. `pnpm build`: confira que a rota `/` sai estática (`○`).
6. `pnpm verificar:testes`. Antes, veja se a porta 3000 está ocupada (`node -e "fetch('http://localhost:3000').then(()=>console.log('ocupada'),()=>console.log('livre'))"`). Ocupada, o Playwright reaproveitaria aquele servidor; rode com outra porta (`PORTA=3100` no bash ou `$env:PORTA = '3100'` no PowerShell).

## 2. Diff

Leia o diff da branch e o que está fora de commit (`git diff develop...HEAD` e `git diff`), com atenção a `tests/`, `scripts/`, `playwright.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `.prettierignore`, `package.json` e `docs/especificacao.md`. Procure, com a lista de [reference.md](reference.md):

- teste, `expect` ou critério removido; `test.skip`, `test.fixme`, `test.only` ou `expect.soft` novos;
- limite que passou a aceitar mais (bytes, fração de pixels, largura do contorno, notas do Lighthouse, quantidade de elementos), `timeout` ou `retries` maiores;
- exceção nova em `EXCECOES` ou pasta a menos em `PASTAS_DO_SITE` (`scripts/checar-padroes.ts`), ou regex que passou a pegar menos;
- `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `as any`, regra desligada no ESLint, arquivo novo em ignore (ESLint, Prettier, `exclude` do tsconfig);
- critério que mudou na especificação sem o teste mudar junto, ou o contrário.

Cada achado vai com `arquivo:linha`, o que mudou e se a especificação mudou no mesmo commit. Mudança de limite combinada com o Lucas e registrada na especificação não é afrouxamento, mas aparece no relatório.

## 3. Interface

Se o diff toca `app/` ou `componentes/`:

1. Suba `pnpm start` em segundo plano, numa porta livre, e rode `pnpm verificar:screenshots` com a mesma `PORTA`.
2. Abra cada imagem de `verificacao/screenshots/` com a ferramenta Read e descreva em uma linha o que se vê, apontando o que mudou de forma inesperada.
3. Tente `pnpm verificar:lighthouse`. Se não rodar na máquina, diga isso e que a nota vem do PageSpeed Insights no endereço publicado.
4. Pare o servidor.

## 4. Relatório

```text
| Etapa | Comando | Resultado | Evidência |
| Lint | pnpm lint | passou | sem erros nem avisos |
| Testes | pnpm verificar:testes | passou | <n> passed (<tempo>) |
...
```

Depois da tabela: os achados do diff (ou "nenhum teste ou limite afrouxado", com os arquivos lidos), as capturas e o Lighthouse quando rodaram, e uma linha final: "Pronto para commit" ou "Não está pronto: <o que falta>". Etapa que não rodou aparece como "não rodou", com o motivo. Nada é dado como aprovado sem a saída do comando.
