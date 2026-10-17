/* Tallo: fælles for forsiden og undersiderne. Menu, mobilmenu, booking (Cal.com), afsløring ved scroll og
   pakkeblokken. Forsidens zoom og tilmelding står i forsiden selv. */
(() => {
  const html = document.documentElement;
  const roligt = html.classList.contains("stille");

  // Skrivetilstand til sprogrettelser: ?ret tænder den for fanen; ellers hentes intet ekstra (js/ret.js)
  if (/[?&]ret(=|&|$)/.test(location.search)) sessionStorage.setItem("tallo-ret", "1");
  if (sessionStorage.getItem("tallo-ret")) {
    const s = document.createElement("script"); s.src = "/js/ret.js"; s.defer = true;
    addEventListener("load", () => document.head.appendChild(s));
  }

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
      // Målelinjen starter lige under menuen, når man står øverst, og glider ned til midten af skærmen, mens man ruller.
      // Ellers ligger den allerede under en kort top ved indlæsning, og toppens farve vises aldrig.
      const midt = Math.min(innerHeight / 2, 72 + scrollY), zone = innerHeight * 0.65;
      let i = afsnit.findIndex((a) => a.getBoundingClientRect().bottom > midt);
      if (i < 0) i = afsnit.length - 1;
      const r = afsnit[i].getBoundingClientRect(), h = (k) => afsnit[k].getBoundingClientRect().height;
      // Hver overgang er højst halvt så bred som afsnittene på hver side; ellers overlapper top- og bundovergangen i
      // et kort afsnit, og farven springer ved næste grænse (Othman 17. okt: "sygt mærkelige" farver på /om-os)
      // Første og sidste afsnit har kun én overgang og må bruge hele deres højde; de andre højst det halve
      const loft = (k) => (k === 0 || k === afsnit.length - 1 ? h(k) : h(k) / 2);
      const wTop = i > 0 ? Math.min(zone, loft(i - 1), loft(i)) : 0;
      const wBund = i < afsnit.length - 1 ? Math.min(zone, loft(i), loft(i + 1)) : 0;
      let farve = toner[i];
      if (wTop && midt - r.top < wTop) farve = bland(toner[i - 1], toner[i], glat(Math.max(0, 0.5 + (midt - r.top) / (2 * wTop))));
      else if (wBund && r.bottom - midt < wBund) farve = bland(toner[i], toner[i + 1], glat(Math.max(0, 0.5 - (r.bottom - midt) / (2 * wBund))));
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

  // Baggrundsdetaljer bag toppen (Othman 17. okt 2026, variant C): bilag driver ind i telefonen (/appen, loop);
  // papirerne sorterer sig i tre bunker (/ai) og linjen mellem jer tegnes (/om-os), én gang lige efter indlæsning.
  // Alt placeres med fast "tilfældighed" og uden om tekst og billeder. Ved reduceret bevægelse vises slutbilledet.
  document.querySelectorAll("[data-detalje]").forEach((region) => {
    const v = region.dataset.detalje;
    const lag = document.createElement("div");
    lag.className = "detalje"; lag.setAttribute("aria-hidden", "true");
    if (v === "sortering") lag.classList.add("lang");
    region.prepend(lag);
    const tal = (i) => { const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };
    const rel = (el, m = 0) => { const r = el.getBoundingClientRect(), g = region.getBoundingClientRect(); return { l: r.left - g.left - m, t: r.top - g.top - m, r: r.right - g.left + m, b: r.bottom - g.top + m }; };
    const bokse = (sel, m = 18) => [...region.querySelectorAll(sel)].filter((e) => e.getBoundingClientRect().width).map((e) => rel(e, m));
    const rammer = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
    const ny = (cls, tekst) => { const e = document.createElement("div"); e.className = cls; if (tekst) e.textContent = tekst; return e; };
    // Lægger et element et sted, hvor det ikke rammer undgå-boksene eller de andre; fjerner det, hvis der ikke er plads
    const placer = (e, undgaa, brugt, seed, kant = .1) => {
      lag.appendChild(e);
      const w = e.offsetWidth, h = e.offsetHeight, W = lag.clientWidth, H = lag.clientHeight;
      for (let j = 0; j < 900; j++) {
        const x = -w * kant + tal(seed * 97 + j * 2) * (W - w + 2 * w * kant), y = -h * kant + tal(seed * 89 + j * 2 + 1) * (H - h + 2 * h * kant);
        const b = { l: x, t: y, r: x + w, b: y + h };
        if (undgaa.some((u) => rammer(b, u)) || brugt.some((u) => rammer(b, { l: u.l - 14, t: u.t - 14, r: u.r + 14, b: u.b + 14 }))) continue;
        brugt.push(b); return b;
      }
      e.remove(); return null;
    };

    if (v === "bilag-ind") {
      const foto = region.querySelector(".top-foto"); if (!foto) return;
      const m = rel(foto), mx = (m.l + m.r) / 2, my = (m.t + m.b) / 2;
      const undgaa = bokse(".side-top.delt > div, .top-foto", 10), brugt = [];
      for (let i = 0; i < 12; i++) {
        const e = ny("d-bilag");
        e.style.setProperty("--r", (tal(i + 40) - .5) * 40 + "deg");
        const b = placer(e, undgaa, brugt, i + 30); if (!b) continue;
        e.style.left = b.l + "px"; e.style.top = b.t + "px";
        e.style.setProperty("--tx", mx - (b.l + b.r) / 2 + "px"); e.style.setProperty("--ty", my - (b.t + b.b) / 2 + "px");
        e.style.setProperty("--d", i * .75 + "s");
      }
    }

    if (v === "sortering") {
      // Selve overskriften og ingressen (ikke hele blokken, der er lige så bred som skærmen)
      const tb = [...region.querySelectorAll(".side-top h1, .side-top .ingress")].map((e) => {
        const rg = document.createRange(); rg.selectNodeContents(e);
        const r = rg.getBoundingClientRect(), g = region.getBoundingClientRect(), m = 14;
        return { l: r.left - g.left - m, t: r.top - g.top - m, r: r.right - g.left + m, b: r.bottom - g.top + m };
      });
      const tekst = { l: Math.min(...tb.map((x) => x.l)), t: Math.min(...tb.map((x) => x.t)), r: Math.max(...tb.map((x) => x.r)), b: Math.max(...tb.map((x) => x.b)) };
      const W = lag.clientWidth, mobil = innerWidth < 900;
      // Tre bunker til siden for overskriften (på mobil i kanterne ved siden af kvitteringen)
      const STAK = mobil ? [[.11 * W, tekst.b + 80], [.89 * W, tekst.b + 80], [.11 * W, tekst.b + 210]]
        : [[tekst.l * .45, tekst.b - 6], [W - (W - tekst.r) * .45, tekst.b - 6], [W - (W - tekst.r) * .8, tekst.t + 30]];
      const navne = ["Varer", "Husleje", "Moms"].map((t, k) => { const e = ny("d-bunke-navn", t); e.style.left = STAK[k][0] + "px"; e.style.top = STAK[k][1] + 26 + "px"; lag.appendChild(e); return e; });
      const brugt = [], papirer = [];
      for (let i = 0; i < 18; i++) {
        const e = ny("d-papir"), b = placer(e, [tekst], brugt, i + 70, .05); if (!b) continue;
        const k = i % 3, n = papirer.filter((p) => p.k === k).length;
        // Startpladsen sættes uden overgang; ellers glider papiret først derhen og vender midt i bevægelsen
        e.style.transition = "none";
        e.style.transform = `translate(${b.l}px, ${b.t}px) rotate(${(tal(i + 80) - .5) * 50}deg)`;
        e.style.setProperty("--d", papirer.length * .08 + "s");
        papirer.push({ e, k, slut: `translate(${STAK[k][0] - 15 + (tal(i) - .5) * 6}px, ${STAK[k][1] - 22 - n * 4}px) rotate(${(tal(i + 5) - .5) * 8}deg)` });
      }
      void lag.offsetWidth;
      const sorter = () => {
        papirer.forEach((p) => { p.e.style.transition = ""; });
        void lag.offsetWidth;
        papirer.forEach((p) => { p.e.style.transform = p.slut; });
        // Navnene kommer, når det sidste papir er landet
        setTimeout(() => navne.forEach((n) => n.classList.add("vist")), roligt ? 0 : 2400 + papirer.length * 80);
      };
      if (roligt) sorter(); else setTimeout(sorter, 600);
    }

    if (v === "linje") {
      const kort = [...region.querySelectorAll(".par .foto-kort")].map((e) => rel(e)); if (kort.length < 2) return;
      const W = lag.clientWidth, mobil = innerWidth < 700;
      const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), sti = document.createElementNS(NS, "path");
      svg.setAttribute("class", "d-svg" + (mobil ? " lodret" : "")); svg.appendChild(sti); lag.appendChild(svg);
      let MAERKER = [];
      if (!mobil) {
        const a = kort[0], b = kort[1], y = (a.t + a.b) / 2;
        // Er margenen for smal til et mærke, står det over portrættets yderste hjørne i stedet
        const venstre = a.l > 150 ? [a.l / 2, y - 10] : [a.l + 70, a.t - 30];
        const hoejre = W - b.r > 150 ? [b.r + (W - b.r) / 2, y - 20] : [b.r - 70, b.t - 30];
        const aftale = [(a.r + b.l) / 2, a.t - 30];
        // Linjen går gennem alle tre mærker (Catmull-Rom omsat til kubiske Bézier-kurver), så de sidder på den
        const P = [[-20, y + 40], venstre, aftale, hoejre, [W + 20, y + 30]];
        let d = `M ${P[0][0]} ${P[0][1]}`;
        for (let k = 0; k < P.length - 1; k++) {
          const p0 = P[Math.max(0, k - 1)], p1 = P[k], p2 = P[k + 1], p3 = P[Math.min(P.length - 1, k + 2)];
          d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
        }
        sti.setAttribute("d", d);
        MAERKER = [["Første snak", ...venstre, venstre[0] / W], ["Aftale", ...aftale, aftale[0] / W], ["Bogføring", ...hoejre, hoejre[0] / W]];
      } else {
        const x = W - 14;
        sti.setAttribute("d", `M ${x} ${kort[0].t} L ${x} ${kort[1].b}`);
      }
      const maerker = MAERKER.map(([t, x, y, ved]) => { const e = ny("d-maerke", t); e.style.left = x + "px"; e.style.top = y + "px"; e.style.setProperty("--d", .2 + ved * 2.2 + "s"); lag.appendChild(e); return e; });
      const tegn = () => { svg.classList.add("tegnet"); maerker.forEach((m) => m.classList.add("vist")); };
      if (roligt) tegn();
      else { void svg.getBoundingClientRect(); setTimeout(tegn, 300); }
    }
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

  // Skyderen: kvitteringerne lander i hele afsnittets baggrund rundt om kortet, mens man trækker; prisen står stille og
  // nikker for hver 50 bilag (Othman 17. okt 2026: papirerne som en del af baggrunden)
  document.querySelectorAll("[data-regner]").forEach((rg) => {
    const skyder = rg.querySelector(".skyder"), antal = rg.querySelector("[data-antal]");
    const flade = rg.closest(".region") || rg.parentElement, lag = flade.querySelector(".bilag-baggrund");
    const kort = rg.querySelector(".regner-pris"), pris = rg.querySelector("[data-pris]"), vaelg = rg.querySelector(".vaelger");
    const PRISER = { selv: 349, bogholder: 799 };
    const tal = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };  // fast "tilfældighed"
    let pladser = [], vist = 0, halvtreds = -1;
    // Faste pladser i procent af fladen; midten af et papir må ikke ligge langt inde bag kortet
    const beregn = () => {
      const f = flade.getBoundingClientRect(), k = rg.getBoundingClientRect(), ind = 60;
      const tekst = flade.querySelector(".side-top")?.getBoundingClientRect();
      const iBoks = (b, x, y, m) => b && x > b.left - f.left + m && x < b.right - f.left - m && y > b.top - f.top + m && y < b.bottom - f.top - m;
      // Ikke langt inde bag kortet og aldrig bag overskrift og ingres
      const bag = (x, y) => iBoks(k, x, y, ind) || iBoks(tekst, x, y, -40);
      pladser = [];
      for (let j = 0; pladser.length < 90 && j < 4000; j++) {
        const x = tal(j * 3 + 1) * f.width, y = tal(j * 3 + 2) * f.height;
        if (!bag(x, y)) pladser.push({ x: (x / f.width) * 100, y: (y / f.height) * 100, r: (tal(j * 3 + 3) - .5) * 40, s: 56 + tal(j + 7) * 28 });
      }
    };
    const laeg = (i) => {
      const p = pladser[i], el = document.createElement("i");
      el.style.left = p.x + "%"; el.style.top = p.y + "%";
      el.style.setProperty("--r", p.r + "deg"); el.style.setProperty("--s", p.s + "px");
      lag.appendChild(el);
    };
    const nik = () => { kort.classList.remove("nik"); void kort.offsetWidth; kort.classList.add("nik"); };
    const opdater = () => {
      const n = +skyder.value;
      antal.textContent = n;
      skyder.style.setProperty("--fyld", ((n - 10) / 490) * 100 + "%");
      const maal = Math.min(pladser.length, Math.ceil(n / 5.5));
      while (vist < maal) laeg(vist++);
      while (vist > maal) { lag.lastElementChild.remove(); vist--; }
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
    // Når bredden ændrer sig, lægges papirerne om (uden at lande igen)
    let bredde = innerWidth;
    addEventListener("resize", () => {
      if (Math.abs(innerWidth - bredde) < 40) return;
      bredde = innerWidth; beregn(); lag.replaceChildren(); vist = 0;
      opdater();
      lag.querySelectorAll("i").forEach((el) => { el.style.animation = "none"; });
    });
    beregn(); opdater();
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
    let skubTimer = 0;
    const stopSkub = () => { clearInterval(skubTimer); skubTimer = -1; fil.classList.remove("skub"); };
    if (!roligt) iSyne(traek, () => {
      if (skubTimer === -1) return;
      skubTimer = setInterval(() => { fil.classList.remove("skub"); void fil.offsetWidth; fil.classList.add("skub"); }, 3000);
    }, "-20%");
    ["pointerdown", "keydown", "focus"].forEach((t) => fil.addEventListener(t, stopSkub));
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

  // Spørgsmål og svar: svaret glider op og ned i stedet for at springe; "+" drejer til "×" i CSS. Man starter det selv,
  // så det spiller altid
  document.querySelectorAll("[data-faq] details").forEach((d) => {
    const summary = d.querySelector("summary"), svar = d.querySelector(".svar");
    let anim = null;
    const kurve = { duration: 340, easing: "cubic-bezier(.2,.7,.2,1)" };
    summary.addEventListener("click", (e) => {
      e.preventDefault();
      if (anim) anim.cancel();
      if (!d.open) {
        d.open = true;
        const h = svar.scrollHeight;
        anim = svar.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], kurve);
        anim.onfinish = () => { anim = null; };
      } else {
        const h = svar.offsetHeight;
        anim = svar.animate([{ height: h + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { ...kurve, duration: 260 });
        d.classList.add("lukker");
        anim.onfinish = () => { d.open = false; d.classList.remove("lukker"); anim = null; };
        anim.oncancel = () => d.classList.remove("lukker");
      }
    });
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
