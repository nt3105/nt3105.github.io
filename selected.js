/* Components selected from the Liquid Glass demo, integrated with the original site. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const behavior=()=>reduce.matches?'instant':'smooth';
  const themeButton=$('#nt-theme-toggle');
  function setAppearance(value, persist=false){
    const light=value==='light';
    document.documentElement.dataset.appearance=light?'light':'dark';
    themeButton.setAttribute('aria-pressed',String(light));
    themeButton.setAttribute('aria-label',light?'Chuyển sang nền tối':'Chuyển sang nền sáng');
    themeButton.title=themeButton.getAttribute('aria-label');
    themeButton.querySelector('span').textContent=light?'Nền tối':'Nền sáng';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',light?'#f5f6f3':'#101321');
    if(persist)try{localStorage.setItem('nt-appearance',light?'light':'dark');}catch{}
  }
  let savedAppearance=document.documentElement.dataset.appearance;
  try{savedAppearance=localStorage.getItem('nt-appearance');}catch{}
  setAppearance(savedAppearance);
  themeButton.addEventListener('click',()=>{
    const next=document.documentElement.dataset.appearance==='light'?'dark':'light';
    if(document.startViewTransition&&!reduce.matches&&document.documentElement.dataset.fx!=='calm'){
      document.startViewTransition(()=>setAppearance(next,true));
    }else setAppearance(next,true);
  });
  addEventListener('storage',event=>{if(event.key==='nt-appearance')setAppearance(event.newValue);});
  const depthRetry=document.createElement('button');depthRetry.id='nt-depth-retry';depthRetry.type='button';depthRetry.textContent='Bật lại hiệu ứng chuột / nghiêng máy';
  $('#style-panel').append(depthRetry);
  depthRetry.addEventListener('click',()=>{document.querySelector('.style-close').click();window.ntRequestDepth?.();});
  const player=window.ntSelectedMusic;
  const play=$('#nt-hero-play');
  const icon=paused=>`<svg class="nt-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${paused?'<path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86Z"/>':'<path d="M6 5a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 10 5v14a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 6 19V5zm8 0a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 18 5v14a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 14 19V5z"/>'}</svg>`;
  function syncMusic(){
    const track=player.current();
    $('#nt-hero-track').textContent=track.title;
    $('#nt-hero-cover').src=track.cover;
    $('#nt-hero-music-state').textContent=track.playing?'Đang phát · Mở danh sách':'Mở danh sách phát';
    $('#nt-hero-music-open').setAttribute('aria-label',`Mở trình phát: ${track.title}`);
    $('.nt-music-float').classList.toggle('is-playing',track.playing);
    play.setAttribute('aria-pressed',String(track.playing));
    play.setAttribute('aria-label',track.playing?'Tạm dừng nhạc':'Phát nhạc');
    play.innerHTML=icon(!track.playing);
  }
  if(player){
    $('#nt-hero-music-open').addEventListener('click',()=>player.open());
    play.addEventListener('click',()=>player.toggle());
    ['playing','pause','ended','loadstart','loadedmetadata','error'].forEach(event=>player.audio.addEventListener(event,syncMusic));
    syncMusic();
  }

  // Native touch scrolling; pointer capture starts only after a deliberate mouse drag.
  const gallery=$('.nt-gallery');let drag=null,suppress=false,frame=0;
  gallery.addEventListener('pointerdown',e=>{
    suppress=false;if(e.pointerType!=='mouse'||e.button!==0)return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:gallery.scrollLeft,moved:false};
  });
  gallery.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const dx=e.clientX-drag.x;
    if(!drag.moved&&Math.abs(dx)>6&&Math.abs(dx)>Math.abs(e.clientY-drag.y)){drag.moved=true;gallery.setPointerCapture(e.pointerId);gallery.classList.add('is-dragging');}
    if(drag.moved){e.preventDefault();gallery.scrollLeft=drag.start-dx;}
  });
  function finish(){if(!drag)return;const id=drag.id;suppress=drag.moved;drag=null;if(gallery.hasPointerCapture(id))gallery.releasePointerCapture(id);gallery.classList.remove('is-dragging');}
  ['pointerup','pointercancel','lostpointercapture'].forEach(event=>gallery.addEventListener(event,finish));
  gallery.addEventListener('dragstart',e=>e.preventDefault());
  gallery.addEventListener('click',e=>{if(suppress&&e.detail!==0){e.preventDefault();e.stopImmediatePropagation();suppress=false;}},true);
  function move(direction){const item=gallery.querySelector('.nt-memory'),gap=parseFloat(getComputedStyle(gallery).columnGap)||0;gallery.scrollBy({left:direction*(item.offsetWidth+gap),behavior:behavior()});}
  $('#nt-gallery-prev').addEventListener('click',()=>move(-1));$('#nt-gallery-next').addEventListener('click',()=>move(1));
  gallery.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
  function update(){frame=0;const max=gallery.scrollWidth-gallery.clientWidth;$('#nt-gallery-prev').disabled=gallery.scrollLeft<2;$('#nt-gallery-next').disabled=max<=2||gallery.scrollLeft>=max-2;$('.nt-gallery-progress i').style.setProperty('--nt-progress',`${max>0?Math.max(0,Math.min(1,gallery.scrollLeft/max))*300:0}%`);}
  function queue(){if(!frame)frame=requestAnimationFrame(update);}
  gallery.addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);update();

  // The original tilt and scroll-reveal engine owns the hero and photo cards.
  const scene=$('.nt-hero-scene');
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>scene.classList.toggle('nt-inview',entry.isIntersecting)),{threshold:.1});
    observer.observe(scene);
  }else scene.classList.add('nt-inview');

  const scores=$('#nt-scores-dialog');
  const scoreButton=$('#nt-game-scores');
  scoreButton.addEventListener('click',()=>{
    if(scores.open)return;
    document.dispatchEvent(new Event('nt:pause-snake'));
    scores.showModal();document.body.classList.add('nt-score-open');$('#nt-scores-close').focus();
  });
  document.querySelectorAll('[data-show-scores]').forEach(button=>button.addEventListener('click',()=>scoreButton.click()));
  $('#nt-scores-close').addEventListener('click',()=>scores.close());
  scores.addEventListener('close',()=>{document.body.classList.remove('nt-score-open');scoreButton.focus({preventScroll:true});});
  scores.addEventListener('click',e=>{const r=scores.getBoundingClientRect();if(e.target===scores&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))scores.close();});
  scores.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const controls=[...scores.querySelectorAll('button,input,select,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);
    if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls.at(-1).focus();}
    else if(!e.shiftKey&&document.activeElement===controls.at(-1)){e.preventDefault();controls[0].focus();}
  });
})();
