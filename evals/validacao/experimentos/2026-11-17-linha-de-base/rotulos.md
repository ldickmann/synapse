# Rótulos do juiz

<!-- fontes: 2026-11-17-linha-de-base, 2026-11-17-sem-modelo -->

Para cada item, leia a rubrica em `evals/rubricas/<rubrica>.md` e troque o `?` de **Rótulo** por `PASS` ou `FAIL`. O veredito do juiz não aparece aqui de propósito.

<!-- item: comentarios-v1-onda@quebrada/juiz-comentario-antigo/a1 -->

## 1. juiz-comentario-antigo

O comentário, que a tentativa não mudou, continua verdadeiro para o trecho de depois?

```text
<arquivo>componentes/Rede.tsx</arquivo>
<comentario>
A frente da onda em x, da primeira camada até depois da última.
</comentario>
<antes>
204         const frente = CAMADAS[0].x + fase * (CAMADAS[CAMADAS.length - 1].x - CAMADAS[0].x + 0.08)
205         const nomeFonte = `${fonte}`
</antes>
<depois>
204 +       const frente = CAMADAS[0].x + fase * (CAMADAS[CAMADAS.length - 1].x - CAMADAS[0].x)
205         const nomeFonte = `${fonte}`
</depois>
```

**Rótulo:** ?

<!-- item: comentarios-v1-onda#2/pedido-cumprido/p1 -->

## 2. pedido-cumprido

O diff cumpre o critério do caso?

```text
<pedido>
A onda da rede passa do ponto; faça ela parar na última camada.
</pedido>
<criterio>
PASS se, depois da tentativa, o maior valor que `frente` alcança é o x da última camada (CAMADAS[CAMADAS.length - 1].x), sem passar dele, e o período (PERIODO_MS, 2,6 s) e a duração da onda (DURACAO_ONDA_MS, 1,5 s) continuam iguais. No base, `frente` vai até o x da última camada mais 0.08. FAIL se a frente ainda passa da última camada, se para antes dela ou se o período ou a duração mudam.
</criterio>
<diff>
diff --git a/componentes/Rede.tsx b/componentes/Rede.tsx
index b3cd7e9..6d7803d 100644
--- a/componentes/Rede.tsx
+++ b/componentes/Rede.tsx
@@ -188,32 +188,33 @@ export function Rede({ destaque, ativo }: { destaque: Servico | null; ativo: boo
             b.stroke()
           }
         }
       }
       desenhar(performance.now())
     }

     function desenhar(agora: number) {
       if (!base) return
       ctx!.setTransform(1, 0, 0, 1, 0, 0)
       ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
       ctx!.drawImage(base, 0, 0)
       ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
       const p = posicoes()
       const fase = Math.min(1, (agora - inicioOnda) / DURACAO_ONDA_MS)
-      // A frente da onda em x, da primeira camada até depois da última.
-      const frente = CAMADAS[0].x + fase * (CAMADAS[CAMADAS.length - 1].x - CAMADAS[0].x + 0.08)
+      // A frente da onda em x, da primeira camada até a última, e para nela. A interpolação em
+      // duas parcelas dá a última camada exata no fim, para `chegou` valer sem erro de arredondamento.
+      const frente = CAMADAS[0].x * (1 - fase) + CAMADAS[CAMADAS.length - 1].x * fase
       const nomeFonte = `${fonte}`

       // Grade de entrada: o glifo lido, em pixels; os pixels acesos piscam quando a onda começa.
       const g = GLIFOS[glifo]
       const lado = Math.min(largura * 0.14, altura * 0.6) / GRADE
       const gx = largura * 0.05
       const gy = altura / 2 - (lado * GRADE) / 2
       for (let l = 0; l < GRADE; l++) {
         for (let c = 0; c < GRADE; c++) {
           const aceso = g[l][c] === '#'
           ctx!.fillStyle = aceso ? (fase < 0.2 ? cores.dourado : cores.azul) : comAlfa(cores.linha, 0.35)
           ctx!.fillRect(gx + c * lado, gy + l * lado, lado - 1, lado - 1)
         }
       }
       // Da grade para as entradas: as linhas dos pixels acesos.
</diff>
```

**Rótulo:** ?

<!-- item: comentarios-v1-onda#2/juiz-comentario-descreve/c1 -->

