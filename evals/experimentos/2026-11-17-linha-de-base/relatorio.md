# 2026-11-17-linha-de-base

Linha de base: o harness do commit base, sem mudança.

## Configuração

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| Modo                | rodada                                              |
| Base                | v1.0.0 (b282c5a)                                    |
| Claude Code         | 2.1.325 (C:\Users\ldick\.local\bin\claude.exe)      |
| Agente              | claude-opus-5-5, esforço xhigh, modo auto           |
| Juiz                | claude-sonnet-5-5, 3 votos                          |
| Tentativas por caso | 3                                                   |
| Teto por tentativa  | US$ 3.30                                            |
| Orçamento da rodada | US$ 50.00                                           |
| Harness             | harness.patch (sha256 e3b0c44298fc)                 |
| Começo e fim        | 2026-11-17T16:52:57.826Z a 2026-11-17T18:35:29.666Z |

## Resumo

| Conjunto  | Casos | Média de c/n | Casos com pass^3 | Custo médio por tentativa | Custo do conjunto |
| --------- | ----- | ------------ | ---------------- | ------------------------- | ----------------- |
| ajuste    | 3     | 0.67         | 2                | US$ 0.98                  | US$ 8.86          |
| validação | 2     | 0.50         | 1                | US$ 0.68                  | US$ 4.11          |

## Ajuste: por caso

| Caso                     | Tipo     | c/n | pass@3 | pass^3 | À parte | Custo médio | Turnos médios |
| ------------------------ | -------- | --- | ------ | ------ | ------- | ----------- | ------------- |
| comentarios-01-estrelas  | deve     | 0/3 | não    | não    | —       | US$ 2.19    | 57.7          |
| comentarios-02-respostas | deve     | 3/3 | sim    | sim    | —       | US$ 0.44    | 17.7          |
| comentarios-03-frase     | nao-deve | 3/3 | sim    | sim    | —       | US$ 0.33    | 14.7          |

## Ajuste: por avaliador

| Avaliador                | comentarios-01-estrelas | comentarios-02-respostas | comentarios-03-frase |
| ------------------------ | ----------------------- | ------------------------ | -------------------- |
| transcricao              | informa                 | informa                  | informa              |
| fluxo-git                | 3/3                     | 3/3                      | 3/3                  |
| escopo-arquivos          | 3/3                     | 3/3                      | 3/3                  |
| comentario-vigiado       | 3/3                     | 3/3                      | —                    |
| comentarios-narracao     | 3/3                     | 3/3                      | 3/3                  |
| comentarios-idioma       | 3/3                     | 3/3                      | 3/3                  |
| comentarios-marca        | informa                 | informa                  | informa              |
| juiz-comentario-descreve | 0/3                     | 3/3                      | 3/3                  |
| juiz-comentario-porque   | 1/3                     | 3/3                      | 3/3                  |
| juiz-comentario-antigo   | 3/3                     | 3/3                      | 3/3                  |
| pedido-cumprido          | 3/3                     | 3/3                      | 3/3                  |
| sem-afrouxar             | informa                 | informa                  | informa              |
| checagens-do-site        | 3/3                     | 3/3                      | 3/3                  |
| sem-comentario-novo      | —                       | —                        | 3/3                  |

## Ajuste: tentativas

### comentarios-01-estrelas#1: falha

