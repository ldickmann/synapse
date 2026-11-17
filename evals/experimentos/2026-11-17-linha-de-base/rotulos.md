# Rótulos do juiz

<!-- fontes: 2026-11-17-linha-de-base, 2026-11-17-sem-modelo -->

Para cada item, leia a rubrica em `evals/rubricas/<rubrica>.md` e troque o `?` de **Rótulo** por `PASS` ou `FAIL`. O veredito do juiz não aparece aqui de propósito.

<!-- item: comentarios-01-estrelas#3/juiz-comentario-descreve/c3 -->

## 1. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Estrelas: no máximo uma por bloco, numa célula sorteada dentro dele, para salpicarem o céu
inteiro, do alto até a crista, sem aglomerar. Vêm depois do céu para os picos das grandes
não serem cobertos pela linha seguinte, e antes da crista, que as esconde.
</comentario>
<trecho>
115 +       for (let bl = 0; bl * BLOCO_ESTRELA < linhas; bl++) {
116 +         for (let bc = 0; bc * BLOCO_ESTRELA < colunas; bc++) {
117 +           if (ruido(bc, bl, 3) >= CHANCE_ESTRELA) continue
118 +           const c = bc * BLOCO_ESTRELA + Math.min(BLOCO_ESTRELA - 1, Math.floor(ruido(bc, bl, 9) * BLOCO_ESTRELA))
119 +           const l = bl * BLOCO_ESTRELA + Math.min(BLOCO_ESTRELA - 1, Math.floor(ruido(bc, bl, 10) * BLOCO_ESTRELA))
120 +           if (c >= colunas || l >= linhas || altura(l) > bordaDaCrista(c)) continue
121 +           const tipo = ruido(bc, bl, 4)
122 +           b.fillStyle = tipo < 0.55 ? cores.estrela : tipo < 0.8 ? cores.dourado : cores.azul
123             b.fillRect(c * t, l * t, t, t)
124 +           // As grandes ganham quatro picos.
125 +           if (ruido(bc, bl, 11) < 0.08) {
126               b.globalAlpha = 0.3
127               b.fillRect((c - 1) * t, l * t, t * 3, t)
128               b.fillRect(c * t, (l - 1) * t, t, t * 3)
129               b.globalAlpha = 1
130             }
131           }
132 +       }
133 +       for (let l = 0; l < linhas; l++) {
134 +         const y = altura(l)
135 +         for (let c = 0; c < colunas; c++) {
136 +           const borda = bordaDaCrista(c)
137             if (y > borda) {
138               const prof = (y - borda) / Math.max(0.05, 1 - borda)
139               const n = suave(c, l, 5, 7)
140               let tom: string
141               if (prof < 0.12) tom = n > 0.5 ? cores.pessego : cores.acento
142               else if (prof < 0.35) tom = n > 0.55 ? cores.acento : cores.brasa
143               else if (prof < 0.7) tom = n > 0.6 ? cores.brasa : cores.ferrugem
144               else tom = n > 0.7 ? cores.ferrugem : cores.marrom
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-02-respostas@quebrada/juiz-comentario-porque/c1 -->

## 2. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>lib/oferta.ts</arquivo>
<comentario>
As duas últimas foram confirmadas pelo Lucas (docs/especificacao.md §6).
</comentario>
<trecho>
34   export const PERGUNTAS: readonly Pergunta[] = [
35     {
36       pergunta: 'Não entendo de tecnologia. Tem problema?',
37       resposta:
38         'Não. Você me conta do seu negócio e eu cuido da parte técnica. A gente conversa em português claro, sem termos difíceis.',
39     },
40     {
41       pergunta: 'Quanto custa?',
42       resposta: 'Depende do que o seu negócio precisa. Me chama no WhatsApp, eu entendo o caso e te passo um orçamento.',
43     },
44     {
45       pergunta: 'Você atende fora de Navegantes?',
46       resposta: 'Sim. Em Navegantes e região eu vou até você. Para outras cidades, atendo à distância.',
47     },
48     {
49       pergunta: 'O site funciona bem no celular?',
50       resposta: 'Sim. Eu faço pensando no celular primeiro, porque é onde a maioria dos clientes abre.',
51     },
52     {
53       pergunta: 'Preciso ter domínio e hospedagem antes?',
54       resposta: 'Não precisa ter antes. Eu oriento o que contratar e deixo tudo configurado.',
55     },
56     {
57       pergunta: 'Posso mudar textos e fotos depois?',
58       resposta: 'Sim. No começo definimos o que você vai precisar alterar sozinho e eu preparo o site para isso.',
59     },
60   ]
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#2/juiz-comentario-porque/c1 -->

## 3. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Fundo: a nebulosa em pixels. Céu marinho em cima e azul aberto no meio, com estrelas espalhadas
pelo céu inteiro (algumas com picos) e, embaixo, a crista de poeira em ferrugem, brasa, laranja e
pêssego, desenhada por ruído em blocos. Por cima, sinapses: células acendem sozinhas e no rastro
do ponteiro e apagam em meio segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos
tokens (G26).
</comentario>
<trecho>
  1   'use client'
  2
  3   import { useEffect, useRef } from 'react'
  4
  5 + // Fundo: a nebulosa em pixels. Céu marinho em cima e azul aberto no meio, com estrelas espalhadas
  6 + // pelo céu inteiro (algumas com picos) e, embaixo, a crista de poeira em ferrugem, brasa, laranja e
  7 + // pêssego, desenhada por ruído em blocos. Por cima, sinapses: células acendem sozinhas e no rastro
  8 + // do ponteiro e apagam em meio segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos
  9 + // tokens (G26).
 10
 11   const CELULA = 20
 12   const VIDA_MS = 900
 13   const INTERVALO_MS = 380
 14 + /** Lado, em células, do bloco que recebe no máximo uma estrela. */
 15 + const BLOCO_ESTRELA = 5
 16 + /** Fração dos blocos com estrela: perto de 3 % do céu aceso, igual do alto até a crista. */
 17 + const CHANCE_ESTRELA = 0.75
 18
 19   type Faisca = { c: number; l: number; vida: number; cor: string }
 20
 21   /** Hash determinístico em [0, 1): o mesmo fundo em toda visita. */
 22   function ruido(c: number, l: number, semente = 0): number {
 23     let h = (c * 73856093) ^ (l * 19349663) ^ (semente * 83492791)
 24     h = Math.imul(h ^ (h >>> 13), 1274126177)
 25     return ((h ^ (h >>> 16)) >>> 0) / 4294967295
 26   }
 27
 28   /** Ruído de valor suave (interpola o hash em blocos de `escala` células). */
 29   function suave(c: number, l: number, escala: number, semente: number): number {
 30     const x = c / escala
 31     const y = l / escala
 32     const x0 = Math.floor(x)
 33     const y0 = Math.floor(y)
 34     const fx = x - x0
 35     const fy = y - y0
 36     const u = fx * fx * (3 - 2 * fx)
 37     const v = fy * fy * (3 - 2 * fy)
 38     const a = ruido(x0, y0, semente)
 39     const b = ruido(x0 + 1, y0, semente)
 40     const cc = ruido(x0, y0 + 1, semente)
 41     const d = ruido(x0 + 1, y0 + 1, semente)
 42     return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v
 43   }
 44
 45 + /**
 46 +  * Estrelas em grade sorteada: cada bloco de BLOCO_ESTRELA células acende, ou não, uma estrela numa
 47 +  * posição sorteada dentro dele, fora da última coluna e da última linha. Ficam espalhadas por igual,
 48 +  * sem aglomerar nem deixar buraco, e duas estrelas nunca caem em células vizinhas.
 49 +  */
 50 + function temEstrela(c: number, l: number): boolean {
 51 +   const bc = Math.floor(c / BLOCO_ESTRELA)
 52 +   const bl = Math.floor(l / BLOCO_ESTRELA)
 53 +   if (ruido(bc, bl, 3) > CHANCE_ESTRELA) return false
 54 +   const vao = BLOCO_ESTRELA - 1
 55 +   return (
 56 +     c === bc * BLOCO_ESTRELA + Math.min(vao - 1, Math.floor(ruido(bc, bl, 9) * vao)) &&
 57 +     l === bl * BLOCO_ESTRELA + Math.min(vao - 1, Math.floor(ruido(bc, bl, 10) * vao))
 58 +   )
 59 + }
 60 +
 61   const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
 62   /** Mistura dois tokens em hex numa fração t e devolve hex. */
 63   function misturar(a: string, b: string, t: number): string {
 64     return `#${[0, 1, 2]
 65       .map((i) =>
 66         Math.round(canal(a, i) + (canal(b, i) - canal(a, i)) * t)
 67           .toString(16)
 68           .padStart(2, '0'),
 69       )
 70       .join('')}`
 71   }
 72
 73   export function Fundo({ ativo }: { ativo: boolean }) {
 74     const ref = useRef<HTMLCanvasElement>(null)
 75
 76     useEffect(() => {
 77       const canvas = ref.current
 78       if (!ativo || !canvas) return
 79       const ctx = canvas.getContext('2d')
 80       if (!ctx) return
 81       const estilo = getComputedStyle(document.documentElement)
 82       const cor = (nome: string) => estilo.getPropertyValue(`--color-sinapse-${nome}`).trim()
 83       const cores = {
 84         baixo: cor('fundo-baixo'),
 85         fundo: cor('fundo'),
 86         alto: cor('fundo-alto'),
 87         ceu: cor('ceu'),
 88         azul: cor('azul'),
 89         acento: cor('acento'),
 90         brasa: cor('brasa'),
 91         pessego: cor('pessego'),
 92         dourado: cor('dourado'),
 93         rosa: cor('rosa'),
 94         estrela: cor('estrela'),
 95         ferrugem: cor('ferrugem'),
 96         marrom: cor('marrom'),
 97       }
 98
 99       let dpr = 1
100       let colunas = 0
101       let linhas = 0
102       let base: HTMLCanvasElement | null = null
103       let faiscas: Faisca[] = []
104       let quadro = 0
105       let ultimo = 0
106
107       function desenharBase() {
108         if (!base) return
109         const b = base.getContext('2d')
110         if (!b) return
111         const t = CELULA * dpr
112 +       const altura = (l: number) => l / Math.max(1, linhas - 1)
113 +       // Em três passadas (céu, estrelas, crista), para nenhuma apagar os picos de uma estrela grande.
114         for (let l = 0; l < linhas; l++) {
115 +         const y = altura(l)
116           // Céu: marinho no alto, petróleo no meio, azul aberto perto da crista.
117           const ceu =
118             y < 0.5 ? misturar(cores.baixo, cores.fundo, y * 2) : misturar(cores.fundo, cores.ceu, (y - 0.5) * 1.3)
119           b.fillStyle = ceu
120           b.fillRect(0, l * t, base!.width, t)
121           for (let c = 0; c < colunas; c++) {
122             // Textura do céu: blocos um tom mais claros, irregulares.
123             if (ruido(c >> 1, l >> 1, 1) > 0.58 && ruido(c, l, 2) > 0.3) {
124               b.fillStyle = misturar(ceu, cores.alto, 0.5)
125               b.fillRect(c * t, l * t, t, t)
126             }
127 +         }
128 +       }
129 +       // Estrelas: brancas na maioria, algumas douradas ou azuis; uma em cada oito ganha quatro picos e
130 +       // uma em cada três brilha menos. As que caem na crista ficam atrás da poeira.
131 +       for (let l = 0; l < linhas; l++) {
132 +         for (let c = 0; c < colunas; c++) {
133 +           if (!temEstrela(c, l)) continue
134 +           const brilho = ruido(c, l, 4)
135 +           const tom = ruido(c, l, 11)
136 +           b.fillStyle = tom < 0.6 ? cores.estrela : tom < 0.85 ? cores.dourado : cores.azul
137 +           b.globalAlpha = brilho < 0.33 ? 0.75 : 1
138             b.fillRect(c * t, l * t, t, t)
139 +           if (brilho > 0.875) {
140               b.globalAlpha = 0.3
141               b.fillRect((c - 1) * t, l * t, t * 3, t)
142               b.fillRect(c * t, (l - 1) * t, t, t * 3)
143 +           }
144             b.globalAlpha = 1
145           }
146         }
147 +       for (let l = 0; l < linhas; l++) {
148 +         const y = altura(l)
149 +         for (let c = 0; c < colunas; c++) {
150             // Crista de poeira: ocupa o terço de baixo, com a borda recortada pelo ruído.
151             const borda = 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
152             if (y > borda) {
153               const prof = (y - borda) / Math.max(0.05, 1 - borda)
154               const n = suave(c, l, 5, 7)
155               let tom: string
156               if (prof < 0.12) tom = n > 0.5 ? cores.pessego : cores.acento
157               else if (prof < 0.35) tom = n > 0.55 ? cores.acento : cores.brasa
158               else if (prof < 0.7) tom = n > 0.6 ? cores.brasa : cores.ferrugem
159               else tom = n > 0.7 ? cores.ferrugem : cores.marrom
160               // Buracos de gás ionizado em rosa, raros.
161               if (ruido(c, l, 8) > 0.993) tom = cores.rosa
162               b.fillStyle = tom
163               b.fillRect(c * t, l * t, t, t)
164             }
165           }
166         }
167       }
168
169       function medir() {
170         dpr = Math.min(window.devicePixelRatio || 1, 2)
171         canvas!.width = Math.ceil(window.innerWidth * dpr)
172         canvas!.height = Math.ceil(window.innerHeight * dpr)
173         canvas!.style.width = `${window.innerWidth}px`
174         canvas!.style.height = `${window.innerHeight}px`
175         colunas = Math.ceil(window.innerWidth / CELULA)
176         linhas = Math.ceil(window.innerHeight / CELULA)
177         base = document.createElement('canvas')
178         base.width = canvas!.width
179         base.height = canvas!.height
180         desenharBase()
181         desenhar()
182       }
183
184       function desenhar() {
185         if (!base) return
186         ctx!.drawImage(base, 0, 0)
187         const t = CELULA * dpr
188         for (const f of faiscas) {
189           ctx!.globalAlpha = Math.pow(Math.max(0, f.vida), 1.4)
190           ctx!.fillStyle = f.cor
191           ctx!.fillRect(f.c * t, f.l * t, t, t)
192         }
193         ctx!.globalAlpha = 1
194       }
195
196       function tique(agora: number) {
197         const dt = Math.min(64, agora - ultimo)
198         ultimo = agora
199         for (const f of faiscas) f.vida -= dt / VIDA_MS
200         faiscas = faiscas.filter((f) => f.vida > 0)
201         desenhar()
202         quadro = faiscas.length > 0 ? requestAnimationFrame(tique) : 0
203       }
204
205       function acordar() {
206         if (quadro === 0 && !document.hidden) {
207           ultimo = performance.now()
208           quadro = requestAnimationFrame(tique)
209         }
210       }
211
212       function acender(c: number, l: number, cor: string) {
213         if (c < 0 || l < 0 || c >= colunas || l >= linhas) return
214         const existente = faiscas.find((f) => f.c === c && f.l === l)
215         if (existente) existente.vida = 1
216         else faiscas.push({ c, l, vida: 1, cor })
217         acordar()
218       }
219
220       // Sinapses espontâneas: uma célula e, às vezes, uma vizinha, como um sinal que passa.
221       const intervalo = window.setInterval(() => {
222         if (document.hidden) return
223         const c = Math.floor(Math.random() * colunas)
224         const l = Math.floor(Math.random() * linhas)
225         const sorteio = Math.random()
226         acender(c, l, sorteio < 0.5 ? cores.azul : sorteio < 0.8 ? cores.dourado : cores.rosa)
227         if (Math.random() < 0.5) acender(c + (Math.random() < 0.5 ? 1 : -1), l, cores.azul)
228       }, INTERVALO_MS)
229
230       let ultimaCelula = ''
231       const aoMover = (e: PointerEvent) => {
232         if (e.pointerType !== 'mouse') return
233         const c = Math.floor(e.clientX / CELULA)
234         const l = Math.floor(e.clientY / CELULA)
235         const chave = `${c}:${l}`
236         if (chave === ultimaCelula) return
237         ultimaCelula = chave
238         acender(c, l, cores.acento)
239       }
240       const aoVisibilidade = () => {
241         if (document.hidden && quadro) {
242           cancelAnimationFrame(quadro)
243           quadro = 0
244         } else acordar()
245       }
246
247       medir()
248       window.addEventListener('resize', medir)
249       window.addEventListener('pointermove', aoMover, { passive: true })
250       document.addEventListener('visibilitychange', aoVisibilidade)
251       return () => {
252         window.clearInterval(intervalo)
253         window.removeEventListener('resize', medir)
254         window.removeEventListener('pointermove', aoMover)
255         document.removeEventListener('visibilitychange', aoVisibilidade)
256         if (quadro) cancelAnimationFrame(quadro)
257       }
258     }, [ativo])
259
260     if (!ativo) return null
261     return <canvas ref={ref} className="sinapse-fundo" aria-hidden="true" />
262   }
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#3/juiz-comentario-porque/c2 -->

## 4. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Estrelas: o céu é dividido em blocos de 5×5 células, e 80% deles ganham uma estrela.
</comentario>
<trecho>
14 + const BLOCO_ESTRELA = 5
15 + const CHANCE_ESTRELA = 0.8
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#2/juiz-comentario-descreve/c2 -->

## 5. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Lado, em células, do bloco que recebe no máximo uma estrela.
</comentario>
<trecho>
15 + const BLOCO_ESTRELA = 5
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#1/juiz-comentario-descreve/c1 -->

## 6. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Fundo: a nebulosa em pixels. Céu marinho em cima, azul aberto no meio e estrelas espalhadas por ele
inteiro (algumas com picos); embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego,
desenhada por ruído em blocos. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro
e apagam em meio segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos tokens (G26).
</comentario>
<trecho>
  1   'use client'
  2
  3   import { useEffect, useRef } from 'react'
  4
  5 + // Fundo: a nebulosa em pixels. Céu marinho em cima, azul aberto no meio e estrelas espalhadas por ele
  6 + // inteiro (algumas com picos); embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego,
  7 + // desenhada por ruído em blocos. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro
  8 + // e apagam em meio segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos tokens (G26).
  9
 10   const CELULA = 20
 11 + const BLOCO_ESTRELA = 5
 12   const VIDA_MS = 900
 13   const INTERVALO_MS = 380
 14
 15   type Faisca = { c: number; l: number; vida: number; cor: string }
 16
 17   /** Hash determinístico em [0, 1): o mesmo fundo em toda visita. */
 18   function ruido(c: number, l: number, semente = 0): number {
 19     let h = (c * 73856093) ^ (l * 19349663) ^ (semente * 83492791)
 20     h = Math.imul(h ^ (h >>> 13), 1274126177)
 21     return ((h ^ (h >>> 16)) >>> 0) / 4294967295
 22   }
 23
 24   /** Ruído de valor suave (interpola o hash em blocos de `escala` células). */
 25   function suave(c: number, l: number, escala: number, semente: number): number {
 26     const x = c / escala
 27     const y = l / escala
 28     const x0 = Math.floor(x)
 29     const y0 = Math.floor(y)
 30     const fx = x - x0
 31     const fy = y - y0
 32     const u = fx * fx * (3 - 2 * fx)
 33     const v = fy * fy * (3 - 2 * fy)
 34     const a = ruido(x0, y0, semente)
 35     const b = ruido(x0 + 1, y0, semente)
 36     const cc = ruido(x0, y0 + 1, semente)
 37     const d = ruido(x0 + 1, y0 + 1, semente)
 38     return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v
 39   }
 40
 41   const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
 42   /** Mistura dois tokens em hex numa fração t e devolve hex. */
 43   function misturar(a: string, b: string, t: number): string {
 44     return `#${[0, 1, 2]
 45       .map((i) =>
 46         Math.round(canal(a, i) + (canal(b, i) - canal(a, i)) * t)
 47           .toString(16)
 48           .padStart(2, '0'),
 49       )
 50       .join('')}`
 51   }
 52
 53   export function Fundo({ ativo }: { ativo: boolean }) {
 54     const ref = useRef<HTMLCanvasElement>(null)
 55
 56     useEffect(() => {
 57       const canvas = ref.current
 58       if (!ativo || !canvas) return
 59       const ctx = canvas.getContext('2d')
 60       if (!ctx) return
 61       const estilo = getComputedStyle(document.documentElement)
 62       const cor = (nome: string) => estilo.getPropertyValue(`--color-sinapse-${nome}`).trim()
 63       const cores = {
 64         baixo: cor('fundo-baixo'),
 65         fundo: cor('fundo'),
 66         alto: cor('fundo-alto'),
 67         ceu: cor('ceu'),
 68         azul: cor('azul'),
 69         acento: cor('acento'),
 70         brasa: cor('brasa'),
 71         pessego: cor('pessego'),
 72         dourado: cor('dourado'),
 73         rosa: cor('rosa'),
 74         estrela: cor('estrela'),
 75 +       poeira: cor('poeira'),
 76         ferrugem: cor('ferrugem'),
 77         marrom: cor('marrom'),
 78       }
 79
 80       let dpr = 1
 81       let colunas = 0
 82       let linhas = 0
 83       let base: HTMLCanvasElement | null = null
 84       let faiscas: Faisca[] = []
 85       let quadro = 0
 86       let ultimo = 0
 87
 88       function desenharBase() {
 89         if (!base) return
 90         const b = base.getContext('2d')
 91         if (!b) return
 92         const t = CELULA * dpr
 93         for (let l = 0; l < linhas; l++) {
 94           const y = l / Math.max(1, linhas - 1)
 95           // Céu: marinho no alto, petróleo no meio, azul aberto perto da crista.
 96           const ceu =
 97             y < 0.5 ? misturar(cores.baixo, cores.fundo, y * 2) : misturar(cores.fundo, cores.ceu, (y - 0.5) * 1.3)
 98           b.fillStyle = ceu
 99           b.fillRect(0, l * t, base!.width, t)
100           for (let c = 0; c < colunas; c++) {
101             // Textura do céu: blocos um tom mais claros, irregulares.
102             if (ruido(c >> 1, l >> 1, 1) > 0.58 && ruido(c, l, 2) > 0.3) {
103               b.fillStyle = misturar(ceu, cores.alto, 0.5)
104               b.fillRect(c * t, l * t, t, t)
105             }
106 +         }
107 +       }
108 +       // Estrelas: no máximo uma por bloco de BLOCO_ESTRELA × BLOCO_ESTRELA células, num ponto sorteado dentro dele,
109 +       // para cobrir o céu inteiro por igual, sem vazios nem aglomerados. O ponto vai até a penúltima célula do bloco,
110 +       // e duas estrelas vizinhas nunca encostam. Um quinto dos blocos fica vazio, a maioria das estrelas é fraca,
111 +       // algumas brilham cheias e as grandes ganham quatro picos. Passada própria, depois do céu inteiro, para a linha
112 +       // de baixo não apagar os picos; a crista, desenhada depois, cobre as que caem nela.
113 +       for (let bl = 0; bl * BLOCO_ESTRELA < linhas; bl++) {
114 +         for (let bc = 0; bc * BLOCO_ESTRELA < colunas; bc++) {
115 +           const r = ruido(bc, bl, 3)
116 +           if (r < 0.2) continue
117 +           const dentro = (semente: number) =>
118 +             Math.min(BLOCO_ESTRELA - 2, Math.floor(ruido(bc, bl, semente) * (BLOCO_ESTRELA - 1)))
119 +           const c = bc * BLOCO_ESTRELA + dentro(9)
120 +           const l = bl * BLOCO_ESTRELA + dentro(10)
121 +           const grande = r > 0.93
122 +           const tom = ruido(bc, bl, 4)
123 +           if (r < 0.62) {
124 +             // Fraca: tom frio e meio apagado, como uma estrela distante.
125 +             b.fillStyle = tom < 0.6 ? cores.poeira : cores.azul
126 +             b.globalAlpha = 0.55
127 +           } else {
128 +             b.fillStyle = grande || tom < 0.55 ? cores.estrela : tom < 0.78 ? cores.dourado : cores.azul
129 +             b.globalAlpha = 1
130 +           }
131             b.fillRect(c * t, l * t, t, t)
132             if (grande) {
133               b.globalAlpha = 0.3
134 +             b.fillRect((c - 1) * t, l * t, t, t)
135 +             b.fillRect((c + 1) * t, l * t, t, t)
136 +             b.fillRect(c * t, (l - 1) * t, t, t)
137 +             b.fillRect(c * t, (l + 1) * t, t, t)
138 +           }
139 +         }
140 +       }
141         b.globalAlpha = 1
142 +       for (let l = 0; l < linhas; l++) {
143 +         const y = l / Math.max(1, linhas - 1)
144 +         for (let c = 0; c < colunas; c++) {
145             // Crista de poeira: ocupa o terço de baixo, com a borda recortada pelo ruído.
146             const borda = 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
147             if (y > borda) {
148               const prof = (y - borda) / Math.max(0.05, 1 - borda)
149               const n = suave(c, l, 5, 7)
150               let tom: string
151               if (prof < 0.12) tom = n > 0.5 ? cores.pessego : cores.acento
152               else if (prof < 0.35) tom = n > 0.55 ? cores.acento : cores.brasa
153               else if (prof < 0.7) tom = n > 0.6 ? cores.brasa : cores.ferrugem
154               else tom = n > 0.7 ? cores.ferrugem : cores.marrom
155               // Buracos de gás ionizado em rosa, raros.
156               if (ruido(c, l, 8) > 0.993) tom = cores.rosa
157               b.fillStyle = tom
158               b.fillRect(c * t, l * t, t, t)
159             }
160           }
161         }
162       }
163
164       function medir() {
165         dpr = Math.min(window.devicePixelRatio || 1, 2)
166         canvas!.width = Math.ceil(window.innerWidth * dpr)
167         canvas!.height = Math.ceil(window.innerHeight * dpr)
168         canvas!.style.width = `${window.innerWidth}px`
169         canvas!.style.height = `${window.innerHeight}px`
170         colunas = Math.ceil(window.innerWidth / CELULA)
171         linhas = Math.ceil(window.innerHeight / CELULA)
172         base = document.createElement('canvas')
173         base.width = canvas!.width
174         base.height = canvas!.height
175         desenharBase()
176         desenhar()
177       }
178
179       function desenhar() {
180         if (!base) return
181         ctx!.drawImage(base, 0, 0)
182         const t = CELULA * dpr
183         for (const f of faiscas) {
184           ctx!.globalAlpha = Math.pow(Math.max(0, f.vida), 1.4)
185           ctx!.fillStyle = f.cor
186           ctx!.fillRect(f.c * t, f.l * t, t, t)
187         }
188         ctx!.globalAlpha = 1
189       }
190
191       function tique(agora: number) {
192         const dt = Math.min(64, agora - ultimo)
193         ultimo = agora
194         for (const f of faiscas) f.vida -= dt / VIDA_MS
195         faiscas = faiscas.filter((f) => f.vida > 0)
196         desenhar()
197         quadro = faiscas.length > 0 ? requestAnimationFrame(tique) : 0
198       }
199
200       function acordar() {
201         if (quadro === 0 && !document.hidden) {
202           ultimo = performance.now()
203           quadro = requestAnimationFrame(tique)
204         }
205       }
206
207       function acender(c: number, l: number, cor: string) {
208         if (c < 0 || l < 0 || c >= colunas || l >= linhas) return
209         const existente = faiscas.find((f) => f.c === c && f.l === l)
210         if (existente) existente.vida = 1
211         else faiscas.push({ c, l, vida: 1, cor })
212         acordar()
213       }
214
215       // Sinapses espontâneas: uma célula e, às vezes, uma vizinha, como um sinal que passa.
216       const intervalo = window.setInterval(() => {
217         if (document.hidden) return
218         const c = Math.floor(Math.random() * colunas)
219         const l = Math.floor(Math.random() * linhas)
220         const sorteio = Math.random()
221         acender(c, l, sorteio < 0.5 ? cores.azul : sorteio < 0.8 ? cores.dourado : cores.rosa)
222         if (Math.random() < 0.5) acender(c + (Math.random() < 0.5 ? 1 : -1), l, cores.azul)
223       }, INTERVALO_MS)
224
225       let ultimaCelula = ''
226       const aoMover = (e: PointerEvent) => {
227         if (e.pointerType !== 'mouse') return
228         const c = Math.floor(e.clientX / CELULA)
229         const l = Math.floor(e.clientY / CELULA)
230         const chave = `${c}:${l}`
231         if (chave === ultimaCelula) return
232         ultimaCelula = chave
233         acender(c, l, cores.acento)
234       }
235       const aoVisibilidade = () => {
236         if (document.hidden && quadro) {
237           cancelAnimationFrame(quadro)
238           quadro = 0
239         } else acordar()
240       }
241
242       medir()
243       window.addEventListener('resize', medir)
244       window.addEventListener('pointermove', aoMover, { passive: true })
245       document.addEventListener('visibilitychange', aoVisibilidade)
246       return () => {
247         window.clearInterval(intervalo)
248         window.removeEventListener('resize', medir)
249         window.removeEventListener('pointermove', aoMover)
250         document.removeEventListener('visibilitychange', aoVisibilidade)
251         if (quadro) cancelAnimationFrame(quadro)
252       }
253     }, [ativo])
254
255     if (!ativo) return null
256     return <canvas ref={ref} className="sinapse-fundo" aria-hidden="true" />
257   }
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#2/juiz-comentario-porque/c5 -->

## 7. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Em três passadas (céu, estrelas, crista), para nenhuma apagar os picos de uma estrela grande.
</comentario>
<trecho>
114         for (let l = 0; l < linhas; l++) {
115 +         const y = altura(l)
116           // Céu: marinho no alto, petróleo no meio, azul aberto perto da crista.
117           const ceu =
118             y < 0.5 ? misturar(cores.baixo, cores.fundo, y * 2) : misturar(cores.fundo, cores.ceu, (y - 0.5) * 1.3)
119           b.fillStyle = ceu
120           b.fillRect(0, l * t, base!.width, t)
121           for (let c = 0; c < colunas; c++) {
122             // Textura do céu: blocos um tom mais claros, irregulares.
123             if (ruido(c >> 1, l >> 1, 1) > 0.58 && ruido(c, l, 2) > 0.3) {
124               b.fillStyle = misturar(ceu, cores.alto, 0.5)
125               b.fillRect(c * t, l * t, t, t)
126             }
127 +         }
128 +       }
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#3/juiz-comentario-antigo/a1 -->

## 8. juiz-comentario-antigo

O comentário, que a tentativa não mudou, continua verdadeiro para o trecho de depois?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Crista de poeira: ocupa o terço de baixo, com a borda recortada pelo ruído.
</comentario>
<antes>
118             const borda = 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
119             if (y > borda) {
120               const prof = (y - borda) / Math.max(0.05, 1 - borda)
121               const n = suave(c, l, 5, 7)
122               let tom: string
123               if (prof < 0.12) tom = n > 0.5 ? cores.pessego : cores.acento
124               else if (prof < 0.35) tom = n > 0.55 ? cores.acento : cores.brasa
125               else if (prof < 0.7) tom = n > 0.6 ? cores.brasa : cores.ferrugem
126               else tom = n > 0.7 ? cores.ferrugem : cores.marrom
</antes>
<depois>
96 +       const bordaDaCrista = (c: number) => 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
97         for (let l = 0; l < linhas; l++) {
98 +         const y = altura(l)
</depois>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#1/juiz-comentario-porque/c3 -->

## 9. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Fraca: tom frio e meio apagado, como uma estrela distante.
</comentario>
<trecho>
125 +             b.fillStyle = tom < 0.6 ? cores.poeira : cores.azul
126 +             b.globalAlpha = 0.55
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas@quebrada/pedido-cumprido/p1 -->

## 10. pedido-cumprido

O diff cumpre o critério do caso?

```text
<pedido>
Deixe as estrelas do fundo mais frequentes e espalhadas pelo céu inteiro, não só no alto.
</pedido>
<criterio>
PASS se, depois da tentativa, a chance de uma célula do céu virar estrela é a mesma em qualquer altura (a condição não depende mais de y) e maior que 1,5 %, a maior chance do base. No base, a condição é r > 0.991 - (1 - y) * 0.006: limiar 0,985 no alto (1,5 %) e 0,991 embaixo (0,9 %). FAIL se a chance ainda muda com a altura, se não passa de 1,5 % ou se a mudança faz outra coisa no lugar.
</criterio>
<diff>
diff --git a/componentes/Fundo.tsx b/componentes/Fundo.tsx
index c91560f..bfd350d 100644
--- a/componentes/Fundo.tsx
+++ b/componentes/Fundo.tsx
@@ -91,31 +91,31 @@ export function Fundo({ ativo }: { ativo: boolean }) {
       for (let l = 0; l < linhas; l++) {
         const y = l / Math.max(1, linhas - 1)
         // Céu: marinho no alto, petróleo no meio, azul aberto perto da crista.
         const ceu =
           y < 0.5 ? misturar(cores.baixo, cores.fundo, y * 2) : misturar(cores.fundo, cores.ceu, (y - 0.5) * 1.3)
         b.fillStyle = ceu
         b.fillRect(0, l * t, base!.width, t)
         for (let c = 0; c < colunas; c++) {
           // Textura do céu: blocos um tom mais claros, irregulares.
           if (ruido(c >> 1, l >> 1, 1) > 0.58 && ruido(c, l, 2) > 0.3) {
             b.fillStyle = misturar(ceu, cores.alto, 0.5)
             b.fillRect(c * t, l * t, t, t)
           }
           // Estrelas: raras, mais no alto; as grandes ganham quatro picos.
           const r = ruido(c, l, 3)
-          if (r > 0.991 - (1 - y) * 0.006) {
+          if (r > 0.975) {
             const grande = r > 0.9985
             b.fillStyle = r > 0.992 ? cores.estrela : ruido(c, l, 4) > 0.5 ? cores.dourado : cores.azul
             b.fillRect(c * t, l * t, t, t)
             if (grande) {
               b.globalAlpha = 0.3
               b.fillRect((c - 1) * t, l * t, t * 3, t)
               b.fillRect(c * t, (l - 1) * t, t, t * 3)
               b.globalAlpha = 1
             }
           }
           // Crista de poeira: ocupa o terço de baixo, com a borda recortada pelo ruído.
           const borda = 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
           if (y > borda) {
             const prof = (y - borda) / Math.max(0.05, 1 - borda)
             const n = suave(c, l, 5, 7)
</diff>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#1/juiz-comentario-porque/c1 -->

## 11. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Fundo: a nebulosa em pixels. Céu marinho em cima, azul aberto no meio e estrelas espalhadas por ele
inteiro (algumas com picos); embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego,
desenhada por ruído em blocos. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro
e apagam em meio segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos tokens (G26).
</comentario>
<trecho>
  1   'use client'
  2
  3   import { useEffect, useRef } from 'react'
  4
  5 + // Fundo: a nebulosa em pixels. Céu marinho em cima, azul aberto no meio e estrelas espalhadas por ele
  6 + // inteiro (algumas com picos); embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego,
  7 + // desenhada por ruído em blocos. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro
  8 + // e apagam em meio segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos tokens (G26).
  9
 10   const CELULA = 20
 11 + const BLOCO_ESTRELA = 5
 12   const VIDA_MS = 900
 13   const INTERVALO_MS = 380
 14
 15   type Faisca = { c: number; l: number; vida: number; cor: string }
 16
 17   /** Hash determinístico em [0, 1): o mesmo fundo em toda visita. */
 18   function ruido(c: number, l: number, semente = 0): number {
 19     let h = (c * 73856093) ^ (l * 19349663) ^ (semente * 83492791)
 20     h = Math.imul(h ^ (h >>> 13), 1274126177)
 21     return ((h ^ (h >>> 16)) >>> 0) / 4294967295
 22   }
 23
 24   /** Ruído de valor suave (interpola o hash em blocos de `escala` células). */
 25   function suave(c: number, l: number, escala: number, semente: number): number {
 26     const x = c / escala
 27     const y = l / escala
 28     const x0 = Math.floor(x)
 29     const y0 = Math.floor(y)
 30     const fx = x - x0
 31     const fy = y - y0
 32     const u = fx * fx * (3 - 2 * fx)
 33     const v = fy * fy * (3 - 2 * fy)
 34     const a = ruido(x0, y0, semente)
 35     const b = ruido(x0 + 1, y0, semente)
 36     const cc = ruido(x0, y0 + 1, semente)
 37     const d = ruido(x0 + 1, y0 + 1, semente)
 38     return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v
 39   }
 40
 41   const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
 42   /** Mistura dois tokens em hex numa fração t e devolve hex. */
 43   function misturar(a: string, b: string, t: number): string {
 44     return `#${[0, 1, 2]
 45       .map((i) =>
 46         Math.round(canal(a, i) + (canal(b, i) - canal(a, i)) * t)
 47           .toString(16)
 48           .padStart(2, '0'),
 49       )
 50       .join('')}`
 51   }
 52
 53   export function Fundo({ ativo }: { ativo: boolean }) {
 54     const ref = useRef<HTMLCanvasElement>(null)
 55
 56     useEffect(() => {
 57       const canvas = ref.current
 58       if (!ativo || !canvas) return
 59       const ctx = canvas.getContext('2d')
 60       if (!ctx) return
 61       const estilo = getComputedStyle(document.documentElement)
 62       const cor = (nome: string) => estilo.getPropertyValue(`--color-sinapse-${nome}`).trim()
 63       const cores = {
 64         baixo: cor('fundo-baixo'),
 65         fundo: cor('fundo'),
 66         alto: cor('fundo-alto'),
 67         ceu: cor('ceu'),
 68         azul: cor('azul'),
 69         acento: cor('acento'),
 70         brasa: cor('brasa'),
 71         pessego: cor('pessego'),
 72         dourado: cor('dourado'),
 73         rosa: cor('rosa'),
 74         estrela: cor('estrela'),
 75 +       poeira: cor('poeira'),
 76         ferrugem: cor('ferrugem'),
 77         marrom: cor('marrom'),
 78       }
 79
 80       let dpr = 1
 81       let colunas = 0
 82       let linhas = 0
 83       let base: HTMLCanvasElement | null = null
 84       let faiscas: Faisca[] = []
 85       let quadro = 0
 86       let ultimo = 0
 87
 88       function desenharBase() {
 89         if (!base) return
 90         const b = base.getContext('2d')
 91         if (!b) return
 92         const t = CELULA * dpr
 93         for (let l = 0; l < linhas; l++) {
 94           const y = l / Math.max(1, linhas - 1)
 95           // Céu: marinho no alto, petróleo no meio, azul aberto perto da crista.
 96           const ceu =
 97             y < 0.5 ? misturar(cores.baixo, cores.fundo, y * 2) : misturar(cores.fundo, cores.ceu, (y - 0.5) * 1.3)
 98           b.fillStyle = ceu
 99           b.fillRect(0, l * t, base!.width, t)
100           for (let c = 0; c < colunas; c++) {
101             // Textura do céu: blocos um tom mais claros, irregulares.
102             if (ruido(c >> 1, l >> 1, 1) > 0.58 && ruido(c, l, 2) > 0.3) {
103               b.fillStyle = misturar(ceu, cores.alto, 0.5)
104               b.fillRect(c * t, l * t, t, t)
105             }
106 +         }
107 +       }
108 +       // Estrelas: no máximo uma por bloco de BLOCO_ESTRELA × BLOCO_ESTRELA células, num ponto sorteado dentro dele,
109 +       // para cobrir o céu inteiro por igual, sem vazios nem aglomerados. O ponto vai até a penúltima célula do bloco,
110 +       // e duas estrelas vizinhas nunca encostam. Um quinto dos blocos fica vazio, a maioria das estrelas é fraca,
111 +       // algumas brilham cheias e as grandes ganham quatro picos. Passada própria, depois do céu inteiro, para a linha
112 +       // de baixo não apagar os picos; a crista, desenhada depois, cobre as que caem nela.
113 +       for (let bl = 0; bl * BLOCO_ESTRELA < linhas; bl++) {
114 +         for (let bc = 0; bc * BLOCO_ESTRELA < colunas; bc++) {
115 +           const r = ruido(bc, bl, 3)
116 +           if (r < 0.2) continue
117 +           const dentro = (semente: number) =>
118 +             Math.min(BLOCO_ESTRELA - 2, Math.floor(ruido(bc, bl, semente) * (BLOCO_ESTRELA - 1)))
119 +           const c = bc * BLOCO_ESTRELA + dentro(9)
120 +           const l = bl * BLOCO_ESTRELA + dentro(10)
121 +           const grande = r > 0.93
122 +           const tom = ruido(bc, bl, 4)
123 +           if (r < 0.62) {
124 +             // Fraca: tom frio e meio apagado, como uma estrela distante.
125 +             b.fillStyle = tom < 0.6 ? cores.poeira : cores.azul
126 +             b.globalAlpha = 0.55
127 +           } else {
128 +             b.fillStyle = grande || tom < 0.55 ? cores.estrela : tom < 0.78 ? cores.dourado : cores.azul
129 +             b.globalAlpha = 1
130 +           }
131             b.fillRect(c * t, l * t, t, t)
132             if (grande) {
133               b.globalAlpha = 0.3
134 +             b.fillRect((c - 1) * t, l * t, t, t)
135 +             b.fillRect((c + 1) * t, l * t, t, t)
136 +             b.fillRect(c * t, (l - 1) * t, t, t)
137 +             b.fillRect(c * t, (l + 1) * t, t, t)
138 +           }
139 +         }
140 +       }
141         b.globalAlpha = 1
142 +       for (let l = 0; l < linhas; l++) {
143 +         const y = l / Math.max(1, linhas - 1)
144 +         for (let c = 0; c < colunas; c++) {
145             // Crista de poeira: ocupa o terço de baixo, com a borda recortada pelo ruído.
146             const borda = 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
147             if (y > borda) {
148               const prof = (y - borda) / Math.max(0.05, 1 - borda)
149               const n = suave(c, l, 5, 7)
150               let tom: string
151               if (prof < 0.12) tom = n > 0.5 ? cores.pessego : cores.acento
152               else if (prof < 0.35) tom = n > 0.55 ? cores.acento : cores.brasa
153               else if (prof < 0.7) tom = n > 0.6 ? cores.brasa : cores.ferrugem
154               else tom = n > 0.7 ? cores.ferrugem : cores.marrom
155               // Buracos de gás ionizado em rosa, raros.
156               if (ruido(c, l, 8) > 0.993) tom = cores.rosa
157               b.fillStyle = tom
158               b.fillRect(c * t, l * t, t, t)
159             }
160           }
161         }
162       }
163
164       function medir() {
165         dpr = Math.min(window.devicePixelRatio || 1, 2)
166         canvas!.width = Math.ceil(window.innerWidth * dpr)
167         canvas!.height = Math.ceil(window.innerHeight * dpr)
168         canvas!.style.width = `${window.innerWidth}px`
169         canvas!.style.height = `${window.innerHeight}px`
170         colunas = Math.ceil(window.innerWidth / CELULA)
171         linhas = Math.ceil(window.innerHeight / CELULA)
172         base = document.createElement('canvas')
173         base.width = canvas!.width
174         base.height = canvas!.height
175         desenharBase()
176         desenhar()
177       }
178
179       function desenhar() {
180         if (!base) return
181         ctx!.drawImage(base, 0, 0)
182         const t = CELULA * dpr
183         for (const f of faiscas) {
184           ctx!.globalAlpha = Math.pow(Math.max(0, f.vida), 1.4)
185           ctx!.fillStyle = f.cor
186           ctx!.fillRect(f.c * t, f.l * t, t, t)
187         }
188         ctx!.globalAlpha = 1
189       }
190
191       function tique(agora: number) {
192         const dt = Math.min(64, agora - ultimo)
193         ultimo = agora
194         for (const f of faiscas) f.vida -= dt / VIDA_MS
195         faiscas = faiscas.filter((f) => f.vida > 0)
196         desenhar()
197         quadro = faiscas.length > 0 ? requestAnimationFrame(tique) : 0
198       }
199
200       function acordar() {
201         if (quadro === 0 && !document.hidden) {
202           ultimo = performance.now()
203           quadro = requestAnimationFrame(tique)
204         }
205       }
206
207       function acender(c: number, l: number, cor: string) {
208         if (c < 0 || l < 0 || c >= colunas || l >= linhas) return
209         const existente = faiscas.find((f) => f.c === c && f.l === l)
210         if (existente) existente.vida = 1
211         else faiscas.push({ c, l, vida: 1, cor })
212         acordar()
213       }
214
215       // Sinapses espontâneas: uma célula e, às vezes, uma vizinha, como um sinal que passa.
216       const intervalo = window.setInterval(() => {
217         if (document.hidden) return
218         const c = Math.floor(Math.random() * colunas)
219         const l = Math.floor(Math.random() * linhas)
220         const sorteio = Math.random()
221         acender(c, l, sorteio < 0.5 ? cores.azul : sorteio < 0.8 ? cores.dourado : cores.rosa)
222         if (Math.random() < 0.5) acender(c + (Math.random() < 0.5 ? 1 : -1), l, cores.azul)
223       }, INTERVALO_MS)
224
225       let ultimaCelula = ''
226       const aoMover = (e: PointerEvent) => {
227         if (e.pointerType !== 'mouse') return
228         const c = Math.floor(e.clientX / CELULA)
229         const l = Math.floor(e.clientY / CELULA)
230         const chave = `${c}:${l}`
231         if (chave === ultimaCelula) return
232         ultimaCelula = chave
233         acender(c, l, cores.acento)
234       }
235       const aoVisibilidade = () => {
236         if (document.hidden && quadro) {
237           cancelAnimationFrame(quadro)
238           quadro = 0
239         } else acordar()
240       }
241
242       medir()
243       window.addEventListener('resize', medir)
244       window.addEventListener('pointermove', aoMover, { passive: true })
245       document.addEventListener('visibilitychange', aoVisibilidade)
246       return () => {
247         window.clearInterval(intervalo)
248         window.removeEventListener('resize', medir)
249         window.removeEventListener('pointermove', aoMover)
250         document.removeEventListener('visibilitychange', aoVisibilidade)
251         if (quadro) cancelAnimationFrame(quadro)
252       }
253     }, [ativo])
254
255     if (!ativo) return null
256     return <canvas ref={ref} className="sinapse-fundo" aria-hidden="true" />
257   }
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#1/pedido-cumprido/p1 -->

## 12. pedido-cumprido

O diff cumpre o critério do caso?

```text
<pedido>
Deixe as estrelas do fundo mais frequentes e espalhadas pelo céu inteiro, não só no alto.
</pedido>
<criterio>
PASS se, depois da tentativa, a chance de uma célula do céu virar estrela é a mesma em qualquer altura (a condição não depende mais de y) e maior que 1,5 %, a maior chance do base. No base, a condição é r > 0.991 - (1 - y) * 0.006: limiar 0,985 no alto (1,5 %) e 0,991 embaixo (0,9 %). FAIL se a chance ainda muda com a altura, se não passa de 1,5 % ou se a mudança faz outra coisa no lugar.
</criterio>
<diff>
diff --git a/componentes/Fundo.tsx b/componentes/Fundo.tsx
index c91560f..d1c3a7b 100644
--- a/componentes/Fundo.tsx
+++ b/componentes/Fundo.tsx
@@ -1,25 +1,26 @@
 'use client'

 import { useEffect, useRef } from 'react'

-// Fundo: a nebulosa em pixels. Céu marinho em cima com estrelas (algumas com picos), azul aberto no
-// meio e, embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego, desenhada por ruído em
-// blocos. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro e apagam em meio
-// segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos tokens (G26).
+// Fundo: a nebulosa em pixels. Céu marinho em cima, azul aberto no meio e estrelas espalhadas por ele
+// inteiro (algumas com picos); embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego,
+// desenhada por ruído em blocos. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro
+// e apagam em meio segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos tokens (G26).

 const CELULA = 20
+const BLOCO_ESTRELA = 5
 const VIDA_MS = 900
 const INTERVALO_MS = 380

 type Faisca = { c: number; l: number; vida: number; cor: string }

 /** Hash determinístico em [0, 1): o mesmo fundo em toda visita. */
 function ruido(c: number, l: number, semente = 0): number {
   let h = (c * 73856093) ^ (l * 19349663) ^ (semente * 83492791)
   h = Math.imul(h ^ (h >>> 13), 1274126177)
   return ((h ^ (h >>> 16)) >>> 0) / 4294967295
 }

 /** Ruído de valor suave (interpola o hash em blocos de `escala` células). */
 function suave(c: number, l: number, escala: number, semente: number): number {
   const x = c / escala
@@ -59,73 +60,100 @@ export function Fundo({ ativo }: { ativo: boolean }) {
     if (!ctx) return
     const estilo = getComputedStyle(document.documentElement)
     const cor = (nome: string) => estilo.getPropertyValue(`--color-sinapse-${nome}`).trim()
     const cores = {
       baixo: cor('fundo-baixo'),
       fundo: cor('fundo'),
       alto: cor('fundo-alto'),
       ceu: cor('ceu'),
       azul: cor('azul'),
       acento: cor('acento'),
       brasa: cor('brasa'),
       pessego: cor('pessego'),
       dourado: cor('dourado'),
       rosa: cor('rosa'),
       estrela: cor('estrela'),
+      poeira: cor('poeira'),
       ferrugem: cor('ferrugem'),
       marrom: cor('marrom'),
     }

     let dpr = 1
     let colunas = 0
     let linhas = 0
     let base: HTMLCanvasElement | null = null
     let faiscas: Faisca[] = []
     let quadro = 0
     let ultimo = 0

     function desenharBase() {
       if (!base) return
       const b = base.getContext('2d')
       if (!b) return
       const t = CELULA * dpr
       for (let l = 0; l < linhas; l++) {
         const y = l / Math.max(1, linhas - 1)
         // Céu: marinho no alto, petróleo no meio, azul aberto perto da crista.
         const ceu =
           y < 0.5 ? misturar(cores.baixo, cores.fundo, y * 2) : misturar(cores.fundo, cores.ceu, (y - 0.5) * 1.3)
         b.fillStyle = ceu
         b.fillRect(0, l * t, base!.width, t)
         for (let c = 0; c < colunas; c++) {
           // Textura do céu: blocos um tom mais claros, irregulares.
           if (ruido(c >> 1, l >> 1, 1) > 0.58 && ruido(c, l, 2) > 0.3) {
             b.fillStyle = misturar(ceu, cores.alto, 0.5)
             b.fillRect(c * t, l * t, t, t)
           }
-          // Estrelas: raras, mais no alto; as grandes ganham quatro picos.
-          const r = ruido(c, l, 3)
-          if (r > 0.991 - (1 - y) * 0.006) {
-            const grande = r > 0.9985
-            b.fillStyle = r > 0.992 ? cores.estrela : ruido(c, l, 4) > 0.5 ? cores.dourado : cores.azul
-            b.fillRect(c * t, l * t, t, t)
-            if (grande) {
-              b.globalAlpha = 0.3
-              b.fillRect((c - 1) * t, l * t, t * 3, t)
-              b.fillRect(c * t, (l - 1) * t, t, t * 3)
-              b.globalAlpha = 1
-            }
+        }
+      }
+      // Estrelas: no máximo uma por bloco de BLOCO_ESTRELA × BLOCO_ESTRELA células, num ponto sorteado dentro dele,
+      // para cobrir o céu inteiro por igual, sem vazios nem aglomerados. O ponto vai até a penúltima célula do bloco,
+      // e duas estrelas vizinhas nunca encostam. Um quinto dos blocos fica vazio, a maioria das estrelas é fraca,
+      // algumas brilham cheias e as grandes ganham quatro picos. Passada própria, depois do céu inteiro, para a linha
+      // de baixo não apagar os picos; a crista, desenhada depois, cobre as que caem nela.
+      for (let bl = 0; bl * BLOCO_ESTRELA < linhas; bl++) {
+        for (let bc = 0; bc * BLOCO_ESTRELA < colunas; bc++) {
+          const r = ruido(bc, bl, 3)
+          if (r < 0.2) continue
+          const dentro = (semente: number) =>
+            Math.min(BLOCO_ESTRELA - 2, Math.floor(ruido(bc, bl, semente) * (BLOCO_ESTRELA - 1)))
+          const c = bc * BLOCO_ESTRELA + dentro(9)
+          const l = bl * BLOCO_ESTRELA + dentro(10)
+          const grande = r > 0.93
+          const tom = ruido(bc, bl, 4)
+          if (r < 0.62) {
+            // Fraca: tom frio e meio apagado, como uma estrela distante.
+            b.fillStyle = tom < 0.6 ? cores.poeira : cores.azul
+            b.globalAlpha = 0.55
+          } else {
+            b.fillStyle = grande || tom < 0.55 ? cores.estrela : tom < 0.78 ? cores.dourado : cores.azul
+            b.globalAlpha = 1
           }
+          b.fillRect(c * t, l * t, t, t)
+          if (grande) {
+            b.globalAlpha = 0.3
+            b.fillRect((c - 1) * t, l * t, t, t)
+            b.fillRect((c + 1) * t, l * t, t, t)
+            b.fillRect(c * t, (l - 1) * t, t, t)
+            b.fillRect(c * t, (l + 1) * t, t, t)
+          }
+        }
+      }
+      b.globalAlpha = 1
+      for (let l = 0; l < linhas; l++) {
+        const y = l / Math.max(1, linhas - 1)
+        for (let c = 0; c < colunas; c++) {
           // Crista de poeira: ocupa o terço de baixo, com a borda recortada pelo ruído.
           const borda = 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
           if (y > borda) {
             const prof = (y - borda) / Math.max(0.05, 1 - borda)
             const n = suave(c, l, 5, 7)
             let tom: string
             if (prof < 0.12) tom = n > 0.5 ? cores.pessego : cores.acento
             else if (prof < 0.35) tom = n > 0.55 ? cores.acento : cores.brasa
             else if (prof < 0.7) tom = n > 0.6 ? cores.brasa : cores.ferrugem
             else tom = n > 0.7 ? cores.ferrugem : cores.marrom
             // Buracos de gás ionizado em rosa, raros.
             if (ruido(c, l, 8) > 0.993) tom = cores.rosa
             b.fillStyle = tom
             b.fillRect(c * t, l * t, t, t)
           }
</diff>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#2/juiz-comentario-porque/c4 -->

## 13. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Estrelas em grade sorteada: cada bloco de BLOCO_ESTRELA células acende, ou não, uma estrela numa
posição sorteada dentro dele, fora da última coluna e da última linha. Ficam espalhadas por igual,
sem aglomerar nem deixar buraco, e duas estrelas nunca caem em células vizinhas.
</comentario>
<trecho>
50 + function temEstrela(c: number, l: number): boolean {
51 +   const bc = Math.floor(c / BLOCO_ESTRELA)
52 +   const bl = Math.floor(l / BLOCO_ESTRELA)
53 +   if (ruido(bc, bl, 3) > CHANCE_ESTRELA) return false
54 +   const vao = BLOCO_ESTRELA - 1
55 +   return (
56 +     c === bc * BLOCO_ESTRELA + Math.min(vao - 1, Math.floor(ruido(bc, bl, 9) * vao)) &&
57 +     l === bl * BLOCO_ESTRELA + Math.min(vao - 1, Math.floor(ruido(bc, bl, 10) * vao))
58 +   )
59 + }
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#3/juiz-comentario-descreve/c4 -->

## 14. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
As grandes ganham quatro picos.
</comentario>
<trecho>
125 +           if (ruido(bc, bl, 11) < 0.08) {
126               b.globalAlpha = 0.3
127               b.fillRect((c - 1) * t, l * t, t * 3, t)
128               b.fillRect(c * t, (l - 1) * t, t, t * 3)
129               b.globalAlpha = 1
130             }
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#2/juiz-comentario-descreve/c1 -->

## 15. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Fundo: a nebulosa em pixels. Céu marinho em cima e azul aberto no meio, com estrelas espalhadas
pelo céu inteiro (algumas com picos) e, embaixo, a crista de poeira em ferrugem, brasa, laranja e
pêssego, desenhada por ruído em blocos. Por cima, sinapses: células acendem sozinhas e no rastro
do ponteiro e apagam em meio segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos
tokens (G26).
</comentario>
<trecho>
  1   'use client'
  2
  3   import { useEffect, useRef } from 'react'
  4
  5 + // Fundo: a nebulosa em pixels. Céu marinho em cima e azul aberto no meio, com estrelas espalhadas
  6 + // pelo céu inteiro (algumas com picos) e, embaixo, a crista de poeira em ferrugem, brasa, laranja e
  7 + // pêssego, desenhada por ruído em blocos. Por cima, sinapses: células acendem sozinhas e no rastro
  8 + // do ponteiro e apagam em meio segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos
  9 + // tokens (G26).
 10
 11   const CELULA = 20
 12   const VIDA_MS = 900
 13   const INTERVALO_MS = 380
 14 + /** Lado, em células, do bloco que recebe no máximo uma estrela. */
 15 + const BLOCO_ESTRELA = 5
 16 + /** Fração dos blocos com estrela: perto de 3 % do céu aceso, igual do alto até a crista. */
 17 + const CHANCE_ESTRELA = 0.75
 18
 19   type Faisca = { c: number; l: number; vida: number; cor: string }
 20
 21   /** Hash determinístico em [0, 1): o mesmo fundo em toda visita. */
 22   function ruido(c: number, l: number, semente = 0): number {
 23     let h = (c * 73856093) ^ (l * 19349663) ^ (semente * 83492791)
 24     h = Math.imul(h ^ (h >>> 13), 1274126177)
 25     return ((h ^ (h >>> 16)) >>> 0) / 4294967295
 26   }
 27
 28   /** Ruído de valor suave (interpola o hash em blocos de `escala` células). */
 29   function suave(c: number, l: number, escala: number, semente: number): number {
 30     const x = c / escala
 31     const y = l / escala
 32     const x0 = Math.floor(x)
 33     const y0 = Math.floor(y)
 34     const fx = x - x0
 35     const fy = y - y0
 36     const u = fx * fx * (3 - 2 * fx)
 37     const v = fy * fy * (3 - 2 * fy)
 38     const a = ruido(x0, y0, semente)
 39     const b = ruido(x0 + 1, y0, semente)
 40     const cc = ruido(x0, y0 + 1, semente)
 41     const d = ruido(x0 + 1, y0 + 1, semente)
 42     return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v
 43   }
 44
 45 + /**
 46 +  * Estrelas em grade sorteada: cada bloco de BLOCO_ESTRELA células acende, ou não, uma estrela numa
 47 +  * posição sorteada dentro dele, fora da última coluna e da última linha. Ficam espalhadas por igual,
 48 +  * sem aglomerar nem deixar buraco, e duas estrelas nunca caem em células vizinhas.
 49 +  */
 50 + function temEstrela(c: number, l: number): boolean {
 51 +   const bc = Math.floor(c / BLOCO_ESTRELA)
 52 +   const bl = Math.floor(l / BLOCO_ESTRELA)
 53 +   if (ruido(bc, bl, 3) > CHANCE_ESTRELA) return false
 54 +   const vao = BLOCO_ESTRELA - 1
 55 +   return (
 56 +     c === bc * BLOCO_ESTRELA + Math.min(vao - 1, Math.floor(ruido(bc, bl, 9) * vao)) &&
 57 +     l === bl * BLOCO_ESTRELA + Math.min(vao - 1, Math.floor(ruido(bc, bl, 10) * vao))
 58 +   )
 59 + }
 60 +
 61   const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
 62   /** Mistura dois tokens em hex numa fração t e devolve hex. */
 63   function misturar(a: string, b: string, t: number): string {
 64     return `#${[0, 1, 2]
 65       .map((i) =>
 66         Math.round(canal(a, i) + (canal(b, i) - canal(a, i)) * t)
 67           .toString(16)
 68           .padStart(2, '0'),
 69       )
 70       .join('')}`
 71   }
 72
 73   export function Fundo({ ativo }: { ativo: boolean }) {
 74     const ref = useRef<HTMLCanvasElement>(null)
 75
 76     useEffect(() => {
 77       const canvas = ref.current
 78       if (!ativo || !canvas) return
 79       const ctx = canvas.getContext('2d')
 80       if (!ctx) return
 81       const estilo = getComputedStyle(document.documentElement)
 82       const cor = (nome: string) => estilo.getPropertyValue(`--color-sinapse-${nome}`).trim()
 83       const cores = {
 84         baixo: cor('fundo-baixo'),
 85         fundo: cor('fundo'),
 86         alto: cor('fundo-alto'),
 87         ceu: cor('ceu'),
 88         azul: cor('azul'),
 89         acento: cor('acento'),
 90         brasa: cor('brasa'),
 91         pessego: cor('pessego'),
 92         dourado: cor('dourado'),
 93         rosa: cor('rosa'),
 94         estrela: cor('estrela'),
 95         ferrugem: cor('ferrugem'),
 96         marrom: cor('marrom'),
 97       }
 98
 99       let dpr = 1
100       let colunas = 0
101       let linhas = 0
102       let base: HTMLCanvasElement | null = null
103       let faiscas: Faisca[] = []
104       let quadro = 0
105       let ultimo = 0
106
107       function desenharBase() {
108         if (!base) return
109         const b = base.getContext('2d')
110         if (!b) return
111         const t = CELULA * dpr
112 +       const altura = (l: number) => l / Math.max(1, linhas - 1)
113 +       // Em três passadas (céu, estrelas, crista), para nenhuma apagar os picos de uma estrela grande.
114         for (let l = 0; l < linhas; l++) {
115 +         const y = altura(l)
116           // Céu: marinho no alto, petróleo no meio, azul aberto perto da crista.
117           const ceu =
118             y < 0.5 ? misturar(cores.baixo, cores.fundo, y * 2) : misturar(cores.fundo, cores.ceu, (y - 0.5) * 1.3)
119           b.fillStyle = ceu
120           b.fillRect(0, l * t, base!.width, t)
121           for (let c = 0; c < colunas; c++) {
122             // Textura do céu: blocos um tom mais claros, irregulares.
123             if (ruido(c >> 1, l >> 1, 1) > 0.58 && ruido(c, l, 2) > 0.3) {
124               b.fillStyle = misturar(ceu, cores.alto, 0.5)
125               b.fillRect(c * t, l * t, t, t)
126             }
127 +         }
128 +       }
129 +       // Estrelas: brancas na maioria, algumas douradas ou azuis; uma em cada oito ganha quatro picos e
130 +       // uma em cada três brilha menos. As que caem na crista ficam atrás da poeira.
131 +       for (let l = 0; l < linhas; l++) {
132 +         for (let c = 0; c < colunas; c++) {
133 +           if (!temEstrela(c, l)) continue
134 +           const brilho = ruido(c, l, 4)
135 +           const tom = ruido(c, l, 11)
136 +           b.fillStyle = tom < 0.6 ? cores.estrela : tom < 0.85 ? cores.dourado : cores.azul
137 +           b.globalAlpha = brilho < 0.33 ? 0.75 : 1
138             b.fillRect(c * t, l * t, t, t)
139 +           if (brilho > 0.875) {
140               b.globalAlpha = 0.3
141               b.fillRect((c - 1) * t, l * t, t * 3, t)
142               b.fillRect(c * t, (l - 1) * t, t, t * 3)
143 +           }
144             b.globalAlpha = 1
145           }
146         }
147 +       for (let l = 0; l < linhas; l++) {
148 +         const y = altura(l)
149 +         for (let c = 0; c < colunas; c++) {
150             // Crista de poeira: ocupa o terço de baixo, com a borda recortada pelo ruído.
151             const borda = 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
152             if (y > borda) {
153               const prof = (y - borda) / Math.max(0.05, 1 - borda)
154               const n = suave(c, l, 5, 7)
155               let tom: string
156               if (prof < 0.12) tom = n > 0.5 ? cores.pessego : cores.acento
157               else if (prof < 0.35) tom = n > 0.55 ? cores.acento : cores.brasa
158               else if (prof < 0.7) tom = n > 0.6 ? cores.brasa : cores.ferrugem
159               else tom = n > 0.7 ? cores.ferrugem : cores.marrom
160               // Buracos de gás ionizado em rosa, raros.
161               if (ruido(c, l, 8) > 0.993) tom = cores.rosa
162               b.fillStyle = tom
163               b.fillRect(c * t, l * t, t, t)
164             }
165           }
166         }
167       }
168
169       function medir() {
170         dpr = Math.min(window.devicePixelRatio || 1, 2)
171         canvas!.width = Math.ceil(window.innerWidth * dpr)
172         canvas!.height = Math.ceil(window.innerHeight * dpr)
173         canvas!.style.width = `${window.innerWidth}px`
174         canvas!.style.height = `${window.innerHeight}px`
175         colunas = Math.ceil(window.innerWidth / CELULA)
176         linhas = Math.ceil(window.innerHeight / CELULA)
177         base = document.createElement('canvas')
178         base.width = canvas!.width
179         base.height = canvas!.height
180         desenharBase()
181         desenhar()
182       }
183
184       function desenhar() {
185         if (!base) return
186         ctx!.drawImage(base, 0, 0)
187         const t = CELULA * dpr
188         for (const f of faiscas) {
189           ctx!.globalAlpha = Math.pow(Math.max(0, f.vida), 1.4)
190           ctx!.fillStyle = f.cor
191           ctx!.fillRect(f.c * t, f.l * t, t, t)
192         }
193         ctx!.globalAlpha = 1
194       }
195
196       function tique(agora: number) {
197         const dt = Math.min(64, agora - ultimo)
198         ultimo = agora
199         for (const f of faiscas) f.vida -= dt / VIDA_MS
200         faiscas = faiscas.filter((f) => f.vida > 0)
201         desenhar()
202         quadro = faiscas.length > 0 ? requestAnimationFrame(tique) : 0
203       }
204
205       function acordar() {
206         if (quadro === 0 && !document.hidden) {
207           ultimo = performance.now()
208           quadro = requestAnimationFrame(tique)
209         }
210       }
211
212       function acender(c: number, l: number, cor: string) {
213         if (c < 0 || l < 0 || c >= colunas || l >= linhas) return
214         const existente = faiscas.find((f) => f.c === c && f.l === l)
215         if (existente) existente.vida = 1
216         else faiscas.push({ c, l, vida: 1, cor })
217         acordar()
218       }
219
220       // Sinapses espontâneas: uma célula e, às vezes, uma vizinha, como um sinal que passa.
221       const intervalo = window.setInterval(() => {
222         if (document.hidden) return
223         const c = Math.floor(Math.random() * colunas)
224         const l = Math.floor(Math.random() * linhas)
225         const sorteio = Math.random()
226         acender(c, l, sorteio < 0.5 ? cores.azul : sorteio < 0.8 ? cores.dourado : cores.rosa)
227         if (Math.random() < 0.5) acender(c + (Math.random() < 0.5 ? 1 : -1), l, cores.azul)
228       }, INTERVALO_MS)
229
230       let ultimaCelula = ''
231       const aoMover = (e: PointerEvent) => {
232         if (e.pointerType !== 'mouse') return
233         const c = Math.floor(e.clientX / CELULA)
234         const l = Math.floor(e.clientY / CELULA)
235         const chave = `${c}:${l}`
236         if (chave === ultimaCelula) return
237         ultimaCelula = chave
238         acender(c, l, cores.acento)
239       }
240       const aoVisibilidade = () => {
241         if (document.hidden && quadro) {
242           cancelAnimationFrame(quadro)
243           quadro = 0
244         } else acordar()
245       }
246
247       medir()
248       window.addEventListener('resize', medir)
249       window.addEventListener('pointermove', aoMover, { passive: true })
250       document.addEventListener('visibilitychange', aoVisibilidade)
251       return () => {
252         window.clearInterval(intervalo)
253         window.removeEventListener('resize', medir)
254         window.removeEventListener('pointermove', aoMover)
255         document.removeEventListener('visibilitychange', aoVisibilidade)
256         if (quadro) cancelAnimationFrame(quadro)
257       }
258     }, [ativo])
259
260     if (!ativo) return null
261     return <canvas ref={ref} className="sinapse-fundo" aria-hidden="true" />
262   }
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas@quebrada/juiz-comentario-antigo/a1 -->

## 16. juiz-comentario-antigo

O comentário, que a tentativa não mudou, continua verdadeiro para o trecho de depois?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Estrelas: raras, mais no alto; as grandes ganham quatro picos.
</comentario>
<antes>
105             const r = ruido(c, l, 3)
106             if (r > 0.991 - (1 - y) * 0.006) {
107               const grande = r > 0.9985
108               b.fillStyle = r > 0.992 ? cores.estrela : ruido(c, l, 4) > 0.5 ? cores.dourado : cores.azul
109               b.fillRect(c * t, l * t, t, t)
110               if (grande) {
111                 b.globalAlpha = 0.3
112                 b.fillRect((c - 1) * t, l * t, t * 3, t)
113                 b.fillRect(c * t, (l - 1) * t, t, t * 3)
114                 b.globalAlpha = 1
115               }
116             }
</antes>
<depois>
105             const r = ruido(c, l, 3)
106 +           if (r > 0.975) {
107               const grande = r > 0.9985
108               b.fillStyle = r > 0.992 ? cores.estrela : ruido(c, l, 4) > 0.5 ? cores.dourado : cores.azul
109               b.fillRect(c * t, l * t, t, t)
110               if (grande) {
111                 b.globalAlpha = 0.3
112                 b.fillRect((c - 1) * t, l * t, t * 3, t)
113                 b.fillRect(c * t, (l - 1) * t, t, t * 3)
114                 b.globalAlpha = 1
115               }
116             }
</depois>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#2/juiz-comentario-porque/c2 -->

## 17. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Lado, em células, do bloco que recebe no máximo uma estrela.
</comentario>
<trecho>
15 + const BLOCO_ESTRELA = 5
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#1/juiz-comentario-descreve/c3 -->

## 18. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Fraca: tom frio e meio apagado, como uma estrela distante.
</comentario>
<trecho>
125 +             b.fillStyle = tom < 0.6 ? cores.poeira : cores.azul
126 +             b.globalAlpha = 0.55
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#3/pedido-cumprido/p1 -->

## 19. pedido-cumprido

O diff cumpre o critério do caso?

```text
<pedido>
Deixe as estrelas do fundo mais frequentes e espalhadas pelo céu inteiro, não só no alto.
</pedido>
<criterio>
PASS se, depois da tentativa, a chance de uma célula do céu virar estrela é a mesma em qualquer altura (a condição não depende mais de y) e maior que 1,5 %, a maior chance do base. No base, a condição é r > 0.991 - (1 - y) * 0.006: limiar 0,985 no alto (1,5 %) e 0,991 embaixo (0,9 %). FAIL se a chance ainda muda com a altura, se não passa de 1,5 % ou se a mudança faz outra coisa no lugar.
</criterio>
<diff>
diff --git a/componentes/Fundo.tsx b/componentes/Fundo.tsx
index c91560f..3777559 100644
--- a/componentes/Fundo.tsx
+++ b/componentes/Fundo.tsx
@@ -1,27 +1,30 @@
 'use client'

 import { useEffect, useRef } from 'react'

-// Fundo: a nebulosa em pixels. Céu marinho em cima com estrelas (algumas com picos), azul aberto no
-// meio e, embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego, desenhada por ruído em
+// Fundo: a nebulosa em pixels. Céu marinho em cima, azul aberto no meio, estrelas (algumas com picos)
+// salpicadas do alto até a crista e, embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego, desenhada por ruído em
 // blocos. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro e apagam em meio
 // segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos tokens (G26).

 const CELULA = 20
 const VIDA_MS = 900
 const INTERVALO_MS = 380
+// Estrelas: o céu é dividido em blocos de 5×5 células, e 80% deles ganham uma estrela.
+const BLOCO_ESTRELA = 5
+const CHANCE_ESTRELA = 0.8

 type Faisca = { c: number; l: number; vida: number; cor: string }

 /** Hash determinístico em [0, 1): o mesmo fundo em toda visita. */
 function ruido(c: number, l: number, semente = 0): number {
   let h = (c * 73856093) ^ (l * 19349663) ^ (semente * 83492791)
   h = Math.imul(h ^ (h >>> 13), 1274126177)
   return ((h ^ (h >>> 16)) >>> 0) / 4294967295
 }

 /** Ruído de valor suave (interpola o hash em blocos de `escala` células). */
 function suave(c: number, l: number, escala: number, semente: number): number {
   const x = c / escala
   const y = l / escala
   const x0 = Math.floor(x)
@@ -76,58 +79,73 @@ export function Fundo({ ativo }: { ativo: boolean }) {
     }

     let dpr = 1
     let colunas = 0
     let linhas = 0
     let base: HTMLCanvasElement | null = null
     let faiscas: Faisca[] = []
     let quadro = 0
     let ultimo = 0

     function desenharBase() {
       if (!base) return
       const b = base.getContext('2d')
       if (!b) return
       const t = CELULA * dpr
+      const altura = (l: number) => l / Math.max(1, linhas - 1)
+      // Crista de poeira: ocupa o terço de baixo, com a borda recortada pelo ruído.
+      const bordaDaCrista = (c: number) => 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
       for (let l = 0; l < linhas; l++) {
-        const y = l / Math.max(1, linhas - 1)
+        const y = altura(l)
         // Céu: marinho no alto, petróleo no meio, azul aberto perto da crista.
         const ceu =
           y < 0.5 ? misturar(cores.baixo, cores.fundo, y * 2) : misturar(cores.fundo, cores.ceu, (y - 0.5) * 1.3)
         b.fillStyle = ceu
         b.fillRect(0, l * t, base!.width, t)
         for (let c = 0; c < colunas; c++) {
           // Textura do céu: blocos um tom mais claros, irregulares.
           if (ruido(c >> 1, l >> 1, 1) > 0.58 && ruido(c, l, 2) > 0.3) {
             b.fillStyle = misturar(ceu, cores.alto, 0.5)
             b.fillRect(c * t, l * t, t, t)
           }
-          // Estrelas: raras, mais no alto; as grandes ganham quatro picos.
-          const r = ruido(c, l, 3)
-          if (r > 0.991 - (1 - y) * 0.006) {
-            const grande = r > 0.9985
-            b.fillStyle = r > 0.992 ? cores.estrela : ruido(c, l, 4) > 0.5 ? cores.dourado : cores.azul
-            b.fillRect(c * t, l * t, t, t)
-            if (grande) {
-              b.globalAlpha = 0.3
-              b.fillRect((c - 1) * t, l * t, t * 3, t)
-              b.fillRect(c * t, (l - 1) * t, t, t * 3)
-              b.globalAlpha = 1
-            }
+        }
+      }
+      // Estrelas: no máximo uma por bloco, numa célula sorteada dentro dele, para salpicarem o céu
+      // inteiro, do alto até a crista, sem aglomerar. Vêm depois do céu para os picos das grandes
+      // não serem cobertos pela linha seguinte, e antes da crista, que as esconde.
+      for (let bl = 0; bl * BLOCO_ESTRELA < linhas; bl++) {
+        for (let bc = 0; bc * BLOCO_ESTRELA < colunas; bc++) {
+          if (ruido(bc, bl, 3) >= CHANCE_ESTRELA) continue
+          const c = bc * BLOCO_ESTRELA + Math.min(BLOCO_ESTRELA - 1, Math.floor(ruido(bc, bl, 9) * BLOCO_ESTRELA))
+          const l = bl * BLOCO_ESTRELA + Math.min(BLOCO_ESTRELA - 1, Math.floor(ruido(bc, bl, 10) * BLOCO_ESTRELA))
+          if (c >= colunas || l >= linhas || altura(l) > bordaDaCrista(c)) continue
+          const tipo = ruido(bc, bl, 4)
+          b.fillStyle = tipo < 0.55 ? cores.estrela : tipo < 0.8 ? cores.dourado : cores.azul
+          b.fillRect(c * t, l * t, t, t)
+          // As grandes ganham quatro picos.
+          if (ruido(bc, bl, 11) < 0.08) {
+            b.globalAlpha = 0.3
+            b.fillRect((c - 1) * t, l * t, t * 3, t)
+            b.fillRect(c * t, (l - 1) * t, t, t * 3)
+            b.globalAlpha = 1
           }
-          // Crista de poeira: ocupa o terço de baixo, com a borda recortada pelo ruído.
-          const borda = 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
+        }
+      }
+      for (let l = 0; l < linhas; l++) {
+        const y = altura(l)
+        for (let c = 0; c < colunas; c++) {
+          const borda = bordaDaCrista(c)
           if (y > borda) {
             const prof = (y - borda) / Math.max(0.05, 1 - borda)
             const n = suave(c, l, 5, 7)
             let tom: string
             if (prof < 0.12) tom = n > 0.5 ? cores.pessego : cores.acento
             else if (prof < 0.35) tom = n > 0.55 ? cores.acento : cores.brasa
             else if (prof < 0.7) tom = n > 0.6 ? cores.brasa : cores.ferrugem
             else tom = n > 0.7 ? cores.ferrugem : cores.marrom
             // Buracos de gás ionizado em rosa, raros.
             if (ruido(c, l, 8) > 0.993) tom = cores.rosa
             b.fillStyle = tom
             b.fillRect(c * t, l * t, t, t)
           }
         }
       }
</diff>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#3/juiz-comentario-porque/c3 -->

## 20. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Estrelas: no máximo uma por bloco, numa célula sorteada dentro dele, para salpicarem o céu
inteiro, do alto até a crista, sem aglomerar. Vêm depois do céu para os picos das grandes
não serem cobertos pela linha seguinte, e antes da crista, que as esconde.
</comentario>
<trecho>
115 +       for (let bl = 0; bl * BLOCO_ESTRELA < linhas; bl++) {
116 +         for (let bc = 0; bc * BLOCO_ESTRELA < colunas; bc++) {
117 +           if (ruido(bc, bl, 3) >= CHANCE_ESTRELA) continue
118 +           const c = bc * BLOCO_ESTRELA + Math.min(BLOCO_ESTRELA - 1, Math.floor(ruido(bc, bl, 9) * BLOCO_ESTRELA))
119 +           const l = bl * BLOCO_ESTRELA + Math.min(BLOCO_ESTRELA - 1, Math.floor(ruido(bc, bl, 10) * BLOCO_ESTRELA))
120 +           if (c >= colunas || l >= linhas || altura(l) > bordaDaCrista(c)) continue
121 +           const tipo = ruido(bc, bl, 4)
122 +           b.fillStyle = tipo < 0.55 ? cores.estrela : tipo < 0.8 ? cores.dourado : cores.azul
123             b.fillRect(c * t, l * t, t, t)
124 +           // As grandes ganham quatro picos.
125 +           if (ruido(bc, bl, 11) < 0.08) {
126               b.globalAlpha = 0.3
127               b.fillRect((c - 1) * t, l * t, t * 3, t)
128               b.fillRect(c * t, (l - 1) * t, t, t * 3)
129               b.globalAlpha = 1
130             }
131           }
132 +       }
133 +       for (let l = 0; l < linhas; l++) {
134 +         const y = altura(l)
135 +         for (let c = 0; c < colunas; c++) {
136 +           const borda = bordaDaCrista(c)
137             if (y > borda) {
138               const prof = (y - borda) / Math.max(0.05, 1 - borda)
139               const n = suave(c, l, 5, 7)
140               let tom: string
141               if (prof < 0.12) tom = n > 0.5 ? cores.pessego : cores.acento
142               else if (prof < 0.35) tom = n > 0.55 ? cores.acento : cores.brasa
143               else if (prof < 0.7) tom = n > 0.6 ? cores.brasa : cores.ferrugem
144               else tom = n > 0.7 ? cores.ferrugem : cores.marrom
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-02-respostas@quebrada/juiz-comentario-descreve/c1 -->

## 21. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>lib/oferta.ts</arquivo>
<comentario>
As duas últimas foram confirmadas pelo Lucas (docs/especificacao.md §6).
</comentario>
<trecho>
34   export const PERGUNTAS: readonly Pergunta[] = [
35     {
36       pergunta: 'Não entendo de tecnologia. Tem problema?',
37       resposta:
38         'Não. Você me conta do seu negócio e eu cuido da parte técnica. A gente conversa em português claro, sem termos difíceis.',
39     },
40     {
41       pergunta: 'Quanto custa?',
42       resposta: 'Depende do que o seu negócio precisa. Me chama no WhatsApp, eu entendo o caso e te passo um orçamento.',
43     },
44     {
45       pergunta: 'Você atende fora de Navegantes?',
46       resposta: 'Sim. Em Navegantes e região eu vou até você. Para outras cidades, atendo à distância.',
47     },
48     {
49       pergunta: 'O site funciona bem no celular?',
50       resposta: 'Sim. Eu faço pensando no celular primeiro, porque é onde a maioria dos clientes abre.',
51     },
52     {
53       pergunta: 'Preciso ter domínio e hospedagem antes?',
54       resposta: 'Não precisa ter antes. Eu oriento o que contratar e deixo tudo configurado.',
55     },
56     {
57       pergunta: 'Posso mudar textos e fotos depois?',
58       resposta: 'Sim. No começo definimos o que você vai precisar alterar sozinho e eu preparo o site para isso.',
59     },
60   ]
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#2/pedido-cumprido/p1 -->

## 22. pedido-cumprido

O diff cumpre o critério do caso?

```text
<pedido>
Deixe as estrelas do fundo mais frequentes e espalhadas pelo céu inteiro, não só no alto.
</pedido>
<criterio>
PASS se, depois da tentativa, a chance de uma célula do céu virar estrela é a mesma em qualquer altura (a condição não depende mais de y) e maior que 1,5 %, a maior chance do base. No base, a condição é r > 0.991 - (1 - y) * 0.006: limiar 0,985 no alto (1,5 %) e 0,991 embaixo (0,9 %). FAIL se a chance ainda muda com a altura, se não passa de 1,5 % ou se a mudança faz outra coisa no lugar.
</criterio>
<diff>
diff --git a/componentes/Fundo.tsx b/componentes/Fundo.tsx
index c91560f..5d3488d 100644
--- a/componentes/Fundo.tsx
+++ b/componentes/Fundo.tsx
@@ -1,54 +1,75 @@
 'use client'

 import { useEffect, useRef } from 'react'

-// Fundo: a nebulosa em pixels. Céu marinho em cima com estrelas (algumas com picos), azul aberto no
-// meio e, embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego, desenhada por ruído em
-// blocos. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro e apagam em meio
-// segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos tokens (G26).
+// Fundo: a nebulosa em pixels. Céu marinho em cima e azul aberto no meio, com estrelas espalhadas
+// pelo céu inteiro (algumas com picos) e, embaixo, a crista de poeira em ferrugem, brasa, laranja e
+// pêssego, desenhada por ruído em blocos. Por cima, sinapses: células acendem sozinhas e no rastro
+// do ponteiro e apagam em meio segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos
+// tokens (G26).

 const CELULA = 20
 const VIDA_MS = 900
 const INTERVALO_MS = 380
+/** Lado, em células, do bloco que recebe no máximo uma estrela. */
+const BLOCO_ESTRELA = 5
+/** Fração dos blocos com estrela: perto de 3 % do céu aceso, igual do alto até a crista. */
+const CHANCE_ESTRELA = 0.75

 type Faisca = { c: number; l: number; vida: number; cor: string }

 /** Hash determinístico em [0, 1): o mesmo fundo em toda visita. */
 function ruido(c: number, l: number, semente = 0): number {
   let h = (c * 73856093) ^ (l * 19349663) ^ (semente * 83492791)
   h = Math.imul(h ^ (h >>> 13), 1274126177)
   return ((h ^ (h >>> 16)) >>> 0) / 4294967295
 }

 /** Ruído de valor suave (interpola o hash em blocos de `escala` células). */
 function suave(c: number, l: number, escala: number, semente: number): number {
   const x = c / escala
   const y = l / escala
   const x0 = Math.floor(x)
   const y0 = Math.floor(y)
   const fx = x - x0
   const fy = y - y0
   const u = fx * fx * (3 - 2 * fx)
   const v = fy * fy * (3 - 2 * fy)
   const a = ruido(x0, y0, semente)
   const b = ruido(x0 + 1, y0, semente)
   const cc = ruido(x0, y0 + 1, semente)
   const d = ruido(x0 + 1, y0 + 1, semente)
   return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v
 }

+/**
+ * Estrelas em grade sorteada: cada bloco de BLOCO_ESTRELA células acende, ou não, uma estrela numa
+ * posição sorteada dentro dele, fora da última coluna e da última linha. Ficam espalhadas por igual,
+ * sem aglomerar nem deixar buraco, e duas estrelas nunca caem em células vizinhas.
+ */
+function temEstrela(c: number, l: number): boolean {
+  const bc = Math.floor(c / BLOCO_ESTRELA)
+  const bl = Math.floor(l / BLOCO_ESTRELA)
+  if (ruido(bc, bl, 3) > CHANCE_ESTRELA) return false
+  const vao = BLOCO_ESTRELA - 1
+  return (
+    c === bc * BLOCO_ESTRELA + Math.min(vao - 1, Math.floor(ruido(bc, bl, 9) * vao)) &&
+    l === bl * BLOCO_ESTRELA + Math.min(vao - 1, Math.floor(ruido(bc, bl, 10) * vao))
+  )
+}
+
 const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
 /** Mistura dois tokens em hex numa fração t e devolve hex. */
 function misturar(a: string, b: string, t: number): string {
   return `#${[0, 1, 2]
     .map((i) =>
       Math.round(canal(a, i) + (canal(b, i) - canal(a, i)) * t)
         .toString(16)
         .padStart(2, '0'),
     )
     .join('')}`
 }

 export function Fundo({ ativo }: { ativo: boolean }) {
   const ref = useRef<HTMLCanvasElement>(null)

@@ -76,56 +97,68 @@ export function Fundo({ ativo }: { ativo: boolean }) {
     }

     let dpr = 1
     let colunas = 0
     let linhas = 0
     let base: HTMLCanvasElement | null = null
     let faiscas: Faisca[] = []
     let quadro = 0
     let ultimo = 0

     function desenharBase() {
       if (!base) return
       const b = base.getContext('2d')
       if (!b) return
       const t = CELULA * dpr
+      const altura = (l: number) => l / Math.max(1, linhas - 1)
+      // Em três passadas (céu, estrelas, crista), para nenhuma apagar os picos de uma estrela grande.
       for (let l = 0; l < linhas; l++) {
-        const y = l / Math.max(1, linhas - 1)
+        const y = altura(l)
         // Céu: marinho no alto, petróleo no meio, azul aberto perto da crista.
         const ceu =
           y < 0.5 ? misturar(cores.baixo, cores.fundo, y * 2) : misturar(cores.fundo, cores.ceu, (y - 0.5) * 1.3)
         b.fillStyle = ceu
         b.fillRect(0, l * t, base!.width, t)
         for (let c = 0; c < colunas; c++) {
           // Textura do céu: blocos um tom mais claros, irregulares.
           if (ruido(c >> 1, l >> 1, 1) > 0.58 && ruido(c, l, 2) > 0.3) {
             b.fillStyle = misturar(ceu, cores.alto, 0.5)
             b.fillRect(c * t, l * t, t, t)
           }
-          // Estrelas: raras, mais no alto; as grandes ganham quatro picos.
-          const r = ruido(c, l, 3)
-          if (r > 0.991 - (1 - y) * 0.006) {
-            const grande = r > 0.9985
-            b.fillStyle = r > 0.992 ? cores.estrela : ruido(c, l, 4) > 0.5 ? cores.dourado : cores.azul
-            b.fillRect(c * t, l * t, t, t)
-            if (grande) {
-              b.globalAlpha = 0.3
-              b.fillRect((c - 1) * t, l * t, t * 3, t)
-              b.fillRect(c * t, (l - 1) * t, t, t * 3)
-              b.globalAlpha = 1
-            }
+        }
+      }
+      // Estrelas: brancas na maioria, algumas douradas ou azuis; uma em cada oito ganha quatro picos e
+      // uma em cada três brilha menos. As que caem na crista ficam atrás da poeira.
+      for (let l = 0; l < linhas; l++) {
+        for (let c = 0; c < colunas; c++) {
+          if (!temEstrela(c, l)) continue
+          const brilho = ruido(c, l, 4)
+          const tom = ruido(c, l, 11)
+          b.fillStyle = tom < 0.6 ? cores.estrela : tom < 0.85 ? cores.dourado : cores.azul
+          b.globalAlpha = brilho < 0.33 ? 0.75 : 1
+          b.fillRect(c * t, l * t, t, t)
+          if (brilho > 0.875) {
+            b.globalAlpha = 0.3
+            b.fillRect((c - 1) * t, l * t, t * 3, t)
+            b.fillRect(c * t, (l - 1) * t, t, t * 3)
           }
+          b.globalAlpha = 1
+        }
+      }
+      for (let l = 0; l < linhas; l++) {
+        const y = altura(l)
+        for (let c = 0; c < colunas; c++) {
           // Crista de poeira: ocupa o terço de baixo, com a borda recortada pelo ruído.
           const borda = 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
           if (y > borda) {
             const prof = (y - borda) / Math.max(0.05, 1 - borda)
             const n = suave(c, l, 5, 7)
             let tom: string
             if (prof < 0.12) tom = n > 0.5 ? cores.pessego : cores.acento
             else if (prof < 0.35) tom = n > 0.55 ? cores.acento : cores.brasa
             else if (prof < 0.7) tom = n > 0.6 ? cores.brasa : cores.ferrugem
             else tom = n > 0.7 ? cores.ferrugem : cores.marrom
             // Buracos de gás ionizado em rosa, raros.
             if (ruido(c, l, 8) > 0.993) tom = cores.rosa
             b.fillStyle = tom
             b.fillRect(c * t, l * t, t, t)
           }
</diff>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#2/juiz-comentario-descreve/c3 -->

## 23. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Fração dos blocos com estrela: perto de 3 % do céu aceso, igual do alto até a crista.
</comentario>
<trecho>
17 + const CHANCE_ESTRELA = 0.75
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#2/juiz-comentario-porque/c6 -->

## 24. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Estrelas: brancas na maioria, algumas douradas ou azuis; uma em cada oito ganha quatro picos e
uma em cada três brilha menos. As que caem na crista ficam atrás da poeira.
</comentario>
<trecho>
131 +       for (let l = 0; l < linhas; l++) {
132 +         for (let c = 0; c < colunas; c++) {
133 +           if (!temEstrela(c, l)) continue
134 +           const brilho = ruido(c, l, 4)
135 +           const tom = ruido(c, l, 11)
136 +           b.fillStyle = tom < 0.6 ? cores.estrela : tom < 0.85 ? cores.dourado : cores.azul
137 +           b.globalAlpha = brilho < 0.33 ? 0.75 : 1
138             b.fillRect(c * t, l * t, t, t)
139 +           if (brilho > 0.875) {
140               b.globalAlpha = 0.3
141               b.fillRect((c - 1) * t, l * t, t * 3, t)
142               b.fillRect(c * t, (l - 1) * t, t, t * 3)
143 +           }
144             b.globalAlpha = 1
145           }
146         }
147 +       for (let l = 0; l < linhas; l++) {
148 +         const y = altura(l)
149 +         for (let c = 0; c < colunas; c++) {
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#3/juiz-comentario-porque/c1 -->

## 25. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Fundo: a nebulosa em pixels. Céu marinho em cima, azul aberto no meio, estrelas (algumas com picos)
salpicadas do alto até a crista e, embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego, desenhada por ruído em
blocos. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro e apagam em meio
segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos tokens (G26).
</comentario>
<trecho>
  1   'use client'
  2
  3   import { useEffect, useRef } from 'react'
  4
  5 + // Fundo: a nebulosa em pixels. Céu marinho em cima, azul aberto no meio, estrelas (algumas com picos)
  6 + // salpicadas do alto até a crista e, embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego, desenhada por ruído em
  7   // blocos. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro e apagam em meio
  8   // segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos tokens (G26).
  9
 10   const CELULA = 20
 11   const VIDA_MS = 900
 12   const INTERVALO_MS = 380
 13 + // Estrelas: o céu é dividido em blocos de 5×5 células, e 80% deles ganham uma estrela.
 14 + const BLOCO_ESTRELA = 5
 15 + const CHANCE_ESTRELA = 0.8
 16
 17   type Faisca = { c: number; l: number; vida: number; cor: string }
 18
 19   /** Hash determinístico em [0, 1): o mesmo fundo em toda visita. */
 20   function ruido(c: number, l: number, semente = 0): number {
 21     let h = (c * 73856093) ^ (l * 19349663) ^ (semente * 83492791)
 22     h = Math.imul(h ^ (h >>> 13), 1274126177)
 23     return ((h ^ (h >>> 16)) >>> 0) / 4294967295
 24   }
 25
 26   /** Ruído de valor suave (interpola o hash em blocos de `escala` células). */
 27   function suave(c: number, l: number, escala: number, semente: number): number {
 28     const x = c / escala
 29     const y = l / escala
 30     const x0 = Math.floor(x)
 31     const y0 = Math.floor(y)
 32     const fx = x - x0
 33     const fy = y - y0
 34     const u = fx * fx * (3 - 2 * fx)
 35     const v = fy * fy * (3 - 2 * fy)
 36     const a = ruido(x0, y0, semente)
 37     const b = ruido(x0 + 1, y0, semente)
 38     const cc = ruido(x0, y0 + 1, semente)
 39     const d = ruido(x0 + 1, y0 + 1, semente)
 40     return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v
 41   }
 42
 43   const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
 44   /** Mistura dois tokens em hex numa fração t e devolve hex. */
 45   function misturar(a: string, b: string, t: number): string {
 46     return `#${[0, 1, 2]
 47       .map((i) =>
 48         Math.round(canal(a, i) + (canal(b, i) - canal(a, i)) * t)
 49           .toString(16)
 50           .padStart(2, '0'),
 51       )
 52       .join('')}`
 53   }
 54
 55   export function Fundo({ ativo }: { ativo: boolean }) {
 56     const ref = useRef<HTMLCanvasElement>(null)
 57
 58     useEffect(() => {
 59       const canvas = ref.current
 60       if (!ativo || !canvas) return
 61       const ctx = canvas.getContext('2d')
 62       if (!ctx) return
 63       const estilo = getComputedStyle(document.documentElement)
 64       const cor = (nome: string) => estilo.getPropertyValue(`--color-sinapse-${nome}`).trim()
 65       const cores = {
 66         baixo: cor('fundo-baixo'),
 67         fundo: cor('fundo'),
 68         alto: cor('fundo-alto'),
 69         ceu: cor('ceu'),
 70         azul: cor('azul'),
 71         acento: cor('acento'),
 72         brasa: cor('brasa'),
 73         pessego: cor('pessego'),
 74         dourado: cor('dourado'),
 75         rosa: cor('rosa'),
 76         estrela: cor('estrela'),
 77         ferrugem: cor('ferrugem'),
 78         marrom: cor('marrom'),
 79       }
 80
 81       let dpr = 1
 82       let colunas = 0
 83       let linhas = 0
 84       let base: HTMLCanvasElement | null = null
 85       let faiscas: Faisca[] = []
 86       let quadro = 0
 87       let ultimo = 0
 88
 89       function desenharBase() {
 90         if (!base) return
 91         const b = base.getContext('2d')
 92         if (!b) return
 93         const t = CELULA * dpr
 94 +       const altura = (l: number) => l / Math.max(1, linhas - 1)
 95 +       // Crista de poeira: ocupa o terço de baixo, com a borda recortada pelo ruído.
 96 +       const bordaDaCrista = (c: number) => 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
 97         for (let l = 0; l < linhas; l++) {
 98 +         const y = altura(l)
 99           // Céu: marinho no alto, petróleo no meio, azul aberto perto da crista.
100           const ceu =
101             y < 0.5 ? misturar(cores.baixo, cores.fundo, y * 2) : misturar(cores.fundo, cores.ceu, (y - 0.5) * 1.3)
102           b.fillStyle = ceu
103           b.fillRect(0, l * t, base!.width, t)
104           for (let c = 0; c < colunas; c++) {
105             // Textura do céu: blocos um tom mais claros, irregulares.
106             if (ruido(c >> 1, l >> 1, 1) > 0.58 && ruido(c, l, 2) > 0.3) {
107               b.fillStyle = misturar(ceu, cores.alto, 0.5)
108               b.fillRect(c * t, l * t, t, t)
109             }
110 +         }
111 +       }
112 +       // Estrelas: no máximo uma por bloco, numa célula sorteada dentro dele, para salpicarem o céu
113 +       // inteiro, do alto até a crista, sem aglomerar. Vêm depois do céu para os picos das grandes
114 +       // não serem cobertos pela linha seguinte, e antes da crista, que as esconde.
115 +       for (let bl = 0; bl * BLOCO_ESTRELA < linhas; bl++) {
116 +         for (let bc = 0; bc * BLOCO_ESTRELA < colunas; bc++) {
117 +           if (ruido(bc, bl, 3) >= CHANCE_ESTRELA) continue
118 +           const c = bc * BLOCO_ESTRELA + Math.min(BLOCO_ESTRELA - 1, Math.floor(ruido(bc, bl, 9) * BLOCO_ESTRELA))
119 +           const l = bl * BLOCO_ESTRELA + Math.min(BLOCO_ESTRELA - 1, Math.floor(ruido(bc, bl, 10) * BLOCO_ESTRELA))
120 +           if (c >= colunas || l >= linhas || altura(l) > bordaDaCrista(c)) continue
121 +           const tipo = ruido(bc, bl, 4)
122 +           b.fillStyle = tipo < 0.55 ? cores.estrela : tipo < 0.8 ? cores.dourado : cores.azul
123             b.fillRect(c * t, l * t, t, t)
124 +           // As grandes ganham quatro picos.
125 +           if (ruido(bc, bl, 11) < 0.08) {
126               b.globalAlpha = 0.3
127               b.fillRect((c - 1) * t, l * t, t * 3, t)
128               b.fillRect(c * t, (l - 1) * t, t, t * 3)
129               b.globalAlpha = 1
130             }
131           }
132 +       }
133 +       for (let l = 0; l < linhas; l++) {
134 +         const y = altura(l)
135 +         for (let c = 0; c < colunas; c++) {
136 +           const borda = bordaDaCrista(c)
137             if (y > borda) {
138               const prof = (y - borda) / Math.max(0.05, 1 - borda)
139               const n = suave(c, l, 5, 7)
140               let tom: string
141               if (prof < 0.12) tom = n > 0.5 ? cores.pessego : cores.acento
142               else if (prof < 0.35) tom = n > 0.55 ? cores.acento : cores.brasa
143               else if (prof < 0.7) tom = n > 0.6 ? cores.brasa : cores.ferrugem
144               else tom = n > 0.7 ? cores.ferrugem : cores.marrom
145               // Buracos de gás ionizado em rosa, raros.
146               if (ruido(c, l, 8) > 0.993) tom = cores.rosa
147               b.fillStyle = tom
148               b.fillRect(c * t, l * t, t, t)
149             }
150           }
151         }
152       }
153
154       function medir() {
155         dpr = Math.min(window.devicePixelRatio || 1, 2)
156         canvas!.width = Math.ceil(window.innerWidth * dpr)
157         canvas!.height = Math.ceil(window.innerHeight * dpr)
158         canvas!.style.width = `${window.innerWidth}px`
159         canvas!.style.height = `${window.innerHeight}px`
160         colunas = Math.ceil(window.innerWidth / CELULA)
161         linhas = Math.ceil(window.innerHeight / CELULA)
162         base = document.createElement('canvas')
163         base.width = canvas!.width
164         base.height = canvas!.height
165         desenharBase()
166         desenhar()
167       }
168
169       function desenhar() {
170         if (!base) return
171         ctx!.drawImage(base, 0, 0)
172         const t = CELULA * dpr
173         for (const f of faiscas) {
174           ctx!.globalAlpha = Math.pow(Math.max(0, f.vida), 1.4)
175           ctx!.fillStyle = f.cor
176           ctx!.fillRect(f.c * t, f.l * t, t, t)
177         }
178         ctx!.globalAlpha = 1
179       }
180
181       function tique(agora: number) {
182         const dt = Math.min(64, agora - ultimo)
183         ultimo = agora
184         for (const f of faiscas) f.vida -= dt / VIDA_MS
185         faiscas = faiscas.filter((f) => f.vida > 0)
186         desenhar()
187         quadro = faiscas.length > 0 ? requestAnimationFrame(tique) : 0
188       }
189
190       function acordar() {
191         if (quadro === 0 && !document.hidden) {
192           ultimo = performance.now()
193           quadro = requestAnimationFrame(tique)
194         }
195       }
196
197       function acender(c: number, l: number, cor: string) {
198         if (c < 0 || l < 0 || c >= colunas || l >= linhas) return
199         const existente = faiscas.find((f) => f.c === c && f.l === l)
200         if (existente) existente.vida = 1
201         else faiscas.push({ c, l, vida: 1, cor })
202         acordar()
203       }
204
205       // Sinapses espontâneas: uma célula e, às vezes, uma vizinha, como um sinal que passa.
206       const intervalo = window.setInterval(() => {
207         if (document.hidden) return
208         const c = Math.floor(Math.random() * colunas)
209         const l = Math.floor(Math.random() * linhas)
210         const sorteio = Math.random()
211         acender(c, l, sorteio < 0.5 ? cores.azul : sorteio < 0.8 ? cores.dourado : cores.rosa)
212         if (Math.random() < 0.5) acender(c + (Math.random() < 0.5 ? 1 : -1), l, cores.azul)
213       }, INTERVALO_MS)
214
215       let ultimaCelula = ''
216       const aoMover = (e: PointerEvent) => {
217         if (e.pointerType !== 'mouse') return
218         const c = Math.floor(e.clientX / CELULA)
219         const l = Math.floor(e.clientY / CELULA)
220         const chave = `${c}:${l}`
221         if (chave === ultimaCelula) return
222         ultimaCelula = chave
223         acender(c, l, cores.acento)
224       }
225       const aoVisibilidade = () => {
226         if (document.hidden && quadro) {
227           cancelAnimationFrame(quadro)
228           quadro = 0
229         } else acordar()
230       }
231
232       medir()
233       window.addEventListener('resize', medir)
234       window.addEventListener('pointermove', aoMover, { passive: true })
235       document.addEventListener('visibilitychange', aoVisibilidade)
236       return () => {
237         window.clearInterval(intervalo)
238         window.removeEventListener('resize', medir)
239         window.removeEventListener('pointermove', aoMover)
240         document.removeEventListener('visibilitychange', aoVisibilidade)
241         if (quadro) cancelAnimationFrame(quadro)
242       }
243     }, [ativo])
244
245     if (!ativo) return null
246     return <canvas ref={ref} className="sinapse-fundo" aria-hidden="true" />
247   }
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#3/juiz-comentario-descreve/c2 -->

## 26. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Estrelas: o céu é dividido em blocos de 5×5 células, e 80% deles ganham uma estrela.
</comentario>
<trecho>
14 + const BLOCO_ESTRELA = 5
15 + const CHANCE_ESTRELA = 0.8
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#1/juiz-comentario-porque/c2 -->

## 27. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Estrelas: no máximo uma por bloco de BLOCO_ESTRELA × BLOCO_ESTRELA células, num ponto sorteado dentro dele,
para cobrir o céu inteiro por igual, sem vazios nem aglomerados. O ponto vai até a penúltima célula do bloco,
e duas estrelas vizinhas nunca encostam. Um quinto dos blocos fica vazio, a maioria das estrelas é fraca,
algumas brilham cheias e as grandes ganham quatro picos. Passada própria, depois do céu inteiro, para a linha
de baixo não apagar os picos; a crista, desenhada depois, cobre as que caem nela.
</comentario>
<trecho>
113 +       for (let bl = 0; bl * BLOCO_ESTRELA < linhas; bl++) {
114 +         for (let bc = 0; bc * BLOCO_ESTRELA < colunas; bc++) {
115 +           const r = ruido(bc, bl, 3)
116 +           if (r < 0.2) continue
117 +           const dentro = (semente: number) =>
118 +             Math.min(BLOCO_ESTRELA - 2, Math.floor(ruido(bc, bl, semente) * (BLOCO_ESTRELA - 1)))
119 +           const c = bc * BLOCO_ESTRELA + dentro(9)
120 +           const l = bl * BLOCO_ESTRELA + dentro(10)
121 +           const grande = r > 0.93
122 +           const tom = ruido(bc, bl, 4)
123 +           if (r < 0.62) {
124 +             // Fraca: tom frio e meio apagado, como uma estrela distante.
125 +             b.fillStyle = tom < 0.6 ? cores.poeira : cores.azul
126 +             b.globalAlpha = 0.55
127 +           } else {
128 +             b.fillStyle = grande || tom < 0.55 ? cores.estrela : tom < 0.78 ? cores.dourado : cores.azul
129 +             b.globalAlpha = 1
130 +           }
131             b.fillRect(c * t, l * t, t, t)
132             if (grande) {
133               b.globalAlpha = 0.3
134 +             b.fillRect((c - 1) * t, l * t, t, t)
135 +             b.fillRect((c + 1) * t, l * t, t, t)
136 +             b.fillRect(c * t, (l - 1) * t, t, t)
137 +             b.fillRect(c * t, (l + 1) * t, t, t)
138 +           }
139 +         }
140 +       }
141         b.globalAlpha = 1
142 +       for (let l = 0; l < linhas; l++) {
143 +         const y = l / Math.max(1, linhas - 1)
144 +         for (let c = 0; c < colunas; c++) {
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#2/juiz-comentario-porque/c3 -->

## 28. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Fração dos blocos com estrela: perto de 3 % do céu aceso, igual do alto até a crista.
</comentario>
<trecho>
17 + const CHANCE_ESTRELA = 0.75
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#2/juiz-comentario-descreve/c4 -->

## 29. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Estrelas em grade sorteada: cada bloco de BLOCO_ESTRELA células acende, ou não, uma estrela numa
posição sorteada dentro dele, fora da última coluna e da última linha. Ficam espalhadas por igual,
sem aglomerar nem deixar buraco, e duas estrelas nunca caem em células vizinhas.
</comentario>
<trecho>
50 + function temEstrela(c: number, l: number): boolean {
51 +   const bc = Math.floor(c / BLOCO_ESTRELA)
52 +   const bl = Math.floor(l / BLOCO_ESTRELA)
53 +   if (ruido(bc, bl, 3) > CHANCE_ESTRELA) return false
54 +   const vao = BLOCO_ESTRELA - 1
55 +   return (
56 +     c === bc * BLOCO_ESTRELA + Math.min(vao - 1, Math.floor(ruido(bc, bl, 9) * vao)) &&
57 +     l === bl * BLOCO_ESTRELA + Math.min(vao - 1, Math.floor(ruido(bc, bl, 10) * vao))
58 +   )
59 + }
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#2/juiz-comentario-descreve/c6 -->

## 30. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Estrelas: brancas na maioria, algumas douradas ou azuis; uma em cada oito ganha quatro picos e
uma em cada três brilha menos. As que caem na crista ficam atrás da poeira.
</comentario>
<trecho>
131 +       for (let l = 0; l < linhas; l++) {
132 +         for (let c = 0; c < colunas; c++) {
133 +           if (!temEstrela(c, l)) continue
134 +           const brilho = ruido(c, l, 4)
135 +           const tom = ruido(c, l, 11)
136 +           b.fillStyle = tom < 0.6 ? cores.estrela : tom < 0.85 ? cores.dourado : cores.azul
137 +           b.globalAlpha = brilho < 0.33 ? 0.75 : 1
138             b.fillRect(c * t, l * t, t, t)
139 +           if (brilho > 0.875) {
140               b.globalAlpha = 0.3
141               b.fillRect((c - 1) * t, l * t, t * 3, t)
142               b.fillRect(c * t, (l - 1) * t, t, t * 3)
143 +           }
144             b.globalAlpha = 1
145           }
146         }
147 +       for (let l = 0; l < linhas; l++) {
148 +         const y = altura(l)
149 +         for (let c = 0; c < colunas; c++) {
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#3/juiz-comentario-descreve/c1 -->

## 31. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Fundo: a nebulosa em pixels. Céu marinho em cima, azul aberto no meio, estrelas (algumas com picos)
salpicadas do alto até a crista e, embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego, desenhada por ruído em
blocos. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro e apagam em meio
segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos tokens (G26).
</comentario>
<trecho>
  1   'use client'
  2
  3   import { useEffect, useRef } from 'react'
  4
  5 + // Fundo: a nebulosa em pixels. Céu marinho em cima, azul aberto no meio, estrelas (algumas com picos)
  6 + // salpicadas do alto até a crista e, embaixo, a crista de poeira em ferrugem, brasa, laranja e pêssego, desenhada por ruído em
  7   // blocos. Por cima, sinapses: células acendem sozinhas e no rastro do ponteiro e apagam em meio
  8   // segundo. Canvas 2D, sem laço quando não há faísca. As cores vêm dos tokens (G26).
  9
 10   const CELULA = 20
 11   const VIDA_MS = 900
 12   const INTERVALO_MS = 380
 13 + // Estrelas: o céu é dividido em blocos de 5×5 células, e 80% deles ganham uma estrela.
 14 + const BLOCO_ESTRELA = 5
 15 + const CHANCE_ESTRELA = 0.8
 16
 17   type Faisca = { c: number; l: number; vida: number; cor: string }
 18
 19   /** Hash determinístico em [0, 1): o mesmo fundo em toda visita. */
 20   function ruido(c: number, l: number, semente = 0): number {
 21     let h = (c * 73856093) ^ (l * 19349663) ^ (semente * 83492791)
 22     h = Math.imul(h ^ (h >>> 13), 1274126177)
 23     return ((h ^ (h >>> 16)) >>> 0) / 4294967295
 24   }
 25
 26   /** Ruído de valor suave (interpola o hash em blocos de `escala` células). */
 27   function suave(c: number, l: number, escala: number, semente: number): number {
 28     const x = c / escala
 29     const y = l / escala
 30     const x0 = Math.floor(x)
 31     const y0 = Math.floor(y)
 32     const fx = x - x0
 33     const fy = y - y0
 34     const u = fx * fx * (3 - 2 * fx)
 35     const v = fy * fy * (3 - 2 * fy)
 36     const a = ruido(x0, y0, semente)
 37     const b = ruido(x0 + 1, y0, semente)
 38     const cc = ruido(x0, y0 + 1, semente)
 39     const d = ruido(x0 + 1, y0 + 1, semente)
 40     return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v
 41   }
 42
 43   const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
 44   /** Mistura dois tokens em hex numa fração t e devolve hex. */
 45   function misturar(a: string, b: string, t: number): string {
 46     return `#${[0, 1, 2]
 47       .map((i) =>
 48         Math.round(canal(a, i) + (canal(b, i) - canal(a, i)) * t)
 49           .toString(16)
 50           .padStart(2, '0'),
 51       )
 52       .join('')}`
 53   }
 54
 55   export function Fundo({ ativo }: { ativo: boolean }) {
 56     const ref = useRef<HTMLCanvasElement>(null)
 57
 58     useEffect(() => {
 59       const canvas = ref.current
 60       if (!ativo || !canvas) return
 61       const ctx = canvas.getContext('2d')
 62       if (!ctx) return
 63       const estilo = getComputedStyle(document.documentElement)
 64       const cor = (nome: string) => estilo.getPropertyValue(`--color-sinapse-${nome}`).trim()
 65       const cores = {
 66         baixo: cor('fundo-baixo'),
 67         fundo: cor('fundo'),
 68         alto: cor('fundo-alto'),
 69         ceu: cor('ceu'),
 70         azul: cor('azul'),
 71         acento: cor('acento'),
 72         brasa: cor('brasa'),
 73         pessego: cor('pessego'),
 74         dourado: cor('dourado'),
 75         rosa: cor('rosa'),
 76         estrela: cor('estrela'),
 77         ferrugem: cor('ferrugem'),
 78         marrom: cor('marrom'),
 79       }
 80
 81       let dpr = 1
 82       let colunas = 0
 83       let linhas = 0
 84       let base: HTMLCanvasElement | null = null
 85       let faiscas: Faisca[] = []
 86       let quadro = 0
 87       let ultimo = 0
 88
 89       function desenharBase() {
 90         if (!base) return
 91         const b = base.getContext('2d')
 92         if (!b) return
 93         const t = CELULA * dpr
 94 +       const altura = (l: number) => l / Math.max(1, linhas - 1)
 95 +       // Crista de poeira: ocupa o terço de baixo, com a borda recortada pelo ruído.
 96 +       const bordaDaCrista = (c: number) => 0.7 + suave(c, 0, 9, 5) * 0.14 + suave(c, 0, 3, 6) * 0.05
 97         for (let l = 0; l < linhas; l++) {
 98 +         const y = altura(l)
 99           // Céu: marinho no alto, petróleo no meio, azul aberto perto da crista.
100           const ceu =
101             y < 0.5 ? misturar(cores.baixo, cores.fundo, y * 2) : misturar(cores.fundo, cores.ceu, (y - 0.5) * 1.3)
102           b.fillStyle = ceu
103           b.fillRect(0, l * t, base!.width, t)
104           for (let c = 0; c < colunas; c++) {
105             // Textura do céu: blocos um tom mais claros, irregulares.
106             if (ruido(c >> 1, l >> 1, 1) > 0.58 && ruido(c, l, 2) > 0.3) {
107               b.fillStyle = misturar(ceu, cores.alto, 0.5)
108               b.fillRect(c * t, l * t, t, t)
109             }
110 +         }
111 +       }
112 +       // Estrelas: no máximo uma por bloco, numa célula sorteada dentro dele, para salpicarem o céu
113 +       // inteiro, do alto até a crista, sem aglomerar. Vêm depois do céu para os picos das grandes
114 +       // não serem cobertos pela linha seguinte, e antes da crista, que as esconde.
115 +       for (let bl = 0; bl * BLOCO_ESTRELA < linhas; bl++) {
116 +         for (let bc = 0; bc * BLOCO_ESTRELA < colunas; bc++) {
117 +           if (ruido(bc, bl, 3) >= CHANCE_ESTRELA) continue
118 +           const c = bc * BLOCO_ESTRELA + Math.min(BLOCO_ESTRELA - 1, Math.floor(ruido(bc, bl, 9) * BLOCO_ESTRELA))
119 +           const l = bl * BLOCO_ESTRELA + Math.min(BLOCO_ESTRELA - 1, Math.floor(ruido(bc, bl, 10) * BLOCO_ESTRELA))
120 +           if (c >= colunas || l >= linhas || altura(l) > bordaDaCrista(c)) continue
121 +           const tipo = ruido(bc, bl, 4)
122 +           b.fillStyle = tipo < 0.55 ? cores.estrela : tipo < 0.8 ? cores.dourado : cores.azul
123             b.fillRect(c * t, l * t, t, t)
124 +           // As grandes ganham quatro picos.
125 +           if (ruido(bc, bl, 11) < 0.08) {
126               b.globalAlpha = 0.3
127               b.fillRect((c - 1) * t, l * t, t * 3, t)
128               b.fillRect(c * t, (l - 1) * t, t, t * 3)
129               b.globalAlpha = 1
130             }
131           }
132 +       }
133 +       for (let l = 0; l < linhas; l++) {
134 +         const y = altura(l)
135 +         for (let c = 0; c < colunas; c++) {
136 +           const borda = bordaDaCrista(c)
137             if (y > borda) {
138               const prof = (y - borda) / Math.max(0.05, 1 - borda)
139               const n = suave(c, l, 5, 7)
140               let tom: string
141               if (prof < 0.12) tom = n > 0.5 ? cores.pessego : cores.acento
142               else if (prof < 0.35) tom = n > 0.55 ? cores.acento : cores.brasa
143               else if (prof < 0.7) tom = n > 0.6 ? cores.brasa : cores.ferrugem
144               else tom = n > 0.7 ? cores.ferrugem : cores.marrom
145               // Buracos de gás ionizado em rosa, raros.
146               if (ruido(c, l, 8) > 0.993) tom = cores.rosa
147               b.fillStyle = tom
148               b.fillRect(c * t, l * t, t, t)
149             }
150           }
151         }
152       }
153
154       function medir() {
155         dpr = Math.min(window.devicePixelRatio || 1, 2)
156         canvas!.width = Math.ceil(window.innerWidth * dpr)
157         canvas!.height = Math.ceil(window.innerHeight * dpr)
158         canvas!.style.width = `${window.innerWidth}px`
159         canvas!.style.height = `${window.innerHeight}px`
160         colunas = Math.ceil(window.innerWidth / CELULA)
161         linhas = Math.ceil(window.innerHeight / CELULA)
162         base = document.createElement('canvas')
163         base.width = canvas!.width
164         base.height = canvas!.height
165         desenharBase()
166         desenhar()
167       }
168
169       function desenhar() {
170         if (!base) return
171         ctx!.drawImage(base, 0, 0)
172         const t = CELULA * dpr
173         for (const f of faiscas) {
174           ctx!.globalAlpha = Math.pow(Math.max(0, f.vida), 1.4)
175           ctx!.fillStyle = f.cor
176           ctx!.fillRect(f.c * t, f.l * t, t, t)
177         }
178         ctx!.globalAlpha = 1
179       }
180
181       function tique(agora: number) {
182         const dt = Math.min(64, agora - ultimo)
183         ultimo = agora
184         for (const f of faiscas) f.vida -= dt / VIDA_MS
185         faiscas = faiscas.filter((f) => f.vida > 0)
186         desenhar()
187         quadro = faiscas.length > 0 ? requestAnimationFrame(tique) : 0
188       }
189
190       function acordar() {
191         if (quadro === 0 && !document.hidden) {
192           ultimo = performance.now()
193           quadro = requestAnimationFrame(tique)
194         }
195       }
196
197       function acender(c: number, l: number, cor: string) {
198         if (c < 0 || l < 0 || c >= colunas || l >= linhas) return
199         const existente = faiscas.find((f) => f.c === c && f.l === l)
200         if (existente) existente.vida = 1
201         else faiscas.push({ c, l, vida: 1, cor })
202         acordar()
203       }
204
205       // Sinapses espontâneas: uma célula e, às vezes, uma vizinha, como um sinal que passa.
206       const intervalo = window.setInterval(() => {
207         if (document.hidden) return
208         const c = Math.floor(Math.random() * colunas)
209         const l = Math.floor(Math.random() * linhas)
210         const sorteio = Math.random()
211         acender(c, l, sorteio < 0.5 ? cores.azul : sorteio < 0.8 ? cores.dourado : cores.rosa)
212         if (Math.random() < 0.5) acender(c + (Math.random() < 0.5 ? 1 : -1), l, cores.azul)
213       }, INTERVALO_MS)
214
215       let ultimaCelula = ''
216       const aoMover = (e: PointerEvent) => {
217         if (e.pointerType !== 'mouse') return
218         const c = Math.floor(e.clientX / CELULA)
219         const l = Math.floor(e.clientY / CELULA)
220         const chave = `${c}:${l}`
221         if (chave === ultimaCelula) return
222         ultimaCelula = chave
223         acender(c, l, cores.acento)
224       }
225       const aoVisibilidade = () => {
226         if (document.hidden && quadro) {
227           cancelAnimationFrame(quadro)
228           quadro = 0
229         } else acordar()
230       }
231
232       medir()
233       window.addEventListener('resize', medir)
234       window.addEventListener('pointermove', aoMover, { passive: true })
235       document.addEventListener('visibilitychange', aoVisibilidade)
236       return () => {
237         window.clearInterval(intervalo)
238         window.removeEventListener('resize', medir)
239         window.removeEventListener('pointermove', aoMover)
240         document.removeEventListener('visibilitychange', aoVisibilidade)
241         if (quadro) cancelAnimationFrame(quadro)
242       }
243     }, [ativo])
244
245     if (!ativo) return null
246     return <canvas ref={ref} className="sinapse-fundo" aria-hidden="true" />
247   }
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#1/juiz-comentario-descreve/c2 -->

## 32. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Estrelas: no máximo uma por bloco de BLOCO_ESTRELA × BLOCO_ESTRELA células, num ponto sorteado dentro dele,
para cobrir o céu inteiro por igual, sem vazios nem aglomerados. O ponto vai até a penúltima célula do bloco,
e duas estrelas vizinhas nunca encostam. Um quinto dos blocos fica vazio, a maioria das estrelas é fraca,
algumas brilham cheias e as grandes ganham quatro picos. Passada própria, depois do céu inteiro, para a linha
de baixo não apagar os picos; a crista, desenhada depois, cobre as que caem nela.
</comentario>
<trecho>
113 +       for (let bl = 0; bl * BLOCO_ESTRELA < linhas; bl++) {
114 +         for (let bc = 0; bc * BLOCO_ESTRELA < colunas; bc++) {
115 +           const r = ruido(bc, bl, 3)
116 +           if (r < 0.2) continue
117 +           const dentro = (semente: number) =>
118 +             Math.min(BLOCO_ESTRELA - 2, Math.floor(ruido(bc, bl, semente) * (BLOCO_ESTRELA - 1)))
119 +           const c = bc * BLOCO_ESTRELA + dentro(9)
120 +           const l = bl * BLOCO_ESTRELA + dentro(10)
121 +           const grande = r > 0.93
122 +           const tom = ruido(bc, bl, 4)
123 +           if (r < 0.62) {
124 +             // Fraca: tom frio e meio apagado, como uma estrela distante.
125 +             b.fillStyle = tom < 0.6 ? cores.poeira : cores.azul
126 +             b.globalAlpha = 0.55
127 +           } else {
128 +             b.fillStyle = grande || tom < 0.55 ? cores.estrela : tom < 0.78 ? cores.dourado : cores.azul
129 +             b.globalAlpha = 1
130 +           }
131             b.fillRect(c * t, l * t, t, t)
132             if (grande) {
133               b.globalAlpha = 0.3
134 +             b.fillRect((c - 1) * t, l * t, t, t)
135 +             b.fillRect((c + 1) * t, l * t, t, t)
136 +             b.fillRect(c * t, (l - 1) * t, t, t)
137 +             b.fillRect(c * t, (l + 1) * t, t, t)
138 +           }
139 +         }
140 +       }
141         b.globalAlpha = 1
142 +       for (let l = 0; l < linhas; l++) {
143 +         const y = l / Math.max(1, linhas - 1)
144 +         for (let c = 0; c < colunas; c++) {
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#3/juiz-comentario-porque/c4 -->

## 33. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
As grandes ganham quatro picos.
</comentario>
<trecho>
125 +           if (ruido(bc, bl, 11) < 0.08) {
126               b.globalAlpha = 0.3
127               b.fillRect((c - 1) * t, l * t, t * 3, t)
128               b.fillRect(c * t, (l - 1) * t, t, t * 3)
129               b.globalAlpha = 1
130             }
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-01-estrelas#2/juiz-comentario-descreve/c5 -->

## 34. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Fundo.tsx</arquivo>
<comentario>
Em três passadas (céu, estrelas, crista), para nenhuma apagar os picos de uma estrela grande.
</comentario>
<trecho>
114         for (let l = 0; l < linhas; l++) {
115 +         const y = altura(l)
116           // Céu: marinho no alto, petróleo no meio, azul aberto perto da crista.
117           const ceu =
118             y < 0.5 ? misturar(cores.baixo, cores.fundo, y * 2) : misturar(cores.fundo, cores.ceu, (y - 0.5) * 1.3)
119           b.fillStyle = ceu
120           b.fillRect(0, l * t, base!.width, t)
121           for (let c = 0; c < colunas; c++) {
122             // Textura do céu: blocos um tom mais claros, irregulares.
123             if (ruido(c >> 1, l >> 1, 1) > 0.58 && ruido(c, l, 2) > 0.3) {
124               b.fillStyle = misturar(ceu, cores.alto, 0.5)
125               b.fillRect(c * t, l * t, t, t)
126             }
127 +         }
128 +       }
</trecho>
```

**Rótulo:** ?
