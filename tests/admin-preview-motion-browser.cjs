'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname==='/admin-preview-test.html'){
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end('<!doctype html><title>Admin iframe reproduction</title><iframe id="preview" sandbox="allow-scripts allow-same-origin" width="980" height="850" src="/?intro=off&nt3105_preview=1"></iframe>');
  return;
 }
 const f=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(f,(e,data)=>{if(e){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const base='http://127.0.0.1:'+server.address().port;
  for(const action of [{button:'.nt-motion-enable',choice:'pointer'},{button:'.nt-motion-later',choice:'later'}]){
   const context=await browser.newContext({viewport:{width:1150,height:900},reducedMotion:'no-preference'});
   try{
    const page=await context.newPage();
    await page.goto(base+'/admin-preview-test.html',{waitUntil:'domcontentloaded'});
    const frame=page.frameLocator('#preview');
    await frame.locator('html.nt-cms-in-studio').waitFor({timeout:30000});
    await frame.locator('#nt-motion-notice.is-in').waitFor({timeout:30000});
    await frame.locator(action.button).click();
    await frame.locator('#nt-motion-notice').waitFor({state:'detached',timeout:8000});
    const saved=await frame.locator('body').evaluate(()=>sessionStorage.getItem('nt-motion-choice-v1'));
    assert.equal(saved,action.choice,'Admin iframe choice '+action.button+' should persist and dismiss');
   }finally{await context.close()}
  }
  const context=await browser.newContext({viewport:{width:1100,height:900},reducedMotion:'no-preference'});
  try{
   const page=await context.newPage();
   await page.goto(base+'/?intro=off',{waitUntil:'domcontentloaded'});
   await page.locator('#nt-motion-notice.is-in').waitFor({timeout:30000});
   assert.equal(await page.locator('html.nt-cms-in-studio').count(),0,'Public site must not activate CMS preview mode');
   await page.locator('.nt-motion-later').click();
   await page.locator('#nt-motion-notice').waitFor({state:'detached',timeout:8000});
   console.log('PASS: both motion choice buttons work inside Admin iframe while normal site stays unmodified');
  }finally{await context.close()}
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
