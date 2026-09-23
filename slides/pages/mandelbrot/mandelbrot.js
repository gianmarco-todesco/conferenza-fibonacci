import {Slide, two, center} from '../../libs/gmtlib.js';

// Visualizzatore dell'insieme di Mandelbrot, in locale e comandabile.
//
// Il frattale e' un canvas WebGL DIETRO l'SVG di Two.js; gli overlay (assi,
// punti di tangenza, cerchi dei bulbi, conteggio delle antenne) sono normali
// oggetti Two.js DAVANTI. L'unico ponte fra i due mondi e' la coppia
// aSchermo()/aComplesso(), che usa la stessa vista dello shader.
//
// Comandi:
//   trascina   pan                  rotella   zoom sul puntatore
//   <- / ->    tappa precedente / successiva
//   a  assi        t  punti di tangenza        b  cerchi dei bulbi
//   n  antenne     r  vista iniziale
//   c  stampa in console la coordinata sotto il puntatore, come PUNTA
//   C  la stessa coordinata, come CENTRO di diramazione
//      (servono per riempire TAPPE: vedi il commento li')

const W = 1920, H = 1080;
const RISOLUZIONE = 1;      // abbassa a 0.75 se la GPU arranca

const VISTA_INIZIALE = {cx: -0.65, cy: 0, larghezza: 3.2};

// A che distanza in pixel dal punto di tangenza, verso l'interno del
// cardioide, si scrive la frazione p/q.
const ETICHETTA_PX = 44;

// Sotto questa estensione in pixel l'antenna non si disegna: i numeri si
// sovrapporrebbero invece di aiutare a contare.
const ANTENNA_MIN_PX = 90;

// I pallini numerati sulle punte. Vanno letti dal fondo della sala, quindi
// sono grossi; il corpo del numero segue il raggio, altrimenti un "13" non
// ci sta dentro.
const ANTENNA_R      = 50;
const ANTENNA_TESTO  = 64;
const ANTENNA_TRATTO = 3;

// ---------------------------------------------------------------------
// Geometria dei bulbi.
//
// Bordo del cardioide principale: c(t) = e^(2 pi i t)/2 - e^(4 pi i t)/4.
// Il bulbo p/q tocca il cardioide esattamente in c(p/q), e al suo interno il
// ciclo attrattivo ha periodo q.
function puntoCardioide(t) {
    const a = 2*Math.PI*t;
    return {
        re: Math.cos(a)/2 - Math.cos(2*a)/4,
        im: Math.sin(a)/2 - Math.sin(2*a)/4
    };
}

// Normale uscente in c(t): la tangente e' dc/da, la normale uscente e' -i
// volte la tangente normalizzata.
// Verifica: per t = 1/2 da' (-1, 0), e infatti il bulbo di periodo 2 sta a
// sinistra di c = -3/4.
function normaleUscente(t) {
    const a = 2*Math.PI*t;
    const tx = -Math.sin(a)/2 + Math.sin(2*a)/2;   // Re(dc/da)
    const ty =  Math.cos(a)/2 - Math.cos(2*a)/2;   // Im(dc/da)
    const n = Math.hypot(tx, ty);
    return {re: ty/n, im: -tx/n};                  // -i * (tx + i ty)
}

// Stima asintotica del raggio: la forma precisa di "la grandezza va come
// 1/q^2". Serve solo come punto di partenza per Newton qui sotto, perche' e'
// esatta solo per q = 2 e per q = 3 sbaglia gia' dell'1%.
function raggioStimato(p, q) {
    return Math.sin(Math.PI*p/q) / (q*q);
}

function centroStimato(p, q) {
    const t = puntoCardioide(p/q);
    const n = normaleUscente(p/q);
    const r = raggioStimato(p, q);
    return {re: t.re + r*n.re, im: t.im + r*n.im};
}

