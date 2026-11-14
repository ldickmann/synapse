# Sinapse

Site profissional e portfólio de Lucas Elias Dickmann, desenvolvedor front-end em Navegantes, SC.

## O que é

Uma página só, em `/`, para dois públicos: o dono de negócio local que quer um site e quem avalia o trabalho do Lucas. A ação principal é abrir uma conversa no WhatsApp com a mensagem pronta.

A direção visual se chama Sinapse: a nebulosa de Carina em pixels, uma rede neural em canvas que liga os serviços e pequenos robôs em pixel art. Tudo em CSS, SVG e canvas 2D, sem WebGL, numa página estática do Next.js.

As regras do site (públicos, piso de qualidade, limites de desempenho, critérios de aceite e direção visual) estão em [docs/especificacao.md](docs/especificacao.md).

## Como rodar

Requisitos: Node 26 (`.nvmrc`) e pnpm 12.18.0 (o `packageManager` do `package.json`).

```sh
pnpm install                             # também liga o hook de commits
pnpm exec playwright install chromium    # só para os testes e as capturas
pnpm dev
```

A página abre em http://localhost:3000. Para ver no celular, na mesma rede, use `pnpm dev:rede` e abra o IP do computador na porta 3000.

Localmente, nenhuma variável de ambiente é obrigatória. O `.env.example` explica a única que existe, `NEXT_PUBLIC_SITE_URL`.

## Estrutura

```text
app/          layout, página, globals.css, tokens.css (única fonte de cor) e pagina.css
componentes/  as seções e os efeitos da página
lib/          fatos e textos, sem visual: marca, contato, oferta, trabalhos, metadados e texto.ts
public/       favicon e imagens dos trabalhos
scripts/      checagem de padrões, capturas e Lighthouse
tests/        testes de aceite do Playwright (site.spec.ts)
docs/         especificação e decisões
```

## Scripts

| Script                       | O que faz                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `pnpm dev`                   | servidor de desenvolvimento                                                       |
| `pnpm dev:rede`              | o mesmo, aberto para a rede local                                                 |
| `pnpm build`                 | build de produção                                                                 |
| `pnpm start`                 | serve o build (porta 3000)                                                        |
| `pnpm lint`                  | ESLint                                                                            |
| `pnpm formatar`              | formata tudo com o Prettier                                                       |
| `pnpm formatar:checar`       | confere a formatação, sem mudar arquivos                                          |
| `pnpm typecheck`             | gera os tipos das rotas e roda o `tsc`, sem precisar do build                     |
| `pnpm verificar:padroes`     | lê os arquivos atrás de cor fora dos tokens, padrões proibidos e visual em `lib/` |
| `pnpm verificar:testes`      | testes de aceite do Playwright, contra `pnpm start`                               |
| `pnpm verificar:screenshots` | capturas de `/` em 375 e 1440, contra `pnpm start`                                |
| `pnpm verificar:lighthouse`  | Lighthouse mobile de `/`, contra `pnpm start`                                     |
| `pnpm analisar`              | build com o relatório do bundle analyzer                                          |

## Verificação

O CI roda o mesmo, em todo PR:

```sh
pnpm install --frozen-lockfile
pnpm audit --prod --audit-level=high
pnpm lint
pnpm formatar:checar
pnpm verificar:padroes
pnpm typecheck
pnpm build
pnpm verificar:testes
```

Os testes sobem o `pnpm start` sozinhos, então precisam do build antes. Para rodar um teste só: `pnpm verificar:testes tests/site.spec.ts -g "X2"`.

Quando a interface muda, confira também, com `pnpm start` rodando:

- `pnpm verificar:screenshots`, olhando cada captura em `verificacao/screenshots/`;
- `pnpm verificar:lighthouse`, com os relatórios em `verificacao/`. Se o Lighthouse não rodar na máquina, a nota vem do PageSpeed Insights no endereço publicado.

A pasta `verificacao/` fica fora do git.

## Publicação

O site é publicado pela Vercel, pela integração com o GitHub, sem deploy manual:

- `main` é a produção;
- `develop` tem um preview com endereço fixo;
- cada PR ganha um preview próprio.

Os metadados (`og:url`, `canonical`) usam o endereço que a Vercel informa em cada ambiente (`lib/metadados.ts`). `NEXT_PUBLIC_SITE_URL` só é preciso para um domínio próprio.

O caminho de uma mudança até a produção (branch, PR, versão com o release-please e PR de `develop` para `main`) está em [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

Todos os direitos reservados. O código está aberto para leitura, mas não há licença de uso, cópia ou redistribuição.
