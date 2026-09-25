# Conferenza «Fibonacci: numeri fantastici e dove trovarli»

Stato del progetto — **25 settembre 2026**. Premiazione delle olimpiadi della matematica,
Pisa. Pubblico di studenti delle superiori, circa 50 minuti.

## I due documenti, e a cosa servono

| documento | dove | cosa ci sta dentro |
|---|---|---|
| **la scaletta** | <https://claude.ai/code/artifact/cbf35a51-7abb-4087-bd75-b37be18f8607> | il disegno della conferenza: la tesi, slide per slide, le correzioni da portarsi dietro, cosa è stato tagliato e perché |
| **questo file** | `STATO-PROGETTO.md` | lo stato del codice: cosa è fatto, cosa manca, le decisioni che nei sorgenti non si leggono |

La cartella si chiama **`conferenze/conferenza-fibonacci`**: si chiamava
`conferenza-fibonacci-pisa2025` fino al 24 settembre 2026, e un percorso vecchio scritto
da qualche parte non funziona più.

La scaletta dice **cosa raccontare**, questo file dice **cosa c'è**. Finito un pezzo si
aggiornano tutti e due: è già successo che divergessero, e quando divergono vince la
scaletta sul contenuto e questo file sullo stato.

## Il mazzo, com'è adesso

Nessun build: `slides/index.html` carica i moduli ES uno per uno, e **l'ordine dei tag
`<script>` è l'ordine delle slide**. Ogni modulo si registra da solo costruendo l'oggetto
`Slide` in fondo al file.

⚠️ **Gli indici sono posizionali e si spostano appena si tocca `index.html`.** Più file
registrano più di una slide a testa: `rabbits.js` ne fa due, `spiral.js` quattro. La
tabella qui sotto invecchia a ogni aggiunta, e non va ricontata a mano: si rifa' con

```bash
python tools/indice-slide.py
```

| # | slide | file | stato |
|---|---|---|---|
| 0 | Titolo | `title/title.js` | attivata, mai guardata |
| 1 | Sequence | `title/sequence.js` | rifatta: definizione -> semi -> animazione -> ritratto + Liber Abaci |
| 2 | Pingala | `title/pingala.js` | nuova |
| 3 | Tiling | `tiling/tiling.js` | non rivista |
| 4-5 | conigli + mitosi | `rabbits/rabbits.js` | non rivista |
| 6 | Crescite | `rabbits/crescite.js` | **nuova**: F(n) e 2^n a confronto |
| 7 | GoldenRatio | `golden-ratio/golden-ratio.js` | rifatta |
| 8 | Arte | `art/art.js` | non rivista |
| 9 | Myth | `art/myth.js` | nuova (gli strafalcioni) |
| 10 | FibonacciSum | `identities/fibonacci-sum.js` | non rivista |
| 11 | FibonacciSumTiling | `identities/fibonacci-sum-tiling.js` | nuova |
| 12 | TwoSquaresSum | `identities/sum-of-two-squares.js` | non rivista |
| 13 | TwoSquaresTiling | `identities/sum-of-two-squares-tiling.js` | nuova |
| 14 | SumOfSquares | `identities/sum-of-squares.js` | non rivista |
| 15-18 | spirale x2 + due immagini | `spiral/spiral.js` | la conchiglia e il gatto |
| 19 | Mandelbrot | `mandelbrot/mandelbrot.js` | riscritto da zero; cerchi dei bulbi e antenne sistemati |
| 20-22 | gcd x3 | `gcd/gcdintro.js`, `gcd.js`, `slowgcd.js` | non rivista |
| 23 | ContinuedFractions | `gcd/continued-fractions.js` | nuova |
| 24 | plants | `sunflower/plants.js` | attivata, mai guardata |
| 25 | Parastiche | `sunflower/parastiche.js` | **nuova**: le spirali sulla foto, fasi da mettere a mano |
| 26 | SunFlower1 | `sunflower/sunflower1.js` | mai guardata |
| 27 | DouadyCouder | `sunflower/douady-couder.js` | **nuova**: l'angolo aureo che emerge dalla repulsione |
| 28-29 | girasoli x2 | `sunflower/sunflower2.js`, `sunflower3.js` | mai guardate |

**30 slide contro le 16 della scaletta.** Non è un errore di conto: la riorganizzazione
disegnata nella scaletta — fondere le tre identità in una slide, spaccare l'arte in
«deliberato / retrodatato», spostare Binet e Cassini — **non è mai stata applicata a
`index.html`**. Il mazzo ha ancora la struttura vecchia, con dentro le slide nuove.

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

1. **Finire la slide 25, `parastiche.js`.** Il telaio c'è: foto, overlay, modalità di
   regolazione con i due cerchi di riferimento, misura col clic, stampa della tabella.
   Mancano **i dati**: le fasi dei bracci, da misurare a occhio sulla foto. Vedi sotto
   perché si fa a mano.
2. **Le slide del girasole (24, 26, 28–29)**: attivate ma mai aperte.
3. ~~**La seconda slide dell'arte — gli strafalcioni.**~~ fatta: `art/myth.js`, slide 9. Il resto della voce: Accanto a quella su Fibonacci
   nell'arte: la prima i casi deliberati (Merz, i cubi pisani), la seconda i retrodatati
   (Partenone, Gioconda, proporzioni del corpo umano).
