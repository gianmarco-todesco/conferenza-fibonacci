import {Slide, two, center} from '../../libs/gmtlib.js';

// Douady & Couder, 1992: la fillotassi dalla materia inorganica.
//
// PERCHE' QUESTA SLIDE ESISTE. Tutte le altre slide sul girasole l'angolo
// aureo lo IMPONGONO: sta scritto come costante nel codice, e il pubblico deve
// crederci. Questa lo fa USCIRE. Gocce di ferrofluido cadono al centro di un
// piatto d'olio a intervalli regolari, un campo magnetico le spinge verso il
// bordo, e ogni goccia respinge le altre. Nient'altro: niente biologia, niente
// DNA, niente disegno. E viene fuori 137,5 gradi.
//
// Senza questo ponte il finale della conferenza sarebbe esattamente la mistica
// che la conferenza passa mezz'ora a smontare: "le piante scelgono l'angolo
// aureo perche' e' il piu' efficiente". Le piante non scelgono niente.
//
// IL MODELLO e' quello numerico dell'articolo, non un'imitazione. A ogni passo
// una goccia nuova nasce a raggio 1; quelle gia' presenti si sono allontanate,
// e quella nata j passi fa sta a exp(G*j). La nuova si mette nell'angolo che
// minimizza l'energia di repulsione, somma di 1/d^K. Un solo parametro:
//
//    G = quanto in fretta arrivano le gocce rispetto a quanto si allontanano.
//
// DUE COSE VERIFICATE PRIMA DI SCRIVERE, e che cambiano la regia:
//
//  1. Il risultato NON dipende dai dettagli della repulsione: con K = 3 e con
//     K = 6 il punto fisso e' lo stesso a meno di 0,05 gradi. Se dipendesse,
//     saremmo noi ad aver scelto la risposta.
//  2. Partendo di colpo da un G piccolo il sistema cade su un ramo DIVERSO -
//     a G = 0,12 esce 101,8 gradi, che e' il ramo di Lucas. Il ramo di
//     Fibonacci lo si trova solo abbassando G lentamente. E' fisica vera, ed e'
//     il motivo per cui l'atto 2 fa scendere G da solo invece di saltare al
//     valore giusto.
//
// Il punto fisso misurato scendendo fino a G = 0,02 e' 137,48 gradi, contro
// 137,5078 dell'angolo aureo. La differenza residua e' del modello, non un
// errore di conto: a G finito il punto fisso non e' esattamente 360/phi^2.

const DUEPI = Math.PI * 2;
const ANGOLO_AUREO = 360 / Math.pow((1 + Math.sqrt(5)) / 2, 2);   // 137,5078

// --- il piatto sullo schermo -----------------------------------------------
const PIATTO_X = -440, PIATTO_Y = 0;
const R_DENTRO = 22, R_FUORI = 430;
const ETA_MAX  = 62;            // quante gocce restano nel piatto
const R_GOCCIA = 9;

// Il raggio sullo schermo cresce LINEARMENTE con l'eta' della goccia, mentre
// nel modello cresce come exp(G*eta). Non e' una liberta': e' il piatto vero,
// dove il gradiente magnetico porta le gocce fuori a velocita' circa costante.
// Le due cose differiscono per un logaritmo, che non tocca gli angoli - e gli
// angoli sono tutto il contenuto di questa slide.
function raggioSchermo(eta) {
    return R_DENTRO + (R_FUORI - R_DENTRO) * Math.min(eta, ETA_MAX) / ETA_MAX;
}

// --- il modello -------------------------------------------------------------
const K = 3;                    // esponente della repulsione (il risultato non ci dipende)
const CAMPIONI = 1080;          // angoli provati per ogni goccia nuova
const MEMORIA  = 40;            // quante gocce contano nella somma
const T_GOCCIA = 0.10;          // secondi fra una goccia e l'altra

const G_ALTO  = 1.10;           // gocce rade: escono a 180 gradi
const G_BASSO = 0.02;           // gocce fitte: 137,5
const GOCCE_DISCESA = 80;       // in quante gocce G scende da G_ALTO a G_BASSO

