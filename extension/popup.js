
const FDH_API_KEY="AIzaSyDhj1G--S8S2oqQxoi1PkPvI4Msmw_klq0";
const authPanel=$("authPanel"),appShell=$("appShell"),authForm=$("extensionAuthForm"),authStatus=$("authStatus"),authEmail=$("authEmail"),authPassword=$("authPassword");
const AUTH_KEYS=["fdhAuthIdToken","fdhAuthRefreshToken","fdhAuthExpiresAt","fdhAuthEmail"];
function showAuthMessage(message){authStatus.textContent=message;}
function showExtensionApp(email){authPanel.hidden=true;appShell.hidden=false;$("signedInEmail").textContent=email||"Signed in";}
function showExtensionLogin(message){appShell.hidden=true;authPanel.hidden=false;if(message)showAuthMessage(message);}
function authMessage(error){const code=error&&error.error&&error.error.message||"";const map={EMAIL_NOT_FOUND:"No account found with this email.",INVALID_PASSWORD:"Email or password is incorrect.",INVALID_LOGIN_CREDENTIALS:"Email or password is incorrect.",USER_DISABLED:"This account has been disabled.",EMAIL_EXISTS:"This email already has an account. Sign in instead.",WEAK_PASSWORD:"Choose a stronger password (at least 6 characters).",INVALID_EMAIL:"Enter a valid email address.",TOO_MANY_ATTEMPTS_TRY_LATER:"Too many attempts. Please wait and try again."};return map[code]||"Could not complete the request. Check your details and try again.";}
async function firebaseAuthRequest(endpoint,payload){const response=await fetch("https://identitytoolkit.googleapis.com/v1/"+endpoint+"?key="+FDH_API_KEY,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok)throw data;return data;}
async function saveAuthSession(data){await chrome.storage.local.set({fdhAuthIdToken:data.idToken,fdhAuthRefreshToken:data.refreshToken,fdhAuthExpiresAt:Date.now()+Number(data.expiresIn||3600)*1000,fdhAuthEmail:data.email||""});showExtensionApp(data.email);}
async function refreshAuthSession(session){const response=await fetch("https://securetoken.googleapis.com/v1/token?key="+FDH_API_KEY,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"refresh_token",refresh_token:session.fdhAuthRefreshToken})});const data=await response.json();if(!response.ok)throw data;await saveAuthSession({idToken:data.id_token,refreshToken:data.refresh_token,expiresIn:data.expires_in,email:session.fdhAuthEmail});}
authForm.addEventListener("submit",async event=>{event.preventDefault();$("signInBtn").disabled=true;showAuthMessage("Signing in...");try{const data=await firebaseAuthRequest("accounts:signInWithPassword",{email:authEmail.value.trim(),password:authPassword.value,returnSecureToken:true});await saveAuthSession(data);authPassword.value="";}catch(error){showAuthMessage(authMessage(error));}finally{$("signInBtn").disabled=false;}});
$("createAccountBtn").addEventListener("click",async()=>{if(!authForm.reportValidity())return;showAuthMessage("Creating your account...");try{const data=await firebaseAuthRequest("accounts:signUp",{email:authEmail.value.trim(),password:authPassword.value,returnSecureToken:true});await firebaseAuthRequest("accounts:sendOobCode",{requestType:"VERIFY_EMAIL",idToken:data.idToken});await saveAuthSession(data);authPassword.value="";showAuthMessage("Account created. Check your email to verify it.");}catch(error){showAuthMessage(authMessage(error));}});
$("forgotPasswordBtn").addEventListener("click",async()=>{const email=authEmail.value.trim();if(!email){showAuthMessage("Enter your email address first.");authEmail.focus();return;}showAuthMessage("Sending password reset email...");try{await firebaseAuthRequest("accounts:sendOobCode",{requestType:"PASSWORD_RESET",email:email});showAuthMessage("If this account exists, a password reset email has been sent.");}catch(error){showAuthMessage(authMessage(error));}});
$("signOutBtn").addEventListener("click",async()=>{await chrome.storage.local.remove(AUTH_KEYS);showExtensionLogin("You have signed out.");});
(async function initializeExtensionAuth(){try{const session=await chrome.storage.local.get(AUTH_KEYS);if(!session.fdhAuthRefreshToken){showExtensionLogin();return;}if(session.fdhAuthExpiresAt>Date.now()+60000){showExtensionApp(session.fdhAuthEmail);return;}await refreshAuthSession(session);}catch(error){await chrome.storage.local.remove(AUTH_KEYS);showExtensionLogin("Your session expired. Please sign in again.");}})();


const $ = id => document.getElementById(id);

