"""Bygger tallo.dk's fælles dele og undersider.

    python vaerktoej/undersider.py

- Skriver hoved, menu, pakkeblok og footer ind i forsiden (index.html) mellem markørerne
  <!-- navn:start --> og <!-- navn:slut -->. Resten af forsiden er håndskrevet.
- Laver undersiderne /appen, /priser, /ai og /om-os helt (/skift er fjernet 24. okt 2026).
- Giver /privatliv ny menu og footer; indholdet mellem <!-- indhold:start/slut --> røres ikke.

Teksten bygger på den, Othman godkendte 7. okt 2026 (Tallo/.docs/design/tekst_2026-10-07.md), rettet 14. okt:
pakken hedder "Gør det selv med AI", Claude/ChatGPT står som "kommer senere", og AI-bogholderen ser kun undtagelserne.
Sprogregler i Tallo/CLAUDE.md: kundens sprog, ingen fagord, "fast pris", aldrig "vi hjælper".
"""
import re
from pathlib import Path

ROD = Path(__file__).resolve().parents[1]
DOMAENE = "https://tallo.dk"

CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline' https://app.cal.com; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' data: https://app.cal.com; font-src 'self'; connect-src 'self' "
       "https://nznqjlrknpbnfzizxnkr.supabase.co https://app.cal.com; frame-src https://app.cal.com https://cal.com; "
       "object-src 'none'; base-uri 'self'; form-action https://nznqjlrknpbnfzizxnkr.supabase.co mailto:")

MENU = [("/appen/", "Appen"), ("/priser/", "Priser"), ("/ai/", "AI"), ("/om-os/", "Om os")]
FOD_LINKS = [("/appen/", "Appen"), ("/priser/", "Priser"), ("/ai/", "Sådan bruger vi AI"), ("/om-os/", "Om os")]


def hoved(titel, beskrivelse, sti):
    return f"""<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="{CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="robots" content="noindex, nofollow">
<title>{titel}</title>
<meta name="description" content="{beskrivelse}">
<meta property="og:type" content="website">
<meta property="og:url" content="{DOMAENE}{sti}">
<meta property="og:title" content="{titel}">
<meta property="og:description" content="{beskrivelse}">
<meta property="og:image" content="{DOMAENE}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="da_DK">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preload" as="font" type="font/woff2" href="/fonts/geist.woff2" crossorigin>
<link rel="stylesheet" href="/css/tallo.css">
<script>document.documentElement.classList.add("zoom"); if (matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("stille");</script>"""


def menu(aktiv=None):
    def li(h, t):
        nu = ' aria-current="page"' if h == aktiv else ""
        return f'    <li><a href="{h}"{nu}>{t}</a></li>'
    smaa = "\n".join(li(h, t) for h, t in MENU)
    store = "\n".join(li(h, t) for h, t in [("/", "Forsiden")] + MENU)
    return f"""<nav class="nav" id="nav" aria-label="Hovedmenu">
  <a class="logo" href="/" aria-label="Tallo, til forsiden">tallo</a>
  <ul class="nav-links">
{smaa}
  </ul>
  <div class="nav-hoejre">
    <a class="pille farve" href="/#kom">Skriv dig op</a>
    <button class="menu-knap" id="menuKnap" type="button" aria-expanded="false" aria-controls="menuArk">Menu</button>
  </div>
</nav>
<div class="menu-ark" id="menuArk" role="dialog" aria-modal="true" aria-label="Menu" hidden>
  <div class="menu-top"><a class="logo" href="/">tallo</a><button class="menu-luk" type="button" aria-label="Luk menuen">×</button></div>
  <ul>
{store}
  </ul>
  <a class="pille farve" href="/#kom">Skriv dig op på 2 minutter</a>
  <p class="lille">Eller skriv til os: <a data-u="kontakt" data-d="tallo.dk" href="#">kontakt (at) tallo.dk</a></p>
</div>"""


def fod():
    links = "\n".join(f'        <li><a href="{h}">{t}</a></li>' for h, t in FOD_LINKS)
    return f"""<footer class="fod">
  <div class="fod-indre">
    <div>
      <a class="logo" href="/">tallo</a>
      <p>Bogføring for små virksomheder.</p>
    </div>
    <div>
      <span class="titel">Tallo</span>
      <ul>
{links}
      </ul>
    </div>
    <div>
      <span class="titel">Kontakt</span>
      <ul>
        <li><a data-u="kontakt" data-d="tallo.dk" href="#">kontakt (at) tallo.dk</a></li>
        <li><span>Damagervej 1E, 2. tv<br>8260 Viby J</span></li>
        <li><span>CVR 46440986</span></li>
        <li><a href="/privatliv/">Privatlivspolitik</a></li>
        <li><a href="/handelsbetingelser/">Handelsbetingelser</a></li>
        <li><a href="/databehandleraftale/">Databehandleraftale</a></li>
      </ul>
    </div>
  </div>
  <div class="kaempe" aria-hidden="true">tallo</div>
</footer>"""


def pakkeblok(overskrift=True, taet=False):
    """De to pakker som to store tal side om side (Othman 24. okt 2026, "Ét stort tal"). Tallene tæller op, når de kommer
    frem (js/tallo.js, [data-tael]). De fire linjer under hvert tal rammer et smertepunkt hver og står altid fremme
    (Othman 24. okt 2026); hover dæmper den anden side."""
    h2 = '\n      <h2>To pakker. Fast pris.</h2>' if overskrift else ""
    def side(navn, tal, vist, saet, punkter, anb=""):
        li = "".join(f"<li>{p}</li>" for p in punkter)
        return f"""<div class="stortal-side{anb}">
          <p class="stortal-navn">{navn}</p>
          <p class="stortal-tal" data-tael="{tal}">{vist}</p>
          <p class="stortal-md">kr. om måneden plus moms</p>
          <p class="stortal-saet">{saet}</p>
          <div class="stortal-detaljer"><ul>{li}</ul></div>
        </div>"""
    venstre = side("Gør det selv med AI", 500, "500", "AI'en hjælper. Du bogfører.", ["Slut med at taste: bank, mail og e‑faktura kommer ind af sig selv",
                   "AI'en finder kontoen og momsen, så du ikke skal kunne regnskab", "Du ser momsen og fristen længe før",
                   "Bliver det for meget, skifter du til bogholder fra måned til måned"])
    hoejre = side("Med bogholder", 1000, "1.000", "AI'en hjælper. Vi bogfører.", ["<b>Du rører ikke bogføringen, uanset hvor mange bilag du har</b>",
                  "Vi indberetter momsen for dig, før fristen",
                  "Din egen bogholder, som du kan skrive til og normalt får svar fra samme dag",
                  "Du ved, hvordan det går: salg, udgifter og overskud hver måned"], " anb")
    return f"""<section class="pakker{' taet' if taet else ''}" id="pakker">
    <div class="felt">{h2}
      <div class="stortal">
        {venstre}
        <div class="stortal-skille" aria-hidden="true"></div>
        {hoejre}
      </div>
      <div class="knapper">
        <a class="pille farve stor" href="/#kom">Skriv dig op</a>
        <a class="pille hvid stor" href="/priser/">Se hvad der er med</a>
      </div>
    </div>
  </section>"""


def baand(titel="Skriv dig op på 2 minutter.",
          tekst="Vi åbner, når programmet er registreret hos Erhvervsstyrelsen. Indtil da betaler du intet.",
          anden='<a class="pille hvid stor" href="/#kom" data-book>Hellere en snak?</a>'):
    return f"""<section class="baand" data-afslor>
    <h2>{titel}</h2>
    <p class="ingress">{tekst}</p>
    <div class="knapper">
      <a class="pille farve stor" href="/#kom">Skriv dig op</a>
      {anden}
    </div>
  </section>"""


