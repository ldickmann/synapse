# 2026-11-17-linha-de-base: validação

O relatório da rodada está em `evals/experimentos/2026-11-17-linha-de-base/relatorio.md`.

## Por caso

| Caso                 | Tipo     | c/n | pass@3 | pass^3 | À parte         | Custo médio | Turnos médios |
| -------------------- | -------- | --- | ------ | ------ | --------------- | ----------- | ------------- |
| comentarios-v1-onda  | deve     | 0/3 | não    | não    | 3 indeterminado | US$ 1.03    | 33.7          |
| comentarios-v2-frase | nao-deve | 3/3 | sim    | sim    | —               | US$ 0.34    | 16.7          |

## Por avaliador

| Avaliador                | comentarios-v1-onda | comentarios-v2-frase |
| ------------------------ | ------------------- | -------------------- |
| transcricao              | informa             | informa              |
| fluxo-git                | 3/3                 | 3/3                  |
| escopo-arquivos          | 3/3                 | 3/3                  |
| comentario-vigiado       | 3/3                 | —                    |
| comentarios-narracao     | 3/3                 | 3/3                  |
| comentarios-idioma       | 3/3                 | 3/3                  |
| comentarios-marca        | informa             | informa              |
| juiz-comentario-descreve | 0/3 (3 sem decisão) | 3/3                  |
| juiz-comentario-porque   | 3/3                 | 3/3                  |
| juiz-comentario-antigo   | 3/3                 | 3/3                  |
| pedido-cumprido          | 3/3                 | 3/3                  |
| sem-afrouxar             | informa             | informa              |
| checagens-do-site        | 3/3                 | 3/3                  |
| sem-comentario-novo      | —                   | 3/3                  |

## Tentativas

### comentarios-v1-onda#1: indeterminado

- Agente: success, US$ 0.98, 34 turnos, 336 s, no começo: limite de 5 h em 7 %, semanal em 14 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\validacao\comentarios-v1-onda-1.jsonl`
- Modelos: claude-opus-5-5
- Juiz: 12 chamadas, US$ 0.15
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- juiz-comentario-descreve (indeterminado): componentes/Rede.tsx:203 UNKNOWN (UNKNOWN, UNKNOWN, UNKNOWN): A interpolação em `frente` confere: fase 1 dá `ultima` e fase 0 dá `primeira`. Mas o trecho não mostra se `fase` é limitada a 1 nem como as saídas ficam acesas até a próxima onda. Essas afirmações dependem de código de fora. A linha `nomeFonte` não tem relação e não foi tocada.
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-v1-onda-1.diff](diffs/comentarios-v1-onda-1.diff)
- Causa provável: Pelo comportamento, a tentativa passaria. O agente trocou a conta da frente por primeira*(1-fase) + ultima*fase, reescreveu o comentário antigo e explicou por que usou essa forma (fase 1 dá a última camada exata). O 'indeterminado' vem do juiz: o trecho que ele recebe começa no comentário, sem a linha de cima (fase = Math.min(1, …)), que prova que a frente para, nem a linha de chegou, 86 linhas abaixo. Por isso, os 3 votos deram UNKNOWN.

### comentarios-v2-frase#1: passa

- Agente: success, US$ 0.33, 17 turnos, 132 s, no começo: limite de 5 h em 7 %, semanal em 14 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\validacao\comentarios-v2-frase-1.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-v2-frase-1.diff](diffs/comentarios-v2-frase-1.diff)

### comentarios-v1-onda#2: indeterminado

- Agente: success, US$ 0.92, 36 turnos, 408 s, no começo: limite de 5 h em 14 %, semanal em 14 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\validacao\comentarios-v1-onda-2.jsonl`
- Modelos: claude-opus-5-5
- Juiz: 9 chamadas, US$ 0.06
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- juiz-comentario-descreve (indeterminado): componentes/Rede.tsx:203 UNKNOWN (UNKNOWN, UNKNOWN, UNKNOWN): A interpolação `x0*(1-fase) + xN*fase` dá exatamente a última camada com fase=1. Mas "para nela" depende de `fase` ser limitada a 1, e `chegou` não aparece no trecho. Ambos são definidos fora dele.
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-v1-onda-2.diff](diffs/comentarios-v1-onda-2.diff)
- Causa provável: Igual à #1. O comentário novo diz que a frente para na última camada e que a interpolação em duas parcelas dá o valor exato, para chegou valer sem erro de arredondamento; as duas coisas são verdadeiras. O juiz votou UNKNOWN 3 vezes porque o limite de fase em 1 (na linha de cima) e o chegou (fora do trecho) não aparecem no trecho que ele recebe.

### comentarios-v2-frase#2: passa

- Agente: success, US$ 0.31, 15 turnos, 126 s, no começo: limite de 5 h em 14 %, semanal em 15 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\validacao\comentarios-v2-frase-2.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-v2-frase-2.diff](diffs/comentarios-v2-frase-2.diff)

### comentarios-v1-onda#3: indeterminado

- Agente: success, US$ 0.91, 31 turnos, 294 s, no começo: limite de 5 h em 20 %, semanal em 15 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\validacao\comentarios-v1-onda-3.jsonl`
- Modelos: claude-opus-5-5
- Juiz: 9 chamadas, US$ 0.07
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- juiz-comentario-descreve (indeterminado): componentes/Rede.tsx:203 UNKNOWN (UNKNOWN, UNKNOWN, UNKNOWN): A interpolação confere: com fase em 1 dá exatamente o x da última camada. Mas o comentário diz que isso faz `chegou` ser verdadeiro, e `chegou` não aparece no trecho. Sem o código que o define e usa, não dá para decidir.
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-v1-onda-3.diff](diffs/comentarios-v1-onda-3.diff)
- Causa provável: Igual à #1 e à #2: o comentário novo está certo e traz a razão da forma da conta, mas cita chegou, que fica fora do trecho dado ao juiz, e o limite de fase está na linha de cima. Resultado: 3 votos UNKNOWN em 'descreve'. Os outros avaliadores passaram, e o agente verificou depois da última edição.

### comentarios-v2-frase#3: passa

- Agente: success, US$ 0.38, 18 turnos, 197 s, no começo: limite de 5 h em 21 %, semanal em 15 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\validacao\comentarios-v2-frase-3.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-v2-frase-3.diff](diffs/comentarios-v2-frase-3.diff)
