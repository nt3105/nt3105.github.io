'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
(async()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert(html.includes('reviews-demo.js?v=reviews-static-20261018'),'Reviews JS reference must be cache refreshed');
 assert(html.includes('reviews-demo.css?v=review-eyebrow-20261017'),'Reviews CSS reference must be cache refreshed');
 assert(!html.includes('06 / SAY HELLO'),'Former contact page must be replaced');
 assert(!html.includes('id="contact-form"'),'Old mail form must be absent');
 assert.equal((html.match(/id="contact"/g)||[]).length,1,'One contact anchor');
 assert(html.includes('id="nt3105-reviews-title"'),'Review title must exist in static HTML');
 assert(html.includes('id="nt3105-comment-form"'),'Review form must exist without JS');
 assert(html.includes('id="nt3105-comment-list"'),'Review list must exist without JS');
 assert(!html.includes('<div id="nt3105-cms-comments" class="nt-cms-comments"></div>'),'Review section must never be empty in raw HTML');
 const dom=new JSDOM(html,{url:'https://nt3105.io.vn/#contact',runScripts:'outside-only'});
 const {window}=dom,document=window.document;
 const old={
  nav:document.querySelector('#header')?.outerHTML,
  skills:document.querySelector('#skills .skills-grid')?.outerHTML,
  projects:document.querySelector('#projects .projects-grid')?.outerHTML,
  studio:document.querySelector('#nt-python-studio')?.outerHTML
 };
 const rows=[
  {id:'review-1',author:'Khách demo',body:'Web đẹp <script>alert("XSS")</script>',rating:4,is_pinned:true,admin_reply:'Cảm ơn bạn!',created_at:'2026-10-17T00:00:00Z'},
  {id:'review-2',author:'Một sao',body:'Nên cải thiện trải nghiệm.',rating:1,is_pinned:false,admin_reply:null,created_at:'2026-10-16T00:00:00Z'},
  {id:'review-3',author:'Rất thích',body:'Mình thích website này.',rating:5,is_pinned:false,admin_reply:null,created_at:'2026-10-15T00:00:00Z'}
 ];
 let reads=0,posts=0,payloads=[];
 window.fetch=async(url,opts={})=>{
  assert(String(url).includes('/rest/v1/site_comments'),'Only comments endpoint allowed');
  assert(opts.headers.apikey.startsWith('sb_publishable_'),'Only publishable key allowed');
  if(opts.method==='POST'){
   posts++;const data=JSON.parse(opts.body);payloads.push(data);
   rows.unshift({id:'new-'+posts,author:data.author,body:data.body,rating:data.rating,is_pinned:false,admin_reply:null,created_at:'2026-10-17T12:00:00Z'});
   return {ok:true,status:201};
  }
  reads++;
  assert(String(url).includes('is_hidden=eq.false'),'Never load hidden comments');
  assert(String(url).includes('select=id,'),'Read review IDs for local likes');
  return {ok:true,status:200,json:async()=>rows};
 };
 const code=fs.readFileSync('reviews-demo.js','utf8');
 window.eval(code);
 const settle=()=>new Promise(r=>setTimeout(r,50));
 await settle();
 const root=document.querySelector('#nt3105-cms-comments');
 assert(root.querySelector('#nt3105-reviews-title').textContent.includes('Để lại một chút'));
 assert.equal(root.querySelectorAll('#nt3105-comment-form').length,1,'Exactly one rendered static form');
 assert(!root.querySelector('.ntjr-review-submit').disabled,'Enhancement must enable submit button');
 assert(root&&document.querySelector('#contact').contains(root),'Must render inside existing #contact anchor');
 assert.equal(document.querySelectorAll('#nt3105-cms-comments').length,1);
 assert(root.textContent.includes('Để lại một chút'));
 assert(root.textContent.includes('Khách demo'));
 assert(root.textContent.includes('<script>alert("XSS")</script>'),'Comment must display escaped script as text');
 assert.equal(root.querySelectorAll('script').length,0,'No inserted scripts from untrusted comments');
 assert(root.textContent.includes('Cảm ơn bạn!'),'Admin reply must remain visible');
 assert(root.textContent.includes('Bình luận được ghim'),'Pinned state preserved');
 assert.equal(reads,1);
 const chooser=[...root.querySelectorAll('#ntjr-rating-chooser button')];
 assert.equal(chooser.length,5);
 chooser[0].click();
 assert.equal(root.querySelectorAll('#ntjr-rating-chooser .chosen').length,1,'Only one filled when selecting one');
 assert.equal(root.querySelector('[name="rating"]').value,'1','A one-star choice must not silently become five');
 chooser[3].click();
 assert.equal(root.querySelectorAll('#ntjr-rating-chooser .chosen').length,4,'Four gold, one empty');
 assert.equal(root.querySelector('[name="rating"]').value,'4');
 const oneStar=rows.find(x=>x.rating===1);
 assert(oneStar);
 const fiveStar=rows.find(x=>x.rating===5);
 assert(fiveStar);
 const filter=root.querySelector('#ntjr-review-filter');
 filter.value='low';filter.dispatchEvent(new window.Event('change'));
 assert.equal(root.querySelectorAll('.nt-cms-comment').length,1,'3-star and lower filter');
 filter.value='5';filter.dispatchEvent(new window.Event('change'));
 assert.equal(root.querySelectorAll('.nt-cms-comment').length,1,'Five-star filter');
 filter.value='all';filter.dispatchEvent(new window.Event('change'));
 // Local likes are visibly local, never written to remote Supabase.
 const like=root.querySelector('.ntjr-comment-like');
 like.click();assert.equal(root.querySelectorAll('.ntjr-comment-like.is-liked').length,1);
 assert.equal(posts,0,'Like action must not mutate comments DB');
 const form=root.querySelector('#nt3105-comment-form');
 form.elements.namedItem('author').value='Người thử';
 form.elements.namedItem('body').value='Mình thấy web khá ổn.';
 form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
 await settle();
 assert.equal(posts,1);
 assert.equal(payloads[0].rating,4,'Preserve selected 4-star rating');
 assert.deepEqual(Object.keys(payloads[0]).sort(),['author','body','rating'],'Only public fields in submission');
 assert(root.textContent.includes('Đã gửi đánh giá'));
 assert.equal(reads,2);
 root.querySelector('#ntjr-anonymous-switch').click();
 assert(root.querySelector('#ntjr-author-row').hidden,'Anonymous should hide name input');
 chooser[4].click();
 form.elements.namedItem('body').value='Mình rất thích các hiệu ứng.';
 form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
 await settle();
 assert.equal(posts,2);
 assert.equal(payloads[1].author,'Khách ẩn danh','Never save real name when anonymous');
 assert.equal(payloads[1].rating,5,'Direct five-star review kept unchanged');
 assert.equal(payloads[1].body,'Mình rất thích các hiệu ứng.','Never fabricate a review message');
 assert.equal(document.querySelector('#header')?.outerHTML,old.nav,'Original header must remain untouched by reviews JS');
 assert.equal(document.querySelector('#skills .skills-grid')?.outerHTML,old.skills);
 assert.equal(document.querySelector('#projects .projects-grid')?.outerHTML,old.projects);
 assert.equal(document.querySelector('#nt-python-studio')?.outerHTML,old.studio);
 window.eval(code);
 assert.equal(document.querySelectorAll('#nt3105-cms-comments').length,1,'No duplicate guestbooks');
 const css=fs.readFileSync('reviews-demo.css','utf8');
 assert(!css.includes('.nav-links'),'Review CSS must not override nav');
 assert(!css.includes('.skill-card'),'Review CSS must not override skills');
 assert(!css.includes('.project-card'),'Review CSS must not override projects');
 console.log('PASS real reviews in contact, safe rendering, accurate 1-5 ratings, anonymous, sorting, local likes and form POST');
})().catch(e=>{console.error(e);process.exitCode=1});
