import {Slide, two, center} from '../../libs/gmtlib.js';   

const sqrt_2 = Math.sqrt(2);

class Rect {
    constructor(x,y,lx,ly,name) {
        this.x = x;
        this.y = y;
        this.lx = lx;
        this.ly = ly;   
        this.name = name;
    }
    topLeft() { return { x:this.x - this.lx/2, y:this.y - this.ly/2};  }
    topRight() { return { x:this.x + this.lx/2, y:this.y - this.ly/2};  }
    bottomLeft() { return { x:this.x - this.lx/2, y:this.y + this.ly/2};  }
    bottomRight() { return { x:this.x + this.lx/2, y:this.y + this.ly/2};  }
}

function intersectLines(p0, p1, p2, p3) {
    let a1 = p1.y - p0.y;
    let b1 = p0.x - p1.x;
    let c1 = a1 * p0.x + b1 * p0.y; 
    let a2 = p3.y - p2.y;

    let b2 = p2.x - p3.x;

    let c2 = a2 * p2.x + b2 * p2.y;
    let det = a1 * b2 - a2 * b1;

    if(det == 0) {
        return null;
    } else {
        let x = (b2 * c1 - b1 * c2) / det;
        let y = (a1 * c2 - a2 * c1) / det;
        return {x:x, y:y};
    }
}

function clipLine(x0,y0,x1,y1) {
    const xmin = 0, ymin = 0;
    const xmax = two.width, ymax = two.height;
    let dx = x1 - x0, dy = y1 - y0;
    let t0 = 0.0, t1 = 1.0;
    const EPS = 1e-12;

    function clip(p, q) {
        if (Math.abs(p) < EPS) {
            // Line parallel to this edge
            return q >= 0;
        }
        const r = q / p;
        if (p < 0) {
            if (r > t1) return false;
            if (r > t0) t0 = r;
        } else {
            if (r < t0) return false;
            if (r < t1) t1 = r;
        }
        return true;
    }

    // Left edge: x >= xmin  ->  -dx * t <= x0 - xmin  => p = -dx, q = x0 - xmin
    if (!clip(-dx, x0 - xmin) ||
        // Right edge: x <= xmax ->  dx * t <= xmax - x0    => p = dx, q = xmax - x0
        !clip(dx, xmax - x0) ||
        // Top edge: y >= ymin
        !clip(-dy, y0 - ymin) ||
        // Bottom edge: y <= ymax
        !clip(dy, ymax - y0)) {
        return null;
    }

    // If segment is outside after clipping
    if (t0 > t1) {
        return null;
    }

    const nx0 = x0 + dx * t0;
    const ny0 = y0 + dy * t0;
    const nx1 = x0 + dx * t1;
    const ny1 = y0 + dy * t1;

    x0 = nx0; y0 = ny0; x1 = nx1; y1 = ny1;
    return {x0:x0, y0:y0, x1:x1, y1:y1};
}


function subractInPlace(p1, p2) {
    p1.x -= p2.x;
    p1.y -= p2.y;   
}

function subtract(p1, p2) {
    return {x: p1.x - p2.x, y: p1.y - p2.y};
}

function norm(p) {
    return Math.sqrt(p.x * p.x + p.y * p.y);
}

function midPoint(p1, p2) {
    return  { x: (p1.x + p2.x)/2, y: (p1.y + p2.y)/2 };
}

/*
function anchor(x,y,cmd = Two.Commands.line) {
    let a = new Two.Anchor(x,y,0,0,0,0,cmd);
    a.command = cmd;
    return a;
}
*/

