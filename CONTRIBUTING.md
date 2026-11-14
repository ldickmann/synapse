# Como contribuir

Vale para qualquer mudança, feita à mão ou por uma sessão do Claude Code. O porquê de cada escolha está em [docs/decisoes/0001-repositorio-proprio.md](docs/decisoes/0001-repositorio-proprio.md); as regras do site, em [docs/especificacao.md](docs/especificacao.md).

## Branches

- `develop`: integração. É a branch padrão do GitHub e tem preview com endereço fixo na Vercel.
- `main`: produção. Só recebe PRs de `develop`.
- Cada mudança nasce numa branch curta a partir de `develop`, com o nome `<tipo>/<assunto>`: o tipo é o mesmo do commit, e o assunto vai em português, em minúsculas, sem acento e com hífens. Exemplos: `feat/secao-perfil`, `fix/foco-do-cabecalho`, `build/versionamento`.
- Ninguém faz commit direto em `develop` ou `main`: as duas exigem PR.

```sh
git switch develop
git pull
git switch -c fix/foco-do-cabecalho
```

## Commits

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/pt-br/v1.0.0/), com o tipo em inglês e a descrição em português:

```text
<tipo>(<escopo>): <descrição>

<corpo opcional: o porquê da mudança>

<rodapé opcional>
```

| Tipo       | Quando                                                           | Versão  |
| ---------- | ---------------------------------------------------------------- | ------- |
| `feat`     | algo novo para quem visita o site                                | MINOR   |
| `fix`      | correção de algo que quem visita vê ou usa                       | PATCH   |
| `perf`     | o site fica mais rápido ou mais leve, sem mudar o que faz        | PATCH   |
| `refactor` | mudança de código sem mudar comportamento                        | nenhuma |
| `style`    | só formatação                                                    | nenhuma |
| `test`     | testes, capturas e scripts de verificação                        | nenhuma |
| `docs`     | documentação e comentários                                       | nenhuma |
| `build`    | dependências, pnpm, Next, TypeScript e ferramentas               | nenhuma |
| `ci`       | workflows do GitHub Actions e Dependabot                         | nenhuma |
| `chore`    | o que não cabe nos outros (configuração do repositório, versões) | nenhuma |
| `revert`   | desfaz um commit anterior                                        | PATCH   |

- **Escopo**, opcional: `hero`, `rede`, `robos`, `fundo`, `trabalhos`, `contato`, `conteudo`, `testes`, `deps`, `claude` ou `release`. Outro escopo só gera aviso.
- **Descrição**: no presente, começando por verbo em minúscula e sem ponto final, como em `fix(contato): corrige o foco do botão grande`. O título tem até 100 caracteres.
- **Corpo**: depois de uma linha em branco, com linhas de até 100 caracteres.
- **Quebra**: `!` antes dos dois-pontos, como em `feat(trabalhos)!: troca as âncoras das seções`. O rodapé `BREAKING CHANGE: <o que quebra>` explica, se precisar.

O hook `commit-msg` (Husky e commitlint, em `commitlint.config.mjs`) barra a mensagem fora do padrão. O `pnpm install` liga o hook. Não use `--no-verify`.

## Pull requests

- Para `develop`, com o [modelo de PR](.github/pull_request_template.md).
- O título segue o padrão de commits, porque vira a mensagem do squash e entra no CHANGELOG. A quebra vai no título, com `!`.
- Dois checks precisam passar:
  - `titulo` confere o título do PR;
  - `ci` roda install com o lockfile, auditoria das dependências de produção, lint, formatação, padrões, build, typecheck e os testes do Playwright no Chromium.
- O merge é com squash, e a branch é apagada depois.
- Antes de abrir, rode `pnpm formatar` e a verificação do [README](README.md#verificação).

## Versões

[SemVer 2.0.0](https://semver.org/lang/pt-BR/), com tags `vX.Y.Z`:

- **MAJOR**: quebra pública, como endereço ou âncora que muda, seção removida ou direção visual nova;
- **MINOR**: `feat`;
- **PATCH**: `fix`, `perf` e `revert`.

O site fica em `0.x` até o lançamento. Enquanto isso, uma quebra sobe o MINOR. A `1.0.0` sai quando o endereço novo virar o oficial.

Quem calcula a versão é o [release-please](https://github.com/googleapis/release-please), a cada push em `develop`:

1. Ele mantém aberto o PR `chore(release): versão X.Y.Z`, com o `package.json` e o `CHANGELOG.md` atualizados. O PR só aparece quando há `feat`, `fix`, `perf`, `revert` ou quebra desde a última versão.
2. O merge desse PR em `develop` cria a tag e a release no GitHub.
3. Logo depois, sem nada entrar em `develop` no meio, um PR de `develop` para `main`, com merge commit, leva a versão para produção.

Não edite à mão o `CHANGELOG.md`, o `.release-please-manifest.json` nem o campo `version` do `package.json`. A configuração fica em `release-please-config.json`.

## Dependências

- Versão exata, sem `^`: o `.npmrc` tem `save-exact`.
- O Dependabot abre PRs para `develop` com o prefixo `build(deps)`: pacotes do npm toda semana e Actions todo mês, em grupos, só com versões publicadas há alguns dias.
- Pacote novo só com o motivo no corpo do commit (ver [docs/especificacao.md](docs/especificacao.md) §3).

## Formatação

O Prettier (`.prettierrc.json`) formata o código no estilo dele: sem ponto e vírgula, aspas simples (duplas no CSS) e linhas de até 120 caracteres. `pnpm formatar` aplica, e `pnpm formatar:checar` confere, como no CI.

Um commit só de formatação vai para o `.git-blame-ignore-revs`, para o `git blame` pular esse commit. Como o merge para `develop` é com squash, o SHA que vale é o do commit em `develop`, registrado num PR seguinte. No terminal, ligue com `git config blame.ignoreRevsFile .git-blame-ignore-revs`.
