import Link from "next/link";
import { requireOrgAccess } from "@/lib/auth";
import { euro } from "@/lib/format";
import { plans, planOrder, trialDays, type PlanId } from "@/lib/plans";
import { stripeConfigured } from "@/lib/payments/stripe";
import { accessFor } from "@/lib/plan-access";
import { startCheckout, openPortal } from "./actions";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  trialing: "Proefperiode", active: "Actief", past_due: "Betaling mislukt", canceled: "Gestopt", none: "Geen abonnement",
};

/**
 * Abonnement van de zaak: wat er nu loopt, wat het kost en hoe je wisselt.
 * Facturen, kaartgegevens en opzeggen gebeuren in de klantenportaal van Stripe —
 * dan staan we nooit tussen de zaak en haar eigen betaalgegevens in.
 */
export default async function BillingPage({ params, searchParams }: PageProps<"/app/[slug]/abonnement">) {
  const { slug } = await params;
  const sp = await searchParams;
  const { org } = (await requireOrgAccess(slug))!;
  const a = accessFor(org);
  const interval = sp.termijn === "jaar" ? "year" : "month";
  const current = a.plan;

  const notice =
    sp.klaar ? { tone: "good" as const, text: "Bedankt — je abonnement is in orde. Het kan een minuut duren voor alles hier bijgewerkt is." }
    : sp.geannuleerd ? { tone: "info" as const, text: "Je hebt de betaling afgebroken. Er is niets aangerekend." }
    : sp.fout === "stripe" ? { tone: "bad" as const, text: "Betalingen zijn nog niet ingesteld op deze installatie. Neem contact op met Plekk." }
    : sp.fout === "geen-klant" ? { tone: "bad" as const, text: "Er is nog geen betaaldossier. Kies eerst een formule." }
    : sp.fout ? { tone: "bad" as const, text: "Dat is niet gelukt. Probeer het opnieuw." }
    : null;

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl mb-1">Abonnement</h1>
      <p className="text-muted mb-6">Wat je nu gebruikt, wat het kost en hoe je wisselt.</p>

      {notice && (
        <p className={`card mb-6 p-4 text-sm ${notice.tone === "good" ? "border-green-600 bg-green-50" : notice.tone === "bad" ? "border-orange-500 bg-orange-50" : ""}`}>{notice.text}</p>
      )}

      {/* Huidige toestand */}
      <section className="card p-5 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Nu actief</p>
            <p className="text-2xl font-display font-bold">Plekk {plans[current]?.name ?? org.plan}</p>
            <p className="text-muted text-sm mt-1">
              {statusLabel[org.planStatus] ?? org.planStatus}
              {org.planStatus === "trialing" && a.daysLeft !== null && ` — nog ${Math.max(0, a.daysLeft)} ${a.daysLeft === 1 ? "dag" : "dagen"}`}
              {org.planStatus === "active" && org.planRenewsAt && ` — ${org.planCancelAtPeriodEnd ? "loopt af" : "verlengt"} op ${org.planRenewsAt.toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}`}
            </p>
          </div>
          {org.stripeCustomerId && (
            <form action={openPortal.bind(null, slug)}>
              <button className="btn-ghost">Facturen en betaalgegevens ↗</button>
            </form>
          )}
        </div>
        {a.warning && <p className="mt-4 rounded-xl bg-bg px-4 py-3 text-sm font-semibold">{a.warning}</p>}
        {!a.active && <p className="mt-3 text-sm text-muted">Je boekingspagina staat op pauze: klanten zien een bericht dat je tijdelijk niet online boekbaar bent. Zodra je betaalt, staat ze meteen terug online.</p>}
      </section>

      {/* Maand of jaar */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link href={`/app/${slug}/abonnement`} className={`rounded-xl px-3 py-2 font-semibold ${interval === "month" ? "bg-ink text-white" : "border border-line bg-surface"}`}>Per maand</Link>
        <Link href={`/app/${slug}/abonnement?termijn=jaar`} className={`rounded-xl px-3 py-2 font-semibold ${interval === "year" ? "bg-ink text-white" : "border border-line bg-surface"}`}>Per jaar <span className="font-normal opacity-80">— 2 maanden gratis</span></Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {planOrder.map((p: PlanId) => {
          const plan = plans[p];
          const price = interval === "year" ? plan.yearCents : plan.monthCents;
          const isCurrent = p === current && (org.planStatus === "active" || org.planStatus === "trialing");
          return (
            <section key={p} className={`card flex flex-col p-5 ${isCurrent ? "border-2" : ""}`} style={isCurrent ? { borderColor: "var(--brand)" } : undefined}>
              <p className="eyebrow">{plan.name}</p>
              <p className="mt-1 text-3xl font-display font-bold tabular">{euro(price)}</p>
              <p className="text-sm text-muted">{interval === "year" ? "per jaar" : "per maand"}, excl. btw</p>
              <ul className="my-4 flex-1 space-y-1.5 text-sm">
                {plan.features.map((f) => <li key={f} className="flex gap-2"><span aria-hidden style={{ color: "var(--brand)" }}>✓</span>{f}</li>)}
              </ul>
              {isCurrent && org.planStatus === "active" ? (
                <p className="rounded-xl bg-bg px-3 py-2.5 text-center text-sm font-semibold">Je huidige formule</p>
              ) : (
                <form action={startCheckout.bind(null, slug)}>
                  <input type="hidden" name="plan" value={p} />
                  <input type="hidden" name="interval" value={interval} />
                  <button className={p === "zaak" ? "btn-lime w-full" : "btn-ghost w-full"} disabled={!stripeConfigured()}>
                    {org.stripeSubscriptionId ? "Wissel naar deze formule" : trialDays > 0 ? `Start met ${trialDays} dagen gratis` : "Kies deze formule"}
                  </button>
                </form>
              )}
            </section>
          );
        })}
      </div>

      {!stripeConfigured() && (
        <p className="mt-4 rounded-xl border border-orange-500 bg-orange-50 px-4 py-3 text-sm">
          Betalingen staan nog niet aan op deze installatie, dus de knoppen hierboven zijn uitgeschakeld. Mail <a className="underline" href="mailto:hallo@plekk.be">hallo@plekk.be</a> en we zetten het in orde.
        </p>
      )}

      <p className="mt-6 text-sm text-muted">
        Maandelijks opzegbaar, geen opstartkosten. Bij het wisselen rekent Stripe automatisch het verschil af voor de resterende periode.
        Vragen over je factuur? Mail <a className="underline" href="mailto:hallo@plekk.be">hallo@plekk.be</a>.
      </p>
    </div>
  );
}
