import { site } from "@/config/site";

const GREEN = "#1ED760";
const ORANGE = "#FF6B1A";
const INK = "#101814";

/** Beeldmerk: tegel met uitsparing + stip. Inline SVG zodat het meeschaalt en kleurt. */
export function Mark({ size = 28, tile = GREEN, dot = ORANGE, id = "plekk-mark" }: { size?: number; tile?: string; dot?: string; id?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs><mask id={id}><rect x="-1" y="-1" width="102" height="102" fill="#fff" /><circle cx="79" cy="21" r="28" fill="#000" /></mask></defs>
      <rect width="100" height="100" rx="27" fill={tile} mask={`url(#${id})`} />
      <circle cx="79" cy="21" r="17" fill={dot} />
    </svg>
  );
}

/** Beeldmerk + woordmerk. `tone="light"` op donkere achtergrond. */
export function Logo({ size = 28, tone = "dark" }: { size?: number; tone?: "dark" | "light" }) {
  const ink = tone === "light" ? "#FFFFFF" : INK;
  return (
    <span className="inline-flex items-center gap-[0.35em]" style={{ fontSize: size }}>
      <Mark size={size} tile={tone === "light" ? "#FFFFFF" : GREEN} id={`plekk-mark-${tone}`} />
      <span className="font-display font-bold tracking-[-0.03em] leading-none" style={{ color: ink, fontSize: size * 1.02, transform: "translateY(-0.04em)" }}>{site.name.toLowerCase()}</span>
    </span>
  );
}