// Il centro VERO del bulbo p/q e' il parametro in cui il ciclo di periodo q
// e' superattrattivo, cioe' lo zero di F_q(c): z_0 = 0, z_{k+1} = z_k^2 + c,
// F_q(c) = z_q. Non ha forma chiusa, ma Newton lo trova in poche iterazioni
// partendo dalla stima asintotica; la derivata rispetto a c si propaga
// insieme all'orbita con d_{k+1} = 2 z_k d_k + 1.
//
// Serve perche' i cerchi disegnati con la sola stima risultavano un filo
// piccoli e spostati: l'errore dell'1% sul raggio si somma a quello sulla
// posizione del centro, che sta a distanza r lungo la normale.
function centroEsatto(p, q) {
    const stima = centroStimato(p, q);
    let cr = stima.re, ci = stima.im;
    for(let it = 0; it < 80; it++) {
        let zr = 0, zi = 0, dr = 0, di = 0;
        for(let k = 0; k < q; k++) {
            const ndr = 2*(zr*dr - zi*di) + 1;
            const ndi = 2*(zr*di + zi*dr);
            const nzr = zr*zr - zi*zi + cr;
            const nzi = 2*zr*zi + ci;
            zr = nzr; zi = nzi; dr = ndr; di = ndi;
        }
        const den = dr*dr + di*di;
        if(!(den > 0)) break;
        const sr = (zr*dr + zi*di) / den;
        const si = (zi*dr - zr*di) / den;
        cr -= sr; ci -= si;
        if(Math.hypot(sr, si) < 1e-15) break;
    }
    // Se Newton e' scappato su un altro centro di periodo q (ce ne sono
    // molti), si torna alla stima invece di disegnare un cerchio assurdo.
    const fuga = Math.hypot(cr - stima.re, ci - stima.im);
    if(!isFinite(cr) || !isFinite(ci) || fuga > 0.5*raggioStimato(p, q))
        return stima;
    return {re: cr, im: ci};
}

// Il bulbo e' tangente al cardioide nella radice, quindi il raggio e' la
// distanza fra centro e radice. Per 1/2 viene esattamente 0,25.
function geometriaBulbo(p, q) {
    const tangenza = puntoCardioide(p/q);
    const normale = normaleUscente(p/q);
    const centro = centroEsatto(p, q);
    const raggio = Math.hypot(centro.re - tangenza.re, centro.im - tangenza.im);
    return {p, q, tangenza, normale, centro, raggio};
}

// ---------------------------------------------------------------------
// Le tappe. Questa slide non e' un esploratore, e' uno strumento da palco:
// dal vivo si preme un tasto e si atterra, non si cerca col mouse davanti a
// duecento persone. E' il cammino di Fibonacci: 1/2, 1/3, 2/5, 3/8, 5/13.
//
// L'aiuto per contare le antenne si raccoglie a mano, perche' ne' il punto di
// diramazione ne' le punte hanno una formula chiusa: piazzarli a occhio da'
// posizioni esatte, una formula le darebbe approssimate.
//
//   'centro'  il punto di diramazione, da cui partono i raggi.   Tasto C
//   'punte'   le q punte, nell'ordine in cui vanno numerate.      Tasto c
//
// Senza 'centro' i raggi partono dal baricentro delle punte, che per il 5/13
// cade una sessantina di pixel fuori dal centro vero della stella: il
// baricentro e' un ripiego, non la stessa cosa.
// Senza 'punte' non si disegna niente.
const TAPPE = [
    {p: 1, q: 2,  larghezza: 3.2,   tuttoInsieme: true, centro: null, punte: []},
    {p: 1, q: 3,  larghezza: 0.80,  centro: [-0.10156363, 0.95642902], punte: [
        [-0.10575541, 0.92457140],
        [-0.07431695, 0.97068112],
        [-0.12922946, 0.98954418]
    ]},
    {p: 2, q: 5,  larghezza: 0.34,  centro: [-0.56228042, 0.64283540], punte: [
        [-0.55078970, 0.62655689],
        [-0.57664381, 0.63325980],
        [-0.57792056, 0.65145344],
        [-0.56345673, 0.65630854],
        [-0.54340280, 0.65491591]
    ]},
    {p: 3, q: 8,  larghezza: 0.14,  centro: [-0.37399316, 0.65979218], punte: [
        [-0.37205941, 0.65386893],
        [-0.36756485, 0.65836350],
        [-0.36859485, 0.66304534],
        [-0.37224669, 0.66557353],
        [-0.37589852, 0.66604171],
        [-0.38076763, 0.66491807],
        [-0.38254673, 0.65958078],
        [-0.37945671, 0.65311984]
    ]},
    {p: 5, q: 13, larghezza: 0.055, centro: [-0.41705772, 0.60292471], punte: [
        [-0.41538393, 0.59950871],
        [-0.41827308, 0.59887006],
        [-0.42000657, 0.60045149],
        [-0.42085811, 0.60200251],
        [-0.42043234, 0.60358394],
        [-0.41964162, 0.60464836],
        [-0.41879008, 0.60546949],
        [-0.41769525, 0.60613855],
        [-0.41669165, 0.60583443],
        [-0.41568805, 0.60546949],
        [-0.41441074, 0.60501331],
        [-0.41368084, 0.60373600],
        [-0.41328549, 0.60145509],
    ]},
];

