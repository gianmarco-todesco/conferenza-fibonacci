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
// Il piatto sta alzato e un filo stretto perche' sotto ci deve stare la
// didascalia: col bordo a y = 456 il cerchio passava dentro le lettere.
const PIATTO_X = -440, PIATTO_Y = -50;
const R_DENTRO = 22, R_FUORI = 420;
// Quante gocce stanno nel piatto NON e' una costante: e' il significato stesso
// di G. Se le gocce arrivano di rado rispetto a quanto in fretta si allontanano
// (G grande), nel piatto ce ne sono poche; se arrivano fitte, il piatto si
// riempie. Tenendolo costante le gocce a G alto finivano impacchettate in una
// riga solida, che non e' quello che si vede nel piatto vero.
const ETA_MIN  = 14, ETA_MAX = 62;
const ETA_K    = 1.30;          // eta' massima ~ ETA_K/G, poi si taglia
const R_GOCCIA = 9;

// Il raggio sullo schermo cresce LINEARMENTE con l'eta' della goccia, mentre
// nel modello cresce come exp(G*eta). Non e' una liberta': e' il piatto vero,
// dove il gradiente magnetico porta le gocce fuori a velocita' circa costante.
// Le due cose differiscono per un logaritmo, che non tocca gli angoli - e gli
// angoli sono tutto il contenuto di questa slide.
function raggioSchermo(eta, etaMax) {
    return R_DENTRO + (R_FUORI - R_DENTRO) * Math.min(eta, etaMax) / etaMax;
}

// --- il modello -------------------------------------------------------------
const K = 3;                    // esponente della repulsione (il risultato non ci dipende)
const CAMPIONI = 1080;          // angoli provati per ogni goccia nuova
const MEMORIA  = 40;            // quante gocce contano nella somma
const T_GOCCIA = 0.10;          // secondi fra una goccia e l'altra

const G_ALTO  = 1.10;           // gocce rade: escono a 180 gradi
const G_BASSO = 0.02;           // gocce fitte: 137,5
const GOCCE_DISCESA = 80;       // in quante gocce G scende da G_ALTO a G_BASSO

// IL RUMORE, e perche' porta con se' il rilassamento.
//
// Senza rumore la goccia cade esattamente nel minimo, il 180 e il 137,5 escono
// esatti alla seconda cifra e le file sono dritte come un righello: sembra
// finto, e l'esperimento vero ha dispersione.
//
// Ma il rumore da solo distrugge tutto: misurato, a mezzo grado il sistema
// regge e a un grado perde il ramo e finisce a vagare. Il motivo e' una
// mancanza del modello, non del rumore - una volta piazzata, la goccia qui
// resta congelata per sempre, quindi gli errori si accumulano lungo la catena
// invece di correggersi. Nel piatto vero le gocce continuano a respingersi
// dopo essere cadute e il reticolo si riassesta.
//
// Quindi: rumore sulla caduta E rilassamento di tutte le gocce a ogni passo.
// Con i due insieme il sistema regge fino a due gradi. A 1,5 la lettura finale
// e' 137,65 +- 1,15 su quattro semi diversi, contro 137,5078 dell'aureo.
const RUMORE_GRADI = 1.5;
const RILASSA_GIRI = 3;
const RILASSA_PASSO = 0.25;     // gradi per giro
const SEME = 20250925;          // fisso: la prova generale e' la replica
const FINESTRA = 25;            // su quante gocce si media la lettura

const COL_GOCCIA = '#ffb03a';
const COL_SPIRALE_A = '#ff5a5a';
const COL_SPIRALE_B = '#5ad2ff';
// Le due famiglie di parastiche da disegnare in chiusura: si collega ogni
// goccia a quella nata K passi prima. Numeri di Fibonacci, ovviamente.
const FAMIGLIE = [5, 8];

const TESTO_X = 60;

