import {Slide, two, center} from '../../libs/gmtlib.js';

// Frazioni continue: si costruisce quella di pi passo per passo, si tronca
// prima del 292 e si ottiene 355/113; poi si rifa' con phi, dove non arriva
// mai nessun coefficiente grande.
//
// Il premio e' alla fine: i convergenti di phi sono 1, 2, 3/2, 5/3, 8/5...
// cioe' esattamente i rapporti di Fibonacci visti alla slide 5. Non e'
// un'analogia: i convergenti di [1;1,1,1,...] sono F(n+1)/F(n).
//
// La terminazione (finito <=> razionale) NON e' sulla slide: si dice a voce.

const Y_TITOLO      = 60;
const Y_ESPRESSIONE = 210;
const Y_RISULTATO   = 380;
const Y_ERRORE      = 620;

// Colonna di sinistra per l'espressione, colonna di destra per il risultato.
const COL_SX = {left: 60,   width: 1150};
const COL_DX = {left: 1230, width: 640};

const COL_GRANDE = '#ffd24d';   // il 292
const COL_SBARRA = '#ff6b6b';

// Lo sviluppo di pi, verificato a mano:
//   3        resto 0,14159265...   1/r =   7,06251331...
//   7        resto 0,06251331...   1/r =  15,99659441...
//  15        resto 0,99659441...   1/r =   1,00341723...
//   1        resto 0,00341723...   1/r = 292,63459101...
const PI_PASSI = [
    {a: 3,  resto: '0{,}14159265\\ldots', rec: '7{,}06251331\\ldots'},
    {a: 7,  resto: '0{,}06251331\\ldots', rec: '15{,}99659441\\ldots'},
    {a: 15, resto: '0{,}99659441\\ldots', rec: '1{,}00341723\\ldots'},
    {a: 1,  resto: '0{,}00341723\\ldots', rec: '292{,}634591\\ldots'},
];

const PI_TESTA = '3{,}14159265358979\\ldots';

// phi = 1 + 1/(1 + 1/(1 + ...)): ogni coefficiente e' 1, ogni resto e'
// 0,61803399. I convergenti sono i rapporti di Fibonacci.
const PHI_TESTA = '1{,}61803398874989\\ldots';
const PHI_CONVERGENTI = ['1', '2', '\\frac{3}{2}', '\\frac{5}{3}',
                         '\\frac{8}{5}', '\\frac{13}{8}'];
const PHI_PASSO_MS = 1100;

// La torre smette di crescere dopo 5 livelli mentre i convergenti proseguono.
// Non si perde niente (i livelli sono tutti uguali) e non si rischia di
// sfondare in basso: a 6 livelli l'altezza stimata sfiora il bordo.
const PHI_PROFONDITA_MAX = 5;

// Costruisce la frazione continua annidata, dall'interno verso l'esterno.
//   coeff = [3, 7]   coda = '0{,}06251331\\ldots'
//   ->  3 + \cfrac{1}{7 + 0{,}06251331\ldots}
function costruisci(coeff, coda) {
    let s = String(coeff[coeff.length - 1]);
    if(coda) s += ' + ' + coda;
    for(let i = coeff.length - 2; i >= 0; i--) {
        s = String(coeff[i]) + ' + \\cfrac{1}{' + s + '}';
    }
    return s;
}

class ContinuedFractionsSlide extends Slide {
    constructor() {
        super("ContinuedFractions");
    }
    initialize() {
    }