## 3. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Rede.tsx</arquivo>
<comentario>
A frente da onda em x, da primeira camada até a última, e para nela. A interpolação em
duas parcelas dá a última camada exata no fim, para `chegou` valer sem erro de arredondamento.
</comentario>
<trecho>
205 +       const frente = CAMADAS[0].x * (1 - fase) + CAMADAS[CAMADAS.length - 1].x * fase
206         const nomeFonte = `${fonte}`
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-v1-onda#1/juiz-comentario-porque/c1 -->

## 4. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Rede.tsx</arquivo>
<comentario>
A frente da onda em x, da primeira camada até a última, onde para: as saídas ficam acesas
até a próxima onda. Nesta forma, fase 1 dá a posição exata da última camada.
</comentario>
<trecho>
205 +       const primeira = CAMADAS[0].x
206 +       const ultima = CAMADAS[CAMADAS.length - 1].x
207 +       const frente = primeira * (1 - fase) + ultima * fase
208         const nomeFonte = `${fonte}`
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-v1-onda#2/juiz-comentario-porque/c1 -->

## 5. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Rede.tsx</arquivo>
<comentario>
A frente da onda em x, da primeira camada até a última, e para nela. A interpolação em
duas parcelas dá a última camada exata no fim, para `chegou` valer sem erro de arredondamento.
</comentario>
<trecho>
205 +       const frente = CAMADAS[0].x * (1 - fase) + CAMADAS[CAMADAS.length - 1].x * fase
206         const nomeFonte = `${fonte}`
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-v1-onda#1/pedido-cumprido/p1 -->

## 6. pedido-cumprido

O diff cumpre o critério do caso?

```text
<pedido>
A onda da rede passa do ponto; faça ela parar na última camada.
</pedido>
<criterio>
PASS se, depois da tentativa, o maior valor que `frente` alcança é o x da última camada (CAMADAS[CAMADAS.length - 1].x), sem passar dele, e o período (PERIODO_MS, 2,6 s) e a duração da onda (DURACAO_ONDA_MS, 1,5 s) continuam iguais. No base, `frente` vai até o x da última camada mais 0.08. FAIL se a frente ainda passa da última camada, se para antes dela ou se o período ou a duração mudam.
</criterio>
<diff>
diff --git a/componentes/Rede.tsx b/componentes/Rede.tsx
index b3cd7e9..43435fa 100644
--- a/componentes/Rede.tsx
+++ b/componentes/Rede.tsx
@@ -188,32 +188,35 @@ export function Rede({ destaque, ativo }: { destaque: Servico | null; ativo: boo
             b.stroke()
           }
         }
       }
       desenhar(performance.now())
     }

     function desenhar(agora: number) {
       if (!base) return
       ctx!.setTransform(1, 0, 0, 1, 0, 0)
       ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
       ctx!.drawImage(base, 0, 0)
       ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
       const p = posicoes()
       const fase = Math.min(1, (agora - inicioOnda) / DURACAO_ONDA_MS)
-      // A frente da onda em x, da primeira camada até depois da última.
-      const frente = CAMADAS[0].x + fase * (CAMADAS[CAMADAS.length - 1].x - CAMADAS[0].x + 0.08)
+      // A frente da onda em x, da primeira camada até a última, onde para: as saídas ficam acesas
+      // até a próxima onda. Nesta forma, fase 1 dá a posição exata da última camada.
+      const primeira = CAMADAS[0].x
+      const ultima = CAMADAS[CAMADAS.length - 1].x
+      const frente = primeira * (1 - fase) + ultima * fase
       const nomeFonte = `${fonte}`

       // Grade de entrada: o glifo lido, em pixels; os pixels acesos piscam quando a onda começa.
       const g = GLIFOS[glifo]
       const lado = Math.min(largura * 0.14, altura * 0.6) / GRADE
       const gx = largura * 0.05
       const gy = altura / 2 - (lado * GRADE) / 2
       for (let l = 0; l < GRADE; l++) {
         for (let c = 0; c < GRADE; c++) {
           const aceso = g[l][c] === '#'
           ctx!.fillStyle = aceso ? (fase < 0.2 ? cores.dourado : cores.azul) : comAlfa(cores.linha, 0.35)
           ctx!.fillRect(gx + c * lado, gy + l * lado, lado - 1, lado - 1)
         }
       }
       // Da grade para as entradas: as linhas dos pixels acesos.
@@ -271,31 +274,31 @@ export function Rede({ destaque, ativo }: { destaque: Servico | null; ativo: boo
           const ativoNo = hash(i, glifo, 40 + k) > 0.35
           let tom = cores.poeira
           if (ehSaida) tom = coresSaida[i]
           else if (brilho > 0 && ativoNo) tom = cores.acento
           ctx!.fillStyle = tom
           if (brilho > 0 && (ativoNo || ehSaida)) {
             ctx!.shadowColor = ehSaida ? coresSaida[i] : cores.acento
             ctx!.shadowBlur = 14 * brilho
           }
           ctx!.fillRect(p[k][i].x - tamanho / 2, p[k][i].y - tamanho / 2, tamanho, tamanho)
           ctx!.shadowBlur = 0
         }
       }

       // Valores das saídas: aproximam-se do alvo quando a onda chega; a vencedora ganha a caixa.
-      const chegou = frente >= CAMADAS[CAMADAS.length - 1].x
+      const chegou = frente >= ultima
       valores = valores.map((v, i) => {
         const alvo = chegou ? alvos[i] : v + (Math.random() - 0.5) * 0.08
         return v + (Math.min(1, Math.max(0, alvo)) - v) * (chegou ? 0.12 : 0.3)
       })
       ctx!.textBaseline = 'middle'
       for (let i = 0; i < SAIDAS; i++) {
         const { x, y } = p[CAMADAS.length - 1][i]
         const nome = SERVICOS[i].nome.split(' ')[0]
         const valor = valores[i].toFixed(3)
         const ganhou = chegou && i === vencedora
         ctx!.font = `700 ${Math.max(11, largura * 0.011)}px ${nomeFonte}`
         const lw = ctx!.measureText(nome).width
         if (ganhou) {
           ctx!.fillStyle = cores.dourado
           ctx!.fillRect(x + 16, y - 12, lw + 16, 24)
</diff>
```