4. ~~**La conchiglia dopo la spirale.**~~ fatta: sta in `spiral.js`, slide 15–18. Il numero da usare: Non come illustrazione ma come smentita — vedi sotto
   il numero giusto, che nella scaletta era sbagliato.
5. **Binet e Cassini, mai spostati.** Deciso e mai fatto: Binet va attaccato alla slide di
   φ, Cassini più il paradosso della dissezione vanno come finale della slide delle
   identità. La scaletta descrive ancora la sistemazione vecchia in quel punto.
6. **La tabella errore × q² della slide sulle frazioni continue.** La slide costruita
   copre il procedimento, il troncamento prima del 292, 355/113 e i convergenti di φ, ma
   **non** il punto (e) del disegno: errore × q² che per π precipita e per φ resta
   incollato a 0,447 = 1/√5. È il momento in cui «φ si approssima male» smette di essere
   una frase a effetto e diventa un numero. Anche la terminazione (finito ⇔ razionale) e
   «è esattamente Euclide» oggi sono a voce, non sulla slide.
7. ~~**Douady & Couder (1992)**~~ — **fatta**: slide 25, `sunflower/douady-couder.js`.
   È la simulazione del modello numerico dell'articolo, non una fotografia: le foto
   hanno un copyright e questa slide si proietta in pubblico. L'apparato è disegnato
   in sezione nell'atto 0.

### Cose piccole, tutte vere e tutte da ripulire

- `slides/assets/fibonacci.jpg` è committato e non lo usa nessuno. (`sunflower-2.png`
  adesso lo usa la slide 20.)
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

**Le spirali della slide 20 si posizionano a mano, e non per sbaglio.** Un girasole vero
non ha i bracci equispaziati lungo il giro. Disegnando m copie della stessa curva ruotate
di 2π/m, a un certo angolo cadono negli spazi fra i pistilli e novanta gradi più in là ci
passano sopra: da lontano regge, in prima fila no. Quindi la forma della curva è condivisa
(il passo è quello), ma **ogni braccio si porta la sua fase**, misurata dove interseca due
cerchi di riferimento; fra i due si interpola, e i bracci non misurati si prendono dai
vicini. Quello che si segue non è un modello: sono gli errori che ha fatto la pianta.

Il tentativo di ricavarle automaticamente (`tools/misura-parastiche.py`) **è fallito su
questa foto**, e vale la pena sapere fin dove è arrivato: il numero 55 è solido, misurato
netto in ogni fascia di raggio, e il suo partner deve essere 34 perché il capolino non ha
simmetria a 1/2, 1/3 o 1/5 di giro, quindi le parastiche adiacenti sono coprime e 35 e 56
sono esclusi. Ma la famiglia da 34 in questa immagine è troppo debole: il fit dà passi fra
−16 e +38 a seconda della fascia, cioè rumore. Le immagini dei tentativi stanno in
`work/parastiche/` (non tracciate); `verifica.png` è la più utile — pannello destro quello
che funziona, sinistro quello che non funziona.

**L'atto 2 della slide 25 abbassa G da solo, e non è un vezzo di regia.** Partendo di
colpo da un G piccolo il sistema cade su un **ramo diverso**: a G = 0,12 esce 101,8°, che
è il ramo di Lucas, non quello di Fibonacci. Il ramo giusto lo si trova solo abbassando G
lentamente — è quello che fanno Douady e Couder, ed è misurato, non supposto. Con la
manopola a mano (`q`/`w`) il salto è volutamente piccolo per lo stesso motivo; premendo
forte si finisce sull'altro ramo, e vale la pena farlo vedere.

Due numeri verificati prima di scrivere la slide, perché è tutto quello che la slide
afferma: il punto fisso a G = 0,02 è **137,47° ± 0,01** contro i 137,5078° dell'angolo
aureo (la differenza residua è del modello: a G finito il punto fisso non è esattamente
360/φ²), e **non dipende dai dettagli della repulsione** — con esponente 3 e con esponente
6 coincide entro 0,05°. Se dipendesse, la risposta l'avremmo scelta noi.

**Quanto spesso le spirali del girasole sono davvero Fibonacci: la cifra c'e'.** Era una
voce da verificare, ed e' verificata sull'articolo. Swinton, Ochu et al., *Novel Fibonacci
and non-Fibonacci structure in the sunflower: results of a citizen science experiment*,
Royal Society Open Science 3:160091 (2016), dal censimento del Manchester Science Festival:

- **657 girasoli** raccolti;
- nel sottoinsieme piu' affidabile, **768 conteggi** di parastiche (orarie o antiorarie);
- **565 erano numeri di Fibonacci**, cioe' il **74%**;
- altri **67** avevano una struttura affine gia' prevista: **41 Lucas**, **25 doppi di
  Fibonacci**, **1** della successione F4. Con quelli si arriva a **632 su 768, l'82%**;
- quindi **circa un conteggio su sei, il 18%, non ha nessuna di queste strutture**.

Due avvertenze prima di proiettarli. Il denominatore sono i **conteggi**, non le piante:
ogni girasole ne porta due, e la frazione di girasoli con *entrambi* i conteggi Fibonacci
e' piu' bassa. E il 25 "doppio di Fibonacci" e' esattamente il caso bigiugato che era
stato ipotizzato e poi escluso per `sunflower-2.png`: succede davvero, solo non li'.
