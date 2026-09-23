import {Slide, two, center, TextLine} from '../../libs/gmtlib.js';   

/*
class TextLine {
    constructor(texts, style) {
        this.group = two.makeGroup();
        this.texts = texts.map(t => two.makeText(t, 0, 0, style));
        this.texts.forEach(t => this.group.add(t));        
    }
    update() {
        two.update();
        let x = 0;
        this.texts.forEach((item)=>{
            let cr = item.getBoundingClientRect();
            item.position.x = x + cr.width/2;
            x += cr.width + 20;
        });
    }
}
*/

class TwoSquaresSumSlide extends Slide {
    constructor() {
        super("TwoSquaresSum");
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
            "F_{k}^2 + F_{k+1}^2 = ?",  // F_{k} \\cdot F_{k+1}
                div, { throwOnError: false });

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
        
        for(let i=0; i<7; i++) {
            let a = fibs[i], b = fibs[i+1];
            let a2 = a*a, b2 = b*b;
            let s = a2 + b2;    
            let ts = [`${fibs[i]}²`, '+', `${fibs[i+1]}²`, 
                '=', `${a2}`, '+', `${b2}`, 
                "=", `${s}`]
            let sumTextLine = new TextLine(ts, textSytle);
            textLines.push(sumTextLine);
            mainGroup.add(sumTextLine.group);
            sumTextLine.group.position.set(fibTextLine.group.position.x, i*70);
        }
        two.update(); // per ottenere le dimensioni
        textLines.forEach(tl => tl.update());

        this.hlRects = [];
        for(let i=0;i<4;i++) {
            let rect = two.makeRectangle();
            rect.fill = 'none';
            rect.stroke = 'red';
            rect.linewidth = 4;
            mainGroup.add(rect);
            this.hlRects.push(rect);
            rect.visible = false;
        }
        let circle = two.makeCircle(0,0,40);
        circle.fill = 'none';
        circle.stroke = 'orange';
        circle.linewidth = 4;
        circle.visible = false;
        this.mainGroup.add(circle);
        this.circle = circle;
        this.index = -1;
    }
    cleanup() {
        this.mainGroup.remove();
        this.div.remove();
    }
    async end() {
 
    }

    setHlRect(rect, textLine, i0, i1) {
        let offx = textLine.group.position.x;
        let offy = textLine.group.position.y;
        let x0 = offx + textLine.texts[i0].position.x - textLine.texts[0].getBoundingClientRect().width/2;
        let y0 = offy + textLine.texts[i0].position.y - textLine.texts[0].getBoundingClientRect().height/2;
        let x1 = offx + textLine.texts[i1].position.x + textLine.texts[i1].getBoundingClientRect().width/2;
        let y1 = offy + textLine.texts[i1].position.y + textLine.texts[i1].getBoundingClientRect().height/2;
        
        let d = 0;
        if(i0>10) d = 20;
        rect.position.set((x0+x1)/2 - d/2, (y0+y1)/2-5);
        rect.width = x1 - x0 + 30 + d;
        rect.height = y1 - y0 + 20;
        rect.visible = true;
    } 
    setCircle(circle, textLine, i) {
        let offx = textLine.group.position.x;
        let offy = textLine.group.position.y;
        let x = offx + textLine.texts[i].position.x;
        let y = offy + textLine.texts[i].position.y;
        circle.position.set(x, y);
        circle.radius = i < 6 ? 40 : 60;
        circle.visible = true;
    }

    selectSum(i) {
        let textLine = this.textLines[i+1];
        this.setHlRect(this.hlRects[0], textLine, 0, textLine.texts.length-1);
        textLine = this.textLines[0];
        this.setHlRect(this.hlRects[1], textLine, i, i);
        this.setHlRect(this.hlRects[2], textLine, i+1, i+1);
        // this.setCircle(this.circle, textLine, i+1);
        let k = i*2+1;
        // this.setHlRect(this.hlRects[3], textLine, k+1, k+1);    
        this.setCircle(this.circle, textLine, k+1);    
    }

    nextAct() {
        if(this.index<=5) {
            this.index++;
            this.selectSum(this.index);
        }
    }
    prevAct() {
        if(this.index>=0) {
            this.index--;
            if(this.index>=0) this.selectSum(this.index);
            else this.hlRects.forEach(r => r.visible = false);
        }
    }

}

let t = new TwoSquaresSumSlide();

