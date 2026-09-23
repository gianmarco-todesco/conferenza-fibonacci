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
// COME FUNZIONA. La forma della curva e' condivisa: il passo e' quello, e si
// vede che e' quello. Quello che cambia braccio per braccio e' la fase, e la
// fase la si governa con poche MANIGLIE invece che braccio per braccio:
//
//   - su ciascun cerchio di riferimento ci sono N maniglie (di solito 6), su
//     bracci scelti piu' o meno equidistanti: per m = 34 e N = 6 sono i bracci
//     0, 6, 11, 17, 23, 28;
//   - ogni maniglia dice a che angolo QUEL braccio taglia QUEL cerchio, e si
//     trascina con il mouse finche' non cade dove cade davvero sulla foto;
//   - i bracci in mezzo interpolano linearmente fra le due maniglie che li
//     racchiudono, ciclicamente (fra l'ultima e la prima si passa dal giro);
//   - fra i due cerchi la correzione si interpola, fuori si prolunga.
//
// Quello che si segue non e' un modello: sono gli errori che ha fatto la
// pianta. Con due cerchi le maniglie sono 12, ed e' quella dozzina di numeri a
// essere la parametrizzazione della slide.
//
// COMANDI (modalita' regolazione, tasto  m ):
//   trascina dentro il cerchietto centrale   sposta il centro del capolino
//   trascina fuori                           afferra la maniglia piu' vicina
//                                            e la porta dove punti
//   q / w   passo        a / s   fase globale
//   z / x   numero di bracci     g / h   numero di maniglie per cerchio
//   e / r   raggio del cerchio interno       d / f   raggio del cerchio esterno
//   t       famiglia successiva
//   k       rimette le maniglie equispaziate
//   c       stampa in console la parametrizzazione, da incollare qui sotto
//
// Cambiando il numero di bracci o di maniglie le maniglie si rimettono
// equispaziate: gli angoli vecchi si riferivano ad altri bracci e tenerli
// sarebbe peggio che rifarli.
//
// I numeri di partenza vengono da tools/misura-parastiche.py, girato su questa
// foto. Il 55 e' misurato bene (ampiezza 0.30, fino a 0.53 sulla corona
// esterna); il 34 e' debole (0.11) ed e' solo un punto di partenza. Se non si
// riesce a farlo cadere sui fiori, il candidato buono e' 89: su questa foto ha
// ampiezza 0.25, e 55 e 89 sono Fibonacci consecutivi come 34 e 55. Si cambia
// con [z/x].

const IMG = '/slides/assets/sunflower-1.png';
const IMG_W = 958, IMG_H = 958;

// La foto sta a sinistra, piu' grande che si puo': piu' e' grande, piu' e'
// facile prendere la maniglia giusta. A destra restano i numeri. Il capolino
// non e' al centro dell'immagine, quindi lo sprite finisce spostato.
const SCALA   = 0.88;
const DISCO_X = -500, DISCO_Y = 0;
const TESTO_X = 40;

// Centro del capolino, in pixel dell'immagine.
const CENTRO_INIZIALE = [424.1, 508.3];

// Si sposta il centro solo cliccando ben dentro il cerchio interno: piu' in la'
// il clic significa "afferra una maniglia", e le due cose non devono litigare.
const FRAZIONE_CENTRO = 0.55;

const PASSI = 160;
const COL_CERCHIO  = '#ffffff';
const COL_MANIGLIA = '#ffe14d';

// Regia. La prima famiglia entra un braccio per volta, al ritmo di chi conta
// ad alta voce; la seconda tutta insieme in dissolvenza, perche' li' il numero
// non si conta piu', si guarda.
const T_BRACCIO   = 0.22;   // secondi fra un braccio e il successivo
const T_ENTRATA   = 0.15;   // quanto ci mette un braccio a comparire
const T_FADE      = 1.30;   // dissolvenza della seconda famiglia
const T_PAUSA     = 0.70;   // dopo l'ultimo numero, prima di togliere i pallini
const T_VIA_NUMERI = 0.90;
const NUMERO_R    = 24;     // raggio del pallino in fondo all'arco
const NUMERO_FUORI = 22;    // di quanto sta oltre la fine dell'arco, in px foto

