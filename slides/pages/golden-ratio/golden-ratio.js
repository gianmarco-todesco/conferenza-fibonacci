import {Slide, two, center} from '../../libs/gmtlib.js';

const DECIMALI = 12;
const PHI = (1 + Math.sqrt(5)) / 2;

// Riferimento per dire quali cifre del rapporto sono gia' quelle giuste.
// Va arrotondato agli stessi decimali che si mostrano, non preso
// dall'espansione esatta: phi e' 1.6180339887498..., che a 12 decimali si
// scrive 1.618033988750. Confrontando con le cifre esatte, le ultime due
// resterebbero rosse per sempre e il rapporto non "finirebbe" mai.
const PHI_RIF = PHI.toFixed(DECIMALI);

const PASSO_MS = 300;   // ritmo dell'animazione dei rapporti
const MAX_N    = 40;    // oltre non serve: le cifre mostrate sono tutte giuste

// Coordinate nello spazio 1920x1080 della scena.
const Y_TITOLO   = 60;
const Y_RAPPORTI = 210;
const Y_FORMULA  = 380;
const Y_CHIUSA   = 930;

// I passi della formula centrale. Dopo l'ultimo comincia la torre.
const PASSI = [
    '\\frac{F_{n+1}}{F_n} \\xrightarrow[\\ n \\to \\infty\\ ]{} \\varphi',
    'F_{n+1} = F_n + F_{n-1}',
    '\\frac{F_{n+1}}{F_n} = 1 + \\frac{F_{n-1}}{F_n}',
    '\\varphi = 1 + \\cfrac{1}{\\varphi}',
];

// Costruisce la torre annidata a profondita' data. Con 'chiusa' l'ultimo
// livello e' "1 + ..." invece di phi: la torre diventa di soli 1.
function torre(profondita, chiusa) {
    let dentro = chiusa ? '1 + \\cdots' : '\\varphi';
    for(let i = 0; i < profondita; i++) {
        dentro = '1 + \\cfrac{1}{' + dentro + '}';
    }
    return '\\varphi = ' + dentro;
}

class GoldenRatioSlide extends Slide {
    constructor() {
        super("GoldenRatio");
    }
    initialize() {
    }