function makeDoubleArrow(x0,y0,x1,y1) {
    let d = Math.sqrt((x1 - x0)**2 + (y1 - y0)**2);
    let ux = (x1 - x0)/d;
    let uy = (y1 - y0)/d;
    let dx = 10;
    let dy = 5;
    function ma(x,y) { return new Two.Anchor(x,y,0,0,0,0,Two.Commands.move); }
    function la(x,y) { return new Two.Anchor(x,y,0,0,0,0,Two.Commands.line); }

    const vertices = [ 
        ma(x0 + ux * dx - uy * dy, y0 + uy * dx + ux * dy),
        la(x0, y0),
        la(x0 + ux * dx + uy * dy, y0 + uy * dx - ux * dy),
        ma(x1 - ux * dx - uy * dy, y1 - uy * dx + ux * dy),
        la(x1, y1),
        la(x1 - ux * dx + uy * dy, y1 - uy * dx - ux * dy),
        ma(x0,y0), la(x1,y1)
    ];
    const path = new Two.Path(vertices, false, false, true);
    path.noFill();
    path.cap = 'round';
    path.join = 'round';
    two.add(path);
    return path;
}

//
// Spiral Slide
// 
class ASpiral extends Slide {
    constructor(isGolden=true) {
        super("GoldenSpiral");
        this.isGolden = isGolden;
        this._computeRectsData();
        this._center = {x:0,y:0};
        this._scale = 1;
        this._spiralLength = 0.0;
        this._hideText = false;
    }   
    _world2Screen(p) { return { x: this._center.x + this._scale * p.x, y: this._center.y + this._scale * p.y }; }   

    _computeRectsData() {
        let rects = this.rects = [];
        if(this.isGolden) {
            // golden spiral
            rects.push(new Rect(0,0,1,1, '1'));
            let a = 0, b = 1;
            let x = 0, y = 0;
            let m = 20;
            let dx = 1, dy = 0;
            for(let i=0;i<m;i++) {
                x += (-a * dy + (a+2*b) * dx) *0.5;
                y += ( a * dx + (a+2*b) * dy) *0.5;
                [a,b] = [b, a + b];
                [dx,dy] = [ -dy, dx];
                rects.push(new Rect(x,y,b,b, `${b}`));
            }

        } else {
            // A_n spiral 
            let size = 1;
            let x = 0, y = 0;
            let lx = size * sqrt_2, ly = size;
            let dx = -lx, dy = -ly/2;
            let m = 30;
            rects.push(new Rect(0,-ly/2,lx,ly*2, 'A6'));
            for(let i=0;i<m;i++) {
                x += dx;
                y += dy;
                if(i%2==0) ly *= 2;
                else lx *= 2;
                [dx,dy] = [ -dy * sqrt_2, dx* sqrt_2];
                rects.push(new Rect(x,y,lx,ly, i<=6 ? `A${6-i}` : ' '));
            }
        }
        this.rects.forEach((r,i) => { r.index = i; });
        let p0 = this.rects[this.rects.length - 1].topLeft();
        let p1 = this.rects[this.rects.length - 3].bottomRight();
        let p2 = this.rects[this.rects.length - 2].bottomLeft();
        let p3 = this.rects[this.rects.length - 4].topRight();
        this._p0 = p0;
        this._p1 = p1;
        this._p2 = p2;
        this._p3 = p3;  
        this._spiralCenter = intersectLines(p0, p1, p2, p3);
        
        for(let r of rects) {
            subractInPlace(r, this._spiralCenter);
        }   
        subractInPlace(this._p0, this._spiralCenter);
        subractInPlace(this._p1, this._spiralCenter);
        subractInPlace(this._p2, this._spiralCenter);
        subractInPlace(this._p3, this._spiralCenter);   

        let i = 4 * Math.floor((this.rects.length - 1)/4);
        let p4 = this.rects[i].topLeft();
        let p5 = this.rects[i-4].topLeft();
        this.scalePeriod = norm(p4)/norm(p5);

        /*
        let i = rects.length - 1;
        let p0 = rects[i].topLeft();
        let p1 = rects[i-2].bottomRight();


        let line = two.makeLine(x0,y0,x1,y1);
        line.stroke = 'yellow';
        group.add(line);

        x0 = rects[i-1].x0, y0 = rects[i-1].y1;
        x1 = rects[i-3].x1, y1 = rects[i-3].y0;
        line = two.makeLine(x0,y0,x1,y1);
        */

    }

