/* Tallo: fælles for forsiden og undersiderne. Menu, mobilmenu, booking (Cal.com), afsløring ved scroll og
   pakkeblokken. Forsidens zoom og tilmelding står i forsiden selv. */
(() => {
  const html = document.documentElement;
  const roligt = html.classList.contains("stille");

  // Menuen: gennemsigtig over forsidens foto, hvid flade når man scroller og altid på undersiderne
  const nav = document.getElementById("nav");
  const forside = !!document.getElementById("rejse");
  const opdaterNav = () => nav.classList.toggle("fast", !forside || scrollY > 8);
  addEventListener("scroll", opdaterNav, { passive: true });
  opdaterNav();

  // Mobilmenuen: et fuldt ark; lukker på Esc, kryds og link; fokus bliver i arket, mens det er åbent
  const menuKnap = document.getElementById("menuKnap"), ark = document.getElementById("menuArk");
  if (menuKnap && ark) {
    const fokusbare = () => [...ark.querySelectorAll("a, button")];
    const aabn = () => {
      ark.hidden = false;
      requestAnimationFrame(() => ark.classList.add("aaben"));
      menuKnap.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      ark.querySelector("ul a").focus();
    };
    const luk = (tilbage = true) => {
      ark.classList.remove("aaben");
      menuKnap.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      setTimeout(() => { if (!ark.classList.contains("aaben")) ark.hidden = true; }, 260);
      if (tilbage) menuKnap.focus();
    };
    menuKnap.addEventListener("click", aabn);
    ark.querySelector(".menu-luk").addEventListener("click", () => luk());
    ark.addEventListener("click", (e) => { if (e.target.closest("a")) luk(false); });
    document.addEventListener("keydown", (e) => {
      if (ark.hidden) return;
      if (e.key === "Escape") return luk();
      if (e.key !== "Tab") return;
      const f = fokusbare(), i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    matchMedia("(min-width: 900px)").addEventListener("change", (e) => { if (e.matches && !ark.hidden) luk(false); });
  }

  // Cal.com: hentes først, når nogen nærmer sig en "Vælg en tid"-knap
  const CAL_LINK = "tallo/møde";
  const CAL_CONFIG = { layout: "month_view", theme: "light" };
  const CAL_UI = { hideEventTypeDetails: true, theme: "light", layout: "month_view", cssVarsPerTheme: { light: { "cal-brand": "#4b3aa6" }, dark: { "cal-brand": "#4b3aa6" } } };
  let calHentet = false;
  const hentCal = () => {
    if (calHentet) return;
    calHentet = true;
    (function (C, A, L) { const p = (a, ar) => { a.q.push(ar); }; const d = C.document; C.Cal = C.Cal || function () { const cal = C.Cal; const ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const ns = ar[1]; api.q = api.q || []; if (typeof ns === "string") { cal.ns[ns] = cal.ns[ns] || api; p(cal.ns[ns], ar); p(cal, ["initNamespace", ns]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
    Cal("init", { origin: "https://cal.com" });
    Cal("ui", CAL_UI);
  };
  ["pointerover", "focusin", "touchstart"].forEach((ev) => document.addEventListener(ev, (e) => {
    if (e.target.closest && e.target.closest("[data-book]")) hentCal();
  }, { passive: true }));
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-book]")) return;
    e.preventDefault();
    hentCal();
    Cal("modal", { calLink: CAL_LINK, config: CAL_CONFIG });
    Cal("ui", CAL_UI);
  }, true);

  // Afsløring ved scroll: [data-afslor] glider ind, og grupper med .js-vis får klassen "inde"
  const iSyne = (el, fn, margin = "-15%") => {
    if (!("IntersectionObserver" in window)) return fn();
    new IntersectionObserver((poster, o) => poster.forEach((p) => {
      if (p.isIntersecting) { o.disconnect(); fn(); }
    }), { rootMargin: `0px 0px ${margin} 0px` }).observe(el);
  };
  if (!roligt) {
    const afslor = document.querySelectorAll("[data-afslor]");
    if (afslor.length) {
      html.classList.add("js-afslor");
      afslor.forEach((el) => iSyne(el, () => el.classList.add("inde"), "-10%"));
    }
    document.querySelectorAll("[data-falder]").forEach((el) => { el.classList.add("js-vis"); iSyne(el, () => el.classList.add("inde"), "-20%"); });
  }

  // Farven glider med rullet: hvert afsnit i <main> har en tone (data-tone, ellers papir). Inde i et afsnit står tonen
  // stille; nær grænsen blandes den med naboen. Følger kun rullet, så den kører også ved reduceret bevægelse.
  const afsnit = [...document.querySelectorAll("main > section")];
  if (afsnit.some((a) => a.dataset.tone)) {
    const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const toner = afsnit.map((a) => rgb(a.dataset.tone || "#f6f6f3"));
    const bland = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const glat = (t) => t * t * (3 - 2 * t);
    let sidst = "", venter = false;
    const tegn = () => {
      venter = false;
      const midt = innerHeight / 2, zone = innerHeight * 0.45;
      let i = afsnit.findIndex((a) => a.getBoundingClientRect().bottom > midt);
      if (i < 0) i = afsnit.length - 1;
      const r = afsnit[i].getBoundingClientRect();
      let farve = toner[i];
      if (i > 0 && midt - r.top < zone) farve = bland(toner[i - 1], toner[i], glat(Math.max(0, 0.5 + (midt - r.top) / (2 * zone))));
      else if (i < afsnit.length - 1 && r.bottom - midt < zone) farve = bland(toner[i], toner[i + 1], glat(0.5 - (r.bottom - midt) / (2 * zone)));
      const v = `rgb(${farve.join(",")})`;
      if (v !== sidst) { html.style.setProperty("--bund", v); sidst = v; }
    };
    const bed = () => { if (!venter) { venter = true; requestAnimationFrame(tegn); } };
    addEventListener("scroll", bed, { passive: true });
    addEventListener("resize", bed);
    tegn();
    html.classList.add("glid");
  }

  // Tabellerne i privatlivspolitikken: kolonnens navn på hver celle, så rækkerne kan stå som kort på mobil
  document.querySelectorAll(".juridisk table").forEach((tb) => {
    const navne = [...tb.querySelectorAll("thead th, tr:first-child th")].map((th) => th.textContent.trim());
    tb.querySelectorAll("tbody tr").forEach((tr) => [...tr.children].forEach((td, i) => { if (navne[i]) td.dataset.label = navne[i]; }));
  });

  // Telefonscenen: teksten midt på skærmen (på mobil: lige under telefonen) bestemmer skærm og chip
  document.querySelectorAll("[data-telefon]").forEach((scene) => {
    const tekster = [...scene.querySelectorAll(".ts-tekst")];
    const skaerme = [...scene.querySelectorAll(".ts-telefon img[data-s]")];
    const chips = [...scene.querySelectorAll(".ts-chip")];
    const vis = (i) => {
      const s = tekster[i].dataset.skaerm;
      tekster.forEach((t, j) => t.classList.toggle("aktiv", j === i));
      skaerme.forEach((img) => img.classList.toggle("vist", img.dataset.s === s));
      chips.forEach((c) => c.classList.toggle("vist", +c.dataset.trin === i));
      scene.dataset.trin = i;
    };
    vis(0);
    if (!("IntersectionObserver" in window)) return;
    const smal = matchMedia("(max-width: 899px)").matches;
    const io = new IntersectionObserver((poster) => poster.forEach((p) => { if (p.isIntersecting) vis(tekster.indexOf(p.target)); }),
      { rootMargin: smal ? "-58% 0px -24% 0px" : "-45% 0px -45% 0px" });
    tekster.forEach((t) => io.observe(t));
  });

  // Læse-scenen: følger rullet frem og tilbage; linjen glider ned, og hvert felt bliver læst, når linjen passerer det
  document.querySelectorAll("[data-laes]").forEach((laes) => {
    const linje = laes.querySelector(".laes-linje");
    const felter = [...laes.querySelectorAll(".laes-felt")];
    const raekker = [...laes.querySelectorAll(".laes-raekke")];
    const beloeb = laes.querySelector("[data-beloeb]");
    const forslag = laes.querySelector(".laes-forslag"), status = laes.querySelector(".laes-status");
    const kr = (v) => v.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let maal = 0;
    const tegn = () => {
      const r = laes.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
      const y = 4 + Math.min(1, p / .7) * 50;                       // linjen: 4 % til 54 % af arket
      linje.style.top = y + "%";
      linje.style.opacity = p < .74 ? 1 : 0;
      felter.forEach((f, i) => {
        const laest = y >= +f.dataset.y;
        f.classList.toggle("laest", laest);
        raekker[i].classList.toggle("laest", laest);
      });
      // Beløbet tæller op, mens linjen passerer I ALT
      const iAlt = felter.find((f) => f.dataset.felt === "beloeb");
      const andel = Math.min(1, Math.max(0, (y - (+iAlt.dataset.y - 3)) / 4));
      beloeb.textContent = kr(1500 * andel) + " kr.";
      forslag.classList.toggle("vist", p > .78);
      status.classList.toggle("ok", p > .9);
    };
    const paa = () => { cancelAnimationFrame(maal); maal = requestAnimationFrame(tegn); };
    addEventListener("scroll", paa, { passive: true });
    addEventListener("resize", paa);
    tegn();
  });

  // Skyderen: bunken af kvitteringer vokser, prisen står stille og nikker for hver 50 bilag
  document.querySelectorAll("[data-regner]").forEach((rg) => {
    const skyder = rg.querySelector(".skyder"), antal = rg.querySelector("[data-antal]"), bunke = rg.querySelector(".bunke");
    const kort = rg.querySelector(".regner-pris"), pris = rg.querySelector("[data-pris]"), vaelg = rg.querySelector(".vaelger");
    const PRISER = { selv: 349, bogholder: 799 };
    const tal = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };  // fast "tilfældighed"
    let vist = 0, halvtreds = -1;
    const nik = () => { kort.classList.remove("nik"); void kort.offsetWidth; kort.classList.add("nik"); };
    const opdater = () => {
      const n = +skyder.value;
      antal.textContent = n;
      skyder.style.setProperty("--fyld", ((n - 10) / 490) * 100 + "%");
      const maal = Math.min(56, Math.ceil(n / 9));
      while (vist < maal) {
        const i = vist, el = document.createElement("i"), kol = i % 7, rk = Math.floor(i / 7);
        el.style.left = 4 + kol * 13 + (tal(i) - .5) * 7 + "%";
        el.style.bottom = rk * 11 + (tal(i + 50) - .5) * 4 + "%";
        el.style.setProperty("--r", (tal(i + 9) - .5) * 26 + "deg");
        bunke.appendChild(el); vist++;
      }
      while (vist > maal) { bunke.lastElementChild.remove(); vist--; }
      const h = Math.floor(n / 50);
      if (h !== halvtreds) { if (halvtreds >= 0) nik(); halvtreds = h; }
    };
    skyder.addEventListener("input", opdater);
    vaelg.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      vaelg.dataset.valgt = b.dataset.pakke;
      vaelg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      pris.textContent = PRISER[b.dataset.pakke]; nik();
    });
    opdater();
  });

  // Flytningen: spiller af sig selv, når den kommer i syne; "Se det igen" starter forfra
  document.querySelectorAll("[data-flyt]").forEach((fl) => {
    const linjer = [...fl.querySelectorAll(".flyt-liste li")];
    let timere = [];
    const spil = () => {
      timere.forEach(clearTimeout); timere = [];
      fl.classList.remove("i-gang", "faerdig"); linjer.forEach((l) => l.classList.remove("klar"));
      void fl.offsetWidth;
      fl.classList.add("i-gang");
      const start = 1300, trin = 520;  // startes altid af én selv, så den spiller også ved reduceret bevægelse
      linjer.forEach((l, i) => timere.push(setTimeout(() => l.classList.add("klar"), start + i * trin)));
      timere.push(setTimeout(() => fl.classList.add("faerdig"), start + linjer.length * trin + 300));
    };
    const traek = fl.closest("[data-traek]");
    if (!traek) { fl.querySelector(".flyt-igen").addEventListener("click", spil); iSyne(fl, spil, "-25%"); return; }
    // Træk filen ind: følg pointeren; slippes den over Tallo-vinduet (eller trykkes der), flytter historikken
    const fil = traek.querySelector(".traek-fil"), zone = fl.querySelector(".flyt-zone");
    let start = null;
    const over = (e) => { const r = zone.getBoundingClientRect(); return e.clientX > r.left - 30 && e.clientX < r.right + 30 && e.clientY > r.top - 30 && e.clientY < r.bottom + 30; };
    const tilbage = () => { fil.classList.remove("traekkes", "flyttet"); fil.style.transform = ""; };
    const flyt = () => {
      fil.classList.remove("traekkes"); fil.classList.add("flyttet"); fil.style.transform = ""; zone.classList.remove("over"); spil();
      // På mobil står Tallo-vinduet under filen: rul det i syne, så man ser historikken flytte ind
      const r = fl.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight) fl.scrollIntoView({ behavior: roligt ? "auto" : "smooth", block: r.height > innerHeight ? "start" : "center" });
    };
    fil.addEventListener("pointerdown", (e) => { start = { x: e.clientX, y: e.clientY, flyttede: false }; fil.setPointerCapture(e.pointerId); fil.classList.add("traekkes"); });
    fil.addEventListener("pointermove", (e) => {
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) start.flyttede = true;
      fil.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.max(-6, Math.min(6, dx / 40))}deg)`;
      zone.classList.toggle("over", over(e));
    });
    fil.addEventListener("pointerup", (e) => {
      if (!start) return;
      const klik = !start.flyttede; start = null;
      if (klik || over(e)) flyt(); else { tilbage(); zone.classList.remove("over"); }
    });
    fil.addEventListener("pointercancel", () => { start = null; tilbage(); zone.classList.remove("over"); });
    fil.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flyt(); } });
    fl.querySelector(".flyt-igen").addEventListener("click", () => {
      timere.forEach(clearTimeout); fl.classList.remove("i-gang", "faerdig"); linjer.forEach((l) => l.classList.remove("klar")); tilbage(); fil.focus();
    });
  });

  // Spørg os: tryk på et spørgsmål; den, der svarer, skriver et øjeblik, og svaret kommer
  document.querySelectorAll("[data-spoerg]").forEach((sp) => {
    const traad = sp.querySelector(".traad"), knapper = [...sp.querySelectorAll(".spoergsmaal-knapper button")];
    const FOLK = { othman: { navn: "Othman", billede: "/billeder/othman.webp" }, mohammed: { navn: "Mohammed", billede: "/billeder/mohammed.webp" } };
    const tilBund = () => { traad.scrollTop = traad.scrollHeight; };
    const svar = (hvem, tekst) => {
      const f = FOLK[hvem], el = document.createElement("div");
      el.className = "besked";
      el.innerHTML = `<img src="${f.billede}" alt=""><p class="boble ai"><span class="navn"></span></p>`;
      el.querySelector(".navn").textContent = f.navn;
      el.querySelector(".boble").append(tekst);
      return el;
    };
    knapper.forEach((k) => k.addEventListener("click", () => {
      knapper.forEach((x) => { x.disabled = true; });
      k.classList.add("stillet");
      const du = document.createElement("div");
      du.className = "besked du";
      du.innerHTML = '<p class="boble du"></p>';
      du.querySelector(".boble").textContent = k.textContent;
      traad.append(du); tilBund();
      const skriver = document.createElement("div");
      skriver.className = "besked";
      skriver.innerHTML = `<img src="${FOLK[k.dataset.hvem].billede}" alt=""><span class="skriver" aria-label="skriver"><i></i><i></i><i></i></span>`;
      setTimeout(() => { traad.append(skriver); tilBund(); }, 350);
      setTimeout(() => {
        skriver.remove();
        traad.append(svar(k.dataset.hvem, k.dataset.svar)); tilBund();
        knapper.forEach((x) => { x.disabled = false; });
      }, 1500 + Math.min(1200, k.dataset.svar.length * 8));
    }));
  });

  // Liste + panel: punkterne skifter skærmbilledet; skifter selv hvert 6. sekund, til man klikker
  document.querySelectorAll("[data-lp]").forEach((lp) => {
    const li = [...lp.querySelectorAll(".punkter li")];
    const knapper = li.map((l) => l.querySelector("button"));
    const billeder = [...lp.querySelectorAll(".lp-panel > [data-i]")];
    let auto = !roligt, timer = 0;
    const vis = (n) => {
      li.forEach((l, j) => { l.classList.toggle("aktiv", j === n); l.classList.remove("koerer"); });
      knapper.forEach((k, j) => k.setAttribute("aria-pressed", String(j === n)));
      billeder.forEach((b, j) => b.classList.toggle("vist", j === n));
      clearTimeout(timer);
      if (!auto) return;
      void li[n].offsetWidth;
      li[n].classList.add("koerer");
      timer = setTimeout(() => vis((n + 1) % li.length), 6000);
    };
    knapper.forEach((k, j) => k.addEventListener("click", () => { auto = false; vis(j); }));
    vis(0);
    if (auto) { clearTimeout(timer); li[0].classList.remove("koerer"); iSyne(lp, () => vis(0), "-20%"); }
  });

  // Pakkeblokken: vælgeren skifter pakke, regningen viser forskellen, og prisen ruller
  const vaelger = document.getElementById("vaelger");
  if (!vaelger) return;
  const pakker = document.getElementById("pakker");
  const demo = document.getElementById("demo");
  const hint = document.getElementById("demoHint");
  const pPris = document.getElementById("pPris");
  const PAKKER = {
    selv: { navn: "Gør det selv med AI", hvem: "Du trykker godkend. Appen gør resten.", pris: 349 },
    bogholder: { navn: "Med bogholder", hvem: "Vi bogfører. Du bogfører aldrig selv.", pris: 799 },
  };
  let pakke = "bogholder", demoTimer = 0, prisNu = 799, prisRaf = 0;
  function visTilstand(trin) {
    demo.dataset.trin = trin;
    const noegle = `${pakke} ${trin}`;
    demo.querySelectorAll(".tilstand").forEach((t) => t.classList.toggle("vist", t.dataset.vis === noegle));
    hint.textContent = pakke === "selv" && trin === "venter" ? "Prøv selv: tryk Godkend." : "";
  }
  function rulPris(til) {
    cancelAnimationFrame(prisRaf);
    const fra = prisNu, t0 = performance.now();
    const trin = (nu) => {
      const t = Math.min(1, (nu - t0) / 520), e = 1 - Math.pow(1 - t, 3);
      prisNu = Math.round(fra + (til - fra) * e);
      pPris.textContent = prisNu;
      if (t < 1) prisRaf = requestAnimationFrame(trin);
    };
    prisRaf = requestAnimationFrame(trin);
  }
  function vaelgPakke(navn) {
    pakke = navn;
    const P = PAKKER[navn];
    vaelger.dataset.valgt = navn;
    vaelger.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pakke === navn)));
    demo.dataset.pakke = navn;
    document.getElementById("pNavn").textContent = P.navn;
    document.getElementById("pHvem").textContent = P.hvem;
    pakker.querySelectorAll(".lister ul").forEach((ul) => { ul.hidden = ul.dataset.pakke !== navn; });
    rulPris(P.pris);
    // Tilmeldingen på forsiden følger med
    const radio = document.querySelector(`#tilmeld input[data-pakke="${navn}"]`);
    if (radio) { radio.checked = true; radio.dispatchEvent(new Event("change", { bubbles: true })); }
    clearTimeout(demoTimer);
    visTilstand("venter");
    // Med bogholder bogfører regningen sig selv; gør du det selv, venter den på dit tryk
    if (navn === "bogholder") demoTimer = setTimeout(() => visTilstand("bogfoert"), 1600);
  }
  vaelger.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b && b.dataset.pakke !== pakke) vaelgPakke(b.dataset.pakke); });
  document.getElementById("godkend").addEventListener("click", () => visTilstand("bogfoert"));
  document.getElementById("fortryd").addEventListener("click", () => visTilstand("venter"));
  visTilstand("venter");
  // Feltet glider ind, når det kommer i syne, og først da starter regningen
  if (!roligt) pakker.classList.add("js-vis");
  iSyne(pakker, () => { pakker.classList.add("inde"); vaelgPakke(pakke); }, "-25%");
})();
