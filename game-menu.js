/* Local game appearance and one explicitly saved player configuration. */
(()=>{
 'use strict';
 const $=s=>document.querySelector(s),dock=$('#snake-dock'),menu=$('#ntjr');
 const fields=['auto','locator','path','wall','body','magnet','slow','hit','god','chaos'];
 const colors=['mint','violet','amber'];
 const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
 const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
 const status=text=>$('#nt-profile-status').textContent=text;
 function style(theme,grid,persist=true){
  dock.dataset.boardTheme=colors.includes(theme)?theme:'mint';dock.dataset.grid=grid?'on':'off';
  $('#nt-board-grid').checked=!!grid;
  menu.querySelectorAll('[data-board-theme]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.boardTheme===dock.dataset.boardTheme)));
  document.dispatchEvent(new Event('nt:snake-redraw'));
  if(persist)save('nt-snake-appearance-v1',{theme:dock.dataset.boardTheme,grid:!!grid});
 }
 const stored=read('nt-snake-appearance-v1');style(stored?.theme,stored?.grid!==false,false);
 menu.querySelectorAll('[data-board-theme]').forEach(button=>button.addEventListener('click',()=>style(button.dataset.boardTheme,$('#nt-board-grid').checked)));
 $('#nt-board-grid').addEventListener('change',event=>style(dock.dataset.boardTheme,event.target.checked));
 const valid=value=>value&&value.version===1&&fields.every(key=>typeof value[key]==='boolean')&&Number.isInteger(value.speed)&&value.speed>=0&&value.speed<=4&&['1','2','5'].includes(value.mult)&&colors.includes(value.theme)&&typeof value.grid==='boolean';
 let profile=read('nt-snake-profile-v1');if(!valid(profile))profile=null;
 $('#nt-profile-load').disabled=!profile;
 $('#nt-profile-save').addEventListener('click',()=>{
  profile={version:1,...Object.fromEntries(fields.map(key=>[key,$('#mod-'+key).checked])),speed:Number($('#mod-speed').value),mult:$('#mod-mult').value,theme:dock.dataset.boardTheme,grid:$('#nt-board-grid').checked};
  const ok=save('nt-snake-profile-v1',profile);$('#nt-profile-load').disabled=false;status(ok?'Đã lưu cấu hình. Lần mở sau vẫn dùng lại được.':'Không lưu được trên trình duyệt. Cấu hình chỉ giữ trong lần mở này.');
 });
 $('#nt-profile-load').addEventListener('click',()=>{
  if(!valid(profile))return;
  fields.forEach(key=>{$('#mod-'+key).checked=profile[key]});$('#mod-speed').value=String(profile.speed);$('#mod-mult').value=profile.mult;
  $('#mod-speed').dispatchEvent(new Event('input',{bubbles:true}));style(profile.theme,profile.grid);status('Đã áp dụng cấu hình của bạn.');
 });
 $('#nt-profile-reset').addEventListener('click',()=>{$('[data-preset="normal"]').click();style('mint',true);status('Đã về mặc định. Điểm và cấu hình đã lưu được giữ nguyên.');});
 $('#nt-menu-done').addEventListener('click',()=>$('#ntjr-close').click());
 // Make current tab and pane relationships available to keyboard/screen readers.
 const tabs=[...menu.querySelectorAll('[data-ntjr-tab]')];
 tabs.forEach((button,index)=>{
  const name=button.dataset.ntjrTab,pane=menu.querySelector(`[data-ntjr-pane="${name}"]`);
  button.id='nt-tab-'+name;pane.id='nt-pane-'+name;button.setAttribute('aria-controls',pane.id);pane.setAttribute('aria-labelledby',button.id);
  button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowDown'||event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowUp'||event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(next!==undefined){event.preventDefault();tabs[next].click();tabs[next].focus()}});
 });
 if(!menu.querySelector('[data-preset].is-on'))$('[data-preset="normal"]').click();
})();
