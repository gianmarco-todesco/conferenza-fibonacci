import {Slide, two, center} from '../../libs/gmtlib.js';

// Le due crescite a confronto: F(n) dei conigli e 2^n della mitosi.
//
// PERCHE' IL RIQUADRO E' FISSO E LE CURVE NE ESCONO. Su assi lineari le due
// curve NON hanno la stessa forma: a n = 13 Fibonacci vale 233 e 2^n vale
// 8192, quindi scegliendo la scala per far stare 2^n la curva dei conigli
// resta schiacciata sull'asse, e si vedrebbe il contrario di quello che si
// vuole dire. Con il riquadro fisso, invece, tutt'e due le curve escono dal
// bordo di sopra: la mitosi a n = 8, i conigli a n = 13. Stesso slancio, uno
// ci arriva prima - che e' esattamente "stessa forma, tasso diverso", senza
// doverlo scrivere.
//
// Il tasto  l  passa alla scala logaritmica, dove le due diventano due rette
// di pendenza diversa. E' l'argomento piu' forte ma vuole una spiegazione,
// quindi sta fuori dagli atti.

const N_MAX = 13;               // fin dove arriva l'asse delle n
const Y_MAX = 240;              // il riquadro: F(13) = 233, 2^n esce a n = 7.9

const X0 = -680, X1 = 640;      // il riquadro sullo schermo
const Y0 =  360, Y1 = -350;     // Y0 in basso, Y1 in alto

const PASSI = 260;              // campioni per disegnare una curva
const T_DISEGNO = 1.6;          // secondi per tracciarla

const COL_ASSI = 'rgba(255,255,255,0.75)';
const COL_CONIGLI = '#ff8a3d';
const COL_MITOSI  = '#4fc3f7';

const PHI = (1 + Math.sqrt(5)) / 2;
// Binet esteso ai reali: per x intero da' esattamente F(x), e in mezzo da' una
// curva liscia. Serve solo per tracciare: i pallini stanno sugli interi.
function fib(x) {
    return (Math.pow(PHI, x) - Math.cos(Math.PI*x)*Math.pow(PHI, -x)) / Math.sqrt(5);
}

const CURVE = [
    {nome: 'conigli', colore: COL_CONIGLI, f: fib},
    {nome: 'mitosi',  colore: COL_MITOSI,  f: x => Math.pow(2, x)},
];

class CresciteSlide extends Slide {
    constructor() { super("Crescite"); }

    initialize() {}

    start() {
        this.log = false;
        this.act = 0;
        this.curve = null;
        this.gruppoAssi = two.makeGroup();
        this.mainGroup.add(this.gruppoAssi);
        this.gruppoCurve = two.makeGroup();
        this.mainGroup.add(this.gruppoCurve);
        this.gruppoLegenda = two.makeGroup();
        this.mainGroup.add(this.gruppoLegenda);
        this.costruisci();
    }

    // --- coordinate ---------------------------------------------------------
    ax(n) { return X0 + (X1 - X0) * n / N_MAX; }
    ay(v) {
        if(!this.log) return Y0 + (Y1 - Y0) * v / Y_MAX;
        // in log il fondo del riquadro e' 1, non 0: log(0) non esiste
        const t = Math.log(Math.max(v, 1)) / Math.log(Y_MAX);
        return Y0 + (Y1 - Y0) * t;
    }

    // --- costruzione --------------------------------------------------------
    costruisci() {
        this.svuota(this.gruppoAssi);
        this.svuota(this.gruppoCurve);
        this.svuota(this.gruppoLegenda);
        this.disegnaAssi();
        this.curve = CURVE.map(c => this.creaCurva(c));
        this.disegnaLegenda();
        // quello che e' gia' stato tracciato resta tracciato
        this.curve.forEach((c, i) => this.mostra(c, i < this.act ? 1 : 0));
    }

    svuota(g) { while(g.children.length > 0) g.children[0].remove(); }

    linea(x0, y0, x1, y1, colore, spessore) {
        const l = two.makeLine(x0, y0, x1, y1);
        l.stroke = colore; l.linewidth = spessore || 2;
        return l;
    }

    disegnaAssi() {
        const g = this.gruppoAssi;
        // asse n
        g.add(this.linea(X0 - 30, Y0, X1 + 60, Y0, COL_ASSI, 3));
        const p = two.makePath([new Two.Anchor(X1 + 60, Y0), new Two.Anchor(X1 + 38, Y0 - 9),
                                new Two.Anchor(X1 + 38, Y0 + 9)], true);
        p.fill = COL_ASSI; p.noStroke(); g.add(p);
        // asse dei valori
        g.add(this.linea(X0, Y0 + 30, X0, Y1 - 60, COL_ASSI, 3));
        const q = two.makePath([new Two.Anchor(X0, Y1 - 60), new Two.Anchor(X0 - 9, Y1 - 38),
                                new Two.Anchor(X0 + 9, Y1 - 38)], true);
        q.fill = COL_ASSI; q.noStroke(); g.add(q);

        for(let n = 1; n <= N_MAX; n++) {
            const x = this.ax(n);
            g.add(this.linea(x, Y0 - 8, x, Y0 + 8, COL_ASSI, 2));
            if(n % 2 === 0) {
                const t = two.makeText(String(n), x, Y0 + 40,
                    {size: 30, family: 'Noto Sans, Arial', alignment: 'center', baseline: 'middle'});
                t.fill = COL_ASSI; g.add(t);
            }
        }
        const etn = two.makeText('n', X1 + 60, Y0 + 52,
            {size: 36, family: 'Noto Sans, Arial', alignment: 'center', baseline: 'middle'});
        etn.fill = COL_ASSI; g.add(etn);

        const tacche = this.log ? [1, 10, 100] : [50, 100, 150, 200];
        tacche.forEach(v => {
            const y = this.ay(v);
            g.add(this.linea(X0 - 8, y, X0 + 8, y, COL_ASSI, 2));
            g.add(this.linea(X0, y, X1, y, 'rgba(255,255,255,0.10)', 2));
            const t = two.makeText(String(v), X0 - 28, y,
                {size: 28, family: 'Noto Sans, Arial', alignment: 'right', baseline: 'middle'});
            t.fill = COL_ASSI; g.add(t);
        });
    }

