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
root.innerHTML="<div class=\"ntjr-reviews-heading\">\n<p class=\"eyebrow\">06 / ĐÁNH GIÁ WEBSITE</p>\n<h2 id=\"nt3105-reviews-title\">Để lại một chút <span class=\"ntjr-reviews-glow\">cảm nhận.</span></h2>\n<p>Mỗi lời góp ý đều đáng quý. Chia sẻ trải nghiệm thật của bạn tại đây.</p>\n</div>\n<div class=\"ntjr-reviews-layout\">\n<section class=\"ntjr-review-glass ntjr-review-write\" aria-labelledby=\"ntjr-write-title\">\n<div class=\"ntjr-review-card-head\"><span class=\"ntjr-review-card-icon\" aria-hidden=\"true\">✦</span><div><h3 id=\"ntjr-write-title\">Viết đánh giá</h3><p>Chọn số sao và gửi lời nhắn.</p></div></div>\n<form id=\"nt3105-comment-form\" novalidate>\n<fieldset class=\"ntjr-rating-box\"><legend>Bạn chấm bao nhiêu sao?</legend>\n<div id=\"ntjr-rating-chooser\" class=\"ntjr-rating-stars\" role=\"radiogroup\" aria-label=\"Chọn số sao\">\n<button type=\"button\" role=\"radio\" aria-checked=\"false\" aria-label=\"1 sao\" data-rating=\"1\">★</button>\n<button type=\"button\" role=\"radio\" aria-checked=\"false\" aria-label=\"2 sao\" data-rating=\"2\">★</button>\n<button type=\"button\" role=\"radio\" aria-checked=\"false\" aria-label=\"3 sao\" data-rating=\"3\">★</button>\n<button type=\"button\" role=\"radio\" aria-checked=\"false\" aria-label=\"4 sao\" data-rating=\"4\">★</button>\n<button type=\"button\" role=\"radio\" aria-checked=\"false\" aria-label=\"5 sao\" data-rating=\"5\">★</button></div>\n<input type=\"hidden\" name=\"rating\" value=\"\"><p id=\"ntjr-rating-description\" class=\"ntjr-rating-description\" aria-live=\"polite\">Chọn từ 1 đến 5 sao</p></fieldset>\n<div class=\"ntjr-anonymous\"><div><strong>Đánh giá ẩn danh</strong><span>Không cần hiển thị tên của bạn</span></div><button type=\"button\" id=\"ntjr-anonymous-switch\" class=\"ntjr-toggle\" role=\"switch\" aria-checked=\"false\" aria-label=\"Đánh giá ẩn danh\"></button></div>\n<label id=\"ntjr-author-row\" class=\"ntjr-field\">Tên hiển thị<input name=\"author\" maxlength=\"40\" autocomplete=\"nickname\" placeholder=\"Tên bạn muốn hiển thị\"></label>\n<label class=\"ntjr-field\">Lời nhắn<textarea name=\"body\" rows=\"4\" maxlength=\"500\" placeholder=\"Bạn thấy website như thế nào?\"></textarea></label>\n<button type=\"submit\" class=\"ntjr-review-submit\">Gửi đánh giá <span aria-hidden=\"true\">↗</span></button>\n<p id=\"nt3105-comment-status\" class=\"ntjr-comment-status\" role=\"status\" aria-live=\"polite\"></p>\n</form></section>\n<section class=\"ntjr-review-glass ntjr-review-read\" aria-labelledby=\"ntjr-list-title\">\n<div class=\"ntjr-review-card-head ntjr-read-head\"><span class=\"ntjr-review-card-icon\" aria-hidden=\"true\">✧</span><div><h3 id=\"ntjr-list-title\">Bình luận công khai</h3><p id=\"ntjr-review-count\">Đang tải đánh giá...</p></div><div class=\"ntjr-review-overall\" id=\"ntjr-review-overall\" aria-label=\"Điểm đánh giá trung bình\" hidden></div></div>\n<div class=\"ntjr-review-controls\">\n<label class=\"ntjr-review-dropdown\"><span class=\"ntjr-visually-hidden\">Sắp xếp bình luận</span><select id=\"ntjr-review-sort\" aria-label=\"Sắp xếp bình luận\"><option value=\"recent\">Mới nhất trước</option><option value=\"rating\">Đánh giá cao nhất</option><option value=\"liked\">Đã thích trên máy này</option></select></label>\n<label class=\"ntjr-review-dropdown\"><span class=\"ntjr-visually-hidden\">Lọc số sao</span><select id=\"ntjr-review-filter\" aria-label=\"Lọc số sao\"><option value=\"all\">Tất cả số sao</option><option value=\"5\">5 sao</option><option value=\"4\">4 sao</option><option value=\"low\">3 sao trở xuống</option></select></label></div>\n<div id=\"nt3105-comment-list\" class=\"ntjr-review-scroll\" role=\"region\" tabindex=\"0\" aria-label=\"Danh sách bình luận, có thể cuộn\"><p>Đang tải bình luận...</p></div>\n<div class=\"ntjr-review-bottom\"><span id=\"ntjr-review-visible-count\">Bình luận mới nhất hiển thị trước</span><button type=\"button\" id=\"ntjr-review-to-top\">↑ Lên đầu</button></div></section></div>";
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
 visible.sort((a,b)=>sort.value==="rating"?Number(b.rating)-Number(a.rating)||new Date(b.created_at)-new Date(a.created_at):sort.value==="liked"?Number(likedIds.has(String(b.id)))-Number(likedIds.has(String(a.id)))||new Date(b.created_at)-new Date(a.created_at):new Date(b.created_at)-new Date(a.created_at));
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
   reply.append(el("strong","NTJR phản hồi"),el("p",item.admin_reply));article.append(reply);
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
async function fetchComments(){
 const url=REST+"?select=id,author,body,rating,is_pinned,admin_reply,created_at&is_hidden=eq.false&order=created_at.desc&limit="+MAX_COMMENTS;
 const response=await fetch(url,{headers,cache:"no-store"});
 if(!response.ok)throw Error("Read failed: "+response.status);
 const json=await response.json();if(!Array.isArray(json))throw Error("Invalid response");
 comments=json;render();
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
refresh();
})();
