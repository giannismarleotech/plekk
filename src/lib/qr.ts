import QRCode from "qrcode";

/** QR als SVG met Plekk-merk: donkere modules, oranje stip in het midden, label eronder. */
export function qrSvg(url: string, opts: { size?: number; label?: string } = {}) {
  const size = opts.size ?? 512;
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const n = qr.modules.size; const data = qr.modules.data;
  const quiet = 4; const cell = size / (n + quiet * 2);
  let rects = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (data[y * n + x]) rects += `<rect x="${((x + quiet) * cell).toFixed(2)}" y="${((y + quiet) * cell).toFixed(2)}" width="${(cell + 0.2).toFixed(2)}" height="${(cell + 0.2).toFixed(2)}"/>`;
  const c = size / 2; const r = size * 0.085;
  const labelH = opts.label ? size * 0.12 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size + labelH}" width="${size}" height="${size + labelH}">
<rect width="${size}" height="${size + labelH}" fill="#fff"/>
<g fill="#101814">${rects}</g>
<rect x="${c - r * 1.35}" y="${c - r * 1.35}" width="${r * 2.7}" height="${r * 2.7}" rx="${r * 0.6}" fill="#fff"/>
<rect x="${c - r}" y="${c - r}" width="${r * 2}" height="${r * 2}" rx="${r * 0.54}" fill="#1ED760"/>
<circle cx="${c + r * 0.58}" cy="${c - r * 0.58}" r="${r * 0.34}" fill="#FF6B1A" stroke="#fff" stroke-width="${r * 0.14}"/>
${opts.label ? `<text x="${c}" y="${size + labelH * 0.62}" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="${labelH * 0.34}" font-weight="600" fill="#101814">${opts.label}</text>` : ""}
</svg>`;
}
