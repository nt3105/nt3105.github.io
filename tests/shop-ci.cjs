'use strict';
// Frontend CI fixture only. Real webhook/ledger tests live in the private backend.
const fs=require('node:fs');const http=require('node:http');const path=require('node:path');const assert=require('node:assert/strict');
const {chromium}=require('playwright');const {default:AxeBuilder}=require('@axe-core/playwright');
const root=process.cwd();const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'};
const products=['PUBG VNG 4.6.0','ZSM v14'].map((name,i)=>({id:i?'zsm':'pubg',name,profile_required:true,plans:[24,168,720].map((hours,j)=>({sku:`item${i}-${j}`,product_id:i?'zsm':'pubg',title:name,hours,price:[10000,30000,100000][j],platform:'ios',max_devices:1,never_expires:false,enabled:true}))}));
const orders=new Map();let lastOrder;
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');const json=(value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
 if(url.pathname==='/api/shop/access/session'&&req.method==='POST'){
  let raw='';for await(const chunk of req)raw+=chunk;const input=JSON.parse(raw);
  return json({access_token:input.token||'1'.repeat(64),remember_days:365,restored_from_cookie:false});
 }
 if(url.pathname==='/api/shop/catalog')return json({products,brand:'NTJR',sales_enabled:true,demo:false,support_url:'https://t.me/neverdierrr',announcement:{enabled:true,title:'Thông báo',message:'',links:[{label:'Telegram NTJR',url:'https://t.me/neverdierrr'}]}});
 if(url.pathname==='/api/shop/orders'&&req.method==='POST'){
  let raw='';for await(const chunk of req)raw+=chunk;const input=JSON.parse(raw);const plan=products.flatMap(p=>p.plans).find(p=>p.sku===input.sku);assert(plan);
  lastOrder={id:'a'.repeat(32),memo:'NTJR'+'A'.repeat(16),amount:plan.price,state:'pending',plan,created_at:Math.floor(Date.now()/1000),pay_by:Math.floor(Date.now()/1000)+1200,bank:{name:'TEST BANK',owner:'TEST ONLY',account:'TEST',code:'TEST'},qr_url:'/shop/assets/demo-qr.svg',demo:false,key:null};
  orders.set(lastOrder.id,lastOrder);return json(lastOrder,201);
 }
 if(url.pathname==='/api/shop/orders')return json({items:[...orders.values()]});
 if(url.pathname.startsWith('/api/shop/orders/'))return json(orders.get(url.pathname.split('/').at(-1))||{},orders.has(url.pathname.split('/').at(-1))?200:404);
 const filename=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(filename,(error,data)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream'});res.end(data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.NTJR_CHROME_PATH?{executablePath:process.env.NTJR_CHROME_PATH}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.locator('.product-card').first().waitFor();assert.equal(await page.locator('.product-card').count(),2);
  await page.locator('#announcement-dialog').waitFor();await page.locator('#announcement-snooze').click();
  for(const width of [360,390,430,768,1024,1440,1920]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${width}`);}
  await page.setViewportSize({width:1440,height:1000});await page.getByRole('searchbox').fill('pubg');assert.equal(await page.locator('.product-card').count(),1);await page.getByRole('searchbox').fill('');
  let scan=await new AxeBuilder({page}).analyze();assert.deepEqual(scan.violations.map(v=>v.id),[]);
  await page.locator('.direct-buy').first().click();await page.locator('#product-detail').waitFor();await page.locator('#product-detail').locator('[data-detail-plan]').filter({hasText:'1 tháng'}).click();assert.equal(await page.locator('#product-detail .price').textContent(),'100.000đ');
  await page.locator('#detail-buy').click();await page.locator('#payment-qr').waitFor();assert.equal(lastOrder.amount,100000);assert.equal(await page.locator('#demo-confirm').count(),0);
  scan=await new AxeBuilder({page}).analyze();assert.deepEqual(scan.violations.map(v=>v.id),[]);
  lastOrder.state='delivered';lastOrder.key='NTJR-CI-TEST-NOT-A-REAL-LICENSE';lastOrder.key_expires=Math.floor(Date.now()/1000)+2592000;lastOrder.license_enabled=true;
  await page.locator('.key-field').waitFor();assert.equal(await page.locator('.key-field code').textContent(),lastOrder.key);
  await page.keyboard.press('Escape');await page.locator('[data-page="orders"]').click();await page.locator('[data-order]').first().waitFor();await page.reload();await page.locator('[data-order]').first().waitFor();
  assert.deepEqual(errors,[]);console.log('Shop frontend CI passed: catalog, 7 widths, accessibility, pricing, QR, server-confirmed key and history.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exit(1)});