const COL_GOCCIA = '#ffb03a';
const COL_SPIRALE_A = '#ff5a5a';
const COL_SPIRALE_B = '#5ad2ff';
// Le due famiglie di parastiche da disegnare in chiusura: si collega ogni
// goccia a quella nata K passi prima. Numeri di Fibonacci, ovviamente.
const FAMIGLIE = [5, 8];

const TESTO_X = 60;

class DouadyCouderSlide extends Slide {
    constructor() { super("DouadyCouder"); }

    initialize() {}

    start() {
        this.gruppoApparato = two.makeGroup();
        this.mainGroup.add(this.gruppoApparato);
        this.gruppoSpirali = two.makeGroup();
        this.mainGroup.add(this.gruppoSpirali);
        this.gruppoGocce = two.makeGroup();
        this.mainGroup.add(this.gruppoGocce);
        this.gruppoTesti = two.makeGroup();
        this.mainGroup.add(this.gruppoTesti);

        this.act = 0;
        this.reset();
        this.ridisegna();
    }

    reset() {
        this.gocce = [];            // {nato, theta}
        this.passo = 0;
        this.frazione = 0;
        this.G = G_ALTO;
        this.discesa = false;
        this.angolo = null;         // ultimo angolo di divergenza misurato
        this.girando = false;
    }

    // --- simulazione --------------------------------------------------------
    // L'angolo che minimizza la repulsione dalle gocce gia' presenti. Si prova
    // tutto il giro a passi fitti e poi si raffina con una parabola sui tre
    // campioni attorno al minimo: senza il raffinamento il numero sullo schermo
    // sarebbe quantizzato a un terzo di grado, e si leggerebbe 137,0 invece di
    // 137,5 - cioe' proprio la cifra che la slide deve far vedere.
    nuovoAngolo() {
        if(this.gocce.length === 0) return 0;
        const E = new Float64Array(CAMPIONI);
        const da = DUEPI / CAMPIONI;
        const vicine = this.gocce.slice(-MEMORIA);
        for(let v = 0; v < vicine.length; v++) {
            const g = vicine[v];
            const R = Math.exp(this.G * (this.passo - g.nato));
            const uno_piu = 1 + R * R, due = 2 * R;
            const ct = Math.cos(g.theta), st = Math.sin(g.theta);
            for(let j = 0; j < CAMPIONI; j++) {
                const a = j * da;
                // cos(a - theta) senza chiamare cos due volte per goccia
                const c = Math.cos(a) * ct + Math.sin(a) * st;
                const d2 = Math.max(uno_piu - due * c, 1e-12);
                E[j] += 1 / (d2 * Math.sqrt(d2));      // d^-3
            }
        }
        let j = 0;
        for(let i = 1; i < CAMPIONI; i++) if(E[i] < E[j]) j = i;
        const y0 = E[(j - 1 + CAMPIONI) % CAMPIONI], y1 = E[j], y2 = E[(j + 1) % CAMPIONI];
        const den = y0 - 2*y1 + y2;
        const d = Math.abs(den) > 1e-18 ? 0.5 * (y0 - y2) / den : 0;
        return ((j + d) * da) % DUEPI;
    }

    passoSimulazione() {
        const th = this.nuovoAngolo();
        if(this.gocce.length > 0) {
            let d = (th - this.gocce[this.gocce.length - 1].theta) % DUEPI;
            if(d < 0) d += DUEPI;
            this.angolo = Math.min(d, DUEPI - d) * 180 / Math.PI;
        }
        this.gocce.push({nato: this.passo, theta: th});
        this.passo++;
        while(this.gocce.length && this.passo - this.gocce[0].nato > ETA_MAX)
            this.gocce.shift();

        // La discesa di G e' geometrica e lenta: saltare a un G piccolo fa
        // cadere il sistema su un altro ramo (vedi il commento in testa).
        if(this.discesa && this.G > G_BASSO)
            this.G = Math.max(G_BASSO, this.G * Math.pow(G_BASSO/G_ALTO, 1/GOCCE_DISCESA));
    }

    update(time, deltaTime) {
        if(!this.girando) return;
        this.frazione += (deltaTime / 1000) / T_GOCCIA;
        let quante = 0;
        while(this.frazione >= 1 && quante < 4) {   // tetto: se la scheda torna
            this.frazione -= 1;                     // da nascosta non recupera
            this.passoSimulazione();                // mille passi in un colpo
            quante++;
        }
        if(this.frazione >= 1) this.frazione = 0;
        this.ridisegna();
    }