- Agente: success, US$ 1.86, 56 turnos, 591 s, no começo: limite de 5 h em 3 %, semanal em 14 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\ajuste\comentarios-01-estrelas-1.jsonl`
- Modelos: claude-opus-5-5
- Juiz: 9 chamadas, US$ 0.36
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- juiz-comentario-descreve (falha): componentes/Fundo.tsx:5 FAIL (FAIL, FAIL, FAIL): O cabeçalho diz que as faíscas apagam em meio segundo, mas VIDA_MS = 900, ou seja, 0,9 s. A afirmação não vale para o código.; componentes/Fundo.tsx:108 PASS (PASS, PASS, PASS): Tudo confere com o código. O ponto sorteado vai de 0 a BLOCO-2, a penúltima célula, então vizinhas não encostam. r<0.2 deixa um quinto dos blocos vazio. Fracas são r<0.62, grandes r>0.93, com quatro picos. A passada é separada e a crista vem depois.; componentes/Fundo.tsx:124 UNKNOWN (PASS, UNKNOWN, UNKNOWN): Alpha 0.55 confirma "meio apagado" e azul é frio. Mas "frio" para cores.poeira depende do valor do token, definido fora do trecho.
- juiz-comentario-porque (falha): componentes/Fundo.tsx:5 PASS (PASS, PASS, PASS): Cabeçalho resume a composição do fundo (camadas, sinapses, sem laço sem faísca) e cita a regra G26 dos tokens; isso não se lê de relance no código.; componentes/Fundo.tsx:108 PASS (PASS, PASS, PASS): Explica a razão da passada própria (a linha de baixo apagaria os picos), a ordem com a crista, o limite do ponto no bloco e as proporções de estrelas; não são evidentes no código.; componentes/Fundo.tsx:124 FAIL (FAIL, FAIL, FAIL): Descreve em palavras o que as linhas já mostram (cor fria e alfa 0.55 para a estrela fraca); só acrescenta a metáfora, sem razão nem restrição.
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-01-estrelas-1.diff](diffs/comentarios-01-estrelas-1.diff)
- Causa provável: Duas causas. (1) Reescreveu o cabeçalho de Fundo.tsx só para mudar a frase das estrelas, refez as quebras de linha e manteve, sem conferir com o código, a frase anterior 'apagam em meio segundo' (VIDA_MS = 900, com alfa vida^1,4; a mesma frase está em docs/especificacao.md). O juiz de 'descreve' julga o bloco inteiro. (2) O comentário 'Fraca: tom frio e meio apagado, como uma estrela distante' repete em palavras o fillStyle e o globalAlpha 0.55 da linha de baixo, o que reprovou em 'porque' por 3 a 0. O agente verificou depois da última edição, com 0 ações negadas.

### comentarios-02-respostas#1: passa

- Agente: success, US$ 0.41, 20 turnos, 138 s, no começo: limite de 5 h em 5 %, semanal em 14 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\ajuste\comentarios-02-respostas-1.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-02-respostas-1.diff](diffs/comentarios-02-respostas-1.diff)

### comentarios-03-frase#1: passa

- Agente: success, US$ 0.30, 13 turnos, 126 s, no começo: limite de 5 h em 5 %, semanal em 14 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\ajuste\comentarios-03-frase-1.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-03-frase-1.diff](diffs/comentarios-03-frase-1.diff)

### comentarios-01-estrelas#2: falha

- Agente: success, US$ 1.94, 60 turnos, 763 s, no começo: limite de 5 h em 10 %, semanal em 14 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\ajuste\comentarios-01-estrelas-2.jsonl`
- Modelos: claude-opus-5-5
- Juiz: 9 chamadas, US$ 0.36
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- juiz-comentario-descreve (falha): componentes/Fundo.tsx:5 FAIL (FAIL, FAIL, FAIL): Diz que as células apagam em meio segundo, mas VIDA_MS = 900 e a vida cai em dt/VIDA_MS, então o apagar leva cerca de 900 ms.; componentes/Fundo.tsx:14 PASS (PASS, PASS, PASS): BLOCO_ESTRELA = 5 é o lado do bloco em células. temEstrela usa no máximo uma estrela por bloco.; componentes/Fundo.tsx:16 PASS (PASS, PASS, PASS): 0,75 dos blocos de 25 células têm uma estrela, o que dá 3 % das células. A chance não depende da linha, então é igual do alto até a crista.; componentes/Fundo.tsx:45 PASS (PASS, PASS, PASS): O deslocamento vai de 0 a 3 num bloco de 5, o que exclui a última coluna e a última linha. Há uma estrela por bloco, com vão de pelo menos 2 células entre blocos, então nunca ficam vizinhas.; componentes/Fundo.tsx:113 PASS (PASS, PASS, PASS): O código tem três laços: céu, estrelas e crista. Separar o céu evita que o preenchimento da linha seguinte apague o pico inferior da estrela.; componentes/Fundo.tsx:129 PASS (PASS, PASS, PASS): Os limiares batem: tom < 0,6 dá estrela branca, brilho > 0,875 dá 1/8 com picos e brilho < 0,33 dá 1/3 com alpha menor. A crista é desenhada depois, então cobre as estrelas. As linhas 147-149 abrem o laço da crista.
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-01-estrelas-2.diff](diffs/comentarios-01-estrelas-2.diff)
- Causa provável: Só o cabeçalho: reescreveu o parágrafo para a nova distribuição das estrelas e manteve a frase anterior 'apagam em meio segundo' (VIDA_MS = 900). Os outros 5 comentários novos passaram em 'descreve' e em 'porque', inclusive os JSDoc de BLOCO_ESTRELA e CHANCE_ESTRELA. Sem a frase herdada, a tentativa passaria.

### comentarios-02-respostas#2: passa

- Agente: success, US$ 0.48, 15 turnos, 162 s, no começo: limite de 5 h em 12 %, semanal em 14 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\ajuste\comentarios-02-respostas-2.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-02-respostas-2.diff](diffs/comentarios-02-respostas-2.diff)

### comentarios-03-frase#2: passa

