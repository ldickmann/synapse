# 0001. Licença, branches e versões

- Data: 2026-11-14
- Situação: aceita

## Contexto

Este repositório guarda a Sinapse, o site profissional e o portfólio do Lucas: uma página estática publicada pela Vercel, com o código público no GitHub. O site precisa de uma regra para o uso do código, de um caminho de cada mudança até a produção e de versões com CHANGELOG.

## Decisão 1: sem licença

O código fica aberto para leitura, sem licença de uso, cópia ou redistribuição: todos os direitos reservados, como diz o README.

## Decisão 2: manter `develop` ao lado de `main`

O fluxo é o GitHub Flow com uma branch de integração:

- cada mudança nasce numa branch curta `<tipo>/<assunto>` a partir de `develop` e volta por PR com squash, com o título do PR como mensagem;
- a produção é um PR de `develop` para `main`, com merge commit;
- `develop` é a branch padrão do GitHub; `main` é a branch de produção da Vercel.

**Por quê.**

- `develop` tem um preview com endereço fixo na Vercel, que mostra o estado integrado e pode ser compartilhado antes de ir para produção. Os PRs continuam com preview próprio.
- O Lucas escolhe quando publicar, juntando várias mudanças numa versão. Isso pesa enquanto o site está em `0.x` e o endereço novo ainda não é o oficial.
- O squash deixa `develop` linear, com um commit por PR, e o título do PR (no padrão de commits) é o que o release-please lê.
- O merge commit de `develop` para `main` leva os mesmos commits, com os mesmos SHAs. Uma tag criada em `develop` fica no histórico de `main`, e as duas branches não divergem. Com squash nesse passo, `main` ganharia commits que `develop` não tem, e cada publicação pediria um merge de volta.

**Alternativa descartada.** Só `main`, com cada PR indo direto para produção. Sem `develop`, não há preview fixo do estado integrado, e cada merge vira deploy de produção.

## Decisão 3: o release-please roda em `develop`

O `release-please` roda a cada push em `develop`. Ele mantém aberto um PR de versão, com o próximo número (SemVer, calculado pelos commits) no `package.json` e o trecho novo do `CHANGELOG.md`. Quando esse PR entra em `develop`, ele cria a tag `vX.Y.Z` e publica a release no GitHub. Logo depois, sem nada entrar em `develop` no meio, o PR de `develop` para `main` leva essa versão para produção.

**Por quê.**

- Os commits que o release-please lê, um por PR e no padrão, nascem em `develop`.
- O PR de versão passa pelo mesmo caminho de qualquer PR: CI, título conferido e squash em `develop`.
- O commit de versão nasce em `develop` e chega a `main` pelo merge commit. Rodando em `main`, o PR de versão criaria em `main` um commit que `develop` não tem, e cada versão pediria um merge de `main` de volta para `develop`.
- O que vai para produção é sempre uma versão com tag.

**Consequências.**

- A tag e a release no GitHub saem antes do deploy de produção. Entre o merge do PR de versão e o PR para `main`, a versão existe e ainda não está no ar.
- O release-please usa o segredo `RELEASE_PLEASE_TOKEN`, um token fine-grained só deste repositório. Um PR aberto com o `GITHUB_TOKEN` não dispara workflows, então o CI não rodaria no PR de versão e o check obrigatório travaria o merge.
- O PR de versão só aparece quando `develop` recebe um commit que entra no CHANGELOG (`feat`, `fix`, `perf` ou `revert`, ou uma quebra marcada com `!`).
