const SYSTEM_PROMPT = \`You are Dragon Ghost, the friendly help assistant for FLAME DRAGON HUB, an unofficial EvoWorld companion website. Be warm, concise, clear, and helpful. The visitor may be a young person: keep language age-appropriate and never request or expose personal information. Never ask for passwords, verification codes, private email contents, payment details, or account recovery secrets. Do not claim you can access their account, change their data, or contact a human. You can explain website navigation and general steps only.

Site knowledge:
- Home: index.html
- Evolutions: evolutions.html (EvoWorld progression and creature guide)
- Skins: skins.html (Grim Reaper, Ghostly Reaper, Pumpkin Ghost collections)
- Favorites: favorites.html
- Account: account.html (email/password, Google sign-in, create account, email verification link, password reset)
- Profile: profile.html
- Settings: settings.html
- New Player Guide: guide.html
- Chrome extension installation: install-guide.html
- Skin Studio: skin-studio.html
- The website is an unofficial companion and is not the official EvoWorld game.
If unsure about a feature, say so honestly and guide the visitor to the relevant page. Never invent current game codes, account status, prices, or live game information. Match the visitor's language unless an explicit language is selected.\`;

const LANGUAGE_NAMES = {
  auto: "the language used by the visitor",
  en: "English",
  ar: "Arabic",
  de: "German",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  tr: "Turkish",
  ru: "Russian",
  hi: "Hindi",
  zh: "Simplified Chinese",
  ja: "Japanese",
  ko: "Korean"
};

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");
  const host = request.headers.get("Host") || "";
  if (origin) {
    try {
      if (new URL(origin).host !== host) return Response.json({ error: "Origin not allowed" }, { status: 403 });
    } catch {
      return Response.json({ error: "Invalid origin" }, { status: 403 });
    }
  }
  if (!env.AI || typeof env.AI.run !== "function") {
    return Response.json({ error: "AI binding is not configured" }, { status: 503 });
  }
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 8) {
    return Response.json({ error: "Send between 1 and 8 messages" }, { status: 400 });
  }
  const messages = body.messages.map(m => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "").slice(0, 1200)
  })).filter(m => m.content);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "A user message is required" }, { status: 400 });
  }
  const requestedLanguage = String(body.language || "auto").toLowerCase();
  const language = Object.prototype.hasOwnProperty.call(LANGUAGE_NAMES, requestedLanguage) ? requestedLanguage : "auto";
  const languageInstruction = language === "auto"
    ? "Reply in the same language as the visitor's latest message. If they switch languages, switch with them."
    : "The visitor selected " + LANGUAGE_NAMES[language] + ". Reply entirely in " + LANGUAGE_NAMES[language] + ", unless they explicitly ask you to translate or use another language.";
  const pageContext = String(body.pageContext || "").slice(0, 400);
  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [{ role: "system", content: SYSTEM_PROMPT + "\n" + languageInstruction + "\n" + pageContext }, ...messages],
      max_tokens: 420,
      temperature: 0.35
    });
    const response = String(result?.response || result?.output_text || "").trim();
    if (!response) throw new Error("The model returned an empty response");
    return Response.json({ response }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: "Dragon Ghost is temporarily unavailable" }, { status: 502 });
  }
}