
"use strict";

import { requireAuth } from './auth-token.js';

let slides = [];
let slideIndex = -1;
let slide; 
let container;
let two;
let center; 

const BASE_WIDTH  = 1920;
const BASE_HEIGHT = 1080;

class Slide {
    constructor(name) {
        this.name = name;
        slides.push(this);
    }

    initialize() {
        console.log(`Initialize ${this.name}`);
    }

    start() {
        console.log(`Start ${this.name}`);
    }
    cleanup() {
        console.log(`Cleanup:  ${this.name}`);

    }
    async end() {
        console.log(`End:  ${this.name}`);

    }

    nextAct() {}
    prevAct() {}
    onKeyDown(event) {}
    onPointerDown(x,y,event) {}
    onPointerUp(event) {}
    onPointerDrag(x,y,dx,dy,event) {}
}

function resizeContainer() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = Math.min(w / BASE_WIDTH, h / BASE_HEIGHT);
    container.style.transform =
      `translate(-50%, -50%) scale(${scale})`;
}

document.addEventListener("DOMContentLoaded", async function() {
    
    // Check authentication before initializing presentation
    requireAuth();
    
    let firstSlideIndex = 0;
    let hpage = window.location.hash.slice(1);
    if(hpage != '') {
        let j = hpage|0;
        if(0<=j && j<slides.length) {
            firstSlideIndex = j;
        }
    }

    gsap.registerPlugin(TextPlugin) 
    gsap.registerPlugin(SplitText) 

    container = document.getElementById('container');
    const containerRect = container.getBoundingClientRect();

    resizeContainer(); 
    
    two = window.two = new Two({
        width: BASE_WIDTH, // containerRect.width,
        height: BASE_HEIGHT, // containerRect.height
    }).appendTo(container);


    center = window.center = { x: BASE_WIDTH / 2,  y: BASE_HEIGHT / 2};
    
    gsap.ticker.add(two.update.bind(two))

    slides.forEach(slide => slide.initialize());
    await setSlide(firstSlideIndex);
});


window.addEventListener('resize', resizeContainer);


async function setSlide(index) {
    if(0 <= slideIndex && slideIndex < slides.length) {
        slide = slides[slideIndex];
        console.log("Ending slide ", slideIndex, slide.name);
        await slide.end();
        if(slide.ticker) gsap.ticker.remove(slide.ticker); 
        slide.ticker = null;
        slide.cleanup();
        if(slide.mainGroup) {
            slide.mainGroup.remove();
            slide.mainGroup = null;
        }
    }
    slideIndex = index;
    if(0 <= slideIndex && slideIndex < slides.length) {
        slide = slides[slideIndex];
        console.log("Starting slide ", slideIndex, slide.name);

        slide.mainGroup = two.makeGroup();
        slide.mainGroup.position.set(center.x, center.y);
        
        slide.start();

        if(slide.update) {
            const thisSlide = slide;
            function ticker(time, deltaTime) {
                // console.log("ticker:", thisSlide.name, time);
                if(thisSlide.ticker) thisSlide.update(time, deltaTime); 
            }
            slide.ticker = ticker;
            gsap.ticker.add(slide.ticker);
        }
    } else {
        slide = null;
    }   
    window.location.hash = `#${slideIndex}`;
    window.slide = slide;
}

function nextSlide() {
    if(0 <= slideIndex && slideIndex < slides.length - 1) {
        setSlide(slideIndex + 1);
    }
}

document.addEventListener("keydown", async function(event) {
    if(event.key === "ArrowDown") {
        console.log("Next slide");  
        if(slideIndex+1<slides.length) setSlide(slideIndex+1);
        event.preventDefault();
    } else if(event.key === "ArrowUp") {
        console.log("Prev slide");  
        if(slideIndex>0)setSlide(slideIndex-1);
        event.preventDefault();
    } else if(event.key === "ArrowRight") {
        if(slide) slide.nextAct();
        event.preventDefault();
    } else if(event.key === "ArrowLeft") {
        if(slide) slide.prevAct();
        event.preventDefault();
    } else {
        if(slide) slide.onKeyDown(event);   
        
    }
});


document.addEventListener('pointerdown', (e)=>{
    let x = e.clientX;
    let y = e.clientY;
    e.preventDefault();

    if(slide) slide.onPointerDown(x,y,e);
    function onPointerMove(e) {
        e.preventDefault();
        let dx = e.clientX - x;
        let dy = e.clientY - y;
        x = e.clientX;
        y = e.clientY;
        if(slide) slide.onPointerDrag(x,y,dx,dy,e);
    }
    function onPointerUp(e) {
        e.preventDefault();
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp); 
        if(slide) slide.onPointerUp(e);
    }
    
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
});




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


export {Slide, two, center, nextSlide, TextLine};