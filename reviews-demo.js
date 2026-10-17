/* Standalone comments demo. No full-page CMS bootstrap or style changes. */
(()=>{
"use strict";
const REST="https://oyogarwaylhfupcrrfyq.supabase.co/rest/v1/site_comments";
const PUBLIC_KEY="sb_publishable_UWm-gQGorsvOGOksKL0BHg_rR265JRi";
const MAX_COMMENTS=100;
const page=document.getElementById("main");
if(!page||document.getElementById("nt3105-cms-comments"))return;
const section=document.createElement("section");
section.id="nt3105-cms-comments";
section.className="section container nt-cms-comments";
section.setAttribute("aria-labelledby","nt3105-reviews-title");
section.innerHTML='<div class="section-heading"><p class="eyebrow">GUESTBOOK / BÌNH LUẬN</p><h2 id="nt3105-reviews-title">Nhận xét của khách.</h2><p>Để lại lời nhắn hoặc đánh giá trải nghiệm.</p></div><div class="nt-cms-comment-shell"><form id="nt3105-comment-form"><label>Tên hiển thị<input name="author" maxlength="40" minlength="2" required autocomplete="nickname" placeholder="Tên của bạn"></label><label>Đánh giá<select name="rating"><option value="5">★★★★★ (5)</option><option value="4">★★★★ (4)</option><option value="3">★★★ (3)</option><option value="2">★★ (2)</option><option value="1">★ (1)</option></select></label><label class="wide">Lời nhắn<textarea name="body" rows="3" minlength="3" maxlength="500" required placeholder="Bạn muốn chia sẻ điều gì?"></textarea></label><button type="submit">Gửi nhận xét ↗</button><p id="nt3105-comment-status" role="status" aria-live="polite"></p></form><div id="nt3105-comment-list" aria-label="Danh sách nhận xét" aria-live="polite"><p>Đang tải bình luận...</p></div></div>';
page.append(section);
const list=section.querySelector("#nt3105-comment-list");
const form=section.querySelector("#nt3105-comment-form");
const status=section.querySelector("#nt3105-comment-status");
const button=form.querySelector('button[type="submit"]');
const safeText=value=>String(value??"").slice(0,500);
const node=(tag,value,cls)=>{
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(value!==undefined)el.textContent=safeText(value);
 return el;
};
const headers={"apikey":PUBLIC_KEY};
async function readComments(){
 const url=REST+"?select=author,body,rating,is_pinned,admin_reply,created_at&is_hidden=eq.false&order=created_at.desc&limit="+MAX_COMMENTS;
 const response=await fetch(url,{headers,cache:"no-store"});
 if(!response.ok)throw Error("Comments read failed: "+response.status);
 const rows=await response.json();
 if(!Array.isArray(rows))throw Error("Invalid comments response");
 const frag=document.createDocumentFragment();
 rows.sort((a,b)=>Number(Boolean(b.is_pinned))-Number(Boolean(a.is_pinned)));
 for(const item of rows){
  const rating=Math.max(1,Math.min(5,Number(item.rating)||5));
  const comment=node("article",undefined,"nt-cms-comment");
  comment.append(node("strong",safeText(item.author)+" · "+"★".repeat(rating)),node("p",item.body));
  if(item.is_pinned)comment.append(node("small","✦ Đã ghim"));
  if(item.admin_reply)comment.append(node("blockquote","NT3105: "+safeText(item.admin_reply)));
  frag.append(comment);
 }
 if(!frag.childNodes.length)frag.append(node("p","Chưa có nhận xét. Hãy là người đầu tiên!"));
 list.replaceChildren(frag);
}
async function refresh(){
 try{await readComments()}
 catch(error){
  console.error("NT3105 guestbook:",error);
  list.replaceChildren(node("p","Không tải được bình luận. Hãy thử lại sau."));
 }
}
form.addEventListener("submit",async event=>{
 event.preventDefault();
 if(button.disabled||!form.reportValidity())return;
 const author=form.elements.namedItem("author").value.trim();
 const body=form.elements.namedItem("body").value.trim();
 const rating=Number(form.elements.namedItem("rating").value);
 if(author.length<2||author.length>40||body.length<3||body.length>500||!Number.isInteger(rating)||rating<1||rating>5){
  status.textContent="Vui lòng kiểm tra tên, lời nhắn và số sao.";
  return;
 }
 button.disabled=true;
 status.textContent="Đang gửi nhận xét...";
 try{
  const response=await fetch(REST,{
   method:"POST",
   headers:{...headers,"Content-Type":"application/json","Prefer":"return=minimal"},
   body:JSON.stringify({author,body,rating}),
  });
  if(!response.ok)throw Error("Comments submission failed: "+response.status);
  status.textContent="✓ Đã gửi nhận xét. Cảm ơn bạn!";
  form.reset();
  await refresh();
 }catch(error){
  console.error("NT3105 guestbook:",error);
  status.textContent="Chưa gửi được nhận xét. Vui lòng thử lại sau.";
 }finally{button.disabled=false}
});
refresh();
})();
