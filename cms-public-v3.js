/* NT3105 live-content CMS client. Public reads published only; no admin credentials. */
(()=>{
"use strict";
const URL="https://oyogarwaylhfupcrrfyq.supabase.co";
const KEY="sb_publishable_UWm-gQGorsvOGOksKL0BHg_rR265JRi";
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const isURL=s=>{try{const u=new URL(s);return u.protocol==="https:"}catch{return false}};
const setText=(query,value)=>{if(typeof value!=="string")return;const node=$(query);if(node)node.textContent=value.slice(0,500)};
const safeUrl=s=>typeof s==="string"&&isURL(s)?s:null;
const show=(query,visible)=>{const el=$(query);if(el)el.hidden=!visible};
const trim=s=>String(s||"").slice(0,250);
function createNode(tag,attrs={},text){
  const n=document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){if(k==="class")n.className=v;else n.setAttribute(k,String(v))}
  if(text!==undefined)n.textContent=String(text);
  return n;
}
function updateGallery(items){
 const gallery=$("#memories .nt-gallery");
 if(!gallery||!Array.isArray(items)||!items.length)return;
 const allowed=items.filter(i=>i&&i.visible!==false&&safeUrl(i.src)).slice(0,40);
 if(!allowed.length){gallery.hidden=true;return}
 gallery.hidden=false;
 const frag=document.createDocumentFragment();
 for(const item of allowed){
   const a=createNode("a",{class:"nt-memory",href:item.src,target:"_blank",rel:"noopener noreferrer"});
   const img=createNode("img",{src:item.src,alt:trim(item.title||"Ảnh kỷ niệm"),loading:"lazy",decoding:"async",draggable:"false"});
   const caption=createNode("span",{class:"nt-memory-caption"});
   caption.append(createNode("strong",{},trim(item.title||"Khoảnh khắc")),createNode("small",{},"NT3105 / GALLERY"));
   a.append(img,caption);frag.append(a);
 }
 gallery.replaceChildren(frag);
 gallery.style.overflowX="auto";gallery.style.scrollSnapType="x mandatory";gallery.style.touchAction="pan-x";
}
function updateCards(selector,items,kind){
 if(!Array.isArray(items)||!items.length)return;
 const parent=$(selector);if(!parent)return;
 const frag=document.createDocumentFragment();
 for(const obj of items.filter(x=>x&&x.visible!==false).slice(0,30)){
  const title=trim(kind==="skills"?obj.name:obj.title);if(!title)continue;
  const card=createNode("article",{class:kind==="skills"?"skill-card reveal":"project-card reveal"});
  if(kind==="projects"&&safeUrl(obj.image)){card.append(createNode("img",{src:obj.image,loading:"lazy",alt:title}))}
  card.append(createNode("h3",{},title),createNode("p",{},trim(obj.description)));
  if(kind==="projects"&&safeUrl(obj.url)){const link=createNode("a",{href:obj.url,target:"_blank",rel:"noopener noreferrer"},"Xem dự án ↗");card.append(link)}
  frag.append(card);
 }
 if(frag.childNodes.length)parent.replaceChildren(frag);
}
function renderMusic(music){
 if(!music||typeof music!=="object")return;
 const tracks=Array.isArray(music.tracks)?music.tracks.filter(x=>x?.visible!==false&&safeUrl(x?.src)).slice(0,30):[];
 window.dispatchEvent(new CustomEvent("nt3105:cms-music",{detail:{enabled:music.enabled!==false,tracks}}));
}
function setSocial(kind,value){
 if(!safeUrl(value))return;
 $$('[data-social="'+kind+'"]').forEach(a=>{if(a.tagName==="A"){a.href=value;a.rel="noopener noreferrer";a.target="_blank"}});
}
function renderComments(client,content){
 if(content?.comments?.enabled===false)return;
 const main=$("#main");if(!main||document.getElementById("nt3105-cms-comments"))return;
 const section=createNode("section",{class:"section container nt-cms-comments",id:"nt3105-cms-comments"});
 section.innerHTML='<div class="section-heading"><p class="eyebrow">GUESTBOOK / BÌNH LUẬN</p><h2></h2><p>Để lại lời nhắn hoặc đánh giá trải nghiệm.</p></div><div class="nt-cms-comment-shell"><form id="nt3105-comment-form"><label>Tên hiển thị<input name="author" maxlength="40" minlength="2" required autocomplete="nickname" placeholder="Tên của bạn"></label><label>Đánh giá<select name="rating"><option value="5">★★★★★ (5)</option><option value="4">★★★★ (4)</option><option value="3">★★★ (3)</option><option value="2">★★ (2)</option><option value="1">★ (1)</option></select></label><label class="wide">Lời nhắn<textarea name="body" rows="3" minlength="3" maxlength="500" required placeholder="Bạn muốn chia sẻ điều gì?"></textarea></label><button type="submit">Gửi nhận xét ↗</button><p id="nt3105-comment-status" role="status" aria-live="polite"></p></form><div id="nt3105-comment-list" aria-live="polite"></div></div>';
 const heading=section.querySelector("h2");heading.textContent=trim(content?.comments?.title||"Nhận xét của khách.");
 main.append(section);
 const list=$("#nt3105-comment-list"),status=$("#nt3105-comment-status"),form=$("#nt3105-comment-form");
 const load=async()=>{
  const {data,error}=await client.from("site_comments").select("author,body,rating,is_pinned,admin_reply,created_at").eq("is_hidden",false).order("created_at",{ascending:false}).limit(100);
  if(error){list.textContent="Chưa thể tải bình luận.";return}
  const frag=document.createDocumentFragment();
  for(const c of (data||[]).sort((a,b)=>Number(b.is_pinned)-Number(a.is_pinned))){
   const article=createNode("article",{class:"nt-cms-comment"});
   article.append(createNode("strong",{},trim(c.author)+" · "+"★".repeat(Math.max(1,Math.min(5,Number(c.rating)||5)))) ,createNode("p",{},trim(c.body)));
   if(c.is_pinned)article.append(createNode("small",{},"✦ Đã ghim"));
   if(c.admin_reply)article.append(createNode("blockquote",{},"NT3105: "+trim(c.admin_reply)));
   frag.append(article);
  }
  list.replaceChildren(frag.childNodes.length?frag:createNode("p",{},"Chưa có nhận xét. Hãy là người đầu tiên!"));
 };
 form.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!form.reportValidity())return;
  const button=form.querySelector('button[type="submit"]');button.disabled=true;status.textContent="Đang gửi...";
  try{
   const body=String(form.elements.body.value).trim();
   const author=String(form.elements.author.value).trim();
   const rating=Number(form.elements.rating.value);
   if(author.length<2||author.length>40||body.length<3||body.length>500||rating<1||rating>5)throw Error("Thông tin không hợp lệ.");
   const {error}=await client.from("site_comments").insert({author,body,rating});
   if(error)throw error;
   status.textContent="✓ Đã lưu nhận xét. Cảm ơn bạn!";
   form.reset();await load();
  }catch(err){console.error(err);status.textContent="Không gửi được nhận xét. Vui lòng thử lại sau."}
  finally{button.disabled=false}
 });
 load();
}
function apply(content,client){
 const c=content||{};
 if(c.hero){
  if(c.hero.visible===false)show("#home",false);
  setText("#home .hero-description",c.hero.subtitle);
  if(c.hero.title&&c.hero.title!=="Xin chào, mình là Ngân Tú Dev."){
   const h=$("#hero-title");if(h)h.replaceChildren(createNode("span",{class:"gradient-text"},trim(c.hero.title)));
  }
  const img=$("#home .nt-portrait img");
  if(img&&safeUrl(c.hero.image)){img.src=c.hero.image;img.style.objectPosition="center "+Math.max(0,Math.min(100,Number(c.hero.position)||50))+"%";img.style.filter="brightness("+(100-Math.max(0,Math.min(90,Number(c.hero.overlay)||0)))+"%)"}
 }
 if(c.brand?.logoText){$$(".brand-wordmark strong,.logo").forEach(n=>n.textContent=trim(c.brand.logoText))}
 if(c.brand?.favicon&&safeUrl(c.brand.favicon)){
  const icon=$('link[rel="icon"]');if(icon)icon.href=c.brand.favicon;
 }
 if(c.about){
  if(c.about.visible===false)show("#about",false);
  else{
   show("#about",true);setText("#about .section-heading h2",c.about.title);
   let p=$("#about .nt-cms-about-body");
   if(!p){p=createNode("p",{class:"nt-cms-about-body"});$("#about")?.append(p)}
   p.textContent=trim(c.about.body);
  }
 }
 updateGallery(c.gallery);
 updateCards("#skills .skills-grid",c.skills,"skills");
 updateCards("#projects .projects-grid",c.projects,"projects");
 if(c.journey){const heading=$("#journey .section-heading");if(heading)heading.hidden=c.journey.visible===false; if(c.journey.visible!==false){setText("#journey h2",c.journey.title);if(c.journey.body){let p=$("#journey .nt-cms-journey");if(!p){p=createNode("p",{class:"nt-cms-journey"});$("#journey")?.append(p)}p.textContent=trim(c.journey.body)}}}
 if(c.contact){if(c.contact.visible===false)show("#contact",false);else{
  setText("#contact .contact-copy h2",c.contact.title);
  setText("#contact .contact-copy > p:not(.eyebrow):not(.form-note)",c.contact.description);
  const mail=$("#contact .contact-email");if(mail&&c.contact.email&&/^[^@]+@[^@]+\.[^@]+$/.test(c.contact.email)){mail.href="mailto:"+encodeURIComponent(c.contact.email);mail.firstChild.textContent=c.contact.email+" "}
 }}
 if(c.navigation){for(const [section,txt] of Object.entries(c.navigation)){const id=section==="home"?"home":section;$$('#nav-links a[href="#'+id+'"] .nav-label').forEach(n=>n.textContent=trim(txt))}}
 if(c.socials){for(const [kind,url] of Object.entries(c.socials))setSocial(kind,url)}
 if(c.theme?.accent)document.documentElement.style.setProperty("--accent",c.theme.accent);
 if(c.theme?.surface)document.documentElement.style.setProperty("--surface",c.theme.surface);
 if(c.theme?.text)document.documentElement.style.setProperty("--text",c.theme.text);
 if(c.theme?.light===true)document.documentElement.classList.add("nt-cms-light");
 if(c.layout){document.documentElement.style.setProperty("--cms-card-radius",Math.max(0,Math.min(44,Number(c.layout.radius)||22))+"px");document.documentElement.style.setProperty("--cms-card-spacing",Math.max(8,Math.min(52,Number(c.layout.spacing)||24))+"px");document.documentElement.style.setProperty("--cms-card-columns",Math.max(1,Math.min(4,Number(c.layout.cardColumns)||3)))}
 if(c.effects){for(const k of ["glass","reveal","parallax","glow","softMotion"])document.documentElement.classList.toggle("nt-cms-no-"+k,c.effects[k]===false);document.documentElement.style.setProperty("--cms-motion-intensity",Math.max(0,Math.min(100,Number(c.effects.intensity)||35)));document.documentElement.style.setProperty("--cms-blur",Math.max(0,Math.min(35,Number(c.effects.blur)||18))+"px")}
 if(c.seo){if(c.seo.title)document.title=trim(c.seo.title);const desc=$('meta[name="description"]');if(desc&&c.seo.description)desc.content=trim(c.seo.description);if(c.seo.ogImage&&safeUrl(c.seo.ogImage)){const og=$('meta[property="og:image"]');if(og)og.content=c.seo.ogImage}}
 if(c.footer){setText(".footer > div p",c.footer.text);setText(".footer > div small",c.footer.credit)}
 renderMusic(c.music);
 renderComments(client,c);
}
async function boot(){
 if(!window.supabase?.createClient){
  try{
    await new Promise((resolve,reject)=>{
      const js=document.createElement("script");
      js.src="https://unpkg.com/@supabase/supabase-js@2";
      js.onload=resolve;
      js.onerror=()=>reject(new Error("Supabase SDK backup unavailable"));
      document.head.append(js);
    });
  }catch(error){console.warn("NT3105 CMS: backup SDK unavailable; keeping original site.",error)}
 }
 if(!window.supabase?.createClient){console.warn("NT3105 CMS: Supabase SDK unavailable; using original site.");return}
 const client=window.supabase.createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 try{
  const {data,error}=await client.from("nt3105_cms_published").select("content").eq("id","main").maybeSingle();
  if(error){console.warn("NT3105 CMS: no migration or offline; keeping existing site.",error.code);return}
  if(data?.content&&typeof data.content==="object"){apply(data.content,client)}
 }catch(error){console.warn("NT3105 CMS: failed to load published content; original site remains.",error)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