    getRectVertices(index) {
        let rects = this.rects;
        switch(index%4) {
            case 2: 
                return {
                    p0:rects[index-2].topLeft(), 
                    p1:rects[index].bottomRight()
                };
            case 3:
                return {
                    p0:rects[index].topLeft(), 
                    p1:rects[index-1].bottomRight()
                };        
            case 0:
                return {
                    p0:rects[index].topLeft(), 
                    p1:rects[index-2].bottomRight()
                };
            default:
                return {
                    p0:rects[index-1].topLeft(), 
                    p1:rects[index].bottomRight()
                };
        }
    }

    _makeRectElements() {
        this._center.x = center.x;
        this._center.y = center.y;
        let textStyle = {
            size: 22,
            family: 'Arial',
            fill: 'white',
            weight: 'bold'
        }
        for(let r of this.rects) {
            let rect = two.makeRectangle();
            rect.fill = 'none';
            rect.stroke = 'white';    
            r.rectElement = rect;   
            this.group.add(rect);
            let text = two.makeText(`${r.name}`, 0,0, textStyle);
            r.textElement = text;
            this.group.add(text);
            rect.visible = false;
            text.visible = false;
        }
    }

    compareRects() {
        let i = this._lastRectIndex;
        if(i<2) return;
        let rect = two.makeRectangle();
        rect.fill = 'none';
        rect.stroke = 'red';
        rect.linewidth = 3;
        // this.group.add(rect);
        let {p0,p1} = this.getRectVertices(i);
        p0 = this._world2Screen(p0);
        p1 = this._world2Screen(p1);
        let p = midPoint(p0,p1);
        rect.position.set(p.x, p.y);
        rect.width = p1.x - p0.x;
        rect.height = p1.y - p0.y;
        let prev = this.getRectVertices(i-1);
        let prevPos = this._world2Screen(midPoint(prev.p0, prev.p1));
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        let tl = gsap.timeline({
            onComplete() {rect.remove();}
        });
        rect.opacity = 0.0;
        tl.to(rect, { opacity : 1, duration: 0.25 });
        // tl.addPause(1);
        // tl.to({}, { duration: 1 });
        tl.to(rect, { scale : 1/goldenRatio, duration: 0.5 });
        tl.to(rect, { rotation : Math.PI/2, duration: 0.5 }, 't');
        tl.to(rect.position, { x : prevPos.x, y : prevPos.y, duration: 0.5 },'t');
        // tl.addPause(1);
        tl.to({}, { duration: 1 });
        tl.to(rect, { opacity : 0, duration: 1 });
        

    }
    _updateRect(r) {
        const sc = this._scale;
        const c = this._center;
        let el = r.rectElement;
        el.position.set(c.x + sc * r.x, c.y + sc * r.y);
        el.width = sc * r.lx;
        el.height = sc * r.ly;
        if(sc * r.ly > 30 && r.rectElement.visible && !this._hideText) {
            r.textElement.visible = true;
            r.textElement.position.set(c.x + sc * r.x, c.y + sc * r.y);            
        } else {
            r.textElement.visible = false;
        }
    }
    _updateRects() {
        for(let r of this.rects) {
            this._updateRect(r);
        }
    }
    _makeSpiral() {
        let vertices = [];
        for(let i=0; i<500; i++) {
            vertices.push(new Two.Anchor(0,0));
        }
        this.spiral = two.makePath(vertices, false);
        this.spiral.stroke = 'yellow';
        this.spiral.lineWidth = 0.5;
        this.spiral.closed = true;
        this.spiral.curved = true;
        this.spiral.fill = 'orange';
        this.spiral.visible = false;
        this.group.add(this.spiral);
    }
    _updateSpiral() {
        if(this.spiralLength <= 0.0) {
            this.spiral.visible = false;
            return;
        }
        this.spiral.visible = true;
        const thickness = 0.01;
        let start = performance.now();

        const p0 = this.rects[0].topRight();
        this._p5 = p0;
        const r0 = norm(p0);        
        const theta0 = Math.atan2(p0.y,p0.x);

        let i = 4*Math.floor((this.rects.length-1)/4);
        const p1 = this.rects[i].topRight();
        const r1 = norm(p1);
        const theta1 = Math.atan2(p1.y,p1.x) + Math.PI * 2 * i / 4;
        this._p6 = p1;

        const param = this.isGolden ? Math.log(r1/r0)/(theta1-theta0) : Math.log(2)/Math.PI;

        const theta_a = theta0; 

        //let maxRadius = two.height / 2 * 2;
        //let maxTheta = Math.log(maxRadius/(r0 * this._scale))/param;
        // console.log("max theta = ", maxTheta);
        
        const theta_b = theta0 + (theta1 - theta0) * this.spiralLength; // Math.min(maxTheta, theta_a + this._spiralLength);

        const rr0 = this.isGolden ? r0 : r0 / Math.sqrt(2);
        
        this.spiral.vertices.forEach((v,i) => {
            let t = 2 * i / this.spiral.vertices.length;
            let side = 1;
            if(t>1) { t = 2-t; side = -1; }

            let theta = theta_a * (1-t) + theta_b * t;
            let r = rr0 * Math.exp(param * (theta-theta0) + side*thickness);
            
            v.x = this._center.x + this._scale * r * Math.cos(theta);
            v.y = this._center.y + this._scale * r * Math.sin(theta);
        });
        

    }

