/* Plekk widget: <script src="https://plekk.be/widget.js" data-org="kapsalon-lien" data-color="#1ED760" data-label="Boek nu"></script>
   Zet een zwevende knop rechtsonder; klik opent de boekingspagina in een pop-up (of nieuw tabblad op mobiel). */
(function () {
  var s = document.currentScript; if (!s) return;
  var org = s.getAttribute("data-org"); if (!org) return;
  var color = s.getAttribute("data-color") || "#1ED760";
  var label = s.getAttribute("data-label") || "Boek nu";
  var base = s.getAttribute("data-base") || (s.src.replace(/\/widget\.js.*$/, ""));
  var host = base.replace(/^https?:\/\//, "");
  var url = "https://" + org + "." + host;
  if (/localhost|netlify|vercel/.test(host)) url = base + "/z/" + org;
  var btn = document.createElement("a");
  btn.href = url; btn.textContent = label; btn.setAttribute("aria-label", label);
  btn.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:2147483000;background:" + color + ";color:#fff;font:700 15px/1 system-ui,sans-serif;padding:14px 22px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.18);text-decoration:none;display:inline-flex;align-items:center;gap:10px";
  var dot = document.createElement("span"); dot.style.cssText = "width:10px;height:10px;border-radius:50%;background:#FF6B1A;display:inline-block"; btn.prepend(dot);
  btn.addEventListener("click", function (e) {
    if (window.innerWidth < 720) return;
    e.preventDefault();
    var ov = document.createElement("div"); ov.style.cssText = "position:fixed;inset:0;z-index:2147483001;background:rgba(16,24,20,.55);display:flex;align-items:center;justify-content:center;padding:24px";
    var fr = document.createElement("iframe"); fr.src = url; fr.title = label; fr.style.cssText = "width:min(960px,100%);height:min(820px,100%);border:0;border-radius:18px;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.35)";
    ov.appendChild(fr); ov.addEventListener("click", function (ev) { if (ev.target === ov) document.body.removeChild(ov); });
    document.body.appendChild(ov);
  });
  document.body.appendChild(btn);
})();
