import {Slide, two, center} from '../../libs/gmtlib.js';

// Dimostrazione grafica di F(n)^2 + F(n+1)^2 = F(2n+1), per n = 3.
//
// Si mostrano tutte le t(6) = 13 tassellazioni di una colonna alta 6 e le si
// divide in due, guardando la linea fra la riga 3 e la riga 4:
//
//   - nessuna tessera la attraversa: la colonna si TAGLIA in due meta' alte
//     3, indipendenti fra loro    ->  t(3) x t(3) = 3 x 3 = 9
//   - un domino la attraversa: restano libere le righe 1-2 e le righe 5-6
//                               ->  t(2) x t(2) = 2 x 2 = 4
//
//   9 + 4 = 13      cioe'   F4^2 + F3^2 = F7
//
// Attenzione al criterio: NON e' "niente verde sulle righe 3 e 4". La
// colonna con i domini a 2-3 e 4-5 ha verde su entrambe le righe e sta
// comunque a sinistra, perche' nessuna singola tessera copre sia la 3 che
// la 4. Il criterio e' se la colonna si puo' tagliare.

const N = 6;             // altezza delle colonne
const CELL = 70;
const TAGLIO = 3;        // si taglia fra la riga 3 e la riga 4

const GAP_UNIFORME = 20;
const GAP_DENTRO   = 12;
const GAP_FUORI    = 150;

const STACCO = 46;       // di quanto si separano le parti

const Y_TOP     = -230;
const Y_NUMERI  =  300;
const Y_TITOLO  = -340;
const Y_FORMULA =  420;

const COL_TAGLIA = 'orange';

// Le tassellazioni delle parti, elencate a mano: sono poche e cosi' l'ordine
// e' quello che serve (parte alta che varia lentamente, parte bassa che
// cicla), e quando le colonne si spaccano si vede il 3 x 3, non solo il 9.
const T3 = [[1,1,1], [1,2], [2,1]];   // t(3) = 3
const T2 = [[1,1], [2]];              // t(2) = 2

function costruisciElenco() {
    const sinistra = [];
    T3.forEach(a => T3.forEach(b => sinistra.push([a, b])));
    const destra = [];
    T2.forEach(a => T2.forEach(b => destra.push([a, [2], b])));
    return {colonne: sinistra.concat(destra), taglie: [sinistra.length, destra.length]};
}

// Come in tiling.js e fibonacci-sum.js, ma verticale e con la divisoria del
// domino corretta (li' e' lunga zero, quindi invisibile).
function createTile(cellSize, rowsCount) {
    const unit = cellSize / 40.0;
    const borderWidth = 2 * unit;
    const bgColor = rowsCount == 1 ? 'rgb(42, 152, 221)' : 'rgb(200, 215, 35)';

    const width = cellSize, height = rowsCount * cellSize;
    const g = two.makeGroup();
    const tile = two.makeRoundedRectangle(
        0, 0, width - borderWidth, height - borderWidth, 6 * unit);
    tile.fill = bgColor;
    tile.stroke = 'rgb(0,100,0)';
    tile.linewidth = borderWidth;
    g.add(tile);
    if(rowsCount == 2) {
        const line = two.makeLine(-width/2, 0, width/2, 0);
        line.stroke = 'rgb(50, 87, 100)';
        line.linewidth = 0.8;
        g.add(line);
    }
    return g;
}

class TwoSquaresTilingSlide extends Slide {
    constructor() {
        super("TwoSquaresTiling");
    }
    initialize() {
    }

    // I div vanno dentro #container, non appesi a document.body: cosi'
    // prendono la stessa trasformazione di scala della scena Two.js.
    creaRiga(y, size) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '0px';
        div.style.top = (y + 540) + 'px';
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

        this.divTitolo = this.creaRiga(Y_TITOLO, 44);
        katex.render(
            '\\text{Tutte le tassellazioni di una colonna alta } 6' +
            '\\text{: sono } 13 = F_7',
            this.divTitolo, {throwOnError: false});

        this.divFormula = this.creaRiga(Y_FORMULA, 50);
        katex.render('F_4^2 + F_3^2 = 3^2 + 2^2 = 13 = F_7',
            this.divFormula, {throwOnError: false});