    _setLine(line, p0,p1) {
        let c = clipLine(
            this._center.x + this._scale * p0.x,
            this._center.y + this._scale * p0.y,
            this._center.x + this._scale * p1.x,
            this._center.y + this._scale * p1.y
        );
        if(c) {
            line.visible = true;
            line.vertices[0].set(c.x0, c.y0);
            line.vertices[1].set(c.x1, c.y1);
        } else {
            line.visible = false;
        }
    }

    _updateGeometry() {
        this._updateRects();
        this._updateSpiral();
        //this._setLine(this.line1, this._p0, this._p1);
        //this._setLine(this.line2, this._p2, this._p3);
        //this._setLine(this.line3, this._p5, this._p6);
    }

    showRect(index) {
        let r = this.rects[index];
        r.rectElement.visible = r.textElement.visible = true;
        r.rectElement.opacity = r.textElement.opacity = 0;
        r.rectElement.scale = 0.1;
        this._updateRect(r);
        gsap.to(r.rectElement, {opacity:1, scale:1, duration:1});
        gsap.to(r.textElement, {opacity:1, duration:1});
    }
    hideRect(index) {
        let r = this.rects[index];
        gsap.to(r.rectElement, {opacity:0, scale:0, duration:1, onComplete() {
            r.rectElement.visible = false;
            console.log("hidden");
        }});
        if(r.textElement.visible)
        {
            gsap.to(r.textElement, {opacity:0, duration:1, onComplete() {
                r.textElement.visible = false;
            }});
        }

        // r.rectElement.visible = r.textElement.visible = true;
        // r.rectElement.opacity = r.textElement.opacity = 0;
        // r.rectElement.scale = 0.1;
        // this._updateRect(r);
    }
    showAllRects() {
        for(let i=0;i<this.rects.length;i++) {
            if(!this.rects[i].rectElement.visible) 
                this.showRect(i);
        }
    }
    showSpiral() {
        this.spiralLength = 0;
        gsap.to(this, {spiralLength:1.0, duration:2});        
    }
    hideSpiral() {
        let spiral = this.spiral;
        const me = this;
        gsap.to(this.spiral, {opacity:0.0, duration:2, onComplete(){
            me._spiralLength = 0.0;
            spiral.visible = false;
            spiral.opacity = 1.0;   
        }});
    }
    addDimensionLines() {
        if(this.dimensionLine) this.dimensionLine.remove();

        let k = this._lastRectIndex;
        const rects = this.rects;
        let p0,p1,p2;
        let xlabel='?', ylabel='?';
        switch(k%4) {
            case 0: 
                p0 = this._world2Screen(rects[k-1].bottomLeft());
                p1 = this._world2Screen(rects[k-2].bottomRight()); 
                p2 = this._world2Screen(rects[k].topRight());
                xlabel = rects[k].name;
                ylabel = `${rects[k-1].name}+${rects[k].name}`;
                break;
            case 1: 
                p0 = this._world2Screen(rects[k-2].bottomLeft());
                p1 = this._world2Screen(rects[k].bottomRight()); 
                p2 = this._world2Screen(rects[k].topRight());
                xlabel = `${rects[k-1].name}+${rects[k].name}=${rects[k+1].name}`;
                ylabel = `${rects[k].name}`;
                break;
            case 2:
                p0 = this._world2Screen(rects[k].bottomLeft());
                p1 = this._world2Screen(rects[k].bottomRight()); 
                p2 = this._world2Screen(rects[k-1].topRight());
                xlabel = `${rects[k].name}`;
                ylabel = `${rects[k-1].name}+${rects[k].name}=${rects[k+1].name}`;
                break;
            default:
                p0 = this._world2Screen(rects[k].bottomLeft());
                p1 = this._world2Screen(rects[k-1].bottomRight()); 
                p2 = this._world2Screen(rects[k-2].topRight());
                xlabel = `${rects[k-1].name}+${rects[k].name}=${rects[k+1].name}`;
                ylabel = `${rects[k].name}`;
        }
        let g = two.makeGroup();
        let rect = this.rects[k];
        let y = p0.y + 30;
        let arrow1 = makeDoubleArrow(p0.x,y,p1.x,y);
        arrow1.stroke = 'yellow'
        g.add(arrow1);
        let x = p1.x + 30;
        let arrow2 = makeDoubleArrow(x,p1.y,x,p2.y);
        arrow2.stroke = 'yellow'
        g.add(arrow2);
        const textStyle = {
            size: 20,
            family: 'Arial',
            fill: 'lightblue'
        };
        let txt = two.makeText(xlabel, (p0.x + p1.x)/2, y + 20, textStyle);
        g.add(txt);
        textStyle.alignment = 'left';
        txt = two.makeText(ylabel, x + 20, (p1.y + p2.y)/2, textStyle);
        g.add(txt);
        this.dimensionLine = g;
        /*
        let txt = two.makeText(`${rect.lx.toFixed(2)}`, (x0+x1)/2, y + 10, {
            size: 20,
            family: 'Arial',
            fill: 'lightblue'});
        g.add(txt);
        */
    }

    
    start() {

        this._scale = 40;
        let group = this.group = two.makeGroup();
        this._makeSpiral();
        this._makeRectElements();
        
        
        for(let i=0;i<3; i++) {
            this.rects[i].rectElement.visible = true;
            this.rects[i].textElement.visible = true;
        }
        this._lastRectIndex = 2;
        this.line1 = two.makeLine(); this.line1.stroke = "yellow"
        this.line2 = two.makeLine(); this.line2.stroke = "cyan"
        this.line3 = two.makeLine(); this.line3.stroke = "blue"
        this.line1.visible = false;
        this.line2.visible = false;
        this.line3.visible = false;
        this._hideText = false;

        
        
        this._updateGeometry();
    }
    async end() {
        
    }

