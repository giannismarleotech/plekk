import { notFound } from "next/navigation";
import { isLocale } from "@/i18n";

export default async function MarketingLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <div className="flex-1 flex flex-col marketing" style={{ ["--brand" as string]: "#1ED760", ["--accent" as string]: "#0F7A38" }}>{children}</div>;
}