// Generatore riproducibile: con un seme fisso la corsa e' sempre la stessa, e
// quello che si vede alla prova generale e' quello che si vede in sala.
function generatore(seme) {
    let s = seme >>> 0;
    return function() {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

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

    // Quante gocce ci stanno adesso, dato il G di adesso.
    etaMax() {
        return Math.round(Math.min(ETA_MAX, Math.max(ETA_MIN, ETA_K / this.G)));
    }

    reset() {
        this.gocce = [];            // {nato, theta}
        this.passo = 0;
        this.frazione = 0;
        this.G = G_ALTO;
        this.discesa = false;
        this.angolo = null;         // media degli ultimi angoli di divergenza
        this.dispersione = 0;
        this.storia = [];
        this.caso = generatore(SEME);
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

    // Gauss da due uniformi: serve solo qui, non vale la pena di piu'.
    gauss() {
        const u = Math.max(this.caso(), 1e-12), v = this.caso();
        return Math.sqrt(-2*Math.log(u)) * Math.cos(DUEPI*v);
    }

    // Le gocce gia' cadute si riassestano: ognuna scivola di un passo fisso
    // verso il basso dell'energia. E' quello che fanno nel piatto, ed e' cio'
    // che permette al reticolo di assorbire il rumore invece di sfasciarsi.
    rilassa() {
        const n = this.gocce.length;
        if(n < 2) return;
        const R = new Float64Array(n), T = new Float64Array(n);
        for(let i = 0; i < n; i++) {
            R[i] = Math.exp(this.G * (this.passo - this.gocce[i].nato));
            T[i] = this.gocce[i].theta;
        }
        const passo = RILASSA_PASSO * Math.PI / 180;
        const g = new Float64Array(n);
        for(let giro = 0; giro < RILASSA_GIRI; giro++) {
            for(let i = 0; i < n; i++) {
                let gi = 0;
                for(let j = 0; j < n; j++) {
                    if(i === j) continue;
                    const dif = T[i] - T[j];
                    const d2 = R[i]*R[i] + R[j]*R[j] - 2*R[i]*R[j]*Math.cos(dif);
                    if(!(d2 > 1e-12)) continue;
                    // -K * r_i r_j sin(dif) / d2^(K/2+1), con K = 3
                    gi -= 3 * R[i] * R[j] * Math.sin(dif) / (d2 * d2 * Math.sqrt(d2));
                }
                g[i] = gi;
            }
            for(let i = 0; i < n; i++) T[i] -= passo * Math.sign(g[i]);
        }
        for(let i = 0; i < n; i++) this.gocce[i].theta = T[i];
    }

    passoSimulazione() {
        let th = this.nuovoAngolo();
        if(this.rumore !== false) th += (RUMORE_GRADI * Math.PI / 180) * this.gauss();
        if(this.gocce.length > 0) {
            let d = (th - this.gocce[this.gocce.length - 1].theta) % DUEPI;
            if(d < 0) d += DUEPI;
            this.storia.push(Math.min(d, DUEPI - d) * 180 / Math.PI);
            if(this.storia.length > FINESTRA) this.storia.shift();
            // Con il rumore il singolo angolo balla: quello che si proietta e'
            // una misura, media e dispersione, come si farebbe sui dati veri.
            const m = this.storia.reduce((a, b) => a + b, 0) / this.storia.length;
            this.angolo = m;
            this.dispersione = Math.sqrt(
                this.storia.reduce((a, b) => a + (b - m) * (b - m), 0) / this.storia.length);
        }
        this.gocce.push({nato: this.passo, theta: th});
        this.passo++;
        const eMax = this.etaMax();
        while(this.gocce.length && this.passo - this.gocce[0].nato > eMax)
            this.gocce.shift();
        if(this.rumore !== false) this.rilassa();

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
        const r = raggioSchermo(eta, this.etaMax());
        return {x: PIATTO_X + r * Math.cos(g.theta),
                y: PIATTO_Y + r * Math.sin(g.theta)};
    }

    ridisegna() {
        this.svuota(this.gruppoGocce);
        this.svuota(this.gruppoSpirali);
        this.svuota(this.gruppoTesti);
        this.svuota(this.gruppoApparato);

        // il bordo del piatto, sempre: e' l'unica immagine della slide
        const piatto = two.makeCircle(PIATTO_X, PIATTO_Y, R_FUORI + 26);
        piatto.noFill();
        piatto.stroke = 'rgba(255,255,255,0.35)';
        piatto.linewidth = 3;
        this.gruppoApparato.add(piatto);
        this.disegnaDidascalia();

        if(this.act === 0) { this.disegnaRegola(); return; }
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

    // La didascalia sta sotto l'unica immagine della slide, e dice che dietro
    // c'e' un esperimento vero: quello che si vede sopra e' la simulazione del
    // modello dell'articolo, e va detto invece che lasciato capire.
    disegnaDidascalia() {
        this.testo('Douady & Couder, 1992: gocce di ferrofluido in un piatto d’olio,',
                   -900, 452, 30, 'rgba(255,255,255,0.7)');
        this.testo('spinte verso il bordo da un campo magnetico. Qui il loro modello numerico.',
                   -900, 490, 30, 'rgba(255,255,255,0.7)');
    }

    disegnaRegola() {
        const righe = [
            'Una goccia cade al centro,',
            'a intervalli regolari.',
            '',
            'Viene spinta verso il bordo.',
            '',
            'Respinge le altre gocce.',
        ];
        righe.forEach((r, i) => { if(r) this.testo(r, TESTO_X, -250 + i*56, 42); });
        this.testo('Nient’altro.', TESTO_X, 110, 48, '#ffd24d', true);
        this.testo('Niente biologia, niente DNA, niente disegno.', TESTO_X, 175, 34);
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
        this.testo('angolo fra una goccia e la successiva', TESTO_X, -340, 34);
        this.testo('media sulle ultime ' + FINESTRA + ' gocce', TESTO_X, -300, 28,
                   'rgba(255,255,255,0.6)');
        const a = this.angolo === null ? '—' :
                  this.angolo.toFixed(1).replace('.', ',') + '°';
        const n = this.testo(a, TESTO_X, -190, 150, '#ffd24d', true);
        if(this.angolo !== null && this.rumore !== false) {
            // Con il rumore quello che si proietta e' una misura, non un
            // valore: senza la dispersione accanto sarebbe una cifra finta.
            this.testo('± ' + this.dispersione.toFixed(1).replace('.', ',') + '°',
                       TESTO_X + 545, -150, 54, '#ffd24d');
        }

        this.testo('G = ' + this.G.toFixed(3).replace('.', ',') +
                   (this.discesa && this.G > G_BASSO ? '   (scende)' : ''),
                   TESTO_X, -60, 32, 'rgba(255,255,255,0.75)');
        this.testo(this.girando ? 'gocce: ' + this.gocce.length : 'ferma  [spazio]',
                   TESTO_X, -16, 32, 'rgba(255,255,255,0.75)');

        // I 180 gradi non sono un preambolo strano: sono la fillotassi distica,
        // due file opposte, che e' la disposizione delle graminacee. Lo stesso
        // modello, cambiando un solo parametro, da' due disposizioni che
        // esistono davvero in natura.
        if(this.angolo !== null && this.angolo > 174) {
            this.testo('due file opposte: è la fillotassi distica,', TESTO_X, 70, 34);
            this.testo('quella delle graminacee.', TESTO_X, 112, 34);
        }
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
        // Il rumore si puo' spegnere: serve alla prova generale per vedere che
        // il punto fisso e' lo stesso, e non un effetto del rumore.
        if(k === 'n') { this.rumore = this.rumore === false; this.ridisegna(); }
    }

    cleanup() { this.girando = false; }
    async end() { this.girando = false; }
}

let t = new DouadyCouderSlide();