// Una famiglia = una forma condivisa + gli angoli delle maniglie.
// controlli.int / controlli.est: un angolo (radianti) per maniglia. Vuoti =
// "mettile equispaziate". Il tasto c stampa questo blocco gia' formattato.
const FAMIGLIE = [
    {
        nome: 'rossa',
        colore: '#ff3b3b',
        m: 34,
        mu: 15.6878, sd: 2.0212,
        passo: -12, fase: -0.8762,
        rInt: 180, rEst: 300,
        rMin: 110, rMax: 350,
        controlli: {n: 12,
            // bracci [0,3,6,9,11,14,17,20,23,26,28,31]
            int: [-0.37086, 0.26765, 0.71060, 1.21599, 1.57825, 2.05957, 2.77073, -2.90355, -2.28760, -1.74823, -1.38014, -0.90606],
            est: [0.31087, 0.74529, 1.32651, 1.82349, 2.18502, 2.82955, -2.78393, -2.23354, -1.66785, 5.11566, -0.83079, -0.20426]
        }
    },
    /*
    {
        nome: 'rossa-old',
        m: 34,
        colore: '#ff3b3b',
        // forma: theta(r) = (2*pi*L - fase)/m - passo*u(r)/m,  u(r) = (sqrt(r)-mu)/sd
        mu: 15.6878, sd: 2.0212,
        passo: -12, fase: -0.8762,
        rInt: 180, rEst: 300,
        rMin: 110, rMax: 350,
        controlli: {n: 8, int: [], est: []},
    },*/
    /*{
        nome: 'blu-old',
        m: 55,
        colore: '#3bb0ff',
        mu: 15.6878, sd: 2.0212,
        passo: +9, fase: -2.7222,
        rInt: 180, rEst: 300,
        rMin: 110, rMax: 350,
        controlli: {n: 8, int: [], est: []},
    },*/
    {
        nome: 'blu',
        m: 55,
        colore: '#3bb0ff',
        mu: 15.6878, sd: 2.0212,
        passo: 9, fase: -2.7222,
        rInt: 180, rEst: 300,
        rMin: 110, rMax: 350,
        controlli: {n: 10,
            // bracci [0,6,11,17,22,28,33,39,44,50]
            int: [0.20840, 0.91882, 1.40940, 2.01040, 2.66993, 3.43210, 4.00330, 4.68874, -1.13381, -0.39781],
            est: [-0.09037, 0.57924, 1.12431, 1.81164, 2.38039, 3.08560, -2.62497, 4.37266, -1.35421, -0.67471]
        },
    }
];

const DUEPI = 2 * Math.PI;
function aPiGreco(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }

class ParasticheSlide extends Slide {
    constructor() { super("Parastiche"); }

    initialize() {}

    start() {
        this.centro = CENTRO_INIZIALE.slice();
        this.fam = FAMIGLIE.map(f => JSON.parse(JSON.stringify(f)));
        this.regolazione = false;
        this.famCorrente = 0;
        this.act = 0;
        this.presa = null;
        // si comincia con i soli bracci governati da una maniglia: e' la
        // condizione in cui si vede davvero se cadono al posto giusto
        this.soloManiglie = true;

        this.fam.forEach(f => this.sistemaControlli(f));

        // Lo sprite sta fermo: e' l'overlay che si muove quando si regola il
        // centro. Se si muovesse la foto non si capirebbe piu' niente.
        this.sx = DISCO_X - (CENTRO_INIZIALE[0] - IMG_W/2) * SCALA;
        this.sy = DISCO_Y - (CENTRO_INIZIALE[1] - IMG_H/2) * SCALA;
        const sprite = two.makeSprite(IMG, this.sx, this.sy);
        sprite.scale = SCALA;
        this.mainGroup.add(sprite);

        this.gruppoOverlay = two.makeGroup();
        this.mainGroup.add(this.gruppoOverlay);
        this.gruppoNumeri = two.makeGroup();
        this.mainGroup.add(this.gruppoNumeri);
        this.gruppoChrome = two.makeGroup();
        this.mainGroup.add(this.gruppoChrome);
        this.gruppoTesti = two.makeGroup();
        this.mainGroup.add(this.gruppoTesti);

        this.ridisegna();
    }

