# 2026-11-17-sonda

Sonda de isolamento: uma tentativa com Haiku, para ver no system/init o que carregou.

## Configuração

| Campo               | Valor                                               |
| ------------------- | --------------------------------------------------- |
| Modo                | sonda                                               |
| Base                | v1.0.0 (b282c5a)                                    |
| Claude Code         | 2.1.325 (C:\Users\ldick\.local\bin\claude.exe)      |
| Agente              | claude-haiku-5-5, esforço padrão, modo auto         |
| Juiz                | claude-sonnet-5-5, 3 votos                          |
| Tentativas por caso | 1                                                   |
| Teto por tentativa  | US$ 1.00                                            |
| Orçamento da rodada | US$ 50.00                                           |
| Harness             | harness.patch (sha256 e3b0c44298fc)                 |
| Começo e fim        | 2026-11-17T14:55:44.057Z a 2026-11-17T15:00:21.343Z |

## Resumo

| Conjunto  | Casos | Média de c/n | Casos com pass^1 | Custo médio por tentativa | Custo do conjunto |
| --------- | ----- | ------------ | ---------------- | ------------------------- | ----------------- |
| ajuste    | 1     | 1.00         | 1                | US$ 0.01                  | US$ 0.01          |
| validação | 0     | 0.00         | 0                | —                         | US$ 0.00          |

## Ajuste: por caso

| Caso                 | Tipo     | c/n | pass@1 | pass^1 | À parte | Custo médio | Turnos médios |
| -------------------- | -------- | --- | ------ | ------ | ------- | ----------- | ------------- |
| comentarios-03-frase | nao-deve | 1/1 | sim    | sim    | —       | US$ 0.01    | 16.0          |

## Ajuste: por avaliador

| Avaliador                | comentarios-03-frase |
| ------------------------ | -------------------- |
| transcricao              | informa              |
| fluxo-git                | 1/1                  |
| escopo-arquivos          | 1/1                  |
| sem-comentario-novo      | 1/1                  |
| comentarios-narracao     | 1/1                  |
| comentarios-idioma       | 1/1                  |
| comentarios-marca        | informa              |
| juiz-comentario-descreve | 1/1                  |
| juiz-comentario-porque   | 1/1                  |
| juiz-comentario-antigo   | 1/1                  |
| pedido-cumprido          | 1/1                  |
| sem-afrouxar             | informa              |
| checagens-do-site        | 1/1                  |

## Ajuste: tentativas

### comentarios-03-frase#1: passa

- Agente: success, US$ 0.01, 16 turnos, 120 s. Transcrição: `%LOCALAPPDATA%\synapse-evals\transcricoes\2026-11-17-sonda\ajuste\comentarios-03-frase-1.jsonl`
- Modelos: claude-haiku-5-5
- transcricao (informa): sem edição; 0 ação(ões) negada(s); skills: verificar; troca de modelo: claude-haiku-5-5
- comentarios-marca (informa): nenhum comentário cita nome que sumiu
- sem-afrouxar (informa): nenhum sinal de afrouxamento
- Marcas: troca de modelo: claude-haiku-5-5; init: plugins carregados: cc-plugin-agents-md, cc-plugin-telemetry, cc-plugin-privacy, cc-plugin-plugin-authoring
- Diff: [diffs/comentarios-03-frase-1.diff](diffs/comentarios-03-frase-1.diff)

## Custo

| Agente   | Juiz     | Total    | Orçamento da rodada |
| -------- | -------- | -------- | ------------------- |
| US$ 0.01 | US$ 0.00 | US$ 0.01 | US$ 50.00           |
