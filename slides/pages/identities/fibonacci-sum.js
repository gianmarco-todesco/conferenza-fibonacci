import {Slide, two, center, TextLine} from '../../libs/gmtlib.js';   

/*
class TextLine {
    constructor(texts, style, margin) {
        this.group = two.makeGroup();
        this.texts = texts.map(t => two.makeText(t, 0, 0, style));
        this.texts.forEach(t => this.group.add(t));        
        this.margin = margin || 50;
    }
    update() {
        two.update();
        let x = 0;
        this.texts.forEach((item)=>{
            let cr = item.getBoundingClientRect();
            item.position.x = x + cr.width/2;
            x += cr.width + this.margin;
        });
    }
}
*/


function createTile(cellSize, rowsCount) {
    // Parametri configurabili
    const unit = cellSize/40.0;
    const borderRadius = 6 * unit;   // angoli arrotondati del bordo
    const borderWidth = 2 * unit;     // spessore del bordo
    const bgColor = rowsCount==1 ? 'rgb(42, 152, 221)' : 'rgb(200, 215, 35)';      // sfondo opaco
    const gridColor = 'rgb(50, 87, 100)';       // colore griglia molto sottile
    const borderColor = 'rgb(0,100,0)';  
    const gridLineWidth = 0.8;

    // dimensioni totali del rettangolo
    const width = cellSize;
    const height = rowsCount * cellSize;

    // sfondo arrotondato (disegnato prima)
    const tileGroup = two.makeGroup();
    const tile = two.makeRoundedRectangle(
        0, 0, width-borderWidth, height-borderWidth, borderRadius);
    tile.fill = bgColor;
    tile.stroke = borderColor;
    tile.linewidth = borderWidth;
    tileGroup.add(tile);
    if(rowsCount == 2) {
        const line = two.makeLine(-width/2, 0, -width/2, 0);
        line.stroke = gridColor;
        line.linewidth = gridLineWidth;
        tileGroup.add(line);
    }
    
    return tileGroup;
}

function getPatterns(n) {
    if(n==0) return [[]];
    else if(n==1) return [[1]];
    else if(n==2) return [[2],[1,1]];

    let lst = [];
    for(let i=n-2;i>=0;i--) {
        let prefix = [];
        for(let j=0;j<i;j++) prefix.push(1);
        prefix.push(2);
        let subpatterns = getPatterns(n - 2 - i);
        for(let j=0; j<subpatterns.length; j++) {
            lst.push(prefix.concat(subpatterns[j]));    
        }
    }
    let pattern = [];
    for(let j=0;j<n;j++) pattern.push(1);
    lst.push(pattern);
    return lst;
} 

class FibonacciSumSlide extends Slide {
    constructor() {
        super("FibonacciSum");
    }   
    initialize() {
    }
    start() {
        let mainGroup = this.mainGroup; 

        let line = two.makeGroup();
        mainGroup.add(line);

        let textLines = this.textLines = [];
        
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
            "\\sum_{i=1}^{n} F_i = F_1 + F_2 + ... + F_n = ?", 
                div, { throwOnError: false });


        const textSytle = {
            size: 60,
            family: 'Arial',
            fill: 'white',
            weight: 550
        };
        // Fibonacci numbers
        let fibs = [1,1];
        for(let i=0; i<11; i++) fibs.push(fibs[i]+fibs[i+1]);
        // text line with fibonacci numbers
        let fibTextLine = new TextLine(fibs.map(i => `${i}`), textSytle, 50);
        textLines.push(fibTextLine);
        mainGroup.add(fibTextLine.group);
        fibTextLine.group.position.set(-800,-200);
        fibTextLine.texts.forEach(t => t.opacity = 0);

        textSytle.size = 40;
        for(let i=3; i<10; i++) {
            let s = 1;
            let ts = ['1'];
            for(let j=1;j<i;j++) { ts.push('+',`${fibs[j]}`); s+=fibs[j]}
            ts.push("=", `${s}`);
            let sumTextLine = new TextLine(ts, textSytle, 10);
            sumTextLine.texts[sumTextLine.texts.length-1].fill = 'orange';
            sumTextLine.texts.forEach(t => t.opacity = 0);
            textLines.push(sumTextLine);
            mainGroup.add(sumTextLine.group);
            sumTextLine.group.position.set(
                fibTextLine.group.position.x, 
                -150 + (i-2)*60);
        }

        this.highlightItems = [];
        for(let i=0; i<2;i++) {
            let rect = two.makeRectangle(0,0,10,10);
            rect.fill = 'none';
            rect.stroke = 'red';
            rect.linewidth = 4;
            rect.visible = false;
            this.mainGroup.add(rect);
            this.highlightItems.push(rect);
        }
        let circle = two.makeCircle(0,0,40);
        circle.fill = 'none';
        circle.stroke = 'orange';
        circle.linewidth = 4;
        circle.visible = false;
        this.mainGroup.add(circle);
        this.highlightItems.push(circle);


