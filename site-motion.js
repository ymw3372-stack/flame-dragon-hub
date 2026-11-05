/* FLAME DRAGON HUB — slow cinematic motion system */
(() => {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const currentFile = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  function addScrollProgress() {
    if (document.querySelector(".fdh-scroll-track")) return;
    const track=document.createElement("div");
    track.className="fdh-scroll-track";
    track.setAttribute("aria-hidden","true");
    const bar=document.createElement("span");
    bar.className="fdh-scroll-progress";
    track.appendChild(bar);
    document.body.appendChild(track);
    let queued=false;
    const update=()=>{
      const max=document.documentElement.scrollHeight-window.innerHeight;
      const amount=max>0?Math.min(100,Math.max(0,(window.scrollY/max)*100)):0;
      bar.style.width=amount+"%";
      queued=false;
    };
    const request=()=>{if(!queued){queued=true;requestAnimationFrame(update);}};
    window.addEventListener("scroll",request,{passive:true});
    window.addEventListener("resize",request);
    update();
  }

  // Keep the clean layout while restoring the announcement ticker and bonus panel.
  function removeExtraBottomUI(){
    const style=document.createElement("style");
    style.id="fdh-clean-bottom-ui";
    style.textContent=".fdh-global-footer,.fdh-language-dock{display:none!important}body{padding-bottom:0!important}";
    document.head.appendChild(style);
    document.querySelectorAll(".fdh-global-footer,.fdh-language-dock").forEach(el=>el.remove());
  }

  function addPointerTilt(){
    if(reduceMotion || currentFile==="skins.html" || window.matchMedia?.("(pointer: coarse)").matches)return;
    const selector="main .hub-card,main .evolution-card,main .guide-card,main .skin-card,main .welcome-card,main .signin-step,main .fav-card,main .panel,main .settings-card,.contact-layout > *";
    document.querySelectorAll(selector).forEach(card=>{
      if(card.classList.contains("fdh-tilt"))return;
      card.classList.add("fdh-tilt");
      card.addEventListener("pointermove",event=>{
        const rect=card.getBoundingClientRect();
        if(!rect.width||!rect.height)return;
        const x=(event.clientX-rect.left)/rect.width;
        const y=(event.clientY-rect.top)/rect.height;
        card.style.setProperty("--fdh-tilt-x",((.5-y)*5).toFixed(2)+"deg");
        card.style.setProperty("--fdh-tilt-y",((x-.5)*5).toFixed(2)+"deg");
      },{passive:true});
      card.addEventListener("pointerleave",()=>{
        card.style.setProperty("--fdh-tilt-x","0deg");
        card.style.setProperty("--fdh-tilt-y","0deg");
      },{passive:true});
    });
  }

  function splitHeading(heading){
    if(heading.dataset.fdhSplit || heading.closest("a,button,form,.brand,.no-motion,.fdh-global-footer")) return;
    const text=heading.textContent.trim();
    if(!text || text.length>120) return;
    heading.setAttribute("aria-label",heading.getAttribute("aria-label")||text);
    const parts=text.split(/(\s+)/);
    heading.textContent="";
    let n=0;
    parts.forEach(part=>{
      if(!part)return;
      if(/^\s+$/.test(part)){heading.appendChild(document.createTextNode(part));return;}
      const span=document.createElement("span");
      span.className="fdh-word";
      span.style.setProperty("--fdh-word-delay",Math.min(n*95,760)+"ms");
      span.textContent=part;
      heading.appendChild(span);
      n++;
    });
    heading.dataset.fdhSplit="true";
  }

  function addReveal(){
    // Skins Library has its own category/card animation; shared reveal transforms break its grid.
    if(reduceMotion || currentFile==="skins.html")return;
    document.querySelectorAll("main h1,main h2,main h3,.hero h1,.contact-hero h1,.signin-hero h1").forEach(splitHeading);
    const selector="main > section,main > article,main .hub-card,main .evolution-card,main .guide-card,main .skin-card,main .welcome-card,main .signin-step,main .fav-card,main .panel,main .settings-card,.contact-layout > *";
    const items=[...document.querySelectorAll(selector)];
    items.forEach((el,i)=>{
      if(el.closest("form,.auth-card,.login-card,.contact-form-card,.no-motion,.fdh-global-footer")||el.matches("form")||el.classList.contains("fdh-reveal"))return;
      el.classList.add("fdh-reveal");
      el.style.setProperty("--fdh-delay",Math.min((i%3)*65,130)+"ms");
    });
    const targets=document.querySelectorAll(".fdh-reveal");
    if(!("IntersectionObserver" in window)){targets.forEach(el=>el.classList.add("fdh-visible"));return;}
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("fdh-visible");observer.unobserve(entry.target);}});
    },{threshold:.06,rootMargin:"0px 0px -24px 0px"});
    targets.forEach(el=>observer.observe(el));
  }

  function addDragonAtmosphere(){
    if(document.querySelector(".fdh-dragon-atmosphere"))return;
    const layer=document.createElement("div");
    layer.className="fdh-dragon-atmosphere";
    layer.setAttribute("aria-hidden","true");
    layer.innerHTML=`
      <div class="fdh-dragon-words">
        <span>FLAME DRAGON</span><span>SKINS EDITOR</span>
        <span>EVOWORLD</span><span>YOUR SKIN · YOUR STYLE</span>
      </div>
      <img class="fdh-flying-dragon" src="assets/skins/evolution-creatures/dragon.webp" alt="" loading="lazy">
    `;
    document.body.prepend(layer);
  }

  function init(){
    addScrollProgress();
    removeExtraBottomUI();
    addBonusPanel();
    addReveal();
    addPointerTilt();
    addDragonAtmosphere();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();