'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
let src=fs.readFileSync('cms-public-v3.js','utf8');
assert(src.trimEnd().endsWith('})();'));
src=src.replace(/\}\)\(\);\s*$/, 'window.__ntCmsTest={isURL,safeUrl};\n})();');
const sandbox={
 window:{},
 document:{readyState:'loading',addEventListener(){},querySelector(){return null}},
 URL, URLSearchParams, location:{search:""}, console, CustomEvent:class CustomEvent{},
};
vm.runInNewContext(src,sandbox,{filename:'cms-public-v3.js'});
const {isURL,safeUrl}=sandbox.window.__ntCmsTest;
assert.equal(isURL('https://nt3105.io.vn/images/moment-1.png'),true,'Public image URL must pass validation');
assert.equal(isURL('https://nt3105.io.vn/audio/preah-thorng.mp3'),true,'Public music URL must pass validation');
assert.equal(isURL('javascript:alert(1)'),false,'Dangerous URL must not pass validation');
assert.equal(safeUrl('javascript:alert(1)'),null,'Unsafe URL should be rejected');
assert(src.includes('__cmsReady!==true'),'Unpublished CMS data must not override live site');
assert(src.includes('nt3105:cms-music'),'Published playlist must connect to original music player');
assert(src.includes('ADMIN_ORIGIN="https://admin.nt3105.io.vn"'),'Preview bridge must target explicit Admin origin');
assert(src.includes('event.origin!==ADMIN_ORIGIN'),'Preview must reject untrusted parent origins');
assert(src.includes('event.source!==window.parent'),'Preview must reject non-parent sources');
assert(src.includes('STUDIO_PREVIEW'),'Draft preview must be isolated from normal visitors');
assert(src.includes('nt3105:cms-preview-update'),'Iframe must apply draft updates');
assert(src.includes('nt3105:cms-preview-navigate'),'Iframe must support section navigation');

const messages=[];
const listeners={};
const parent={postMessage(msg,origin){messages.push({msg,origin})}};
const studioWin={
  parent, addEventListener(name,handler){listeners[name]=handler},
  matchMedia(){return {matches:false}}
};
const previewDoc={
  readyState:'complete',
  documentElement:{classList:{add(){}}},
  addEventListener(){},
  querySelector(){return null},
  getElementById(){return null}
};
vm.runInNewContext(fs.readFileSync('cms-public-v3.js','utf8'),{
  window:studioWin,document:previewDoc,location:{search:'?nt3105_preview=1'},
  URL,URLSearchParams,console,
  CustomEvent:class CustomEvent{},
  Element:class Element{},
  clearTimeout, setTimeout
},{filename:'cms-public-v3.js'});
assert(messages.some(({msg,origin})=>msg.type==='nt3105:cms-preview-ready'&&origin==='https://admin.nt3105.io.vn'),'Preview should signal ready only to Admin origin');
assert(typeof listeners.message==='function','Preview message listener must be registered');
const updates=()=>messages.filter(({msg})=>msg.type==='nt3105:cms-preview-applied').length;
listeners.message({origin:'https://evil.invalid',source:parent,data:{type:'nt3105:cms-preview-update',content:{comments:{enabled:false}}}});
assert.equal(updates(),0,'Untrusted origin must not update preview');
listeners.message({origin:'https://admin.nt3105.io.vn',source:{},data:{type:'nt3105:cms-preview-update',content:{comments:{enabled:false}}}});
assert.equal(updates(),0,'Message from unrelated window must be rejected');
listeners.message({origin:'https://admin.nt3105.io.vn',source:parent,data:{type:'nt3105:cms-preview-update',content:{comments:{enabled:false}}}});
assert.equal(updates(),1,'Valid Admin message should update the real preview');
assert.equal(messages.at(-1).origin,'https://admin.nt3105.io.vn','Ack must use strict target origin');
console.log('NT3105 cross-origin live preview bridge checks passed.');

console.log('NT3105 CMS public smoke checks passed.');
