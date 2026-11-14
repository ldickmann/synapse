<!--
O título do PR vira a mensagem do squash em develop e entra no CHANGELOG:
<tipo>(<escopo>): <descrição>, com ! antes dos dois-pontos se quebra algo. Veja CONTRIBUTING.md.
-->

## O que muda

<!-- O que e por quê, em poucas frases. Issue relacionada: Closes #N. -->

## Como verificar

<!-- Passos para conferir a mudança na página ou no terminal. -->

## Checklist

- [ ] O título segue o padrão de commits.
- [ ] O CI passa (install, auditoria, lint, formatação, padrões, typecheck, build e Playwright).
- [ ] Se a interface mudou: capturas de `/` em 375 e 1440 conferidas (`pnpm verificar:screenshots`) e console sem erro.
- [ ] Se uma regra mudou: `docs/especificacao.md` e testes atualizados juntos.
