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
// Keep original gallery/cards and their styling, changing only published content.
function updateGallery(items){
 const gallery=$("#memories .nt-gallery");
 if(!gallery||!Array.isArray(items))return;
 const existing=Array.from(gallery.querySelectorAll(":scope > .nt-memory"));
 const allowed=items.filter(i=>i&&i.visible!==false&&safeUrl(i.src)).slice(0,40);
 if(!allowed.length){gallery.replaceChildren();gallery.hidden=true;return}
 const remaining=new Set(existing),frag=document.createDocumentFragment();
 for(const item of allowed){
   const url=safeUrl(item.src);
   let card=existing.find(node=>remaining.has(node)&&(node.href===url||node.getAttribute("href")===url));
   if(!card)card=existing.find(node=>remaining.has(node))||null;
   if(card)remaining.delete(card);
   else {
     card=createNode("a",{class:"nt-memory"});
     const img=createNode("img",{alt:"",loading:"lazy",decoding:"async",draggable:"false"});
     const caption=createNode("span",{class:"nt-memory-caption"});
     caption.append(createNode("strong"),createNode("small",{},"NT3105 / GALLERY"));
     card.append(img,caption);
   }
   const oldHref=card.getAttribute("href")||"";
   card.href=url;
   if(!oldHref||(oldHref!==url && !url.endsWith(oldHref))){
     const img=card.querySelector("img");if(img)img.src=url;
   }
   const caption=card.querySelector(".nt-memory-caption strong");
   if(caption)caption.textContent=trim(item.title||"Khoảnh khắc");
   const image=card.querySelector("img");if(image)image.alt=trim(item.title||"Ảnh kỷ niệm");
   card.setAttribute("aria-label","Xem ảnh: "+trim(item.title||"Ảnh"));
   frag.append(card);
 }
 gallery.replaceChildren(frag);
 gallery.hidden=false;
 gallery.style.overflowX="auto";
 gallery.style.scrollSnapType="x mandatory";
 gallery.style.touchAction="pan-x";
}
function updateCards(selector,items,kind){
 if(!Array.isArray(items))return;
 const parent=$(selector);if(!parent)return;
 const existing=Array.from(parent.children).filter(node=>node.matches(".skill-card,.project-card"));
 const remaining=new Set(existing),frag=document.createDocumentFragment();
 const titleOf=node=>(node.querySelector("h3")?.textContent||"").trim();
 for(const obj of items.filter(x=>x&&x.visible!==false).slice(0,30)){
  const title=trim(kind==="skills"?obj.name:obj.title);
  if(!title)continue;
  let card=existing.find(node=>remaining.has(node)&&titleOf(node)===title);
  if(!card)card=existing.find(node=>remaining.has(node))||null;
  const reused=Boolean(card);
  if(card)remaining.delete(card);
  else card=createNode("article",{class:kind==="skills"?"skill-card reveal":"project-card reveal"});
  if(!reused&&kind==="projects"){
    const art=createNode("div",{class:"project-art art-portfolio"});
    art.append(createNode("span",{class:"project-number"},"NT3105 / PROJECT"));
    const info=createNode("div",{class:"project-info"});
    const titled=createNode("div",{class:"project-title"});
    titled.append(createNode("h3"));
    info.append(titled,createNode("p"),createNode("div",{class:"project-actions"}));
    card.append(art,info);
  }
  let h=card.querySelector("h3");
  if(!h){h=createNode("h3");card.append(h)}
  h.textContent=title;
  let p=card.querySelector(kind==="projects"?".project-info > p":":scope > p");
  if(!p){p=createNode("p");(kind==="projects"?card.querySelector(".project-info")||card:card).append(p)}
  p.textContent=trim(obj.description);
  if(kind==="projects"){
    const art=card.querySelector(".project-art");
    if(art&&safeUrl(obj.image))art.style.backgroundImage="url("+JSON.stringify(obj.image)+")";
    const actions=card.querySelector(".project-actions");
    if(actions&&safeUrl(obj.url)){
      let link=actions.querySelector("a.button");
      if(!link){link=createNode("a",{class:"button primary small",target:"_blank",rel:"noopener noreferrer"},"Xem dự án ↗");actions.prepend(link)}
      link.href=obj.url;
      if(!reused){link.target="_blank";link.rel="noopener noreferrer"}
    }
  }
  frag.append(card);
 }
 parent.replaceChildren(frag);
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
   const h=$("#hero-title");if(h){h.replaceChildren(createNode("span",{class:"gradient-text"},trim(c.hero.title)));h.setAttribute("aria-label",trim(c.hero.title));}
  }
  const img=$("#home .nt-portrait img");
  if(img&&safeUrl(c.hero.image)){img.src=c.hero.image;img.style.objectPosition="center "+Math.max(0,Math.min(100,Number(c.hero.position)||50))+"%";img.style.filter="brightness("+(100-Math.max(0,Math.min(90,Number(c.hero.overlay)||0)))+"%)"}
 }
 if(c.brand?.logoText){$(".brand-wordmark strong,.logo").forEach(n=>{
  if(n.textContent?.trim()!==trim(c.brand.logoText)) n.textContent=trim(c.brand.logoText);
 })}
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
  if(c.contact.title){const title=$("#contact .contact-copy h2");if(title){
   const normal=t=>String(t||"").replace(/\s/g,"").toLowerCase();
   if(normal(title.textContent)!==normal(c.contact.title))title.textContent=trim(c.contact.title);
  }}
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
let lastContentStamp=null;
let loadingCMS=false;
let publicClient=null;
async function refreshPublished(){
 if(!publicClient||loadingCMS)return;
 loadingCMS=true;
 try{
  const {data,error}=await publicClient.from("nt3105_cms_published").select("content,updated_at").eq("id","main").maybeSingle();
  if(error){console.warn("NT3105 CMS: lookup failed; keeping existing page.",error.code);return}
  if(!data||data.content?.__cmsReady!==true||data.updated_at===lastContentStamp)return;
  apply(data.content,publicClient);
  lastContentStamp=data.updated_at;
 }catch(error){console.warn("NT3105 CMS: refresh failed; retaining current page",error)}
 finally{loadingCMS=false}
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
 publicClient=window.supabase.createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 await refreshPublished();
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshPublished();});
 window.addEventListener("focus",()=>{if(!document.hidden)refreshPublished();});
 setInterval(()=>{if(!document.hidden)refreshPublished()},30000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
