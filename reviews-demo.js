/* Real guestbook section at #contact: no full CMS page mutations. */
(()=>{
"use strict";
const root=document.getElementById("nt3105-cms-comments");
if(!root||root.dataset.ready==="1")return;
root.dataset.ready="1";
const REST="https://oyogarwaylhfupcrrfyq.supabase.co/rest/v1/site_comments";
const PUBLIC_KEY="sb_publishable_UWm-gQGorsvOGOksKL0BHg_rR265JRi";
const MAX_COMMENTS=100, headers={apikey:PUBLIC_KEY};
const safe=value=>String(value??"").slice(0,500);
function el(tag,value,cls){
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(value!==undefined)node.textContent=safe(value);
 return node;
}
// Review HTML is rendered by index.html; JavaScript only enhances it.
const form=root.querySelector("#nt3105-comment-form"),list=root.querySelector("#nt3105-comment-list");
const status=root.querySelector("#nt3105-comment-status"),send=form.querySelector('[type="submit"]');
const select=root.querySelector("#ntjr-rating-chooser");
const ratingField=form.elements.namedItem("rating");
const sort=root.querySelector("#ntjr-review-sort"),filter=root.querySelector("#ntjr-review-filter");
const anon=root.querySelector("#ntjr-anonymous-switch"),authorRow=root.querySelector("#ntjr-author-row");
const labels=["","Chưa hài lòng","Cần cải thiện","Bình thường","Rất tốt","Đẳng cấp"];
let rating=0,anonymous=false,comments=[];
const key="ntjr-review-liked-ids-v1";let likedIds=new Set();
try{const saved=JSON.parse(localStorage.getItem(key)||"[]");if(Array.isArray(saved))likedIds=new Set(saved.filter(x=>typeof x==="string").slice(0,100))}catch{}
const buttons=[...select.querySelectorAll("[data-rating]")];
function paintStars(){
 for(const b of buttons){
  const n=Number(b.dataset.rating);
  b.classList.toggle("chosen",n<=rating);
  b.setAttribute("aria-checked",String(n===rating));
  b.tabIndex=n===(rating||1)?0:-1;
 }
 ratingField.value=rating?String(rating):"";
 root.querySelector("#ntjr-rating-description").textContent=rating?rating+"/5 sao · "+labels[rating]:"Chọn từ 1 đến 5 sao";
}
function choose(n){rating=Math.min(5,Math.max(1,Number(n)||1));paintStars()}
for(const button of buttons){
 button.addEventListener("click",()=>choose(button.dataset.rating));
 button.addEventListener("keydown",event=>{
  if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(event.key))return;
  event.preventDefault();
  const n=Number(button.dataset.rating);
  const next=event.key==="Home"?1:event.key==="End"?5:Math.max(1,Math.min(5,n+((event.key==="ArrowRight"||event.key==="ArrowUp")?1:-1)));
  choose(next);buttons[next-1].focus({preventScroll:true});
 });
}
paintStars();
anon.addEventListener("click",()=>{
 anonymous=!anonymous;
 anon.setAttribute("aria-checked",String(anonymous));
 authorRow.hidden=anonymous;
 if(anonymous)form.elements.namedItem("author").value="";
});
function dateText(raw){
 const date=new Date(raw);if(!Number.isFinite(date.getTime()))return "";
 return new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"}).format(date);
}
function render(reset=true){
 const top=list.scrollTop;
 const visible=comments.filter(c=>filter.value==="all"||(filter.value==="low"?Number(c.rating)<=3:Number(c.rating)===Number(filter.value)));
 visible.sort((a,b)=>Number(b.is_pinned)-Number(a.is_pinned)||(sort.value==="rating"?Number(b.rating)-Number(a.rating)||new Date(b.created_at)-new Date(a.created_at):sort.value==="liked"?Number(likedIds.has(String(b.id)))-Number(likedIds.has(String(a.id)))||new Date(b.created_at)-new Date(a.created_at):new Date(b.created_at)-new Date(a.created_at)));
 const frag=document.createDocumentFragment();
 for(const item of visible){
  const n=Math.min(5,Math.max(1,Number(item.rating)||1));
  const article=el("article",undefined,"nt-cms-comment");
  const head=el("div",undefined,"ntjr-review-item-head");
  const avatar=el("div",safe(item.author||"?").trim().slice(0,1).toUpperCase(),"ntjr-review-avatar");
  avatar.setAttribute("aria-hidden","true");
  const person=el("div",undefined,"ntjr-review-person");
  person.append(el("strong",item.author||"Khách ẩn danh"),el("small",dateText(item.created_at)));
  head.append(avatar,person);
  if(item.id!==null&&item.id!==undefined){
   const id=String(item.id),on=likedIds.has(id);
   const like=el("button",on?"♥ Đã thích":"♡ Thích","ntjr-comment-like"+(on?" is-liked":""));
   like.type="button";like.setAttribute("aria-pressed",String(on));
   like.setAttribute("aria-label",(on?"Bỏ thích":"Thích")+" bình luận của "+safe(item.author).slice(0,40));
   like.addEventListener("click",()=>{
    if(likedIds.has(id))likedIds.delete(id);else likedIds.add(id);
    try{localStorage.setItem(key,JSON.stringify([...likedIds].slice(0,100)))}catch{}
    render(false);
   });
   head.append(like);
  }
  const stars=el("div",undefined,"ntjr-comment-stars");stars.setAttribute("aria-label",n+"/5 sao");
  for(let i=1;i<=5;i++)stars.append(el("span","★",i<=n?"is-filled":"is-empty"));
  article.append(head,stars,el("p",item.body));
  if(item.is_pinned)article.append(el("small","✦ Bình luận được ghim","ntjr-pin"));
  if(item.admin_reply){
   const reply=el("div",undefined,"ntjr-review-admin");
   reply.append(el("strong",(item.admin_reply_author||"NT3105")+" · Admin phản hồi"),el("p",item.admin_reply));article.append(reply);
  }
  frag.append(article);
 }
 if(!visible.length)frag.append(el("p",comments.length?"Chưa có bình luận thuộc mức sao này.":"Chưa có bình luận. Hãy là người đầu tiên!","ntjr-review-empty"));
 list.replaceChildren(frag);
 root.querySelector("#ntjr-review-count").textContent=comments.length+" bình luận công khai";
 root.querySelector("#ntjr-review-visible-count").textContent=visible.length+" / "+comments.length+" bình luận · Cuộn để xem thêm";
 const overall=root.querySelector("#ntjr-review-overall");
 if(comments.length){const average=comments.reduce((s,c)=>s+Number(c.rating||0),0)/comments.length;overall.textContent=average.toFixed(1)+" ★";overall.hidden=false;}
 else overall.hidden=true;
 list.scrollTop=reset?0:top;
}
async function fetchComments(reset=true){
 const url=REST+"?select=id,author,body,rating,is_pinned,admin_reply,admin_reply_author,created_at&is_hidden=eq.false&order=is_pinned.desc,created_at.desc&limit="+MAX_COMMENTS;
 const response=await fetch(url,{headers,cache:"no-store"});
 if(!response.ok)throw Error("Read failed: "+response.status);
 const json=await response.json();if(!Array.isArray(json))throw Error("Invalid response");
 comments=json;render(reset);
}
async function refresh(){
 try{await fetchComments()}catch(error){
  console.error("NTJR guestbook:",error);
  list.replaceChildren(el("p","Không tải được bình luận. Hãy thử lại sau.","ntjr-review-empty"));
  root.querySelector("#ntjr-review-count").textContent="Chưa kết nối";
  root.querySelector("#ntjr-review-visible-count").textContent="Vui lòng thử lại sau";
 }
}
sort.addEventListener("change",()=>render());filter.addEventListener("change",()=>render());
root.querySelector("#ntjr-review-to-top").addEventListener("click",()=>list.scrollTo({top:0,behavior:"smooth"}));
form.addEventListener("submit",async event=>{
 event.preventDefault();if(send.disabled)return;
 const author=anonymous?"Khách ẩn danh":form.elements.namedItem("author").value.trim();
 const body=form.elements.namedItem("body").value.trim();
 const score=Number(ratingField.value);
 if(author.length<2||author.length>40||body.length<3||body.length>500||!Number.isInteger(score)||score<1||score>5){
  status.textContent="Vui lòng chọn sao, nhập tên hoặc bật ẩn danh và viết ít nhất 3 ký tự.";return;
 }
 send.disabled=true;status.textContent="Đang gửi đánh giá...";
 try{
  const response=await fetch(REST,{method:"POST",headers:{...headers,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({author,body,rating:score})});
  if(!response.ok)throw Error("Write failed: "+response.status);
  status.textContent="✓ Đã gửi đánh giá. Cảm ơn bạn!";
  form.elements.namedItem("author").value="";form.elements.namedItem("body").value="";
  rating=0;paintStars();sort.value="recent";filter.value="all";await refresh();
 }catch(error){console.error("NTJR guestbook:",error);status.textContent="Chưa gửi được đánh giá. Vui lòng thử lại sau.";}
 finally{send.disabled=false}
});
send.disabled=false;
window.addEventListener("focus",()=>fetchComments(false).catch(()=>{}));
setInterval(()=>{if(!document.hidden)fetchComments(false).catch(()=>{})},15000);
refresh();
})();

