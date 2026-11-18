# 2026-11-18-verificar-comentarios

Uma etapa de comentários no /verificar, que confere cada afirmação dos blocos de comentário tocados contra o código e se dizem o porquê, leva comentarios-01-estrelas a pelo menos 2/3 sem tirar tentativa de comentarios-02-respostas e comentarios-03-frase.

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
| Harness             | harness.patch (sha256 780f0cfca143)                 |
| Começo e fim        | 2026-11-18T15:46:41.571Z a 2026-11-18T16:51:40.750Z |

## Resumo

| Conjunto  | Casos | Média de c/n | Casos com pass^3 | Custo médio por tentativa | Custo do conjunto |
| --------- | ----- | ------------ | ---------------- | ------------------------- | ----------------- |
| ajuste    | 3     | 0.67         | 2                | US$ 1.06                  | US$ 9.52          |
| validação | 0     | 0.00         | 0                | —                         | US$ 0.00          |

## Ajuste: por caso

| Caso                     | Tipo     | c/n | pass@3 | pass^3 | À parte | Custo médio | Turnos médios |
| ------------------------ | -------- | --- | ------ | ------ | ------- | ----------- | ------------- |
| comentarios-01-estrelas  | deve     | 0/3 | não    | não    | —       | US$ 2.30    | 57.0          |
| comentarios-02-respostas | deve     | 3/3 | sim    | sim    | —       | US$ 0.52    | 17.7          |
| comentarios-03-frase     | nao-deve | 3/3 | sim    | sim    | —       | US$ 0.36    | 17.7          |

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
| juiz-comentario-porque   | 0/3                     | 3/3                      | 3/3                  |
| juiz-comentario-antigo   | 2/3                     | 3/3                      | 3/3                  |
| pedido-cumprido          | 3/3                     | 3/3                      | 3/3                  |
| sem-afrouxar             | informa                 | informa                  | informa              |
| checagens-do-site        | 3/3                     | 3/3                      | 3/3                  |
| sem-comentario-novo      | —                       | —                        | 3/3                  |

## Ajuste: tentativas

### comentarios-01-estrelas#1: falha

