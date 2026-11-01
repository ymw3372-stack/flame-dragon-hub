(() => {
  if (window.__dragonGhostLoaded) return;
  window.__dragonGhostLoaded = true;
  const mascot = '<div class="ghost" aria-hidden="true"><div class="ghost-body"></div><i class="ghost-eye left"></i><i class="ghost-eye right"></i><i class="ghost-mouth"></i><div class="ghost-wand"></div><div class="ghost-buddy"><div class="ghost-body"></div><i class="ghost-eye left"></i><i class="ghost-eye right"></i><i class="ghost-mouth"></i></div><span class="buddy-caption">YOU LISTEN</span></div>';
  const root = document.createElement("div");
  root.id = "dragonGhostRoot";
  root.innerHTML = '<section id="dragonGhostPanel" role="dialog" aria-label="Dragon Ghost Assistant" aria-modal="false"><header class="dg-head"><div class="dg-head-mascot">'+mascot+'</div><div class="dg-head-copy"><strong>DRAGON GHOST</strong><small>Your FLAME DRAGON HUB helper</small></div><button class="dg-close" type="button" aria-label="Close chat">×</button></header><div class="dg-messages" id="dgMessages" aria-live="polite"><div class="dg-message bot">Hey! 👻🔥 I’m Dragon Ghost. Ask me about accounts, EvoWorld evolutions, skins, favorites, or installing the extension.</div></div><div class="dg-quick"><button type="button" data-question="How do I create an account and verify my email?">Account help</button><button type="button" data-question="How do I install the Chrome extension?">Install extension</button><button type="button" data-question="How do I find evolutions and skins?">Evolutions & skins</button></div><form class="dg-compose" id="dgForm"><input id="dgInput" maxlength="1200" autocomplete="off" placeholder="Ask Dragon Ghost..." aria-label="Your question"><button type="submit" aria-label="Send message">➤</button></form><div class="dg-privacy">Don’t share passwords, verification codes, or private information.</div></section><button id="dragonGhostLauncher" type="button" aria-label="Open Dragon Ghost Assistant"><div class="dg-mini-ghost">'+mascot+'</div><span class="dg-launch-label">ASK ME</span></button>';
  document.body.appendChild(root);
  const panel=root.querySelector("#dragonGhostPanel"), launcher=root.querySelector("#dragonGhostLauncher"), close=root.querySelector(".dg-close"), messages=root.querySelector("#dgMessages"), form=root.querySelector("#dgForm"), input=root.querySelector("#dgInput"), send=form.querySelector("button");
  let history=[];
  const page=location.pathname.split("/").pop()||"index.html";
  const pageContext="Current page: "+page+". Site: FLAME DRAGON HUB, an unofficial EvoWorld companion. Main pages: Home, Evolutions, Skins, Favorites, Account, Profile, Settings, New Player Guide, Installation Guide.";
  function addMessage(text,role){const el=document.createElement("div");el.className="dg-message "+role;el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight;return el;}
  function localAnswer(q){
    const s=q.toLowerCase();
    if(/account|sign.?in|login|log in|google|password|verify|verification|email|حساب|تسجيل|دخول|كلمه|كلمة|بريد|تحقق/.test(s))return "For an existing account, use the same method you registered with: email + password, or Continue with Google. For a new email account, choose Create account, open the verification link sent to your inbox, then return to Account. Check Spam/Junk too. Never share your password or verification link with me. Open Account: account.html";
    if(/install|extension|chrome|zip|اضاف|تثبيت|تنزيل|كروم/.test(s))return "Open the Installation Guide from Home. Download the ZIP, extract it, then follow the illustrated Chrome steps in the guide. I can walk you through each step. Open the guide: install-guide.html";
    if(/evolution|level|evo|تطور|ليفيل|مستوى/.test(s))return "Open Evolutions from the main navigation to browse the EvoWorld progression from Fly through Grim Reaper. Open: evolutions.html";
    if(/skin|reaper|ghost|pumpkin|سكن|اسكن/.test(s))return "Open Skins to browse the available collections, including Grim Reaper, Ghostly Reaper, and Pumpkin Ghost. Open: skins.html";
    if(/favorite|مفضل/.test(s))return "Use the Favorites page to view the items you saved. Open: favorites.html";
    if(/profile|اسم|صوره|صورة/.test(s))return "Your Profile page lets you view and update your player profile. Open: profile.html";
    if(/setting|theme|mobile|performance|اعداد|إعداد/.test(s))return "Open Settings to customize your site experience and preferences. Open: settings.html";
    return "I can help with FLAME DRAGON HUB accounts, email verification, Google sign-in, Chrome installation, EvoWorld evolutions, skins, favorites, profile, and settings. Tell me which part you’re stuck on, and please don’t send passwords or verification codes.";
  }
  async function ask(question){
    addMessage(question,"user");history.push({role:"user",content:question});input.value="";send.disabled=true;
    const typing=addMessage("Dragon Ghost is thinking…","bot");
    try{
      const response=await fetch("/api/dragon-ghost",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:history.slice(-8),pageContext})});
      if(!response.ok)throw new Error("Assistant endpoint unavailable");
      const data=await response.json();const answer=String(data.response||data.answer||"").trim();
      if(!answer)throw new Error("Empty assistant response");
      typing.textContent=answer;history.push({role:"assistant",content:answer});
    }catch(error){
      typing.textContent=localAnswer(question)+"\n\n(Quick help mode — the AI connection will be enabled after the site’s Cloudflare AI binding is configured.)";
    }finally{send.disabled=false;input.focus();messages.scrollTop=messages.scrollHeight;}
  }
  launcher.addEventListener("click",()=>{panel.classList.toggle("open");if(panel.classList.contains("open"))input.focus();});
  close.addEventListener("click",()=>panel.classList.remove("open"));
  form.addEventListener("submit",e=>{e.preventDefault();const q=input.value.trim();if(q)ask(q);});
  root.querySelectorAll("[data-question]").forEach(b=>b.addEventListener("click",()=>ask(b.dataset.question)));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")panel.classList.remove("open");});
})();