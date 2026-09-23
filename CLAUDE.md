# conferenza-fibonacci-pisa2025 — istruzioni per Claude

Mazzo di slide interattive in JavaScript per una conferenza divulgativa su Fibonacci.
Niente build, niente framework: moduli ES, Two.js (renderer SVG), GSAP, KaTeX.

**Prima di lavorare qui leggi `STATO-PROGETTO.md`.** È il documento di ripresa: dice cosa
è fatto, cosa manca e quali decisioni sono state prese e non si leggono nei sorgenti. Va
aggiornato quando si finisce un pezzo o si prende una decisione di quel tipo.

Il disegno della conferenza — cosa raccontare, in che ordine, con quali cautele — sta
nella scaletta, che è un documento Claude:
<https://claude.ai/code/artifact/cbf35a51-7abb-4087-bd75-b37be18f8607>

## Dove sta cosa

```
serve.py                      server di sviluppo, vieta la cache
slides/index.html             registra le slide: l'ordine dei <script> e' l'ordine delle slide
slides/libs/gmtlib.js         il telaio: classe Slide, setSlide, tasti, font, hash
slides/libs/                  gsap, two, katex (tutto in locale)
slides/assets/                immagini e font
slides/pages/<tema>/<slide>.js   una slide per file (a volte due: vedi sotto)
work/                         esperimenti vecchi, non fanno parte del mazzo
```

## Modo di lavorare

**Su una richiesta di disegno non si parte a scrivere codice: si propone la decomposizione
e si fanno le domande, comprese le critiche a quello che è stato chiesto.** Su questo
progetto ha già cambiato più di una scelta, e più di una volta l'idea di partenza era
sbagliata in un modo che valeva la pena dire.

Il pubblico è di olimpionici della matematica: un numero arrotondato male o un'identità
con l'indice sbagliato viene raccolto dalla prima fila in mezzo secondo. Un numero che va
su una slide o è verificato o è segnalato come da verificare.

## Provare le slide

```bash
python serve.py
```

Porta 8765, serve la propria cartella e manda intestazioni che vietano la cache.
**Usarlo sempre.** La cache del browser ha già prodotto una diagnosi sbagliata: il browser
serviva una vecchia `gmtlib.js` e il sintomo sembrava un bug nel codice nuovo. Cambiare
solo il frammento dopo `#` non ricarica niente: per forzare il ricaricamento serve un
parametro di query.

Il pannello del browser **spesso è nascosto**, e quando lo è `innerWidth` vale 0, niente
ha un riquadro di layout, `gsap.ticker` è fermo (è basato su rAF), `await slide.end()` non
si risolve mai e gli screenshot tornano fotogrammi vecchi. In quelle condizioni non si
dichiara una verifica visiva: si pilotano gli atti da codice con `setAct()`, si forza
`totalProgress(1)` sulle timeline, e si legge il **DOM dell'SVG** invece di fidarsi
dell'immagine. Se il layout non è misurabile, lo si dice.

## Convenzioni

- **Commenti in italiano**, e spiegano *perché*, non *cosa*.
- **Sulle slide si scrive in italiano, con la virgola decimale.**
- `gmtlib.js` è **LF**; tutto il resto è **CRLF** (`core.autocrlf` è `true`). Non
  normalizzare i file a tappeto.
- I `<div>` di KaTeX vanno appesi a **`#container`**, non a `document.body`: `#container`
  porta la trasformazione di scala (1920×1080 riscalato sulla finestra), e un div appeso
  al body finisce fuori posto e di dimensione sbagliata.
- Il sistema di coordinate delle slide è 1920×1080, con l'origine al centro
  (`slide.mainGroup` è già posizionato in `center`).
- **Tutto in locale**: in sala la rete può non esserci. Niente CDN, niente iframe verso
  siti esterni, niente font di Google. Un'immagine nuova va scaricata in `slides/assets/`.
- Una slide nuova è un file nuovo più una riga in `index.html`. Attenzione: `rabbits.js` e
  `spiral.js` registrano **due** slide a testa, quindi gli indici non coincidono con il
  numero di file.