const folders = {
  "ghostly-reaper": [
    "angry.png","astronaut.png","chain.png","coconut.png","crybaby.png",
    "cultist.png","cute.png","cyborg.png","demonic.png","dragon lord.png",
    "fallen knight.png","king justice.png","kitty.png","ladybug.png",
    "laser.png","leprechaun.png","mafioso.png","mummy.png","nightmare.png",
    "pirate.png","policeman.png","samurai.png","shadow.png",
    "soul divider.png","standard.png"
  ],
  "grim-reaper": [
    "alien.png","archangel.png","archangel.webp","assasin.png","avocado.png",
    "aztec.png","barbarianReaper.webp","basilic.webp","bear.png","bee.png",
    "biohazard.png","black.png","bony.png","boss-old.png","boss.png",
    "botAi.png","bunny.png","cactus.png","captain.png","caveman.png",
    "clownPierce.webp","cow.png","cowboy.png","cryptlord.png","cultist.png",
    "cyber.png","cyborg.png","cyclops.png","darkgladiator.png","dinosaur.png",
    "doctor.png","dragon lord.png","easter.png","emeraldgolem.png",
    "evilsamurai.png","faceless.png","fallen night.png","farmer.png",
    "frosty.png","goblin.png","goldenKnight.png","grassgrower.png","green.png",
    "gryphon.webp","gryphone.png","headless.png","heart.png","horn.png",
    "imperial.png","imperialDestroyer.png","infernalbaron.png",
    "infernalblacksmith.png","jester.png","king.webp","kraken.png",
    "kraken.webp","laser.png","leopard.png","leprechuan.png",
    "magmaReaper.webp","maskednight.png","mechaminotaur.png",
    "mechaMinotaur.webp","miner.png","moaReaper.webp","mouseReaper.webp",
    "mummy.png","mysterious.png","nebula.png","neko.png","night.png",
    "nightmare.png","ninga.png","orange.png","owl.png","pharaoh.png","pig.png",
    "pineapple.png","pirate.png","pixelvoices.png","policeman.png",
    "prehistoric.png","premuim.png","primitivewarrior.png","purple.png",
    "puzzle.png","ragged.png","rainbow.png","rainbow.webp","raven.png",
    "red.png","retro.png","retroKnight.png","robberReaper.webp","rockstar.png",
    "sakuraOniReaper.webp","samurai.png","samurai.webp","santa.png",
    "shamanReaper.webp","shark.png","sheep.png","skullwarrior.png","soldier.png",
    "split face.png","star.png","steampunk.png","swamp.png",
    "thumb_ladyhell.webp","thumb_pharaoh.webp","thunderbolt.png","tiger.png",
    "toxicreaper.png","tree.png","twinbladeEvil.png","unicorn.png",
    "valentines2022.png","valkyire.png","vampire.png","viking.png","voidEye.png",
    "watermelon.png","whisperer.png","wizard.png","X4PqpkR.png","zeus.webp",
    "Zombie.png"
  ],
  "pumpkin-ghost": [
    "anarchess.png","bomb.png","chef.png","cool.png","cultist.png","cyborg.png",
    "darkmatter.png","demonic.png","dragon Lord.png","fallen knigt.png",
    "farmer.png","frosty.png","ghostly.png","headless.png","hooded.png",
    "jungle.png","knight.png","laser.png","leprechaun.png","mummy.png",
    "nightmare.png","ninja.png","owl.png","pirate.png","pirate_2.png",
    "policeman.png","rebellious.png","robber.png","samurai.png",
    "split face.png","standard.png","waiter.png"
  ]
};

let currentFolder = "ghostly-reaper";
let selectedTarget = "";
let customImage = "";
let savedCustom = null;

const grid = $("skinGrid");
const search = $("search");
const libraryStatus = $("libraryStatus");
const targetPreview = $("targetPreview");
const targetName = $("targetName");
const replaceStatus = $("replaceStatus");
const customPreview = $("customPreview");
const customMsg = $("customMsg");

function imagePath(folder, filename) {
  return `skins/${folder}/${encodeURIComponent(filename)}`;
}

function niceFolder(folder) {
  return ({
    "ghostly-reaper": "Ghostly Reaper",
    "grim-reaper": "Grim Reaper",
    "pumpkin-ghost": "Pumpkin Ghost"
  })[folder] || folder;
}

function getSkinName(key) {
  if (!key) return "";
  const parts = key.split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : key;
}

function updateSelectedPreview() {
  if (!selectedTarget) {
    targetPreview.hidden = true;
    targetPreview.removeAttribute("src");
    targetName.textContent = "No skin selected";
    replaceStatus.textContent = "Choose a skin from the gallery.";
    return;
  }

  const parts = selectedTarget.split("/");
  const folder = parts.shift();
  const filename = parts.join("/");

  targetPreview.src = imagePath(folder, filename);
  targetPreview.hidden = false;
  targetName.textContent = getSkinName(selectedTarget);
  replaceStatus.textContent = `Selected from ${niceFolder(folder)}`;
}

function selectTarget(key) {
  selectedTarget = key;
  updateSelectedPreview();
  renderLibrary();

  chrome.storage.local.set({ fdhSelectedTarget: selectedTarget })
    .catch(() => {
      replaceStatus.textContent = "Selected for this session; saving failed.";
    });
}