        const elenco = costruisciElenco();
        this.taglie = elenco.taglie;                 // [9, 4]
        this.colonne = elenco.colonne.map(p => this.creaColonna(p));
        this.tessere = [];
        this.colonne.forEach(g => g.userData.parti.forEach(
            p => p.children.forEach(t => this.tessere.push(t))));

        this.calcolaPosizioni();
        this.colonne.forEach((g, i) => g.position.x = this.xUniforme[i]);

        // --- le due etichette sotto i gruppi --------------------------
        this.numeri = ['3 × 3 = 9', '2 × 2 = 4'].map(s => {
            const txt = two.makeText(s, 0, Y_NUMERI, {
                size: 54, family: 'Noto Sans', weight: 'bold', fill: COL_TAGLIA});
            this.mainGroup.add(txt);
            txt.opacity = 0;
            return txt;
        });

        this.act = 0;
        this.reset();
    }

    // Una colonna e' fatta di PARTI: quelle che si separeranno. A sinistra
    // due parti da 3 righe, a destra tre (2 righe, il domino a cavallo,
    // 2 righe). Le tessere stanno dentro la loro parte, cosi' separarle e'
    // muovere un gruppo solo.
    creaColonna(parti) {
        const g = two.makeGroup();
        this.mainGroup.add(g);
        let y = Y_TOP;
        const gruppi = parti.map(p => {
            const pg = two.makeGroup();
            g.add(pg);
            p.forEach(m => {
                const tile = createTile(CELL, m);
                pg.add(tile);
                tile.position.set(0, y + m*CELL/2);
                y += m * CELL;
            });
            return pg;
        });
        g.userData = {parti: gruppi};
        return g;
    }

    calcolaPosizioni() {
        const n = this.colonne.length;

        const passo = CELL + GAP_UNIFORME;
        const largh1 = n*passo - GAP_UNIFORME;
        this.xUniforme = [];
        for(let i = 0; i < n; i++)
            this.xUniforme.push(-largh1/2 + CELL/2 + i*passo);

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

    // Di quanto si sposta ogni parte quando la colonna si spacca. Simmetrico,
    // cosi' la colonna resta centrata dov'era.
    scostamenti(nParti) {
        return nParti === 2 ? [-STACCO/2, STACCO/2] : [-STACCO, 0, STACCO];
    }

    reset() {
        this.divTitolo.style.opacity = '1';
        this.divFormula.style.opacity = '0';
        this.colonne.forEach((g, i) => {
            g.position.x = this.xUniforme[i];
            g.userData.parti.forEach(p => p.position.y = 0);
        });
        this.tessere.forEach(t => t.opacity = 0);
        this.numeri.forEach(t => t.opacity = 0);
        gsap.to(this.tessere, {duration: 0.35, opacity: 1, stagger: 0.012});
    }

    raggruppa() {
        const tl = gsap.timeline();
        this.colonne.forEach((g, i) => {
            tl.to(g.position, {duration: 1, x: this.xGruppi[i],
                               ease: 'power2.inOut'}, 0);
        });
        return tl;
    }

    // Le colonne si spaccano: e' la dimostrazione. I rettangoli direbbero che
    // le parti sono indipendenti, separarle lo fa vedere.
    esplodi() {
        const tl = gsap.timeline();
        this.colonne.forEach(g => {
            const parti = g.userData.parti;
            const dy = this.scostamenti(parti.length);
            parti.forEach((p, i) => {
                tl.to(p.position, {duration: 0.8, y: dy[i],
                                   ease: 'power2.out'}, 0);
            });
        });
        return tl;
    }

    mostraNumeri() {
        this.numeri.forEach((t, k) => t.position.x = this.xCentroGruppo[k]);
        gsap.to(this.numeri, {duration: 0.4, opacity: 1, stagger: 0.2});
    }

    setAct(act) {
        this.act = act;
        switch(act) {
            case 0: this.reset(); break;
            case 1: this.raggruppa(); break;
            case 2: this.esplodi(); break;
            case 3: this.mostraNumeri(); break;
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
        tl.to(this.tessere, {duration: 0.4, opacity: 0, stagger: 0.01}, 0);
        tl.to(this.numeri, {duration: 0.4, opacity: 0}, 0);
        return tl;
    }
}

let t = new TwoSquaresTilingSlide();