    // I div vanno DENTRO #container, non appesi a document.body: cosi'
    // prendono la stessa trasformazione di scala della scena Two.js e la
    // slide resta allineata alle altre a qualunque dimensione di finestra.
    // La versione vecchia li appendeva al body, ed e' il motivo per cui
    // questa slide si disallineava dalle altre.
    creaRiga(y, size, colore) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '0px';
        div.style.top = y + 'px';
        div.style.width = '1920px';
        div.style.textAlign = 'center';
        div.style.fontSize = size + 'px';
        div.style.color = colore || 'white';
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.4s';
        this.contenitore.appendChild(div);
        this.righe.push(div);
        return div;
    }

    start() {
        this.contenitore = document.getElementById('container');
        this.righe = [];

        const titolo = this.creaRiga(Y_TITOLO, 70);
        titolo.textContent = 'La sezione aurea';
        titolo.style.fontWeight = 'bold';
        titolo.style.opacity = '1';

        this.divRapporti = this.creaRiga(Y_RAPPORTI, 60);
        this.divFormula  = this.creaRiga(Y_FORMULA, 64);
        this.divChiusa   = this.creaRiga(Y_CHIUSA, 56);

        katex.render(
            '\\varphi = \\frac{1+\\sqrt5}{2} = ' + PHI_RIF + '\\ldots',
            this.divChiusa, {throwOnError: false});

        this.act = 0;
        this.reset();
    }

    // --- l'animazione dei rapporti ------------------------------------

    // Disegna F(n+1)/F(n) col valore decimale: in bianco le cifre che
    // coincidono gia' con quelle di phi, in rosso le altre.
    mostraRapporto(n, a, b) {
        const div = this.divRapporti;
        div.innerHTML = '';

        const frazione = document.createElement('span');
        frazione.style.verticalAlign = 'middle';
        katex.render(
            `\\frac{F_{${n+1}}}{F_{${n}}} = \\frac{${b}}{${a}} =`,
            frazione, {throwOnError: false});
        div.appendChild(frazione);

        const v = (b / a).toFixed(DECIMALI);
        let k = 0;
        while(k < v.length && v[k] === PHI_RIF[k]) k++;

        const valore = document.createElement('span');
        valore.style.verticalAlign = 'middle';
        valore.style.marginLeft = '20px';
        valore.style.fontFamily = 'monospace';
        valore.innerHTML = v.substring(0, k) +
            "<span style='color:#ff6b6b'>" + v.substring(k) + '</span>';
        div.appendChild(valore);

        return k >= v.length;   // tutte le cifre mostrate sono giuste
    }

    avviaRapporti() {
        this.fermaRapporti();
        let n = 1, a = 1, b = 1;          // F(1) = F(2) = 1: si parte da F2/F1
        this.divRapporti.style.opacity = '1';
        this.mostraRapporto(n, a, b);

        this.timerId = setInterval(() => {
            n++;
            [a, b] = [b, a + b];
            const finito = this.mostraRapporto(n, a, b);
            if(finito || n >= MAX_N) this.fermaRapporti();
        }, PASSO_MS);
    }

    fermaRapporti() {
        if(this.timerId) { clearInterval(this.timerId); this.timerId = null; }
    }

    // Freccia destra durante l'animazione: salta al risultato invece di
    // far aspettare i dieci secondi.
    concludiRapporti() {
        if(!this.timerId) return false;
        this.fermaRapporti();
        let n = 1, a = 1, b = 1;
        while(n < MAX_N) {
            n++;
            [a, b] = [b, a + b];
            if(this.mostraRapporto(n, a, b)) break;
        }
        return true;
    }

    // --- atti ---------------------------------------------------------

    reset() {
        this.fermaRapporti();
        this.divRapporti.innerHTML = '';
        this.divFormula.innerHTML = '';
        this.divRapporti.style.opacity = '0';
        this.divFormula.style.opacity = '0';
        this.divChiusa.style.opacity = '0';
        this.avviaRapporti();
    }

    mostraFormula(tex) {
        katex.render(tex, this.divFormula, {throwOnError: false});
        this.divFormula.style.opacity = '1';
    }

    setAct(act) {
        this.act = act;
        if(act > 0) this.concludiRapporti();

        if(act === 0) { this.reset(); return; }

        if(act <= PASSI.length) {
            this.mostraFormula(PASSI[act - 1]);
            // La forma chiusa entra quando la formula e' phi = 1 + 1/phi.
            this.divChiusa.style.opacity = (act === PASSI.length) ? '1' : '0';
            return;
        }

        // Da qui in poi la torre cresce fino a tre livelli, poi si chiude
        // sostituendo la phi in fondo con i puntini.
        //
        // Tre livelli e non quattro: a quattro la torre e' alta 535 e arriva
        // addosso alla forma chiusa. E l'ultimo passo non fa crescere niente,
        // toglie la phi: non e' la torre che si allunga, e' la scoperta che
        // non finisce.
        const passo = act - PASSI.length;       // 1, 2, 3
        this.divChiusa.style.opacity = '1';
        if(passo <= 2) this.mostraFormula(torre(passo + 1, false));
        else           this.mostraFormula(torre(3, true));
    }

    get ultimoAtto() { return PASSI.length + 3; }

    nextAct() {
        // La prima freccia, se l'animazione sta ancora girando, serve solo a
        // concluderla: non fa avanzare l'atto.
        if(this.concludiRapporti() && this.act === 0) return;
        if(this.act < this.ultimoAtto) this.setAct(this.act + 1);
    }
    prevAct() {
        if(this.act > 0) this.setAct(this.act - 1);
    }
    onKeyDown(event) {
        if(event.key === '0') this.setAct(0);
    }

    cleanup() {
        this.fermaRapporti();
        this.righe.forEach(d => d.remove());
        this.righe = [];
    }

    async end() {
        this.righe.forEach(d => { d.style.opacity = '0'; });
        return gsap.timeline().to({}, {duration: 0.4});
    }
}

let goldenRatioSlide = new GoldenRatioSlide();