// I bulbi di cui disegnare tangenza e cerchio quando gli overlay sono accesi.
const BULBI = [
    [1,2],[1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5],[4,5],
    [2,7],[3,8],[5,8],[5,13],[8,13]
];

// ---------------------------------------------------------------------
const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uCentro;
uniform float uScala;        // unita' complesse per pixel
uniform vec2  uRes;
uniform float uMaxIter;
uniform float uCiclo;        // larghezza delle bande di colore

// Gradiente "Ultra Fractal": il blu/oro classico.
vec3 palette(float t) {
    t = fract(t);
    vec3 c0 = vec3(  0.0,   7.0, 100.0) / 255.0;
    vec3 c1 = vec3( 32.0, 107.0, 203.0) / 255.0;
    vec3 c2 = vec3(237.0, 255.0, 255.0) / 255.0;
    vec3 c3 = vec3(255.0, 170.0,   0.0) / 255.0;
    vec3 c4 = vec3(  0.0,   2.0,   0.0) / 255.0;
    if(t < 0.1600) return mix(c0, c1,  t           / 0.1600);
    if(t < 0.4200) return mix(c1, c2, (t - 0.1600) / 0.2600);
    if(t < 0.6425) return mix(c2, c3, (t - 0.4200) / 0.2225);
    if(t < 0.8575) return mix(c3, c4, (t - 0.6425) / 0.2150);
    return                mix(c4, c0, (t - 0.8575) / 0.1425);
}

