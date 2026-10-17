'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const dom=new JSDOM(html,{url:'https://nt3105.io.vn/',runScripts:'outside-only'});
const {window}=dom;
const doc=window.document;
const originalSkillCards=[...doc.querySelectorAll('#skills .skills-grid > .skill-card')];
const originalProjectCards=[...doc.querySelectorAll('#projects .projects-grid > .project-card')];
assert(originalSkillCards.length>=6,'Expect static skill cards from actual website');
assert(originalProjectCards.length>=2,'Expect illustrated project cards from actual website');
assert(originalSkillCards.every(card=>card.querySelector('.skill-top .nt-app-icon img')),'Original skills must have images');
assert(originalProjectCards.every(card=>card.querySelector('.project-art .project-placeholder')),'Original projects must have illustrated placeholders');
let src=fs.readFileSync('cms-public-v3.js','utf8');
const boot='if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();';
assert(src.includes(boot),'Unexpected CMS entry point');
src=src.replace(boot,'window.__visualTest={apply,updateCards,originalCardTemplates};');
window.eval(src);
const {apply,originalCardTemplates}=window.__visualTest;
assert(originalCardTemplates.skills.length>=6);
assert(originalCardTemplates.projects.length>=2);
const skills=[
 {name:'C1',description:'Biến, điều kiện, vòng lặp và mảng.',visible:true},
 {name:'C++',description:'Cú pháp cơ bản và bài tập nhỏ.',visible:true},
 {name:'HTML',description:'Cấu trúc trang và nội dung web.',visible:true},
 {name:'CSS',description:'Bố cục, màu sắc và responsive.',visible:false},
 {name:'JavaScript',description:'DOM, sự kiện và tương tác trên web.',visible:true},
 {name:'Git / GitHub',description:'Lưu mã nguồn và theo dõi thay đổi.',visible:true},
];
const projects=[
 {title:'Website cá nhân',description:'Không gian giới thiệu bản thân, lưu những khoảnh khắc và chia sẻ dự án. Có đổi màu giao diện và danh sách nhạc riêng.',url:'https://nt3105.io.vn/',image:'',visible:true},
 {title:'Game con sâu',description:'Game rắn săn mồi mình từng làm. Chơi bản web hoặc tải mã nguồn C++ cho Windows để tìm hiểu cách game hoạt động.',url:'https://example.com/snake',image:'',visible:true}
];
function verify(){
 const actualSkills=[...doc.querySelectorAll('#skills .skills-grid > .skill-card')];
 const actualProjects=[...doc.querySelectorAll('#projects .projects-grid > .project-card')];
 assert.equal(actualSkills.length,5,'Hidden CSS skill should not render');
 for(const card of actualSkills){
  const title=card.querySelector('h3')?.textContent;
  assert(card.querySelector('.skill-top .nt-app-icon img,.skill-top .nt-skill-fallback-icon'),title+' lost its icon');
  const bar=card.querySelector('.progress > span');
  assert(bar,title+' lost progress indicator');
  assert(parseFloat(bar.style.width)>0,title+' lost progress width');
  assert(card.querySelector('.skill-value')?.textContent.trim(),title+' lost its status');
 }
 assert.equal(actualSkills[0].querySelector('h3')?.textContent,'C1');
 assert(actualSkills[0].querySelector('.nt-app-icon img')?.getAttribute('src')?.includes('/c.svg'),'Renamed C -> C1 should retain the original C icon');
 assert.equal(actualProjects.length,2);
 for(const card of actualProjects){
  assert(card.querySelector('.project-art .project-placeholder'),card.textContent+' lost illustrated project art');
  assert(card.querySelector('.project-placeholder strong')?.textContent.trim(),'Original project art headline must be visible');
  assert(card.querySelector('.project-actions a.button')?.getAttribute('href'),'Project demo action must survive');
 }
}
assert.doesNotThrow(()=>apply({skills,projects},null),'Applying published media-less content should not crash');
verify();
assert.doesNotThrow(()=>apply({skills,projects},null),'Repeated iframe edits should not break cards');
verify();
// Recover from an older CMS-generated empty card: the original markup must still be available.
doc.querySelector('#skills .skill-card .skill-top')?.replaceChildren(doc.createElement('span'));
doc.querySelector('#projects .project-card .project-art')?.replaceChildren();
apply({skills,projects},null);
verify();
// New custom cards must also have a fallback illustration and visible progress.
apply({skills:[...skills,{name:'Rust',description:'Đang luyện tập.',visible:true}],
 projects:[...projects,{title:'Dự án thứ 3',description:'Thử nghiệm',url:'https://example.com/',image:'',visible:true}]},null);
assert(doc.querySelector('#skills .skills-grid > .skill-card:last-child .nt-skill-fallback-icon'),'New skills need a fallback icon');
assert(parseFloat(doc.querySelector('#skills .skills-grid > .skill-card:last-child .progress > span')?.style.width)>0,'New skill needs visible progress');
assert(doc.querySelector('#projects .projects-grid > .project-card:last-child .project-placeholder strong')?.textContent.includes('Dự án thứ 3'),'New projects need illustration text');
const css=fs.readFileSync('cms-public-v3.css','utf8');
assert(css.includes('html[data-appearance="light"] #header #nav-links > a.active'),'Light navbar needs selected text contrast override');
assert(css.includes('color:#f6fff9!important'),'Selected pill must have light, high-contrast text');
assert(css.includes('.nt-cms-project-placeholder'),'Project fallback art must be styled');
console.log('PASS: actual HTML DOM retains skill icons, 5 progress bars, original project illustrations; recovers missing visuals and selected nav contrast.');
