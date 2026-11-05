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

  function addFooter() {
    let footer=document.querySelector(".fdh-global-footer");
    if(!footer){
      footer=document.createElement("footer");
      document.body.appendChild(footer);
    }
    footer.classList.add("fdh-global-footer");
    if(footer.dataset.fdhBuilt==="true") return;
    footer.innerHTML=`
      <div class="fdh-footer-inner">
        <div class="fdh-footer-top">
          <div class="fdh-footer-brand">
            <div class="fdh-footer-brandline">
              <img class="fdh-footer-logo" src="assets/logo.png" alt="FLAME DRAGON HUB logo" loading="lazy">
              <div class="fdh-footer-brandtext">
                <strong>FLAME DRAGON</strong>
                <span>HUB · EVOWORLD COMMUNITY</span>
              </div>
            </div>
            <p>Custom skins, tools and useful resources for EvoWorld players. Fan-made and not affiliated with EvoWorld.io.</p>
          </div>
          <nav class="fdh-footer-column" aria-label="Pages">
            <h3>Pages</h3>
            <a href="index.html">Home</a>
            <a href="evolutions.html">Evolutions</a>
            <a href="skins.html">Skins Library</a>
            <a href="skin-studio.html">Skin Studio</a>
            <a href="favorites.html">Favorites</a>
          </nav>
          <div class="fdh-footer-column">
            <h3>Support</h3>
            <a href="contact.html">Contact</a>
            <a href="mailto:flame.dragon.hub@gmail.com">flame.dragon.hub@gmail.com</a>
            <a href="developer.html">Developer</a>
          </div>
        </div>
        <div class="fdh-footer-wordmark" aria-label="FLAME DRAGON">
          <span>FLAME DRAGON</span>
          <i aria-hidden="true">✦</i>
        </div>
        <div class="fdh-footer-bottom">
          <span>© <span class="fdh-year"></span> FLAME DRAGON HUB</span>
          <span>Made for the EvoWorld community</span>
          <a href="index.html">Back to Home ↑</a>
        </div>
      </div>`;
    footer.querySelector(".fdh-year").textContent=new Date().getFullYear();
    footer.dataset.fdhBuilt="true";
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
    if(reduceMotion)return;
    document.querySelectorAll("main h1,main h2,main h3,.hero h1,.contact-hero h1,.signin-hero h1").forEach(splitHeading);
    const selector="main > section,main > article,main .hub-card,main .evolution-card,main .guide-card,main .skin-card,main .welcome-card,main .signin-step,main .fav-card,main .panel,.contact-layout > *,main .hero p";
    const items=[...document.querySelectorAll(selector)];
    items.forEach((el,i)=>{
      if(el.closest("form,.auth-card,.login-card,.contact-form-card,.no-motion,.fdh-global-footer")||el.matches("form")||el.classList.contains("fdh-reveal"))return;
      el.classList.add("fdh-reveal");
      el.dataset.fdhDirection=(i%2===0?"left":"right");
      el.style.setProperty("--fdh-delay",Math.min((i%6)*105,525)+"ms");
    });
    document.querySelectorAll("main img,.guide-card img,.skin-card img,.welcome-logo").forEach(img=>{
      if(!img.closest("form,.auth-card,.login-card,.no-motion")&&!img.classList.contains("fdh-image-reveal"))img.classList.add("fdh-image-reveal");
    });
    const targets=document.querySelectorAll(".fdh-reveal,.fdh-image-reveal");
    if(!("IntersectionObserver" in window)){targets.forEach(el=>el.classList.add("fdh-visible"));return;}
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("fdh-visible");observer.unobserve(entry.target);}});
    },{threshold:.10,rootMargin:"0px 0px -45px 0px"});
    targets.forEach(el=>observer.observe(el));
  }

  function addDragonAtmosphere(){
    if(document.querySelector(".fdh-dragon-atmosphere"))return;
    const layer=document.createElement("div");
    layer.className="fdh-dragon-atmosphere";
    layer.setAttribute("aria-hidden","true");
    layer.innerHTML=`
      <div class="fdh-dragon-words">
        <span>FLAME DRAGON</span><span>SKINS EDITOR</span><nobr></nobr>
        <span>EVOWORLD</span><span>YOUR SKIN · YOUR STYLE</span>
      </div>
      <img class="fdh-flying-dragon" src="assets/skins/evolution-creatures/dragon.webp" alt="" loading="lazy">
    `;
    layer.querySelector("nobr")?.remove();
    document.body.prepend(layer);
  }

  function init(){
    addScrollProgress();
    addFooter();
    addReveal();
    addDragonAtmosphere();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();