    // --- coordinate -------------------------------------------------------
    aSchermo(u, v) {
        return {x: this.sx + (u - IMG_W/2) * SCALA,
                y: this.sy + (v - IMG_H/2) * SCALA};
    }
    scalaSchermo() {
        return document.getElementById('container').getBoundingClientRect().width / 1920;
    }
    aImmagine(clientX, clientY) {
        const r = document.getElementById('container').getBoundingClientRect();
        const k = r.width / 1920;
        return {u: ((clientX - r.left)/k - 960 - this.sx)/SCALA + IMG_W/2,
                v: ((clientY - r.top )/k - 540 - this.sy)/SCALA + IMG_H/2};
    }

    // --- geometria --------------------------------------------------------
    u(f, r) { return (Math.sqrt(r) - f.mu) / f.sd; }
    forma(f, r) { return -f.passo * this.u(f, r) / f.m; }
    // dove passerebbe il braccio L se i bracci fossero equispaziati
    angoloIdeale(f, L, r) { return (DUEPI*L - f.fase)/f.m + this.forma(f, r); }

    // Quali bracci portano le maniglie: N indici il piu' possibile equidistanti.
    bracciDiControllo(f) {
        const n = f.controlli.n;
        const out = [];
        for(let k = 0; k < n; k++) out.push(Math.round(k * f.m / n) % f.m);
        return out;
    }

    // Maniglie mancanti o spaiate -> equispaziate.
    sistemaControlli(f) {
        const bracci = this.bracciDiControllo(f);
        ['int', 'est'].forEach(lato => {
            const r = lato === 'int' ? f.rInt : f.rEst;
            if(!f.controlli[lato] || f.controlli[lato].length !== bracci.length)
                f.controlli[lato] = bracci.map(L => this.angoloIdeale(f, L, r));
        });
        f.controlli.bracci = bracci;
    }

    // Lo scarto di ogni braccio rispetto all'equispaziato, su un cerchio:
    // sulle maniglie e' quello misurato, in mezzo si interpola linearmente,
    // ciclicamente perche' fra l'ultima maniglia e la prima si passa dal giro.
    scarti(f, lato) {
        const r = lato === 'int' ? f.rInt : f.rEst;
        const bracci = f.controlli.bracci;
        const n = bracci.length;
        const dManiglia = bracci.map(
            (L, k) => aPiGreco(f.controlli[lato][k] - this.angoloIdeale(f, L, r)));
        const out = new Array(f.m);
        for(let k = 0; k < n; k++) {
            const L0 = bracci[k], L1 = bracci[(k+1) % n];
            const passo = ((L1 - L0) + f.m) % f.m || f.m;
            for(let i = 0; i < passo; i++) {
                const t = i / passo;
                out[(L0 + i) % f.m] =
                    dManiglia[k] + (dManiglia[(k+1) % n] - dManiglia[k]) * t;
            }
        }
        return out;
    }

    // Un punto del braccio L al raggio r, corretto con gli scarti.
    puntoBraccio(f, L, r, sInt, sEst) {
        const u1 = this.u(f, f.rInt), u2 = this.u(f, f.rEst);
        // la correzione e' lineare in u, cioe' nella stessa coordinata in cui
        // e' lineare la forma della spirale; oltre i cerchi si prolunga
        const t = (u2 === u1) ? 0 : (this.u(f, r) - u1) / (u2 - u1);
        const d = sInt[L] + (sEst[L] - sInt[L]) * t;
        const th = this.angoloIdeale(f, L, r) + d;
        return this.aSchermo(this.centro[0] + r*Math.cos(th),
                             this.centro[1] + r*Math.sin(th));
    }

