(() => {
const L={
en:{dir:"ltr",nav:["Home","Evolutions","Skins Library","Favorites","Settings"],guide:"INSTALL GUIDE",login:"SIGN IN",account:"Your Account",desc:"Manage your player profile, profile photo, and sign-in details in one place.",link:"YOUR ACCOUNT",settings:"Settings"},
ar:{dir:"rtl",nav:["الرئيسية","التطورات","مكتبة السكنات","المفضلة","الإعدادات"],guide:"دليل التثبيت",login:"تسجيل الدخول",account:"حسابك",desc:"إدارة ملف اللاعب والصورة وبيانات تسجيل الدخول من مكان واحد.",link:"حسابك",settings:"الإعدادات"},
de:{dir:"ltr",nav:["Startseite","Entwicklungen","Skin-Bibliothek","Favoriten","Einstellungen"],guide:"INSTALLATIONSANLEITUNG",login:"ANMELDEN",account:"Dein Konto",desc:"Verwalte dein Spielerprofil, Profilbild und deine Anmeldedaten an einem Ort.",link:"DEIN KONTO",settings:"Einstellungen"},
ru:{dir:"ltr",nav:["Главная","Эволюции","Библиотека скинов","Избранное","Настройки"],guide:"РУКОВОДСТВО",login:"ВОЙТИ",account:"Ваш аккаунт",desc:"Управляйте профилем игрока, фото и данными для входа в одном месте.",link:"ВАШ АККАУНТ",settings:"Настройки"},
hi:{dir:"ltr",nav:["होम","विकास","स्किन लाइब्रेरी","पसंदीदा","सेटिंग्स"],guide:"इंस्टॉल गाइड",login:"साइन इन",account:"आपका खाता",desc:"अपनी खिलाड़ी प्रोफ़ाइल, फ़ोटो और साइन-इन विवरण एक जगह प्रबंधित करें।",link:"आपका खाता",settings:"सेटिंग्स"},
es:{dir:"ltr",nav:["Inicio","Evoluciones","Biblioteca de skins","Favoritos","Ajustes"],guide:"GUÍA DE INSTALACIÓN",login:"INICIAR SESIÓN",account:"Tu cuenta",desc:"Administra tu perfil de jugador, foto y datos de acceso en un solo lugar.",link:"TU CUENTA",settings:"Ajustes"},tr:{dir:"ltr",nav:["Ana Sayfa","Evrimler","Kostüm Kütüphanesi","Favoriler","Ayarlar"],guide:"KURULUM REHBERİ",login:"GİRİŞ YAP",account:"Hesabın",desc:"Oyuncu profilini, profil fotoğrafını ve giriş bilgilerini tek bir yerden yönet.",link:"HESABIN",settings:"Ayarlar"}};
const K="flameDragonLanguage";const current=()=>L[localStorage.getItem(K)]?localStorage.getItem(K):"en";
const isHome=location.pathname.endsWith("/")||location.pathname.endsWith("/index.html")||location.pathname==="";
if(isHome){
const css=document.createElement("style");css.textContent=`.install-guide-callout{display:none!important}#fdh-quick-tools{position:relative;z-index:20;width:min(760px,calc(100% - 32px));margin:22px auto 42px;padding:18px;display:grid;grid-template-columns:1fr 1fr;gap:12px;border:1px solid rgba(255,105,120,.35);border-radius:18px;background:linear-gradient(125deg,rgba(38,18,31,.94),rgba(20,20,35,.94));box-shadow:0 14px 36px #0005,0 0 25px #ff465710;backdrop-filter:blur(12px)}.fdh-quick-btn,.fdh-language{min-height:54px;padding:11px 15px;display:flex;align-items:center;justify-content:center;gap:10px;border-radius:12px;text-decoration:none;font:900 12px Arial,sans-serif;letter-spacing:.55px;box-shadow:0 6px 18px #0004;transition:transform .2s,filter .2s}.fdh-quick-btn:hover{transform:translateY(-3px);filter:brightness(1.15)}.fdh-guide{color:white;border:1px solid #ff8997;background:linear-gradient(110deg,#d83250,#8d2449)}.fdh-login{color:#ffe9ae;border:1px solid #e2bd65;background:linear-gradient(110deg,#79571c,#493116)}.fdh-language{grid-column:1/-1;min-height:48px;justify-content:flex-start;border:1px solid #ffffff30;background:#17111dcc;color:#fff}.fdh-language select{flex:1;min-width:0;border:0;outline:0;background:transparent;color:inherit;font:700 13px Arial,sans-serif;cursor:pointer}.fdh-language option{color:#17111d;background:white}.fdh-quick-caption{grid-column:1/-1;margin:0;text-align:center;color:#cbbecb;font:500 12px/1.6 Arial,sans-serif}.fdh-language-label{font:800 11px Arial,sans-serif;color:#e8c15d;letter-spacing:1px}@media(max-width:520px){#fdh-quick-tools{grid-template-columns:1fr;margin:16px auto 30px;padding:13px}.fdh-language{grid-column:auto}.fdh-quick-btn{min-height:49px}}body.fdh-account-focus .account-settings-card{position:relative;border:2px solid #e8c15d!important;box-shadow:0 0 0 6px #e8c15d30,0 0 34px #e8b84d70!important;animation:fdhGoldPulse 1.5s ease-in-out infinite}body.fdh-account-focus .account-settings-card:before{content:"➜ CLICK HERE · YOUR ACCOUNT";position:absolute;top:-15px;right:18px;z-index:5;padding:7px 12px;border:1px solid #f4d27a;border-radius:8px;background:#3d2b17;color:#ffe7a1;font:900 10px Arial,sans-serif}@keyframes fdhGoldPulse{50%{box-shadow:0 0 0 9px #e8c15d40,0 0 40px #e8b84d90}}@media(prefers-reduced-motion:reduce){.fdh-quick-btn,body.fdh-account-focus .account-settings-card{animation:none;transition:none}}`;
document.head.appendChild(css);
const box=document.createElement("section");box.id="fdh-quick-tools";box.setAttribute("aria-label","Quick access");box.innerHTML='<a class="fdh-quick-btn fdh-guide" href="install-guide.html">⬇ <span data-fdh="guide">INSTALLATION GUIDE</span></a><a class="fdh-quick-btn fdh-login" href="settings.html?account=1">♙ <span data-fdh="login">ACCOUNT LOGIN</span></a><label class="fdh-language"><span class="fdh-language-label">🌐 SITE LANGUAGE</span><select id="fdhLanguage" aria-label="Select language"><option value="en">🇬🇧 English</option><option value="ar">🇸🇦 العربية</option><option value="de">🇩🇪 Deutsch</option><option value="ru">🇷🇺 Русский</option><option value="hi">🇮🇳 हिन्दी</option><option value="es">🇪🇸 Español</option><option value="tr">🇹🇷 Türkçe</option></select></label><p class="fdh-quick-caption">Quick access: install the extension, sign in, or choose your language.</p>';
const hero=document.querySelector("main .hero");if(hero)hero.insertAdjacentElement("afterend",box);else document.querySelector("main").prepend(box);
}
function apply(){const code=current(),t=L[code];document.documentElement.lang=code;document.documentElement.dir=t.dir;document.querySelectorAll(".nav-links a").forEach(a=>{const i=["index.html","evolutions.html","skins.html","favorites.html","settings.html"].indexOf(a.getAttribute("href"));if(i>=0)a.textContent=t.nav[i]});const guide=document.querySelector('[data-fdh="guide"]');if(guide)guide.textContent=t.guide;const login=document.querySelector('[data-fdh="login"]');if(login)login.textContent=t.login;const h=document.querySelector(".settings-hero h1");if(h)h.textContent=t.settings;const ah=document.querySelector(".account-settings-card .settings-title h2");if(ah)ah.textContent=t.account;const p=document.querySelector(".account-settings-card .settings-title p");if(p)p.textContent=t.desc;const a=document.querySelector(".account-open-button");if(a)a.textContent="♙ "+t.link;const languageControl=document.getElementById("fdhLanguage");if(languageControl)languageControl.value=code}
const langSelect=document.getElementById("fdhLanguage");if(langSelect){langSelect.value=current();langSelect.addEventListener("change",e=>{localStorage.setItem(K,e.target.value);apply()});}apply();
if(location.pathname.endsWith("settings.html")&&new URLSearchParams(location.search).get("account")==="1"){document.body.classList.add("fdh-account-focus");const card=document.querySelector(".account-settings-card");if(card)setTimeout(()=>card.scrollIntoView({behavior:"smooth",block:"center"}),180)}

/* Floating language control + direct account creation shortcut */
const dockStyle=document.createElement("style");
dockStyle.textContent=".fdh-language-dock{position:fixed;z-index:99999;left:50%;bottom:14px;transform:translateX(-50%);width:min(430px,calc(100% - 24px));padding:8px 12px;border:1px solid rgba(232,193,93,.5);border-radius:14px;background:rgba(18,13,20,.96);box-shadow:0 8px 28px #0009,0 0 18px #e8c15d25;backdrop-filter:blur(14px)}.fdh-language-dock .fdh-language{display:flex;min-height:38px;padding:4px 8px;align-items:center;gap:12px;background:transparent;border:0;box-shadow:none}.fdh-language-dock select{flex:1;min-width:0;background:#17111d;color:#fff;border:1px solid #ffffff30;border-radius:8px;padding:8px}.fdh-language-dock option{color:#17111d;background:white}body{padding-bottom:78px}#fdh-quick-tools{grid-template-columns:1fr!important;width:min(520px,calc(100% - 32px))!important;margin-left:max(4%,calc((100% - 1150px)/2))!important;margin-right:auto!important}.fdh-quick-btn{min-height:48px!important}.fdh-language-dock .fdh-language-label{color:#e8c15d;font:800 11px Arial,sans-serif;white-space:nowrap}";
document.head.appendChild(dockStyle);
const oldLanguage=document.getElementById("fdhLanguage");
if(oldLanguage){const oldLabel=oldLanguage.closest(".fdh-language");if(oldLabel)oldLabel.remove();}
const dock=document.createElement("div");dock.className="fdh-language-dock";
dock.innerHTML='<label class="fdh-language"><span class="fdh-language-label">🌐 SITE LANGUAGE</span><select id="fdhLanguage" aria-label="Select language"><option value="en">🇬🇧 English</option><option value="ar">🇸🇦 العربية</option><option value="de">🇩🇪 Deutsch</option><option value="ru">🇷🇺 Русский</option><option value="hi">🇮🇳 हिन्दी</option><option value="es">🇪🇸 Español</option><option value="tr">🇹🇷 Türkçe</option></select></label>';
document.body.appendChild(dock);
const newLanguage=document.getElementById("fdhLanguage");
newLanguage.value=current();
newLanguage.addEventListener("change",event=>{localStorage.setItem(K,event.target.value);apply();});
const accountShortcut=document.querySelector('#fdh-quick-tools .fdh-login');
if(accountShortcut){accountShortcut.href="account.html#account";accountShortcut.innerHTML='✦ <span data-fdh="login">CREATE ACCOUNT — CLICK HERE</span>';}

}

/* FLAME DRAGON YouTube welcome prompt — gentle reminders across visits */
(() => {
  const channel = "https://www.youtube.com/@FLAME.DRAGON-evoworld";
  const subscribe = channel + "?sub_confirmation=1";
  const visitKey = "fdhYtVisitCount";
  const countedKey = "fdhYtCountedThisSession";
  const nextPromptKey = "fdhYtNextPromptAt";
  const pendingWatchKey = "fdhYtPendingWatch";
  const subscribedKey = "fdhYtSubscribed";
  const lang = current();
  const copy = {
    en: {tag:"SUPPORT THE CREATOR",title:"Enjoying FLAME DRAGON HUB?",desc:"Support the project and join the FLAME DRAGON EVOWORLD community on YouTube.",sub:"SUBSCRIBE NOW",watch:"WATCH THE CHANNEL",later:"MAYBE LATER",followTitle:"So, not subscribing?",followDesc:"Did you get a chance to check out the channel? We'd love your support!",close:"Close"},
    ar: {tag:"ادعم صانع الموقع",title:"مبسوط بتجربتك في FLAME DRAGON HUB؟",desc:"ادعم المشروع وانضم لمجتمع FLAME DRAGON EVOWORLD على يوتيوب.",sub:"اشترك الآن",watch:"مشاهدة القناة",later:"الاشتراك لاحقًا",followTitle:"يعني مش هتشترك؟",followDesc:"شوفت القناة؟ يسعدنا دعمك واشتراكك في FLAME DRAGON EVOWORLD.",close:"إغلاق"},
    de: {tag:"UNTERSTÜTZE DEN CREATOR",title:"Gefällt dir FLAME DRAGON HUB?",desc:"Unterstütze das Projekt und werde Teil der FLAME DRAGON EVOWORLD-Community auf YouTube.",sub:"JETZT ABONNIEREN",watch:"KANAL ANSEHEN",later:"VIELLEICHT SPÄTER",followTitle:"Möchtest du nicht abonnieren?",followDesc:"Hast du dir den Kanal angesehen? Wir freuen uns über deine Unterstützung!",close:"Schließen"},
    ru: {tag:"ПОДДЕРЖИ АВТОРА",title:"Нравится FLAME DRAGON HUB?",desc:"Поддержи проект и присоединяйся к сообществу FLAME DRAGON EVOWORLD на YouTube.",sub:"ПОДПИСАТЬСЯ",watch:"ОТКРЫТЬ КАНАЛ",later:"ПОЗЖЕ",followTitle:"Не хочешь подписаться?",followDesc:"Удалось посмотреть канал? Будем рады твоей поддержке!",close:"Закрыть"},
    hi: {tag:"क्रिएटर का समर्थन करें",title:"क्या FLAME DRAGON HUB पसंद आया?",desc:"प्रोजेक्ट का समर्थन करें और YouTube पर FLAME DRAGON EVOWORLD समुदाय से जुड़ें।",sub:"अभी सदस्यता लें",watch:"चैनल देखें",later:"बाद में",followTitle:"क्या आप सदस्यता नहीं लेंगे?",followDesc:"क्या आपने चैनल देखा? आपका समर्थन हमारे लिए मायने रखता है।",close:"बंद करें"},
    es: {tag:"APOYA AL CREADOR",title:"¿Te gusta FLAME DRAGON HUB?",desc:"Apoya el proyecto y únete a la comunidad FLAME DRAGON EVOWORLD en YouTube.",sub:"SUSCRIBIRSE",watch:"VER EL CANAL",later:"MÁS TARDE",followTitle:"¿No te vas a suscribir?",followDesc:"¿Pudiste ver el canal? ¡Agradecemos mucho tu apoyo!",close:"Cerrar"},
    tr: {tag:"İÇERİK ÜRETİCİSİNİ DESTEKLE",title:"FLAME DRAGON HUB hoşuna gitti mi?",desc:"Projeyi destekle ve YouTube'da FLAME DRAGON EVOWORLD topluluğuna katıl.",sub:"ŞİMDİ ABONE OL",watch:"KANALI İZLE",later:"DAHA SONRA",followTitle:"Abone olmayacak mısın?",followDesc:"Kanalı inceleyebildin mi? Desteğin bizim için değerli!",close:"Kapat"}
  };
  const t = copy[lang] || copy.en;

  if (sessionStorage.getItem(countedKey) !== "1") {
    const visits = Number(localStorage.getItem(visitKey) || "0") + 1;
    localStorage.setItem(visitKey, String(visits));
    sessionStorage.setItem(countedKey, "1");
  }
  const visits = Number(localStorage.getItem(visitKey) || "1");
  const due = Number(localStorage.getItem(nextPromptKey) || "0");
  const pendingWatch = localStorage.getItem(pendingWatchKey) === "1";
  // A visitor who clicked Subscribe should never see this prompt again on this browser.
  if (localStorage.getItem(subscribedKey) === "1") return;
  if (!pendingWatch && visits < due) return;

  const style = document.createElement("style");
  style.textContent = "#fdh-yt-overlay{position:fixed;inset:0;z-index:1000000;display:grid;place-items:center;padding:18px;background:rgba(5,4,9,.78);backdrop-filter:blur(9px);animation:fdhYtFade .22s ease}#fdh-yt-modal{position:relative;isolation:isolate;overflow:hidden;width:min(490px,100%);padding:34px 26px 25px;text-align:center;border:1px solid rgba(255,103,120,.58);border-radius:23px;background:radial-gradient(ellipse at 50% 0%,rgba(185,35,63,.24),transparent 58%),linear-gradient(145deg,#24131f,#11121d 75%);box-shadow:0 25px 90px #000b,0 0 38px rgba(255,55,80,.2);color:#fff4f6;font-family:Arial,Helvetica,sans-serif}#fdh-yt-modal:before{content:'';position:absolute;z-index:-1;inset:auto 15% -110px;height:170px;border-radius:50%;background:rgba(255,45,65,.18);filter:blur(45px)}#fdh-yt-close{position:absolute;top:12px;right:13px;width:33px;height:33px;border:1px solid #ffffff25;border-radius:50%;background:#ffffff0b;color:#fff;font-size:19px;cursor:pointer}#fdh-yt-mark{width:70px;height:70px;margin:0 auto 17px;display:grid;place-items:center;border:1px solid rgba(255,110,125,.55);border-radius:21px;background:linear-gradient(145deg,#a92842,#43172d);box-shadow:0 0 28px rgba(255,55,80,.23);font-size:32px}#fdh-yt-tag{color:#ff9ba6;font-size:10px;font-weight:900;letter-spacing:2.6px}#fdh-yt-modal h2{margin:11px 0 10px;font-size:clamp(21px,5vw,27px);line-height:1.25}#fdh-yt-modal p{max-width:390px;margin:0 auto 22px;color:#c7b8c7;font-size:13px;line-height:1.8}.fdh-yt-action{width:100%;min-height:49px;margin-top:10px;padding:12px 16px;display:flex;align-items:center;justify-content:center;border-radius:12px;text-decoration:none;font:900 11px Arial,sans-serif;letter-spacing:.7px;cursor:pointer;transition:transform .18s,filter .18s}.fdh-yt-action:hover{transform:translateY(-2px);filter:brightness(1.13)}#fdh-yt-sub{border:1px solid #ff9aa5;color:#fff;background:linear-gradient(110deg,#e53952,#a71f4c);box-shadow:0 8px 23px #d52d4a40}#fdh-yt-watch{border:1px solid rgba(110,175,255,.65);color:#eaf4ff;background:linear-gradient(110deg,#183c65,#18233d)}#fdh-yt-later{border:1px solid #ffffff27;color:#c9bdc9;background:#ffffff08}@keyframes fdhYtFade{from{opacity:0}to{opacity:1}}@media(max-width:420px){#fdh-yt-modal{padding:31px 19px 21px}#fdh-yt-mark{width:62px;height:62px}}@media(prefers-reduced-motion:reduce){#fdh-yt-overlay{animation:none}.fdh-yt-action{transition:none}}";
  document.head.appendChild(style);

  const followUp = pendingWatch;
  const overlay = document.createElement("div");
  overlay.id = "fdh-yt-overlay";
  overlay.innerHTML = '<section id="fdh-yt-modal" role="dialog" aria-modal="true" aria-labelledby="fdh-yt-title" aria-describedby="fdh-yt-desc"><button id="fdh-yt-close" type="button" aria-label="' + t.close + '">×</button><div id="fdh-yt-mark" aria-hidden="true">▶</div><div id="fdh-yt-tag">' + t.tag + '</div><h2 id="fdh-yt-title">' + (followUp ? t.followTitle : t.title) + '</h2><p id="fdh-yt-desc">' + (followUp ? t.followDesc : t.desc) + '</p><a class="fdh-yt-action" id="fdh-yt-sub" href="' + subscribe + '" target="_blank" rel="noopener noreferrer">▶ &nbsp; ' + t.sub + '</a>' + (followUp ? '' : '<a class="fdh-yt-action" id="fdh-yt-watch" href="' + channel + '" target="_blank" rel="noopener noreferrer">▣ &nbsp; ' + t.watch + '</a>') + '<button class="fdh-yt-action" id="fdh-yt-later" type="button">' + t.later + '</button></section>';
  document.body.appendChild(overlay);

  function dismiss() {
    overlay.remove();
    style.remove();
  }
  function chooseLater() {
    localStorage.removeItem(pendingWatchKey);
    localStorage.setItem(nextPromptKey, String(visits + 3));
    dismiss();
  }
  overlay.querySelector("#fdh-yt-close").addEventListener("click", chooseLater);
  overlay.querySelector("#fdh-yt-later").addEventListener("click", chooseLater);
  overlay.querySelector("#fdh-yt-sub").addEventListener("click", () => {
    localStorage.setItem(subscribedKey, "1");
    localStorage.removeItem(pendingWatchKey);
    localStorage.removeItem(nextPromptKey);
    dismiss();
  });
  const watchButton = overlay.querySelector("#fdh-yt-watch");
  if (watchButton) {
    watchButton.addEventListener("click", () => {
      localStorage.setItem(pendingWatchKey, "1");
      dismiss();
      let leftForChannel = false;
      document.addEventListener("visibilitychange", function returnFromChannel() {
        if (document.hidden) {
          leftForChannel = true;
        } else if (leftForChannel && localStorage.getItem(pendingWatchKey) === "1") {
          document.removeEventListener("visibilitychange", returnFromChannel);
          location.reload();
        }
      });
    });
  }
  overlay.addEventListener("click", event => {
    if (event.target === overlay) chooseLater();
  });
  document.addEventListener("keydown", function onEscape(event) {
    if (event.key === "Escape" && document.getElementById("fdh-yt-overlay")) {
      chooseLater();
      document.removeEventListener("keydown", onEscape);
    }
  });
})();

})();

})();
