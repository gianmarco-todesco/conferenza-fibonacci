import {Slide, two, center} from '../../libs/gmtlib.js';   

class SpriteProxy {
    constructor(sprite) {
        this.sprite = sprite;
        sprite.opacity = 0;
    }
    set opacity(v) {
        this.sprite.opacity = v;
    }   
    get opacity() {
        return this.sprite.opacity;
    }
}

class MythSlide extends Slide {
    constructor() {
        super("Myth");
    }   
    initialize() {
    }
    start() {
        let mainGroup = this.mainGroup;
        let sprites = this.sprites = [];
        let sprite;
        let labels = this.labels = [];
        let label;


        sprite = two.makeSprite('/slides/assets/partenone.png', 0, 0);
        mainGroup.add(sprite);
        sprite.scale = 1.0;
        sprite.position.set( 300, 0);
        sprites.push(sprite);

        sprite = two.makeSprite('/slides/assets/monalisa2.png', 0, 0);
        mainGroup.add(sprite);
        sprite.scale = 1.0;
        sprite.position.set(-500, 0);
        sprites.push(sprite);
                
        
        // La Gioconda e' alta 700 px centrata in 0, quindi arriva a -350: il
        // titolo sta a -450 e non la tocca.
        label = two.makeText('Mitologia', 0, -450, {
            size: 76, weight: 'bold', family: 'Noto Sans, Arial',
            alignment: 'center', baseline: 'middle'});
        label.fill = 'white';
        mainGroup.add(label);
        labels.push(label);

        let sp = sprites.map(s => new SpriteProxy(s));
        gsap.to(sp, {opacity:1, duration:1, stagger:0.2});
        labels.forEach((l) => l.opacity=0);
        gsap.to(labels, {opacity:1, duration:1, stagger:0.3, delay: sp.length*0.2});
        /*
        let tl = gsap.timeline();
        sprites.forEach((s,i) => {
            s.opacity=0;
            tl.to(s, {opacity:1, duration:1}, i*0.3);
        });
        tl.to(labels, {opacity:1, duration:1, stagger:0.3});
        */
    }
    async end() {
        let lst = [...this.sprites, ...this.labels];
        return gsap.to(lst, {opacity:0, duration:1, stagger:0.2}).then();
    }
    cleanup() {
        this.mainGroup.remove();
    }
}

let t = new MythSlide();

