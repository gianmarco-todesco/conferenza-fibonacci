import {Slide, two, center} from '../../libs/gmtlib.js';   

function subtract(a,b) {
    return {x: a.x - b.x, y: a.y - b.y};
}
function norm(p) {
    return Math.sqrt(p.x*p.x + p.y*p.y);
}
function normalize(p) {
    let norm = Math.sqrt(p.x*p.x + p.y*p.y);
    return {x: p.x / norm, y: p.y / norm};
}
function dot(u,v) {
    return u.x * v.x + u.y * v.y;
}   
function getAngle(u, v) {
    let x = dot(u,v);
    let y = dot(u, {x:-v.y,y:v.x});
    return Math.atan2(y,x);
}
function getDistance(a,b) {
    return norm( subtract(a,b) );
}

class SunFlower extends Slide {
    constructor() {
        super("SunFlower");
    }   
    initialize() {
    }
    start() {
        let mainGroup = this.mainGroup = two.makeGroup();
        mainGroup.position.set(center.x, center.y);
        
        let n = 2000;
        let balls = this.balls = [];
        for(let i=0; i<n; i++) {
            let ball = two.makeCircle(0,0, 4);
            ball.fill = `hsl(${360 * i / n}, 100%, 50%)`;
            ball.stroke = 'none';
            ball.linewidth = 1;
            balls.push(ball);
            mainGroup.add(ball);
        }
        this.alpha = (Math.sqrt(5) - 1) / 2; // golden angle
        this.dtheta = 2 * Math.PI / this.alpha;
        this.speed = 0.0;
        this.updateDots();
        

        let div = this.div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.width = '400px';
        div.style.height = '400px';
        div.style.top = '50px';
        div.style.left = '50px';
        div.style.fontSize = '60px';
        div.style.color = 'white';
        // div.style.backgroundColor = 'rgba(255,255,255,0.5)';
        document.body.appendChild(div);

        
        /*
        let i0 = this.grid.pts.length-1;
        for(let uff=0; uff<200; uff++) {
            let i = this.grid.pts.length-1-uff;
            let p = this.grid.pts[i];
            let z = 3;
            let angle = p.neighbors[z].psi;
            i = p.neighbors[z].j;
            let stroke = [{x: p.x, y: p.y}];
            for(let k=0;k<20;k++) {
                p = this.grid.pts[i];
                stroke.push( {x: p.x, y: p.y} );
                let dist = Math.abs(angle, p.neighbors[0].psi);
                let j = 0;
                for(let jj = 1; jj<p.neighbors.length; jj++) {
                    let d = Math.abs(angle - p.neighbors[jj].psi);
                    if(d < dist) {
                        dist = d;
                        j = jj;
                    }   
                }
                if(dist > 0.1) break;
                angle = p.neighbors[j].psi;
                if(uff==0) console.log("angle=", angle);
                i = p.neighbors[j].j;                
            }
            let vertices = [];
            stroke.forEach( p => {
                vertices.push( new Two.Anchor(p.x, p.y) );
            });
            let path = two.makePath(vertices);
            path.closed = false;
            path.stroke = 'red';
            path.fill = 'none';
            path.linewidth = 2; 

        }
            */

        /*
        
        */
       gsap.ticker.add( (time, deltaTime) => {
            this.alpha += this.speed * deltaTime * 0.001; // = time * 0.01;
            this.dtheta = 2 * Math.PI / this.alpha;
            this.div.innerHTML = ` ${this.alpha.toFixed(5)}`;
            this.updateDots();
        });
    }

    cleanup() {
        this.mainGroup.remove();
        this.div.remove();
    }   

    updateDots() {
        let d = this.dtheta;

        this.balls.forEach( (b,i) => {
            let phi = i * d;
            let r = 10 * Math.sqrt(i); // 8
            b.position.x = r * Math.cos(phi);
            b.position.y = r * Math.sin(phi);
        })
    }

    foo(r, j, err = 0.1) {
        if(this.fooGroup) this.fooGroup.remove();
        let fooGroup = two.makeGroup();
        this.fooGroup = fooGroup;
        let spirals = this.grid.getSpiralsFamily(r, r + 150, j, err);
        if(spirals === null) return;
        let spiralGroups = this.spiralGroups = [];
        let uffa = [];
        spirals.forEach( (spiral,i) => {
            let spiralGroup = two.makeGroup();
            // spiralGroup.opacity = 0;
            fooGroup.add(spiralGroup);
            spiralGroups.push(spiralGroup);
            let vertices = [];
            spiral.points.forEach( p => {
                vertices.push( new Two.Anchor(p.x, p.y) );
            });
            let path = two.makePath(vertices);
            path.closed = false;
            path.stroke = `hsl(${i*360/spirals.length}, 100%, 50%)`;
            path.fill = 'none';
            path.linewidth = 2; 
            spiralGroup.add(path);  
            path.opacity = 0.0;
            uffa.push(path);   
            let j = spiral.points.length - 1;
            let dot = two.makeCircle(
                spiral.points[0].x, spiral.points[0].y, 12);
            dot.fill = "white";
            dot.stroke = 'orange';
            dot.linewidth = 2;
            dot.opacity = 0.0;
            uffa.push(dot);
            spiralGroup.add(dot);
            let label = two.makeText(
                `${i+1}`, 
                spiral.points[0].x, spiral.points[0].y,
            {
                size: 16, family: 'arial',
                alignment: 'center',
                weight: 'bold'
            });
            label.fill = 'black';
            spiralGroup.add(label);
            label.opacity = 0.0;
            uffa.push(label);
        });
        gsap.to(uffa, {
            duration: 1,
            opacity: 1,
            stagger: 0.01,
        }); 
        /*
        let circle = two.makeCircle(center.x, center.y, r);
        circle.fill = 'none';
        circle.stroke = 'black';
        circle.linewidth = 1;
        fooGroup.add(circle);
        */
        /*
        let psi = this.grid.pts[index+1].theta;
        let ii = [index];
        let i = index;
        while(i + 1 < this.grid.pts.length && Math.abs(this.grid.pts[i+1].psi - psi) < err) {
            ii.push(++i);
        }
        i = index;       
        while(i - 1 >=0 && Math.abs(this.grid.pts[i-1].psi - psi) < err) {
            ii.push(--i);
        }
        this.grid.pts.forEach(p=>p.valid = false);
        ii.forEach( i => {
            this.grid.pts[i].valid = true;
            this.grid.pts[i].leader = true;
        });
        ii.forEach( i => {
            let p = this.grid.pts[i];
            p.neighbors.forEach( e => {

                if(!this.grid.pts[e.j].valid) */
    }

    async end() {
    }


    onKeyDown(event) {
        if(event.key === '0') {
            gsap.to(this, {speed:0.0, duration: 0.5});
        } else if(event.key === '1') {
            gsap.to(this, {speed:0.00001, duration: 0.5});
        } else if(event.key === '2') {
            gsap.to(this, {speed:0.0001, duration: 0.5});
        } else if(event.key === '3') {
            gsap.to(this, {speed:0.001, duration: 0.5});
        } else if(event.key === '4') {
            gsap.to(this, {speed:0.01, duration: 0.5});
        }
    }
    nextAct() {
        this.foo(this.index);
        this.index--;
    }
}

let t = new SunFlower();