    cleanup() {
        this.group.remove();
        this.group = null;
        this.rects.forEach(r=>{
            r.rectElement = null;
            r.textElement = null;
        });
        this.spiral = null;
        if(this.scaleTicker) {
            gsap.ticker.remove(this.scaleTicker);
            this.scaleTicker = null;
        }
    }

    onPointerDrag(x,y,dx,dy,event) {
        this.scale *= Math.exp(dx * 0.01);
        //this._spiralRange[1] += dx * 0.001;
        //this._updateSpirals();
        // this.spiralLength += dx * 0.02;
    }

    set scale(v) {
        // if(v<0.01) v*=4.0;
        // if(v<0.01) v*=this.scalePeriod;
        if(this.dimensionLine) {
            this.dimensionLine.remove();
            this.dimensionLine = null;
        }

        if(v != this._scale) {
            this._scale = v;
            this._updateGeometry()
        }
    }

    get scale() {
        return this._scale;
    }

    set spiralLength(v) {
        if(v<0)v=0;
        if(v != this._spiralLength) {
            this._spiralLength = v;
            if(this._spiralLength > 0.0) {
                this.spiral.visible = true;
                this._updateGeometry()
            } else {
                this.spiral.visible = false;
            }
        }
    }
    get spiralLength() {
        return this._spiralLength;    
    }
    