**Rótulo:** ?

<!-- item: comentarios-v2-frase@quebrada/juiz-comentario-descreve/c1 -->

## 7. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>lib/texto.ts</arquivo>
<comentario>
Segunda linha do hero, logo abaixo do h1.
</comentario>
<trecho>
13   export const APOIO =
14 +   'Site novo, sistema sob medida ou manutenção do seu site. Atendo em Navegantes e região, e à distância em todo o Brasil.'
15   export const BOTAO_WHATSAPP = 'Chamar no WhatsApp'
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-v1-onda#3/juiz-comentario-porque/c1 -->

## 8. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>componentes/Rede.tsx</arquivo>
<comentario>
A frente da onda em x, da primeira camada até a última, onde para. A interpolação
dá exatamente o x da saída com a fase em 1, para que `chegou` seja verdadeiro no fim.
</comentario>
<trecho>
205 +       const frente = (1 - fase) * CAMADAS[0].x + fase * CAMADAS[CAMADAS.length - 1].x
206         const nomeFonte = `${fonte}`
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-v1-onda#1/juiz-comentario-descreve/c1 -->

## 9. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Rede.tsx</arquivo>
<comentario>
A frente da onda em x, da primeira camada até a última, onde para: as saídas ficam acesas
até a próxima onda. Nesta forma, fase 1 dá a posição exata da última camada.
</comentario>
<trecho>
205 +       const primeira = CAMADAS[0].x
206 +       const ultima = CAMADAS[CAMADAS.length - 1].x
207 +       const frente = primeira * (1 - fase) + ultima * fase
208         const nomeFonte = `${fonte}`
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-v2-frase@quebrada/juiz-comentario-porque/c1 -->

## 10. juiz-comentario-porque

O comentário diz algo que o código não diz sozinho (razão, regra, armadilha, resumo)?

