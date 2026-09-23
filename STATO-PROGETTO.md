# Conferenza «Fibonacci: numeri fantastici e dove trovarli»

Stato del progetto — **23 settembre 2026**. Premiazione delle olimpiadi della matematica,
Pisa. Pubblico di studenti delle superiori, circa 50 minuti.

## I due documenti, e a cosa servono

| documento | dove | cosa ci sta dentro |
|---|---|---|
| **la scaletta** | <https://claude.ai/code/artifact/cbf35a51-7abb-4087-bd75-b37be18f8607> | il disegno della conferenza: la tesi, slide per slide, le correzioni da portarsi dietro, cosa è stato tagliato e perché |
| **questo file** | `STATO-PROGETTO.md` | lo stato del codice: cosa è fatto, cosa manca, le decisioni che nei sorgenti non si leggono |

La scaletta dice **cosa raccontare**, questo file dice **cosa c'è**. Finito un pezzo si
aggiornano tutti e due: è già successo che divergessero, e quando divergono vince la
scaletta sul contenuto e questo file sullo stato.

## Il mazzo, com'è adesso

Nessun build: `slides/index.html` carica i moduli ES uno per uno, e **l'ordine dei tag
`<script>` è l'ordine delle slide**. Ogni modulo si registra da solo costruendo l'oggetto
`Slide` in fondo al file.

⚠️ **Gli indici sono posizionali e si spostano appena si tocca `index.html`.** Due file
registrano *due* slide a testa: `rabbits.js` (conigli + mitosi) e `spiral.js`. Prima di
scrivere un numero di slide da qualche parte, ricontarlo.

| # | slide | file | stato |
|---|---|---|---|
| 0 | Sequence | `title/sequence.js` | **rifatta**: definizione → semi → animazione → ritratto + Liber Abaci |
| 1 | Pingala | `title/pingala.js` | **nuova** |
| 2 | Tiling | `tiling/tiling.js` | non rivista |
| 3–4 | conigli + mitosi | `rabbits/rabbits.js` | non rivista |
| 5 | GoldenRatio | `golden-ratio/golden-ratio.js` | **rifatta** |
| 6 | Arte | `art/art.js` | non rivista |
| 7 | FibonacciSum | `identities/fibonacci-sum.js` | non rivista |
| 8 | FibonacciSumTiling | `identities/fibonacci-sum-tiling.js` | **nuova** |
| 9 | TwoSquaresSum | `identities/sum-of-two-squares.js` | non rivista |
| 10 | TwoSquaresTiling | `identities/sum-of-two-squares-tiling.js` | **nuova** |
| 11 | SumOfSquares | `identities/sum-of-squares.js` | non rivista |
| 12–13 | spirale × 2 | `spiral/spiral.js` | non rivista |
| 14–16 | gcd × 3 | `gcd/gcdintro.js`, `gcd.js`, `slowgcd.js` | non rivista |
| 17 | ContinuedFractions | `gcd/continued-fractions.js` | **nuova** |
| 18 | Mandelbrot | `mandelbrot/mandelbrot.js` | **riscritto da zero**, antenne complete |
| 19–22 | plants + girasoli × 3 | `sunflower/plants.js`, `sunflower1-3.js` | attivate in `index.html`, **mai guardate** |

**23 slide contro le 16 della scaletta.** Non è un errore di conto: la riorganizzazione
disegnata nella scaletta — fondere le tre identità in una slide, spaccare l'arte in
«deliberato / retrodatato», spostare Binet e Cassini — **non è mai stata applicata a
`index.html`**. Il mazzo ha ancora la struttura vecchia, con dentro le slide nuove.

Non attiva: `title/title.js`, cioè la slide del titolo.

## Infrastruttura

- **Tutto in locale, nessun riferimento a internet.** In sala la rete può non esserci.
  KaTeX 0.16.25 in `slides/libs/katex/` (60 font compresi), Noto Sans in
  `slides/assets/fonts/`. L'iframe che portava il Mandelbrot su un sito esterno è sparito.
- **Noto Sans e non Arial** per i segni IAST della traslitterazione dal sanscrito
  (Piṅgala, Chandaḥśāstra): Arial non ha il Latin Extended Additional e uscivano i
  quadratini.
- `gmtlib.js` aspetta i font con l'API Font Loading **prima** di far partire le slide. Non
  è una cautela: le slide si impaginano misurando i testi con `getBoundingClientRect`, e
  col font di ripiego le posizioni nascono storte.
- L'hash dell'URL naviga a caldo: cambiando `#12` in `#17` nella barra degli indirizzi si
  va subito alla slide, e funzionano i tasti avanti/indietro del browser.