    braccio(f, L, sInt, sEst) {
        const vertici = [];
        for(let i = 0; i <= PASSI; i++) {
            const r = f.rMin + (f.rMax - f.rMin) * i / PASSI;
            const p = this.puntoBraccio(f, L, r, sInt, sEst);
            vertici.push(new Two.Anchor(p.x, p.y));
        }
        const path = two.makePath(vertici, false);
        // closed va rimesso a mano: il secondo argomento di makePath non basta
        // quando i vertici arrivano gia' come array, e un arco chiuso
        // ricongiunge la punta con la coda sporcando il centro del fiore.
        path.closed = false;
        path.curved = false;
        path.noFill();
        path.stroke = f.colore;
        path.linewidth = 3;
        return path;
    }

    disegnaFamiglia(f) {
        const sInt = this.scarti(f, 'int'), sEst = this.scarti(f, 'est');
        const g = two.makeGroup();
        // Con 34 bracci accesi non si capisce se UNO cade bene sui pistilli.
        // Con soli quelli governati da una maniglia si vede benissimo: si
        // piazzano quelli, e poi si riaccende il resto per il controllo.
        const soli = this.soloManiglie && this.regolazione;
        for(let L = 0; L < f.m; L++) {
            if(soli && f.controlli.bracci.indexOf(L) < 0) continue;
            g.add(this.braccio(f, L, sInt, sEst));
        }
        this.gruppoOverlay.add(g);
    }

    // Per la presentazione servono gli archi separati e, in fondo a ciascuno,
    // il pallino con il numero progressivo: si conta quello che si vede.
    costruisceFamiglia(f) {
        const sInt = this.scarti(f, 'int'), sEst = this.scarti(f, 'est');
        const archi = [], pallini = [];
        for(let L = 0; L < f.m; L++) {
            const arco = this.braccio(f, L, sInt, sEst);
            this.gruppoOverlay.add(arco);
            archi.push(arco);

            const q = this.puntoBraccio(f, L, f.rMax + NUMERO_FUORI, sInt, sEst);
            const c = two.makeCircle(q.x, q.y, NUMERO_R);
            c.fill = f.colore; c.stroke = '#ffffff'; c.linewidth = 2;
            const t = two.makeText(String(L + 1), q.x, q.y,
                {size: 26, weight: 'bold', family: 'Noto Sans, Arial',
                 alignment: 'center', baseline: 'middle'});
            t.fill = '#ffffff';
            this.gruppoNumeri.add(c); this.gruppoNumeri.add(t);
            pallini.push([c, t]);
        }
        return {archi: archi, pallini: pallini};
    }

    // --- maniglie ---------------------------------------------------------
    posizioneManiglia(f, lato, k) {
        const r = lato === 'int' ? f.rInt : f.rEst;
        const th = f.controlli[lato][k];
        return {u: this.centro[0] + r*Math.cos(th), v: this.centro[1] + r*Math.sin(th)};
    }

    manigliaPiuVicina(f, u, v) {
        let best = null;
        ['int', 'est'].forEach(lato => {
            f.controlli[lato].forEach((_, k) => {
                const p = this.posizioneManiglia(f, lato, k);
                const d = Math.hypot(p.u - u, p.v - v);
                if(!best || d < best.d) best = {lato: lato, k: k, d: d};
            });
        });
        return best;
    }

    // --- disegno ----------------------------------------------------------
    svuota(g) { while(g.children.length > 0) g.children[0].remove(); }

    ridisegna(animato) {
        this.svuota(this.gruppoOverlay);
        this.svuota(this.gruppoNumeri);
        this.svuota(this.gruppoChrome);
        this.svuota(this.gruppoTesti);
        this.contatore = null;
        if(this.regolazione) {
            const f = this.fam[this.famCorrente];
            this.disegnaFamiglia(f);
            this.disegnaChrome(f);
            return;
        }
        // la famiglia che entra proprio adesso: solo quella si anima
        const nuova = animato ? this.act - 1 : -1;
        const elementi = this.fam.slice(0, this.act).map(
            (f, i) => i === nuova ? this.costruisceFamiglia(f)
                                  : (this.disegnaFamiglia(f), null));
        // conta solo la prima famiglia: per le altre il numero e' gia' quello
        // giusto, e entra in dissolvenza insieme ai suoi archi
        this.disegnaNumeri(nuova === 0 ? 0 : -1);
        if(nuova === 0) this.animaUnoPerVolta(this.fam[0], elementi[0]);
        else if(nuova > 0) this.animaInsieme(elementi[nuova], nuova);
        else if(animato && this.act > this.fam.length) this.animaChiusura();
    }

