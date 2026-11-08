import { $, escapeHtml as e } from './ui.js?v=download-even-v1';

const STORAGE = 'ntjr-announcement-snooze-v1';
let revision = '';
let autoHandled = false;
let enabled = false;

function signature(value) {
  let hash=2166136261;
  for(const char of value){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
  return (hash>>>0).toString(16);
}
function isSnoozed() {
  try {
    const saved=JSON.parse(localStorage.getItem(STORAGE)||'null');
    return saved?.revision===revision && Number.isFinite(saved.until) && Date.now()<saved.until;
  } catch{return false;}
}
export function setAnnouncement(data) {
  const value=data.announcement || {enabled:true,title:'Thông báo',message:'',links:[]};
  const links=(Array.isArray(value.links)?value.links:[]).filter(link=>{
    try { const url=new URL(link.url);return url.protocol==='https:'&&!url.username&&!url.password; }catch{return false;}
  });
  enabled=value.enabled!==false;
  revision=signature(JSON.stringify([value.title,value.message,links]));
  $('#announcement-title').textContent=value.title||'Thông báo';
  $('#announcement-body').innerHTML=(value.message?`<p class="announcement-message">${e(value.message)}</p>`:'')
    +links.map(link=>`<p class="announcement-link">${e(link.label)}: <a href="${e(link.url)}" target="_blank" rel="noopener noreferrer">Click</a></p>`).join('');
  if(!value.message&&!links.length) $('#announcement-body').innerHTML='<p>Chào mừng bạn đến với NTJR.</p>';
  $('#announcement-strip').hidden=!enabled;
  $('#announcement-strip-text').textContent=(value.message?.split('\n')[0]||'Thông báo từ NTJR')+(links.length?' · '+links[0].label:'');
  if(enabled&&!autoHandled){autoHandled=true;if(!isSnoozed())openAnnouncement();}
  if(!enabled&&$('#announcement-dialog').open)$('#announcement-dialog').close();
}
export function openAnnouncement(){if(enabled&&!$('#announcement-dialog').open)$('#announcement-dialog').showModal();}
export function initAnnouncements(){
  $('#announcement-strip').addEventListener('click',openAnnouncement);
  $('#announcement-close').addEventListener('click',()=>$('#announcement-dialog').close());
  $('#announcement-close-button').addEventListener('click',()=>$('#announcement-dialog').close());
  $('#announcement-snooze').addEventListener('click',()=>{
    try{localStorage.setItem(STORAGE,JSON.stringify({revision,until:Date.now()+3600000}));}catch{}
    $('#announcement-dialog').close();
  });
}