    // Una curva: la spezzata fitta piu' i pallini sugli interi. Si taglia
    // quando esce dal riquadro di sopra - ed e' li' che sta il messaggio.
    creaCurva(def) {
        const punti = [];
        for(let i = 0; i <= PASSI; i++) {
            const n = N_MAX * i / PASSI;
            const v = def.f(n);
            if(v > Y_MAX) break;
            punti.push({x: this.ax(n), y: this.ay(v)});
        }
        if(punti.length < 2) punti.push({x: this.ax(0), y: this.ay(0)});

        const vertici = punti.map(p => new Two.Anchor(p.x, p.y));
        const path = two.makePath(vertici, false);
        path.closed = false;        // vedi parastiche.js: il secondo argomento non basta
        path.curved = false;
        // makePath mette nella translation il BARICENTRO dei vertici passati, e
        // li riscrive relativi a quello. Qui pero' mostra() ci rimette dentro
        // coordinate assolute a ogni fotogramma, quindi la translation va
        // azzerata: se no tutta la curva viene disegnata spostata del
        // baricentro - qui erano 279 px, e la curva non passava dai suoi
        // pallini.
        path.translation.set(0, 0);
        path.noFill();
        path.stroke = def.colore;
        path.linewidth = 6;
        this.gruppoCurve.add(path);

        const pallini = [];
        for(let n = 0; n <= N_MAX; n++) {
            const v = def.f(n);
            if(v > Y_MAX) break;
            const c = two.makeCircle(this.ax(n), this.ay(v), 9);
            c.fill = def.colore; c.stroke = '#1a1a2e'; c.linewidth = 2;
            this.gruppoCurve.add(c);
            // a quale campione della spezzata corrisponde questo intero
            pallini.push({o: c, quando: Math.round(PASSI * n / N_MAX)});
        }
        return {def: def, punti: punti, path: path, pallini: pallini};
    }

    // t da 0 a 1: la spezzata si allunga, e i pallini compaiono quando la
    // curva li raggiunge. I vertici non ancora raggiunti si accavallano sulla
    // punta, cosi' l'oggetto resta lo stesso e cambiano solo le coordinate.
    mostra(curva, t) {
        const p = curva.punti, n = p.length;
        const k = Math.max(1, Math.min(n, Math.round(t * n)));
        for(let i = 0; i < n; i++) {
            const q = p[Math.min(i, k - 1)];
            curva.path.vertices[i].x = q.x;
            curva.path.vertices[i].y = q.y;
        }
        curva.path.visible = t > 0;
        curva.pallini.forEach(x => { x.o.visible = t > 0 && x.quando <= k - 1; });
    }

    disegnaLegenda() {
        // Sta in alto a sinistra perche' li' non ci passa nessuna curva: a n
        // piccolo sono tutt'e due schiacciate in basso.
        CURVE.forEach((c, i) => {
            const y = Y1 + 60 + i * 60;
            this.gruppoLegenda.add(this.linea(X0 + 60, y, X0 + 150, y, c.colore, 6));
            const t = two.makeText(c.nome, X0 + 170, y,
                {size: 38, family: 'Noto Sans, Arial', alignment: 'left', baseline: 'middle'});
            t.fill = 'white';
            this.gruppoLegenda.add(t);
        });
    }

    // --- atti ---------------------------------------------------------------
    get ultimoAtto() { return CURVE.length; }

    setAct(a, animato) {
        if(this.tl) { this.tl.kill(); this.tl = null; }
        this.act = a;
        this.curve.forEach((c, i) => this.mostra(c, i < a ? 1 : 0));
        if(animato && a > 0) {
            const c = this.curve[a - 1];
            this.mostra(c, 0);
            const stato = {t: 0};
            this.tl = gsap.to(stato, {t: 1, duration: T_DISEGNO, ease: 'none',
                onUpdate: () => this.mostra(c, stato.t)});
        }
    }
    nextAct() { if(this.act < this.ultimoAtto) this.setAct(this.act + 1, true); }
    prevAct() { if(this.act > 0) this.setAct(this.act - 1, false); }

    onKeyDown(event) {
        if(event.key === '0') this.setAct(0, false);
        if(event.key === 'l') { this.log = !this.log; this.costruisci(); }
    }

    cleanup() { if(this.tl) { this.tl.kill(); this.tl = null; } }
    async end() { if(this.tl) { this.tl.kill(); this.tl = null; } }
}

let t = new CresciteSlide();
