/**
 * FLAME DRAGON HUB — Contact email sender
 * Deploy as a Web App, execute as the owner, accessible to anyone.
 * Set Script Property CONTACT_SHARED_SECRET before deploying.
 */
const SUPPORT_EMAIL = "flame.dragon.hub@gmail.com";
const ALLOWED_TOPICS = ["Bug Report", "Suggestion", "Account Help", "General Contact"];

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return jsonResponse({ ok: true, service: "FLAME DRAGON HUB contact mail" });
}

function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const expectedSecret = props.getProperty("CONTACT_SHARED_SECRET");
    if (!expectedSecret || !e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: "Not configured" });
    }

    const data = JSON.parse(e.postData.contents);
    if (!data || typeof data.secret !== "string" || data.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    const reference = String(data.reference || "");
    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const topic = String(data.topic || "");
    const message = String(data.message || "").trim();
    const clientIp = String(data.clientIp || "unknown");

    if (!/^FDH-\d{8}-[A-Z0-9]{6}$/.test(reference) ||
        name.length < 1 || name.length > 70 ||
        email.length > 120 ||
        (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
        ALLOWED_TOPICS.indexOf(topic) === -1 ||
        message.length < 5 || message.length > 3000 ||
        String(data.website || "").trim()) {
      return jsonResponse({ ok: false, error: "Invalid message" });
    }

    // Basic server-side cooldown per client IP.
    const digest = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256, clientIp
    );
    const ipKey = "contact_" + digest.map(function(b) {
      return ("0" + (b & 255).toString(16)).slice(-2);
    }).join("");
    const cache = CacheService.getScriptCache();
    if (cache.get(ipKey)) {
      return jsonResponse({ ok: false, error: "Please wait before sending again" });
    }
    cache.put(ipKey, "1", 30);

    if (MailApp.getRemainingDailyQuota() < 1) {
      return jsonResponse({ ok: false, error: "Daily email limit reached" });
    }

    const body = [
      "FLAME DRAGON HUB — New Contact Message",
      "Reference: " + reference,
      "Name: " + name,
      "Email: " + (email || "Not provided"),
      "Topic: " + topic,
      "",
      message
    ].join("\n");

    const options = {
      to: SUPPORT_EMAIL,
      subject: "[FLAME DRAGON HUB] " + topic + " - " + reference,
      body: body,
      name: "FLAME DRAGON HUB"
    };
    if (email) options.replyTo = email;

    const attachments = [];
    if (data.attachmentData) {
      const match = String(data.attachmentData).match(
        /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/
      );
      if (!match || match[2].length > 700000) {
        return jsonResponse({ ok: false, error: "Invalid attachment" });
      }
      const bytes = Utilities.base64Decode(match[2]);
      if (bytes.length > 512000) {
        return jsonResponse({ ok: false, error: "Attachment too large" });
      }
      const safeName = String(data.attachmentName || "contact-image")
        .replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 90);
      attachments.push(Utilities.newBlob(bytes, match[1], safeName));
    }
    if (attachments.length) options.attachments = attachments;

    MailApp.sendEmail(options);
    return jsonResponse({ ok: true, reference: reference });
  } catch (err) {
    console.error("Contact mail error: " + String(err));
    return jsonResponse({ ok: false, error: "Email delivery failed" });
  }
}
