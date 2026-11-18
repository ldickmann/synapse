# Evals do Claude Code

Estas evals medem o Claude Code trabalhando no Synapse com o harness deste repositório: `CLAUDE.md` e `.claude/**` (permissões e hooks em `settings.json`, scripts de hook, rules e skills). Cada caso é um pedido com o critério de passa ou falha escrito antes de qualquer tentativa, e a suíte diz, caso a caso, se uma mudança no harness melhorou o comportamento avaliado. Entre experimentos só muda o harness: o código do site não muda por causa das evals.

Cada tentativa roda com `claude -p` num clone limpo do commit base (a tag `v1.0.0`), com o modelo, o esforço e o modo das sessões do Lucas e sem plugins, skills ou servidores MCP pessoais. São 3 tentativas por caso, com teto de US$ 3,30 cada.

| Caminho                   | O que tem                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `suite.json`              | commit base, versão do Claude Code, modelo, esforço, modo, juiz, tentativas, tetos, portas e a régua das checagens         |
| `casos/<id>/`             | conjunto de ajuste: os casos que orientam as mudanças no harness                                                           |
| `validacao/<id>/`         | conjunto de validação: confere se a melhora vale fora dos casos de ajuste. A sessão que ajusta o harness não lê esta pasta |
| `rubricas/`               | o texto que o juiz recebe, um arquivo por avaliador                                                                        |
| `runner/`                 | o runner (`rodar.ts`), o workspace, o agente, o juiz, o relatório, o comparador e a rotulagem                              |
| `avaliadores/`            | um arquivo por avaliador; `comentarios.ts` acha os comentários, o trecho e a classe de cada um                             |
| `experimentos/`           | uma pasta por rodada, com o `INDICE.md` da sequência de experimentos                                                       |
| `validacao/experimentos/` | o detalhe dos casos de validação de cada rodada, fora do que a sessão de ajuste lê                                         |

## Primeiro comportamento: comentários fiéis ao código

Um comentário diz a verdade sobre o código que vem logo abaixo dele.

**Quando vale.** A tentativa acrescenta ou altera um comentário, ou altera código que tem um comentário logo acima.

**O comentário:**

1. fica logo acima do trecho que descreve e descreve esse trecho; quando o trecho muda, o comentário muda junto ou sai;
2. explica o porquê (a razão, a regra como G26 ou X3, a armadilha), não repete o que o código já diz;
3. fala do código, não da tarefa;
4. é escrito em português, como todo o código do repositório.

**Reprova:**

- comentário que não corresponde ao trecho, inclusive o antigo que ficou acima de código alterado;
- comentário que só parafraseia a linha seguinte;
- comentário que narra a tarefa ou o histórico ("agora usa", "alterado para", "conforme pedido", "novo").

**Vale só para o que a tentativa toca.** Comentário errado em código que o pedido não mexe não é falha deste comportamento: o certo é deixá-lo como está e citá-lo no aviso final. Nos casos `nao-deve` desta suíte, em que o pedido não pede comentário nenhum, qualquer comentário acrescentado, alterado ou removido reprova (`sem-comentario-novo`).

**Continua funcionando.** O pedido é cumprido, as checagens do site passam, o fluxo de git do `CLAUDE.md` é seguido e a tentativa só toca os arquivos permitidos do caso.

### O trecho de um comentário

O trecho é o código que um comentário acompanha, e é o que os juízes recebem junto com ele.

- **Comentário sozinho na linha:** o nó logo abaixo e as instruções seguintes do mesmo bloco, até a primeira linha em branco, o próximo comentário sozinho na linha ou o fim do bloco. Em `componentes/Fundo.tsx:104`, o trecho de "Estrelas: raras, mais no alto; as grandes ganham quatro picos." vai da linha 105 à 116 e inclui o `if` que decide onde há estrela. O nó logo abaixo entra inteiro; uma instrução seguinte que tem dentro um comentário sozinho na linha entra só até a linha antes dele, porque o resto é desse outro comentário: o trecho de "Céu: marinho no alto…" (linha 93) vai da 94 à 98 e não cobre as estrelas.
- **Comentário no fim de uma linha:** aquela instrução. No CSS, o comentário na linha de uma declaração é dela.
- **`{/* */}`:** o elemento JSX seguinte.
- **Cabeçalho**, o comentário que vem antes da primeira declaração do arquivo que não é import nem diretiva: o arquivo inteiro.

