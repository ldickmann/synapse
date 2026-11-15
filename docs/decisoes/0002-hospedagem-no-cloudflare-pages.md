# 0002. Hospedagem no Cloudflare Pages

- Data: 2026-11-15
- Situação: aceita

## Contexto

A Sinapse anuncia os serviços do Lucas: é uso comercial. O plano Hobby da Vercel, onde o site estava, é só para uso pessoal ou não comercial ([termos da Vercel](https://vercel.com/legal/terms), seção 4). O site é uma página estática, sem rotas de API, middleware nem server actions, e o conteúdo não muda com a troca.

## Decisão 1: Cloudflare Pages, no plano gratuito, ligado ao GitHub

- O Pages publica pela integração com o GitHub, sem deploy pela linha de comando: `main` é a produção (`https://dlk-systems.pages.dev`), `develop` fica em `develop.dlk-systems.pages.dev` e cada PR ganha um preview.
- Os [termos da Cloudflare](https://www.cloudflare.com/terms/) não limitam o plano gratuito a uso pessoal. A única restrição que toca um site gratuito é não coletar dados de cartão.
- Os [limites do plano gratuito](https://developers.cloudflare.com/pages/platform/limits/) cabem com folga: 500 builds por mês, um por vez, 20 000 arquivos por site e 25 MiB por arquivo.

**Por que o Pages, e não o Workers.** A Cloudflare recomenda o Workers com assets estáticos para projetos novos, e os recursos novos entram nele. Para uma página estática, o Pages já tem tudo o que a decisão 2 da [0001](0001-licenca-branches-e-versoes.md) usa (preview por branch com endereço fixo, preview de PR, variáveis por ambiente), sem arquivo de configuração no repositório e sem o wrangler. Se o Pages deixar de atender, a migração para o Workers tem [guia oficial](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/) e muda o build, não o site.

**Alternativa descartada.** Vercel Pro: resolve o uso comercial, mas é pago, para uma página estática.

## Decisão 2: exportação estática, a mesma em todo lugar

- `output: 'export'` no `next.config.ts`: o `next build` gera `out/`, a pasta que o Pages publica.
- Localmente e no CI, o `pnpm start` serve essa pasta com `scripts/servir.ts`: gzip, os cabeçalhos de `public/_headers` e o `404.html`, como o Pages.

**Por quê.** Os testes, o Lighthouse e as capturas medem o mesmo build que vai para o ar, e o CI quebra se algo que a exportação não aceita entrar no código. O `next start` não serve a exportação.

**Alternativas descartadas.** Exportar só no build da Cloudflare: os testes mediriam um build que não vai para o ar. O adaptador OpenNext: roda um servidor no Workers para recursos que a página não usa. `serve` ou `wrangler pages dev` para servir `out/`: pacote novo; o primeiro repete os cabeçalhos em outro formato, e o segundo traz o runtime do Workers para o repositório.

## Decisão 3: o endereço nos metadados

- Produção: `NEXT_PUBLIC_SITE_URL` nas variáveis de produção do Pages. Sem ela, o build de `main` falha.
- Previews: `CF_PAGES_URL`, o endereço de cada implantação.

**Por quê.** O Pages não informa o endereço fixo da produção: o `CF_PAGES_URL` é o da implantação, com hash, também em `main`.

## Consequências

- O cache imutável de `/_next/static`, que o `next start` dava, vem de `public/_headers`. A compressão, o 404 e o `noindex` dos previews o Pages faz sozinho.
- O brotli e os redirects de `.html` do Pages não existem no `servir.ts`: conferem-se no preview. O G10 local mede com gzip, acima do que o Pages entrega.
- O Node vem do `.nvmrc`. O pnpm troca sozinho para a versão do `packageManager`, conferida no log do build. O Pages não lê o `engines`.
- O endereço oficial passa a ser `https://dlk-systems.pages.dev` com a 1.0.0.
