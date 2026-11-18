# 2026-11-18-verificar-comentarios contra 2026-11-17-linha-de-base

Mesma versão do Claude Code, mesmo modelo e mesmo base.

## Ajuste

| Caso                     | Em uso c/n | Candidato c/n | Marca | P(candidato melhor) | Custo em uso | Custo candidato | Turnos em uso | Turnos candidato |
| ------------------------ | ---------- | ------------- | ----- | ------------------- | ------------ | --------------- | ------------- | ---------------- |
| comentarios-01-estrelas  | 0/3        | 0/3           | igual | 0.50                | US$ 2.19     | US$ 2.30        | 57.7          | 57.0             |
| comentarios-02-respostas | 3/3        | 3/3           | igual | 0.50                | US$ 0.44     | US$ 0.52        | 17.7          | 17.7             |
| comentarios-03-frase     | 3/3        | 3/3           | igual | 0.50                | US$ 0.33     | US$ 0.36        | 14.7          | 17.7             |

## Validação

| Caso                 | Em uso c/n | Candidato c/n | Marca    | P(candidato melhor) | Custo em uso | Custo candidato | Turnos em uso | Turnos candidato |
| -------------------- | ---------- | ------------- | -------- | ------------------- | ------------ | --------------- | ------------- | ---------------- |
| comentarios-v1-onda  | 0/3        | —             | sem dado | —                   | US$ 1.03     | —               | 33.7          | —                |
| comentarios-v2-frase | 3/3        | —             | sem dado | —                   | US$ 0.34     | —               | 16.7          | —                |

## Ajuste: por avaliador

| Caso                     | Avaliador                | Em uso | Candidato |
| ------------------------ | ------------------------ | ------ | --------- |
| comentarios-01-estrelas  | checagens-do-site        | 3/3    | 3/3       |
| comentarios-01-estrelas  | comentario-vigiado       | 3/3    | 3/3       |
| comentarios-01-estrelas  | comentarios-idioma       | 3/3    | 3/3       |
| comentarios-01-estrelas  | comentarios-marca        | 0/3    | 0/3       |
| comentarios-01-estrelas  | comentarios-narracao     | 3/3    | 3/3       |
| comentarios-01-estrelas  | escopo-arquivos          | 3/3    | 3/3       |
| comentarios-01-estrelas  | fluxo-git                | 3/3    | 3/3       |
| comentarios-01-estrelas  | juiz-comentario-antigo   | 3/3    | 2/3       |
| comentarios-01-estrelas  | juiz-comentario-descreve | 0/3    | 0/3       |
| comentarios-01-estrelas  | juiz-comentario-porque   | 1/3    | 0/3       |
| comentarios-01-estrelas  | pedido-cumprido          | 3/3    | 3/3       |
| comentarios-01-estrelas  | sem-afrouxar             | 0/3    | 0/3       |
| comentarios-01-estrelas  | sem-comentario-novo      | —      | —         |
| comentarios-01-estrelas  | transcricao              | 0/3    | 0/3       |
| comentarios-02-respostas | checagens-do-site        | 3/3    | 3/3       |
| comentarios-02-respostas | comentario-vigiado       | 3/3    | 3/3       |
| comentarios-02-respostas | comentarios-idioma       | 3/3    | 3/3       |
| comentarios-02-respostas | comentarios-marca        | 0/3    | 0/3       |
| comentarios-02-respostas | comentarios-narracao     | 3/3    | 3/3       |
| comentarios-02-respostas | escopo-arquivos          | 3/3    | 3/3       |
| comentarios-02-respostas | fluxo-git                | 3/3    | 3/3       |
| comentarios-02-respostas | juiz-comentario-antigo   | 3/3    | 3/3       |
| comentarios-02-respostas | juiz-comentario-descreve | 3/3    | 3/3       |
| comentarios-02-respostas | juiz-comentario-porque   | 3/3    | 3/3       |
| comentarios-02-respostas | pedido-cumprido          | 3/3    | 3/3       |
| comentarios-02-respostas | sem-afrouxar             | 0/3    | 0/3       |
| comentarios-02-respostas | sem-comentario-novo      | —      | —         |
| comentarios-02-respostas | transcricao              | 0/3    | 0/3       |
| comentarios-03-frase     | checagens-do-site        | 3/3    | 3/3       |
| comentarios-03-frase     | comentario-vigiado       | —      | —         |
| comentarios-03-frase     | comentarios-idioma       | 3/3    | 3/3       |
| comentarios-03-frase     | comentarios-marca        | 0/3    | 0/3       |
| comentarios-03-frase     | comentarios-narracao     | 3/3    | 3/3       |
| comentarios-03-frase     | escopo-arquivos          | 3/3    | 3/3       |
| comentarios-03-frase     | fluxo-git                | 3/3    | 3/3       |
| comentarios-03-frase     | juiz-comentario-antigo   | 3/3    | 3/3       |
| comentarios-03-frase     | juiz-comentario-descreve | 3/3    | 3/3       |
| comentarios-03-frase     | juiz-comentario-porque   | 3/3    | 3/3       |
| comentarios-03-frase     | pedido-cumprido          | 3/3    | 3/3       |
| comentarios-03-frase     | sem-afrouxar             | 0/3    | 0/3       |
| comentarios-03-frase     | sem-comentario-novo      | 3/3    | 3/3       |
| comentarios-03-frase     | transcricao              | 0/3    | 0/3       |
