import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// agent/.env is optional; real environment variables win over it.
const envFile = path.join(ROOT, ".env");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const env = process.env;

export const config = {
  model: env.AGENT_MODEL || "claude-opus-5-5",
  port: Number(env.PORT || 8787),
  adminToken: env.AGENT_ADMIN_TOKEN || "",
  dataDir: path.resolve(ROOT, env.AGENT_DATA_DIR || "data"),
  knowledgeDir: path.join(ROOT, "knowledge"),
  allowedOrigins: (env.AGENT_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  timezone: "Africa/Lagos",
  whatsapp: {
    token: env.WHATSAPP_TOKEN || "",
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID || "",
    verifyToken: env.WHATSAPP_VERIFY_TOKEN || "",
    appSecret: env.WHATSAPP_APP_SECRET || "",
    autoSend: env.WHATSAPP_AUTO_SEND === "true",
  },
};

/** Today's date in Lagos as YYYY-MM-DD. */
export function todayLagos(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: config.timezone }).format(date);
}