def raek(nr, titel, tekst, billede, vendt=False, ekstra=""):
    return f"""<section class="raek{' vendt' if vendt else ''}" data-afslor>
    <div class="raek-tekst">
      <span class="nr" aria-hidden="true">{nr}</span>
      <h2>{titel}</h2>
      {tekst}{ekstra}
    </div>
    <div class="raek-billede">
      {billede}
    </div>
  </section>"""


def vindue(fil, alt, bredde=1800, hoejde=1000, maks=None):
    stil = f' style="max-width:{maks}px;margin-inline:auto"' if maks else ""
    return f'<figure class="vindue"{stil}><img src="/billeder/{fil}" alt="{alt}" width="{bredde}" height="{hoejde}" loading="lazy"></figure>'


def telefon(fil, alt):
    return f'<figure class="telefon"><img src="/billeder/{fil}" alt="{alt}" width="780" height="1688" loading="lazy"></figure>'


def side(sti, titel, beskrivelse, krop, ekstra_hoved=""):
    return f"""<!doctype html>
<html lang="da">
<head>
{hoved(titel, beskrivelse, sti)}{ekstra_hoved}
</head>
<body>
{menu(sti)}

<main>
  {krop}
</main>

{fod()}
<script src="/js/tallo.js"></script>
<script src="/js/mail.js"></script>
</body>
</html>
"""


# ---------------------------------------------------------------------------------------------------- /priser
JA, NEJ = '<span class="ja" aria-label="Med"></span>', '<span class="nej" aria-label="Ikke med">–</span>'
# Kun flueben, undtagen tilkøb (Othman 24. okt 2026: færre rækker, og "Du bogfører selv"/"Vi bogfører for dig" som rækker)
SAMMENLIGN = [
    ("Regninger og fakturaer kommer ind af sig selv", JA, JA),
    ("Ubegrænset antal bilag", JA, JA),
    ("Du bogfører selv", JA, NEJ),
    ("Vi bogfører for dig", NEJ, JA),
    ("Vi indberetter momsen", NEJ, JA),
    ("Overblik over salg, udgifter og overskud", JA, JA),
    ("Spørg din egen Claude eller ChatGPT", JA, JA),
    ("Løn, årsregnskab og selvangivelse", "Tilkøb", "Tilkøb"),
]
# Spørgsmål og svar: samme komponent tre steder, intet spørgsmål går igen (Othman 17. okt 2026). Forsiden har de
# vigtigste lige før tilmeldingen; /priser pris og vilkår; /om-os jer to. Tredje felt: hvem der svarer (portræt).
FAQ_FORSIDE = [
    ("Kan jeg stole på, at AI'en bogfører rigtigt?",
     "AI'en er god til det, den har set før, men den kan tage fejl. Derfor bærer den det tunge læs, og en bogholder "
     "kvalitetssikrer den. Også momsen, før den indberettes. Vælger du Gør det selv med AI, godkender du selv hvert "
     "forslag, og du kan opgradere når som helst."),
    ("Hvornår åbner I?", "Når vores program er registreret hos Erhvervsstyrelsen. Det kræver loven for de fleste virksomheder. "
     "Du kan skrive dig op nu, og vi skriver til dig, den dag vi åbner."),
    ("Er der binding?", "Nej. Du opsiger fra måned til måned."),
    ("Hvad skal jeg selv gøre?", "Koble din bank til med dit eget MitID, én gang. Derefter kommer regninger og fakturaer ind af sig "
     "selv. Har du betalt noget med egne penge, tager du et billede af kvitteringen i appen."),
    ("Hvor ligger mine data?", "I EU. Dine bilag bliver læst i EU og forlader ikke EU."),
]
FAQ_PRISER = [
    ("Kan jeg skifte pakke?", "Ja, fra måned til måned, begge veje."),
    ("Hvad koster tilkøbene?", "Det afhænger af din virksomhed. Du får prisen, før du siger ja."),
    ("Kommer jeg fra et andet program?", "Så flytter vi dig gratis. Din historik kommer med."),
]
FAQ_OM_OS = [
    ("Hvem er min bogholder?", "Det er mig, Othman. AI'en bærer det tunge læs, og jeg kvalitetssikrer den. Skal noget "
     "afklares, skriver jeg til dig.", "othman"),
    ("Hvem taler jeg med, før jeg siger ja?", "Mig, Mohammed. Den første snak er 30 minutter i telefonen eller på video, "
     "og du binder dig ikke.", "mohammed"),
    ("Hvad hvis jeg har et spørgsmål?", "Så skriver du det i appen. Jeg svarer normalt samme dag. Haster det, så skriv til <a data-u='kontakt' data-d='tallo.dk' href='#'>kontakt (at) tallo.dk</a>.", "othman"),
]
SVARER = {"othman": "Othman", "mohammed": "Mohammed"}


def faq(spoergsmaal, overskrift="Spørgsmål og svar"):
    """Spørgsmål og svar med overskriften over listen; js/tallo.js åbner og lukker svarene blødt ([data-faq])."""
    def et(sp):
        q, a, *hvem = sp
        svarer = (f'<p class="svarer"><img src="/billeder/{hvem[0]}.webp" alt="" width="400" height="400" loading="lazy">'
                  '</p>') if hvem else ""
        return f'        <details><summary>{q}</summary><div class="svar">{svarer}<p>{a}</p></div></details>'
    punkter = "\n".join(et(sp) for sp in spoergsmaal)
    return f"""<div class="faq">
      <h2>{overskrift}</h2>
      <div class="spoergsmaal" data-faq>
{punkter}
      </div>
    </div>"""


def priser():
    """Ét levende øjeblik: skyderen. Kvitteringerne lander i hele afsnittets baggrund, mens man trækker, og prisen står
    stille og nikker for hver 50 bilag (Othman 17. okt: papirerne som en del af baggrunden i stedet for et foto).
    Pakkedemoen bruges kun på forsiden, så den ikke gentages her."""
    raekker = "\n".join(f'          <tr><th scope="row">{a}</th><td>{b}</td><td class="valgt">{c}</td></tr>' for a, b, c in SAMMENLIGN)
    top = """<div class="side-top">
      <h1>Fast pris, uanset hvor mange bilag du har</h1>
    </div>"""
    regner = """<div class="bilag-baggrund" aria-hidden="true"></div>
    <div class="regner kort-over" data-regner>
      <div>
        <p class="antal"><b data-antal>40</b>bilag om måneden</p>
        <label class="sr" for="bilagAntal">Antal bilag om måneden</label>
        <input class="skyder" id="bilagAntal" type="range" min="10" max="500" step="10" value="40">
      </div>
      <div class="regner-scene" aria-hidden="true">
        <div class="regner-pris">
          <div class="vaelger" data-valgt="bogholder">
            <button type="button" data-pakke="selv" aria-pressed="false" tabindex="-1">Gør det selv med AI</button>
            <button type="button" data-pakke="bogholder" aria-pressed="true" tabindex="-1">Med bogholder</button>
            <span class="glider"></span>
          </div>
          <p class="belob"><span data-pris>1.000</span><small>kr.</small></p>
          <p class="fast-linje">om måneden, plus moms</p>
        </div>
      </div>
    </div>"""
    tabel = f"""<div class="indre">
      <div class="region-hoved midt" data-afslor><h2>Det hele, side om side</h2></div>
      <div class="tabel-ramme" data-afslor>
        <table class="sammenlign">
          <thead>
            <tr><th scope="col"><span class="sr">Hvad er med</span></th><th scope="col">Gør det selv med AI<small>500 kr. om måneden</small></th><th scope="col" class="valgt">Med bogholder<small>1.000 kr. om måneden</small></th></tr>
          </thead>
          <tbody>
{raekker}
          </tbody>
        </table>
      </div>
      <p class="smaat" style="color:var(--daempet)"><b style="color:var(--blaek)">Tilkøb:</b> årsrapport (ApS). Prisen får du, før du siger ja.</p>
    </div>"""
    spoerg = faq(FAQ_PRISER)
    slut = """<div class="indre udsagn" data-afslor>
      <h2>Ingen binding.</h2>
      <p>Skriv dig op nu. Du betaler først, når vi åbner, og du kan skifte pakke fra måned til måned.</p>
      <div class="knapper">
        <a class="pille farve stor" href="/#kom">Skriv dig op på 2 minutter</a>
        <a class="pille hvid stor" href="/#kom" data-book>Hellere en snak?</a>
      </div>
    </div>"""
    return side("/priser/", "Priser: Tallo", "To pakker, fast pris, ingen binding: Gør det selv med AI til 500 kr. eller Med bogholder til 1.000 kr. om måneden.",
                "\n\n  ".join([region("lilla top regner-region", top + "\n    " + regner), region("papir", tabel),
                                region("papir", spoerg), region("papir", slut)]))