function renderLibrary() {
  if (!grid) return;

  const query = search.value.trim().toLowerCase();
  const names = folders[currentFolder] || [];
  const filtered = names.filter(name => name.toLowerCase().includes(query));

  grid.replaceChildren();

  for (const name of filtered) {
    const key = `${currentFolder}/${name}`;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "skin" + (selectedTarget === key ? " selected" : "");
    card.setAttribute("aria-label", `Select ${name}`);

    const img = document.createElement("img");
    img.src = imagePath(currentFolder, name);
    img.alt = name;
    img.loading = "lazy";
    img.onerror = () => {
      img.hidden = true;
    };

    const label = document.createElement("span");
    label.textContent = name;

    card.append(img, label);

    card.addEventListener("mouseenter", () => {
      targetPreview.src = imagePath(currentFolder, name);
      targetPreview.hidden = false;
      targetName.textContent = name;
      replaceStatus.textContent = "Preview · click to select this original skin";
    });

    card.addEventListener("focus", () => {
      targetPreview.src = imagePath(currentFolder, name);
      targetPreview.hidden = false;
      targetName.textContent = name;
      replaceStatus.textContent = "Preview · press Enter to select";
    });

    card.addEventListener("click", () => selectTarget(key));
    grid.appendChild(card);
  }

  libraryStatus.textContent =
    `${filtered.length} skins shown · ${names.length} in ${niceFolder(currentFolder)}`;
}

document.querySelectorAll("[data-folder]").forEach(button => {
  button.addEventListener("click", () => {
    currentFolder = button.dataset.folder;

    document.querySelectorAll("[data-folder]").forEach(tab => {
      tab.classList.toggle("active", tab === button);
    });

    search.value = "";
    renderLibrary();
  });
});

search.addEventListener("input", renderLibrary);

$("customFile").addEventListener("change", () => {
  const file = $("customFile").files?.[0];
  if (!file) return;

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    customMsg.textContent = "Choose PNG, JPG, or WebP.";
    $("customFile").value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    customImage = String(reader.result || "");
    customPreview.src = customImage;
    customPreview.hidden = false;
    customMsg.textContent = "Image ready. Choose the original skin, then save.";
  };

  reader.onerror = () => {
    customMsg.textContent = "Could not read this image.";
  };

  reader.readAsDataURL(file);
});

$("saveCustom").addEventListener("click", async () => {
  if (!customImage) {
    customMsg.textContent = "Choose your image first.";
    return;
  }

  if (!selectedTarget) {
    customMsg.textContent = "Select an original skin from the gallery first.";
    return;
  }

  try {
    const skin = {
      name: $("customFile").files?.[0]?.name || savedCustom?.name || "Custom skin",
      image: customImage,
      target: selectedTarget
    };

    await chrome.storage.local.set({ fdhCustomSkin: skin });
    savedCustom = skin;
    customMsg.textContent = `Saved for ${getSkinName(selectedTarget)}.`;
  } catch {
    customMsg.textContent = "Could not save. Try a smaller image.";
  }
});

$("removeCustom").addEventListener("click", async () => {
  try {
    await chrome.storage.local.remove("fdhCustomSkin");
    $("customFile").value = "";
    customImage = "";
    savedCustom = null;
    customPreview.hidden = true;
    customPreview.removeAttribute("src");
    customMsg.textContent = "Custom skin removed.";
  } catch {
    customMsg.textContent = "Could not remove the saved skin.";
  }
});

$("file").addEventListener("change", async () => {
  const file = $("file").files?.[0];
  if (!file) return;

  try {
    const bundle = JSON.parse(await file.text());

    if (
      bundle.format !== "flame-dragon-skin" ||
      typeof bundle.image !== "string" ||
      !bundle.image.startsWith("data:image/")
    ) {
      throw new Error("Choose a valid Skin Studio JSON bundle.");
    }

    await chrome.storage.local.set({ skinBundle: bundle });
    showBundle(bundle);
  } catch (error) {
    $("msg").textContent = error.message || "Could not import this bundle.";
  }
});

function showBundle(bundle) {
  if (!bundle) {
    $("msg").textContent = "No bundle loaded";
    $("preview").hidden = true;
    $("preview").removeAttribute("src");
    $("skinName").textContent = "";
    return;
  }

  $("msg").textContent = "Bundle loaded";
  $("preview").src = bundle.image;
  $("preview").hidden = false;
  $("skinName").textContent =
    `${bundle.name || "Custom skin"} · ${bundle.body || "Custom body"}`;
}

$("clear").addEventListener("click", async () => {
  await chrome.storage.local.remove("skinBundle");
  showBundle(null);
});

chrome.storage.local.get(
  ["skinBundle", "fdhCustomSkin", "fdhSelectedTarget"],
  result => {
    selectedTarget = result.fdhSelectedTarget || "";
    savedCustom = result.fdhCustomSkin || null;

    if (savedCustom?.image) {
      customImage = savedCustom.image;
      customPreview.src = customImage;
      customPreview.hidden = false;
      customMsg.textContent = `Saved image: ${savedCustom.name || "Custom skin"}`;
    }

    showBundle(result.skinBundle);
    updateSelectedPreview();
    renderLibrary();
  }
);
