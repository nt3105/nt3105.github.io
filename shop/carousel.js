import { $ } from './ui.js?v=detail-clean-v1';

export function initCarousel(){
  const root=$('#home-carousel');
  const slides=[...root.querySelectorAll('.banner-slide')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let index=0,hovered=false,focused=false,start=null,timer;
  function show(next){
    index=(next+slides.length)%slides.length;
    root.dataset.index=String(index);
    slides.forEach((slide,i)=>{slide.inert=i!==index;slide.setAttribute('aria-hidden',String(i!==index));});
  }
  function arm(){
    clearInterval(timer);
    if(reduced.matches)return;
    timer=setInterval(()=>{if(!hovered&&!focused&&!document.hidden&&!root.closest('[hidden]')&&!document.querySelector('dialog[open]'))show(index+1);},2500);
  }
  root.addEventListener('mouseenter',()=>{hovered=true;});root.addEventListener('mouseleave',()=>{hovered=false;});
  root.addEventListener('focusin',()=>{focused=true;});root.addEventListener('focusout',event=>{focused=root.contains(event.relatedTarget);});
  root.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1));arm();}});
  root.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')start={x:event.clientX,y:event.clientY};});
  root.addEventListener('pointerup',event=>{
    if(!start)return;const x=event.clientX-start.x,y=event.clientY-start.y;start=null;
    if(Math.abs(x)>45&&Math.abs(x)>Math.abs(y)*1.4){show(index+(x<0?1:-1));arm();}
  });
  root.addEventListener('pointercancel',()=>{start=null;});reduced.addEventListener('change',arm);
  show(0);arm();
}
