import { NextResponse, type NextRequest } from "next/server";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "plekk.be";
const RESERVED = new Set(["www", "app", "api", "admin", "mail"]);
const LOCALES = ["nl", "fr", "en", "de"];
const APP_PREFIXES = ["/z/", "/app", "/admin", "/login", "/registreren", "/api", "/brand", "/favicon", "/manifest", "/sw.js", "/widget"];

function pickLocale(req: NextRequest) {
  const cookie = req.cookies.get("plekk_lang")?.value;
  if (cookie && LOCALES.includes(cookie)) return cookie;
  const header = req.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (LOCALES.includes(code)) return code;
  }
  return "nl";
}

/**
 * 1. Multi-tenant via subdomein: kapsalon-lien.plekk.be → /z/kapsalon-lien
 * 2. Marketingsite: / en paden zonder taalprefix → /nl, /fr, /en of /de (cookie, dan Accept-Language)
 */
export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const base = host.endsWith(".localhost") ? "localhost" : ROOT;
  const { pathname } = req.nextUrl;

  if (host !== base && host.endsWith(`.${base}`)) {
    const slug = host.slice(0, -(base.length + 1));
    if (slug && !RESERVED.has(slug) && !pathname.startsWith("/z/")) {
      const url = req.nextUrl.clone();
      url.pathname = `/z/${slug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) return NextResponse.next();
  const first = pathname.split("/")[1];
  if (LOCALES.includes(first)) {
    const res = NextResponse.next();
    res.cookies.set("plekk_lang", first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${pickLocale(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"] };
