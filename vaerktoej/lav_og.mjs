// Laver delingsbilledet og.png (1200 × 630) ud fra forsidens egen top: fotoet med appen på laptoppen.
// Kræver at hjemmeside/ serveres lokalt:  python -m http.server 8779 --directory hjemmeside
// Kør:  node hjemmeside/vaerktoej/lav_og.mjs   (Playwright hentes fra Tallo/site/node_modules)
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
const require = createRequire("C:/Claude/Tallo/site/package.json");
const { chromium } = require("playwright");

const ud = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "og.png");
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.goto("http://127.0.0.1:8779/", { waitUntil: "networkidle" });
await p.addStyleTag({ content: `
  .nav-links, .nav-hoejre, .bjaelke, .knapper { display: none !important; }
  .nav { background: none !important; box-shadow: none !important; padding: 0 48px; height: 96px; }
  .logo { font-size: 30px; }
  .top-tekst { top: 92px !important; }
  .top-tekst h1 { font-size: 66px; }
  .top-tekst .ingress { margin-top: 14px; font-size: 32px; font-weight: 500; color: #4b3aa6; max-width: none; }
` });
await p.evaluate(() => {
  document.querySelector(".top-tekst .ingress").textContent = "Fra 500 kr. om måneden.";
  dispatchEvent(new Event("resize"));
});
await p.waitForTimeout(800);
await p.screenshot({ path: ud });
await b.close();
console.log("skrevet", ud);
