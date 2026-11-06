# tallo.dk

Hjemmesiden for Tallo, bogføring for små virksomheder. Statiske HTML-filer
på GitHub Pages. Ingen byggetrin: ret filen, commit, push.

- `index.html`: forsiden
- `privatliv/`, `vilkaar/`, `databehandleraftale/`: juridiske udkast
- `fonts/`, `js/`: Geist og GSAP ligger lokalt. Siden henter kun fra en
  tredjepart, når man selv klikker på "Hellere en snak?" (Cal.com)
- `vaerktoej/og.html`: skabelon til delingsbilledet `og.png` (1200 x 630)

Siderne i `INDEKSERET` (vaerktoej/undersider.py) er åbne for Google siden 6. nov 2026 og står i `sitemap.xml`. Møde-, kunde- og betalingssider og 404 har noindex og må ikke komme på listen.