    fermaAnimazione() {
        if(this.tl) { this.tl.kill(); this.tl = null; }
    }

    // La prima famiglia si conta: un braccio per volta, e il numero a destra
    // sale insieme. I pallini servono mentre si conta e poi se ne vanno: se
    // restassero, coprirebbero la corona proprio quando entra l'altra famiglia.
    animaUnoPerVolta(f, el) {
        el.archi.forEach(a => a.opacity = 0);
        el.pallini.forEach(c => c.forEach(o => o.opacity = 0));
        const tl = gsap.timeline();
        el.archi.forEach((arco, i) => {
            const t = i * T_BRACCIO;
            tl.to(arco, {opacity: 1, duration: T_ENTRATA}, t);
            tl.to(el.pallini[i], {opacity: 1, duration: T_ENTRATA}, t);
            if(this.contatore)
                tl.call(() => { this.contatore.value = String(i + 1); }, null, t);
        });
        const fine = f.m * T_BRACCIO + T_PAUSA;
        tl.to([].concat.apply([], el.pallini),
              {opacity: 0, duration: T_VIA_NUMERI}, fine);
        this.tl = tl;
    }

    // La seconda entra tutta insieme: qui il numero non si conta, si guarda.
    animaInsieme(el, i) {
        el.archi.forEach(a => a.opacity = 0);
        el.pallini.forEach(c => c.forEach(o => o.opacity = 0));
        const testi = this.testiFamiglia[i] || [];
        testi.forEach(t => t.opacity = 0);
        this.tl = gsap.timeline()
            .to(el.archi.concat(testi), {opacity: 1, duration: T_FADE});
    }

    animaChiusura() {
        if(!this.didascalia) return;
        this.didascalia.opacity = 0;
        this.tl = gsap.timeline().to(this.didascalia, {opacity: 1, duration: 0.8});
    }

    cerchio(r, tratteggio, riempi) {
        const c = this.aSchermo(this.centro[0], this.centro[1]);
        const k = two.makeCircle(c.x, c.y, r * SCALA);
        if(riempi) { k.fill = 'rgba(255,255,255,0.18)'; } else { k.noFill(); }
        k.stroke = COL_CERCHIO;
        k.linewidth = 2;
        if(tratteggio) k.dashes = [8, 8];
        this.gruppoChrome.add(k);
    }

    disegnaChrome(f) {
        this.cerchio(f.rInt * FRAZIONE_CENTRO, false, true);   // zona "sposta il centro"
        this.cerchio(f.rInt, false, false);
        this.cerchio(f.rEst, false, false);
        this.cerchio(f.rMin, true, false);
        this.cerchio(f.rMax, true, false);

        ['int', 'est'].forEach(lato => {
            f.controlli[lato].forEach((_, k) => {
                const q = this.posizioneManiglia(f, lato, k);
                const p = this.aSchermo(q.u, q.v);
                const presa = this.presa && this.presa.lato === lato && this.presa.k === k;
                const c = two.makeCircle(p.x, p.y, presa ? 15 : 10);
                c.fill = presa ? '#ffffff' : COL_MANIGLIA;
                c.stroke = '#000000';
                c.linewidth = 2;
                this.gruppoChrome.add(c);
                const t = two.makeText(String(f.controlli.bracci[k]), p.x, p.y - 26,
                    {size: 22, family: 'Noto Sans, Arial', alignment: 'center', baseline: 'middle'});
                t.fill = COL_MANIGLIA;
                this.gruppoChrome.add(t);
            });
        });

        const righe = [
            'REGOLAZIONE   [m] per uscire',
            '',
            'famiglia ' + f.nome + '  [t]',
            'bracci ' + f.m + '  [z/x]',
            'maniglie per cerchio ' + f.controlli.n + '  [g/h]',
            'mostra ' + (this.soloManiglie ? 'solo i bracci con maniglia' : 'tutti i bracci') + '  [v]',
            'passo ' + f.passo.toFixed(2) + '  [q/w]  grosso [Q/W]',
            'fase ' + f.fase.toFixed(4) + '  [a/s]  grosso [A/S]',
            'cerchi ' + f.rInt.toFixed(0) + '  [e/r]   e  ' + f.rEst.toFixed(0) + '  [d/f]',
            'centro ' + this.centro[0].toFixed(1) + ' , ' + this.centro[1].toFixed(1),
            '',
            'trascina dentro il disco chiaro = sposta il centro',
            'trascina fuori = afferra la maniglia piu vicina',
            '[k] rimette le maniglie equispaziate',
            '[c] stampa la parametrizzazione',
        ];
        righe.forEach((t, i) => {
            if(t === '') return;
            const testo = two.makeText(t, TESTO_X, -340 + i*38,
                {size: 28, family: 'Noto Sans, Arial', alignment: 'left', baseline: 'middle'});
            testo.fill = 'white';
            this.gruppoChrome.add(testo);
        });
    }

