/* NT3105 live-content CMS client. Public reads published only; no admin credentials. */
(()=>{
"use strict";
const SUPABASE_URL="https://oyogarwaylhfupcrrfyq.supabase.co";
const KEY="sb_publishable_UWm-gQGorsvOGOksKL0BHg_rR265JRi";
const STUDIO_PREVIEW = new URLSearchParams(location.search).get("nt3105_preview")==="1";
const ADMIN_ORIGIN="https://admin.nt3105.io.vn";
const ORIGINAL_HERO_MARKUP=document.querySelector("#hero-title")?.innerHTML||"";
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const isURL=s=>{try{const u=new URL(s);return u.protocol==="https:"}catch{return false}};
const setText=(query,value)=>{if(typeof value!=="string")return;const node=$(query);if(node)node.textContent=value.slice(0,500)};
const safeUrl=s=>typeof s==="string"&&isURL(s)?s:null;
const show=(query,visible)=>{const el=$(query);if(el){el.hidden=!visible;el.style.display=visible?"":"none"}};
const trim=(s,max=1500)=>String(s??"").slice(0,max);
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
   const previewImg=card.querySelector("img");
   if(previewImg&&!previewImg.dataset.cmsOriginalThumb)previewImg.dataset.cmsOriginalThumb=previewImg.getAttribute("src")||"";
   card.href=url;
   const nextThumb=safeUrl(item.thumb)||((oldHref===url||url.endsWith(oldHref))?previewImg?.dataset.cmsOriginalThumb||url:url);
   if(previewImg&&previewImg.src!==nextThumb)previewImg.src=nextThumb;
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
  if(!reused&&kind==="skills"){
    const top=createNode("div",{class:"skill-top"});
    top.append(createNode("span",{class:"skill-value"},"Đang học"));
    const progress=createNode("div",{class:"progress"});
    progress.append(createNode("span"));
    card.append(top,createNode("h3"),createNode("p"),progress);
  }
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
  if(kind==="skills"){
    if(Number.isFinite(Number(obj.level))&&obj.level!==undefined){
      const level=Math.max(0,Math.min(100,Number(obj.level)));
      card.style.setProperty("--level",level+"%");
      const progress=card.querySelector(".progress > span");
      if(progress)progress.style.width=level+"%";
    }
    if(typeof obj.status==="string"){
      const badge=card.querySelector(".skill-value");
      if(badge)badge.textContent=trim(obj.status,80);
    }
    if(safeUrl(obj.icon)){
      let icon=card.querySelector(".nt-app-icon img");
      if(!icon){
        const holder=createNode("span",{class:"nt-app-icon"});
        icon=createNode("img",{alt:"",width:"36",height:"36"});
        holder.append(icon);
        (card.querySelector(".skill-top")||card).prepend(holder);
      }
      icon.src=obj.icon;
    }
  }else if(kind==="projects"){
    const info=card.querySelector(".project-info")||card;
    if(typeof obj.type==="string"){
      let type=card.querySelector(".project-type");
      if(!type){
        type=createNode("span",{class:"project-type"});
        (card.querySelector(".project-title")||info).append(type);
      }
      type.textContent=trim(obj.type,80);
    }
    if(typeof obj.tags==="string"){
      let tags=card.querySelector(".tags");
      if(!tags){tags=createNode("div",{class:"tags"});info.append(tags)}
      tags.replaceChildren(...obj.tags.split(",").map(t=>t.trim()).filter(Boolean).slice(0,12).map(t=>createNode("span",{},t)));
    }
    const actions=card.querySelector(".project-actions")||info;
    if(Object.hasOwn(obj,"source")){
      let link=actions.querySelector("a.source-link");
      if(!link&&safeUrl(obj.source)){link=createNode("a",{class:"source-link"},"Mã nguồn ↗");actions.append(link)}
      if(link){
        if(safeUrl(obj.source)){link.href=obj.source;link.target="_blank";link.rel="noopener noreferrer";link.hidden=false;}
        else link.hidden=true;
      }
    }
    if(Object.hasOwn(obj,"url")){
      let link=actions.querySelector("a.button");
      if(link){
        if(safeUrl(obj.url)){link.href=obj.url;link.hidden=false}
        else if(obj.url===""){link.hidden=true}
      }
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
 if(window.ntSocialLinks)window.ntSocialLinks[kind]=value;
 $$('[data-social="'+kind+'"]').forEach(a=>{if(a.tagName==="A"){a.href=value;a.rel="noopener noreferrer";a.target="_blank"}});
}
function renderComments(client,content){
 const existing=document.getElementById("nt3105-cms-comments");
 if(existing){
   existing.hidden=content?.comments?.enabled===false;
   const h=existing.querySelector("h2");if(h)h.textContent=trim(content?.comments?.title||"Nhận xét của khách.");
   return;
 }
 if(content?.comments?.enabled===false)return;
 const main=$("#main");if(!main)return;
 const section=createNode("section",{class:"section container nt-cms-comments",id:"nt3105-cms-comments"});
 section.innerHTML='<div class="section-heading"><p class="eyebrow">GUESTBOOK / BÌNH LUẬN</p><h2></h2><p>Để lại lời nhắn hoặc đánh giá trải nghiệm.</p></div><div class="nt-cms-comment-shell"><form id="nt3105-comment-form"><label>Tên hiển thị<input name="author" maxlength="40" minlength="2" required autocomplete="nickname" placeholder="Tên của bạn"></label><label>Đánh giá<select name="rating"><option value="5">★★★★★ (5)</option><option value="4">★★★★ (4)</option><option value="3">★★★ (3)</option><option value="2">★★ (2)</option><option value="1">★ (1)</option></select></label><label class="wide">Lời nhắn<textarea name="body" rows="3" minlength="3" maxlength="500" required placeholder="Bạn muốn chia sẻ điều gì?"></textarea></label><button type="submit">Gửi nhận xét ↗</button><p id="nt3105-comment-status" role="status" aria-live="polite"></p></form><div id="nt3105-comment-list" aria-live="polite"></div></div>';
 const heading=section.querySelector("h2");heading.textContent=trim(content?.comments?.title||"Nhận xét của khách.");
 main.append(section);
 const list=$("#nt3105-comment-list"),status=$("#nt3105-comment-status"),form=$("#nt3105-comment-form");
 if(!client){
   form.hidden=true;
   list.textContent="Bản xem trước phần bình luận. Khách truy cập sẽ thấy bình luận thật sau khi xuất bản.";
   return;
 }
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
 const c=content||{},failures=[];
 const applyPart=(name,fn)=>{
   try{fn()}catch(error){
     console.error("NT3105 CMS "+name+" apply failure",error);
     failures.push(name+": "+String(error?.message||error).slice(0,160));
   }
 };
 applyPart("hero",()=>{
if(c.hero){
  if(typeof c.hero.visible==="boolean")show("#home",c.hero.visible);
  setText("#home .hero-description",c.hero.subtitle);
  if(typeof c.hero.title==="string"){
   const h=$("#hero-title");
   if(h){
     const title=trim(c.hero.title);
     if(title==="Xin chào, mình là Ngân Tú Dev."&&ORIGINAL_HERO_MARKUP){
       if(h.innerHTML!==ORIGINAL_HERO_MARKUP)h.innerHTML=ORIGINAL_HERO_MARKUP;
     } else if(h.textContent?.trim()!==title) {
       h.replaceChildren(createNode("span",{class:"gradient-text"},title));
     }
     h.setAttribute("aria-label",title);
   }
  }
  const img=$("#home .nt-portrait img");
  if(img&&safeUrl(c.hero.image)){img.src=c.hero.image;img.style.objectPosition="center "+Math.max(0,Math.min(100,Number(c.hero.position)||50))+"%";img.style.filter="brightness("+(100-Math.max(0,Math.min(90,Number(c.hero.overlay)||0)))+"%)"}
  if(typeof c.hero.roles==="string"&&window.ntCMSUpdateRoles)window.ntCMSUpdateRoles(c.hero.roles);
  const safeHref=value=>typeof value==="string"&&(value.startsWith("#")&&/^#[a-zA-Z0-9_-]+$/.test(value)||safeUrl(value))?value:null;
  const labels=[["primaryLabel","primaryUrl","Xem dự án","#projects"],["secondaryLabel","secondaryUrl","Liên hệ với tôi","#contact"]];
  const actions=$$("#home .hero-actions > a.button");
  labels.forEach(([labelKey,urlKey,fallbackText,fallbackUrl],i)=>{
    const link=actions[i];if(!link)return;
    const label=trim(c.hero[labelKey]||fallbackText,80);
    let textNode=Array.from(link.childNodes).find(node=>node.nodeType===3);
    if(textNode)textNode.textContent=label+" ";
    else link.prepend(document.createTextNode(label+" "));
    link.href=safeHref(c.hero[urlKey])||fallbackUrl;
  });
 }
 });
 applyPart("branding",()=>{
if(c.brand?.logoText){$$(".brand-wordmark strong,.logo").forEach(n=>{
  if(n.textContent?.trim()!==trim(c.brand.logoText)) n.textContent=trim(c.brand.logoText);
 })}
 if(typeof c.brand?.tagline==="string"){
   const header=$("#header .brand");
   if(header){
    header.title=trim(c.brand.tagline,160);
    let extra=header.querySelector(".nt-cms-brand-tagline");
    if(!extra){extra=createNode("small",{class:"nt-cms-brand-tagline"});header.append(extra)}
    extra.textContent=trim(c.brand.tagline,70);
   }
 }
 if(c.brand?.favicon&&safeUrl(c.brand.favicon)){
  const icon=$('link[rel="icon"]');if(icon)icon.href=c.brand.favicon;
 }
 });
 applyPart("about",()=>{
if(c.about){
  if(c.about.visible===false)show("#about",false);
  else{
   show("#about",true);setText("#about .section-heading h2",c.about.title);
   let p=$("#about .nt-cms-about-body");
   if(!p){p=createNode("p",{class:"nt-cms-about-body"});$("#about")?.append(p)}
   p.textContent=trim(c.about.body);
  }
 }
 });
 applyPart("sections",()=>{
if(c.gallerySettings){
  setText("#nt-memories-title",c.gallerySettings.title);
  setText("#memories .nt-gallery-note",c.gallerySettings.subtitle);
 }
 if(c.skillsSettings){
  setText("#skills .section-heading h2",c.skillsSettings.title);
  setText("#skills .section-heading > p",c.skillsSettings.description);
 }
 if(c.projectsSettings){setText("#projects .section-heading h2",c.projectsSettings.title)}
 if(c.socialsSettings){setText("#social .section-heading h2",c.socialsSettings.title)}
 if(c.personal){
  if(typeof c.personal.visible==="boolean")show("#personal-space",c.personal.visible);
  setText("#personal-space .section-heading h2",c.personal.title);
  setText("#personal-space .life-moments h3",c.personal.memoryTitle);
  setText("#personal-space .life-moments p",c.personal.memoryDescription);
 }
 if(c.code){
  if(typeof c.code.visible==="boolean")show("#code-corner",c.code.visible);
  setText("#code-heading",c.code.title);
  setText("#code-corner .section-heading > p",c.code.description);
 }
 if(c.donate){
  if(typeof c.donate.visible==="boolean")show("#donate",c.donate.visible);
  setText("#donate .donate-copy h2",c.donate.title);
  const image=$("#donation-qr"),open=$("#qr-open");
  if(safeUrl(c.donate.qrImage)&&image&&open){
    image.src=c.donate.qrImage;
    open.href=c.donate.qrImage;
  }
 }
 updateGallery(c.gallery);
 updateCards("#skills .skills-grid",c.skills,"skills");
 updateCards("#projects .projects-grid",c.projects,"projects");
 });
 applyPart("journey",()=>{
if(c.journey){const heading=$("#journey .section-heading");if(heading)heading.hidden=c.journey.visible===false; if(c.journey.visible!==false){setText("#journey h2",c.journey.title);if(c.journey.body){let p=$("#journey .nt-cms-journey");if(!p){p=createNode("p",{class:"nt-cms-journey"});$("#journey")?.append(p)}p.textContent=trim(c.journey.body)}}}
 });
 applyPart("contact",()=>{
if(c.contact){if(c.contact.visible===false)show("#contact",false);else{
  if(c.contact.title){const title=$("#contact .contact-copy h2");if(title){
   const normal=t=>String(t||"").replace(/\s/g,"").toLowerCase();
   if(normal(title.textContent)!==normal(c.contact.title))title.textContent=trim(c.contact.title);
  }}
  setText("#contact .contact-copy > p:not(.eyebrow):not(.form-note)",c.contact.description);
  const mail=$("#contact .contact-email");if(mail&&c.contact.email&&/^[^@]+@[^@]+\.[^@]+$/.test(c.contact.email)){mail.href="mailto:"+encodeURIComponent(c.contact.email);if(mail.firstChild)mail.firstChild.textContent=c.contact.email+" ";if(window.ntSocialLinks)window.ntSocialLinks.email=c.contact.email}
 }}
 });
 applyPart("navigation",()=>{
if(c.navigation){for(const [section,txt] of Object.entries(c.navigation)){const id=section==="personal"?"personal-space":section==="code"?"code-corner":section;$$('#nav-links a[href="#'+id+'"] .nav-label').forEach(n=>n.textContent=trim(txt))}}
 });
 applyPart("social",()=>{
if(c.socials){for(const [kind,url] of Object.entries(c.socials))setSocial(kind,url)}
 });
 applyPart("theme",()=>{
if(c.theme?.accent&&/^#[a-fA-F0-9]{3,8}$/.test(c.theme.accent)){
  document.documentElement.style.setProperty("--accent",c.theme.accent);
  document.documentElement.style.setProperty("--cyan",c.theme.accent);
  document.documentElement.style.setProperty("--gradient","linear-gradient(110deg,"+c.theme.accent+" 0%,#929cff 52%,#bb8cff 100%)");
 }
 if(c.theme?.background&&/^#[0-9a-fA-F]{3,8}$/.test(c.theme.background)){
   document.documentElement.style.setProperty("--bg",c.theme.background);
 }
 if(c.theme?.surface)document.documentElement.style.setProperty("--surface",c.theme.surface);
 if(c.theme?.text)document.documentElement.style.setProperty("--text",c.theme.text);
 document.documentElement.classList.toggle("nt-cms-light",c.theme?.light===true);
 if(c.layout){document.documentElement.style.setProperty("--cms-card-radius",Math.max(0,Math.min(44,Number(c.layout.radius)||22))+"px");document.documentElement.style.setProperty("--cms-card-spacing",Math.max(8,Math.min(52,Number(c.layout.spacing)||24))+"px");document.documentElement.style.setProperty("--cms-card-columns",Math.max(1,Math.min(4,Number(c.layout.cardColumns)||3)))}
 if(c.effects){for(const k of ["glass","reveal","parallax","glow","softMotion"])document.documentElement.classList.toggle("nt-cms-no-"+k,c.effects[k]===false);document.documentElement.style.setProperty("--cms-motion-intensity",Math.max(0,Math.min(100,Number(c.effects.intensity)||35)));document.documentElement.style.setProperty("--cms-blur",Math.max(0,Math.min(35,Number(c.effects.blur)||18))+"px")}
 });
 applyPart("seoFooter",()=>{
if(c.seo){if(c.seo.title)document.title=trim(c.seo.title);const desc=$('meta[name="description"]');if(desc&&c.seo.description)desc.content=trim(c.seo.description);if(c.seo.ogImage&&safeUrl(c.seo.ogImage)){const og=$('meta[property="og:image"]');if(og)og.content=c.seo.ogImage}}
 if(c.footer){setText(".footer > div p",c.footer.text);setText(".footer > div small",c.footer.credit)}
 });
 applyPart("audio",()=>{
renderMusic(c.music);
 });
 applyPart("guestbook",()=>{
renderComments(client,c);
 });
 if(failures.length)throw new Error("Không thể hiển thị một số mục: "+failures.join(" | "));
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
 if(STUDIO_PREVIEW)return;
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
 publicClient=window.supabase.createClient(SUPABASE_URL,KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 await refreshPublished();
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshPublished();});
 window.addEventListener("focus",()=>{if(!document.hidden)refreshPublished();});
 setInterval(()=>{if(!document.hidden)refreshPublished()},30000);
}

// Studio preview bridge: only the owner's Admin origin can push draft data here.
// This uses the actual public page; no guest can change the published CMS record.
const PREVIEW_TARGETS={
 overview:"#home",hero:"#home",about:"#about",gallery:"#memories",
 music:"#nt-hero-music-open",effects:"#journey",brand:"#header",
 navigation:"#header",skills:"#skills",projects:"#projects",journey:"#journey",
 contact:"#contact",socials:"#social",theme:"#home",layout:"#skills",
 seo:"#home",footer:".footer",comments:"#nt3105-cms-comments",
 personal:"#personal-space",code:"#code-corner",donate:"#donate"
};
const FIELD_TARGETS={
 "hero.title":"#hero-title","hero.subtitle":".hero-description","hero.image":".nt-portrait",
 "hero.position":".nt-portrait","hero.overlay":".nt-portrait",
 "about.title":"#about h2","about.body":"#about",
 "gallery.src":"#memories .nt-gallery","gallery.title":"#memories .nt-gallery",
 "tracks.title":"#nt-hero-music-open","tracks.cover":"#nt-hero-cover",
 "theme.accent":"#home","footer.text":".footer","contact.title":"#contact h2",
 "contact.description":"#contact .contact-copy","brand.logoText":"#header .brand",
 "gallerySettings.title":"#nt-memories-title","skillsSettings.title":"#skills .section-heading h2",
 "projectsSettings.title":"#projects .section-heading h2","socialsSettings.title":"#social .section-heading h2",
 "personal.title":"#personal-space .section-heading h2","code.title":"#code-heading",
 "donate.title":"#donate .donate-copy h2"
};
let previewSpotlight=null;
function previewNavigate(section,field){
 const selector=FIELD_TARGETS[section+"."+field]||PREVIEW_TARGETS[section]||"#home";
 const target=document.querySelector(selector)||document.querySelector(PREVIEW_TARGETS[section]||"#home");
 if(!target)return;
 const opts={behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"};
 target.scrollIntoView(opts);
 if(previewSpotlight)previewSpotlight.classList.remove("nt-cms-spotlight");
 previewSpotlight=target;
 target.classList.add("nt-cms-spotlight");
 clearTimeout(window.__nt3105SpotlightTimer);
 window.__nt3105SpotlightTimer=setTimeout(()=>{
  target.classList.remove("nt-cms-spotlight");
  if(previewSpotlight===target)previewSpotlight=null;
 },2200);
}
function previewSectionFromNode(node){
 if(node.closest("#nt3105-cms-comments"))return "comments";
 if(node.closest("#nt-hero-music-open,.music-widget,.nt-music-float"))return "music";
 const ids={home:"hero",about:"about",memories:"gallery",skills:"skills",
  projects:"projects",journey:"journey",contact:"contact",social:"socials",
  "personal-space":"personal","code-corner":"code",donate:"donate"};
 for(const [id,section] of Object.entries(ids)){
  if(node.closest("#"+id))return section;
 }
 if(node.closest(".footer"))return "footer";
 if(node.closest("#header"))return "navigation";
 return null;
}
if(STUDIO_PREVIEW){
 document.documentElement.classList.add("nt-cms-in-studio");
 window.addEventListener("message",event=>{
  if(event.origin!==ADMIN_ORIGIN||event.source!==window.parent)return;
  const data=event.data;
  if(!data||typeof data!=="object")return;
  if(data.type==="nt3105:cms-preview-ping"){
   window.parent.postMessage({type:"nt3105:cms-preview-ready"},ADMIN_ORIGIN);
   return;
  }
  if(data.type==="nt3105:cms-preview-update"){
   const payload=data.content;
   const revision=Number(data.revision);
   if(!payload||typeof payload!=="object"||Array.isArray(payload))return;
   try{
     if(JSON.stringify(payload).length>700000)throw Error("Nội dung quá lớn để xem trước.");
     apply(payload,null);
   }catch(error){
     console.error("Studio preview update failed",error);
     window.parent.postMessage({type:"nt3105:cms-preview-error",revision,message:String(error?.message||error).slice(0,150)},ADMIN_ORIGIN);
     return;
   }
   window.parent.postMessage({type:"nt3105:cms-preview-applied",revision},ADMIN_ORIGIN);
  }
  if(data.type==="nt3105:cms-preview-navigate"){
   const section=String(data.section||"");
   const field=String(data.field||"");
   previewNavigate(section,field);
  }
 });
 document.addEventListener("click",event=>{
   const node=event.target instanceof Element?event.target:null;
   if(!node)return;
   const section=previewSectionFromNode(node);
   if(node.closest("a,button,form")){
     event.preventDefault();
     event.stopImmediatePropagation();
   }
   if(section){
     window.parent.postMessage({type:"nt3105:cms-preview-select",section},ADMIN_ORIGIN);
     previewNavigate(section,"");
   }
 },true);
 const ready=()=>{
   window.parent.postMessage({type:"nt3105:cms-preview-ready"},ADMIN_ORIGIN);
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready,{once:true});
 else ready();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