# ---------------------------------------------------------------------------------------------------- /appen
# Ingen grøn og ingen blå (Othman 17. okt 2026): salvie og himmel er taget ud; orange (fersken) er den friske tone
TONER = {"papir": "#ffffff", "hvid": "#ffffff", "lilla": "#cdc3ff", "fersken": "#f8d9c4"}


def region(farve, indhold, ekstra=""):
    """Et afsnit i fuld bredde med sin tone (papir, hvid, lilla, fersken). Tonen står i data-tone, og
    js/tallo.js lader baggrunden glide fra tone til tone med rullet; uden JS har afsnittet tonen som flade.
    Regler (Othman 16. okt 2026): korte sider højst én tone ud over papir, lange højst to; sidste afsnit er altid
    papir, så footeren og det store tallo-logo står i deres rigtige farve."""
    tone = TONER[farve.split()[0]]
    return f'<section class="region {farve}" data-tone="{tone}"{ekstra}>\n    {indhold}\n  </section>'


def fotoramme(navn, fokus, fokus_mobil):
    """Ét foto pr. side i egen afrundet ramme; elementet efter det (klassen kort-over) lægger sig over fotoets nederste
    kant. Fotos fra Pexels (fri licens), kun hænder og ting. fokus/fokus_mobil: hvor motivet sidder (object-position)."""
    return (f'<figure class="fotoramme" style="--fp:{fokus};--fpm:{fokus_mobil}"><img src="/billeder/{navn}.webp" '
            f'srcset="/billeder/{navn}-1200.webp 1200w, /billeder/{navn}-1600.webp 1600w, /billeder/{navn}.webp 2400w" sizes="(max-width: 899px) 100vw, 1240px" '
            f'alt="" width="2400" height="1600" loading="lazy"></figure>\n    ')


def appen():
    """Ét levende øjeblik: telefonen står fast, mens fem korte tekster ruller forbi; hver skifter skærmen og sender et
    chip ud (Othman 15. okt: variation er noget, der sker, ikke flere farver). Fotoet i toppen: Jakub Żerdzicki
    (unsplash.com/photos/2MbXuj8PDrA) med appens mobilskærm lagt ind (.tmp/telefon_komp.py)."""
    top = """<div class="side-top delt">
      <div>
        <h1>Alt om forretningen i lommen.</h1>
        <p class="ingress">Se overskud, bank og moms, når du vil. Regninger og bilag kommer selv ind, så du ikke skal taste noget.</p>
        <div class="knapper">
          <a class="pille farve" href="/#kom">Skriv dig op på 2 minutter</a>
          <a class="pille hvid" href="/#kom" data-book>Hellere en snak?</a>
        </div>
      </div>
      <figure class="top-foto"><img src="/billeder/appen-top.webp" srcset="/billeder/appen-top-1000.webp 1000w, /billeder/appen-top-1400.webp 1400w, /billeder/appen-top.webp 2000w" sizes="(max-width: 899px) 100vw, 640px" alt="En hånd, der holder en telefon med Tallos app, i en lille forretning" width="2000" height="1334"></figure>
    </div>"""
    TRIN = [
        ("overblik", "Du ved, hvor du står", "Overskud i år, hvad du har på kontoen, og hvad kunderne skylder dig. Det er det første, du ser, når du åbner appen."),
        ("foer", "Regningen kommer selv", "En regning på mail eller en betaling i banken lander i appen af sig selv. Du skal ikke taste noget ind."),
        ("efter", "Og bliver bogført", "AI'en bogfører den, og med bogholder kvalitetssikrer vi. Gør du det selv, trykker du godkend."),
        ("scan", "En kvittering tager et øjeblik", "Tag et billede, så er den med. Har du betalt med egne penge, siger du det, når du scanner."),
        ("moms", "Momsen kommer ikke bag på dig", "Du ser beløbet og fristen længe før, og hvordan tallet er regnet. Med bogholder indberetter vi den for dig."),
    ]
    tekster = "\n".join(f"""        <div class="ts-tekst" data-skaerm="{s_}"><span class="nr" aria-hidden="true">{i + 1}</span><h2>{t}</h2><p>{b}</p></div>""" for i, (s_, t, b) in enumerate(TRIN))
    CHIPS = [
        ("-62%", "16%", '<span class="app-pille ok">+8 %</span><b>376.368 kr.</b> overskud i år'),
        ("-70%", "44%", '<span class="app-pille kat">Mail</span>Ny regning · Mejeriet Nord'),
        ("-58%", "52%", '<span class="app-pille ok">✓ Bogført</span>Bilag 225 · Varer og råvarer'),
        ("-46%", "74%", '<span class="app-pille graa">3 bilag klar</span>Sendt til Tallo'),
        ("-64%", "30%", '<span class="app-pille kat">Frist 1. december</span>At betale <b>70.080 kr.</b>'),
    ]
    chips = "\n".join(f'          <span class="ts-chip" data-trin="{i}" style="--x:{x};--y:{y}">{h}</span>' for i, (x, y, h) in enumerate(CHIPS))
    scene = f"""<div class="telefon-scene" data-telefon>
      <div class="ts-tekster">
{tekster}
      </div>
      <div class="ts-scene">
        <div class="ts-ramme">
          <div class="ts-telefon" role="img" aria-label="Tallos app på en telefon">
            <img data-s="overblik" class="vist" src="/billeder/app-mobil-2x.webp" alt="" width="780" height="1688">
            <img data-s="foer" src="/billeder/app-mobil-transaktioner-2x.webp" alt="" width="780" height="1688" loading="lazy">
            <img data-s="efter" src="/billeder/app-mobil-transaktioner-bogfoert-2x.webp" alt="" width="780" height="1688" loading="lazy">
            <img data-s="scan" src="/billeder/appen-scan.webp" alt="" width="780" height="1688" loading="lazy">
            <img data-s="moms" src="/billeder/app-mobil-moms-2x.webp" alt="" width="780" height="1688" loading="lazy">
            <span class="markering" aria-hidden="true"></span>
          </div>
{chips}
        </div>
      </div>
    </div>"""
    # Uden foto og kort, kun overskrift og én knap (Othman 18. okt 2026)
    udsagn = """<div class="indre udsagn" data-afslor>
      <h2>Se dine egne tal, den dag vi åbner.</h2>
      <div class="knapper">
        <a class="pille farve stor" href="/#kom">Skriv dig op</a>
      </div>
    </div>"""
    return side("/appen/", "Appen: Tallo", "Overskud, bank, bilag, fakturaer og moms ét sted. På telefonen og på computeren.",
                "\n\n  ".join([region("fersken top", top, ' data-detalje="bilag-ind"'), region("papir", scene), region("papir", udsagn)]))