    disegnaNumeri(chiConta) {
        this.testiFamiglia = [];
        for(let i = 0; i < this.act && i < this.fam.length; i++) {
            const f = this.fam[i];
            // quella che sta entrando parte da 1 e sale con i bracci
            const n = two.makeText(i === chiConta ? '1' : String(f.m),
                TESTO_X, -200 + i*230,
                {size: 200, weight: 'bold', family: 'Noto Sans, Arial',
                 alignment: 'left', baseline: 'middle'});
            n.fill = f.colore;
            this.gruppoTesti.add(n);
            if(i === chiConta) this.contatore = n;
            const e = two.makeText('spirali', TESTO_X + 260, -200 + i*230,
                {size: 62, family: 'Noto Sans, Arial', alignment: 'left', baseline: 'middle'});
            e.fill = 'white';
            this.gruppoTesti.add(e);
            this.testiFamiglia[i] = [n, e];
        }
        if(this.act > this.fam.length) {
            const t = two.makeText('due numeri di Fibonacci consecutivi', TESTO_X, 290,
                {size: 54, family: 'Noto Sans, Arial', alignment: 'left', baseline: 'middle'});
            t.fill = 'white';
            this.gruppoTesti.add(t);
            this.didascalia = t;
        }
    }

    stampa(f) {
        const ang = lato => '[' + f.controlli[lato].map(a => a.toFixed(5)).join(', ') + ']';
        console.log(
            "        nome: '" + f.nome + "',\n" +
            '        m: ' + f.m + ',\n' +
            '        mu: ' + f.mu + ', sd: ' + f.sd + ',\n' +
            '        passo: ' + f.passo + ', fase: ' + f.fase.toFixed(4) + ',\n' +
            '        rInt: ' + f.rInt + ', rEst: ' + f.rEst + ',\n' +
            '        rMin: ' + f.rMin + ', rMax: ' + f.rMax + ',\n' +
            '        controlli: {n: ' + f.controlli.n + ',\n' +
            '            // bracci ' + JSON.stringify(f.controlli.bracci) + '\n' +
            '            int: ' + ang('int') + ',\n' +
            '            est: ' + ang('est') + '},\n' +
            '// CENTRO_INIZIALE = [' + this.centro[0].toFixed(1) + ', ' +
            this.centro[1].toFixed(1) + ']');
    }

