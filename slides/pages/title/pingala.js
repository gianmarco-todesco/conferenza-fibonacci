import {Slide, two, center} from '../../libs/gmtlib.js';

const TITLE_Y = -340;   // titolo
const ROW_Y0  = -80;    // baseline della prima riga
const ROW_DY  = 175;    // passo fra una riga e l'altra
const DESC_DY = 58;     // distanza fra il nome e la sua descrizione
// Stacco fra la colonna delle date e quella dei nomi. Il valore e' scelto
// perche' il blocco risulti centrato: le date sbordano a sinistra, le
// descrizioni a destra, e cosi' i due margini si pareggiano.
const COL_X   = -300;

const FADE    = 0.5;    // durata della comparsa di una riga
const STAGGER = 0.25;   // ritardo fra una riga e la successiva

// Gopala (~1135) resta fuori: l'utente ne vuole tre, e a voce e' piu' comodo
// citarlo accanto a Hemachandra che dargli una riga sua.
const ROWS = [
    {date: 'III-II sec. a.C.', name: 'Piṅgala',
     desc: 'il problema: sillabe brevi (1 tempo) e lunghe (2)'},
    {date: '~700 d.C.', name: 'Virahāṅka',
     desc: 'la prima enunciazione esplicita della ricorrenza'},
    {date: '~1150', name: 'Hemacandra',
     desc: 'la riprende: da qui i «numeri di Hemacandra»'},
];

class PingalaSlide extends Slide {
    constructor() {
        super("Pingala");
    }
    initialize() {
    }

    start() {
        const mainGroup = this.mainGroup;

        this.title = two.makeText('Prima di Fibonacci', 0, TITLE_Y, {
            size: 110, family: 'Noto Sans', fill: 'white', weight: 'bold'
        });
        mainGroup.add(this.title);

        this.rows = ROWS.map((r, i) => {
            const g = two.makeGroup();
            mainGroup.add(g);
            g.position.set(0, ROW_Y0 + i*ROW_DY);

            // Le due colonne sono allineate con 'alignment' invece che
            // misurando i testi: qui non si muove niente, quindi basta.
            const date = two.makeText(r.date, COL_X - 40, 0, {
                size: 60, family: 'Noto Sans', weight: 'bold',
                fill: 'rgba(91, 221, 241, 1)', alignment: 'right'
            });
            const name = two.makeText(r.name, COL_X + 40, 0, {
                size: 70, family: 'Noto Sans', weight: 'bold',
                fill: 'white', alignment: 'left'
            });
            const desc = two.makeText(r.desc, COL_X + 40, DESC_DY, {
                size: 46, family: 'Noto Sans',
                fill: '#c9c9e0', alignment: 'left'
            });

            [date, name, desc].forEach(t => g.add(t));
            g.userData = {texts: [date, name, desc]};
            return g;
        });

        this.play();
    }

    // Tutto compare da solo all'arrivo della slide, una riga dopo l'altra.
    play() {
        const tl = this.tl = gsap.timeline();

        this.title.opacity = 0;
        tl.to(this.title, {duration: FADE, opacity: 1}, 0);

        this.rows.forEach((g, i) => {
            g.userData.texts.forEach(t => t.opacity = 0);
            g.position.x = -60;
            const t0 = 0.35 + i*STAGGER;
            tl.to(g.userData.texts, {duration: FADE, opacity: 1}, t0);
            tl.to(g.position, {duration: FADE, x: 0, ease: 'power2.out'}, t0);
        });

        return tl;
    }

    // Freccia destra durante la comparsa: mostra tutto subito.
    nextAct() {
        if(this.tl && this.tl.progress() < 1) this.tl.progress(1);
    }

    onKeyDown(event) {
        if(event.key === '0') this.play();
    }

    cleanup() {
        if(this.tl) { this.tl.kill(); this.tl = null; }
    }

    async end() {
        const tl = gsap.timeline();
        tl.to(this.title, {duration: 0.4, opacity: 0}, 0);
        this.rows.forEach((g, i) => {
            tl.to(g.userData.texts, {duration: 0.4, opacity: 0}, i*0.08);
            tl.to(g.position, {duration: 0.4, x: 80}, i*0.08);
        });
        return tl;
    }
};

let t = new PingalaSlide();
