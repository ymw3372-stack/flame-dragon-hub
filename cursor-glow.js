(() => {
  if (window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(glow);
  let raf = 0, x = -300, y = -300;
  window.addEventListener('mousemove', (event) => {
    x = event.clientX;
    y = event.clientY;
    document.body.classList.add('pointer-glow-active');
    if (!raf) raf = requestAnimationFrame(() => {
      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;
      raf = 0;
    });
  }, { passive: true });
  document.addEventListener('mouseleave', () => document.body.classList.remove('pointer-glow-active'));
  document.addEventListener('mouseenter', () => document.body.classList.add('pointer-glow-active'));
})();
