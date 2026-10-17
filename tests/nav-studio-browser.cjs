'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=process.cwd();
const contentTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 let name=pathname==='/'?'/index.html':pathname;
 const file=path.resolve(root,'.'+name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{
  if(err){res.writeHead(404).end();return}
  res.setHeader('Content-Type',contentTypes[path.extname(file)]||'application/octet-stream');
  res.setHeader('Cache-Control','no-store');
  res.writeHead(200);res.end(data);
 });
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 const browser=await chromium.launch({headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 try{
  const desktop=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  await desktop.goto('http://127.0.0.1:'+port+'/?intro=off',{waitUntil:'domcontentloaded'});
  await desktop.locator('#nav-links a[href="#donate"]').waitFor();
  await desktop.locator('#nt-python-studio').waitFor();
  let nav=await desktop.locator('#nav-links > a').evaluateAll(links=>links.map(a=>({text:a.textContent.trim(),box:a.getBoundingClientRect().toJSON(),visible:getComputedStyle(a).display!=='none'})));
  assert.equal(nav.filter(n=>n.visible).length,5,'Desktop must display all five links');
  assert(nav.every(n=>n.visible),'Desktop must not hide links');
  // The five actual pills should occupy a compact central span (rather than 7 empty grid columns).
  const span=(nav.at(-1).box.right-nav[0].box.left);
  assert(span<620,'Desktop nav spread unexpectedly: '+span);
  await desktop.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await desktop.waitForTimeout(16000);
  let scroll=await desktop.evaluate(()=>({y:window.scrollY,code:document.querySelector('#code-corner').getBoundingClientRect().top}));
  assert(scroll.y<140,'Autoplay Python Studio moved the main page while idle: '+JSON.stringify(scroll));
  // Switch browser tabs while code animation is running; it must never hijack the page.
  await desktop.evaluate(()=>document.querySelector('#projects').scrollIntoView({behavior:'instant',block:'start'}));
  await desktop.waitForTimeout(900);
  const before=await desktop.evaluate(()=>window.scrollY);
  const other=await browser.newPage();
  await other.goto('about:blank');await other.bringToFront();
  await sleep(2500);
  await desktop.bringToFront();
  await sleep(7000);
  const after=await desktop.evaluate(()=>window.scrollY);
  assert(Math.abs(after-before)<165,'Revisiting tab jumped unexpectedly to Code Corner: '+before+' => '+after);
  // Check narrow desktop/tablet widths and the actual geometry of each pill.
  for(const width of [761,800,1024,1440]){
    await desktop.setViewportSize({width,height:800});
    const geometry=await desktop.locator('#nav-links > a').evaluateAll(links=>{
      const header=document.querySelector('#header').getBoundingClientRect();
      return {outer:{left:header.left,right:header.right},links:links.map(a=>{
        const r=a.getBoundingClientRect();
        return {left:r.left,right:r.right,visible:getComputedStyle(a).display!=='none'};
      })};
    });
    assert(geometry.links.every(a=>a.visible),'Desktop link hidden at '+width);
    assert(geometry.links.every(a=>a.left>=geometry.outer.left-2&&a.right<=geometry.outer.right+2),'Desktop nav overflow at '+width);
  }
  await desktop.setViewportSize({width:1280,height:800});
  await desktop.screenshot({path:'nav-desktop-ci.png'});
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  await mobile.goto('http://127.0.0.1:'+port+'/?intro=off',{waitUntil:'domcontentloaded'});
  const mobileNav=await mobile.locator('#nav-links > a').evaluateAll(links=>links.filter(a=>getComputedStyle(a).display!=='none').map(a=>({text:a.textContent.trim(),x:a.getBoundingClientRect().left,right:a.getBoundingClientRect().right})));
  assert.deepEqual(mobileNav.map(x=>x.text),['Kỹ năng','Dự án','Ủng hộ','Liên hệ ✳'],'Mobile menu must contain exactly four links including Donate');
  const frame=await mobile.locator('#header').boundingBox();
  assert(frame&&mobileNav.every(x=>x.x>=frame.x-2&&x.right<=frame.x+frame.width+2),'Mobile nav pills overflow header');
  assert(await mobile.locator('#nt-theme-toggle').isVisible(),'Appearance switch must remain visible as fifth control');
  for(const width of [320,360,375,390,430]){
    await mobile.setViewportSize({width,height:844});
    const geometry=await mobile.locator('#nav-links > a').evaluateAll(links=>{
      const rect=document.querySelector('#header').getBoundingClientRect();
      return {outer:{left:rect.left,right:rect.right},links:links.filter(a=>getComputedStyle(a).display!=='none').map(a=>{
       const r=a.getBoundingClientRect();
       return {text:a.textContent.trim(),left:r.left,right:r.right};
      })};
    });
    assert.equal(geometry.links.length,4,'Mobile must show 4 links at '+width);
    assert(geometry.links.some(a=>a.text==='Ủng hộ'),'Donate missing at '+width);
    assert(geometry.links.every(a=>a.left>=geometry.outer.left-2&&a.right<=geometry.outer.right+2),'Mobile nav overflows at '+width);
  }
  await mobile.setViewportSize({width:390,height:844});
  await mobile.locator('#nav-links a[href="#donate"]').click();
  await mobile.waitForTimeout(2100);
  const clicked=await mobile.evaluate(()=>({hash:location.hash,delta:Math.round(document.querySelector('#donate').getBoundingClientRect().top)}));
  assert.equal(clicked.hash,'#donate','Mobile Donate must navigate to real Donation section');
  assert(Math.abs(clicked.delta)<230,'Donate scroll target not reached: '+JSON.stringify(clicked));
  await mobile.screenshot({path:'nav-mobile-ci.png'});
  console.log('PASS desktop compact 5 links; idle 16s no Code Corner jump; tab switch retained position; mobile 4 links + theme at 320–430px; Donate anchor works.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
