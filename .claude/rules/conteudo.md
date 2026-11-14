---
paths:
  - 'lib/**'
---

# Conteúdo e fatos (`lib/`)

- **Sem visual (G21).** `lib/` só tem `.ts` com dados e funções: nada de `.tsx`, `.css` ou `className`. Prova: `pnpm verificar:padroes`.
- **Onde fica cada coisa.** Fatos da oferta em `marca.ts`, `oferta.ts`, `contato.ts` e `trabalhos.ts`; o texto da página, com o tom, em `texto.ts`; os metadados em `metadados.ts`. Um fato aparece num lugar só e é importado de lá.
- **Dado pendente é `null`.** A frase que depende dele não é renderizada, como em `linhasCondicionais()` de `oferta.ts`. Nada é inventado para preencher o espaço: sem depoimentos, clientes, números, garantias, preço ou prazo (`docs/especificacao.md` §1).
- **Dado que chega.** Quando o Lucas passa um dado pendente, ele entra em `lib/` e sai da tabela do §6 de `docs/especificacao.md`, no mesmo commit.
- **WhatsApp (G4).** Todo link de WhatsApp vem de `linkWhatsApp()`, de `contato.ts`. A mensagem pronta é `MENSAGEM_WHATSAPP`, e o teste compara cada link com ela.
- **Trabalhos.** Só aparecem os que têm link (`TRABALHOS_REAIS`), com imagem 4:3 em `public/trabalhos/`.
- **Texto.** Português do Brasil, frases curtas, sem jargão, sem exagero e sem promessa que o Lucas não fez. Nada de "→", ponto médio entre metadados ou numeração 01/02/03 em texto (G22).