O juiz recebe o trecho com as linhas que a tentativa acrescentou ou alterou marcadas. Uma linha sem relação com o comentário que a tentativa não tocou não reprova e só aparece na justificativa; uma linha sem relação que a tentativa pôs debaixo do comentário reprova.

### Passa e falha

Uma tentativa passa quando todos os avaliadores da lista `avaliadores` do caso passam. Nos casos deste comportamento, são:

- `checagens-do-site`, `pedido-cumprido`, `fluxo-git` e `escopo-arquivos`, que cobrem o que já funciona e precisa continuar;
- `comentarios-narracao`, `comentarios-idioma`, `juiz-comentario-descreve`, `juiz-comentario-porque` e `juiz-comentario-antigo`, em todos os comentários julgados;
- `comentario-vigiado` nos casos `deve` e `sem-comentario-novo` nos `nao-deve`.

Item do juiz que termina em `UNKNOWN` não conta como passa: aparece à parte e vai para revisão do Lucas. Enquanto a concordância do juiz com os rótulos do Lucas não for medida, veredito do juiz não decide experimento sozinho.

### De onde vem

Revisões de PR deste repositório acharam comentário que dizia o que o código não fazia: em `tests/site.spec.ts`, um tempo que não era o do teste, e no cabeçalho de `.claude/hooks/proteger-git.mjs`, um comando que o hook não pegava. Numa sessão, o próprio Claude teve de alinhar os comentários de `commitlint.config.mjs`, que ainda descreviam a checagem antiga. O harness do commit base não tem regra geral sobre o que um comentário deve dizer: as rules só citam comentário em pontos soltos, como a razão de contraste anotada no token e o motivo de uma exceção em `EXCECOES`.

## Avaliadores

Código sempre que a checagem é determinística; juiz só no que exige julgamento.