## Quello che resta da fare

1. **Le quattro slide del girasole (19–22)**: attivate ma mai aperte. È il blocco più
   grosso ancora al buio.
2. **La seconda slide dell'arte — gli strafalcioni.** Accanto a quella su Fibonacci
   nell'arte: la prima i casi deliberati (Merz, i cubi pisani), la seconda i retrodatati
   (Partenone, Gioconda, proporzioni del corpo umano).
3. **La conchiglia dopo la spirale.** Non come illustrazione ma come smentita — vedi sotto
   il numero giusto, che nella scaletta era sbagliato.
4. **Binet e Cassini, mai spostati.** Deciso e mai fatto: Binet va attaccato alla slide di
   φ, Cassini più il paradosso della dissezione vanno come finale della slide delle
   identità. La scaletta descrive ancora la sistemazione vecchia in quel punto.
5. **La tabella errore × q² della slide sulle frazioni continue.** La slide costruita
   copre il procedimento, il troncamento prima del 292, 355/113 e i convergenti di φ, ma
   **non** il punto (e) del disegno: errore × q² che per π precipita e per φ resta
   incollato a 0,447 = 1/√5. È il momento in cui «φ si approssima male» smette di essere
   una frase a effetto e diventa un numero. Anche la terminazione (finito ⇔ razionale) e
   «è esattamente Euclide» oggi sono a voce, non sulla slide.
6. **Douady & Couder (1992)**, la slide che manca di più: è il ponte fra «φ è il più
   difficile da approssimare» e «quindi le piante usano φ». Meglio una simulazione che una
   fotografia protetta da copyright — e meglio della slide `sunflower1.js`, che l'angolo
   aureo lo *impone*, mentre Douady–Couder lo fa *emergere* da una regola di repulsione.

### Cose piccole, tutte vere e tutte da ripulire

- `slides/assets/sunflower-2.png` e `slides/assets/fibonacci.jpg` sono committati e non li
  usa nessuno.
- `console.log("act2", ...)` di debug in `tiling/tiling.js:207`.
- `golden-ratio.js` usa il punto come separatore decimale, le slide più recenti la virgola.
- Due commit non pushati sul repository della conferenza.

## Decisioni che nei sorgenti non si vedono

**La convenzione degli indici è F₀ = 0, F₁ = 1** (prima era F(1) = F(2) = 1). È la stessa
successione con un termine in più davanti. Le tassellazioni di una striscia lunga n sono
**F(n+1)**, non F(n): è l'errore classico, ed è coerente su tutte le identità.

**Le antenne di Mandelbrot: q raggi, contando quello che torna verso il bulbo.** La
convenzione è confermata dal dato raccolto a mano in `TAPPE` — 3 punte per 1/3, 5 per 2/5,
8 per 3/8, 13 per 5/13. Se un giorno ne venissero q−1, vuol dire che si stanno contando le
antenne libere. I centri dei bulbi si calcolano con Newton sul parametro superattrattivo
di periodo q, **non** con il raggio asintotico sin(πp/q)/q²: quello è esatto solo per
q = 2, e già a q = 8 sbaglia del 3% — i cerchi venivano piccoli e spostati.

**Il criterio della slide `sum-of-two-squares-tiling.js` è «si taglia», non «niente verde
sulle righe 3 e 4».** La colonna con i domini a 2–3 e 4–5 ha verde su tutt'e due le righe
e sta comunque a sinistra, perché nessuna singola tessera copre sia la 3 che la 4. Col
criterio sbagliato il conto viene 8 + 5 invece di 9 + 4.

**Il nautilus cresce di circa 1,33 per quarto di giro, cioè circa 3 per giro** — contro
φ ≈ 1,618 per quarto di giro e φ⁴ ≈ 6,85 per giro. I due numeri vanno confrontati alla
stessa unità: la scaletta per un po' ha avuto «1,33 per giro» in un punto e «circa 3 per
giro» in un altro, ed erano la stessa misura letta male. Il valore va comunque verificato
su una fonte prima di proiettarlo.

**Niente equazione caratteristica sulla slide dei conigli.** L'unica sostanza sarebbe
x² = x + 1, che è già la riga r = 1 + 1/r della slide di φ. Quella slide è empirica, e va
bene così.

**La torre delle frazioni continue nella slide di φ si ferma a tre livelli.** Motivo
tecnico: a quattro è alta 535 px e va addosso alla forma chiusa. Motivo migliore: così
l'ultima pressione non allunga la torre, toglie la φ.
