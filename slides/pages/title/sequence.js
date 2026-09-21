import {Slide, two, center} from '../../libs/gmtlib.js';

// Quanti numeri iniziali restano centrati sullo schermo prima che la riga
// cominci a scorrere verso sinistra.
const CENTER_ON = 3;

// Spazio fra un numero e il successivo: deve bastare a ospitare il "+" e l'"="
// che vengono infilati nei buchi durante la costruzione.
const NUM_MARGIN = 150;

const ROW_Y  = 50;     // riga dei numeri
const DEF_Y  = -340;   // prima riga della definizione (i due semi)
const DEF_DY = 150;    // distanza fra le due righe della definizione

// La cascata automatica dura circa 45 secondi a velocita' 1. Alza questo
// valore per accorciarla (2 = doppia velocita').
const RUN_SPEED = 1;

const LAST_ACT = 4;

// Ritmo di un passo, a battute di mezzo secondo:
//   0.00  compare il + (blu) fra gli ultimi due numeri, che restano azzurri
//   0.50  compare l'= (blu)
//   1.00  compare il numero nuovo (blu)
//   1.50  svanisce il +
//   1.75  svanisce l'=, e il numero nuovo da blu passa ad azzurro
//   poi PAUSA, e si ricomincia
const BATTUTA    = 0.5;    // distanza fra un evento e il successivo
const FADE       = 0.3;    // durata di una comparsa o scomparsa (< BATTUTA)
const SFASAMENTO = 0.25;   // ritardo dell'= rispetto al + nell'uscita
const PAUSA      = 1.0;    // respiro fra un passo e l'altro

const COL_NORMALE = '#5bdff5';   // azzurro: i numeri della successione
const COL_ATTIVO  = '#0000ff';   // blu: il +, l'= e il numero appena nato

// Posizioni finali delle due immagini: cosi' il blocco che formano insieme
// resta centrato sullo schermo (il ritratto e' largo 827, la pagina 558).
const LEO_X = -340;
const LIB_X = 475;

function setInBetween(t,t0,t1) {
    let x0 = t0.position.x + t0.getBoundingClientRect().width/2;
    let x1 = t1.position.x - t1.getBoundingClientRect().width/2;
    t.position.x = (x0+x1)/2;
}

function computeXBetween(t0,t1) {
    let x0 = t0.position.x + t0.getBoundingClientRect().width/2;
    let x1 = t1.position.x - t1.getBoundingClientRect().width/2;
    return (x0+x1)/2;
}

// Compone una riga di formula con veri pedici restando dentro Two.js.
// Gli altri page usano KaTeX dentro <div> appesi a document.body: quei div
// stanno fuori da #container, quindi non prendono la trasformazione di scala e
// vivono in pixel di finestra. Qui la riga dei numeri scorre in coordinate
// Two.js, e mescolare i due sistemi costerebbe piu' di quanto valga.
//
// frags: [{s:'F'}, {s:'n', sub:true}, {s:'='}, ...]
// Ogni frammento puo' avere un 'gap' esplicito, cioe' lo spazio che lo precede.
function makeMathLine(frags, style, opts) {
    opts = opts || {};
    const subScale = opts.subScale || 0.55;
    const subDy    = opts.subDy    || 0.30;
    const gap      = (opts.gap !== undefined) ? opts.gap : style.size * 0.28;

    const subStyle = Object.assign({}, style, {
        size: Math.round(style.size * subScale)
    });

    const group = two.makeGroup();
    const items = frags.map(f => {
        const t = two.makeText(f.s, 0, 0, f.sub ? subStyle : style);
        group.add(t);
        return {t: t, f: f};
    });

    two.update();

    // Gli spazi dentro una stringa SVG vengono collassati, quindi la
    // spaziatura si fa con i buchi e non con i caratteri.
    let x = 0;
    items.forEach((it, i) => {
        const g = (i === 0) ? 0
                : (it.f.gap !== undefined) ? it.f.gap
                : (it.f.sub ? 0 : gap);
        const w = it.t.getBoundingClientRect().width;
        x += g;
        it.t.position.x = x + w/2;
        if(it.f.sub) it.t.position.y = style.size * subDy;
        x += w;
    });
    // ricentra la riga su x = 0
    items.forEach(it => it.t.position.x -= x/2);

    return group;
}

