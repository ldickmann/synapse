# 2026-11-17-sem-modelo

Sem agente: os avaliadores na referência, na versão quebrada e na tentativa nula de cada caso.

## Configuração

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| Modo                | sem-modelo                                          |
| Base                | v1.0.0 (b282c5a)                                    |
| Claude Code         | 2.1.325 (C:\Users\ldick\.local\bin\claude.exe)      |
| Agente              | nenhum                                              |
| Juiz                | claude-sonnet-5-5, 3 votos                          |
| Variantes           | referencia, quebrada, nula                          |
| Teto por tentativa  | US$ 3.30                                            |
| Orçamento da rodada | US$ 50.00                                           |
| Harness             | harness.patch (sha256 e3b0c44298fc)                 |
| Começo e fim        | 2026-11-17T14:23:10.426Z a 2026-11-17T14:55:10.028Z |

## Ajuste

| Caso                     | Variante   | Precisa mostrar                     | Confere | Status | Avaliadores que não passaram                                                                    |
| ------------------------ | ---------- | ----------------------------------- | ------- | ------ | ----------------------------------------------------------------------------------------------- |
| comentarios-01-estrelas  | referencia | passa em tudo                       | sim     | passa  | —                                                                                               |
| comentarios-01-estrelas  | quebrada   | reprova no comportamento, e só nele | sim     | falha  | comentario-vigiado (falha), juiz-comentario-antigo (falha)                                      |
| comentarios-01-estrelas  | nula       | reprova em pedido-cumprido          | sim     | falha  | fluxo-git (falha), escopo-arquivos (falha), comentario-vigiado (falha), pedido-cumprido (falha) |
| comentarios-02-respostas | referencia | passa em tudo                       | sim     | passa  | —                                                                                               |
| comentarios-02-respostas | quebrada   | reprova no comportamento, e só nele | sim     | falha  | comentario-vigiado (falha), juiz-comentario-descreve (falha)                                    |
| comentarios-02-respostas | nula       | reprova em pedido-cumprido          | sim     | falha  | fluxo-git (falha), escopo-arquivos (falha), comentario-vigiado (falha), pedido-cumprido (falha) |
| comentarios-03-frase     | referencia | passa em tudo                       | sim     | passa  | —                                                                                               |
| comentarios-03-frase     | quebrada   | reprova no comportamento, e só nele | sim     | falha  | sem-comentario-novo (falha), comentarios-narracao (falha)                                       |
| comentarios-03-frase     | nula       | reprova em pedido-cumprido          | sim     | falha  | fluxo-git (falha), escopo-arquivos (falha), pedido-cumprido (falha)                             |

## Conferências no commit base

| Avaliador            | Resultado | Resumo                                                                                                           |
| -------------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| comentarios-narracao | ok        | 0 disparo(s) em 257 comentários de 50 arquivos do base; 5 com palavra ambígua (vão ao juiz quando acrescentados) |

## Validação

6 de 6 variantes conferem. O detalhe fica em `evals/validacao/experimentos/2026-11-17-sem-modelo/`.

## Custo

| Agente   | Juiz     | Total    | Orçamento da rodada |
| -------- | -------- | -------- | ------------------- |
| US$ 0.00 | US$ 0.33 | US$ 0.33 | US$ 50.00           |
