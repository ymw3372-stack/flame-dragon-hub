/* FLAME DRAGON HUB — pointer glow + card tilt.
   A soft halo trails the cursor, and every card leans toward the pointer
   (edges lean most, the middle stays flat). Fine pointers only. */
(() => {
  const fine = !window.matchMedia("(hover: none)").matches &&
    !window.matchMedia("(pointer: coarse)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine) return;

  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);

  let raf = 0;
  let x = -300;
  let y = -300;

  const paint = () => {
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    raf = 0;
  };

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType && event.pointerType !== "mouse") return;
    x = event.clientX;
    y = event.clientY;
    document.body.classList.add("pointer-glow-active");
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });

  document.addEventListener("pointerleave", () => {
    document.body.classList.remove("pointer-glow-active");
  });
  document.addEventListener("pointerenter", () => {
    document.body.classList.add("pointer-glow-active");
  });

  const CARD_SELECTOR =
    "main .evolution-card,main .skin-card,main .vault-card,main .hub-card," +
    "main .orbit-card,main .guide-card,main .welcome-card,main .fav-card," +
    "main .tp-card," +
    "main .panel,main .settings-card,main .about-card,main .dev-card," +
    "main .profile-card,main .signin-step,.account-profile-card," +
    ".account-card,.contact-layout > *";

  const MAX = 7; // degrees at the far edge — gentle lean, stays readable

  // Cards holding a video/iframe are skipped: the embedded document swallows
  // pointermove, so the card would freeze mid-lean and never straighten out.
  const HOLDS_EMBED = "iframe, video, embed, object";

  const wired = new Set();

  const reset = (card) => {
    card.style.setProperty("--fdh-tilt-x", "0deg");
    card.style.setProperty("--fdh-tilt-y", "0deg");
  };

  const wire = (card) => {
    if (wired.has(card)) return;
    if (card.querySelector(HOLDS_EMBED)) return;
    wired.add(card);
    card.classList.add("fdh-tilt");
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = (event.clientX - rect.left) / rect.width - 0.5;  // -0.5 .. 0.5
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--fdh-tilt-y", (nx * MAX * 2).toFixed(2) + "deg");
      card.style.setProperty("--fdh-tilt-x", (-ny * MAX * 2).toFixed(2) + "deg");
      card.style.setProperty("--fdh-mx", ((nx + 0.5) * 100).toFixed(1) + "%");
      card.style.setProperty("--fdh-my", ((ny + 0.5) * 100).toFixed(1) + "%");
    }, { passive: true });
    card.addEventListener("pointerleave", () => reset(card), { passive: true });
    card.addEventListener("pointercancel", () => reset(card), { passive: true });
  };

  // Safety net: if focus or the pointer is handed away mid-lean, flatten every
  // card so nothing is left stuck at an angle.
  const flattenAll = () => wired.forEach(reset);
  window.addEventListener("blur", flattenAll);
  document.addEventListener("pointerleave", flattenAll);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flattenAll();
  });

  const spotlight = () => document.querySelectorAll(CARD_SELECTOR).forEach(wire);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", spotlight, { once: true });
  } else {
    spotlight();
  }
  window.addEventListener("load", spotlight);

  // Skin and favourite grids build their cards in JavaScript after load.
  let pending = 0;
  const schedule = () => {
    if (pending) return;
    pending = requestAnimationFrame(() => { pending = 0; spotlight(); });
  };
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.addedNodes.length) { schedule(); return; }
    }
  });
  const startObserver = () => {
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) startObserver();
  else document.addEventListener("DOMContentLoaded", startObserver, { once: true });
})();