class SequenceSlide extends Slide {
    constructor() {
        super("Sequence");
    }
    initialize() {
    }
    start() {

        let mainGroup = this.mainGroup;

        // La successione parte dalla definizione: F(0) = 0.
        let fibs = [0,1];
        for(let i=0; i<30; i++)
            fibs.push(fibs[i]+fibs[i+1]);

        const textStyle = this.textStyle = {
            size: 150,
            family: 'Noto Sans',
            fill: 'white',
            weight: 'bold'
        }

        this.buildDefinition();

        // gruppo dei numeri
        let numbers = this.numbers = two.makeGroup();
        numbers.position.set(0, ROW_Y);
        mainGroup.add(numbers);

        let fibsTexts = this.fibsTexts = fibs.map(i => two.makeText(i.toString(),0,0, textStyle));
        fibsTexts.forEach(t => {
            numbers.add(t);
            t.visible = false;
            t.userData = {};
        });

        two.update();

        // La riga e' centrata sui primi CENTER_ON numeri e prosegue verso
        // destra; da li' in poi scorrera' da sola.
        let w = 0;
        for(let i=0; i<CENTER_ON; i++)
            w += fibsTexts[i].getBoundingClientRect().width;
        let x = -(w + NUM_MARGIN*(CENTER_ON-1))/2;
        fibsTexts.forEach(t => {
            const bw = t.getBoundingClientRect().width;
            t.userData.x = x + bw/2;
            t.position.x = t.userData.x;
            x += bw + NUM_MARGIN;
        });

        this.plus = two.makeText("+", 0,0, textStyle);
        this.equal = two.makeText("=", 0,0, textStyle);
        numbers.add(this.plus);
        numbers.add(this.equal);

        this.leonardo = this.addImage(
            '/slides/assets/Fibonacci2.jpg', 0, -700, 0.4,
            'Leonardo Pisano detto il Fibonacci o Bigollo. ca. 1170 – 1250', 450);
        // La didascalia dice di cosa parla il libro, non cosa c'e' in questa
        // pagina: il problema dei conigli e' un esercizio fra centinaia, e
        // nominarlo qui faceva sembrare che il Liber Abaci fosse un libro sui
        // conigli. Che la pagina mostrata sia quella si dice a voce.
        //
        // Una riga sola: la seconda arriverebbe a 13px dalla riga dei numeri.
        // addImage accetta un elenco di righe, ma per usarlo qui bisogna
        // rimpicciolire le due immagini di circa il 5%.
        this.liberAbaci = this.addImage(
            '/slides/assets/liber-abaci.jpg', 1000, -100, 0.75,
            'Liber Abaci, 1202: i numeri indo-arabici', 465);

        this.act = 0;
        this.reset();
    }

    // I due semi sulla stessa riga (sono i dati), la regola sotto.
    buildDefinition() {
        const defStyle = {
            size: 100,
            family: 'Noto Sans',
            // fill: 'rgba(91, 221, 241, 1)',
            fill: 'white',
            weight: 'bold'
        };

        const def = this.definition = two.makeGroup();
        this.mainGroup.add(def);

        const seeds = this.defSeeds = makeMathLine([
            {s:'F'}, {s:'0', sub:true}, {s:'='}, {s:'0'},
            {s:'F', gap:240}, {s:'1', sub:true}, {s:'='}, {s:'1'}
        ], defStyle);
        seeds.position.set(0, DEF_Y);
        def.add(seeds);

        const rule = this.defRule = makeMathLine([
            {s:'F'}, {s:'n', sub:true}, {s:'='},
            {s:'F'}, {s:'n-1', sub:true}, {s:'+'},
            {s:'F'}, {s:'n-2', sub:true}
        ], defStyle);
        rule.position.set(0, DEF_Y + DEF_DY);
        def.add(rule);
    }