# ---------------------------------------------------------------------------------------------------- /ai
def ai():
    """Ét levende øjeblik: kvitteringen bliver læst, mens man ruller (følger rullet frem og tilbage). Felternes placering
    på kvitteringen er målt på et gitter (ai-kvittering.webp, 540 × 950)."""
    top = """<div class="side-top">
      <h1>AI'en bærer det tunge læs.<br>En bogholder kvalitetssikrer.</h1>
    </div>"""
    # (felt, venstre, top, bredde, højde, linjens udløser) i procent af arket
    FELTER = [("fra", 10, 7.9, 45, 4.4, 10), ("varer", 11, 18, 57, 15.6, 22), ("beloeb", 13.5, 35.8, 56, 4.8, 38),
              ("moms", 14, 39.8, 56, 4.4, 42), ("dato", 15, 47, 38, 4.4, 49)]
    felter = "\n".join(f'            <span class="laes-felt" data-felt="{f}" data-y="{u}" style="left:{l}%;top:{t}%;width:{b}%;height:{h}%"></span>' for f, l, t, b, h, u in FELTER)
    RAEKKER = [("Fra", "Bagergrossisten A/S"), ("Varer", "Mel, sukker, gær og smør"), ("Beløb", '<span data-beloeb>0,00 kr.</span>'),
               ("Moms", "300,00 kr."), ("Dato", "14. okt. 2026")]
    raekker = "\n".join(f'          <div class="laes-raekke"><span>{a}</span><b>{v}</b><span class="app-pille ok">✓</span></div>' for a, v in RAEKKER)
    scene = f"""<div class="laes" data-laes>
      <div class="laes-scene">
        <div class="region-hoved midt laes-hoved">
          <h2>Den læser dine bilag</h2>
          <p>Afsender, beløb, moms og dato. Alt i EU.</p>
        </div>
        <div class="laes-papir">
          <div class="ark">
            <img src="/billeder/ai-kvittering.webp" alt="Kvittering fra Bagergrossisten A/S på 1.500 kr. med 300 kr. i moms, 14. oktober 2026" width="540" height="950">
{felter}
            <span class="laes-linje" aria-hidden="true"></span>
          </div>
        </div>
        <div>
          <div class="laes-kort" aria-live="polite">
            <p class="lk-titel"><span>Ny kvittering</span><span class="laes-status"><span class="app-pille graa"><i class="snurre" aria-hidden="true"></i>Læser</span><span class="app-pille ok ok">✓ Bogført</span></span></p>
{raekker}
            <p class="laes-forslag"><b>✦ Forslag: Varer og råvarer, 25 % moms</b>Bagergrossisten A/S er bogført som varekøb i alle tidligere bilag.</p>
          </div>
        </div>
      </div>
    </div>"""
    # Bogholder og moms i ét afsnit med et menneske i stedet for en liste (Othman 17. okt 2026)
    bogholder = """<div class="indre bogholder-blok" data-afslor>
      <div class="bb-tekst">
        <h2>Din bogholder hedder Othman</h2>
        <p class="ingress">AI'en er hurtig og god til det, den har set før, men den kan tage fejl. Derfor kvalitetssikrer en bogholder den, også momsen, før den indberettes. Gør du det selv med AI, godkender du selv hvert forslag.</p>
        <div class="knapper">
          <a class="pille farve stor" href="/#kom">Skriv dig op på 2 minutter</a>
          <a class="pille hvid stor" href="/#kom" data-book>Hellere en snak?</a>
        </div>
      </div>
      <figure class="bb-person">
        <img src="/billeder/othman.webp" alt="Othman Ajjawi" width="400" height="400" loading="lazy">
        <figcaption><b>Othman Ajjawi</b><span>Din bogholder</span></figcaption>
      </figure>
    </div>"""
    # Samtalen ligner en rigtig AI-chat; den kommer frem én gang, når den ses (js/tallo.js, [data-ai-chat]).
    # Ingen Claude- eller ChatGPT-logoer: begge kræver godkendelse på forhånd; navnene må stå som tekst (19. okt 2026)
    chat = """<div class="indre">
      <div class="region-hoved midt" data-afslor>
        <h2>Spørg din egen Claude eller ChatGPT</h2>
        <p>Forbind din egen AI i appen under Indstillinger, Din AI. Den kan læse dine tal og lave fakturaudkast, men aldrig bogføre, indberette moms eller slette noget.</p>
      </div>
      <div class="ai-chat" data-ai-chat>
        <div class="ac-top">
          <span class="ac-ikon" aria-hidden="true">✦</span>
          <span><b>Din egen AI</b><small>Forbundet til Tallo · kan læse dine tal</small></span>
        </div>
        <div class="ac-traad">
          <div class="ac-besked du"><p>Hvad er mit overskud i år?</p></div>
          <div class="ac-besked ai"><span class="ac-ikon" aria-hidden="true">✦</span><div>
            <p class="ac-vaerktoej"><i class="snurre" aria-hidden="true"></i><span class="ok" aria-hidden="true">✓</span>Læser dine tal i Tallo</p>
            <div class="ac-svar"><p>Dit overskud i år er <b>376.368 kr.</b> Det er 8 % mere end på samme tid sidste år.</p></div>
          </div></div>
          <div class="ac-besked du"><p>Lav en faktura til Café Rosengården på 12 kager.</p></div>
          <div class="ac-besked ai"><span class="ac-ikon" aria-hidden="true">✦</span><div>
            <p class="ac-vaerktoej"><i class="snurre" aria-hidden="true"></i><span class="ok" aria-hidden="true">✓</span>Laver et udkast i Tallo</p>
            <div class="ac-svar"><p>Udkastet ligger klar. Du sender det selv, når du har set det.</p>
              <div class="ac-kort"><span class="app-pille graa">Udkast</span><b>Faktura til Café Rosengården</b><small>12 kager · 1.440,00 kr. plus moms</small><span class="ac-aabn">Åbn i Tallo →</span></div>
            </div>
          </div></div>
        </div>
        <div class="ac-felt" aria-hidden="true"><span>Spørg om dine tal …</span><i>↑</i></div>
      </div>
    </div>"""
    return side("/ai/", "Sådan bruger vi AI: Tallo", "AI'en læser dine bilag i EU og bogfører det, der ligner det, den har set før. Alt usædvanligt ser et menneske på.",
                "\n\n  ".join([region("lilla top", top, ''), region("papir laes-region", scene), region("papir", bogholder),
                                region("papir", chat)]))


