# 2026-11-18-claude-md-comentarios

Uma seção Comentários no CLAUDE.md, carregada em toda sessão, que pede o porquê, proíbe copiar valor do código, faz quem toca um bloco responder por ele inteiro e separa código novo de comentário alheio por linha em branco, leva comentarios-01-estrelas a pelo menos 2/3 sem tirar tentativa de comentarios-02-respostas e comentarios-03-frase.

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
| Harness             | harness.patch (sha256 4bb8f0edeaa9)                 |
| Começo e fim        | 2026-11-18T16:58:05.766Z a 2026-11-18T17:54:42.264Z |

## Resumo

| Conjunto  | Casos | Média de c/n | Casos com pass^3 | Custo médio por tentativa | Custo do conjunto |
| --------- | ----- | ------------ | ---------------- | ------------------------- | ----------------- |
| ajuste    | 3     | 0.67         | 2                | US$ 0.89                  | US$ 8.00          |
| validação | 0     | 0.00         | 0                | —                         | US$ 0.00          |

## Ajuste: por caso

| Caso                     | Tipo     | c/n | pass@3 | pass^3 | À parte | Custo médio | Turnos médios |
| ------------------------ | -------- | --- | ------ | ------ | ------- | ----------- | ------------- |
| comentarios-01-estrelas  | deve     | 0/3 | não    | não    | —       | US$ 1.84    | 49.7          |
| comentarios-02-respostas | deve     | 3/3 | sim    | sim    | —       | US$ 0.48    | 19.3          |
| comentarios-03-frase     | nao-deve | 3/3 | sim    | sim    | —       | US$ 0.34    | 16.3          |

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