- Agente: success, US$ 2.48, 72 turnos, 735 s, no começo: limite de 5 h em 11 %, semanal em 17 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-verificar-comentarios\ajuste\comentarios-01-estrelas-1.jsonl`
- Modelos: claude-opus-5-5
- Juiz: 9 chamadas, US$ 0.42
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- juiz-comentario-descreve (falha): componentes/Fundo.tsx:5 FAIL (FAIL, FAIL, FAIL): Diz que as faíscas apagam em meio segundo, mas VIDA_MS = 900, quase um segundo. O resto do cabeçalho confere.; componentes/Fundo.tsx:14 PASS (PASS, PASS, PASS): BLOCO=5 e OCUPACAO=0.8 dão 0,8/25 ≈ 3,2 % das células. Descontadas as estrelas atrás da crista, os números ficam plausíveis (cerca de 90 em 1440×900).; componentes/Fundo.tsx:46 PASS (PASS, PASS, PASS): A função devolve 0,7 + até 0,14 + até 0,05, ou seja, uma fração entre 0,7 e 0,89, que varia por coluna, e isso é a borda recortada.; componentes/Fundo.tsx:103 PASS (PASS, PASS, PASS): O código tem três passadas em ordem: o laço do céu termina antes, depois vêm as estrelas e por último a crista. Isso explica por que o pico não é apagado e por que a crista cobre o que cai nela.; componentes/Fundo.tsx:120 PASS (PASS, PASS, PASS): Estrela pequena: floor(r*4) dá 0 a 3, então fica fora da última posição. Grande: 1 + floor(r*2) dá 1 ou 2, fora da primeira e da penúltima. Tem quatro picos e é pulada se altura(l) > bordaDaCrista(c).; componentes/Fundo.tsx:148 PASS (PASS, PASS, PASS): Pinta a crista quando y > borda, e a borda vai de 0,70 a 0,89 conforme a coluna, o que bate com o comentário.
- juiz-comentario-porque (falha): componentes/Fundo.tsx:5 PASS (PASS, PASS, PASS): Cabeçalho que resume o arquivo: camadas visuais, sinapses, canvas sem laço ocioso e a regra G26 dos tokens; não se entende de relance pelo código.; componentes/Fundo.tsx:14 PASS (PASS, PASS, PASS): Explica a razão do esquema de blocos (distribuição uniforme sem aglomerar) e dá números de densidade e tamanhos de tela que o código não mostra.; componentes/Fundo.tsx:46 FAIL (FAIL, FAIL, FAIL): Descreve em frase o que o nome bordaDaCrista e a fórmula já dizem; só acrescenta pouco além do nome da função.; componentes/Fundo.tsx:103 PASS (PASS, PASS, PASS): Explica por que a ordem das três passadas importa (pico da estrela não apagado, crista cobre pico), razão não evidente do código.; componentes/Fundo.tsx:120 PASS (PASS, PASS, PASS): Explica as restrições de posição por tamanho para evitar contato entre estrelas e picos, e por que as atrás da crista são omitidas.; componentes/Fundo.tsx:148 FAIL (FAIL, PASS, FAIL): Repete que a crista fica abaixo da borda (if y > borda); a faixa 70–89 % apenas reflete os números de bordaDaCrista, que valem pouco como informação nova.
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-01-estrelas-1.diff](diffs/comentarios-01-estrelas-1.diff)
- Causa provável: A etapa de comentários rodou: o agente leu o diff com git diff -U8 e corrigiu um comentário falso ('ocupa o terço de baixo'). Mas não conferiu o cabeçalho de Fundo.tsx, que ele mesmo reescreveu no começo mantendo 'apagam em meio segundo' com VIDA_MS = 900 três linhas abaixo; reprovou em 'descreve' por 3 a 0. Duas reprovações em 'porque': o JSDoc de bordaDaCrista, escrito na implementação, repete o nome da função; e a correção feita na própria etapa ('entre 70 % e 89 % da altura conforme a coluna') copia os números de bordaDaCrista e reprovou por 2 a 1.

### comentarios-02-respostas#1: passa

- Agente: success, US$ 0.53, 20 turnos, 157 s, no começo: limite de 5 h em 13 %, semanal em 18 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-verificar-comentarios\ajuste\comentarios-02-respostas-1.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-02-respostas-1.diff](diffs/comentarios-02-respostas-1.diff)

### comentarios-03-frase#1: passa

- Agente: success, US$ 0.40, 20 turnos, 194 s, no começo: limite de 5 h em 15 %, semanal em 18 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-verificar-comentarios\ajuste\comentarios-03-frase-1.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-03-frase-1.diff](diffs/comentarios-03-frase-1.diff)

### comentarios-01-estrelas#2: falha

- Agente: success, US$ 1.75, 53 turnos, 666 s, no começo: limite de 5 h em 19 %, semanal em 18 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-verificar-comentarios\ajuste\comentarios-01-estrelas-2.jsonl`
- Modelos: claude-opus-5-5
- Juiz: 12 chamadas, US$ 0.36
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- juiz-comentario-descreve (falha): componentes/Fundo.tsx:5 PASS (PASS, PASS, FAIL): Gradiente, estrelas até a crista, crista em ferrugem/brasa/laranja/pêssego, faíscas de 900 ms, canvas 2D e laço parado sem faíscas batem com o código.; componentes/Fundo.tsx:14 PASS (PASS, PASS, PASS): ESTRELAS=0.03 é usada como limiar uniforme em ruido, sem depender da altura no céu.; componentes/Fundo.tsx:16 PASS (PASS, PASS, PASS): 0.1 das estrelas viram grandes (r > 1 - ESTRELAS*ESTRELAS_GRANDES), exceto se (l+1)/fim > borda, a linha que encosta na crista.; componentes/Fundo.tsx:99 FAIL (FAIL, FAIL, FAIL): O comentário descreve só `bordas`, mas a tentativa pôs debaixo dele `const estrelas: Estrela[] = []` e `const y = l / fim` (linhas com +), sem relação com ele.; componentes/Fundo.tsx:120 PASS (PASS, PASS, PASS): Chance uniforme no céu; tom<0.5 estrela, <0.75 dourado, resto azul; grande exige (l+1)/fim <= borda.; componentes/Fundo.tsx:130 PASS (PASS, PASS, PASS): Perto da borda (prof<0.12) pêssego/acento e depois brasa, ferrugem e marrom em prof maior; confere.; componentes/Fundo.tsx:145 PASS (PASS, PASS, PASS): Estrelas são empilhadas e desenhadas após o laço; os picos vão para baixo e para a direita, que seriam cobertos pelas linhas e células seguintes.
- juiz-comentario-porque (falha): componentes/Fundo.tsx:5 PASS (PASS, PASS, PASS): Cabeçalho resume o arquivo: composição visual em camadas, sinapses, decisão de não manter laço sem faíscas e regra G26 dos tokens. Não se lê de relance.; componentes/Fundo.tsx:14 PASS (PASS, PASS, PASS): Explica a intenção da constante: densidade uniforme em todo o céu, o que o valor 0.03 sozinho não diz.; componentes/Fundo.tsx:16 PASS (PASS, PASS, PASS): Esclarece que é fração das estrelas e a exceção da linha junto à crista, regra não evidente no nome.; componentes/Fundo.tsx:99 FAIL (FAIL, FAIL, FAIL): Só descreve em palavras o array bordas: início da crista por coluna com ruído. O código já diz isso.; componentes/Fundo.tsx:120 PASS (PASS, PASS, PASS): Dá a distribuição de cores (metade branca, resto dourado/ciano) e a restrição das grandes ao pico caber no céu; razão de escolha não óbvia.; componentes/Fundo.tsx:130 FAIL (PASS, FAIL, FAIL): Resume o que o if/else em cascata de profundidade já mostra: pêssego/acento na borda, marrom no fundo.; componentes/Fundo.tsx:145 PASS (PASS, PASS, PASS): Explica por que as estrelas são desenhadas depois do laço: picos seriam cobertos. Razão de ordem não visível no código.
- juiz-comentario-antigo (falha): componentes/Fundo.tsx:113 (o trecho de um comentário mantido mudou) FAIL (FAIL, FAIL, FAIL): A tentativa acrescentou, sob o comentário da textura do céu, as linhas 118-119 (const borda = bordas[c]; if (y <= borda)), que tratam de borda/limite e não têm relação com blocos de textura do céu.
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-01-estrelas-2.diff](diffs/comentarios-01-estrelas-2.diff)
- Causa provável: A etapa de comentários achou e corrigiu a frase herdada: o cabeçalho passou a dizer 'apagam em menos de um segundo' e passou em 'descreve'. Falhou pelo alcance dos blocos: o comentário 'Onde a crista começa em cada coluna' ficou em cima de bordas e também de const estrelas, sem linha em branco ('descreve' e 'porque' por 3 a 0); e o comentário mantido da textura do céu ganhou embaixo const borda e if (y <= borda), que não têm relação com ele ('antigo' por 3 a 0). A correção da etapa no comentário da crista ('pêssego e laranja na borda, escurecendo até o marrom') reprovou em 'porque' por 2 a 1, por resumir o if/else de baixo.

