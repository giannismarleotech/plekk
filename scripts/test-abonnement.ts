/**
 * Snelle controle van de abonnementsregels, zonder database of netwerk.
 * Draaien met: npx tsx scripts/test-abonnement.ts
 */
import crypto from "node:crypto";
import { accessFor, type PlanState } from "../src/lib/plan-access";
import { verifyWebhook } from "../src/lib/payments/stripe-signature";
const day = 86_400_000;
const base: PlanState = { plan: "zaak", planStatus: "trialing", planRenewsAt: null, planCancelAtPeriodEnd: false, trialEndsAt: null };
const cases: [string, Partial<PlanState>][] = [
  ["proef, 14 dagen te gaan", { planStatus: "trialing", trialEndsAt: new Date(Date.now() + 14 * day) }],
  ["proef, 2 dagen te gaan", { planStatus: "trialing", trialEndsAt: new Date(Date.now() + 2 * day) }],
  ["proef verlopen", { planStatus: "trialing", trialEndsAt: new Date(Date.now() - 2 * day) }],
  ["actief", { planStatus: "active", planRenewsAt: new Date(Date.now() + 20 * day) }],
  ["actief, opgezegd", { planStatus: "active", planRenewsAt: new Date(Date.now() + 20 * day), planCancelAtPeriodEnd: true }],
  ["betaling mislukt, dag 3", { planStatus: "past_due", planRenewsAt: new Date(Date.now() - 3 * day) }],
  ["betaling mislukt, dag 15", { planStatus: "past_due", planRenewsAt: new Date(Date.now() - 15 * day) }],
  ["opgezegd", { planStatus: "canceled" }],
  ["geen abonnement", { planStatus: "none" }],
];
let bad = 0;
const expect: Record<string, boolean> = { "proef, 14 dagen te gaan": true, "proef, 2 dagen te gaan": true, "proef verlopen": false, "actief": true, "actief, opgezegd": true, "betaling mislukt, dag 3": true, "betaling mislukt, dag 15": false, "opgezegd": false, "geen abonnement": false };
for (const [label, patch] of cases) {
  const a = accessFor({ ...base, ...patch });
  const ok = a.active === expect[label];
  if (!ok) bad++;
  console.log(`${ok ? "✓" : "✗ VERWACHT ANDERS"} ${(a.active ? "boekbaar" : "op pauze").padEnd(9)} ${label.padEnd(26)} ${a.warning ?? "—"}`);
}

// ---- Webhook-handtekening: het slot op /api/webhooks/stripe ----
const secret = "whsec_test";
const payload = JSON.stringify({ id: "evt_1", type: "customer.subscription.updated", data: { object: {} } });
const t = Math.floor(Date.now() / 1000);
const sign = (ts: number, body: string) => crypto.createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");

const checks: [string, () => void, boolean][] = [
  ["geldige handtekening", () => verifyWebhook(payload, `t=${t},v1=${sign(t, payload)}`, secret), true],
  ["verkeerde handtekening", () => verifyWebhook(payload, `t=${t},v1=${"0".repeat(64)}`, secret), false],
  ["gewijzigde body", () => verifyWebhook(payload.replace("evt_1", "evt_2"), `t=${t},v1=${sign(t, payload)}`, secret), false],
  ["te oude gebeurtenis", () => verifyWebhook(payload, `t=${t - 600},v1=${sign(t - 600, payload)}`, secret), false],
  ["geen handtekening", () => verifyWebhook(payload, null, secret), false],
];
for (const [label, run, shouldPass] of checks) {
  let passed = true;
  try { run(); } catch { passed = false; }
  const ok = passed === shouldPass;
  if (!ok) bad++;
  console.log(`${ok ? "✓" : "✗ VERWACHT ANDERS"} ${(passed ? "aanvaard" : "geweigerd").padEnd(9)} webhook: ${label}`);
}

console.log(bad ? `\n${bad} geval(len) fout` : "\nAlles in orde.");
process.exit(bad ? 1 : 0);
