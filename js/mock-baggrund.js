// Mockup B (16. okt 2026): én baggrund, der glider fra tone til tone med rullet. Hver region har sin tone i
// data-tone; inde i en region står tonen stille, og nær grænsen blandes den med naboen (afhænger kun af rullet).
(() => {
  const regioner = [...document.querySelectorAll("main .region[data-tone]")];
  if (!regioner.length) return;
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const toner = regioner.map((r) => rgb(r.dataset.tone));
  const bland = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const glat = (t) => t * t * (3 - 2 * t);
  const rod = document.documentElement;
  let sidst = "";
  const tegn = () => {
    const vh = innerHeight, midt = vh / 2, zone = vh * 0.45;
    let farve = toner[0];
    for (let i = 0; i < regioner.length; i++) {
      const r = regioner[i].getBoundingClientRect();
      if (midt < r.top && i === 0) break;
      if (midt >= r.top && midt < r.bottom || i === regioner.length - 1) {
        farve = toner[i];
        if (i > 0 && midt - r.top < zone) farve = bland(toner[i - 1], toner[i], glat(0.5 + (midt - r.top) / (2 * zone)));
        else if (i < regioner.length - 1 && r.bottom - midt < zone) farve = bland(toner[i], toner[i + 1], glat(0.5 - (r.bottom - midt) / (2 * zone)));
        break;
      }
    }
    const v = `rgb(${farve.join(",")})`;
    if (v !== sidst) { rod.style.setProperty("--bund", v); sidst = v; }
    venter = false;
  };
  let venter = false;
  const bed = () => { if (!venter) { venter = true; requestAnimationFrame(tegn); } };
  addEventListener("scroll", bed, { passive: true });
  addEventListener("resize", bed);
  tegn();
})();
