'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
let src=fs.readFileSync('cms-public-v3.js','utf8');
assert(src.trimEnd().endsWith('})();'));
src=src.replace(/\}\)\(\);\s*$/, 'window.__ntCmsTest={isURL,safeUrl};\n})();');
const sandbox={
 window:{},
 document:{readyState:'loading',addEventListener(){}},
 URL, console, CustomEvent:class CustomEvent{},
};
vm.runInNewContext(src,sandbox,{filename:'cms-public-v3.js'});
const {isURL,safeUrl}=sandbox.window.__ntCmsTest;
assert.equal(isURL('https://nt3105.io.vn/images/moment-1.png'),true,'Public image URL must pass validation');
assert.equal(isURL('https://nt3105.io.vn/audio/preah-thorng.mp3'),true,'Public music URL must pass validation');
assert.equal(isURL('javascript:alert(1)'),false,'Dangerous URL must not pass validation');
assert.equal(safeUrl('javascript:alert(1)'),null,'Unsafe URL should be rejected');
assert(src.includes('__cmsReady!==true'),'Unpublished CMS data must not override live site');
assert(src.includes('nt3105:cms-music'),'Published playlist must connect to original music player');
console.log('NT3105 CMS public smoke checks passed.');
