import { locales } from "@/i18n";

/**
 * Wortel van de site. Op een server stuurt proxy.ts de bezoeker al door naar /nl, /fr, /en of /de.
 * Op een statische host (GitHub Pages) bestaat die proxy niet: dan doet dit pagina'tje het in de browser.
 */
export default function RootRedirect() {
  const js = `(function(){var l=(navigator.language||"nl").slice(0,2).toLowerCase();var ok=${JSON.stringify(locales)};var m=document.cookie.match(/plekk_lang=(\\w\\w)/);var t=m&&ok.indexOf(m[1])>-1?m[1]:(ok.indexOf(l)>-1?l:"nl");var b=document.querySelector('meta[name="base-path"]').content;location.replace(b+"/"+t+"/");})();`;
  return (
    <main style={{ fontFamily: "system-ui", padding: "3rem", color: "#5C645E" }}>
      <meta name="base-path" content={process.env.STATIC_BASE_PATH ?? ""} />
      <script dangerouslySetInnerHTML={{ __html: js }} />
      <p>Plekk · <a href="./nl/">Nederlands</a> · <a href="./fr/">Français</a> · <a href="./en/">English</a> · <a href="./de/">Deutsch</a></p>
    </main>
  );
}