```text
<arquivo>lib/texto.ts</arquivo>
<comentario>
Segunda linha do hero, logo abaixo do h1.
</comentario>
<trecho>
13   export const APOIO =
14 +   'Site novo, sistema sob medida ou manutenção do seu site. Atendo em Navegantes e região, e à distância em todo o Brasil.'
15   export const BOTAO_WHATSAPP = 'Chamar no WhatsApp'
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-v1-onda#1/juiz-comentario-antigo/a1 -->

## 11. juiz-comentario-antigo

O comentário, que a tentativa não mudou, continua verdadeiro para o trecho de depois?

```text
<arquivo>componentes/Rede.tsx</arquivo>
<comentario>
Valores das saídas: aproximam-se do alvo quando a onda chega; a vencedora ganha a caixa.
</comentario>
<antes>
286         const chegou = frente >= CAMADAS[CAMADAS.length - 1].x
287         valores = valores.map((v, i) => {
288           const alvo = chegou ? alvos[i] : v + (Math.random() - 0.5) * 0.08
289           return v + (Math.min(1, Math.max(0, alvo)) - v) * (chegou ? 0.12 : 0.3)
290         })
291         ctx!.textBaseline = 'middle'
292         for (let i = 0; i < SAIDAS; i++) {
293           const { x, y } = p[CAMADAS.length - 1][i]
294           const nome = SERVICOS[i].nome.split(' ')[0]
295           const valor = valores[i].toFixed(3)
296           const ganhou = chegou && i === vencedora
297           ctx!.font = `700 ${Math.max(11, largura * 0.011)}px ${nomeFonte}`
298           const lw = ctx!.measureText(nome).width
299           if (ganhou) {
300             ctx!.fillStyle = cores.dourado
301             ctx!.fillRect(x + 16, y - 12, lw + 16, 24)
302             ctx!.fillStyle = cores.baixo
303           } else ctx!.fillStyle = cores.texto
304           ctx!.fillText(nome, x + 24, y)
305           ctx!.font = `500 ${Math.max(10, largura * 0.0095)}px ${nomeFonte}`
306           ctx!.fillStyle = ganhou ? cores.dourado : cores.suave
307           ctx!.fillText(valor, x + 24 + lw + 26, y)
308         }
</antes>
<depois>
289 +       const chegou = frente >= ultima
290         valores = valores.map((v, i) => {
291           const alvo = chegou ? alvos[i] : v + (Math.random() - 0.5) * 0.08
292           return v + (Math.min(1, Math.max(0, alvo)) - v) * (chegou ? 0.12 : 0.3)
293         })
294         ctx!.textBaseline = 'middle'
295         for (let i = 0; i < SAIDAS; i++) {
296           const { x, y } = p[CAMADAS.length - 1][i]
297           const nome = SERVICOS[i].nome.split(' ')[0]
298           const valor = valores[i].toFixed(3)
299           const ganhou = chegou && i === vencedora
300           ctx!.font = `700 ${Math.max(11, largura * 0.011)}px ${nomeFonte}`
301           const lw = ctx!.measureText(nome).width
302           if (ganhou) {
303             ctx!.fillStyle = cores.dourado
304             ctx!.fillRect(x + 16, y - 12, lw + 16, 24)
305             ctx!.fillStyle = cores.baixo
306           } else ctx!.fillStyle = cores.texto
307           ctx!.fillText(nome, x + 24, y)
308           ctx!.font = `500 ${Math.max(10, largura * 0.0095)}px ${nomeFonte}`
309           ctx!.fillStyle = ganhou ? cores.dourado : cores.suave
310           ctx!.fillText(valor, x + 24 + lw + 26, y)
311         }
</depois>
```

**Rótulo:** ?

<!-- item: comentarios-v1-onda#3/juiz-comentario-descreve/c1 -->

## 12. juiz-comentario-descreve

Tudo o que o comentário afirma vale para o trecho, e ele fala desse código?

```text
<arquivo>componentes/Rede.tsx</arquivo>
<comentario>
A frente da onda em x, da primeira camada até a última, onde para. A interpolação
dá exatamente o x da saída com a fase em 1, para que `chegou` seja verdadeiro no fim.
</comentario>
<trecho>
205 +       const frente = (1 - fase) * CAMADAS[0].x + fase * CAMADAS[CAMADAS.length - 1].x
206         const nomeFonte = `${fonte}`
</trecho>
```

**Rótulo:** ?

<!-- item: comentarios-v1-onda@quebrada/pedido-cumprido/p1 -->

## 13. pedido-cumprido

O diff cumpre o critério do caso?

```text
<pedido>
A onda da rede passa do ponto; faça ela parar na última camada.
</pedido>
<criterio>
PASS se, depois da tentativa, o maior valor que `frente` alcança é o x da última camada (CAMADAS[CAMADAS.length - 1].x), sem passar dele, e o período (PERIODO_MS, 2,6 s) e a duração da onda (DURACAO_ONDA_MS, 1,5 s) continuam iguais. No base, `frente` vai até o x da última camada mais 0.08. FAIL se a frente ainda passa da última camada, se para antes dela ou se o período ou a duração mudam.
</criterio>
<diff>
diff --git a/componentes/Rede.tsx b/componentes/Rede.tsx
index b3cd7e9..a849abd 100644
--- a/componentes/Rede.tsx
+++ b/componentes/Rede.tsx
@@ -189,31 +189,31 @@ export function Rede({ destaque, ativo }: { destaque: Servico | null; ativo: boo
           }
         }
       }
       desenhar(performance.now())
     }

     function desenhar(agora: number) {
       if (!base) return
       ctx!.setTransform(1, 0, 0, 1, 0, 0)
       ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
       ctx!.drawImage(base, 0, 0)
       ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
       const p = posicoes()
       const fase = Math.min(1, (agora - inicioOnda) / DURACAO_ONDA_MS)
       // A frente da onda em x, da primeira camada até depois da última.
-      const frente = CAMADAS[0].x + fase * (CAMADAS[CAMADAS.length - 1].x - CAMADAS[0].x + 0.08)
+      const frente = CAMADAS[0].x + fase * (CAMADAS[CAMADAS.length - 1].x - CAMADAS[0].x)
       const nomeFonte = `${fonte}`

       // Grade de entrada: o glifo lido, em pixels; os pixels acesos piscam quando a onda começa.
       const g = GLIFOS[glifo]
       const lado = Math.min(largura * 0.14, altura * 0.6) / GRADE
       const gx = largura * 0.05
       const gy = altura / 2 - (lado * GRADE) / 2
       for (let l = 0; l < GRADE; l++) {
         for (let c = 0; c < GRADE; c++) {
           const aceso = g[l][c] === '#'
           ctx!.fillStyle = aceso ? (fase < 0.2 ? cores.dourado : cores.azul) : comAlfa(cores.linha, 0.35)
           ctx!.fillRect(gx + c * lado, gy + l * lado, lado - 1, lado - 1)
         }
       }
       // Da grade para as entradas: as linhas dos pixels acesos.
</diff>
```

**Rótulo:** ?

<!-- item: comentarios-v1-onda#3/pedido-cumprido/p1 -->

## 14. pedido-cumprido

O diff cumpre o critério do caso?

```text
<pedido>
A onda da rede passa do ponto; faça ela parar na última camada.
</pedido>
<criterio>
PASS se, depois da tentativa, o maior valor que `frente` alcança é o x da última camada (CAMADAS[CAMADAS.length - 1].x), sem passar dele, e o período (PERIODO_MS, 2,6 s) e a duração da onda (DURACAO_ONDA_MS, 1,5 s) continuam iguais. No base, `frente` vai até o x da última camada mais 0.08. FAIL se a frente ainda passa da última camada, se para antes dela ou se o período ou a duração mudam.
</criterio>
<diff>
diff --git a/componentes/Rede.tsx b/componentes/Rede.tsx
index b3cd7e9..ac2f7c7 100644
--- a/componentes/Rede.tsx
+++ b/componentes/Rede.tsx
@@ -188,32 +188,33 @@ export function Rede({ destaque, ativo }: { destaque: Servico | null; ativo: boo
             b.stroke()
           }
         }
       }
       desenhar(performance.now())
     }

     function desenhar(agora: number) {
       if (!base) return
       ctx!.setTransform(1, 0, 0, 1, 0, 0)
       ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
       ctx!.drawImage(base, 0, 0)
       ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
       const p = posicoes()
       const fase = Math.min(1, (agora - inicioOnda) / DURACAO_ONDA_MS)
-      // A frente da onda em x, da primeira camada até depois da última.
-      const frente = CAMADAS[0].x + fase * (CAMADAS[CAMADAS.length - 1].x - CAMADAS[0].x + 0.08)
+      // A frente da onda em x, da primeira camada até a última, onde para. A interpolação
+      // dá exatamente o x da saída com a fase em 1, para que `chegou` seja verdadeiro no fim.
+      const frente = (1 - fase) * CAMADAS[0].x + fase * CAMADAS[CAMADAS.length - 1].x
       const nomeFonte = `${fonte}`

       // Grade de entrada: o glifo lido, em pixels; os pixels acesos piscam quando a onda começa.
       const g = GLIFOS[glifo]
       const lado = Math.min(largura * 0.14, altura * 0.6) / GRADE
       const gx = largura * 0.05
       const gy = altura / 2 - (lado * GRADE) / 2
       for (let l = 0; l < GRADE; l++) {
         for (let c = 0; c < GRADE; c++) {
           const aceso = g[l][c] === '#'
           ctx!.fillStyle = aceso ? (fase < 0.2 ? cores.dourado : cores.azul) : comAlfa(cores.linha, 0.35)
           ctx!.fillRect(gx + c * lado, gy + l * lado, lado - 1, lado - 1)
         }
       }
       // Da grade para as entradas: as linhas dos pixels acesos.
</diff>
```

**Rótulo:** ?