    nextAct() {
        this._lastRectIndex++;
        this.showRect(this._lastRectIndex);
    }
    prevAct() {
        if(this._lastRectIndex>0)
        {
            this._lastRectIndex--;
            this.hideRect(this._lastRectIndex+1);

        }

    }

    onKeyDown(event) {
        if(event.key == 's') {
            if(!this.spiral || !this.spiral.visible)
                this.showSpiral();
            else
                this.hideSpiral();
        } else if(event.key == 'p') {
            this.foo();
        } else if(event.key == 'l') {
            if(!this.dimensionLine)
                this.addDimensionLines();
            else 
            {
                this.dimensionLine.remove();
                this.dimensionLine = null;
            }
        } else if(event.key == 'a') {
            this.showAllRects();
        } else if(event.key == 'c') {
            this.compareRects();
        }
    }

    foo() {
        const me = this;
        function step() {
            me.scale *= 0.99;
            if(me.scale < 0.33) me.scale *= me.scalePeriod;
        }
        if(this.scaleTicker) {
            this._hideText = false;
            gsap.ticker.remove(this.scaleTicker);
            this.scaleTicker = null;
        } else {
            this._hideText = true;
            this.rects.forEach(r=>{
                r.rectElement.visible = true;
                r.textElement.visible = false
            })
            this.scaleTicker = step;
            gsap.ticker.add(step);

        }
        
    }

}


class SimpleImageSlide extends Slide {
    constructor(path, scale=1.0) {
        super("ImageSlide:" + path);
        this.path = path;
        this.scale = scale;
    }   
    initialize() {
    }
    start() {
        let mainGroup = two.makeGroup();
        mainGroup.position.set(center.x, center.y);
        this.mainGroup = mainGroup; 
        this.addImage(this.path, 0,0,this.scale);
    }

    addImage(path, x, y, scale) {
        let sprite = two.makeSprite(path, 0, 0);
        this.mainGroup.add(sprite);
        sprite.scale = scale;
        sprite.position.set(x, y);
        // sprite.visible = false;
        return sprite;
    }

    async end() {
    }
    cleanup() {
        this.mainGroup.remove();
    }
}

/*
class SpiralImageSlide extends Slide {
    constructor() {
        super("Spiralimage");
    }   
    initialize() {
    }
    start() {
        let mainGroup = two.makeGroup();
        mainGroup.position.set(center.x, center.y);
        this.mainGroup = mainGroup; 
        this.addImage('/slides/assets/shell1.jpg', 0,0,0.75);
    }

    addImage(path, x, y, scale) {
        let sprite = two.makeSprite(path, 0, 0);
        this.mainGroup.add(sprite);
        sprite.scale = scale;
        sprite.position.set(x, y);
        // sprite.visible = false;
        return sprite;
    }

    async end() {
    }
    cleanup() {
        this.mainGroup.remove();
    }
}
*/


let t1 = new ASpiral(true);
let spiralImageSlide = new SimpleImageSlide('/slides/assets/shell1.jpg', 0.75);
let catImageSlide = new SimpleImageSlide('/slides/assets/fibonacci-cat.jpg', 1.0);
let t2 = new ASpiral(false);

