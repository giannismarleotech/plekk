import { NextResponse } from "next/server";
import { publicUrl } from "@/lib/bookings";
import { qrSvg } from "@/lib/qr";

/** QR-code (SVG) naar de boekingspagina van een zaak: /api/qr?slug=kapsalon-lien */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ ok: false }, { status: 400 });
  const url = publicUrl(slug);
  const svg = qrSvg(url, { size: 512, label: url.replace(/^https?:\/\//, "") });
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml", "Content-Disposition": `inline; filename="plekk-qr-${slug}.svg"` } });
}
