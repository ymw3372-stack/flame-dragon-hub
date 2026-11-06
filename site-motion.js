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

  // Visible account prompt pinned to the lower-right corner.
  function addAccountReminder(){
    if(currentFile==="account.html" || document.querySelector(".fdh-account-reminder"))return;
    const isHome=currentFile==="index.html" || currentFile==="";
    try{
      if(!isHome && (localStorage.getItem("fdhHasAccountSession")==="1" || sessionStorage.getItem("fdhAccountPromptDismissed")==="1"))return;
    }catch(_){}
    const language=(localStorage.getItem("flameDragonLanguage")||"en").toLowerCase();
    const homeCopy={
      en:{tab:"Sign in / Create Account",question:"Welcome to FLAME DRAGON HUB",desc:"Sign in to access your account, or create one to save your profile and favorites.",yes:"Sign in",no:"Create account",close:"Close"},
      ar:{tab:"تسجيل الدخول / إنشاء حساب",question:"أهلًا بك في FLAME DRAGON HUB",desc:"سجّل الدخول لحسابك أو أنشئ حسابًا لحفظ ملفك الشخصي ومفضلاتك.",yes:"تسجيل الدخول",no:"إنشاء حساب",close:"إغلاق"},
      de:{tab:"Anmelden / Konto erstellen",question:"Willkommen bei FLAME DRAGON HUB",desc:"Melde dich an oder erstelle ein Konto, um Profil und Favoriten zu speichern.",yes:"Anmelden",no:"Konto erstellen",close:"Schließen"},
      ru:{tab:"Войти / Создать аккаунт",question:"Добро пожаловать в FLAME DRAGON HUB",desc:"Войдите или создайте аккаунт, чтобы сохранять профиль и избранное.",yes:"Войти",no:"Создать аккаунт",close:"Закрыть"},
      hi:{tab:"साइन इन / खाता बनाएँ",question:"FLAME DRAGON HUB में आपका स्वागत है",desc:"अपनी प्रोफ़ाइल और पसंदीदा चीज़ें सहेजने के लिए साइन इन करें या खाता बनाएँ।",yes:"साइन इन",no:"खाता बनाएँ",close:"बंद करें"},
      es:{tab:"Iniciar sesión / Crear cuenta",question:"Te damos la bienvenida a FLAME DRAGON HUB",desc:"Inicia sesión o crea una cuenta para guardar tu perfil y favoritos.",yes:"Iniciar sesión",no:"Crear cuenta",close:"Cerrar"},
      tr:{tab:"Giriş yap / Hesap oluştur",question:"FLAME DRAGON HUB'a hoş geldin",desc:"Profilini ve favorilerini kaydetmek için giriş yap veya hesap oluştur.",yes:"Giriş yap",no:"Hesap oluştur",close:"Kapat"}
    };
    const copy={
      en:{tab:"Have you created an account?",question:"Have you created an account?",desc:"If you already have an account, choose Yes. Otherwise, create one to access your hub profile.",yes:"Yes",no:"No, I'll create one",close:"Close"},
      ar:{tab:"هل أنشأت حسابًا؟",question:"هل أنشأت حسابًا؟",desc:"لو عندك حساب اختار أيوه، ولو لسه تقدر تنشئ حساب جديد من هنا.",yes:"أيوه",no:"لا، هعمل حساب",close:"إغلاق"},
      de:{tab:"Hast du ein Konto erstellt?",question:"Hast du bereits ein Konto erstellt?",desc:"Wenn du schon ein Konto hast, wähle Ja. Andernfalls kannst du hier eins erstellen.",yes:"Ja",no:"Nein, Konto erstellen",close:"Schließen"},
      ru:{tab:"Ты создал аккаунт?",question:"Ты уже создал аккаунт?",desc:"Если аккаунт уже есть, выбери «Да». Иначе создай его здесь.",yes:"Да",no:"Нет, создать",close:"Закрыть"},
      hi:{tab:"क्या आपने खाता बनाया है?",question:"क्या आपने खाता बनाया है?",desc:"यदि आपका खाता है तो हाँ चुनें, अन्यथा यहाँ नया खाता बनाएँ।",yes:"हाँ",no:"नहीं, बनाऊँगा",close:"बंद करें"},
      es:{tab:"¿Has creado una cuenta?",question:"¿Ya has creado una cuenta?",desc:"Si ya tienes una cuenta, elige Sí. Si no, puedes crearla aquí.",yes:"Sí",no:"No, crear cuenta",close:"Cerrar"},
      tr:{tab:"Hesap oluşturdun mu?",question:"Bir hesap oluşturdun mu?",desc:"Zaten hesabın varsa Evet'i seç. Yoksa buradan oluşturabilirsin.",yes:"Evet",no:"Hayır, oluştur",close:"Kapat"}
    };
    const text=isHome?(homeCopy[language]||homeCopy.en):(copy[language]||copy.en);
    const widget=document.createElement("aside");
    widget.className="fdh-account-reminder";
    widget.innerHTML=`
      <button class="fdh-account-reminder-tab" type="button" aria-expanded="false" aria-controls="fdhAccountReminderPanel">
        <span class="fdh-account-reminder-icon" aria-hidden="true">✦</span>
        <span></span>
      </button>
      <section class="fdh-account-reminder-panel" id="fdhAccountReminderPanel" hidden aria-label="Account reminder">
        <button class="fdh-account-reminder-close" type="button" aria-label=""></button>
        <span class="fdh-account-reminder-kicker">FLAME DRAGON HUB</span>
        <h2></h2>
        <p></p>
        <div class="fdh-account-reminder-actions">
          <button class="fdh-account-reminder-yes" type="button"></button>
          <button class="fdh-account-reminder-no" type="button"></button>
        </div>
      </section>`;
    document.body.appendChild(widget);
    const tab=widget.querySelector(".fdh-account-reminder-tab");
    const panel=widget.querySelector(".fdh-account-reminder-panel");
    tab.querySelector("span:last-child").textContent=text.tab;
    panel.querySelector("h2").textContent=text.question;
    panel.querySelector("p").textContent=text.desc;
    const yes=widget.querySelector(".fdh-account-reminder-yes");
    const no=widget.querySelector(".fdh-account-reminder-no");
    const closeButton=widget.querySelector(".fdh-account-reminder-close");
    yes.textContent=text.yes;no.textContent=text.no;closeButton.textContent="×";
    closeButton.setAttribute("aria-label",text.close);
    const close=()=>{panel.hidden=true;tab.setAttribute("aria-expanded","false");};
    tab.addEventListener("click",()=>{
      const open=panel.hidden;
      panel.hidden=!open;
      tab.setAttribute("aria-expanded",String(open));
    });
    closeButton.addEventListener("click",close);
    yes.addEventListener("click",()=>{
      try{sessionStorage.setItem("fdhAccountPromptDismissed","1");}catch(_){}
      widget.classList.add("is-dismissed");
      window.setTimeout(()=>widget.remove(),420);
    });
    no.addEventListener("click",()=>{window.location.href=isHome?"account.html#createAccount":"account.html#account";});
    if(isHome) yes.addEventListener("click",()=>{window.location.href="account.html#authEmail";});
    document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!panel.hidden)close();});
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
    const selector="main .hub-card,main .evolution-card,main .guide-card,main .skin-card,main .welcome-card,main .signin-step,main .fav-card,main .panel,main .settings-card,.account-profile-card,.account-card,.contact-layout > *";
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
      span.style.setProperty("--fdh-word-delay",Math.min(n*120,960)+"ms");
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
    const selector="main > section,main > article,main .hub-card,main .evolution-card,main .guide-card,main .skin-card,main .welcome-card,main .signin-step,main .fav-card,main .panel,main .settings-card,main .account-profile-card,main .account-card,.contact-layout > *";
    const items=[...document.querySelectorAll(selector)];
    items.forEach((el,i)=>{
      if(el.closest("form,.auth-card,.login-card,.contact-form-card,.no-motion,.fdh-global-footer")||el.matches("form")||el.classList.contains("fdh-reveal"))return;
      el.classList.add("fdh-reveal");
      el.style.setProperty("--fdh-delay",Math.min((i%4)*140,420)+"ms");
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
    addAccountReminder();
    addMarqueeHoverSlowdown();
    if(typeof addBonusPanel==="function")addBonusPanel();
    addReveal();
    addPointerTilt();
    addDragonAtmosphere();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();