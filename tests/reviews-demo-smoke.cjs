'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
(async()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert(html.includes('reviews-demo.js?v=comments-restore-1'),'Standalone guestbook must be loaded');
 assert(html.includes('reviews-demo.css?v=comments-restore-1'),'Stylesheet must be loaded');
 const dom=new JSDOM(html,{url:'https://nt3105.io.vn/',runScripts:'outside-only'});
 const {window}=dom,doc=window.document;
 const before={
  nav:doc.querySelector('#header')?.outerHTML,
  skills:doc.querySelector('#skills .skills-grid')?.outerHTML,
  projects:doc.querySelector('#projects .projects-grid')?.outerHTML,
  studio:doc.querySelector('#nt-python-studio')?.outerHTML,
 };
 let posts=0,reads=0,payload=null;
 const comments=[{
   author:'Khách demo',body:'Web đẹp <script>alert("XSS")</script>',
   rating:5,is_pinned:true,admin_reply:'Cảm ơn bạn!',created_at:'2026-10-17T00:00:00Z'
 }];
 window.fetch=async (url,options={})=>{
   assert(String(url).includes('/rest/v1/site_comments'),'Only comment endpoint may be called');
   assert(options.headers.apikey.startsWith('sb_publishable_'),'Must use publishable key');
   if(options.method==='POST'){
     posts++;payload=JSON.parse(options.body);
     comments.unshift({author:payload.author,body:payload.body,rating:payload.rating,is_pinned:false,admin_reply:null,created_at:new Date().toISOString()});
     return {ok:true,status:201};
   }
   reads++;
   assert(String(url).includes('is_hidden=eq.false'),'Hidden comments must not be loaded');
   return {ok:true,status:200,json:async()=>comments};
 };
 window.eval(fs.readFileSync('reviews-demo.js','utf8'));
 const settle=async()=>new Promise(resolve=>setTimeout(resolve,30));
 await settle();
 const root=doc.querySelector('#nt3105-cms-comments');
 assert(root,'Guestbook section missing');
 assert(root.querySelector('h2').textContent.includes('Nhận xét của khách'));
 assert.equal(reads,1);
 assert(root.textContent.includes('Khách demo'));
 assert(root.textContent.includes('Đã ghim'));
 assert(root.textContent.includes('Cảm ơn bạn!'));
 assert.equal(root.querySelectorAll('script').length,0,'Comment body must never inject scripts');
 assert(root.textContent.includes('<script>alert("XSS")</script>'),'Comments should render as safe text');
 const form=root.querySelector('#nt3105-comment-form');
 form.elements.namedItem('author').value='Người thử';
 form.elements.namedItem('body').value='Mình thấy trang này đẹp.';
 form.elements.namedItem('rating').value='4';
 form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
 await settle();
 assert.equal(posts,1,'Submit should reach Supabase once');
 assert.deepEqual(Object.keys(payload).sort(),['author','body','rating'],'Only plain public fields may be sent');
 assert.equal(payload.rating,4);
 assert.equal(reads,2,'Reload comments after submitting');
 assert(root.textContent.includes('Đã gửi nhận xét'));
 assert(root.textContent.includes('Người thử'));
 assert.equal(doc.querySelector('#header')?.outerHTML,before.nav,'Navigation must not change');
 assert.equal(doc.querySelector('#skills .skills-grid')?.outerHTML,before.skills,'Skill icons/effects must not change');
 assert.equal(doc.querySelector('#projects .projects-grid')?.outerHTML,before.projects,'Project illustrations must not change');
 assert.equal(doc.querySelector('#nt-python-studio')?.outerHTML,before.studio,'Python Studio must not change');
 window.eval(fs.readFileSync('reviews-demo.js','utf8'));
 assert.equal(doc.querySelectorAll('#nt3105-cms-comments').length,1,'Guestbook must not duplicate');
 const stylesheet=fs.readFileSync('reviews-demo.css','utf8');
 assert(!stylesheet.includes('.nav-links'),'Comments CSS must not override navigation');
 assert(!stylesheet.includes('.skill-card'),'Comments CSS must not override skill cards');
 assert(!stylesheet.includes('.project-card'),'Comments CSS must not override project cards');
 console.log('PASS: standalone comments load, send, XSS-safe, keep menu, icons, effects and Studio intact');
})().catch(error=>{console.error(error);process.exitCode=1});
