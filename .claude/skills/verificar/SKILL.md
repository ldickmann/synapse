---
name: verificar
description: Verifica a mudança atual de ponta a ponta (lint, formatação, typecheck, padrões, build e Playwright), lê o diff, confere que nenhum teste ou limite foi afrouxado e reporta cada etapa com a evidência. Use antes de dizer que uma tarefa está pronta, antes do último commit de uma mudança em app/, componentes/, lib/, tests/ ou scripts/, e quando pedirem para verificar ou testar.
allowed-tools:
  - Bash(pnpm start --port 3100)
  - PowerShell(pnpm start --port 3100)
  - Bash(PORTA=3100 pnpm verificar:testes *)
  - Bash(PORTA=3100 pnpm verificar:screenshots *)
  - Bash(PORTA=3100 pnpm verificar:lighthouse *)
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
6. `pnpm verificar:testes`. Antes, veja se a porta 3000 está ocupada (`node -e "fetch('http://localhost:3000').then(()=>console.log('ocupada'),()=>console.log('livre'))"`). Ocupada, o Playwright reaproveitaria aquele servidor; rode pela ferramenta Bash com `PORTA=3100 pnpm verificar:testes`, e o Playwright sobe sozinho o `pnpm start --port 3100`.

## 2. Diff

Leia o diff da branch e o que está fora de commit (`git diff develop...HEAD` e `git diff`), com atenção a `tests/`, `scripts/`, `playwright.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `.prettierignore`, `package.json` e `docs/especificacao.md`. Procure, com a lista de [reference.md](reference.md):

- teste, `expect` ou critério removido; `test.skip`, `test.fixme`, `test.only` ou `expect.soft` novos;
- limite que passou a aceitar mais (bytes, fração de pixels, largura do contorno, notas do Lighthouse, quantidade de elementos), `timeout` ou `retries` maiores;
- exceção nova em `EXCECOES` ou pasta a menos em `PASTAS_DO_SITE` (`scripts/checar-padroes.ts`), ou regex que passou a pegar menos;
- `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `as any`, regra desligada no ESLint, arquivo novo em ignore (ESLint, Prettier, `exclude` do tsconfig);
- critério que mudou na especificação sem o teste mudar junto, ou o contrário.

Cada achado vai com `arquivo:linha`, o que mudou e se a especificação mudou no mesmo commit. Mudança de limite combinada com o Lucas e registrada na especificação não é afrouxamento, mas aparece no relatório.

## 3. Interface

Esta etapa roda se o diff toca `app/` ou `componentes/`. O servidor e os scripts recebem a porta de jeitos diferentes: o `next start` só lê `--port` (ou `PORT`), como no `playwright.config.ts`, e `scripts/screenshots.ts` e `scripts/lighthouse.mjs` leem `PORTA`. Os dois levam a 3100, para as capturas não fotografarem um `pnpm dev` na 3000. Os comandos com `PORTA=3100` na frente vão pela ferramenta Bash: uma regra de permissão não casa um comando com variável na frente, então esta skill libera a forma inteira, e com outra porta cada comando pede aprovação.

1. Confira que a 3100 está livre: `node -e "fetch('http://localhost:3100').then(()=>console.log('ocupada'),()=>console.log('livre'))"`. Ocupada, não encerre o que está nela: troque o número em todos os comandos abaixo.
2. Suba o build em segundo plano (ferramenta Bash com `run_in_background`): `pnpm start --port 3100`.
3. Espere a porta responder: `node -e "const f=()=>fetch('http://localhost:3100').then(()=>console.log('pronto'),()=>setTimeout(f,500));f()"`.
4. Rode as capturas na mesma porta: `PORTA=3100 pnpm verificar:screenshots`.
5. Abra cada imagem de `verificacao/screenshots/` com a ferramenta Read e descreva em uma linha o que se vê, apontando o que mudou de forma inesperada.
6. Tente `PORTA=3100 pnpm verificar:lighthouse`. Se não rodar na máquina, diga isso e que a nota vem do PageSpeed Insights no endereço publicado.
7. Pare a tarefa do servidor. No Windows isso encerra o shell, mas o `next start` continua escutando na porta; encerre-o pelo PowerShell com `Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }` e confira com o comando do passo 1 que a 3100 ficou livre.

## 4. Relatório

```text
| Etapa | Comando | Resultado | Evidência |
| Lint | pnpm lint | passou | sem erros nem avisos |
| Testes | pnpm verificar:testes | passou | <n> passed (<tempo>) |
...
```

Depois da tabela: os achados do diff (ou "nenhum teste ou limite afrouxado", com os arquivos lidos), as capturas e o Lighthouse quando rodaram, e uma linha final: "Pronto para commit" ou "Não está pronto: <o que falta>". Etapa que não rodou aparece como "não rodou", com o motivo. Nada é dado como aprovado sem a saída do comando.
