/* Run: NT_TEST_URL=http://127.0.0.1:8011 node tests/app-icons-check.cjs */
const {chromium,devices}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.NT_TEST_URL||'http://127.0.0.1:8011';
const out=process.env.NT_TEST_OUTPUT||path.join(require('node:os').tmpdir(),'nt3105-app-icons-qa');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const results=[],errors=[],resources=[];
 async function test(name,fn){try{await fn();results.push({name,pass:true});console.log('PASS',name)}catch(e){results.push({name,pass:false,error:e.stack});console.log('FAIL',name,e.message)}}
 async function page(options={},intro=false){
  const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce',...options});
  p.setDefaultTimeout(9000);
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)resources.push({url:r.url(),status:r.status()})});
  await p.addInitScript(()=>sessionStorage.setItem('nt-motion-choice-v1','off'));
  await p.goto(base+(intro?'/':'/?intro=off'));
  if(intro)await p.locator('#skip-intro').click();
  await p.waitForFunction(()=>window.NTAppIcon&&document.querySelectorAll('[data-app-ready]').length===29);
  return p;
 }
 await test('29 icon placements, all 14 local SVGs load; no old brand glyph slots',async()=>{
  const p=await page();
  assert.equal(await p.locator('.nt-app-icon').count(),29);
  assert.equal(await p.locator('.social-icon,.skill-icon').count(),0);
  const assets=await p.locator('.nt-app-icon img').evaluateAll(es=>es.map(e=>({src:e.getAttribute('src'),loaded:e.complete&&e.naturalWidth>0,alt:e.alt})));
  assert(assets.every(a=>a.loaded&&a.alt===''&&a.src.startsWith('images/app-icons/')));
  assert.equal(new Set(assets.map(a=>a.src)).size,14);
  assert.equal(await p.locator('.skill-card').count(),6);
  assert.equal(await p.locator('.social-card').count(),5);
  assert.equal(await p.locator('[data-app-icon="instagram"],[data-app-icon="linkedin"],[data-app-icon="youtube"]').count(),0);
  await p.close();
 });
 await test('Actual social clicks preserve all four account destinations (external requests stubbed)',async()=>{
  const p=await page();const targets={telegram:'https://t.me/neverdierrr',facebook:'https://www.facebook.com/bolantokk',tiktok:'https://www.tiktok.com/@nt31055',github:'https://github.com/nt3105'};
  await p.context().route('https://**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Navigation test stub</title>'}));
  for(const [brand,url] of Object.entries(targets)){
   const link=p.locator(`.social-card[data-social="${brand}"]`);
   assert.equal(await link.getAttribute('href'),url);
   const next=p.context().waitForEvent('page');await link.click();const popup=await next;
   await popup.waitForURL(url);assert.equal(popup.url(),url);await popup.close();
  }
  assert.equal(await p.locator('.social-card[data-social="email"]').getAttribute('href'),'mailto:kienngantu3105@gmail.com');
  await p.close();
 });
 for(const width of [320,390,430,768,1024,1440])await test(`Responsive ${width}px — both themes, card geometry, touch targets and navigation`,async()=>{
  const p=await page({viewport:{width,height:900},isMobile:width<761,hasTouch:width<761});
  for(const theme of ['dark','light']){
   if(await p.locator('html').getAttribute('data-appearance')!==theme)await p.click('#nt-theme-toggle');
   for(const section of ['#home','#skills','#social','#code-corner','#contact','.footer']){
    await p.locator(section).scrollIntoViewIfNeeded();
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${theme} ${section} overflows`);
   }
   const cards=await p.locator('.nt-app-card').evaluateAll(es=>es.map(e=>{
    const b=e.getBoundingClientRect(),i=e.querySelector('.nt-app-icon').getBoundingClientRect(),t=e.querySelector('.nt-app-info').getBoundingClientRect(),a=e.querySelector('.nt-app-arrow').getBoundingClientRect();
    return {height:b.height,fit:e.scrollWidth<=e.clientWidth+1,inside:i.left>=b.left&&a.right<=b.right,ordered:i.right<=t.left&&t.right<=a.left};
   }));
   assert(cards.every(c=>c.fit&&c.inside&&c.ordered),JSON.stringify(cards));
   assert(Math.max(...cards.map(c=>c.height))-Math.min(...cards.map(c=>c.height))<2,'unequal cards');
   assert(await p.locator('.footer-socials a').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})));
   assert.equal(await p.locator('#nav-links>a:visible').count(),width<761?4:7);
  }
  await p.close();
 });
 await test('Pointer tilt, reflection, press and release use independent icon transforms',async()=>{
  const p=await page({reducedMotion:'no-preference'});
  const card=p.locator('.social-card[data-social="telegram"]');await card.scrollIntoViewIfNeeded();await p.waitForTimeout(1200);
  const r=await card.boundingBox();await p.mouse.move(r.x+r.width*.8,r.y+r.height*.3);await p.waitForTimeout(150);
  const icon=card.locator('.nt-app-icon');assert((await icon.getAttribute('class')).includes('is-app-hover'));
  assert.notEqual(await icon.evaluate(e=>e.style.getPropertyValue('--app-ry')),'0.00deg');
  assert.notEqual(await icon.locator('.nt-app-face').evaluate(e=>getComputedStyle(e).transform),'none');
  // Suppress only this test's activation; pointer feedback must not change link behavior.
  await card.evaluate(e=>e.addEventListener('click',e=>e.preventDefault(),{once:true}));
  await p.mouse.down();assert((await icon.getAttribute('class')).includes('is-app-pressed'));
  await p.mouse.up();assert(!(await icon.getAttribute('class')).includes('is-app-pressed'));
  await p.mouse.move(2,2);await p.waitForTimeout(50);assert(!(await icon.getAttribute('class')).includes('is-app-hover'));
  await p.close();
 });
 await test('Touch press cancels on swipe; native vertical scrolling works',async()=>{
  const p=await page({...devices['iPhone 13'],reducedMotion:'no-preference'});
  await p.locator('.social-card[data-social="telegram"]').scrollIntoViewIfNeeded();await p.waitForTimeout(1000);
  const card=p.locator('.social-card[data-social="telegram"]'),r=await card.boundingBox();const c=await p.context().newCDPSession(p);
  const x=r.x+r.width*.6,y=r.y+r.height*.5,before=await p.evaluate(()=>scrollY);
  await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  assert((await card.locator('.nt-app-icon').getAttribute('class')).includes('is-app-pressed'));
  for(let dy=20;dy<=140;dy+=20)await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-dy}]});
  await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);
  assert.equal(await p.locator('.is-app-pressed').count(),0);assert.equal(await p.locator('.is-app-hover').count(),0);
  assert((await p.evaluate(()=>scrollY))>before+30);await p.close();
 });
 await test('Icons and app/skill cards reveal once, even after scrolling away and back',async()=>{
  const p=await page({reducedMotion:'no-preference'});
  await p.evaluate(()=>{window.iconStarts=0;window.cardStarts=0;document.addEventListener('animationstart',e=>{if(e.animationName==='nt-app-arrive'&&e.target.closest('.social-card'))iconStarts++;if(e.animationName==='nt-app-card-arrive'&&e.target.querySelector('.social-card'))cardStarts++;})});
  await p.locator('#social').scrollIntoViewIfNeeded();await p.waitForTimeout(1800);
  const first=await p.evaluate(()=>({icons:iconStarts,cards:cardStarts}));assert.equal(first.icons,5);assert.equal(first.cards,5);
  await p.locator('#home').scrollIntoViewIfNeeded();await p.waitForTimeout(300);await p.locator('#social').scrollIntoViewIfNeeded();await p.waitForTimeout(1600);
  assert.deepEqual(await p.evaluate(()=>({icons:iconStarts,cards:cardStarts})),first);await p.close();
 });
 await test('Reduced Motion and saved calm preference stop icon movement; content stays visible',async()=>{
  const p=await page();await p.locator('#social').scrollIntoViewIfNeeded();await p.locator('.social-card').first().hover();
  assert(await p.locator('.nt-app-face').evaluateAll(es=>es.every(e=>getComputedStyle(e).transform==='none')));
  await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>document.documentElement.dataset.fx='calm');
  await p.locator('.social-card').first().hover();assert.equal(await p.locator('.is-app-hover').count(),0);
  assert(await p.locator('.nt-app-face').evaluateAll(es=>es.every(e=>getComputedStyle(e).transform==='none'&&getComputedStyle(e).opacity==='1')));
  await p.close();
 });
 await test('Component is reusable and idempotent without duplicate wrappers',async()=>{
  const p=await page();const r=await p.evaluate(()=>{const host=document.createElement('div'),icon=NTAppIcon.create('github','sm');host.append(icon);document.body.append(host);NTAppIcon.refresh(host);NTAppIcon.refresh(host);const result={count:host.querySelectorAll('.nt-app-face').length,brand:icon.dataset.appIcon};host.remove();return result});
  assert.deepEqual(r,{count:1,brand:'github'});await p.close();
 });
 await test('Intro handoff initializes icons, theme, menu and scroll motion',async()=>{
  const p=await page({reducedMotion:'no-preference'},true);
  await p.waitForFunction(()=>document.documentElement.dataset.tsmInitialized==='yes');
  assert.equal(await p.locator('script[src*="app-icons.js"]').count(),1);assert.equal(await p.locator('link[href*="app-icons.css"]').count(),1);
  await p.click('#nt-theme-toggle');assert.equal(await p.locator('html').getAttribute('data-appearance'),'light');
  assert.equal(await p.locator('.nt-memory').count(),4);await p.close();
 });
 await test('Code tabs, contact validation and game controls remain functional',async()=>{
  const p=await page();
  for(const key of ['swift','objc','c']){await p.locator(`[data-code-language="${key}"]`).click();assert.equal(await p.locator(`[data-code-language="${key}"]`).getAttribute('aria-selected'),'true');}
  await p.click('#contact-form button[value="gmail"]');assert.equal(await p.locator('#name').getAttribute('aria-invalid'),'true');
  await p.locator('[data-open-snake]:not([data-show-scores])').first().click();await p.click('#snake-ntjr');assert.equal(await p.locator('#ntjr').isVisible(),true);await p.click('#ntjr-close');await p.click('#snake-close');
  await p.close();
 });
 await test('No-JavaScript keeps SVG logos and original anchor destinations',async()=>{
  const p=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await p.goto(base+'/?intro=off');
  assert.equal(await p.locator('.nt-app-icon').count(),29);assert.equal(await p.locator('.social-card[data-social="telegram"]').getAttribute('href'),'https://t.me/neverdierrr');
  await p.locator('#social').screenshot({path:path.join(out,'no-js-mobile.png')});await p.close();
 });
 await test('No browser JavaScript/console errors or local resource failures',async()=>{assert.deepEqual(errors,[]);assert.deepEqual(resources,[])});
 await browser.close();
 fs.writeFileSync(path.join(out,'app-icons-results.json'),JSON.stringify({results,errors,resources,engine:'Chromium; iPhone/Android-sized emulation, not physical devices'},null,2));
 if(results.some(r=>!r.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