### comentarios-02-respostas#2: passa

- Agente: success, US$ 0.53, 19 turnos, 160 s, no começo: limite de 5 h em 23 %, semanal em 19 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-verificar-comentarios\ajuste\comentarios-02-respostas-2.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-02-respostas-2.diff](diffs/comentarios-02-respostas-2.diff)

### comentarios-03-frase#2: passa

- Agente: success, US$ 0.31, 15 turnos, 123 s, no começo: limite de 5 h em 24 %, semanal em 19 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-verificar-comentarios\ajuste\comentarios-03-frase-2.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-03-frase-2.diff](diffs/comentarios-03-frase-2.diff)

### comentarios-01-estrelas#3: falha

- Agente: success, US$ 1.48, 46 turnos, 452 s, no começo: limite de 5 h em 28 %, semanal em 19 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-verificar-comentarios\ajuste\comentarios-01-estrelas-3.jsonl`
- Modelos: claude-opus-5-5
- Juiz: 9 chamadas, US$ 0.40
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- juiz-comentario-descreve (falha): componentes/Fundo.tsx:5 FAIL (FAIL, FAIL, FAIL): Diz que as faíscas apagam em meio segundo, mas VIDA_MS = 900, perto de um segundo. O resto do cabeçalho bate com o código.; componentes/Fundo.tsx:12 PASS (PASS, PASS, PASS): BLOCO_ESTRELA é usado como n, o lado em células do bloco de cada estrela.; componentes/Fundo.tsx:43 PASS (PASS, PASS, PASS): borda devolve 0,7 a 0,89 da altura, com 0 no alto e 1 embaixo, recortada por ruído suave.; componentes/Fundo.tsx:110 PASS (PASS, PASS, PASS): A borda fica entre 0,70 e 0,89, então a crista ocupa de 11% a 30% da altura. O desenho usa ruído e só pinta quando y > inicio.; componentes/Fundo.tsx:127 PASS (PASS, PASS, PASS): ruido < 0,2 descarta cerca de um bloco em cinco. floor(r*(n-1)) vai de 0 a n-2, nunca a última célula, o que deixa ao menos uma célula entre vizinhas. Há um ponto sorteado por bloco.; componentes/Fundo.tsx:139 PASS (PASS, PASS, PASS): (l+2)/ultimaLinha > borda(c) descarta a estrela sem duas linhas de folga, então nem ela nem o pico de baixo (l+1) tocam a poeira.; componentes/Fundo.tsx:144 PASS (PASS, PASS, PASS): grande = r > 0,9 dá cerca de uma em dez, e as grandes ganham os braços de quatro picos.; componentes/Fundo.tsx:146 PASS (PASS, PASS, PASS): azul exige !grande, y < 0,45 (céu escuro) e tom >= 0,8, como o comentário diz.; componentes/Fundo.tsx:149 PASS (PASS, PASS, PASS): O alpha 0,6 só vale com tom < 0,55 (brancas) e r < 0,5, metade delas. O dourado fica com alpha 1.
- juiz-comentario-porque (falha): componentes/Fundo.tsx:5 PASS (PASS, PASS, PASS): Resume o arquivo inteiro (camadas, sinapses, canvas sem laço ocioso) e cita a regra G26 dos tokens; não se entende de relance.; componentes/Fundo.tsx:12 FAIL (FAIL, FAIL, FAIL): Só reescreve em frase o nome BLOCO_ESTRELA; o nome já diz que é o lado do bloco de estrela.; componentes/Fundo.tsx:43 PASS (PASS, PASS, PASS): Explica a escala da altura (0 alto, 1 embaixo) e que o valor é onde a crista começa; as constantes mágicas não dizem isso.; componentes/Fundo.tsx:110 FAIL (FAIL, FAIL, FAIL): A faixa '11% a 30%' não bate com o código (borda ~0,7 a 0,89), mas o resto repete o que o código faz; não acrescenta razão. Fica como repetição.; componentes/Fundo.tsx:127 PASS (PASS, PASS, PASS): Explica o porquê da segunda passada, a lógica de distribuição por bloco, o vazio de 20% e o n-1 que garante espaço entre vizinhas.; componentes/Fundo.tsx:139 PASS (PASS, PASS, PASS): Explica a razão do +2: folga para a estrela e o pico de baixo não caírem na poeira.; componentes/Fundo.tsx:144 FAIL (FAIL, PASS, FAIL): Traduz r > 0.9 e 'grande' em frase; só acrescenta a proporção, que se lê direto do limiar.; componentes/Fundo.tsx:146 PASS (PASS, PASS, PASS): Dá a razão visual: o azul some no azul aberto do meio, por isso y < 0.45 e só nas pequenas.; componentes/Fundo.tsx:149 PASS (PASS, PASS, PASS): Explica a razão da restrição às brancas: alfa reduzido no dourado vira oliva, armadilha que o código não mostra.
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-01-estrelas-3.diff](diffs/comentarios-01-estrelas-3.diff)
- Causa provável: A etapa de comentários rodou e corrigiu três proporções, mas não conferiu o cabeçalho reescrito, que manteve 'apagam em meio segundo' com VIDA_MS = 900 ('descreve' por 3 a 0). Em 'porque', o JSDoc de BLOCO_ESTRELA, escrito na implementação, repete o nome da constante (3 a 0; na linha de base, um JSDoc parecido passou por 2 a 1). Duas correções da própria etapa também reprovaram em 'porque': 'ocupa de 11 % a 30 % da altura' (3 a 0; o raciocínio de um voto diz que a faixa não bate com o código, mas 1 − 0,89 e 1 − 0,70 dão 11 % e 30 %) e 'Cerca de uma em cada dez ganha quatro picos' (2 a 1).

### comentarios-02-respostas#3: passa

- Agente: success, US$ 0.49, 14 turnos, 169 s, no começo: limite de 5 h em 29 %, semanal em 19 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-verificar-comentarios\ajuste\comentarios-02-respostas-3.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-02-respostas-3.diff](diffs/comentarios-02-respostas-3.diff)

### comentarios-03-frase#3: passa

- Agente: success, US$ 0.37, 18 turnos, 143 s, no começo: limite de 5 h em 30 %, semanal em 19 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-18-verificar-comentarios\ajuste\comentarios-03-frase-3.jsonl`
- Modelos: claude-opus-5-5
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-03-frase-3.diff](diffs/comentarios-03-frase-3.diff)

## Custo

| Agente   | Juiz     | Total    | Orçamento da rodada |
| -------- | -------- | -------- | ------------------- |
| US$ 8.34 | US$ 1.18 | US$ 9.52 | US$ 50.00           |