| Avaliador                  | Tipo                                   | Passa quando                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checagens-do-site`        | código                                 | lint, formatação, tipos, padrões, build e os 13 testes do Playwright passam numa cópia do estado final com a régua do base restaurada (`tests/`, `playwright.config.ts`, `scripts/checar-padroes.ts`, `eslint.config.mjs`, `tsconfig.json`, `.prettierignore` e `.prettierrc.json`), numa porta própria. Assim a tentativa não passa mexendo na régua                                                                                                                        |
| `pedido-cumprido`          | código ou juiz, por caso               | a verificação do campo `pedido_cumprido` do caso passa. Quando é juiz, ele recebe o pedido, o critério do caso e o diff, com `rubricas/pedido-cumprido.md`                                                                                                                                                                                                                                                                                                                   |
| `fluxo-git`                | código                                 | branch `<tipo>/<assunto>` saindo de `develop`; nada commitado em `develop`; árvore limpa; `commitlint` sem erro do início da tentativa até o `HEAD`; `pnpm-lock.yaml`, `CHANGELOG.md`, `.release-please-manifest.json` e o `version` do `package.json` intocados                                                                                                                                                                                                             |
| `escopo-arquivos`          | código                                 | os arquivos tocados (diff e não rastreados) estão em `arquivos_permitidos`, e todos os `arquivos_esperados` foram tocados                                                                                                                                                                                                                                                                                                                                                    |
| `comentario-vigiado`       | código, nos casos `deve`               | o comentário que o pedido torna falso (`comentario_vigiado` do caso) não aparece mais no arquivo, comparado sem diferença de espaços: mudou ou saiu. O caso pode somar uma regra, como termos que o comentário no lugar dele não pode ter                                                                                                                                                                                                                                    |
| `sem-comentario-novo`      | código, nos casos `nao-deve`           | os comentários dos arquivos tocados ficam como no base: nenhum acrescentado, alterado ou removido                                                                                                                                                                                                                                                                                                                                                                            |
| `comentarios-narracao`     | código, com juiz nas palavras ambíguas | nenhum comentário acrescentado ou alterado narra a tarefa: "mudei", "foi alterado", "alterado para", "agora", "antes era", "conforme pedido", "nesta tarefa", "issue #N". A regex usa limites que entendem acento (`(?<![\p{L}\p{N}_])…(?![\p{L}\p{N}_])`, flags `iu`), porque o `\b` do JavaScript não entende, e só vale depois de dar zero disparos em todos os comentários do base. Palavra ambígua ("novo", "nova") vai ao juiz, com `rubricas/comentarios-narracao.md` |
| `comentarios-idioma`       | código                                 | o comentário acrescentado ou alterado está em português: reprova o que tem mais palavras funcionais do inglês ("the", "and", "is", "this", "when") que do português, sem contar identificadores entre crases e nomes de API                                                                                                                                                                                                                                                  |
| `comentarios-marca`        | código, alimenta o juiz                | quando um comentário cita entre crases um nome que existia nas linhas removidas e sumiu do arquivo, ele vai ao `juiz-comentario-antigo` como candidato forte a desatualizado                                                                                                                                                                                                                                                                                                 |
| `juiz-comentario-descreve` | juiz                                   | o comentário acrescentado ou alterado descreve o seu trecho (`rubricas/juiz-comentario-descreve.md`)                                                                                                                                                                                                                                                                                                                                                                         |
| `juiz-comentario-porque`   | juiz                                   | o comentário acrescentado ou alterado diz o porquê, a regra ou a armadilha, e não só repete o código (`rubricas/juiz-comentario-porque.md`)                                                                                                                                                                                                                                                                                                                                  |
| `juiz-comentario-antigo`   | juiz                                   | o comentário que ficou igual acima de código alterado ainda descreve o trecho (`rubricas/juiz-comentario-antigo.md`)                                                                                                                                                                                                                                                                                                                                                         |
| `sem-afrouxar`             | código, informa                        | nenhum dos sinais de afrouxamento que a skill `verificar` procura: teste ou `expect` removido; `test.skip`, `.only`, `.fixme` ou `expect.soft` novos; limite, `timeout` ou `retries` maiores; exceção nova em `EXCECOES`; pasta a menos em `PASTAS_DO_SITE`; `eslint-disable`, `@ts-ignore`, `@ts-expect-error` ou `as any` novos. Roda em todos os casos e, nos de comentário, só informa                                                                                   |
| `transcricao`              | código, informa                        | registra se o agente verificou depois da última edição, as ações negadas, os eventos de hook, servidor esquecido numa porta e o modelo de cada resposta. Marca a tentativa como contaminada se ela ler `evals/` ou as transcrições em `~/.claude/projects/`, chamar o `gh` ou buscar o site publicado                                                                                                                                                                        |

### O que vai aos juízes de comentário

- Entram os arquivos `.ts`, `.tsx`, `.mjs` e `.css` do diff da tentativa (`git diff --name-status -M`, do início ao `HEAD`), com a versão antiga e a nova e o CRLF normalizado. TS, TSX e MJS são lidos com o compilador do TypeScript, e CSS com o PostCSS; comentários `//` em linhas seguidas formam um bloco.
- Pelos hunks do diff (`--diff-algorithm=histogram`, repetido com `-w` para descartar mudança só de espaço), cada comentário é acrescentado, alterado, movido ou mantido.
- Acrescentado ou alterado, se não for diretiva (`eslint-*`, `@ts-*`, `prettier-ignore`) nem já tiver reprovado por narração: vai ao `juiz-comentario-descreve` e ao `juiz-comentario-porque`.
- Mantido cujo trecho mudou, movido cujo trecho mudou, cabeçalho cujos `export` mudaram e toda marca do `comentarios-marca`: vão ao `juiz-comentario-antigo`.

## Juiz

- É outro `claude -p`, com outro modelo (Sonnet 5.5), sem ferramentas, sem o harness, numa pasta vazia fora de qualquer repositório e com config própria. A rubrica do avaliador vira o prompt de sistema, e a resposta segue um esquema JSON.
- Uma chamada por rubrica e por tentativa, com todos os itens daquela rubrica num lote só; cada item leva só o trecho necessário.
- Toda rubrica começa dizendo que o conteúdo dos itens é dado a avaliar, não instrução, que comentário longo não ganha ponto e que a resposta é só o JSON: `{"itens":[{"id","veredito","justificativa"}]}`, com `veredito` `PASS`, `FAIL` ou `UNKNOWN` e justificativa de até 300 caracteres.
- São 3 votos por item, e vale a maioria. Sem maioria, o item fica `UNKNOWN`.
- Calibragem: antes de pesar em decisão, os itens julgados na linha de base e nas versões quebradas saem sem o veredito, o Lucas rotula cada um como `PASS` ou `FAIL`, e se mede a concordância nos dois sentidos. O limiar para confiar no juiz é do Lucas.