void main() {
    vec2 c = uCentro + (gl_FragCoord.xy - 0.5*uRes) * uScala;

    // Scorciatoia classica: cardioide principale e disco di periodo 2 si
    // riconoscono con due conti, e sono la parte nera piu' grande.
    float x = c.x - 0.25;
    float q = x*x + c.y*c.y;
    if(q*(q + x) < 0.25*c.y*c.y ||
       (c.x + 1.0)*(c.x + 1.0) + c.y*c.y < 0.0625) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    vec2 z = vec2(0.0);
    float fuga = -1.0;
    for(int k = 0; k < 3000; k++) {
        if(float(k) >= uMaxIter) break;
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        float m = dot(z, z);
        if(m > 256.0) {
            // tempo di fuga continuo: niente bande a scalini
            fuga = float(k) + 1.0 - log(0.5*log(m)) / log(2.0);
            break;
        }
    }

    if(fuga < 0.0) gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    else           gl_FragColor = vec4(palette(sqrt(fuga) * uCiclo), 1.0);
}
`;

function compila(gl, tipo, sorgente) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, sorgente);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error('shader: ' + gl.getShaderInfoLog(s));
    return s;
}

class MandelbrotSlide extends Slide {
    constructor() {
        super("Mandelbrot");
    }
    initialize() {
    }

    start() {
        this.contenitore = document.getElementById('container');
        this.vista = Object.assign({}, VISTA_INIZIALE);
        this.tappa = 0;
        this.mostra = {assi: false, tangenze: false, bulbi: false, antenne: false};
        this.ultimoPuntatore = null;

        this.creaCanvas();
        this.creaOverlay();
        this.collegaEventi();
        this.aggiorna();
    }

    // Il canvas va DIETRO l'SVG di Two.js. #container ha una transform,
    // quindi crea un contesto di impilamento: z-index -1 mette il canvas
    // sotto il contenuto in linea ma dentro il contenitore.
    creaCanvas() {
        const cv = this.canvas = document.createElement('canvas');
        cv.width  = Math.round(W * RISOLUZIONE);
        cv.height = Math.round(H * RISOLUZIONE);
        cv.style.position = 'absolute';
        cv.style.left = '0px';
        cv.style.top = '0px';
        cv.style.width = W + 'px';
        cv.style.height = H + 'px';
        cv.style.zIndex = '-1';
        this.contenitore.appendChild(cv);

        const gl = this.gl = cv.getContext('webgl', {antialias: false});
        if(!gl) { console.error('WebGL non disponibile'); return; }

        const prog = gl.createProgram();
        gl.attachShader(prog, compila(gl, gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, compila(gl, gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        if(!gl.getProgramParameter(prog, gl.LINK_STATUS))
            throw new Error('link: ' + gl.getProgramInfoLog(prog));
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        this.uni = {};
        ['uCentro','uScala','uRes','uMaxIter','uCiclo'].forEach(
            n => this.uni[n] = gl.getUniformLocation(prog, n));
    }

    disegnaFrattale() {
        const gl = this.gl;
        if(!gl) return;
        const cv = this.canvas;
        // Piu' si stringe, piu' iterazioni servono per non perdere i dettagli.
        const iter = Math.min(3000, Math.round(250 + 180 *
            Math.log2(VISTA_INIZIALE.larghezza / this.vista.larghezza + 1)));
        gl.viewport(0, 0, cv.width, cv.height);
        gl.uniform2f(this.uni.uCentro, this.vista.cx, this.vista.cy);
        gl.uniform1f(this.uni.uScala, this.vista.larghezza / cv.width);
        gl.uniform2f(this.uni.uRes, cv.width, cv.height);
        gl.uniform1f(this.uni.uMaxIter, iter);
        gl.uniform1f(this.uni.uCiclo, 0.16);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // --- il ponte fra piano complesso e schermo -----------------------
    get scala() { return this.vista.larghezza / W; }

    aSchermo(re, im) {
        return {x:  (re - this.vista.cx) / this.scala,
                y: -(im - this.vista.cy) / this.scala};
    }
    aComplesso(x, y) {
        return {re: this.vista.cx + x * this.scala,
                im: this.vista.cy - y * this.scala};
    }

    // --- overlay ------------------------------------------------------
    creaOverlay() {
        const g = this.mainGroup;
        this.gAssi     = two.makeGroup(); g.add(this.gAssi);
        this.gTangenze = two.makeGroup(); g.add(this.gTangenze);
        this.gBulbi    = two.makeGroup(); g.add(this.gBulbi);
        this.gAntenne  = two.makeGroup(); g.add(this.gAntenne);

        this.asseX = two.makeLine(-W/2, 0, W/2, 0);
        this.asseY = two.makeLine(0, -H/2, 0, H/2);
        [this.asseX, this.asseY].forEach(l => {
            l.stroke = 'rgba(255,255,255,0.6)'; l.linewidth = 2;
            this.gAssi.add(l);
        });
        this.tacche = [];
        for(let i = 0; i < 48; i++) {
            const t = two.makeLine(0, 0, 0, 0);
            t.stroke = 'rgba(255,255,255,0.6)'; t.linewidth = 2;
            this.gAssi.add(t);
            this.tacche.push(t);
        }

        this.marchi = BULBI.map(([p, q]) => {
            const punto = two.makeCircle(0, 0, 7);
            punto.fill = '#ff4d4d';
            punto.stroke = 'white';
            punto.linewidth = 2;
            this.gTangenze.add(punto);

            const cerchio = two.makeCircle(0, 0, 10);
            cerchio.noFill();
            cerchio.stroke = '#ffd24d';
            cerchio.linewidth = 2.5;
            this.gBulbi.add(cerchio);

            const etichetta = two.makeText(`${p}/${q}`, 0, 0, {
                size: 26, family: 'Noto Sans', weight: 'bold', fill: '#ffd24d'});
            this.gBulbi.add(etichetta);

            // tangenza, normale, centro e raggio si calcolano una volta sola:
            // il centro esatto costa un Newton e non va rifatto a ogni frame.
            return Object.assign(geometriaBulbo(p, q), {punto, cerchio, etichetta});
        });

        // Conteggio delle antenne: una linea dal centro di diramazione a ogni
        // punta, col numero in fondo. La linea segue il raggio vero, quindi
        // l'occhio lo puo' percorrere anche quando e' sottile e sbiadito -
        // che e' il caso dei bulbi con q grande, cioe' quelli che contano.
        this.raggiAntenna = [];
        for(let i = 0; i < 40; i++) {
            const linea = two.makeLine(0, 0, 0, 0);
            linea.stroke = 'rgba(255,255,255,0.75)';
            linea.linewidth = ANTENNA_TRATTO;
            const c = two.makeCircle(0, 0, ANTENNA_R);
            c.fill = 'rgba(0,0,0,0.6)';
            c.stroke = 'white';
            c.linewidth = ANTENNA_TRATTO;
            const t = two.makeText('', 0, 0, {
                size: ANTENNA_TESTO, family: 'Noto Sans',
                weight: 'bold', fill: 'white'});
            this.gAntenne.add(linea);
            this.gAntenne.add(c);
            this.gAntenne.add(t);
            this.raggiAntenna.push({linea, c, t});
        }
    }

    aggiornaOverlay() {
        this.gAssi.visible     = this.mostra.assi;
        this.gTangenze.visible = this.mostra.tangenze;
        this.gBulbi.visible    = this.mostra.bulbi;
        this.gAntenne.visible  = this.mostra.antenne;

        if(this.mostra.assi) this.aggiornaAssi();
        if(this.mostra.tangenze || this.mostra.bulbi) this.aggiornaBulbi();
        if(this.mostra.antenne) this.aggiornaAntenne();
    }

    aggiornaAssi() {
        const o = this.aSchermo(0, 0);
        this.asseX.vertices[0].set(-W/2, o.y);
        this.asseX.vertices[1].set( W/2, o.y);
        this.asseY.vertices[0].set(o.x, -H/2);
        this.asseY.vertices[1].set(o.x,  H/2);

        // tacche a passo "tondo" rispetto allo zoom
        const passo = Math.pow(10, Math.round(Math.log10(this.vista.larghezza / 8)));
        const sx = this.vista.cx - this.vista.larghezza/2;
        const dx = this.vista.cx + this.vista.larghezza/2;
        let k = 0;
        for(let re = Math.ceil(sx/passo)*passo; re < dx && k < this.tacche.length; re += passo) {
            const p = this.aSchermo(re, 0);
            this.tacche[k].vertices[0].set(p.x, o.y - 9);
            this.tacche[k].vertices[1].set(p.x, o.y + 9);
            this.tacche[k].visible = true;
            k++;
        }
        for(; k < this.tacche.length; k++) this.tacche[k].visible = false;
    }

    aggiornaBulbi() {
        const s = this.scala;
        this.marchi.forEach(m => {
            const pt = this.aSchermo(m.tangenza.re, m.tangenza.im);
            m.punto.position.set(pt.x, pt.y);
            m.punto.visible = Math.abs(pt.x) < W/2 && Math.abs(pt.y) < H/2;

            const pc = this.aSchermo(m.centro.re, m.centro.im);
            const r = m.raggio / s;
            m.cerchio.position.set(pc.x, pc.y);
            m.cerchio.radius = r;

            // L'etichetta va DENTRO il cardioide, a distanza fissa in pixel
            // dal punto di tangenza. Sopra il bulbo finiva spesso fuori
            // schermo o sopra un altro bulbo; qui il fondo e' nero e vuoto,
            // e la frazione resta leggibile a qualunque zoom.
            const d = ETICHETTA_PX * s;
            const pl = this.aSchermo(m.tangenza.re - m.normale.re*d,
                                     m.tangenza.im - m.normale.im*d);
            m.etichetta.position.set(pl.x, pl.y);

            const dentro = Math.abs(pc.x) < W/2 + r && Math.abs(pc.y) < H/2 + r;
            m.cerchio.visible = dentro && r > 4;
            m.etichetta.visible = r > 16 &&
                Math.abs(pl.x) < W/2 - 30 && Math.abs(pl.y) < H/2 - 20;
        });
    }

    // Si disegnano le antenne di TUTTE le tappe che cadono nella vista, non
    // solo quelle della tappa corrente: 'this.tappa' cambia soltanto con le
    // frecce, quindi arrivando su un bulbo con il mouse non compariva niente.
    aggiornaAntenne() {
        let k = 0;
        TAPPE.forEach(t => {
            const punte = t.punte || [];
            if(punte.length === 0) return;

            // Il centro di diramazione: quello dichiarato, oppure il
            // baricentro delle punte, che per una stella di raggi ci casca
            // vicino ed evita di doverlo raccogliere a mano.
            const c = t.centro || [
                punte.reduce((a, p) => a + p[0], 0) / punte.length,
                punte.reduce((a, p) => a + p[1], 0) / punte.length];
            const pc = this.aSchermo(c[0], c[1]);
            if(Math.abs(pc.x) > 0.55*W || Math.abs(pc.y) > 0.55*H) return;

            // E anche abbastanza grande da poterci contare sopra: a uno zoom
            // largo l'antenna del 5/13 sta dentro l'inquadratura ma e' larga
            // nove pixel, e tredici pallini numerati diventerebbero una
            // macchia.
            let raggioSchermo = 0;
            punte.forEach(pp => {
                const p = this.aSchermo(pp[0], pp[1]);
                raggioSchermo = Math.max(raggioSchermo,
                    Math.hypot(p.x - pc.x, p.y - pc.y));
            });
            if(raggioSchermo < ANTENNA_MIN_PX) return;

            // I pallini crescono FINO a ANTENNA_R, ma non oltre meta' della
            // distanza fra le due punte piu' vicine, altrimenti si
            // accavallano. Quella distanza va MISURATA, non stimata come
            // 2*pi*R/q: la formula suppone le punte distribuite su un giro
            // intero, mentre nei bulbi veri stanno raggruppate da una parte,
            // e dava un valore troppo ottimista.
            const schermo = punte.map(pp => this.aSchermo(pp[0], pp[1]));
            let minD = Infinity;
            for(let i = 0; i < schermo.length; i++)
                for(let j = i + 1; j < schermo.length; j++)
                    minD = Math.min(minD, Math.hypot(
                        schermo[i].x - schermo[j].x,
                        schermo[i].y - schermo[j].y));
            const rp = isFinite(minD) ? Math.min(ANTENNA_R, 0.46*minD) : ANTENNA_R;
            const corpo = Math.round(rp * ANTENNA_TESTO / ANTENNA_R);

            punte.forEach((pp, i) => {
                if(k >= this.raggiAntenna.length) return;
                const p = schermo[i];
                const r = this.raggiAntenna[k++];
                r.linea.vertices[0].set(pc.x, pc.y);
                r.linea.vertices[1].set(p.x, p.y);
                r.c.position.set(p.x, p.y);
                r.c.radius = rp;
                r.t.position.set(p.x, p.y);
                r.t.size = corpo;
                r.t.value = String(i + 1);
                r.linea.visible = r.c.visible = r.t.visible = true;
            });
        });
        for(; k < this.raggiAntenna.length; k++) {
            const r = this.raggiAntenna[k];
            r.linea.visible = r.c.visible = r.t.visible = false;
        }
    }

    aggiorna() {
        this.disegnaFrattale();
        this.aggiornaOverlay();
    }

    // --- interazione ---------------------------------------------------
    // Il fattore di scala CSS di #container: il mouse arriva in pixel di
    // finestra, la vista ragiona nel sistema 1920x1080.
    get fattoreCss() {
        return this.contenitore.getBoundingClientRect().width / W;
    }

    inCoordinateVista(clientX, clientY) {
        const r = this.contenitore.getBoundingClientRect();
        const k = this.fattoreCss;
        return {x: (clientX - r.left)/k - W/2, y: (clientY - r.top)/k - H/2};
    }

    collegaEventi() {
        this.suRotella = (e) => {
            e.preventDefault();
            const v = this.inCoordinateVista(e.clientX, e.clientY);
            const prima = this.aComplesso(v.x, v.y);
            const k = Math.pow(1.0015, e.deltaY);
            this.vista.larghezza = Math.max(1e-5, Math.min(6, this.vista.larghezza * k));
            const dopo = this.aComplesso(v.x, v.y);
            // lo zoom tiene fermo il punto sotto il puntatore
            this.vista.cx += prima.re - dopo.re;
            this.vista.cy += prima.im - dopo.im;
            this.aggiorna();
        };
        this.contenitore.addEventListener('wheel', this.suRotella, {passive: false});
    }

    onPointerDown(x, y) { this.ultimoPuntatore = {x, y}; }
    onPointerDrag(x, y, dx, dy) {
        const k = this.fattoreCss;
        this.vista.cx -= dx / k * this.scala;
        this.vista.cy += dy / k * this.scala;
        this.ultimoPuntatore = {x, y};
        this.aggiorna();
    }

    // --- tappe e tasti --------------------------------------------------
    vaiAllaTappa(i) {
        if(i < 0 || i >= TAPPE.length) return;
        this.tappa = i;
        const t = TAPPE[i];
        const c = t.tuttoInsieme
            ? {re: VISTA_INIZIALE.cx, im: VISTA_INIZIALE.cy}
            : centroEsatto(t.p, t.q);
        if(this.volo) this.volo.kill();
        this.volo = gsap.to(this.vista, {
            duration: 1.2, ease: 'power2.inOut',
            cx: c.re, cy: c.im, larghezza: t.larghezza,
            onUpdate: () => this.aggiorna()
        });
    }

    nextAct() { if(this.tappa < TAPPE.length - 1) this.vaiAllaTappa(this.tappa + 1); }
    prevAct() { if(this.tappa > 0) this.vaiAllaTappa(this.tappa - 1); }

    onKeyDown(event) {
        const k = event.key;
        if(k === 'a' || k === 't' || k === 'b' || k === 'n') {
            const quale = {a: 'assi', t: 'tangenze', b: 'bulbi', n: 'antenne'}[k];
            this.mostra[quale] = !this.mostra[quale];
            this.aggiornaOverlay();
        } else if(k === 'r') {
            if(this.volo) this.volo.kill();
            this.vista = Object.assign({}, VISTA_INIZIALE);
            this.tappa = 0;
            this.aggiorna();
        } else if((k === 'c' || k === 'C') && this.ultimoPuntatore) {
            // Strumenti di lavoro per riempire TAPPE: stampano la riga gia'
            // formattata da incollare. 'c' una punta, 'C' il centro.
            const v = this.inCoordinateVista(this.ultimoPuntatore.x, this.ultimoPuntatore.y);
            const c = this.aComplesso(v.x, v.y);
            const coppia = `[${c.re.toFixed(8)}, ${c.im.toFixed(8)}]`;
            console.log(k === 'C' ? `centro: ${coppia},` : `${coppia},`);
        }
    }

    cleanup() {
        if(this.volo) { this.volo.kill(); this.volo = null; }
        this.contenitore.removeEventListener('wheel', this.suRotella);
        if(this.gl) {
            const perdi = this.gl.getExtension('WEBGL_lose_context');
            if(perdi) perdi.loseContext();
        }
        this.canvas.remove();
    }

    async end() {
    }
}

let t = new MandelbrotSlide();
