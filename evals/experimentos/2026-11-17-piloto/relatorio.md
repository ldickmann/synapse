# 2026-11-17-piloto

Linha de base: o harness do commit base, sem mudança.

## Configuração

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| Modo                | rodada                                              |
| Base                | v1.0.0 (b282c5a)                                    |
| Claude Code         | 2.1.325 (C:\Users\ldick\.local\bin\claude.exe)      |
| Agente              | claude-opus-5-5, esforço xhigh, modo auto           |
| Juiz                | claude-sonnet-5-5, 3 votos                          |
| Tentativas por caso | 1                                                   |
| Teto por tentativa  | US$ 8.00                                            |
| Orçamento da rodada | US$ 50.00                                           |
| Harness             | harness.patch (sha256 e3b0c44298fc)                 |
| Começo e fim        | 2026-11-17T15:33:02.802Z a 2026-11-17T15:47:06.806Z |

## Resumo

| Conjunto  | Casos | Média de c/n | Casos com pass^1 | Custo médio por tentativa | Custo do conjunto |
| --------- | ----- | ------------ | ---------------- | ------------------------- | ----------------- |
| ajuste    | 1     | 0.00         | 0                | US$ 2.30                  | US$ 2.30          |
| validação | 0     | 0.00         | 0                | —                         | US$ 0.00          |

## Ajuste: por caso

| Caso                    | Tipo | c/n | pass@1 | pass^1 | À parte | Custo médio | Turnos médios |
| ----------------------- | ---- | --- | ------ | ------ | ------- | ----------- | ------------- |
| comentarios-01-estrelas | deve | 0/1 | não    | não    | —       | US$ 2.30    | 63.0          |

## Ajuste: por avaliador

| Avaliador                | comentarios-01-estrelas |
| ------------------------ | ----------------------- |
| transcricao              | informa                 |
| fluxo-git                | 1/1                     |
| escopo-arquivos          | 1/1                     |
| comentario-vigiado       | 1/1                     |
| comentarios-narracao     | 1/1                     |
| comentarios-idioma       | 1/1                     |
| comentarios-marca        | informa                 |
| juiz-comentario-descreve | 0/1                     |
| juiz-comentario-porque   | 0/1                     |
| juiz-comentario-antigo   | 0/1                     |
| pedido-cumprido          | 1/1                     |
| sem-afrouxar             | informa                 |
| checagens-do-site        | 1/1                     |

## Ajuste: tentativas

### comentarios-01-estrelas#1: falha

- Agente: success, US$ 1.91, 63 turnos, 629 s, no começo: limite de 5 h em 45 %, semanal em 14 %, uso extra rejected. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-piloto\ajuste\comentarios-01-estrelas-1.jsonl`
- Modelos: claude-opus-5-5
- Juiz: 12 chamadas, US$ 0.39
- transcricao (informa): verificou depois da última edição; 0 ação(ões) negada(s); skills: verificar
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- juiz-comentario-descreve (falha): componentes/Fundo.tsx:5 FAIL (FAIL, FAIL, FAIL): O comentário diz que as faíscas apagam em meio segundo, mas VIDA_MS = 900, perto de um segundo. O resto do cabeçalho confere com o código.; componentes/Fundo.tsx:14 PASS (PASS, PASS, PASS): BLOCO = 5 é o lado em células do bloco. O código sorteia no máximo uma estrela por bloco.; componentes/Fundo.tsx:16 PASS (PASS, PASS, PASS): `ruido > PRESENCA` pula o bloco, então cerca de 0,8 dos blocos recebem estrela. É a fração que o comentário descreve.; componentes/Fundo.tsx:128 PASS (PASS, PASS, PASS): posicao limita o deslocamento a 0..BLOCO-2, então a última coluna e a última linha do bloco ficam vazias. Estrelas de blocos vizinhos ficam a pelo menos 2 células, sem se tocar. Há no máximo uma estrela por bloco, em ponto sorteado.; componentes/Fundo.tsx:138 PASS (PASS, PASS, PASS): Pula a estrela se altura(l+1) > bordaEm(c), isto é, se a célula de baixo já é crista. Isso impede que a estrela encoste na crista. O `c >= colunas` na mesma linha é um limite à parte.; componentes/Fundo.tsx:140 PASS (PASS, PASS, PASS): tipo<0.07 desenha quatro picos. Estrelas claras (tipo<0.4 ou fraca) usam cores.estrela. O azul só entra com altura<0.45. As fracas, com tipo>=0.7, usam alpha 0.45.
- juiz-comentario-porque (falha): componentes/Fundo.tsx:5 PASS (PASS, PASS, PASS): Cabeçalho resume o arquivo: composição visual em camadas, comportamento do laço de animação e a regra G26 dos tokens; não se lê de relance.; componentes/Fundo.tsx:14 FAIL (PASS, FAIL, FAIL): Descreve BLOCO em palavras; o nome da constante e o uso já dizem isso, sem razão ou restrição extra.; componentes/Fundo.tsx:16 FAIL (FAIL, FAIL, FAIL): Só reescreve o nome PRESENCA = 0.8 em frase; o comentário não acrescenta nada além do que o código já diz.; componentes/Fundo.tsx:128 PASS (PASS, PASS, PASS): Dá a razão da ordem (picos não cobertos), o esquema de blocos e a garantia de que estrelas não se tocam, o que decorre de BLOCO-2 e não é óbvio.; componentes/Fundo.tsx:138 PASS (PASS, PASS, PASS): Explica por que se testa l+1: o pico inferior de 4 pontas não pode encostar na crista; a razão não está evidente na condição.; componentes/Fundo.tsx:140 PASS (PASS, PASS, PASS): Resume as categorias de estrela codificadas em limiares numéricos (grandes, claras, coloridas, fracas) e a intenção de profundidade.
- juiz-comentario-antigo (falha): componentes/Fundo.tsx:97 (comentário movido cujo trecho mudou) PASS (PASS, PASS, PASS): `bordaEm` mantém a borda em 0,7 mais ruído, então a crista continua ocupando o terço de baixo com borda recortada. `y = altura(l)` é a linha acrescentada, mas serve ao cálculo da crista. O `for` já existia.; componentes/Fundo.tsx:107 (o trecho de um comentário mantido mudou) FAIL (FAIL, FAIL, FAIL): A tentativa pôs `const borda = bordaEm(c)` (linha com +) logo abaixo do bloco da textura do céu, sem linha em branco. Essa linha pertence à crista de poeira e não tem relação com o comentário sobre a textura do céu.
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Diff: [diffs/comentarios-01-estrelas-1.diff](diffs/comentarios-01-estrelas-1.diff)

## Custo

| Agente   | Juiz     | Total    | Orçamento da rodada |
| -------- | -------- | -------- | ------------------- |
| US$ 1.91 | US$ 0.39 | US$ 2.30 | US$ 50.00           |