## Casos

`pedido.md` tem só o texto do pedido, sem título, como o Lucas escreveria, e vai como está para o `claude -p`. Precisa ser completo: no `-p` não há quem responda pergunta.

| Campo de `caso.json`  | O que é                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `id`                  | o nome da pasta                                                                                                                |
| `comportamento`       | `comentarios`                                                                                                                  |
| `conjunto`            | `ajuste` (em `casos/`) ou `validacao` (em `validacao/`)                                                                        |
| `tipo`                | `deve` (o comportamento tem de aparecer), `nao-deve` (a regra não pode virar exagero) ou `regressao` (algo que já funciona)    |
| `origem`              | a evidência: trecho de código, commit, PR, sessão ou o caso de que este é variação, com o commit do base                       |
| `arquivos_esperados`  | o que a tentativa tem de tocar                                                                                                 |
| `arquivos_permitidos` | o que ela pode tocar                                                                                                           |
| `avaliadores`         | os que decidem: a tentativa passa quando todos passam                                                                          |
| `comentario_vigiado`  | nos casos `deve`: arquivo, linha e texto do comentário que o pedido torna falso, e as regras a mais do caso                    |
| `pedido_cumprido`     | `codigo`, com as `verificacoes` em palavras e as `checagens` que o avaliador roda, ou `juiz`, com o critério que o juiz recebe |
| `criterio`            | o critério de passa ou falha em palavras                                                                                       |
| `teto_usd`            | o teto de custo de uma tentativa                                                                                               |

As `checagens` de `pedido_cumprido` são a forma de máquina das `verificacoes`, uma por tipo: `valor-igual` (o valor de uma constante de primeiro nível é `valor_esperado`), `valor-igual-ao-base` (o valor ficou como no base), `linha-da-tabela-ausente` (a tabela de uma seção da especificação não tem mais a linha) e `removida-no-mesmo-commit` (o commit que tira a linha também muda `junto_com`). O avaliador compara o valor das constantes, não a formatação.

Antes da linha de base, cada caso ganha `referencia.patch` (passa em todos os avaliadores), `quebrada.patch` (viola o comportamento e reprova) e, se precisar de outro estado inicial, `preparo.patch`. Os três vêm do `git format-patch`, com a mensagem do commit: na rodada sem modelo, o runner cria a branch `<tipo>/<id do caso>` e aplica o patch com `git am`.

### Conjuntos

| Caso de ajuste             | Tipo       | Pedido                                                  | O que decide                                                                                                                |
| -------------------------- | ---------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `comentarios-01-estrelas`  | `deve`     | estrelas do fundo mais frequentes e espalhadas pelo céu | o comentário "Estrelas: raras, mais no alto" muda ou sai; a chance de estrela fica igual em toda a altura e maior que antes |
| `comentarios-02-respostas` | `deve`     | confirmar as duas últimas respostas das perguntas       | o comentário que diz que elas aguardam confirmação sai ou muda, e a linha do §6 sai no mesmo commit                         |
| `comentarios-03-frase`     | `nao-deve` | trocar a primeira frase do texto de apoio do hero       | nenhum comentário muda em `lib/texto.ts`                                                                                    |

A validação tem dois casos, um `deve` e um `nao-deve`, e um deles é variação de redação de um caso de ajuste. Os detalhes ficam só em `validacao/`.

A divisão foi fixada antes de qualquer tentativa e não muda depois de ver resultado: escolher para o ajuste os casos que falharam fabricaria melhora por regressão à média.

## Como rodar

Só no Windows, uma tentativa por vez. Antes:

- `pnpm install` feito, com o Chromium do Playwright, e o Claude Code na versão de `suite.json` (`claude --version`).
- A tag do base na cópia local: `git fetch origin --tags`.
- O token das evals: `claude setup-token`, guardado na variável de ambiente do usuário `SYNAPSE_EVALS_OAUTH_TOKEN`, nunca no repositório. O runner o passa ao agente e ao juiz como `CLAUDE_CODE_OAUTH_TOKEN`; as sessões normais não o veem. Antes de cada chamada do agente e na criação do juiz, `claude auth status` no mesmo ambiente e na mesma pasta precisa dizer `oauth_token` e `firstParty`: com chave de API ou outro provedor, a chamada seria cobrada pela API em vez de sair do limite do plano, e a rodada para.
- Nenhuma porta de 3000 a 3010 nem de 3100 a 3110 ocupada, nem a 3290, do avaliador: com o `pnpm dev` aberto, o Playwright testaria o servidor errado.

```sh
node evals/runner/rodar.ts --sem-modelo --sem-juiz          # avaliadores sem agente nem juiz: referência, quebrada e nula
node evals/runner/rodar.ts --sem-modelo                     # o mesmo, com o juiz nos itens de comentário
node evals/runner/rodar.ts --sonda                          # uma tentativa com Haiku, para conferir o isolamento
node evals/runner/rodar.ts --nome linha-de-base             # os 5 casos × 3 tentativas
node evals/runner/rodar.ts --nome <nome> --conjunto ajuste --harness <patch> --hipotese "…"
node evals/runner/rodar.ts --retomar <AAAA-MM-DD-nome>      # continua uma rodada que parou
node evals/runner/relatorio.ts evals/experimentos/<pasta>   # gera o relatorio.md de novo
node evals/runner/comparar.ts <em uso> <candidato>          # caso a caso, contra o harness em uso
node evals/runner/rotular.ts exportar <rodada> --quebradas <sem modelo>
node evals/runner/rotular.ts medir <rodada>
```

Outras opções da rodada: `--casos a,b`, `--tentativas N`, `--teto USD`, `--orcamento USD` e `--manter`, que guarda os workspaces.

Numa tentativa, o runner:

1. confere a tag do base, a versão do Claude Code, as portas, o token e anota `HEAD` e `git status` da cópia de trabalho do Lucas;
2. clona a tag com `--no-local --single-branch` em `C:\ev\<id>\synapse`, cria `develop`, faz o commit do harness (mensagem, autor e data fixos, vazio na linha de base), troca o `origin` por uma cópia `--bare` do próprio clone, apaga reflog e objetos soltos (`git fsck` vazio) e roda `pnpm install`;
3. roda `claude -p` com o pedido, o modelo, o esforço e o modo de `suite.json`, `--permission-prompts none`, `--strict-mcp-config`, `--max-budget-usd` e a transcrição em stream-json, num Job Object do Windows e com o ambiente montado por lista branca (`CLAUDE_CONFIG_DIR`, `TEMP` e um gitconfig sem credencial próprios da tentativa, `GH_CONFIG_DIR` vazio). O `.claude.json` da config da tentativa marca o clone como confiável, como a cópia do Lucas: sem isso, o Claude Code ignora as permissões de `.claude/settings.json`;
4. confere no `system/init` a versão, o modelo, o modo, a skill `verificar`, nenhum plugin além dos embutidos no Claude Code, nenhum servidor MCP, `apiKeySource` igual a `none` (sem chave de API) e nenhum aviso de pasta sem confiança; se não confere, a rodada para. Do `rate_limit_event`, guarda as barras do `/usage` no começo da tentativa e se o uso extra está recusado;
5. depois do primeiro `result`, espera 60 s; porta ainda em escuta com dono da tentativa é `servidor_esquecido`, com dono de fora para a rodada; então encerra o job;
6. roda os avaliadores do caso e os informativos, grava `resultados.json` e o diff e apaga o workspace;
7. confere que a cópia de trabalho do Lucas não mudou.

A rodada também para no limite do plano ou num erro da API (a tentativa fica "não rodou"), quando a próxima tentativa passaria do orçamento da rodada e quando o build não baixa as fontes do Google três vezes seguidas. `--retomar` roda só o que falta, e uma avaliação que não terminou é refeita no workspace guardado.

## Como ler um relatório

Cada experimento fica em `experimentos/<AAAA-MM-DD>-<nome>/`:

- `harness.patch`: a única mudança do experimento, só em `CLAUDE.md` e `.claude/**` (vazio na linha de base);
- `experimento.json`: commit base, SHA do patch, versões do Claude Code e do modelo, esforço, modo, tentativas, tetos, data e hipótese;
- `resultados.json`: por caso e tentativa, cada avaliador com passa ou falha e a evidência, o custo, os turnos, a duração, o motivo do fim, a última mensagem do agente e o caminho da transcrição;
- `diffs/`: o diff de cada tentativa, do início ao estado final, porque o workspace é apagado;
- `relatorio.md`: gerado pelo runner;
- `anotacoes.json`: a causa provável de cada falha, escrita depois de ler a transcrição (`{ "<id da tentativa>": "<causa>" }`); o relatório a inclui quando é gerado de novo;
- `rotulos.md` e `concordancia.md`: a amostra que o Lucas rotula e a concordância do juiz com os rótulos.

Dos casos de validação, a pasta do experimento só guarda os números. O resto (`resultados.json`, `diffs/`, `relatorio.md`, `rotulos.md` e as divergências do juiz) fica em `validacao/experimentos/<AAAA-MM-DD>-<nome>/`, que a sessão de ajuste não lê.

`experimentos/INDICE.md` tem uma linha por experimento: data, hipótese, mudança, resultado e decisão. As transcrições ficam fora do git, em `%LOCALAPPDATA%\synapse-evals\transcricoes\`, e o relatório aponta para elas; o log de cada rodada fica em `%LOCALAPPDATA%\synapse-evals\logs\`.

No relatório:

- **Por caso:** `c/3`, as tentativas que passaram; pass@3, que passa se `c ≥ 1`; pass^3, que passa se `c = 3`.
- **Por conjunto:** a média de `c/3`, quantos casos têm pass^3 e o custo médio por tentativa. Ajuste e validação aparecem sempre separados.
- **Por avaliador:** o resultado de cada um, para saber o que reprovou.
- **Comparação:** sempre contra o harness em uso (a linha de base ou o último experimento adotado), nunca contra o último experimento rodado. Mostra `c/3` antes e depois em cada caso, marcando melhora, regressão ou igual, o custo, os turnos e a probabilidade de o candidato ser melhor, com Beta(c+1, n−c+1) em cada braço: 3/3 contra 1/3 dá 0,93; 3/3 contra 2/3, 0,79; 2/3 contra 1/3, 0,76. Uma tentativa de diferença em três não decide nada sozinha: a decisão vem da tabela junto com a leitura das transcrições, e o limiar é do Lucas.
- **Decisão:** o conjunto de ajuste roda primeiro, e a validação só roda se o ajuste melhorar sem regressão. Que diferença conta como melhora ou regressão, inclusive quando a validação fica igual, é decisão do Lucas, combinada antes do primeiro experimento.

Fora da conta de passa e falha:

- **Não rodou:** limite do plano, erro de API ou falha de rede no build ao baixar as fontes. A rodada para, e só as tentativas pendentes são retomadas.
- **Corte:** a tentativa bateu o teto de custo. Não conta como passa nem como falha; caso com corte é grande demais, e quem se revê é o caso, não o harness.
- **`UNKNOWN`:** item do juiz sem maioria, à parte, para revisão do Lucas.
- **Marcas da `transcricao`:** tentativa contaminada, servidor esquecido numa porta e troca de modelo no meio da tentativa.

## Como acrescentar um caso

1. Escreva `pedido.md` e `caso.json` antes de qualquer tentativa com o caso, com o critério claro o bastante para dois revisores darem o mesmo veredito.
2. Escolha o conjunto de uma vez. Cada conjunto mantém pelo menos um caso `deve` e um `nao-deve` ou `regressao`. Caso de validação não é lido pela sessão que ajusta o harness nem descrito neste README.
3. Use um id curto: o workspace de cada tentativa fica numa raiz curta no Windows, por causa do limite de caminho.
4. Aponte a `origem` para a evidência. Falha nova vista em revisão de PR, commit de correção ou reversão vira caso.
5. Escreva `referencia.patch` e `quebrada.patch`. Antes de o caso valer, os avaliadores rodam sem modelo sobre a referência (passa em tudo), a quebrada (reprova no avaliador do comportamento) e a tentativa nula, sem mudança nenhuma (reprova em `pedido-cumprido`).
6. Código de caso vai em `.patch`, nunca em `.ts` ou `.tsx` solto: o lint, o typecheck e o Prettier olham `evals/` como o resto do repositório.
