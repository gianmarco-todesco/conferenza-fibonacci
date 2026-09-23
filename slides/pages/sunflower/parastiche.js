import {Slide, two, center} from '../../libs/gmtlib.js';

// Le spirali del girasole, disegnate sopra la fotografia.
//
// IL PUNTO DELICATO. Un girasole vero non ha i bracci equispaziati lungo il
// giro. Se si disegnano m copie della stessa curva ruotate di 2*pi/m, a un
// certo angolo cadono perfettamente negli spazi fra i pistilli e novanta gradi
// piu' in la' passano sopra i pistilli: da lontano regge, ma in prima fila si
// vede, e su una conferenza che parla di gente che vede Fibonacci dove non c'e'
// sarebbe il modo peggiore di sbagliare.
//
// Quindi: la FORMA della curva e' condivisa (il passo e' quello, e si vede che
// e' quello), ma OGNI BRACCIO SI PORTA LA SUA FASE, misurata a mano sulla foto.
// Si misura dove il braccio taglia due cerchi di riferimento, uno interno e uno
// esterno; fra i due la correzione si interpola, e per i bracci non misurati si
// interpola sui vicini. Quello che si segue non e' un modello: sono gli errori
// che ha fatto la pianta.
//
// COME SI MISURA (modalita' regolazione, tasto  m ):
//   trascina        sposta il centro del capolino
//   q / w           passo della spirale
//   a / s           fase globale
//   z / x           numero di bracci
//   e / r           raggio del cerchio interno
//   d / f           raggio del cerchio esterno
//   clic            misura: aggancia il braccio piu' vicino sul cerchio piu'
//                   vicino, e ridisegna subito. Se aggancia quello sbagliato
//                   si vede all'istante
//   Backspace       cancella l'ultima misura
//   k               cancella tutte le misure della famiglia corrente
//   t               passa alla famiglia successiva
//   c               stampa in console ANCORAGGI e i parametri, da incollare qui
//
// I numeri di partenza vengono da tools/misura-parastiche.py (vedi il commento
// li' dentro). Il 55 e' misurato bene; il 34 e' solo un punto di partenza da
// aggiustare a occhio, perche' in questa foto quella famiglia e' debole.

const IMG = '/slides/assets/sunflower-2.png';
const IMG_W = 915, IMG_H = 1280;

// La foto sta a sinistra, piu' grande che si puo' (a 0.82 l'immagine e' alta
// 1050 dei 1080 disponibili): piu' e' grande, piu' e' facile prendere il
// braccio giusto quando si misura. A destra restano i numeri.
const SCALA   = 0.82;
const DISCO_X = -500, DISCO_Y = 0;
const TESTO_X = -40;        // dove comincia la colonna di destra

// Centro del capolino, in pixel dell'immagine. Regolabile trascinando.
const CENTRO_INIZIALE = [482.3, 641.8];

const PASSI = 160;          // punti per braccio
const COL_CERCHIO = '#ffffff';

// Una famiglia = una forma condivisa + una tabella di correzioni di fase.
// ANCORAGGI: per ogni braccio misurato, [L, deltaInterno, deltaEsterno]; un
// valore null vuol dire "su quel cerchio questo braccio non l'ho misurato".
const FAMIGLIE = [
    {
        nome: 'rossa',
        m: 34,
        colore: '#ff3b3b',
        // forma: theta(r) = (2*pi*L - fase)/m - passo*u(r)/m,  u(r) = (sqrt(r)-mu)/sd
        mu: 14.5583, sd: 2.0115,
        passo: -9, fase: -2.6414,
        rInt: 140, rEst: 250,       // i due cerchi di riferimento
        rMin: 95,  rMax: 295,       // dove si disegna
        ancoraggi: [],
    },
    {
        nome: 'blu',
        m: 55,
        colore: '#3bb0ff',
        mu: 14.5583, sd: 2.0115,
        passo: +4, fase: -2.9984,
        rInt: 140, rEst: 250,
        rMin: 95,  rMax: 295,
        ancoraggi: [],
    },
];

// Interpolazione ciclica sui bracci: i valori mancanti si prendono dai vicini
// misurati, girando intorno. Ciclica perche' il braccio m-1 e il braccio 0 sono
// vicini, e un'interpolazione lineare normale li tratterebbe come estremi.
function interpolaCiclico(valori, m) {
    const misurati = [];
    for(let L = 0; L < m; L++) if(valori[L] !== null && valori[L] !== undefined) misurati.push(L);
    if(misurati.length === 0) return new Array(m).fill(0);
    if(misurati.length === 1) return new Array(m).fill(valori[misurati[0]]);
    const out = new Array(m);
    for(let L = 0; L < m; L++) {
        if(valori[L] !== null && valori[L] !== undefined) { out[L] = valori[L]; continue; }
        let giu = 0; while(valori[(L - giu + m) % m] === null ||
                           valori[(L - giu + m) % m] === undefined) giu++;
        let su  = 0; while(valori[(L + su) % m] === null ||
                           valori[(L + su) % m] === undefined) su++;
        const a = valori[(L - giu + m) % m];
        const b = valori[(L + su) % m];
        out[L] = a + (b - a) * giu / (giu + su);
    }
    return out;
}

