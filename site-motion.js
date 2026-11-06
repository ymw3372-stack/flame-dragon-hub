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

  // Shared transparent footer with centered navigation, saved player profile and a
  // viewport-wide continuous ticker. The profile data stays local to this browser.
  function addGlobalFooter(){
    if(document.querySelector(".fdh-global-footer"))return;
    const footer=document.createElement("footer");
    footer.className="fdh-global-footer";
    footer.innerHTML=`
      <div class="fdh-footer-inner">
        <div class="fdh-bottom-marquee" aria-label="FLAME DRAGON HUB announcement">
          <div class="fdh-marquee-track">
            <div class="fdh-marquee-group"><span>🔥 FLAME DRAGON HUB&nbsp; · &nbsp;YOUR EVOWORLD COMPANION&nbsp; · &nbsp;EXPLORE EVOLUTIONS&nbsp; · &nbsp;DISCOVER SKINS&nbsp; · &nbsp;STAY LEGENDARY&nbsp; ✦&nbsp;</span></div>
            <div class="fdh-marquee-group" aria-hidden="true"><span>🔥 FLAME DRAGON HUB&nbsp; · &nbsp;YOUR EVOWORLD COMPANION&nbsp; · &nbsp;EXPLORE EVOLUTIONS&nbsp; · &nbsp;DISCOVER SKINS&nbsp; · &nbsp;STAY LEGENDARY&nbsp; ✦&nbsp;</span></div>
          </div>
        </div>
        <div class="fdh-footer-main">
          <section class="fdh-footer-brand">
            <a class="fdh-footer-brandline" href="index.html" aria-label="FLAME DRAGON HUB Home">
              <img class="fdh-footer-logo" src="assets/logo.png" alt="">
              <span class="fdh-footer-brandtext"><strong>FLAME DRAGON HUB</strong><small>YOUR EVOWORLD COMPANION</small></span>
            </a>
            <p>Explore EvoWorld evolutions, discover skins, and customize your experience with FLAME DRAGON HUB.</p>
          </section>

          <nav class="fdh-footer-column fdh-footer-pages" aria-label="Pages">
            <h3>Pages</h3>
            <a href="index.html">Home</a>
            <a href="evolutions.html">Evolutions</a>
            <a href="skins.html">Skins Library</a>
            <a href="favorites.html">Favorites</a>
            <a href="settings.html">Settings</a>
            <a href="developer.html">Developer</a>
          </nav>

          <div class="fdh-footer-column fdh-footer-support">
            <h3>Support</h3>
            <a href="contact.html">Contact Us</a>
            <a href="install-guide.html">Installation Guide</a>
            <a href="about.html">About FLAME DRAGON HUB</a>
            <a class="fdh-footer-profile" href="account.html" aria-label="Open your player profile">
              <span class="fdh-footer-avatar" aria-hidden="true">🐉</span>
              <span class="fdh-footer-profile-copy"><strong class="fdh-footer-player-name">FLAME DRAGON</strong><small>YOUR PROFILE</small></span>
            </a>
          </div>
        </div>

        <div class="fdh-footer-bottom"><span>© FLAME DRAGON HUB · Unofficial EvoWorld companion</span><span>Made for the EvoWorld community</span></div>
      </div>`;
    const languageDock=document.querySelector(".fdh-language-dock");
    const marquee=footer.querySelector(".fdh-bottom-marquee");
    if(languageDock && marquee) marquee.insertAdjacentElement("afterend",languageDock);
    document.body.appendChild(footer);

    const playerName=localStorage.getItem("flameDragonProfileName")||"FLAME DRAGON";
    footer.querySelector(".fdh-footer-player-name").textContent=playerName.slice(0,24);
    const avatar=footer.querySelector(".fdh-footer-avatar");
    const savedImage=localStorage.getItem("flameDragonProfileImage");
    if(savedImage && /^data:image\/(?:webp|jpeg|png|gif);base64,/i.test(savedImage)){
      const image=document.createElement("img");
      image.src=savedImage;
      image.alt="";
      avatar.replaceChildren(image);
      avatar.classList.add("has-image");
    }else{
      avatar.textContent=localStorage.getItem("flameDragonProfileAvatar")||"🐉";
    }
  }

  // Change the running CSS animation's playback rate without resetting its timeline.
  // updatePlaybackRate preserves the current animation position while easing to the new speed.
  function addMarqueeHoverSlowdown(){
    const marquee=document.querySelector(".fdh-global-footer .fdh-bottom-marquee");
    if(!marquee || marquee.dataset.fdhSpeedControl==="true")return;
    marquee.dataset.fdhSpeedControl="true";
    const setSpeed=(rate)=>{
      marquee.querySelectorAll(".fdh-marquee-track").forEach(track=>{
        track.getAnimations().forEach(animation=>{
          const name=animation.animationName || animation.effect?.getTiming?.().easing;
          if(animation.animationName==="fdh-marquee-travel"){
            animation.updatePlaybackRate(rate);
          }
        });
      });
    };
    marquee.addEventListener("pointerenter",()=>setSpeed(0.28),{passive:true});
    marquee.addEventListener("pointerleave",()=>setSpeed(1),{passive:true});
    marquee.addEventListener("focusin",()=>setSpeed(0.28));
    marquee.addEventListener("focusout",event=>{
      if(!marquee.contains(event.relatedTarget))setSpeed(1);
    });
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
    addGlobalFooter();
    addMarqueeHoverSlowdown();
    if(typeof addBonusPanel==="function")addBonusPanel();
    addReveal();
    addPointerTilt();
    addDragonAtmosphere();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();