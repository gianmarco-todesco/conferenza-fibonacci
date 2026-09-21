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
//   c  stampa in console la coordinata sotto il puntatore
//      (serve per raccogliere le punte delle antenne: vedi TAPPE)

const W = 1920, H = 1080;
const RISOLUZIONE = 1;      // abbassa a 0.75 se la GPU arranca

const VISTA_INIZIALE = {cx: -0.65, cy: 0, larghezza: 3.2};

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

// Raggio del bulbo p/q: la forma precisa di "la grandezza va come 1/q^2".
// Per 1/2 da' esattamente 1/4, che e' il raggio vero del disco di periodo 2
// centrato in -1; per 1/3 da' un centro a -0.125+0.746i contro il valore
// noto -0.1226+0.7449i.
function raggioBulbo(p, q) {
    return Math.sin(Math.PI*p/q) / (q*q);
}

function centroBulbo(p, q) {
    const t = puntoCardioide(p/q);
    const n = normaleUscente(p/q);
    const r = raggioBulbo(p, q);
    return {re: t.re + r*n.re, im: t.im + r*n.im};
}

// ---------------------------------------------------------------------
// Le tappe. Questa slide non e' un esploratore, e' uno strumento da palco:
// dal vivo si preme un tasto e si atterra, non si cerca col mouse davanti a
// duecento persone. E' il cammino di Fibonacci: 1/2, 1/3, 2/5, 3/8, 5/13.
//
// 'punte' e' l'aiuto per contare le antenne: le coordinate delle q punte,
// raccolte una volta guardando lo schermo col tasto 'c'. Sono da riempire a
// mano perche' il punto di diramazione dell'antenna NON ha una formula
// chiusa: piazzarle a occhio da' posizioni esatte, una formula le darebbe
// approssimate. Vuote = nessun numero disegnato.
const TAPPE = [
    {p: 1, q: 2,  larghezza: 3.2,   tuttoInsieme: true, punte: []},
    {p: 1, q: 3,  larghezza: 0.80,  punte: []},
    {p: 2, q: 5,  larghezza: 0.34,  punte: []},
    {p: 3, q: 8,  larghezza: 0.14,  punte: []},
    {p: 5, q: 13, larghezza: 0.055, punte: []},
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

            return {p, q, punto, cerchio, etichetta};
        });

        // conteggio delle antenne: un pallino numerato per punta
        this.numeriAntenna = [];
        for(let i = 0; i < 40; i++) {
            const c = two.makeCircle(0, 0, 17);
            c.fill = 'rgba(0,0,0,0.6)'; c.stroke = 'white'; c.linewidth = 2;
            const t = two.makeText('', 0, 0, {
                size: 22, family: 'Noto Sans', weight: 'bold', fill: 'white'});
            this.gAntenne.add(c);
            this.gAntenne.add(t);
            this.numeriAntenna.push({c, t});
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
            const t = puntoCardioide(m.p / m.q);
            const pt = this.aSchermo(t.re, t.im);
            m.punto.position.set(pt.x, pt.y);
            m.punto.visible = Math.abs(pt.x) < W/2 && Math.abs(pt.y) < H/2;

            const cb = centroBulbo(m.p, m.q);
            const pc = this.aSchermo(cb.re, cb.im);
            const r = raggioBulbo(m.p, m.q) / s;
            m.cerchio.position.set(pc.x, pc.y);
            m.cerchio.radius = r;
            m.etichetta.position.set(pc.x, pc.y - r - 22);

            const dentro = Math.abs(pc.x) < W/2 + r && Math.abs(pc.y) < H/2 + r;
            m.cerchio.visible = dentro && r > 4;
            m.etichetta.visible = dentro && r > 26;
        });
    }

    aggiornaAntenne() {
        const punte = (TAPPE[this.tappa] && TAPPE[this.tappa].punte) || [];
        this.numeriAntenna.forEach((n, i) => {
            if(i < punte.length) {
                const p = this.aSchermo(punte[i][0], punte[i][1]);
                n.c.position.set(p.x, p.y);
                n.t.position.set(p.x, p.y);
                n.t.value = String(i + 1);
                n.c.visible = n.t.visible = true;
            } else {
                n.c.visible = n.t.visible = false;
            }
        });
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
            : centroBulbo(t.p, t.q);
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
        } else if(k === 'c' && this.ultimoPuntatore) {
            // strumento di lavoro: raccoglie le coordinate per TAPPE.punte
            const v = this.inCoordinateVista(this.ultimoPuntatore.x, this.ultimoPuntatore.y);
            const c = this.aComplesso(v.x, v.y);
            console.log(`[${c.re.toFixed(8)}, ${c.im.toFixed(8)}],`);
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