- Agente: success, US$ 1.33, 50 turnos, 593 s, no começo: limite de 5 h em 38 %, semanal em 21 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-claude-md-comentarios\ajuste\comentarios-01-estrelas-1.jsonl`
- Modelos: claude-opus-5-5
- Juiz: 9 chamadas, US$ 0.34
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- juiz-comentario-descreve (falha): componentes/Fundo.tsx:5 FAIL (FAIL, FAIL, FAIL): O cabeçalho diz que as faíscas "apagam em meio segundo", mas VIDA_MS = 900, perto de um segundo. O restante (estrelas, crista, canvas 2D, laço só com faísca, tokens) confere.; componentes/Fundo.tsx:14 PASS (PASS, PASS, PASS): BLOCO_ESTRELA = 5 é o lado do bloco em células. O laço sorteia no máximo uma estrela por bloco, e um bloco menor deixa o céu mais cheio.; componentes/Fundo.tsx:43 PASS (PASS, PASS, PASS): borda(c) devolve 0,7 mais termos de ruído suave, ou seja, uma fração da altura (0 no alto, 1 embaixo) que varia por coluna. Confere com o comentário.; componentes/Fundo.tsx:112 PASS (PASS, PASS, PASS): A borda fica entre 0,7 e 0,89, então a crista ocupa no máximo os 30% de baixo, dentro do terço. O recorte vem de borda(c), que usa ruído, e as faixas de tom seguem a profundidade.; componentes/Fundo.tsx:130 PASS (PASS, PASS, PASS): O trecho confere com cada afirmação. As estrelas vêm depois do laço do céu. Há um sorteio por bloco, e as brancas com tamanho < 0,5 ficam com alpha 0,5. As de tamanho > 0,9 ganham quatro picos. noCeu protege o centro e os vizinhos que os picos usam.
- juiz-comentario-porque (falha): componentes/Fundo.tsx:5 PASS (PASS, PASS, PASS): Cabeçalho resume o arquivo: camadas da nebulosa, sinapses, canvas sem laço ocioso e regra G26 dos tokens. Não se entende de relance pelo código.; componentes/Fundo.tsx:14 PASS (PASS, PASS, PASS): Explica o significado do lado em células e o efeito de ajustar (menor = céu mais cheio), algo que o nome e o valor não dizem.; componentes/Fundo.tsx:43 PASS (PASS, PASS, FAIL): Define a escala (0 alto, 1 embaixo) e o que o retorno representa, não óbvio dos números mágicos da fórmula.; componentes/Fundo.tsx:112 FAIL (FAIL, FAIL, FAIL): Descreve em palavras o que o if (y > inicio) com borda(c) já mostra; "terço de baixo" nem bate com 0.7 de início. Pouco acrescenta.; componentes/Fundo.tsx:130 PASS (PASS, PASS, PASS): Explica a razão da ordem (passada após o céu), a lógica de distribuição por blocos, por que só brancas ficam apagadas e a restrição de não entrar na crista.
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-01-estrelas-1.diff](diffs/comentarios-01-estrelas-1.diff)
- Causa provável: A seção do CLAUDE.md não pegou no cabeçalho: o agente o reescreveu logo na primeira edição e manteve 'apagam em meio segundo' com VIDA_MS = 900 duas linhas abaixo ('descreve' por 3 a 0). Em 'porque', reprovou o comentário 'Crista de poeira: ocupa o terço de baixo', que ficou em cima de código alterado (3 a 0). Os comentários escritos na implementação (BLOCO_ESTRELA, borda, a passada das estrelas) passaram nos dois juízes.

### comentarios-02-respostas#1: passa

- Agente: success, US$ 0.46, 20 turnos, 143 s, no começo: limite de 5 h em 40 %, semanal em 21 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-claude-md-comentarios\ajuste\comentarios-02-respostas-1.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-02-respostas-1.diff](diffs/comentarios-02-respostas-1.diff)

### comentarios-03-frase#1: passa

- Agente: success, US$ 0.35, 17 turnos, 128 s, no começo: limite de 5 h em 40 %, semanal em 21 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-claude-md-comentarios\ajuste\comentarios-03-frase-1.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-03-frase-1.diff](diffs/comentarios-03-frase-1.diff)

### comentarios-01-estrelas#2: falha

- Agente: success, US$ 0.81, 33 turnos, 300 s, no começo: limite de 5 h em 42 %, semanal em 21 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-claude-md-comentarios\ajuste\comentarios-01-estrelas-2.jsonl`
- Modelos: claude-opus-5-5
- Juiz: 9 chamadas, US$ 0.28
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- juiz-comentario-descreve (falha): componentes/Fundo.tsx:5 FAIL (FAIL, FAIL, FAIL): Diz que as células apagam em meio segundo, mas VIDA_MS = 900, então a faísca leva quase um segundo para sumir. O resto do cabeçalho confere com o arquivo.; componentes/Fundo.tsx:13 PASS (PASS, PASS, PASS): ESTRELAS = 0.03 é usado em r > 1 - ESTRELAS, ou seja, cerca de 3% das células do céu ganham estrela.; componentes/Fundo.tsx:106 FAIL (FAIL, FAIL, FAIL): borda = 0.7 + até 0.19, então varia de 0.7 a 0.89. A crista ocupa no máximo 30% da altura e em média cerca de um quinto, nunca um terço.; componentes/Fundo.tsx:108 PASS (PASS, PASS, PASS): A chance é a mesma em qualquer altura até y <= borda. Brilho > 0.5 dá estrela branca, senão dourado ou azul. Brilho > 0.9 acrescenta os quatro braços (horizontal e vertical). As linhas da crista no fim do trecho já existiam e não têm relação com o comentário.
- juiz-comentario-porque (falha): componentes/Fundo.tsx:5 PASS (PASS, PASS, PASS): Cabeçalho resume o arquivo: camadas da nebulosa, sinapses, ausência de laço sem faísca e regra G26 das cores; não se lê de relance no código.; componentes/Fundo.tsx:13 FAIL (FAIL, FAIL, FAIL): Só descreve o nome ESTRELAS e o valor 0.03 como fração de células; nada além do que a constante já diz.; componentes/Fundo.tsx:106 PASS (PASS, PASS, PASS): Explica que a crista ocupa o terço de baixo (0.7) e que a borda é recortada por ruído; traduz os números mágicos em intenção.; componentes/Fundo.tsx:108 PASS (PASS, PASS, PASS): Explica a regra: chance uniforme até a borda e os limiares de brilho (brancas, picos), que ficam implícitos nos números 0.5 e 0.9.
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-01-estrelas-2.diff](diffs/comentarios-01-estrelas-2.diff)
- Causa provável: Também manteve 'apagam em meio segundo' no cabeçalho reescrito ('descreve' por 3 a 0). O comentário 'Crista de poeira: ocupa o terço de baixo' subiu junto com a linha de borda e reprovou em 'descreve' por 3 a 0 (a borda vai de 0,7 a 0,89); na #3, a mesma frase passou por 3 a 0, e na #1 o juiz de 'descreve' também a aceitou. O JSDoc de ESTRELAS reprovou em 'porque' por 3 a 0, por só dizer a fração que a constante já mostra.

