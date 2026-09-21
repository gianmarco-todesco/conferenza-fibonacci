import {Slide, two, center} from '../../libs/gmtlib.js';

// Dimostrazione grafica di F(1) + ... + F(n) = F(n+2) - 1.
//
// Si mostrano tutte le t(7) = 21 tassellazioni di una colonna alta 7 con
// quadratini (1) e domini (2), e le si classifica in base a DOVE STA IL
// DOMINO PIU' IN ALTO: sopra di lui e' tutto forzato a quadratini, sotto e'
// libero, e "sotto" e' una colonna piu' corta. Quindi le taglie dei gruppi
// sono t(0), t(1), ... cioe' i numeri di Fibonacci.
//
//     21 - 1 = 1 + 1 + 2 + 3 + 5 + 8 = 20        (F8 - 1 = F1 + ... + F6)
//
// Il "-1" e' la colonna di soli quadratini, l'unica senza nessun domino.

const N = 7;            // altezza delle colonne
const CELL = 55;        // lato di una cella

const GAP_UNIFORME = 18;   // spaziatura iniziale, tutte le colonne uguali
const GAP_DENTRO   = 10;   // fra colonne dello stesso gruppo
// Largo: sotto ogni gruppo ci va "n = F_j", che e' molto piu' largo dei
// gruppi da una colonna sola. 85 e' il massimo compatibile con i 1920px.
const GAP_FUORI    = 85;

const Y_TOP    = -110;   // bordo superiore delle colonne
const Y_NUMERI =  320;   // le taglie dei gruppi
const Y_TITOLO =  -330;
const Y_FORMULA = 420;

const COL_TAGLIA    = 'orange';   // la taglia del gruppo
// Le etichette "= F_j" sono bianche come i rettangoli: compaiono insieme e
// dicono la stessa cosa, cioe' da dove viene quel numero.
const COL_ETICHETTA = 'white';

// Copiata da fibonacci-sum.js, con la riga divisoria del domino corretta:
// li' e' makeLine(-w/2, 0, -w/2, 0), cioe' lunga zero e quindi invisibile.
// Su una tessera verticale la divisoria e' orizzontale.
function createTile(cellSize, rowsCount) {
    const unit = cellSize / 40.0;
    const borderRadius = 6 * unit;
    const borderWidth = 2 * unit;
    const bgColor = rowsCount == 1 ? 'rgb(42, 152, 221)' : 'rgb(200, 215, 35)';
    const gridColor = 'rgb(50, 87, 100)';
    const borderColor = 'rgb(0,100,0)';

    const width = cellSize;
    const height = rowsCount * cellSize;

    const tileGroup = two.makeGroup();
    const tile = two.makeRoundedRectangle(
        0, 0, width - borderWidth, height - borderWidth, borderRadius);
    tile.fill = bgColor;
    tile.stroke = borderColor;
    tile.linewidth = borderWidth;
    tileGroup.add(tile);
    if(rowsCount == 2) {
        const line = two.makeLine(-width/2, 0, width/2, 0);
        line.stroke = gridColor;
        line.linewidth = 0.8;
        tileGroup.add(line);
    }
    return tileGroup;
}

// Da fibonacci-sum.js. Produce i pattern gia' raggruppati per posizione del
// primo domino, nell'ordine 1, 1, 2, 3, 5, 8, e la colonna di soli
// quadratini in fondo.
function getPatterns(n) {
    if(n == 0) return [[]];
    else if(n == 1) return [[1]];
    else if(n == 2) return [[2], [1,1]];

    let lst = [];
    for(let i = n-2; i >= 0; i--) {
        let prefix = [];
        for(let j = 0; j < i; j++) prefix.push(1);
        prefix.push(2);
        let sub = getPatterns(n - 2 - i);
        for(let j = 0; j < sub.length; j++) lst.push(prefix.concat(sub[j]));
    }
    let tuttiUno = [];
    for(let j = 0; j < n; j++) tuttiUno.push(1);
    lst.push(tuttiUno);
    return lst;
}

