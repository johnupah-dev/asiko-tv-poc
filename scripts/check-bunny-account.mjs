#!/usr/bin/env node

const apiKey = process.env.BUNNY_API_KEY;
if (!apiKey) {
  console.error("BUNNY_API_KEY is not configured.");
  process.exit(2);
}

const response = await fetch("https://api.bunny.net/user", {
  method: "GET",
  headers: {
    AccessKey: apiKey,
    Accept: "application/json",
    "User-Agent": "asiko-tv-poc-bunny-status/1.0",
  },
  signal: AbortSignal.timeout(15000),
});

if (!response.ok) {
  const requestId = response.headers.get("x-request-id");
  console.error(
    `Bunny API request failed with HTTP ${response.status}${requestId ? ` (request ${requestId})` : ""}.`,
  );
  process.exit(1);
}

const account = await response.json();

const pick = (...names) => {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(account, name)) return account[name];
  }
  return undefined;
};

const balance = pick("Balance", "balance");
const monthlyCharges = pick("MonthlyCharges", "monthlyCharges");
const billingType = pick("BillingType", "billingType");
const paymentStatus = pick("PaymentStatus", "paymentStatus");
const hasPaymentMethod = pick("HasPaymentMethod", "hasPaymentMethod");
const suspended = pick("Suspended", "suspended");
const trial = pick("Trial", "trial");
const currency = pick("Currency", "currency") ?? "EUR";

const present = (value) =>
  value === undefined || value === null || value === "" ? "Not returned by API" : String(value);

const money = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(2)} ${currency}` : present(value);
};

const status = suspended === true
  ? "ACTION REQUIRED — account suspended"
  : Number.isFinite(Number(balance)) && Number(balance) <= 0
    ? "CHECK BALANCE — zero or negative"
    : "API reachable";

const rows = [
  ["Overall check", status],
  ["Balance", money(balance)],
  ["Current monthly charges", money(monthlyCharges)],
  ["Payment status", present(paymentStatus)],
  ["Payment method on file", present(hasPaymentMethod)],
  ["Billing type", present(billingType)],
  ["Trial account", present(trial)],
  ["Suspended", present(suspended)],
];

const markdown = [
  "# Bunny account status",
  "",
  `Checked: ${new Date().toISOString()}`,
  "",
  "| Item | Result |",
  "|---|---|",
  ...rows.map(([label, value]) => `| ${label} | ${String(value).replaceAll("|", "\\|")} |`),
  "",
  "> This check deliberately excludes the API key, account email, card details, and raw API response.",
  "> Bunny may require the dashboard for invoice-level or card-specific payment details.",
  "",
].join("\n");

if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import("node:fs/promises");
  await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
}

console.log(markdown);