- Agente: success, US$ 0.34, 15 turnos, 126 s, no começo: limite de 5 h em 12 %, semanal em 14 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\ajuste\comentarios-03-frase-2.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-03-frase-2.diff](diffs/comentarios-03-frase-2.diff)

### comentarios-01-estrelas#3: falha

- Agente: success, US$ 1.71, 57 turnos, 655 s, no começo: limite de 5 h em 17 %, semanal em 15 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\ajuste\comentarios-01-estrelas-3.jsonl`
- Modelos: claude-opus-5-5
- Juiz: 12 chamadas, US$ 0.34
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- juiz-comentario-descreve (falha): componentes/Fundo.tsx:5 FAIL (FAIL, FAIL, FAIL): O cabeçalho diz que as células "apagam em meio segundo", mas VIDA_MS = 900, ou seja, 0,9 s. O restante bate com o código.; componentes/Fundo.tsx:13 PASS (PASS, PASS, PASS): BLOCO_ESTRELA = 5 e CHANCE_ESTRELA = 0.8 batem com blocos de 5×5 células e 80% de chance de estrela.; componentes/Fundo.tsx:112 PASS (PASS, PASS, PASS): Há uma estrela no máximo por bloco, numa célula sorteada dentro dele. O laço das estrelas fica depois do céu e antes do laço da crista, que pinta por cima. O `continue` evita estrelas abaixo da borda da crista.; componentes/Fundo.tsx:124 PASS (PASS, PASS, PASS): Uma fração (ruido < 0.08) das estrelas recebe dois retângulos de 3 células, um horizontal e um vertical, com alpha 0.3. São quatro picos.
- juiz-comentario-porque (falha): componentes/Fundo.tsx:5 PASS (PASS, PASS, PASS): Cabeçalho resume o arquivo: camadas da nebulosa, sinapses, canvas sem laço ocioso e cores vindas dos tokens (G26). Não se lê de relance no código.; componentes/Fundo.tsx:13 PASS (PASS, PASS, FAIL): Explica o significado das constantes: blocos de 5×5 células e 80% com estrela; o 0.8 e o 5 sozinhos não dizem que é por bloco nem a proporção.; componentes/Fundo.tsx:112 PASS (PASS, PASS, PASS): Dá a razão da ordem de desenho (depois do céu por causa dos picos, antes da crista que as esconde) e do sorteio por bloco para não aglomerar.; componentes/Fundo.tsx:124 FAIL (FAIL, FAIL, FAIL): Só reescreve em palavras o que o código faz: o if com 0.08 e os dois fillRect em cruz desenham os quatro picos. Não traz razão nem restrição.
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-01-estrelas-3.diff](diffs/comentarios-01-estrelas-3.diff)
- Causa provável: Duas causas. (1) Mudou só as duas primeiras linhas do cabeçalho; a linha com 'apagam em meio segundo' ficou intacta no diff, mas o juiz julga o bloco alterado inteiro e reprovou por ela (3 a 0). (2) O comentário dos quatro picos descreve em palavras o if com 0.08 e os dois fillRect em cruz, sem razão nem restrição: reprovou em 'porque' por 3 a 0. O JSDoc de BLOCO_ESTRELA e CHANCE_ESTRELA passou em 'porque' por 2 a 1.

### comentarios-02-respostas#3: passa

- Agente: success, US$ 0.44, 18 turnos, 135 s, no começo: limite de 5 h em 18 %, semanal em 15 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\ajuste\comentarios-02-respostas-3.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-02-respostas-3.diff](diffs/comentarios-02-respostas-3.diff)

### comentarios-03-frase#3: passa

- Agente: success, US$ 0.34, 16 turnos, 138 s, no começo: limite de 5 h em 19 %, semanal em 15 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-linha-de-base\ajuste\comentarios-03-frase-3.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-03-frase-3.diff](diffs/comentarios-03-frase-3.diff)

## Validação: por caso

Só os números: o detalhe fica em `evals/validacao/experimentos/2026-11-17-linha-de-base/`, que a sessão de ajuste não lê.

| Caso                 | Tipo     | c/n | pass@3 | pass^3 | À parte         | Custo médio | Turnos médios |
| -------------------- | -------- | --- | ------ | ------ | --------------- | ----------- | ------------- |
| comentarios-v1-onda  | deve     | 0/3 | não    | não    | 3 indeterminado | US$ 1.03    | 33.7          |
| comentarios-v2-frase | nao-deve | 3/3 | sim    | sim    | —               | US$ 0.34    | 16.7          |

## Validação: por avaliador

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

## Custo

| Agente    | Juiz     | Total     | Orçamento da rodada |
| --------- | -------- | --------- | ------------------- |
| US$ 11.64 | US$ 1.33 | US$ 12.97 | US$ 50.00           |
