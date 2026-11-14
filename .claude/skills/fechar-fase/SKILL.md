---
name: fechar-fase
description: Fecha a tarefa da branch atual sem publicar nada. Confere a árvore limpa e que a branch sai do develop atual, roda o /verificar, confere o padrão de todos os commits e escreve o aviso final ao Lucas com a lista de commits, os comandos de push e o título e a descrição sugeridos para o PR. Com main, prepara o PR de develop para main com o trecho do CHANGELOG.
disable-model-invocation: true
argument-hint: '[develop|main]'
allowed-tools:
  - Bash(pnpm exec commitlint *)
  - PowerShell(pnpm exec commitlint *)
  - Bash(git fetch origin)
  - PowerShell(git fetch origin)
  - Bash(git switch develop)
  - PowerShell(git switch develop)
  - Bash(git merge --ff-only origin/develop)
  - PowerShell(git merge --ff-only origin/develop)
  - Bash(git switch -)
  - PowerShell(git switch -)
---

# Fechar a fase

Destino do PR: `$ARGUMENTS` (vazio vale `develop`).

Esta skill não faz push, não abre PR e não roda `gh pr create`: isso é do Lucas. Depois do aviso, a sessão para.

## Destino develop

1. **Branch.** Branch atual: !`git branch --show-current`. Se for `develop` ou `main`, pare e diga que a tarefa precisa de uma branch `<tipo>/<assunto>`.
2. **Árvore limpa.** `git status --short` precisa sair vazio. Se não sair, liste os arquivos e pare: o que entra em commit é decisão da tarefa.
3. **Base.** A lista de commits, o commitlint e o PR partem de `develop`, então a branch precisa sair do `develop` atual e de nenhuma outra branch ainda aberta. Se uma das conferências abaixo falhar, pare antes de listar commits ou de rodar a verificação, e explique o que falta.
   1. `git fetch origin` traz o estado do GitHub. Se `git rev-list --count develop..origin/develop` passa de 0, o `develop` local ficou para trás: atualize com `git switch develop && git merge --ff-only origin/develop` e volte com `git switch -`.
   2. `git merge-base --is-ancestor develop HEAD` confirma que a branch sai do `develop` atual. Se falhar, o `develop` andou depois que a branch nasceu, em geral porque a branch de baixo de uma pilha entrou por squash, com outro hash. Aí `develop..HEAD` listaria commits que já estão em `develop`, e o PR levaria tudo de novo. Explique que a branch precisa ser reempilhada sobre o `develop` atualizado: `git rebase develop` se ela saiu direto dele, ou `git rebase --onto develop <último commit da branch de baixo>` se estava empilhada. Rebase reescreve o histórico e só acontece com o Lucas pedindo; depois dele, o /fechar-fase roda de novo.
   3. `git for-each-ref --merged HEAD --no-merged develop --format='%(refname:short)' refs/heads` lista as branches locais contidas nesta que ainda não entraram em `develop`. Se aparecer outra além da atual, esta está empilhada sobre ela, e o PR para `develop` levaria os commits dela. Explique que o PR da branch de baixo vem primeiro; depois do merge dele, vale o passo anterior. A lista não pega a branch de baixo que ganhou commits depois que esta saiu dela: se `git log --oneline develop..HEAD` mostra commits que não são desta tarefa, pare do mesmo jeito.
4. **Verificação.** Rode a skill `verificar` do começo ao fim. Se alguma etapa falhar ou houver teste afrouxado, pare e reporte, sem escrever o aviso.
5. **Commits no padrão.** `pnpm exec commitlint --from develop --to HEAD --verbose` confere cada mensagem. Commit fora do padrão vai para o aviso como pendência; não reescreva o histórico sem o Lucas pedir.
6. **Título do PR.** Vira a mensagem do squash em `develop` e entra no CHANGELOG, então resume a branch inteira: `<tipo>(<escopo>): <descrição>`, até 100 caracteres, com o tipo que mais pesa na versão (`feat` antes de `fix` e `perf`, que vêm antes dos outros) e o ponto de exclamação antes dos dois-pontos se algum commit quebra algo (ver `CONTRIBUTING.md`).
7. **Aviso.** Escreva, nesta ordem:

````markdown
Branch `<branch>` pronta, com a árvore limpa. Nada foi publicado.

**Commits** (`git log --oneline develop..HEAD`):
<a lista, como o git imprime>

**Verificação:** <uma linha por etapa do /verificar, com a evidência>

**Push:**

```sh
git push -u origin <branch>
```

**PR para `develop`** (squash):

Título: `<tipo>(<escopo>): <descrição>`

Descrição:

```markdown
## O que muda

<o que e por quê, em poucas frases; Closes #N se houver issue>

## Como verificar

<passos para conferir na página ou no terminal>

## Checklist

- [x] O título segue o padrão de commits.
- [ ] O CI passa (install, auditoria, lint, formatação, padrões, typecheck, build e Playwright).
- [ ] Se a interface mudou: capturas de `/` em 375 e 1440 conferidas (`pnpm verificar:screenshots`) e console sem erro.
- [ ] Se uma regra mudou: `docs/especificacao.md` e testes atualizados juntos.
```
````

O checklist é o de `.github/pull_request_template.md`, com os itens e a ordem dele. Marque só o que tem evidência nesta sessão. O item do CI fica desmarcado: o CI só roda depois do push, e o Lucas marca quando o check `ci` passar; a verificação local já está no aviso. Item que não se aplica fica marcado com "(não se aplica)".

## Destino main

O PR de `develop` para `main` leva uma versão para produção, com merge commit. Ele só vem depois do merge do PR de versão do release-please em `develop`.

1. `git fetch origin --tags` traz o estado do GitHub. É só leitura.
2. Confira que o último commit de `origin/develop` é o `chore(release): versão X.Y.Z` e que a tag `vX.Y.Z` aponta para ele (`git describe --tags --exact-match origin/develop`). Se algo entrou em `develop` depois da versão, pare e diga que falta uma versão nova.
3. Commits: `git log --oneline origin/main..origin/develop`.
4. O trecho da versão: a seção `## [X.Y.Z]` de `git show origin/develop:CHANGELOG.md`, até a seção seguinte.
5. Não há verificação local: o que vai para `main` é exatamente `develop`, cujos PRs já passaram pelo CI, e o próprio PR para `main` roda o check `ci`.
6. Aviso: os commits, a frase "Nada a enviar: `develop` já está no GitHub", o título `chore(release): publica vX.Y.Z` e a descrição no formato do template, com o trecho do CHANGELOG em "O que muda", o endereço do preview fixo de `develop` em "Como verificar" e, no fim, "Merge com merge commit, sem squash".
