import Link from "next/link";
import { site } from "@/config/site";
import { Mark } from "@/components/Logo";
import { publicStrings } from "@/i18n/public";

export function PoweredBy({ locale }: { locale?: string }) {
  const t = publicStrings(locale);
  return (
    <p className="text-xs text-muted inline-flex items-center gap-1.5">
      <Mark size={14} id="plekk-mark-powered" /> {t.poweredBy} <Link href="/" className="font-semibold text-ink hover:underline">{site.name}</Link> · {t.noCommission}
    </p>
  );
}