    // --- disegno ------------------------------------------------------------
    svuota(g) { while(g.children.length > 0) g.children[0].remove(); }

    posizione(g) {
        const eta = this.passo + this.frazione - g.nato;
        const r = raggioSchermo(eta);
        return {x: PIATTO_X + r * Math.cos(g.theta),
                y: PIATTO_Y + r * Math.sin(g.theta)};
    }

    ridisegna() {
        this.svuota(this.gruppoGocce);
        this.svuota(this.gruppoSpirali);
        this.svuota(this.gruppoTesti);
        this.svuota(this.gruppoApparato);

        if(this.act === 0) { this.disegnaApparato(); this.disegnaRegola(); return; }

        // il bordo del piatto
        const piatto = two.makeCircle(PIATTO_X, PIATTO_Y, R_FUORI + 26);
        piatto.noFill();
        piatto.stroke = 'rgba(255,255,255,0.35)';
        piatto.linewidth = 3;
        this.gruppoApparato.add(piatto);

        if(this.act >= 3) this.disegnaParastiche();

        this.gocce.forEach(g => {
            const p = this.posizione(g);
            const c = two.makeCircle(p.x, p.y, R_GOCCIA);
            c.fill = COL_GOCCIA;
            c.stroke = '#7a3c00';
            c.linewidth = 2;
            this.gruppoGocce.add(c);
        });

        this.disegnaLettura();
    }

    testo(t, x, y, size, colore, grassetto) {
        const o = two.makeText(t, x, y, {size: size,
            weight: grassetto ? 'bold' : 'normal',
            family: 'Noto Sans, Arial', alignment: 'left', baseline: 'middle'});
        o.fill = colore || 'white';
        this.gruppoTesti.add(o);
        return o;
    }

    disegnaRegola() {
        this.testo('Douady & Couder, 1992', TESTO_X, -330, 46, 'white', true);
        const righe = [
            'Gocce di ferrofluido cadono al centro',
            'di un piatto d’olio, a intervalli regolari.',
            '',
            'Un campo magnetico le spinge verso il bordo.',
            '',
            'Ogni goccia respinge le altre.',
        ];
        righe.forEach((r, i) => { if(r) this.testo(r, TESTO_X, -230 + i*54, 38); });
        this.testo('Nient’altro.', TESTO_X, 120, 44, '#ffd24d', true);
        this.testo('Niente biologia, niente DNA, niente disegno.', TESTO_X, 180, 34);
    }

    // Sezione del piatto: si vede che e' un esperimento con la materia, non una
    // simulazione. Disegnato e non fotografato: le foto dell'articolo hanno un
    // copyright, e questa slide si proietta in pubblico.
    disegnaApparato() {
        const cx = PIATTO_X, cy = -40, semi = 360, h = 90;
        const g = this.gruppoApparato;
        const aggiungi = o => { g.add(o); return o; };

        // i due magneti
        [[-1, -230], [1, 150]].forEach(([verso, y]) => {
            const m = aggiungi(two.makeRectangle(cx, y, semi*2.1, 26));
            m.fill = '#9aa3b0'; m.stroke = '#59606b'; m.linewidth = 2;
        });
        // il campo, piu' fitto verso il bordo: e' il gradiente che spinge fuori
        for(let i = -5; i <= 5; i++) {
            const x = cx + i * semi/5;
            const l = aggiungi(two.makeLine(x, -204, x, 124));
            l.stroke = 'rgba(120,180,255,' + (0.15 + 0.07*Math.abs(i)) + ')';
            l.linewidth = 2 + Math.abs(i) * 0.6;
        }
        // l'olio
        const olio = aggiungi(two.makeRectangle(cx, cy + h/2, semi*2, h));
        olio.fill = 'rgba(90,160,220,0.28)';
        olio.stroke = 'rgba(160,210,255,0.8)'; olio.linewidth = 3;

        // il capillare e la goccia che cade
        const cap = aggiungi(two.makeRectangle(cx, cy - 120, 12, 120));
        cap.fill = '#d8dde4'; cap.stroke = '#8b929c'; cap.linewidth = 2;
        const cade = aggiungi(two.makeCircle(cx, cy - 42, 11));
        cade.fill = COL_GOCCIA; cade.stroke = '#7a3c00'; cade.linewidth = 2;

        // le gocce sulla superficie, che scivolano verso il bordo
        [-300, -215, -130, -55, 55, 130, 215, 300].forEach(dx => {
            const d = aggiungi(two.makeCircle(cx + dx, cy, 11));
            d.fill = COL_GOCCIA; d.stroke = '#7a3c00'; d.linewidth = 2;
            const f = aggiungi(two.makeLine(cx + dx + Math.sign(dx)*18, cy,
                                            cx + dx + Math.sign(dx)*40, cy));
            f.stroke = '#ffd24d'; f.linewidth = 3;
        });
    }

