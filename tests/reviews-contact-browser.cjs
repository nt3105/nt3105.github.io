'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const filename=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(filename,(err,bytes)=>{
  if(err){res.writeHead(404).end();return}
  res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 });
});
const source=[
 {id:'one',author:'An',body:'Mình muốn web rõ ràng hơn.',rating:1,created_at:'2026-10-15T00:00:00Z',is_pinned:false,admin_reply:null},
 {id:'four',author:'Bình',body:'Giao diện ổn, mình thích phần ảnh.',rating:4,created_at:'2026-10-16T00:00:00Z',is_pinned:true,admin_reply:'Cảm ơn bạn!'},
 {id:'five',author:'Chi',body:'Rất thích các hiệu ứng.',rating:5,created_at:'2026-10-17T00:00:00Z',is_pinned:false,admin_reply:null}
];
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--disable-background-timer-throttling']});
 try{
  const base='http://127.0.0.1:'+server.address().port+'/?intro=off';
  const desktop=await browser.newPage({viewport:{width:1280,height:820},reducedMotion:'reduce'});
  let posted=[];
  await desktop.route('**/rest/v1/site_comments*',async route=>{
   const request=route.request();
   if(request.method()==='POST'){
    const data=request.postDataJSON();posted.push(data);
    source.unshift({id:'posted-'+posted.length,author:data.author,body:data.body,rating:data.rating,created_at:'2026-10-17T12:00:00Z',is_pinned:false,admin_reply:null});
    return route.fulfill({status:201,contentType:'application/json',body:'{}'});
   }
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(source)});
  });
  await desktop.goto(base,{waitUntil:'domcontentloaded'});
  await desktop.locator('#nt3105-cms-comments .nt-cms-comment').first().waitFor();
  assert.equal(await desktop.locator('#nt3105-cms-comments').count(),1,'Only one review section');
  assert.equal(await desktop.locator('#contact-form').count(),0,'Old email form should be gone');
  assert(await desktop.locator('#ntjr-review-count').innerText().then(s=>s.includes('3 bình luận')));
  const nav=await desktop.evaluate(()=>{
   const h=document.querySelector('#header').getBoundingClientRect();
   const n=document.querySelector('#nav-links').getBoundingClientRect();
   const t=document.querySelector('#nt-theme-toggle').getBoundingClientRect();
   const eyebrow=document.querySelector('#nt3105-cms-comments .ntjr-reviews-heading .eyebrow');
   return {
    headerWidth:h.width,centerOffset:Math.abs((h.left+h.right)/2-innerWidth/2),
    gap:t.left-n.right,leading:n.left-h.left,trailing:h.right-t.right,
    fontSize:parseFloat(getComputedStyle(eyebrow).fontSize),
    hasNavLinks:[...document.querySelectorAll('#nav-links > a')].every(a=>a.getBoundingClientRect().width>30)
   };
  });
  assert(nav.centerOffset<7,'Capsule not centered in viewport: '+JSON.stringify(nav));
  assert(nav.headerWidth<670,'Capsule still contains excessive blank width: '+JSON.stringify(nav));
  assert(nav.gap>=4,'Navigation overlaps theme button: '+JSON.stringify(nav));
  assert(nav.leading>=4&&nav.trailing>=4,'Capsule content does not fit: '+JSON.stringify(nav));
  assert(nav.hasNavLinks,'Some nav links collapsed or disappeared');
  assert(nav.fontSize>=16,'06 / ĐÁNH GIÁ WEBSITE eyebrow still too small: '+nav.fontSize);
  await desktop.locator('#nav-links a[href="#contact"]').click();
  await desktop.waitForTimeout(2000);
  assert((await desktop.locator('#contact').boundingBox()).y<270,'Review section not reached from header menu');
  await desktop.locator('[data-rating="1"]').click();
  assert.equal(await desktop.locator('[name="rating"]').inputValue(),'1','One-star review modified');
  assert.equal(await desktop.locator('#ntjr-rating-chooser .chosen').count(),1);
  await desktop.locator('[data-rating="4"]').click();
  assert.equal(await desktop.locator('[name="rating"]').inputValue(),'4','Four-star review modified');
  assert.equal(await desktop.locator('#ntjr-rating-chooser .chosen').count(),4);
  const starColors=await desktop.locator('#ntjr-rating-chooser [data-rating]').evaluateAll(elements=>elements.map(el=>getComputedStyle(el).color));
  assert.notEqual(starColors[3],starColors[4],'Gold selected stars must differ from white unselected star');
  await desktop.locator('[name="author"]').fill('Người thử');
  await desktop.locator('[name="body"]').fill('Mình thích thiết kế của web.');
  await desktop.locator('.ntjr-review-submit').click();
  await desktop.waitForTimeout(220);
  assert.equal(posted.length,1,'Review did not submit once');
  assert.equal(posted[0].rating,4);
  assert.equal(posted[0].body,'Mình thích thiết kế của web.');
  await desktop.locator('#ntjr-anonymous-switch').click();
  assert(await desktop.locator('#ntjr-author-row').isHidden(),'Anonymous author field stays visible');
  await desktop.locator('[data-rating="5"]').click();
  await desktop.locator('[name="body"]').fill('Đánh giá 5 sao thật.');
  await desktop.locator('.ntjr-review-submit').click();
  await desktop.waitForTimeout(220);
  assert.equal(posted.length,2);
  assert.deepEqual(posted[1],{author:'Khách ẩn danh',body:'Đánh giá 5 sao thật.',rating:5});
  await desktop.locator('#ntjr-review-filter').selectOption('low');
  assert.equal(await desktop.locator('.nt-cms-comment').count(),1);
  await desktop.locator('#ntjr-review-filter').selectOption('5');
  assert.equal(await desktop.locator('.nt-cms-comment').count(),2);
  await desktop.locator('#ntjr-review-filter').selectOption('all');
  await desktop.locator('.ntjr-comment-like').first().click();
  assert.equal(await desktop.locator('.ntjr-comment-like.is-liked').count(),1,'Local heart was not rendered');
  await desktop.screenshot({path:'reviews-desktop-ci.png'});
  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await mobile.route('**/rest/v1/site_comments*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(source)}));
  await mobile.goto(base,{waitUntil:'domcontentloaded'});
  await mobile.locator('#nt3105-cms-comments .nt-cms-comment').first().waitFor();
  for(const width of [320,360,375,390,430,768]){
   await mobile.setViewportSize({width,height:844});
   const geom=await mobile.locator('#nt3105-cms-comments').evaluate(node=>{
    const panel=node.querySelector('.ntjr-reviews-layout');
    const section=node.getBoundingClientRect(),boxes=[...panel.children].map(el=>el.getBoundingClientRect());
    return {left:section.left,right:section.right,boxes:boxes.map(b=>({left:b.left,right:b.right,width:b.width})),cols:getComputedStyle(panel).gridTemplateColumns};
   });
   assert(geom.boxes.every(b=>b.left>=geom.left-3&&b.right<=geom.right+3),'Reviews overflow horizontally at '+width+': '+JSON.stringify(geom));
  }
  await mobile.setViewportSize({width:390,height:844});
  await mobile.locator('#nav-links a[href="#contact"]').click();
  await mobile.waitForTimeout(1950);
  assert((await mobile.locator('#contact').boundingBox()).y<245,'Mobile menu review navigation failed');
  await mobile.locator('#ntjr-review-filter').selectOption('4');
  assert(await mobile.locator('.nt-cms-comment').count()>=1);
  await mobile.screenshot({path:'reviews-mobile-ci.png'});
  console.log('PASS PC centered nav, live review UI, actual 1/4/5 star colors, 2 submits, anonymous, filters, likes, mobile 320–768px');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
