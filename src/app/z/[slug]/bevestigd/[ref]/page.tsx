import { notFound } from "next/navigation";
import Link from "next/link";
import { getBookingByRef, canSelfCancel, getBaseUrl } from "@/lib/bookings";
import { euro, fmtDateTime } from "@/lib/format";
import { PoweredBy } from "@/components/PoweredBy";
import { publicStrings } from "@/i18n/public";
import { cancelBooking } from "../../actions";
import { createPayment } from "@/lib/payments/mollie";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ConfirmedPage({ params, searchParams }: PageProps<"/z/[slug]/bevestigd/[ref]">) {
  const { slug, ref } = await params;
  const sp = await searchParams;
  const b = await getBookingByRef(slug, ref);
  if (!b) notFound();
  const t = publicStrings(b.org.locale);
  const title = b.kind === "order" ? t.confirmedTitle.order : b.status === "requested" ? t.confirmedTitle.requested : b.kind === "reservation" ? t.confirmedTitle.reservation : t.confirmedTitle.appointment;
  const cancelResult = typeof sp.cancel === "string" ? sp.cancel : null;
  const cancellable = canSelfCancel(b);
  const cancelAction = async () => { "use server"; const { redirect } = await import("next/navigation"); const r = await cancelBooking(slug, ref); redirect(`/z/${slug}/bevestigd/${ref}?cancel=${r}`); };

  // "Nu betalen": nieuwe checkout aanmaken als de vorige verlopen is
  let payUrl: string | null = null;
  if (b.paymentStatus === "pending" && process.env.MOLLIE_API_KEY && b.status !== "cancelled") {
    const base = await getBaseUrl();
    try {
      const pay = await createPayment({ bookingId: b.id, amountCents: b.kind === "order" ? b.totalCents : b.depositCents, description: `${b.org.name} ${b.reference}`, redirectUrl: `${base}/z/${slug}/bevestigd/${ref}`, webhookUrl: `${base}/api/webhooks/mollie` });
      if (pay) { payUrl = pay.checkoutUrl; const db = await getDb(); await db.update(schema.bookings).set({ paymentRef: pay.id }).where(eq(schema.bookings.id, b.id)); }
    } catch (e) { console.error("[mollie]", e); }
  }

  return (
    <div className="flex-1" style={{ ["--brand" as string]: b.org.brandColor }}>
      <main className="mx-auto max-w-lg px-5 py-12">
        <div className="card p-6">
          <p className="text-xs font-mono uppercase tracking-[0.15em]" style={{ color: b.org.brandColor }}>{b.org.name}</p>
          <h1 className="text-3xl font-bold mt-1">{b.status === "cancelled" ? t.cancelled : title}</h1>
          <p className="mt-3 text-lg">{fmtDateTime(b.startsAt, b.org.locale)}</p>
          {b.kind === "reservation" && <p className="text-muted">{b.partySize} {b.partySize === 1 ? t.person : t.people}</p>}
          {b.kind === "appointment" && b.resource && <p className="text-muted">{t.with} {b.resource.name}</p>}

          {b.items.length > 0 && (
            <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
              {b.items.map((i) => (
                <li key={i.id} className="flex justify-between py-2 gap-3">
                  <span>{b.kind === "order" && `${i.quantity}× `}{i.name}{i.options?.length ? <span className="text-muted"> ({i.options.map((o) => o.choice).join(", ")})</span> : null}</span>
                  <span className="tabular">{euro(i.unitPriceCents * i.quantity)}</span>
                </li>
              ))}
              {b.kind === "order" && <li className="flex justify-between py-2 font-bold"><span>{t.total[0].toUpperCase() + t.total.slice(1)}</span><span className="tabular">{euro(b.totalCents)}</span></li>}
            </ul>
          )}

          {b.paymentStatus === "pending" && b.status !== "cancelled" && (
            <div className="mt-4 rounded-lg border border-line bg-bg p-3 text-sm">
              <p className="font-semibold">{b.kind === "order" ? t.payNow : `${t.depositTitle}: ${euro(b.depositCents)}`}</p>
              <p className="text-muted">{t.depositBody}</p>
              {payUrl ? <a href={payUrl} className="btn-brand text-white mt-3 inline-flex">{b.kind === "order" ? t.payNow : t.payDeposit} →</a> : <p className="text-muted mt-1 text-xs">Mollie: {process.env.MOLLIE_API_KEY ? "—" : "nog niet geactiveerd — de zaak bevestigt telefonisch."}</p>}
            </div>
          )}
          {b.paymentStatus === "paid" && <p className="mt-3 text-sm font-semibold" style={{ color: "#0F7A38" }}>✓ {euro(b.kind === "order" ? b.totalCents : b.depositCents)} {t.payNow.toLowerCase().replace(/^(nu |pay |jetzt |payer )/, "")}</p>}
          {b.kind === "order" && b.paymentStatus === "none" && <p className="mt-3 text-sm text-muted">{t.payAtPickupShort}</p>}

          <p className="mt-5 text-sm text-muted">{t.reference} <span className="font-mono font-semibold text-ink">{b.reference}</span>{b.customer?.email ? ` · ${t.mailedTo} ${b.customer.email}` : ""}</p>
          {b.org.phone && <p className="text-sm text-muted">{t.changeOrCancel} {t.call} <a className="underline" href={`tel:${b.org.phone.replace(/\s/g, "")}`}>{b.org.phone}</a>.</p>}

          {cancelResult === "too_late" && <p className="mt-3 text-sm text-red-700">{t.cancelTooLate}</p>}
          {b.status !== "cancelled" && (
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-muted underline">{t.cancelTitle}</summary>
              <p className="mt-2 text-muted">{t.cancelBody(b.org.settings.cancelHoursBefore)}</p>
              {cancellable ? <form action={cancelAction}><button className="btn-ghost mt-2 text-sm">{t.cancelButton}</button></form> : <p className="mt-1 text-red-700">{t.cancelTooLate}</p>}
            </details>
          )}

          <div className="mt-6 flex gap-3">
            <Link href={`/z/${slug}`} className="btn-ghost">{t.back} {b.org.name}</Link>
          </div>
        </div>
        <div className="mt-4"><PoweredBy locale={b.org.locale} /></div>
      </main>
    </div>
  );
}