    // 'caption' puo' essere una stringa o un elenco di righe.
    addImage(path, x, y, scale, caption, captionYOffset=30) {
        let imgGroup = two.makeGroup();
        imgGroup.visible = false;
        this.mainGroup.add(imgGroup);
        let sprite = two.makeSprite(path, 0, 0);
        imgGroup.add(sprite);
        sprite.scale = scale;
        if(caption) {
            const lines = Array.isArray(caption) ? caption : [caption];
            lines.forEach((line, i) => {
                let text = two.makeText(line, 0, captionYOffset + i*38, {
                    size: 30,
                    family: 'Noto Sans',
                    fill: 'white',
                });
                imgGroup.add(text);
            });
        }
        imgGroup.userData = {x0: x, y0: y};
        imgGroup.position.set(x,y);
        return imgGroup;
    }

    cleanup() {
        this.stopRun(false);
    }
    async end() {
        let tl = gsap.timeline();
        tl.to(this.numbers.position, {duration: 0.5, y : 2000},0);
        tl.to(this.definition.position, {duration: 0.5, y : -2000},0);
        tl.to(this.leonardo.position, {duration: 0.5, x : -2000},0);
        tl.to(this.liberAbaci.position, {duration: 0.5, x : 2000},0);
        return tl;
    }

    onKeyDown(event) {
        if(event.key === '0') this.setAct(0);
    }

    setAct(act) {
        this.act = act;
        switch(this.act) {
            case 0: this.reset(); break;
            case 1: this.showSeeds(); break;
            case 2: this.runSequence(); break;
            case 3: this.showPicture1(); break;
            case 4: this.showPicture2(); break;
        }
    }
    nextAct() {
        // Senza il tetto il contatore continuava a salire in silenzio oltre
        // l'ultimo atto, e poi la freccia sinistra non faceva niente per
        // altrettante pressioni.
        if(this.act < LAST_ACT) this.setAct(this.act + 1);
    }
    prevAct() {
        if(this.act>0) this.setAct(this.act - 1);
    }

    reset() {
        this.stopRun(false);

        // definizione al suo posto
        this.definition.visible = true;
        this.definition.position.set(0,0);

        // riga dei numeri vuota
        this.numbers.position.set(0, ROW_Y);
        this.fibsTexts.forEach(t => {
            t.position.x = t.userData.x;
            t.visible = false;
            t.opacity = 0;
            t.fill = COL_NORMALE;
        });
        this.plus.visible = false;
        this.equal.visible = false;

        // immagini fuori scena: senza questo, tornare all'atto 0 dopo averle
        // mostrate le lasciava sullo schermo.
        [this.leonardo, this.liberAbaci].forEach(g => {
            g.visible = false;
            g.position.set(g.userData.x0, g.userData.y0);
        });
    }

    // I due semi scendono nella riga: da qui in poi non entra piu' nessun dato.
    showSeeds() {
        [0,1].forEach(i => {
            const t = this.fibsTexts[i];
            t.visible = true;
            t.opacity = 0;
            gsap.to(t, {duration:0.5, opacity:1, delay: i*0.2});
            });
        }