    // --- mouse ------------------------------------------------------------
    onPointerDown(x, y, e) {
        if(!this.regolazione) return;
        const f = this.fam[this.famCorrente];
        const p = this.aImmagine(x, y);
        const r = Math.hypot(p.u - this.centro[0], p.v - this.centro[1]);
        if(r < f.rInt * FRAZIONE_CENTRO) {
            this.presa = {centro: true};
        } else {
            this.presa = this.manigliaPiuVicina(f, p.u, p.v);
            // Si afferra senza far saltare la maniglia dove si e' cliccato: si
            // memorizza lo scarto fra i due angoli e lo si conserva per tutto
            // il trascinamento. Se no un clic dieci pixel fuori bersaglio
            // sposta la maniglia di dieci pixel prima ancora di muovere il
            // mouse, e aggiustare finemente diventa impossibile.
            this.presa.offset = aPiGreco(
                f.controlli[this.presa.lato][this.presa.k] - this.angoloPuntatore(p));
        }
        this.ridisegna();
    }

    angoloPuntatore(p) {
        return Math.atan2(p.v - this.centro[1], p.u - this.centro[0]);
    }

    trascinaManiglia(f, p) {
        f.controlli[this.presa.lato][this.presa.k] =
            this.angoloPuntatore(p) + this.presa.offset;
    }

    onPointerDrag(x, y, dx, dy, e) {
        if(!this.regolazione || !this.presa) return;
        const f = this.fam[this.famCorrente];
        if(this.presa.centro) {
            const k = this.scalaSchermo();
            this.centro[0] += dx / k / SCALA;
            this.centro[1] += dy / k / SCALA;
        } else {
            this.trascinaManiglia(f, this.aImmagine(x, y));
        }
        this.ridisegna();
    }

    onPointerUp(e) {
        if(!this.regolazione || !this.presa) return;
        // Al rilascio si stampa: cosi' ogni aggiustamento lascia in console la
        // parametrizzazione buona, e non si rischia di perderla ricaricando.
        this.stampa(this.fam[this.famCorrente]);
        this.presa = null;
        this.ridisegna();
    }

    // --- tastiera ---------------------------------------------------------
    onKeyDown(event) {
        const k = event.key;
        if(k === 'm') { this.regolazione = !this.regolazione; this.presa = null; this.ridisegna(); return; }
        if(!this.regolazione) { if(k === '0') this.setAct(0, false); return; }

        const f = this.fam[this.famCorrente];
        // rifare: cambiano i bracci sotto le maniglie, gli angoli vecchi non
        // vogliono piu' dire niente
        const rifai = () => { f.controlli.int = []; f.controlli.est = []; this.sistemaControlli(f); };
        const tasti = {
            q: () => f.passo -= 0.25,   w: () => f.passo += 0.25,
            Q: () => f.passo -= 2,      W: () => f.passo += 2,
            a: () => f.fase  -= 0.02,   s: () => f.fase  += 0.02,
            A: () => f.fase  -= 0.15,   S: () => f.fase  += 0.15,
            v: () => this.soloManiglie = !this.soloManiglie,
            z: () => { f.m = Math.max(3, f.m - 1); rifai(); },
            x: () => { f.m += 1; rifai(); },
            g: () => { f.controlli.n = Math.max(2, f.controlli.n - 1); rifai(); },
            h: () => { f.controlli.n = Math.min(f.m, f.controlli.n + 1); rifai(); },
            e: () => f.rInt -= 2,       r: () => f.rInt += 2,
            d: () => f.rEst -= 2,       f: () => f.rEst += 2,
            t: () => { this.famCorrente = (this.famCorrente + 1) % this.fam.length;
                       this.presa = null; },
            k: () => rifai(),
            c: () => this.stampa(f),
        };
        if(tasti[k]) { tasti[k](); this.ridisegna(); }
    }

    // --- atti -------------------------------------------------------------
    get ultimoAtto() { return this.fam.length + 1; }
    // Si anima solo andando avanti: tornando indietro si vuole lo stato finale
    // dell'atto, non rivedere il conteggio.
    setAct(a, animato) { this.fermaAnimazione(); this.act = a; this.ridisegna(animato); }
    nextAct() { if(!this.regolazione && this.act < this.ultimoAtto) this.setAct(this.act + 1, true); }
    prevAct() { if(!this.regolazione && this.act > 0) this.setAct(this.act - 1, false); }

    cleanup() { this.fermaAnimazione(); }
    async end() { this.fermaAnimazione(); }
}

let t = new ParasticheSlide();
