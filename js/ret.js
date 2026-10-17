// Skrivetilstand til sprogrettelser (Othman 17. okt 2026). Tændes med ?ret på en side og følger fanen (sessionStorage).
// Al læsbar tekst kan rettes ved et klik; en valgt tekst kan slettes eller fortrydes. Ændringerne gemmes kun i denne
// browser (localStorage) med side og original tekst, og "Kopiér ændringer" giver en liste til at sætte ind i chatten.
(() => {
  const NOEGLE = "tallo-ret-aendringer";
  const side = location.pathname.replace(/^\/forhaand/, "").replace(/index\.html$/, "") || "/";
  const hent = () => { try { return JSON.parse(localStorage.getItem(NOEGLE) || "{}"); } catch { return {}; } };
  const gem = (a) => localStorage.setItem(NOEGLE, JSON.stringify(a));
  const ren = (t) => (t || "").replace(/\s+/g, " ").trim();
  const noegle = (orig) => side + "¤" + orig;

  // Stil
  const stil = document.createElement("style");
  stil.textContent = `
    [data-ret-orig] { cursor: text; border-radius: 4px; transition: outline-color .15s; outline: 1.5px dashed transparent; outline-offset: 3px; }
    [data-ret-orig]:hover { outline-color: rgba(75,58,166,.45); }
    [data-ret-orig]:focus { outline: 2px solid #4b3aa6; }
    .ret-aendret { background: rgba(248,170,110,.18); box-shadow: inset 0 -2px 0 #f0a46b; }
    .ret-slettet { text-decoration: line-through; text-decoration-color: #c0392b; opacity: .38; }
    .ret-vaerktoej { position: fixed; z-index: 1000; display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: #141414; box-shadow: 0 12px 30px -10px rgba(0,0,0,.5); }
    .ret-vaerktoej button, .ret-panel button { min-height: 36px; padding: 0 12px; border: 0; border-radius: 9px; background: transparent; color: #fff; font: 500 14px/1 "Geist", system-ui, sans-serif; cursor: pointer; }
    .ret-vaerktoej button:hover, .ret-panel button:hover { background: rgba(255,255,255,.14); }
    .ret-vaerktoej .slet { color: #ffb4a8; }
    .ret-panel { position: fixed; z-index: 1000; left: 16px; bottom: 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; max-width: calc(100% - 32px); padding: 6px 6px 6px 14px; border-radius: 16px; background: #141414; color: #fff; font: 500 14px/1.3 "Geist", system-ui, sans-serif; box-shadow: 0 20px 40px -16px rgba(0,0,0,.5); }
    .ret-panel .tal { margin-right: 6px; opacity: .85; }
    .ret-panel .kopier { background: #4b3aa6; }
    .ret-panel .kopier:hover { background: #5a48c0; }
    .ret-boks { position: fixed; z-index: 1001; inset: 0; display: grid; place-items: center; padding: 20px; background: rgba(20,20,20,.5); }
    .ret-boks div { width: min(640px, 100%); padding: 20px; border-radius: 18px; background: #fff; font: 15px/1.5 "Geist", system-ui, sans-serif; }
    .ret-boks textarea { width: 100%; height: 50vh; margin: 12px 0; padding: 12px; border: 1px solid #ddd; border-radius: 10px; font: 13px/1.5 ui-monospace, Consolas, monospace; }
    .ret-boks button { min-height: 40px; padding: 0 16px; border: 0; border-radius: 999px; background: #4b3aa6; color: #fff; font: inherit; font-weight: 500; cursor: pointer; }
    @media (max-width: 600px) { .ret-panel { left: 8px; right: 8px; bottom: 8px; max-width: none; } }
  `;
  document.head.appendChild(stil);

  // Alle FAQ-svar åbnes, så de kan rettes
  document.querySelectorAll("details").forEach((d) => { d.open = true; });

  // Hvilke elementer der kan rettes: læsbar tekst i <main> og footerens tekst, ikke tal fra scripts og ikke pynt
  const TAGS = "h1, h2, h3, h4, p, li, summary, td, th, dt, dd, label, figcaption, blockquote, a.pille, button";
  const ude = ".detalje, .ts-telefon, .skaerm, .lag, .sr, [aria-hidden='true'], .faelde, script, style, .ret-panel, .ret-vaerktoej";
  let felter = [...document.querySelectorAll(`main :is(${TAGS}), footer .fod-indre p`)].filter((el) => {
    if (el.closest(ude)) return false;
    const t = ren(el.innerText);
    return t && !/^[\d.,\s%+−\-]*(kr\.?)?$/i.test(t);
  });
  felter = felter.filter((el) => !felter.some((x) => x !== el && x.contains(el)));  // kun det yderste

  const marker = (el, a) => {
    const n = a[noegle(el.dataset.retOrig)];
    el.classList.toggle("ret-aendret", !!n && !n.slettet);
    el.classList.toggle("ret-slettet", !!n && !!n.slettet);
    el.contentEditable = n && n.slettet ? "false" : (el._plain ? "plaintext-only" : "true");
  };
  const gemt = hent();
  felter.forEach((el) => {
    el.dataset.retOrig = ren(el.innerText);
    el.contentEditable = "plaintext-only";
    el._plain = el.contentEditable === "plaintext-only";
    if (!el._plain) el.contentEditable = "true";
    el.tabIndex = 0;
    el.spellcheck = true;
    const n = gemt[noegle(el.dataset.retOrig)];
    if (n && !n.slettet) el.innerText = n.ny;
    marker(el, gemt);
  });

  const opdater = (el) => {
    const a = hent(), k = noegle(el.dataset.retOrig), ny = ren(el.innerText), gl = a[k];
    if (gl && gl.slettet) return;
    if (ny === el.dataset.retOrig) delete a[k];
    else a[k] = { side, orig: el.dataset.retOrig, ny, tid: gl ? gl.tid : Date.now() };
    gem(a); marker(el, a); tael();
  };
  felter.forEach((el) => {
    el.addEventListener("input", () => opdater(el));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); el.blur(); } if (e.key === "Escape") el.blur(); });
  });

  // Links, knapper og FAQ følger ikke, mens man retter (menuen øverst virker stadig)
  const stop = (e) => { if (e.target.closest("[data-ret-orig], main a, main button, main summary") && !e.target.closest(".ret-vaerktoej, .ret-panel")) { e.preventDefault(); e.stopPropagation(); } };
  document.addEventListener("click", stop, true);
  document.addEventListener("pointerdown", (e) => { if (e.target.closest("main .traek-fil")) e.stopPropagation(); }, true);

  // Værktøjslinjen over den valgte tekst: Slet / Gendan og Fortryd
  const vt = document.createElement("div"); vt.className = "ret-vaerktoej"; vt.hidden = true;
  vt.innerHTML = '<button type="button" class="slet"></button><button type="button" class="fortryd">Fortryd</button>';
  document.body.appendChild(vt);
  let valgt = null;
  const placerVt = () => {
    if (!valgt) return;
    const r = valgt.getBoundingClientRect();
    vt.style.left = Math.max(8, Math.min(innerWidth - vt.offsetWidth - 8, r.left)) + "px";
    vt.style.top = (r.top > 60 ? r.top - vt.offsetHeight - 8 : r.bottom + 8) + "px";
  };
  const visVt = (el) => {
    valgt = el; const n = hent()[noegle(el.dataset.retOrig)];
    vt.querySelector(".slet").textContent = n && n.slettet ? "Gendan" : "Slet";
    vt.querySelector(".fortryd").hidden = !n;
    vt.hidden = false; placerVt();
  };
  document.addEventListener("focusin", (e) => { const el = e.target.closest("[data-ret-orig]"); if (el) visVt(el); });
  document.addEventListener("pointerdown", (e) => { if (!e.target.closest("[data-ret-orig], .ret-vaerktoej")) { vt.hidden = true; valgt = null; } });
  addEventListener("scroll", placerVt, { passive: true }); addEventListener("resize", placerVt);
  vt.addEventListener("pointerdown", (e) => e.preventDefault());  // behold fokus på teksten
  vt.querySelector(".slet").addEventListener("click", () => {
    if (!valgt) return;
    const a = hent(), k = noegle(valgt.dataset.retOrig);
    if (a[k] && a[k].slettet) delete a[k];
    else { valgt.innerText = valgt.dataset.retOrig; a[k] = { side, orig: valgt.dataset.retOrig, slettet: true, tid: Date.now() }; }
    gem(a); marker(valgt, a); tael(); visVt(valgt);
  });
  vt.querySelector(".fortryd").addEventListener("click", () => {
    if (!valgt) return;
    const a = hent(); delete a[noegle(valgt.dataset.retOrig)]; gem(a);
    valgt.innerText = valgt.dataset.retOrig; marker(valgt, a); tael(); visVt(valgt);
  });

  // Panelet: antal, kopiér, nulstil, afslut
  const panel = document.createElement("div"); panel.className = "ret-panel";
  panel.innerHTML = '<span class="tal"></span><button type="button" class="kopier">Kopiér ændringer</button><button type="button" class="nulstil">Nulstil</button><button type="button" class="afslut">Afslut</button>';
  document.body.appendChild(panel);
  function tael() {
    const n = Object.keys(hent()).length;
    panel.querySelector(".tal").textContent = `Skrivetilstand · ${n} ${n === 1 ? "ændring" : "ændringer"}`;
  }
  tael();
  const liste = () => {
    const alle = Object.values(hent()).sort((x, y) => x.tid - y.tid), sider = {};
    alle.forEach((x) => { (sider[x.side] = sider[x.side] || []).push(x); });
    let t = `Sprogrettelser fra tallo.dk (${alle.length})\n`;
    Object.entries(sider).forEach(([s, xs]) => {
      t += `\n${s}\n`;
      xs.forEach((x) => { t += x.slettet ? `- SLET: "${x.orig}"\n` : `- "${x.orig}" → "${x.ny}"\n`; });
    });
    return t;
  };
  const visBoks = (tekst, kopieret) => {
    const b = document.createElement("div"); b.className = "ret-boks";
    b.innerHTML = `<div><b>${kopieret ? "Kopieret. Sæt listen ind i chatten." : "Kopiér listen herunder og sæt den ind i chatten."}</b><textarea readonly></textarea><button type="button">Luk</button></div>`;
    b.querySelector("textarea").value = tekst;
    b.querySelector("button").addEventListener("click", () => b.remove());
    b.addEventListener("click", (e) => { if (e.target === b) b.remove(); });
    document.body.appendChild(b);
    const ta = b.querySelector("textarea"); ta.focus(); ta.select();
  };
  panel.querySelector(".kopier").addEventListener("click", async () => {
    const t = liste();
    try { await navigator.clipboard.writeText(t); visBoks(t, true); } catch { visBoks(t, false); }
  });
  panel.querySelector(".nulstil").addEventListener("click", () => {
    if (confirm("Slet alle dine rettelser på alle sider?")) { localStorage.removeItem(NOEGLE); location.reload(); }
  });
  panel.querySelector(".afslut").addEventListener("click", () => {
    sessionStorage.removeItem("tallo-ret");
    location.href = location.pathname;
  });
})();