    // Tutto su UNA timeline. Ogni passo k mostra txts[k] + txts[k+1] =
    // txts[k+2], quindi anche la prima addizione e' un passo come gli altri:
    // con questa cadenza l'apertura non ha piu' bisogno di un caso a parte.
    startSequence(k0, m) {
        const txts = this.fibsTexts;
        const plus = this.plus, equal = this.equal;
        const tl = gsap.timeline();

        plus.fill = equal.fill = COL_ATTIVO;
        plus.opacity = equal.opacity = 0;
        plus.visible = equal.visible = true;
        two.update();

        for(let k = k0; k < k0 + m && k + 2 < txts.length; k++) {
            const a = txts[k], b = txts[k+1], nuovo = txts[k+2];
            nuovo.visible = true;
            nuovo.opacity = 0;
            // Il colore va messo DENTRO la timeline: assegnandolo qui, tutti
            // e 32 i numeri diventerebbero blu al momento della costruzione
            // invece che al loro turno. Non si vede (sono a opacita' zero),
            // ma il codice direbbe una cosa falsa sullo stato della scena.

            // Le posizioni si calcolano ora: i numeri non si muovono mai,
            // scorre soltanto il gruppo che li contiene.
            const xPlus  = computeXBetween(a, b);
            const xEqual = computeXBetween(b, nuovo);

            const t0 = tl.duration();     // inizio di questo passo

            // battuta 0: il + fra gli ultimi due numeri, che restano azzurri
            tl.set(plus.position, {x: xPlus}, t0);
            tl.set(nuovo, {fill: COL_ATTIVO}, t0);
            tl.to(plus, {duration: FADE, opacity: 1}, t0);

            // battuta 1: l'=
            tl.set(equal.position, {x: xEqual}, t0 + BATTUTA);
            tl.to(equal, {duration: FADE, opacity: 1}, t0 + BATTUTA);

            // battuta 2: il numero nuovo, in blu
            tl.to(nuovo, {duration: FADE, opacity: 1}, t0 + 2*BATTUTA);

            // battuta 3: esce il +, e un quarto di secondo dopo l'=
            tl.to(plus,  {duration: FADE, opacity: 0}, t0 + 3*BATTUTA);
            tl.to(equal, {duration: FADE, opacity: 0},
                  t0 + 3*BATTUTA + SFASAMENTO);

            // il numero nuovo entra nella successione: da blu ad azzurro
            tl.to(nuovo, {duration: FADE, fill: COL_NORMALE},
                  t0 + 3*BATTUTA + SFASAMENTO);

            // Lo scorrimento: newX e' assoluto, quindi il conto resta giusto
            // anche se qui leggiamo la posizione prima che le animazioni
            // precedenti siano partite.
            const w = nuovo.userData.x + nuovo.getBoundingClientRect().width;
            if(this.numbers.position.x + w > two.width / 2) {
                tl.to(this.numbers.position,
                      {duration: 2*BATTUTA, x: two.width/2 - w}, t0);
            }

            // il respiro prima del passo successivo
            tl.to({}, {duration: PAUSA}, t0 + 3*BATTUTA + SFASAMENTO + FADE);
        }
        return tl;
    }

    // La cascata dura ~45 secondi: senza questo, premendo avanti prima della
    // fine i tween di scorrimento rimasti in coda continuano a muovere la riga
    // sotto le immagini.
    stopRun(complete) {
        if(!this.runTl) return;
        if(complete) this.runTl.progress(1);
        this.runTl.kill();
        this.runTl = null;
    }

    // L'animazione parte e prosegue da sola fino in fondo.
    runSequence() {
        this.runTl = this.startSequence(0, 1000);
        this.runTl.timeScale(RUN_SPEED);
    }

    showPicture1() {
        // La sequenza NON si ferma: la riga scende e prosegue alla stessa
        // velocita'. Il tween della y non litiga con quelli della timeline,
        // che sono sulla x.
        gsap.to(this.numbers.position, {duration:1, y:480});

        // La definizione esce adesso e non all'inizio dell'animazione: la
        // regola resta leggibile mentre la si vede applicare, e se ne va
        // quando serve il posto per il ritratto (che la coprirebbe).
        gsap.to(this.definition.position, {duration:0.8, y:-900, ease:'power2.in'});

        let img = this.leonardo;
        img.visible = true; img.opacity = 1;
        gsap.to(img.position, {duration:1, x:0, y:-100});
    }
    showPicture2() {
        let img = this.liberAbaci;
        img.position.set(1000,-100);
        img.visible = true; img.opacity = 1;
        gsap.to(this.leonardo.position, {duration:1, x:LEO_X});
        gsap.to(img.position, {duration:1, x:LIB_X});
    }

}

let t = new SequenceSlide();