        two.update(); // per ottenere le dimensioni
        textLines.forEach(tl => tl.update());

        
        let tl = gsap.timeline();
        textLines.forEach((textLine,i)=>{
            tl.to(textLine.texts, {opacity:1, duration:0.3, stagger:0.1}, i*0.5);
        });
        this.tiles = [];
        this.fooRects = [];
        this._state = 0;
        this._act = 0;
        // textLines.forEach(textLine => { textLine.texts.forEach(t => t.opacity=1); });
    }
    cleanup() {
        this.mainGroup.remove();
        this.div.remove();
        this._act = 0;
        
    }

    setHighlightingRect(rect, textLine, m) {
        const mrg = 10;
        let x0 = textLine.group.position.x;
        let y0 = textLine.group.position.y;
        let br0 = textLine.texts[0].getBoundingClientRect();
        let height = br0.height;
        let x1 = x0 + textLine.texts[0].position.x - br0.width/2;
        let x2 = x0 + textLine.texts[m-1].position.x + 
            textLine.texts[m-1].getBoundingClientRect().width/2;
        let w = x2 - x1 + 2 * mrg;
        let x = (x1 + x2)/2;
        rect.position.set(x, y0-6);
        rect.width = w;
        rect.height = height + mrg;
    }
    selectSum(m) {
        if(m<3) return;
        this.highlightItems.forEach(r => r.visible = true);
        this.setHighlightingRect(this.highlightItems[0], this.textLines[0], m);
        this.setHighlightingRect(this.highlightItems[1], this.textLines[m-3+1],m*2-1);
        let textLine = this.textLines[0];
        this.highlightItems[2].position.set(
            textLine.group.position.x + textLine.texts[m+1].position.x,
            textLine.group.position.y);
    }
    async end() {
    }

    
    // obsolete: see next slide
    foo(n) {
        let tl = gsap.timeline();
        let keptLine = null;
        for(let i=1;i<this.textLines.length;i++) {
            if(i != 4) this.textLines[i].group.visible = false;
            else {
                let keptLine = this.textLines[i];
                keptLine.old_y = keptLine.group.position.y;
                //tl.to(keptLine.group.position, {y: -100, duration: 1});
            }
        }
        this.tiles.forEach(t => t.remove());
        this.tiles = [];
        this.fooRects.forEach(r => r.remove());
        this.fooRects = [];

        const tileSize = 25;
        let patterns = getPatterns(n);
        console.log(patterns.length)
        for(let i=0; i<patterns.length;i++) {
            let pattern = patterns[i];
            let x = -800 + 60 * i;
            let y = 200;
            for(let j=0; j<pattern.length; j++) {
                let m = pattern[j];
                let tile = createTile(tileSize,m);            
                this.mainGroup.add(tile);
                tile.position.set(x, y + (m*tileSize)/2);
                this.tiles.push(tile);
                y += m * tileSize;
                tile.opacity = 0;                    
            }
        }

        tl.to(this.tiles, {opacity:1, duration:0.5, stagger:0.01});
        const fibs = [1,1,2,3,5,8,13,21,34,55,89,144,233];
        let t = 0;
        for(let i=0;i<n-1;i++) {
            let rect = two.makeRectangle();
            rect.fill = 'none';
            rect.stroke = 'white';
            rect.linewidth = 3; 
            this.mainGroup.add(rect);
            let x0 = -800 + 60 * t;
            let x1 = x0 + 60 * (fibs[i]);
            let y0 = 200 + tileSize * (n-i);
            let y1 = 200 + tileSize * n + tileSize/2;
            rect.position.set((x0 + x1)/2-30, (y0+y1)/2);
            rect.width = x1 - x0;
            rect.height = y1-y0;
            t += fibs[i];
            this.fooRects.push(rect);
            rect.opacity = 0;
        }
    }

    // obsolete: see next slide
    foo2() {
        if(this.fooRects.length == 0) return;
        let tl = gsap.timeline();
        tl.to(this.fooRects, {opacity:1, duration:0.5, stagger:0.1});
    }


    nextAct() { 
        if(this._act < 7)
        {
            this._act++;
            this.selectSum(this._act+2);
        }
    }
    prevAct() { 
        if(this._act > 0)
        {
            this._act--;
            this.selectSum(this._act+2);
        }

    } 
    onKeyDown(event) {
        console.log(event);
        if('1'<=event.key && event.key <= '9') {
            this.selectSum(parseInt(event.key)+2);
        } else if(event.key === '0') {
            this.highlightItems.forEach(r => r.visible = false);
        } else if(event.key === 'f') {
            this.foo(7);
        } else if(event.key === 'g') {
            this.foo2();
        }
    }
}

let t = new FibonacciSumSlide();