class ParasticheSlide extends Slide {
    constructor() {
        super("Parastiche");
    }

    initialize() {}

    start() {
        this.centro = CENTRO_INIZIALE.slice();
        this.fam = FAMIGLIE.map(f => Object.assign({}, f, {
            ancoraggi: f.ancoraggi.map(a => a.slice())
        }));
        this.regolazione = false;
        this.famCorrente = 0;
        this.act = 0;

        // Lo sprite sta fermo: e' l'overlay che si muove quando si regola il
        // centro. Se si muovesse la foto non si capirebbe piu' niente.
        this.sx = DISCO_X - (CENTRO_INIZIALE[0] - IMG_W/2) * SCALA;
        this.sy = DISCO_Y - (CENTRO_INIZIALE[1] - IMG_H/2) * SCALA;
        const sprite = two.makeSprite(IMG, this.sx, this.sy);
        sprite.scale = SCALA;
        this.mainGroup.add(sprite);

        this.gruppoOverlay = two.makeGroup();
        this.mainGroup.add(this.gruppoOverlay);
        this.gruppoChrome = two.makeGroup();
        this.mainGroup.add(this.gruppoChrome);
        this.gruppoTesti = two.makeGroup();
        this.mainGroup.add(this.gruppoTesti);

        this.ridisegna();
    }

    // --- coordinate -------------------------------------------------------
    // (u,v) in pixel dell'immagine -> coordinate della slide
    aSchermo(u, v) {
        return {x: this.sx + (u - IMG_W/2) * SCALA,
                y: this.sy + (v - IMG_H/2) * SCALA};
    }
    // il puntatore -> pixel dell'immagine
    aImmagine(clientX, clientY) {
        const c = document.getElementById('container');
        const r = c.getBoundingClientRect();
        const k = r.width / 1920;
        const x = (clientX - r.left)/k - 960;
        const y = (clientY - r.top)/k - 540;
        return {u: (x - this.sx)/SCALA + IMG_W/2,
                v: (y - this.sy)/SCALA + IMG_H/2};
    }

    // --- geometria di una famiglia ---------------------------------------
    u(f, r) { return (Math.sqrt(r) - f.mu) / f.sd; }
    forma(f, r) { return -f.passo * this.u(f, r) / f.m; }

    // Le correzioni di fase, braccio per braccio, sui due cerchi.
    correzioni(f) {
        const vi = new Array(f.m).fill(null);
        const ve = new Array(f.m).fill(null);
        f.ancoraggi.forEach(([L, di, de]) => {
            if(di !== null && di !== undefined) vi[L] = di;
            if(de !== null && de !== undefined) ve[L] = de;
        });
        return {int: interpolaCiclico(vi, f.m), est: interpolaCiclico(ve, f.m)};
    }

    braccio(f, L, corr) {
        const u1 = this.u(f, f.rInt), u2 = this.u(f, f.rEst);
        const base = (2*Math.PI*L - f.fase) / f.m;
        const vertici = [];
        for(let i = 0; i <= PASSI; i++) {
            const r = f.rMin + (f.rMax - f.rMin) * i / PASSI;
            const uu = this.u(f, r);
            // fra i due cerchi si interpola, fuori si prolunga: la correzione
            // e' lineare in u, cioe' nella stessa coordinata in cui e' lineare
            // la forma della spirale
            const t = (u2 === u1) ? 0 : (uu - u1) / (u2 - u1);
            const d = corr.int[L] + (corr.est[L] - corr.int[L]) * t;
            const th = base + this.forma(f, r) + d;
            const p = this.aSchermo(this.centro[0] + r*Math.cos(th),
                                    this.centro[1] + r*Math.sin(th));
            vertici.push(new Two.Anchor(p.x, p.y));
        }
        const path = two.makePath(vertici, false);
        // closed va rimesso a mano: il secondo argomento di makePath non basta
        // (a seconda della versione di Two.js viene letto come "open" oppure
        // ignorato quando i vertici arrivano gia' come array), e un arco chiuso
        // ricongiunge la punta con la coda sporcando il centro del fiore.
        path.closed = false;
        path.curved = false;
        path.noFill();
        path.stroke = f.colore;
        path.linewidth = 3;
        return path;
    }

