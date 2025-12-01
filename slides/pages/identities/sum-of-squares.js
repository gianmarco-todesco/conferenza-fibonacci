import {Slide, two, center, TextLine} from '../../libs/gmtlib.js';   



class SumOfSquaresSlide extends Slide {
    constructor() {
        super("SumOfSquares");
    }   
    initialize() {
    }
    start() {
        let mainGroup = this.mainGroup;
        

        let div = this.div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = '40px';
        div.style.left = '0px';
        div.style.width = '100%';
        div.style.fontSize = '30px';
        div.style.color = 'white';
        div.style.textAlign = 'center';
        document.body.appendChild(div);
        katex.render(
            "\\sum_{i=1}^{n} F_i^2 = F_1^2 + F_2^2 + ... + F_n^2 = ?", 
                div, { throwOnError: false });
        

        let line = two.makeGroup();
        mainGroup.add(line);

        const textSytle = {
            size: 60,
            family: 'Arial',
            fill: 'white',
            weight: 550
        };
        let fibs = [1,1];
        for(let i=0; i<13; i++) fibs.push(fibs[i]+fibs[i+1]);
        let textLines = this.textLines = [];
        let fibTextLine = new TextLine(fibs.map(i => `${i}`), textSytle, 50);
        textLines.push(fibTextLine);
        mainGroup.add(fibTextLine.group);
        fibTextLine.group.position.set(-800,-200);
        
        for(let i=1; i<7; i++) {
            let s = 1
            let ts = ["1²"];
            for(let j=1;j<i;j++) { ts.push('+',`${fibs[j]}²`); s += fibs[j]**2}
            ts.push("=", `${s}`);
            ts.push("=", `${fibs[i-1]}*${fibs[i]}`);
            let sumTextLine = new TextLine(ts, textSytle);
            textLines.push(sumTextLine);
            mainGroup.add(sumTextLine.group);
            sumTextLine.group.position.set(
                fibTextLine.group.position.x, (i-1)*80);
            sumTextLine.texts.forEach(t => t.opacity = 0); 
            let m = sumTextLine.texts.length;
            sumTextLine.texts[m-3].fill = 'orange';
            sumTextLine.texts[m-1].fill = 'cyan';
        }
        two.update(); // per ottenere le dimensioni
        textLines.forEach(tl => tl.update());
        
        let tl = gsap.timeline();
        textLines.forEach((textLine,i)=>{
            if(i==0) return;
            let tt = textLine.texts.filter((t,j,arr)=> j+2<arr.length);
            tl.to(tt, {opacity:1, duration:0.3, stagger:0.1}, i*0.5);
        });
        

    }
    cleanup() {
        this.mainGroup.remove();
        this.div.remove();
    }
    async end() {
        
    }

    nextAct() {
        let tl = gsap.timeline();
        for(let i=1; i<this.textLines.length; i++) {
            let texts = this.textLines[i].texts;
            let m = texts.length;
            let tt = [texts[m-2], texts[m-1]];
            tl.to(tt, {opacity:1, duration:0.3, stagger:0.1}, (i-1)*0.5);    
        }
    }
}

let t = new SumOfSquaresSlide();

