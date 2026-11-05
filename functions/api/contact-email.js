function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin") || "";
  if (origin !== "https://flamedragonhub.pages.dev") {
    return json({ ok: false, error: "Origin not allowed" }, 403);
  }

  if (!env.APPS_SCRIPT_URL || !env.CONTACT_SHARED_SECRET) {
    return json({ ok: false, error: "Contact email service is not configured yet" }, 503);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ ok: false, error: "JSON required" }, 415);
  }

  const raw = await request.text();
  if (raw.length > 800000) return json({ ok: false, error: "Message is too large" }, 413);

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const topics = ["Bug Report", "Suggestion", "Account Help", "General Contact"];
  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim();
  const topic = String(data.topic || "");
  const message = String(data.message || "").trim();
  const reference = String(data.reference || "");
  const attachmentData = String(data.attachmentData || "");

  if (String(data.website || "").trim()) return json({ ok: false, error: "Rejected" }, 400);
  if (!/^FDH-\d{8}-[A-Z0-9]{6}$/.test(reference) ||
      name.length < 1 || name.length > 70 ||
      email.length > 120 ||
      (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
      !topics.includes(topic) ||
      message.length < 5 || message.length > 3000) {
    return json({ ok: false, error: "Please check the message details" }, 400);
  }

  if (attachmentData) {
    const match = attachmentData.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match || match[2].length > 700000) {
      return json({ ok: false, error: "Invalid attachment" }, 400);
    }
    if (Math.floor(match[2].length * 3 / 4) > 512000) {
      return json({ ok: false, error: "Attachment is too large" }, 413);
    }
  }

  try {
    const upstream = await fetch(env.APPS_SCRIPT_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: env.CONTACT_SHARED_SECRET,
        reference,
        name,
        email,
        topic,
        message,
        website: "",
        attachmentData,
        attachmentName: String(data.attachmentName || "").slice(0, 90),
        clientIp: request.headers.get("CF-Connecting-IP") || "unknown"
      })
    });

    const responseText = await upstream.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      return json({ ok: false, error: "Email service returned an unexpected response" }, 502);
    }
    if (!upstream.ok || !result.ok) {
      return json({ ok: false, error: result.error || "Email could not be sent" }, 502);
    }
    return json({ ok: true, reference });
  } catch (error) {
    return json({ ok: false, error: "Could not reach the email service" }, 502);
  }
}