    disegnaParastiche() {
        FAMIGLIE.forEach((k, i) => {
            for(let j = k; j < this.gocce.length; j++) {
                const a = this.posizione(this.gocce[j - k]);
                const b = this.posizione(this.gocce[j]);
                const l = two.makeLine(a.x, a.y, b.x, b.y);
                l.stroke = i === 0 ? COL_SPIRALE_A : COL_SPIRALE_B;
                l.linewidth = 3;
                this.gruppoSpirali.add(l);
            }
        });
    }

    disegnaLettura() {
        this.testo('Douady & Couder, 1992', TESTO_X, -400, 38, 'rgba(255,255,255,0.75)');
        this.testo('angolo fra una goccia e la successiva', TESTO_X, -300, 34);
        const a = this.angolo === null ? '—' :
                  this.angolo.toFixed(1).replace('.', ',') + '°';
        this.testo(a, TESTO_X, -180, 150, '#ffd24d', true);

        this.testo('G = ' + this.G.toFixed(3).replace('.', ',') +
                   (this.discesa && this.G > G_BASSO ? '   (scende)' : ''),
                   TESTO_X, -60, 32, 'rgba(255,255,255,0.75)');
        this.testo(this.girando ? 'gocce: ' + this.gocce.length : 'ferma  [spazio]',
                   TESTO_X, -16, 32, 'rgba(255,255,255,0.75)');

        if(this.act >= 2 && this.G <= G_BASSO * 1.02) {
            this.testo('360° / φ² = ' + ANGOLO_AUREO.toFixed(1).replace('.', ',') +
                       '°', TESTO_X, 70, 46, '#ffd24d', true);
        }
        if(this.act >= 3) {
            this.testo('Le piante non scelgono niente.', TESTO_X, 190, 44, 'white', true);
            this.testo('Lo fa la repulsione.', TESTO_X, 250, 44, 'white', true);
        }
    }

    // --- atti ---------------------------------------------------------------
    get ultimoAtto() { return 3; }

    setAct(a) {
        this.act = a;
        if(a === 0) { this.girando = false; this.reset(); }
        else if(a === 1) { this.girando = true; this.discesa = false; }
        else if(a === 2) { this.girando = true; this.discesa = true; }
        this.ridisegna();
    }
    nextAct() { if(this.act < this.ultimoAtto) this.setAct(this.act + 1); }
    prevAct() { if(this.act > 0) this.setAct(this.act - 1); }

    onKeyDown(event) {
        const k = event.key;
        if(k === '0') { this.setAct(0); return; }
        if(k === ' ') { this.girando = !this.girando; this.ridisegna(); return; }
        // A mano G si muove di poco per volta: un salto secco fa cadere il
        // sistema su un altro ramo. E' una cosa che vale la pena far vedere -
        // premendo forte si finisce a 99,5 gradi, che e' il ramo di Lucas.
        if(k === 'q') { this.G = Math.min(G_ALTO, this.G * 1.12); this.ridisegna(); }
        if(k === 'w') { this.G = Math.max(0.005, this.G * 0.89); this.ridisegna(); }
        if(k === 'r') { this.reset(); this.girando = this.act > 0; this.ridisegna(); }
    }

    cleanup() { this.girando = false; }
    async end() { this.girando = false; }
}

let t = new DouadyCouderSlide();