    // I div vanno dentro #container, non appesi a document.body: cosi'
    // prendono la stessa trasformazione di scala della scena Two.js.
    creaDiv(y, size, colonna, allineamento) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = (colonna ? colonna.left : 0) + 'px';
        div.style.top = y + 'px';
        div.style.width = (colonna ? colonna.width : 1920) + 'px';
        div.style.textAlign = allineamento || 'center';
        div.style.fontSize = size + 'px';
        div.style.color = 'white';
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.35s';
        this.contenitore.appendChild(div);
        this.divs.push(div);
        return div;
    }

    start() {
        this.contenitore = document.getElementById('container');
        this.divs = [];

        this.divTitolo = this.creaDiv(Y_TITOLO, 56);
        this.divTitolo.textContent = 'MCD e frazioni continue';
        this.divTitolo.style.fontWeight = 'bold';
        this.divTitolo.style.opacity = '1';

        this.divEspr     = this.creaDiv(Y_ESPRESSIONE, 48, COL_SX, 'left');
        this.divRisultato = this.creaDiv(Y_RISULTATO, 56, COL_DX);
        this.divErrore    = this.creaDiv(Y_ERRORE, 34, COL_DX);

        this.act = 0;
        this.reset();
    }

    scrivi(div, tex) {
        katex.render(tex, div, {throwOnError: false});
        div.style.opacity = '1';
    }

    // --- pi -------------------------------------------------------------
    // Ogni coefficiente costa due atti: prima si stacca la parte intera,
    // poi il resto si capovolge in 1/x. E' il procedimento, non una scorciatoia.
    espressionePi(atto) {
        if(atto === 0) return '\\pi = ' + PI_TESTA;

        const i = Math.floor((atto - 1) / 2);      // quale coefficiente
        const capovolto = ((atto - 1) % 2) === 1;  // resto gia' capovolto?
        const coeff = PI_PASSI.slice(0, i + 1).map(p => p.a);
        const p = PI_PASSI[i];

        let coda;
        if(!capovolto) coda = p.resto;
        else if(i === PI_PASSI.length - 1)
            // l'ultimo: il 292 va fatto notare prima di buttarlo via
            coda = '\\cfrac{1}{\\textcolor{' + COL_GRANDE + '}{' + p.rec + '}}';
        else coda = '\\cfrac{1}{' + p.rec + '}';

        return '\\pi = ' + costruisci(coeff, coda);
    }

    get ultimoAttoPi() { return PI_PASSI.length * 2; }   // = 8

    // --- atti -------------------------------------------------------------
    reset() {
        if(this.timerPhi) { clearInterval(this.timerPhi); this.timerPhi = null; }
        if(this.timerSbarra) { clearTimeout(this.timerSbarra); this.timerSbarra = null; }
        this.divRisultato.style.opacity = '0';
        this.divErrore.style.opacity = '0';
        this.divRisultato.innerHTML = '';
        this.divErrore.innerHTML = '';
        this.scrivi(this.divEspr, this.espressionePi(0));
    }

    // Il 292 si sbarra, e dopo un attimo sparisce: una pressione sola, due
    // battute. Quello che resta e' [3; 7, 15, 1].
    sbarraETronca() {
        const coeff = PI_PASSI.map(p => p.a);
        const p = PI_PASSI[PI_PASSI.length - 1];
        const sbarrato = '\\cfrac{1}{\\textcolor{' + COL_SBARRA +
                         '}{\\cancel{' + p.rec + '}}}';
        this.scrivi(this.divEspr, '\\pi \\approx ' + costruisci(coeff, sbarrato));
        if(this.timerSbarra) clearTimeout(this.timerSbarra);
        this.timerSbarra = setTimeout(() => {
            this.scrivi(this.divEspr, '\\pi \\approx ' + costruisci(coeff, null));
            this.timerSbarra = null;
        }, 900);
    }

    mostraRisultato() {
        this.scrivi(this.divRisultato, '= \\dfrac{355}{113}');
    }

    mostraErrore() {
        this.scrivi(this.divErrore,
            '\\begin{aligned}' +
            '355/113 &= 3{,}14159292\\ldots \\\\' +
            '\\pi\\ &= 3{,}14159265\\ldots \\\\[2pt]' +
            '\\text{errore} &= 2{,}7 \\cdot 10^{-7}' +
            '\\end{aligned}');
    }

    // --- phi ---------------------------------------------------------------
    // Con pi ogni coefficiente e' una sorpresa e serve la freccia. Con phi
    // esce sempre 1: la monotonia e' il messaggio, quindi scorre da sola.
    avviaPhi() {
        this.divRisultato.innerHTML = '';
        this.divErrore.innerHTML = '';
        this.divRisultato.style.opacity = '1';
        this.divErrore.style.opacity = '0';
        this.scrivi(this.divEspr, '\\varphi = ' + PHI_TESTA);

        let n = 0;
        const conv = [];
        this.timerPhi = setInterval(() => {
            n++;
            if(n > PHI_CONVERGENTI.length) {
                clearInterval(this.timerPhi);
                this.timerPhi = null;
                // this.scrivi(this.divErrore, '\\text{i rapporti della slide 5}');
                return;
            }
            const profondita = Math.min(n, PHI_PROFONDITA_MAX);
            const coeff = new Array(profondita).fill(1);
            this.scrivi(this.divEspr,
                '\\varphi = ' + costruisci(coeff, '\\cfrac{1}{1 + \\cdots}'));

            conv.push(PHI_CONVERGENTI[n-1]);
            this.scrivi(this.divRisultato, conv.join('\\;\\; '));
        }, PHI_PASSO_MS);
    }

    setAct(act) {
        this.act = act;
        if(act === 0) { this.reset(); return; }
        if(act <= this.ultimoAttoPi) {
            if(this.timerSbarra) { clearTimeout(this.timerSbarra); this.timerSbarra = null; }
            this.divRisultato.style.opacity = '0';
            this.divErrore.style.opacity = '0';
            this.scrivi(this.divEspr, this.espressionePi(act));
        }
        else if(act === this.ultimoAttoPi + 1) this.sbarraETronca();
        else if(act === this.ultimoAttoPi + 2) this.mostraRisultato();
        else if(act === this.ultimoAttoPi + 3) this.mostraErrore();
        else if(act === this.ultimoAttoPi + 4) this.avviaPhi();
    }

    get ultimoAtto() { return this.ultimoAttoPi + 4; }   // = 12
    nextAct() { if(this.act < this.ultimoAtto) this.setAct(this.act + 1); }
    prevAct() { if(this.act > 0) this.setAct(this.act - 1); }
    onKeyDown(event) { if(event.key === '0') this.setAct(0); }

    cleanup() {
        if(this.timerPhi) clearInterval(this.timerPhi);
        if(this.timerSbarra) clearTimeout(this.timerSbarra);
        this.divs.forEach(d => d.remove());
        this.divs = [];
    }

    async end() {
        this.divs.forEach(d => { d.style.opacity = '0'; });
        return gsap.timeline().to({}, {duration: 0.4});
    }
}

let t = new ContinuedFractionsSlide();
