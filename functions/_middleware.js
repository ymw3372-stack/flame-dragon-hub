// Temporary site-wide maintenance mode for FLAME DRAGON HUB.
// Revert this file to restore the original pages. Static assets and API requests
// continue to work; only browser HTML page navigations receive the maintenance screen.
export async function onRequest(context) {
  const { request, next } = context;
  const method = request.method.toUpperCase();
  const acceptsHtml = (request.headers.get("Accept") || "").toLowerCase().includes("text/html");

  if ((method !== "GET" && method !== "HEAD") || !acceptsHtml) {
    return next();
  }

  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith("/api/")) {
    return next();
  }

  const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="theme-color" content="#100b10">
  <title>FLAME DRAGON HUB — Maintenance</title>
  <style>
    :root { color-scheme: dark; --red:#ff4657; --muted:#c5b8c2; }
    * { box-sizing:border-box; }
    body {
      margin:0; min-height:100vh; display:grid; place-items:center; padding:24px;
      font-family:Arial,Helvetica,sans-serif; color:#fff4f6;
      background:radial-gradient(ellipse at 50% 38%,rgba(160,25,48,.28),transparent 48%),#100b10;
    }
    main {
      width:min(680px,100%); text-align:center; padding:clamp(28px,6vw,54px);
      border:1px solid rgba(255,90,110,.28); border-radius:24px;
      background:rgba(29,20,31,.88); box-shadow:0 20px 80px rgba(0,0,0,.4),0 0 40px rgba(255,55,80,.08);
    }
    .mark { font-size:clamp(38px,8vw,64px); line-height:1; margin-bottom:22px; filter:drop-shadow(0 0 18px rgba(255,65,85,.45)); }
    .brand { font-size:clamp(21px,4vw,30px); font-weight:900; letter-spacing:1.5px; }
    .brand span { color:var(--red); }
    .tag { margin:18px 0 10px; color:#ff9aa4; font-size:12px; font-weight:800; letter-spacing:4px; text-transform:uppercase; }
    h1 { margin:0; font-size:clamp(25px,5vw,38px); }
    p { color:var(--muted); font-size:15px; line-height:1.9; margin:16px auto 0; max-width:520px; }
    .ar { direction:rtl; font-size:16px; margin-top:22px; color:#fff0f2; }
    .line { width:72px; height:3px; border-radius:9px; margin:26px auto 0; background:linear-gradient(90deg,transparent,var(--red),transparent); }
    .foot { margin-top:24px; color:#968895; font-size:12px; letter-spacing:1px; }
  </style>
</head>
<body>
  <main>
    <div class="mark" aria-hidden="true">🐉</div>
    <div class="brand">FLAME <span>DRAGON</span> HUB</div>
    <div class="tag">Temporary Maintenance</div>
    <h1>We’ll be back soon.</h1>
    <p>We’re updating the Hub to make your experience better. The site is temporarily unavailable while we work on it. Your account and saved data are not being deleted.</p>
    <p class="ar">الموقع تحت الصيانة والتحديث حاليًا. نعمل على تحسين FLAME DRAGON HUB وسنعود قريبًا. حسابك وبياناتك المحفوظة لم يتم حذفها.</p>
    <div class="line"></div>
    <div class="foot">FLAME DRAGON HUB · YOUR EVOWORLD COMPANION</div>
  </main>
</body>
</html>`;

  return new Response(method === "HEAD" ? null : page, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow",
      "Retry-After": "3600"
    }
  });
}