# ---------------------------------------------------------------------------------------------------- /om-os
def om_os():
    return side("/om-os/", "Om os: Tallo", "Tallo er Othman og Mohammed. AI'en bærer det tunge læs, og en bogholder kvalitetssikrer det.", """<section class="region fersken top" data-tone="#f8d9c4" data-detalje="linje">
  <div class="side-top">
    <h1>Tallo er Othman og Mohammed.</h1>
  </div>

  <div data-falder>
    <div class="par bred">
      <div class="person">
        <div class="ramme">
          <div class="foto-kort"><img src="/billeder/mohammed.webp" alt="Mohammed Chahrour" width="400" height="400"></div>
        </div>
        <h3>Mohammed Chahrour</h3>
        <p class="rolle">Kunder og aftaler</p>
        <p class="om">Mohammed er ved at afslutte sin kandidatgrad i jura. Han tager den første snak med dig, sørger for aftalerne og at alt er som det skal være.</p>
      </div>
      <div class="person">
        <div class="ramme">
          <div class="foto-kort"><img src="/billeder/othman.webp" alt="Othman Ajjawi" width="400" height="400"></div>
        </div>
        <h3>Othman Ajjawi</h3>
        <p class="rolle">Bogføring og teknik</p>
        <p class="om">Othman har en kandidatgrad i erhvervsøkonomi og arbejder til daglig med økonomi, data og AI. Han holder øje med dine tal og skriver til dig, hvis noget skal afklares.</p>
      </div>
    </div>
  </div>
  </section>

  <section class="region papir" data-tone="#ffffff">
    """ + faq(FAQ_OM_OS) + """
  </section>

  """ + baand())


# ---------------------------------------------------------------------------------------------------- /privatliv
JURIDISK_CSS = """
<style>
  /* Privatlivspolitikken (forenklet 17. okt 2026); indholdet står mellem indhold-markørerne i siden */
  .juridisk { width: min(720px, calc(100% - 40px)); margin: calc(var(--nav) + 56px) auto 96px; }
  .juridisk .udkast { margin: 0 0 28px; padding: 12px 16px; border-radius: 12px; background: #ffe9e4; color: #b42d17; font-size: 14px; font-weight: 500; }
  .juridisk h1 { margin: 8px 0 16px; font-size: clamp(32px, 4vw, 44px); }
  .juridisk .ind { margin: 0 0 40px; font-size: 18px; color: var(--daempet); }
  .juridisk h2 { margin: 40px 0 10px; font-size: 22px; font-weight: 560; letter-spacing: -.02em; }
  .juridisk p, .juridisk li { font-size: 16.5px; line-height: 1.6; }
  .juridisk p { margin: 0 0 14px; }
  .juridisk ul, .juridisk ol { margin: 0 0 14px; padding-left: 22px; }
  .juridisk li { margin-bottom: 6px; }
  .juridisk a { color: var(--blaa); text-decoration: underline; text-underline-offset: 3px; }
  .juridisk .mono { font-size: 13px; font-weight: 500; color: var(--daempet); }
  .juridisk table { width: 100%; margin: 8px 0 18px; border-collapse: collapse; font-size: 15px; }
  .juridisk th, .juridisk td { padding: 10px 8px 10px 0; border-bottom: 1px solid var(--lineal); text-align: left; vertical-align: top; }
  .juridisk th { font-size: 13px; font-weight: 500; color: var(--daempet); }
  .juridisk mark.p { padding: 0 6px; border: 1px dashed var(--daempet); border-radius: 6px; background: transparent; color: var(--daempet); font-size: 12.5px; white-space: nowrap; }
  .juridisk .bund { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; margin-top: 56px; padding-top: 18px; border-top: 1px solid var(--lineal); color: var(--daempet); font-size: 14px; }
  .juridisk .note { margin: 0 0 24px; padding: 16px 18px; border-radius: 12px; background: #fff; box-shadow: inset 0 0 0 1px var(--lineal); color: var(--daempet); font-size: 15px; }
  .juridisk .note ul { margin: 6px 0 0; } .juridisk .note li { margin-bottom: 2px; font-size: 15px; }
  /* Mobil: hver række bliver et lille kort; kolonnens navn (data-label, sat af js/tallo.js) står over værdien */
  @media (max-width: 699px) {
    .juridisk table, .juridisk tbody, .juridisk tr, .juridisk td { display: block; }
    .juridisk thead, .juridisk tr:has(> th) { display: none; }
    .juridisk tr { padding: 12px 0; border-bottom: 1px solid var(--lineal); }
    .juridisk td { padding: 2px 0; border: 0; }
    .juridisk td:first-child { font-weight: 560; }
    .juridisk td[data-label]:not(:first-child)::before { content: attr(data-label); display: block; margin-top: 6px; font-size: 12.5px; font-weight: 500; color: var(--daempet); }
  }
  @media (max-width: 900px) { .juridisk mark.p { white-space: normal; } .juridisk table { display: block; overflow-x: auto; } }
</style>"""


def privatliv():
    fil = ROD / "privatliv" / "index.html"
    s = fil.read_text(encoding="utf-8")
    m = re.search(r"<!-- indhold:start -->(.*?)<!-- indhold:slut -->", s, re.S)
    if m:
        indhold = m.group(1)
    else:  # første gang: tag den gamle sides indhold (udkast-bjælken og <main>) og fjern den gamle menu
        start = s.index("</nav>") + len("</nav>")
        slut = s.index('<script src="../js/mail.js">')
        indhold = s[start:slut]
        indhold = indhold.replace("<main>", "").replace("</main>", "")
        indhold = re.sub(r'<div class="udkast"><div class="skal">(.*?)</div></div>', r'<p class="udkast">\1</p>', indhold, flags=re.S)
        indhold = indhold.replace('href="../', 'href="/')
    return side("/privatliv/", "Privatlivspolitik: Tallo", "Sådan behandler Tallo oplysninger om dig.",
                f'<div class="juridisk">\n<!-- indhold:start -->{indhold}<!-- indhold:slut -->\n</div>', JURIDISK_CSS)