    disegnaFamiglia(f) {
        const corr = this.correzioni(f);
        const g = two.makeGroup();
        for(let L = 0; L < f.m; L++) g.add(this.braccio(f, L, corr));
        this.gruppoOverlay.add(g);
        return g;
    }

    // --- disegno ----------------------------------------------------------
    svuota(gruppo) {
        while(gruppo.children.length > 0) gruppo.children[0].remove();
    }

    ridisegna() {
        this.svuota(this.gruppoOverlay);
        this.svuota(this.gruppoChrome);
        this.svuota(this.gruppoTesti);

        if(this.regolazione) {
            const f = this.fam[this.famCorrente];
            this.disegnaFamiglia(f);
            this.disegnaChrome(f);
        } else {
            this.fam.slice(0, this.act).forEach(f => this.disegnaFamiglia(f));
            this.disegnaNumeri();
        }
    }

    cerchio(r, tratteggio) {
        const c = this.aSchermo(this.centro[0], this.centro[1]);
        const k = two.makeCircle(c.x, c.y, r * SCALA);
        k.noFill();
        k.stroke = COL_CERCHIO;
        k.linewidth = 2;
        if(tratteggio) k.dashes = [8, 8];
        this.gruppoChrome.add(k);
        return k;
    }

    disegnaChrome(f) {
        this.cerchio(f.rInt, false);
        this.cerchio(f.rEst, false);
        this.cerchio(f.rMin, true);
        this.cerchio(f.rMax, true);

        // i punti misurati, per vedere cosa si e' gia' fatto
        const segna = (L, d, r) => {
            if(d === null || d === undefined) return;
            const th = (2*Math.PI*L - f.fase)/f.m + this.forma(f, r) + d;
            const p = this.aSchermo(this.centro[0] + r*Math.cos(th),
                                    this.centro[1] + r*Math.sin(th));
            const k = two.makeCircle(p.x, p.y, 7);
            k.fill = '#ffe14d'; k.stroke = '#000'; k.linewidth = 2;
            this.gruppoChrome.add(k);
        };
        f.ancoraggi.forEach(([L, di, de]) => { segna(L, di, f.rInt); segna(L, de, f.rEst); });

        const righe = [
            'REGOLAZIONE   [m] per uscire',
            '',
            'famiglia ' + f.nome + '  [t]',
            'bracci ' + f.m + '  [z/x]',
            'passo ' + f.passo.toFixed(2) + '  [q/w]',
            'fase ' + f.fase.toFixed(4) + '  [a/s]',
            'cerchi ' + f.rInt.toFixed(0) + '  [e/r]   e  ' + f.rEst.toFixed(0) + '  [d/f]',
            'centro ' + this.centro[0].toFixed(1) + ' , ' + this.centro[1].toFixed(1) + '   (trascina)',
            '',
            'misurati ' + f.ancoraggi.length + ' bracci su ' + f.m,
            '',
            'clic = misura     [Backspace] = annulla',
            '[k] = azzera      [c] = stampa',
        ];
        righe.forEach((t, i) => {
            if(t === '') return;
            const testo = two.makeText(t, TESTO_X, -330 + i*40,
                {size: 30, family: 'Noto Sans, Arial', alignment: 'left', baseline: 'middle'});
            testo.fill = 'white';
            this.gruppoChrome.add(testo);
        });
    }

    disegnaNumeri() {
        for(let i = 0; i < this.act && i < this.fam.length; i++) {
            const f = this.fam[i];
            const n = two.makeText(String(f.m), TESTO_X, -200 + i*230,
                {size: 200, weight: 'bold', family: 'Noto Sans, Arial',
                 alignment: 'left', baseline: 'middle'});
            n.fill = f.colore;
            this.gruppoTesti.add(n);
            const e = two.makeText('spirali', TESTO_X + 260, -200 + i*230,
                {size: 62, family: 'Noto Sans, Arial', alignment: 'left', baseline: 'middle'});
            e.fill = 'white';
            this.gruppoTesti.add(e);
        }
        if(this.act > this.fam.length) {
            const t = two.makeText('due numeri di Fibonacci consecutivi', TESTO_X, 290,
                {size: 54, family: 'Noto Sans, Arial', alignment: 'left', baseline: 'middle'});
            t.fill = 'white';
            this.gruppoTesti.add(t);
        }
    }