// La colonna esclusa va a sinistra; il resto conserva l'ordine, cosi' il
// raggruppamento e' un allargarsi e nessuna colonna scavalca le altre.
function patternOrdinati(n) {
    const p = getPatterns(n);
    return [p[p.length-1]].concat(p.slice(0, p.length-1));
}

// Le taglie dei gruppi: la colonna esclusa da sola, poi t(0), t(1), ...
function taglieGruppi(n) {
    const fib = [1, 1];
    while(fib.length < n) fib.push(fib[fib.length-1] + fib[fib.length-2]);
    return [1].concat(fib.slice(0, n-1));   // n=7 -> [1, 1, 1, 2, 3, 5, 8]
}

class FibonacciSumTilingSlide extends Slide {
    constructor() {
        super("FibonacciSumTiling");
    }
    initialize() {
    }

    // I div vanno dentro #container, non appesi a document.body: cosi'
    // prendono la stessa trasformazione di scala della scena Two.js.
    creaRiga(y, size) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '0px';
        div.style.top = y + 'px';
        div.style.width = '1920px';
        div.style.textAlign = 'center';
        div.style.fontSize = size + 'px';
        div.style.color = 'white';
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.4s';
        this.contenitore.appendChild(div);
        this.righe.push(div);
        return div;
    }

    start() {
        this.contenitore = document.getElementById('container');
        this.righe = [];

        // Il "= F_8" sta accanto al 21, non in fondo alla frase: messo dopo
        // "colonna alta 7" si attaccherebbe al 7 e sembrerebbe dire 7 = F_8.
        this.divTitolo = this.creaRiga(Y_TITOLO + 540, 44);
        katex.render(
            '\\text{Tutte le tassellazioni di una colonna alta } 7' +
            '\\text{: sono } 21 = F_8',
            this.divTitolo, {throwOnError: false});

        this.divFormula = this.creaRiga(Y_FORMULA + 540, 50);
        katex.render(
            'F_1 + F_2 + F_3 + F_4 + F_5 + F_6 = F_8 - 1',
            this.divFormula, {throwOnError: false});

        const patterns = patternOrdinati(N);
        this.taglie = taglieGruppi(N);

        // --- costruzione delle colonne --------------------------------
        this.colonne = patterns.map(p => {
            const g = two.makeGroup();
            this.mainGroup.add(g);
            let y = Y_TOP, riga = 0, primoVerde = null;
            p.forEach(m => {
                const tile = createTile(CELL, m);
                g.add(tile);
                tile.position.set(0, y + m*CELL/2);
                y += m * CELL;
                if(m === 2 && primoVerde === null) primoVerde = riga + 1;
                riga += m;
            });
            // riga 1..N del domino verde piu' alto; null = nessun verde
            g.userData = {primoVerde: primoVerde};
            g.opacity = 0;
            return g;
        });

        this.calcolaPosizioni();
        this.colonne.forEach((g, i) => g.position.x = this.xUniforme[i]);

        // --- le taglie sotto i gruppi ---------------------------------
        // Sotto la colonna esclusa non va nessun numero: e' l'unica senza
        // domini, senza rettangolo e senza nome. Il "-1" lo dice la formula.
        this.numeri = this.taglie.map((t, k) => {
            if(k === 0) return null;
            const txt = two.makeText(String(t), 0, Y_NUMERI, {
                size: 48, family: 'Noto Sans', weight: 'bold', fill: COL_TAGLIA
            });
            this.mainGroup.add(txt);
            txt.opacity = 0;
            return txt;
        });
        this.numeriTesti = this.numeri.filter(t => t);

        this.creaRettangoli();
        this.creaEtichette();

        this.act = 0;
        this.reset();
    }

    // Un rettangolo per gruppo, che racchiude la parte LIBERA: le righe sotto
    // il domino verde piu' alto. Sopra di lui e' tutto forzato a quadratini,
    // sotto e' una colonna piu' corta -- ed e' per questo che la taglia del
    // gruppo e' un numero di Fibonacci.
    creaRettangoli() {
        const MRG = 7;
        this.rettangoli = [];
        let k = 0;
        this.taglie.forEach((t, gi) => {
            const primo = k, ultimo = k + t - 1;
            k += t;
            if(gi === 0) return;                 // la colonna esclusa
            const r = this.colonne[primo].userData.primoVerde;
            // Il primo gruppo ha il domino in fondo: sotto non resta niente,
            // e un rettangolo alto zero non vuol dire niente. La sua parte
            // libera e' la colonna vuota, che e' proprio perche' conta 1.
            if(N - (r + 1) <= 0) return;

            const yTop = Y_TOP + (r + 1) * CELL;   // subito sotto il domino
            const yBot = Y_TOP + N * CELL;
            const x0 = this.xGruppi[primo]  - CELL/2 - MRG;
            const x1 = this.xGruppi[ultimo] + CELL/2 + MRG;

            const rect = two.makeRectangle(
                (x0 + x1)/2, (yTop + yBot + MRG)/2,
                x1 - x0, yBot - yTop + MRG);
            rect.fill = 'none';
            rect.stroke = 'white';
            rect.linewidth = 5;
            rect.opacity = 0;
            this.mainGroup.add(rect);
            this.rettangoli.push(rect);
        });
    }

    // "= F_j" da affiancare alla taglia del gruppo. Il pedice e' un testo
    // piu' piccolo spostato in basso: qui non serve KaTeX.
    // Nota: si anima l'opacita' dei TESTI, non quella del gruppo. GSAP non
    // riesce a interpolare l'opacita' di un Two.Group qui (totalProgress(1)
    // la lascia a zero, mentre l'assegnazione diretta funziona), ed e' anche
    // il modo in cui si fa in tutto il resto del mazzo.
    creaEtichette() {
        this.etichetteTesti = [];
        this.etichette = this.taglie.map((t, gi) => {
            if(gi === 0) return null;            // la colonna esclusa non ha nome
            const g = two.makeGroup();
            this.mainGroup.add(g);
            const eq = two.makeText('= F', 0, Y_NUMERI, {
                size: 42, family: 'Noto Sans', weight: 'bold', fill: COL_ETICHETTA});
            const sub = two.makeText(String(gi), 0, Y_NUMERI + 14, {
                size: 26, family: 'Noto Sans', weight: 'bold', fill: COL_ETICHETTA});
            g.add(eq); g.add(sub);
            two.update();
            const wEq = eq.getBoundingClientRect().width;
            const wSub = sub.getBoundingClientRect().width;
            eq.position.x = wEq/2;
            sub.position.x = wEq + 3 + wSub/2;
            g.userData = {larghezza: wEq + 3 + wSub, testi: [eq, sub]};
            eq.opacity = sub.opacity = 0;
            this.etichetteTesti.push(eq, sub);
            return g;
        });
    }

    // Due impaginazioni: tutte equidistanti, e raggruppate. L'ordine e' lo
    // stesso, quindi passare dall'una all'altra e' solo un allargarsi.
    calcolaPosizioni() {
        const n = this.colonne ? this.colonne.length : 21;

        // equidistanti
        const passo = CELL + GAP_UNIFORME;
        const largh1 = n*passo - GAP_UNIFORME;
        this.xUniforme = [];
        for(let i = 0; i < n; i++)
            this.xUniforme.push(-largh1/2 + CELL/2 + i*passo);

        // raggruppate
        const nGruppi = this.taglie.length;
        const largh2 = n*CELL + (n - nGruppi)*GAP_DENTRO + (nGruppi - 1)*GAP_FUORI;
        this.xGruppi = [];
        this.xCentroGruppo = [];
        let x = -largh2/2 + CELL/2;
        this.taglie.forEach(t => {
            const primo = x;
            for(let j = 0; j < t; j++) {
                this.xGruppi.push(x);
                if(j < t-1) x += CELL + GAP_DENTRO;
            }
            this.xCentroGruppo.push((primo + x) / 2);
            x += CELL + GAP_FUORI;
        });
    }

    reset() {
        this.divTitolo.style.opacity = '1';
        this.divFormula.style.opacity = '0';
        this.colonne.forEach((g, i) => {
            g.position.x = this.xUniforme[i];
            g.opacity = 0;
        });
        this.numeri.forEach((t, k) => {
            if(!t) return;
            t.opacity = 0;
            t.position.x = this.xCentroGruppo[k];
        });
        this.rettangoli.forEach(r => r.opacity = 0);
        this.etichetteTesti.forEach(t => t.opacity = 0);
        // le colonne entrano da sole, una dopo l'altra
        gsap.to(this.colonne, {duration: 0.35, opacity: 1, stagger: 0.06});
    }

    raggruppa() {
        const tl = gsap.timeline();
        this.colonne.forEach((g, i) => {
            tl.to(g.position, {duration: 1, x: this.xGruppi[i],
                               ease: 'power2.inOut'}, 0);
        });
        return tl;
    }

    mostraTaglie() {
        this.numeri.forEach((t, k) => { if(t) t.position.x = this.xCentroGruppo[k]; });
        this.etichetteTesti.forEach(t => t.opacity = 0);
        gsap.to(this.numeriTesti, {duration: 0.4, opacity: 1, stagger: 0.12});
    }

    // Rettangoli ed etichette insieme: il rettangolo mostra la colonna piu'
    // corta, l'etichetta le da' il nome. La taglia scivola a sinistra per far
    // posto al "= F_j", cosi' l'insieme resta centrato sotto il gruppo.
    mostraStruttura() {
        const GAP = 12;
        const tl = gsap.timeline();
        tl.to(this.rettangoli, {duration: 0.4, opacity: 1, stagger: 0.15}, 0);
        this.etichette.forEach((et, gi) => {
            if(!et) return;
            const num = this.numeri[gi];
            const wNum = num.getBoundingClientRect().width;
            const totale = wNum + GAP + et.userData.larghezza;
            const sx = this.xCentroGruppo[gi] - totale/2;
            et.position.x = sx + wNum + GAP;
            tl.to(num.position, {duration: 0.5, x: sx + wNum/2}, 0);
            tl.to(et.userData.testi, {duration: 0.5, opacity: 1}, 0.25);
        });
        return tl;
    }

    setAct(act) {
        this.act = act;
        switch(act) {
            case 0: this.reset(); break;
            case 1: this.raggruppa(); break;
            case 2: this.mostraTaglie(); break;
            case 3: this.mostraStruttura(); break;
            case 4: this.divFormula.style.opacity = '1'; break;
        }
    }
    get ultimoAtto() { return 4; }
    nextAct() { if(this.act < this.ultimoAtto) this.setAct(this.act + 1); }
    prevAct() { if(this.act > 0) this.setAct(this.act - 1); }
    onKeyDown(event) { if(event.key === '0') this.setAct(0); }

    cleanup() {
        this.righe.forEach(d => d.remove());
        this.righe = [];
    }

    async end() {
        this.righe.forEach(d => { d.style.opacity = '0'; });
        const tl = gsap.timeline();
        tl.to(this.colonne, {duration: 0.4, opacity: 0, stagger: 0.02}, 0);
        tl.to(this.numeriTesti, {duration: 0.4, opacity: 0}, 0);
        tl.to(this.rettangoli, {duration: 0.4, opacity: 0}, 0);
        tl.to(this.etichetteTesti, {duration: 0.4, opacity: 0}, 0);
        return tl;
    }
}

let t = new FibonacciSumTilingSlide();