# ---------------------------------------------------------------------------------------------------- /handelsbetingelser
HANDELSBETINGELSER = """
  <p class="mono">Handelsbetingelser</p>
  <h1>Betingelser for at være kunde hos Tallo</h1>
  <p class="ind">Kort fortalt: fast pris om måneden, ingen binding, og du betaler først, når vi åbner. Her står det, du skal vide.</p>

  <h2>Parterne og aftalen</h2>
  <p>Aftalen er mellem din virksomhed og Tallo v/ Othman Ajjawi, Damagervej 1E, 2. tv, 8260 Viby J, CVR 46440986. Tallo er kun for virksomheder, så reglerne for forbrugerkøb, fx fortrydelsesret, gælder ikke. Når du skriver dig op på hjemmesiden, har du ikke købt noget. Vi åbner, når vores regnskabsprogram er registreret hos Erhvervsstyrelsen. Aftalen begynder, når vi har åbnet, og du har bekræftet, at du vil i gang.</p>

  <h2>Pakkerne</h2>
  <ul>
    <li><b>Gør det selv med AI, 500 kr. om måneden:</b> regnskabsprogrammet og appen. Regninger og fakturaer kommer ind af sig selv, AI'en foreslår, hvor de skal hen, og du godkender selv. Momsen regnes ud, og du indberetter den selv.</li>
    <li><b>Med bogholder, 1.000 kr. om måneden:</b> alt fra Gør det selv med AI, og vi bogfører for dig, uanset hvor mange bilag du har. AI'en bærer det tunge læs, og en bogholder kvalitetssikrer bogføringen. Vi indberetter momsen for dig, og et menneske godkender den hver gang. Du får overblik over salg, udgifter og overskud hver måned.</li>
    <li><b>Tilkøb:</b> løn, årsregnskab, selvangivelse og årsrapport (ApS). Prisen får du, før du siger ja.</li>
  </ul>
  <p>Alle priser er plus moms og faste. De afhænger ikke af, hvor mange bilag du har. Du kan skifte pakke fra måned til måned.</p>

  <h2>Betaling</h2>
  <p>Du betaler månedsvis forud med 8 dages betalingsfrist. Betaler du for sent, kan vi holde pause med arbejdet, indtil betalingen er kommet, og opkræve rente efter renteloven. Vi kan regulere prisen én gang om året med 30 dages varsel.</p>

  <h2>Det, du skal gøre</h2>
  <ul>
    <li>Koble din bank til med dit eget MitID og forny samtykket, når banken beder om det. Forbindelsen kan kun læse og kan ikke flytte penge. Vi bruger aldrig dit MitID.</li>
    <li>Sende de bilag, der ikke kommer ind af sig selv, senest den 5. i måneden efter.</li>
    <li>Svare på vores spørgsmål om bilag, vi ikke kan placere, inden for rimelig tid.</li>
    <li>Oplyse hvem der ejer og tegner virksomheden, og hvad virksomheden laver, så vi ved, hvem vi indgår aftale med, og hvem der må handle på virksomhedens vegne.</li>
    <li>Med bogholder: give os adgang til Skattestyrelsens TastSelv, så vi kan indberette momsen.</li>
  </ul>

  <h2>Det, der ikke er med</h2>
  <ul>
    <li>Revision og erklæringer. Vi er bogholdere, ikke godkendte revisorer. Har din virksomhed pligt til revision, skal du selv vælge og betale en godkendt revisor. Vi leverer gerne grundlaget.</li>
    <li>Juridisk rådgivning og skatterådgivning ud over det, bogføringen kræver.</li>
    <li>Oprydning i bogføring fra før aftalen. Det kan vi tilbyde for sig.</li>
  </ul>

  <h2>Ansvar</h2>
  <p>Vi retter fejl, vi selv har begået, uden beregning. Vores samlede ansvar er begrænset til det, du har betalt i de seneste tre måneder, og vi hæfter ikke for indirekte tab som driftstab eller tabt fortjeneste. Vi hæfter heller ikke for fejl i systemer, vi ikke ejer, fx banker, betalingsudbydere og myndighedernes systemer, eller for forhold uden for vores kontrol. Begrænsningerne gælder ikke ved forsæt eller grov uagtsomhed.</p>
  <p>Sig til skriftligt, så snart du opdager en fejl, og senest tre måneder efter. Med Gør det selv med AI godkender og indberetter du selv og står selv inde for det. Efter loven er det altid din virksomhed, der har pligt til at bogføre rigtigt; vi udfører arbejdet, men pligten bliver hos dig.</p>

  <h2>Fortrolighed og data</h2>
  <p>Alt, vi ser i din virksomhed, er fortroligt, også når aftalen er slut. Dine data ligger i EU. Behandlingen af personoplysninger står i <a href="/databehandleraftale/">databehandleraftalen</a>, som du får, før vi begynder, og i <a href="/privatliv/">privatlivspolitikken</a>.</p>

  <h2>Opsigelse</h2>
  <p>Der er ingen binding. Begge parter kan opsige aftalen til udgangen af en måned. Kan vi ikke bekræfte, hvem der ejer og tegner virksomheden, kan vi opsige med det samme. Har du betalt for en periode, vi ikke når at levere, får du pengene tilbage.</p>
  <p>Når aftalen slutter, får du hele din bogføring med bilag i standardformatet SAF-T, så en anden kan tage over. Loven kræver, at bogføringen gemmes i fem år; det gør vi for dig, og du kan få en kopi, når som helst i de fem år.</p>

  <h2>Ændringer og tvister</h2>
  <p>Vi kan ændre betingelserne med 30 dages varsel på mail. Er du uenig, kan du opsige aftalen til den dag, ændringen træder i kraft. Aftalen følger dansk ret. Kan vi ikke løse en uenighed ved at tale sammen, afgøres den ved Retten i Aarhus.</p>

  <div class="bund"><span>Version 1.1 · senest opdateret 20. oktober 2026</span><span>Tallo · CVR 46440986</span></div>
"""


def handelsbetingelser():
    """Handelsbetingelser (17. okt 2026): kort udgave af vilkår 0.4 (system/design/vilkaar), opdateret til de to pakker
    (500 og 1.000 kr.), AI-bogholderen og åbningen ved registreringen."""
    return side("/handelsbetingelser/", "Handelsbetingelser: Tallo",
                "Fast pris om måneden, ingen binding, og du betaler først, når vi åbner. Betingelserne for at være kunde hos Tallo.",
                f'<div class="juridisk">{HANDELSBETINGELSER}</div>', JURIDISK_CSS)


