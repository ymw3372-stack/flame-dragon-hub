/* FLAME DRAGON HUB — shared motion, page transitions and footer */
(() => {
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const currentFile = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  function addFooter() {
    let footer = document.querySelector(".fdh-global-footer");
    if (!footer) {
      footer = document.querySelector("footer");
      if (!footer) {
        footer = document.createElement("footer");
        document.body.appendChild(footer);
      }
      footer.classList.add("fdh-global-footer");
    }
    if (!footer.querySelector(".fdh-footer-nav")) {
      const nav = document.createElement("div");
      nav.className = "fdh-footer-nav";
      nav.setAttribute("aria-label", "Quick links");
      const home = document.createElement("a");
      home.href = "index.html";
      home.textContent = "Back to Home";
      const separator = document.createElement("span");
      separator.className = "fdh-footer-separator";
      separator.textContent = "•";
      const contact = document.createElement("a");
      contact.href = "contact.html";
      contact.textContent = "Contact";
      nav.append(home, separator, contact);
      footer.appendChild(nav);
    }
  }

  function splitHeadingWords(heading) {
    if (heading.dataset.fdhWords || heading.closest("a,button,form,.brand,.no-motion")) return;
    const original = heading.textContent.trim();
    if (!original || original.length > 150) return;
    heading.setAttribute("aria-label", heading.getAttribute("aria-label") || original);
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      const parts = node.nodeValue.split(/(\s+)/);
      let wordIndex = 0;
      parts.forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
        } else {
          const word = document.createElement("span");
          word.className = "fdh-word";
          word.style.setProperty("--fdh-word-delay", Math.min(wordIndex * 65, 520) + "ms");
          word.textContent = part;
          fragment.appendChild(word);
          wordIndex++;
        }
      });
      node.parentNode.replaceChild(fragment, node);
    });
    heading.dataset.fdhWords = "true";
  }

  function addMotion() {
    if (reduceMotion) return;
    document.querySelectorAll("main h1, main h2, .hero h1, .contact-hero h1, .signin-hero h1").forEach(splitHeadingWords);

    const candidates = document.querySelectorAll(
      "main > section, main > article, .hub-card, .evolution-card, .guide-card, .skin-card, .welcome-card, .signin-step, .contact-layout > *, .vault-video, .download-strip, .tutorial .stage, .hero p"
    );
    let index = 0;
    candidates.forEach(element => {
      if (element.closest("form,.auth-card,.login-card,.no-motion") || element.matches("form")) return;
      if (element.classList.contains("fdh-reveal")) return;
      element.classList.add("fdh-reveal");
      element.style.setProperty("--fdh-stagger", Math.min((index % 7) * 75, 450) + "ms");
      index++;
    });

    document.querySelectorAll("main img, .guide-card img, .skin-card img, .welcome-logo").forEach(img => {
      if (!img.closest("form,.auth-card,.login-card") && !img.classList.contains("fdh-image-reveal")) {
        img.classList.add("fdh-image-reveal");
      }
    });

    const revealTargets = document.querySelectorAll(".fdh-reveal,.fdh-image-reveal");
    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach(el => el.classList.add("fdh-visible"));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fdh-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -35px 0px" });
    revealTargets.forEach(el => observer.observe(el));
  }

  function addPageTransitions() {
    if (reduceMotion) return;
    const overlay = document.createElement("div");
    overlay.className = "fdh-page-transition fdh-transition-in";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.remove("fdh-transition-in")));
    window.addEventListener("pageshow", () => overlay.classList.remove("fdh-transition-out"));

    document.addEventListener("click", event => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target === "_blank" || link.hasAttribute("download") || link.closest("form")) return;
      const raw = link.getAttribute("href");
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) return;
      let destination;
      try { destination = new URL(raw, location.href); } catch (_) { return; }
      if (destination.origin !== location.origin || destination.pathname === location.pathname && destination.search === location.search) return;
      event.preventDefault();
      overlay.classList.add("fdh-transition-out");
      window.setTimeout(() => { location.href = destination.href; }, 170);
    });
  }

  function init() {
    addFooter();
    addMotion();
    addPageTransitions();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();