### comentarios-02-respostas#2: passa

- Agente: success, US$ 0.44, 18 turnos, 140 s, no começo: limite de 5 h em 43 %, semanal em 21 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-claude-md-comentarios\ajuste\comentarios-02-respostas-2.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-02-respostas-2.diff](diffs/comentarios-02-respostas-2.diff)

### comentarios-03-frase#2: passa

- Agente: success, US$ 0.33, 15 turnos, 136 s, no começo: limite de 5 h em 43 %, semanal em 21 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-claude-md-comentarios\ajuste\comentarios-03-frase-2.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-03-frase-2.diff](diffs/comentarios-03-frase-2.diff)

### comentarios-01-estrelas#3: falha

- Agente: success, US$ 2.38, 66 turnos, 637 s, no começo: limite de 5 h em 47 %, semanal em 21 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-claude-md-comentarios\ajuste\comentarios-01-estrelas-3.jsonl`
- Modelos: claude-opus-5-5
- Juiz: 9 chamadas, US$ 0.37
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- juiz-comentario-descreve (falha): componentes/Fundo.tsx:5 FAIL (PASS, FAIL, FAIL): Diz "azul aberto no meio", mas o código mistura marinho→petróleo até y=0,5 e só depois vai para o azul (ceu), perto da crista. O comentário da linha 100 confirma: petróleo no meio, azul perto da crista. O resto do cabeçalho confere.; componentes/Fundo.tsx:15 PASS (PASS, PASS, PASS): BLOCO_ESTRELA = 5 é o lado do bloco em células, e o laço escolhe no máximo uma estrela por bloco, o que dá densidade uniforme.; componentes/Fundo.tsx:18 PASS (PASS, PASS, PASS): Se o maior ruído do bloco for menor que LIMIAR_ESTRELA, o código faz `continue` e o bloco fica sem estrela. Isso cria vãos no céu.; componentes/Fundo.tsx:114 PASS (PASS, PASS, PASS): O laço percorre cada bloco e escolhe a célula de maior ruído. Ele vem depois do laço que fecha o céu inteiro, então a textura e a linha de baixo não cobrem os picos.; componentes/Fundo.tsx:132 PASS (PASS, PASS, PASS): Com brilho > 0.45 a estrela é branca (cerca de 55%), o restante vira dourado ou azul. Com brilho > 0.9 há dois fillRect em cruz, que formam quatro picos.; componentes/Fundo.tsx:145 PASS (PASS, PASS, PASS): A crista começa em y > borda, com borda entre 0.7 e 0.89 e recortada por suave(). Isso é aproximadamente o terço de baixo. Ela é desenhada depois das estrelas e as cobre.
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-01-estrelas-3.diff](diffs/comentarios-01-estrelas-3.diff)
- Causa provável: Aplicou a seção: trocou 'meio segundo' por 'apagam em VIDA_MS' e avisou no fim que o §7 da especificação diz meio segundo. Passou em 'porque' e em 'antigo'. Reprovou só em 'descreve', por 2 a 1, na frase herdada 'azul aberto no meio' do cabeçalho: o comentário do céu no mesmo arquivo diz 'petróleo no meio, azul aberto perto da crista'. É item disputado, para o rótulo do Lucas decidir.

### comentarios-02-respostas#3: passa

- Agente: success, US$ 0.55, 20 turnos, 160 s, no começo: limite de 5 h em 0 %, semanal em 21 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-claude-md-comentarios\ajuste\comentarios-02-respostas-3.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-02-respostas-3.diff](diffs/comentarios-02-respostas-3.diff)

### comentarios-03-frase#3: passa

- Agente: success, US$ 0.35, 17 turnos, 124 s, no começo: limite de 5 h em 1 %, semanal em 21 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-claude-md-comentarios\ajuste\comentarios-03-frase-3.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-03-frase-3.diff](diffs/comentarios-03-frase-3.diff)

## Custo

| Agente   | Juiz     | Total    | Orçamento da rodada |
| -------- | -------- | -------- | ------------------- |
| US$ 7.01 | US$ 0.99 | US$ 8.00 | US$ 50.00           |