    // --- misura -----------------------------------------------------------
    // Dal clic si ricava il braccio piu' vicino e di quanto sta fuori posto.
    // L'errore esce automaticamente ridotto a +-pi/m, cioe' si aggancia sempre
    // al braccio piu' vicino: e' esattamente quello che serve.
    misura(f, u, v) {
        const dx = u - this.centro[0], dy = v - this.centro[1];
        const r = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
        const interno = Math.abs(r - f.rInt) <= Math.abs(r - f.rEst);
        const rr = interno ? f.rInt : f.rEst;
        const g = (th - this.forma(f, rr)) * f.m + f.fase;
        let L = Math.round(g / (2*Math.PI));
        const delta = (g - 2*Math.PI*L) / f.m;
        L = ((L % f.m) + f.m) % f.m;

        let voce = f.ancoraggi.find(a => a[0] === L);
        if(!voce) { voce = [L, null, null]; f.ancoraggi.push(voce); }
        voce[interno ? 1 : 2] = delta;
        this.ultimaMisura = {voce: voce, quale: interno ? 1 : 2};
    }

    annullaUltima(f) {
        const um = this.ultimaMisura;
        if(!um) return;
        um.voce[um.quale] = null;
        if(um.voce[1] === null && um.voce[2] === null)
            f.ancoraggi.splice(f.ancoraggi.indexOf(um.voce), 1);
        this.ultimaMisura = null;
    }

    stampa(f) {
        const righe = f.ancoraggi.slice().sort((a, b) => a[0] - b[0]).map(
            a => '            [' + a[0] + ', ' +
                 (a[1] === null ? 'null' : a[1].toFixed(5)) + ', ' +
                 (a[2] === null ? 'null' : a[2].toFixed(5)) + '],');
        console.log(
            "        nome: '" + f.nome + "',\n" +
            '        m: ' + f.m + ',\n' +
            '        mu: ' + f.mu + ', sd: ' + f.sd + ',\n' +
            '        passo: ' + f.passo + ', fase: ' + f.fase.toFixed(4) + ',\n' +
            '        rInt: ' + f.rInt + ', rEst: ' + f.rEst + ',\n' +
            '        rMin: ' + f.rMin + ', rMax: ' + f.rMax + ',\n' +
            '        ancoraggi: [\n' + righe.join('\n') + '\n        ],');
        console.log('CENTRO_INIZIALE = [' + this.centro[0].toFixed(1) + ', ' +
                    this.centro[1].toFixed(1) + '];');
    }

    // --- comandi ----------------------------------------------------------
    onPointerDown(x, y, e) {
        this.trascinato = false;
        this.puntatore = {x: x, y: y};
    }
    onPointerDrag(x, y, dx, dy, e) {
        if(!this.regolazione) return;
        this.trascinato = true;
        const c = document.getElementById('container');
        const k = c.getBoundingClientRect().width / 1920;
        this.centro[0] += dx / k / SCALA;
        this.centro[1] += dy / k / SCALA;
        this.ridisegna();
    }
    onPointerUp(e) {
        if(!this.regolazione || this.trascinato || !this.puntatore) return;
        const p = this.aImmagine(this.puntatore.x, this.puntatore.y);
        this.misura(this.fam[this.famCorrente], p.u, p.v);
        this.ridisegna();
    }

    onKeyDown(event) {
        const f = this.fam[this.famCorrente];
        const k = event.key;
        if(k === 'm') { this.regolazione = !this.regolazione; this.ridisegna(); return; }
        if(!this.regolazione) {
            if(k === '0') this.setAct(0);
            return;
        }
        const tasti = {
            q: () => f.passo -= 0.25,   w: () => f.passo += 0.25,
            a: () => f.fase  -= 0.02,   s: () => f.fase  += 0.02,
            z: () => f.m = Math.max(3, f.m - 1), x: () => f.m += 1,
            e: () => f.rInt -= 2,       r: () => f.rInt += 2,
            d: () => f.rEst -= 2,       f: () => f.rEst += 2,
            t: () => this.famCorrente = (this.famCorrente + 1) % this.fam.length,
            k: () => { f.ancoraggi = []; this.ultimaMisura = null; },
            c: () => this.stampa(f),
            Backspace: () => this.annullaUltima(f),
        };
        if(tasti[k]) { tasti[k](); this.ridisegna(); }
    }

    // --- atti -------------------------------------------------------------
    get ultimoAtto() { return this.fam.length + 1; }
    setAct(a) { this.act = a; this.ridisegna(); }
    nextAct() { if(!this.regolazione && this.act < this.ultimoAtto) this.setAct(this.act + 1); }
    prevAct() { if(!this.regolazione && this.act > 0) this.setAct(this.act - 1); }

    cleanup() {}
    async end() {}
}

let t = new ParasticheSlide();
