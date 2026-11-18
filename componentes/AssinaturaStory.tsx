// Assinatura de autoria, estilo Story: a logo DLK num quadrado com sombra dura, o nome e "DLK" em binário.
// Paleta e fontes próprias, fora dos tokens do site (exceção declarada em scripts/checar-padroes.ts).
// Componente de servidor: só o link (LinkAtivo, com useAtivo() para o X2) hidrata. Requer React 19: o <style>
// com href e precedence vai para o <head> e não se repete se a assinatura aparecer mais de uma vez.
import { LinkAtivo } from './LinkAtivo'

/** Peças da logo DLK, iguais a MONOGRAMA_PECAS em lib/marca.ts. Não editar. */
const LOGO = {
  l: 'M1000.04 1412.94 L999.68 1243.79 L1030.58 1208.99 L1069.26 1170.36 L1069.31 1340.96 L1164.47 1341.22 L1100.96 1412.87 Z M1199.95 1308.83 L1090.00 1191.91 L1068.11 1169.81 L1119.74 1117.71 L1250.32 1257.62 Z',
  d: 'M589.60 1413.19 L589.48 659.89 L716.83 660.05 L945.25 917.51 L945.58 1034.31 L688.12 743.42 L666.85 721.94 L666.32 1339.92 L763.90 1340.10 L950.95 1122.17 L1053.32 1122.54 L803.44 1413.28 Z',
  k: 'M1058.03 1111.59 L999.92 1049.99 L999.88 659.74 L1074.89 660.05 L1074.69 1093.49 Z M1437.98 1413.36 L1290.55 1413.34 L1198.08 1308.11 L1249.31 1256.01 L1326.73 1339.86 L1363.43 1340.04 L1363.00 1217.41 L1125.23 953.99 L1125.12 854.58 L1303.69 659.90 L1409.69 659.88 L1183.56 905.06 L1438.07 1191.31 Z',
}

const CSS = `
.ldk-story,.ldk-story *{box-sizing:border-box;margin:0;padding:0;border:0}
.ldk-story{--ldk-story-bg:#2F1810;--ldk-story-fg:#EBBA9B;--ldk-story-q:#221E1E;--ldk-story-ln:#7B2E18;--ldk-story-bin:#C6725A;display:flex;justify-content:center;width:100%;height:40px;background:var(--ldk-story-bg);color:var(--ldk-story-fg);font:500 12.5px/1 system-ui,-apple-system,"Segoe UI",Roboto,Ubuntu,sans-serif;letter-spacing:.02em}
.ldk-story__l{position:relative;display:inline-flex;align-items:center;gap:9px;height:40px;padding:0 12px;color:inherit;text-decoration:none;white-space:nowrap;outline:0;border-radius:3px;-webkit-tap-highlight-color:transparent}
.ldk-story__l:focus-visible{outline:3px solid var(--ldk-story-fg);outline-offset:-5px}
.ldk-story__q{display:block;flex:none;width:29px;height:29px;margin:1px 2px 2px 0;padding:3px;background:var(--ldk-story-q);border:1px solid var(--ldk-story-ln);border-radius:2px;box-shadow:2px 2px 0 var(--ldk-story-ln)}
.ldk-story__q svg{display:block;width:21px;height:21px}
.ldk-story__bin{display:none;margin-left:6px;font-size:10.5px;font-weight:400;letter-spacing:.14em;font-variant-numeric:tabular-nums;color:var(--ldk-story-bin)}
@media (min-width:768px){.ldk-story__bin{display:inline}}
.ldk-story__sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
/* data-ativo vem do useAtivo(): hover com mouse e foco por teclado (X2). O :active cobre o toque. */
.ldk-story__l:is([data-ativo="true"],:active) .ldk-story__q{animation:ldk-story-aperta .3s ease-out}
.ldk-story__l:is([data-ativo="true"],:active) .ldk-story__bin{animation:ldk-story-digita .6s steps(26,end)}
@keyframes ldk-story-aperta{0%,100%{transform:none;box-shadow:2px 2px 0 var(--ldk-story-ln)}40%,60%{transform:translate(2px,2px);box-shadow:0 0 0 var(--ldk-story-ln)}}
@keyframes ldk-story-digita{0%{clip-path:inset(0 100% 0 0)}100%{clip-path:inset(0 0 0 0)}}
@media (prefers-reduced-motion:reduce){.ldk-story *{animation:none!important;transition:none!important}}
`

export function AssinaturaStory() {
  return (
    <div className="ldk-story">
      <style href="ldk-story" precedence="default">
        {CSS}
      </style>
      <LinkAtivo className="ldk-story__l" href="https://github.com/ldickmann" target="_blank" rel="noopener nofollow">
        <span className="ldk-story__q">
          <svg viewBox="589 659 850 755" aria-hidden="true" focusable="false">
            <path fill="#BCEF40" d={LOGO.l} />
            <path fill="#FBFBFB" d={LOGO.d} />
            <path fill="#FBFBFB" d={LOGO.k} />
          </svg>
        </span>
        <span>
          <span lang="en">Developer</span> | Lucas Elias Dickmann
        </span>
        <span className="ldk-story__bin" aria-hidden="true">
          01000100 01001100 01001011
        </span>
        <span className="ldk-story__sr"> (abre em nova aba)</span>
      </LinkAtivo>
    </div>
  )
}