# ---------------------------------------------------------------------------------------------------- /databehandleraftale
# Fra system/docs/databehandleraftale.md (version 1.0, Othmans juridiske valg 19. okt 2026). Appens tilmelding linker
# hertil sammen med handelsbetingelserne og privatlivspolitikken. Ændres teksten dér, skal den også ændres her.
DATABEHANDLERAFTALE = """
  <p class="mono">Databehandleraftale</p>
  <h1>Databehandler&shy;aftale</h1>
  <p class="ind">Version 1.1, 20. oktober 2026. Skabelon; parterne og eventuelle tilkøb udfyldes pr. kunde ved tilmeldingen.</p>
  <p>Aftale efter databeskyttelsesforordningens artikel 28 mellem kunden som dataansvarlig og Tallo som databehandler. Den er en del af aftalen om at være kunde hos Tallo (handelsbetingelserne) og følger Datatilsynets standardstruktur.</p>

  <h2>1. Parterne</h2>
  <p>Den dataansvarlige: kunden, som angivet ved tilmeldingen. Databehandleren: Tallo v/ Othman Ajjawi (enkeltmandsvirksomhed), CVR 46440986, Damagervej 1E, 2. tv, 8260 Viby J, <a data-u="kontakt" data-d="tallo.dk" href="#">kontakt (at) tallo.dk</a>.</p>

  <h2>2. Baggrund og formål</h2>
  <p>Databehandleren stiller sit regnskabsprogram og sin app til rådighed for den dataansvarlige. Med pakken Med bogholder bogfører og afstemmer databehandleren også, indberetter moms og udarbejder tal for den dataansvarlige, og ved tilkøb kører løn og udarbejder årsregnskab. I den forbindelse behandler databehandleren personoplysninger på den dataansvarliges vegne. Aftalen skal sikre, at behandlingen sker i overensstemmelse med databeskyttelsesforordningen og databeskyttelsesloven.</p>

  <h2>3. Den dataansvarliges rettigheder og forpligtelser</h2>
  <p>Den dataansvarlige har ansvaret for, at behandlingen har et lovligt grundlag, og for at give databehandleren en dokumenteret instruks. Instruksen er denne aftale med bilag A til C og handelsbetingelserne. Den dataansvarlige kan til enhver tid give yderligere skriftlig instruks.</p>

  <h2>4. Databehandleren handler efter instruks</h2>
  <p>Databehandleren behandler kun personoplysninger efter dokumenteret instruks fra den dataansvarlige, medmindre det kræves efter EU-retten eller dansk ret, som databehandleren er underlagt. I så fald underretter databehandleren den dataansvarlige om kravet, før behandlingen sker, medmindre loven forbyder det. Databehandleren underretter straks den dataansvarlige, hvis en instruks efter databehandlerens opfattelse er i strid med loven.</p>

  <h2>5. Fortrolighed</h2>
  <p>Kun personer, der har behov for adgang for at opfylde aftalen, får adgang til oplysningerne. Det er databehandleren og de personer, der arbejder for databehandleren (ansatte eller faste samarbejdspartnere). Alle er underlagt tavshedspligt efter aftale eller lov. Databehandleren fører en liste over de navngivne personer, der har adgang, og udleverer den på anmodning.</p>

  <h2>6. Behandlingssikkerhed</h2>
  <p>Databehandleren gennemfører passende tekniske og organisatoriske foranstaltninger, jf. artikel 32. Som minimum:</p>
  <ul>
    <li>Data ligger i EU, krypteret under overførsel og opbevaring, og hver kundes data er adskilt fra andres. Der tages dagligt krypteret sikkerhedskopi hos en anden leverandør i EU, låst mod sletning, og gendannelse afprøves.</li>
    <li>Databehandlerens medarbejdere logger ind med to-faktor-godkendelse. Hvert opslag og hver ændring logges i en log, der ikke kan slettes eller ændres.</li>
    <li>Med Gør det selv med AI godkender den dataansvarlige selv AI'ens forslag, før de bogføres. Med bogholder bogfører AI'en efter faste regler i programmet. Poster, der rammer en undtagelse (fx ny leverandør, beløb over en grænse, moms der ikke passer, eller lav sikkerhed), ses af en bogholder, og der tages stikprøver. Hver postering logges med tidspunkt, hvem eller hvad der bogførte den, og begrundelse.</li>
    <li>Bankforbindelsen etablerer den dataansvarlige selv med sit eget MitID hos banken. Forbindelsen kan kun læse og kan ikke flytte penge. Databehandleren bruger aldrig den dataansvarliges MitID.</li>
    <li>Hvor den dataansvarlige fortsat bruger sit eget regnskabsprogram, sker adgangen kun via brugere, som den dataansvarlige selv har inviteret, og med to-faktor-godkendelse.</li>
    <li>Lønoplysninger ligger i databehandlerens lønsystem (Salary) under den dataansvarliges CVR, når løn er tilkøbt, og overdrages til den dataansvarlige ved aftalens ophør.</li>
    <li>Databehandleren opbevarer ikke kopier lokalt ud over det, en konkret behandling kræver, og sletter dem, når behandlingen er afsluttet. Arbejdsstationer er krypterede, opdaterede og låst, når de ikke er i brug. Adgangskoder opbevares i en adgangskodeboks.</li>
  </ul>

  <h2>7. Underdatabehandlere</h2>
  <p>Den dataansvarlige giver en generel godkendelse til, at databehandleren bruger underdatabehandlere. Databehandleren underretter den dataansvarlige skriftligt senest 30 dage, før en ny underdatabehandler tages i brug, så den dataansvarlige kan gøre indsigelse. Databehandleren pålægger underdatabehandlere de samme forpligtelser som i denne aftale og hæfter over for den dataansvarlige for deres opfyldelse. De godkendte underdatabehandlere står i bilag B. Gør den dataansvarlige indsigelse inden for fristen, og fastholder databehandleren underdatabehandleren, kan den dataansvarlige opsige aftalen med virkning fra den dag, underdatabehandleren tages i brug.</p>

  <h2>8. Overførsel til tredjelande</h2>
  <p>Databehandleren overfører kun personoplysninger til lande uden for EU og EØS efter dokumenteret instruks og med et gyldigt overførselsgrundlag, jf. forordningens kapitel V. Grundlaget for hver underdatabehandler står i bilag B. Tilslutter den dataansvarlige selv en tjeneste til programmet, jf. bilag C, sker overførslen alene på den dataansvarliges instruks, og den dataansvarlige er ansvarlig for overførselsgrundlaget over for den pågældende tjeneste. Tjenesten er ikke en underdatabehandler og fremgår derfor ikke af bilag B.</p>

  <h2>9. Bistand til den dataansvarlige</h2>
  <p>Databehandleren bistår den dataansvarlige med at besvare anmodninger fra registrerede (artikel 12 til 22), med sikkerhed (artikel 32), med anmeldelse af brud (artikel 33 og 34) og med konsekvensanalyser (artikel 35 og 36), i det omfang det er relevant for behandlingen. Bistand ud over det, der følger af almindelig drift, faktureres efter medgået tid, efter aftale om prisen på forhånd.</p>

  <h2>10. Brud på persondatasikkerheden</h2>
  <p>Databehandleren underretter den dataansvarlige uden unødig forsinkelse og senest 24 timer efter at være blevet bekendt med et brud. Underretningen beskriver bruddets karakter, de berørte kategorier og antal, de sandsynlige konsekvenser og de foranstaltninger, der er truffet.</p>

  <h2>11. Sletning og tilbagelevering</h2>
  <p>Ved aftalens ophør udleverer databehandleren bogføringsmaterialet til den dataansvarlige i standardformatet SAF-T sammen med bilagene. Bogføringsloven kræver, at materialet opbevares i 5 år fra udgangen af det regnskabsår, det vedrører. Databehandleren opbevarer det derfor i regnskabsprogrammet, låst mod ændringer, også hvis den dataansvarlige ophører eller går konkurs, udleverer en kopi på anmodning i hele perioden og sletter det, når fristen er udløbet. Andre personoplysninger slettes eller tilbageleveres ved ophør, medmindre EU-retten eller dansk ret kræver opbevaring. Hvor den dataansvarlige har brugt sit eget regnskabsprogram, fjerner databehandleren sin adgang, og materialet dér berøres ikke.</p>

  <h2>12. Tilsyn</h2>
  <p>Databehandleren stiller alle oplysninger til rådighed, der er nødvendige for at påvise overholdelse af artikel 28, og giver mulighed for og bidrager til revisioner og inspektioner, som den dataansvarlige eller en revisor bemyndiget af denne udfører. Tilsyn varsles med 14 dage, medmindre en myndighed kræver andet.</p>

  <h2>13. Ikrafttræden og ophør</h2>
  <p>Aftalen træder i kraft sammen med aftalen om at være kunde og gælder, så længe databehandleren behandler personoplysninger på den dataansvarliges vegne. Aftalen kan ændres efter skriftlig aftale mellem parterne.</p>

  <h2>Bilag A: Oplysninger om behandlingen</h2>
  <table>
    <thead><tr><th>Formål</th><th>Drift af regnskabsprogram og app; bogføring, afstemning, momsangivelse, e-faktura, løn, årsregnskab og indberetning for den dataansvarlige, afhængigt af pakke og tilkøb.</th></tr></thead>
    <tbody>
      <tr><td>Behandlingens karakter</td><td>Registrering, systematisering, aflæsning af bilag med AI i EU, opbevaring, afsendelse af fakturaer og e-fakturaer, videregivelse til myndigheder efter lov.</td></tr>
      <tr><td>Kategorier af registrerede</td><td>Den dataansvarliges ansatte, kunder, leverandører og ejere, og de brugere, den dataansvarlige giver adgang til programmet.</td></tr>
      <tr><td>Kategorier af oplysninger</td><td>Navn, kontaktoplysninger, bankoplysninger, løn, pension, fravær, CPR-numre (ansatte, kun ved tilkøbt løn), og for brugere: login og log over opslag og ændringer. Oplysninger om kundens ejere og tegningsberettigede er ikke omfattet af denne aftale. Dem behandler Tallo som selvstændigt dataansvarlig for at kunne indgå og administrere aftalen, se privatlivspolitikken.</td></tr>
      <tr><td>Varighed</td><td>Så længe aftalen om at være kunde løber, og derefter i det omfang loven kræver opbevaring (punkt 11).</td></tr>
    </tbody>
  </table>

  <h2>Bilag B: Godkendte underdatabehandlere</h2>
  <table>
    <thead><tr><th>Navn</th><th>Behandling</th><th>Land og overførselsgrundlag</th></tr></thead>
    <tbody>
      <tr><td>Supabase Pte. Ltd. (Singapore; Supabase-koncernen)</td><td>Drift af regnskabsprogrammets database, login og bilagsarkiv</td><td>Data i EU (Irland eller Tyskland). Selskab uden for EU; EU's standardkontraktbestemmelser (Supabases DPA og overførselsvurdering)</td></tr>
      <tr><td>Hetzner Online GmbH</td><td>Driftsserver til automatiske kørsler: bank, e-faktura, sikkerhedskopi, tilsyn</td><td>Tyskland</td></tr>
      <tr><td>Scaleway SAS</td><td>Opbevaring af krypteret sikkerhedskopi (leverandøren kan ikke læse indholdet) og afsendelse af fakturaer og påmindelser på mail</td><td>Frankrig</td></tr>
      <tr><td>Amazon Web Services EMEA SARL</td><td>AI-bogføring (Claude via Amazon Bedrock): vurderer bilag og banklinjer og foreslår eller udfører bogføring efter programmets regler</td><td>Tyskland (Frankfurt). Amerikansk koncern; EU-US Data Privacy Framework og EU's standardkontraktbestemmelser</td></tr>
      <tr><td>Mistral AI SAS</td><td>Aflæsning af bilag: leverandør, beløb, moms og dato</td><td>Frankrig</td></tr>
      <tr><td>Enable Banking Oy</td><td>Bankforbindelse: henter kontooplysninger og posteringer med den dataansvarliges samtykke</td><td>Finland</td></tr>
      <tr><td>Visma e-conomic A/S (Sproom)</td><td>Afsendelse og modtagelse af e-fakturaer gennem Nemhandel og Peppol</td><td>Holland og Irland (Microsoft Azure). Egne underleverandører i USA (Twilio: Data Privacy Framework; KMD EDI: standardkontraktbestemmelser)</td></tr>
      <tr><td>Cloudflare, Inc.</td><td>Modtagelse af bilag sendt til den dataansvarliges bilagsadresse, videresendt til regnskabsprogrammet</td><td>EU og USA; EU-US Data Privacy Framework</td></tr>
      <tr><td>Salary ApS</td><td>Lønberegning, lønsedler og indberetning til eIndkomst i den dataansvarliges CVR, når løn er tilkøbt</td><td>Danmark</td></tr>
      <tr><td>Zoho Corporation B.V.</td><td>Mail og dokumentudveksling</td><td>EU-datacenter</td></tr>
      <tr><td>Visma Dinero A/S eller Visma e-conomic A/S</td><td>Kun hvor den dataansvarlige fortsat bruger sit eget regnskabsprogram</td><td>Danmark</td></tr>
    </tbody>
  </table>

  <h2>Bilag C: Instruks om behandlingen</h2>
  <ul>
    <li>Bilag modtages via appen, den dataansvarliges bilagsadresse eller som e-faktura, læses automatisk i EU og bogføres i regnskabsprogrammet. Med Gør det selv med AI godkender den dataansvarlige selv. Med bogholder bogfører AI'en efter faste regler, og en bogholder ser undtagelserne (punkt 6).</li>
    <li>Bankposteringer hentes via bankforbindelsen, som den dataansvarlige selv har etableret med sit eget MitID. Samtykket fornyes af den dataansvarlige, når banken beder om det.</li>
    <li>Elektroniske fakturaer sendes og modtages via Nemhandel og Peppol i den dataansvarliges navn, når den dataansvarlige har accepteret tilmeldingen. Fakturaer og påmindelser på mail sendes kun, når den dataansvarlige har bedt om det.</li>
    <li>Løn køres i databehandlerens lønsystem (Salary) i den dataansvarliges CVR, når løn er tilkøbt. Timer og ændringer modtages fra den dataansvarlige; lønsedler sendes til de ansattes e-Boks.</li>
    <li>Moms og oplysningsskema indberettes aldrig uden forudgående afstemning og aldrig automatisk. Med bogholder opretter programmet et udkast hos Skattestyrelsen, og en person godkender det i TastSelv med rådgiveradgang fra den dataansvarlige. Med Gør det selv med AI indberetter den dataansvarlige selv.</li>
    <li>Forbinder den dataansvarlige sin egen AI-tjeneste til programmet, sendes de oplysninger, den dataansvarlige beder om, til den tjeneste. Forbindelsen kan kun læse tal og lave fakturaudkast; den kan ikke bogføre, indberette eller slette.</li>
    <li>Ingen personoplysninger overføres til andre systemer end dem i bilag B, medmindre den dataansvarlige selv har bedt om det.</li>
  </ul>

  <div class="bund"><span>Version 1.1 · 20. oktober 2026</span><span>Tallo · CVR 46440986</span></div>
"""


