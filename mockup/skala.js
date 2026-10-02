// Skalerer computerskaermene ned, saa de kan ses hele paa en mindre skaerm (fx telefonen).
function skaler() {
  document.querySelectorAll(".skala").forEach((s) => {
    const sk = s.querySelector(".skaerm");
    const f = Math.min(1, s.clientWidth / 1280);
    sk.style.transform = `scale(${f})`;
    s.style.height = `${800 * f}px`;
  });
}
addEventListener("resize", skaler);
skaler();
