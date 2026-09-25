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

class GoldenCatSlide extends Slide {
    constructor() {
        super("Golden Cat");
    }   
    initialize() {
    }
    start() {
        let mainGroup = this.mainGroup;
        let sprites = this.sprites = [];
        let sprite;
        let labels = this.labels = [];
        let label;


        sprite = two.makeSprite('/slides/assets/fibonacci-cat.jpg', 0, 0);
        mainGroup.add(sprite);
        sprite.scale = 1.0;
        sprite.position.set( 0, 0);
        sprites.push(sprite);
                
        
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

let t = new GoldenCatSlide();

