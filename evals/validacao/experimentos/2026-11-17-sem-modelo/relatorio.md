# 2026-11-17-sem-modelo: validação

O relatório da rodada está em `evals/experimentos/2026-11-17-sem-modelo/relatorio.md`.

| Caso                 | Variante   | Precisa mostrar                     | Confere | Status | Avaliadores que não passaram                                                                    |
| -------------------- | ---------- | ----------------------------------- | ------- | ------ | ----------------------------------------------------------------------------------------------- |
| comentarios-v1-onda  | referencia | passa em tudo                       | sim     | passa  | —                                                                                               |
| comentarios-v1-onda  | quebrada   | reprova no comportamento, e só nele | sim     | falha  | comentario-vigiado (falha), juiz-comentario-antigo (falha)                                      |
| comentarios-v1-onda  | nula       | reprova em pedido-cumprido          | sim     | falha  | fluxo-git (falha), escopo-arquivos (falha), comentario-vigiado (falha), pedido-cumprido (falha) |
| comentarios-v2-frase | referencia | passa em tudo                       | sim     | passa  | —                                                                                               |
| comentarios-v2-frase | quebrada   | reprova no comportamento, e só nele | sim     | falha  | sem-comentario-novo (falha), juiz-comentario-descreve (indeterminado)                           |
| comentarios-v2-frase | nula       | reprova em pedido-cumprido          | sim     | falha  | fluxo-git (falha), escopo-arquivos (falha), pedido-cumprido (falha)                             |
