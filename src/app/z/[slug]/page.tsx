import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrgPublicData } from "@/lib/bookings";
import { modeLabels } from "@/config/site";
import { euro } from "@/lib/format";
import { publicStrings, publicLocaleTag } from "@/i18n/public";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { PoweredBy } from "@/components/PoweredBy";
import { DemoBanner } from "@/components/DemoBanner";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/z/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getOrgPublicData(slug);
  return { title: data ? `${data.org.name} — ${data.org.mode === "salon" ? publicStrings(data.org.locale).ctaSalon : data.org.mode === "restaurant" ? publicStrings(data.org.locale).ctaRestaurant : publicStrings(data.org.locale).ctaTakeaway}` : "Plekk" };
}

export default async function PublicOrgPage({ params }: PageProps<"/z/[slug]">) {
  const { slug } = await params;
  const data = await getOrgPublicData(slug);
  if (!data) notFound();
  const { org, resources, offerings } = data;
  const labels = modeLabels[org.mode];
  const t = publicStrings(org.locale);
  const { depositNote, cancelBody, ...rest } = t; void cancelBody;
  const flowT = { ...rest, localeTag: publicLocaleTag(org.locale), depositNoteText: depositNote(org.settings.depositFromPartySize ?? 0, euro(org.settings.depositCentsPerPerson ?? 0), "{total}") };
  const cta = org.mode === "salon" ? t.ctaSalon : org.mode === "restaurant" ? t.ctaRestaurant : t.ctaTakeaway;
  const hours = Object.entries(org.openingHours).sort(([a], [b]) => ((Number(a) + 6) % 7) - ((Number(b) + 6) % 7));

  return (
    <div className="flex-1" style={{ ["--brand" as string]: org.brandColor }}>
      {org.plan === "demo" && <DemoBanner locale={org.locale} />}
      <header className="text-white" style={{ background: org.brandColor }}>
        <div className="mx-auto max-w-5xl px-5 py-10 md:py-14">
          <p className="text-xs font-mono uppercase tracking-[0.15em] opacity-80">{org.city ?? labels.description.split(",")[0]}</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold">{org.name}</h1>
          {org.tagline && <p className="mt-2 text-lg opacity-90 max-w-xl">{org.tagline}</p>}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 grid gap-8 md:grid-cols-[1fr_300px]">
        <section>
          <h2 className="text-2xl font-bold mb-4">{cta}</h2>
          <BookingFlow
            org={{ slug: org.slug, name: org.name, mode: org.mode, brandColor: org.brandColor, settings: org.settings }}
            resources={resources.map((r) => ({ id: r.id, name: r.name, kind: r.kind, capacity: r.capacity, minParty: r.minParty }))}
            offerings={offerings.map((o) => ({ id: o.id, kind: o.kind, name: o.name, category: o.category, description: o.description, durationMin: o.durationMin, priceCents: o.priceCents, options: o.options ?? [] }))}
            t={flowT}
          />
        </section>

        <aside className="space-y-4 md:sticky md:top-6 self-start">
          {org.description && <p className="text-muted">{org.description}</p>}
          <div className="card p-4 text-sm">
            <h3 className="font-bold mb-2">{t.openingHours}</h3>
            <dl className="grid grid-cols-[1fr_auto] gap-y-1 tabular">
              {hours.map(([d, blocks]) => (
                <div key={d} className="contents">
                  <dt className="text-muted">{t.weekdays[Number(d)]}</dt>
                  <dd className="text-right font-mono text-xs">{blocks.map((b) => `${b.open}–${b.close}`).join(", ")}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="card p-4 text-sm space-y-1">
            {org.address && <p>{org.address}<br />{org.city}</p>}
            {org.phone && <p><a className="underline" href={`tel:${org.phone.replace(/\s/g, "")}`}>{org.phone}</a></p>}
            {org.email && <p><a className="underline" href={`mailto:${org.email}`}>{org.email}</a></p>}
          </div>
          <PoweredBy locale={org.locale} />
        </aside>
      </main>
    </div>
  );
}
