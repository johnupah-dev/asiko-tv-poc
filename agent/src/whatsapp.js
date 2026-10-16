// WhatsApp Business Cloud API: verify webhooks, read incoming text messages,
// send approved replies. Everything is optional — without the env vars set the
// agent just keeps drafts for a person to send.
import crypto from "node:crypto";
import { config } from "./config.js";

const GRAPH = "https://graph.facebook.com/v21.0";

export function whatsappEnabled() {
  return Boolean(config.whatsapp.token && config.whatsapp.phoneNumberId);
}

/** Check Meta's X-Hub-Signature-256 header against the raw request body. */
export function verifySignature(rawBody, header) {
  if (!config.whatsapp.appSecret) return false;
  if (!header || !header.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", config.whatsapp.appSecret).update(rawBody).digest("hex");
  const given = header.slice(7);
  return given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/** Pull text messages out of a webhook payload. */
export function extractMessages(payload) {
  const out = [];
  for (const entry of payload?.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const names = Object.fromEntries((value.contacts || []).map((c) => [c.wa_id, c.profile?.name || ""]));
      for (const m of value.messages || []) {
        const text = m.text?.body || m.button?.text || m.interactive?.button_reply?.title || m.interactive?.list_reply?.title;
        if (text) out.push({ from: m.from, name: names[m.from] || "", message: text, meta: { waMessageId: m.id } });
      }
    }
  }
  return out;
}

export async function sendWhatsApp(to, body) {
  if (!whatsappEnabled()) {
    return { method: "manual", note: "WhatsApp API not configured — send this reply from the WhatsApp Business app." };
  }
  const res = await fetch(`${GRAPH}/${config.whatsapp.phoneNumberId}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${config.whatsapp.token}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    return { method: "whatsapp", sent: false, error: `WhatsApp API ${res.status}: ${(await res.text()).slice(0, 300)}` };
  }
  return { method: "whatsapp", sent: true };
}