def databehandleraftale():
    return side("/databehandleraftale/", "Databehandleraftale: Tallo",
                "Aftalen om, hvordan Tallo behandler personoplysninger på din virksomheds vegne.",
                f'<div class="juridisk">{DATABEHANDLERAFTALE}</div>', JURIDISK_CSS)


# ---------------------------------------------------------------------------------------------------- forsiden
def erstat(s, navn, nyt):
    moenster = re.compile(rf"(<!-- {navn}:start -->)(.*?)(<!-- {navn}:slut -->)", re.S)
    assert moenster.search(s), f"markøren {navn} mangler i forsiden"
    return moenster.sub(lambda m: f"{m.group(1)}\n{nyt}\n{m.group(3)}", s, count=1)


def forside():
    fil = ROD / "index.html"
    s = fil.read_text(encoding="utf-8")
    s = erstat(s, "hoved", hoved("Tallo: aldrig mere bogføring",
                                 "Dine regninger og fakturaer kommer ind af sig selv. Vi bogfører dem for dig, eller du gør det selv med AI's hjælp. Fra 500 kr. om måneden.", "/"))
    s = erstat(s, "menu", menu("/"))
    s = erstat(s, "pakker", "  " + pakkeblok())
    s = erstat(s, "faq", '  <section class="faq-forside" id="faq">\n    ' + faq(FAQ_FORSIDE) + "\n  </section>")
    s = erstat(s, "fod", fod())
    fil.write_text(s, encoding="utf-8")


# ---------------------------------------------------------------------------------------------------- 404
def ikke_fundet():
    """Siden, GitHub Pages viser ved en adresse, der ikke findes (/404.html)."""
    top = """<div class="side-top">
      <h1>Siden findes ikke</h1>
      <p class="ingress">Måske er adressen skrevet forkert, eller også er siden flyttet.</p>
      <div class="knapper">
        <a class="pille farve stor" href="/">Til forsiden</a>
        <a class="pille hvid stor" href="/priser/">Se priserne</a>
      </div>
    </div>"""
    return side("/404.html", "Siden findes ikke: Tallo", "Siden findes ikke.", region("papir top ikke-fundet", top))


if __name__ == "__main__":
    (ROD / "404.html").write_text(ikke_fundet(), encoding="utf-8")
    print("skrevet 404")
    for navn, html in [("priser", priser()), ("appen", appen()), ("ai", ai()), ("om-os", om_os()), ("privatliv", privatliv()), ("handelsbetingelser", handelsbetingelser()), ("databehandleraftale", databehandleraftale())]:
        (ROD / navn).mkdir(exist_ok=True)
        (ROD / navn / "index.html").write_text(html, encoding="utf-8")
        print("skrevet", navn)
    forside()
    print("forsiden opdateret")
