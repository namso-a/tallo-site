/* Mailadresser står ikke i HTML'en, så robotter, der høster adresser, ikke finder dem.
   Uden JavaScript står der "kontakt (at) tallo.dk", som et menneske stadig kan læse. */
(() => {
  document.querySelectorAll("[data-u]").forEach((el) => {
    const adr = el.dataset.u + "@" + el.dataset.d;
    if (el.tagName === "FORM") { el.action = "mailto:" + adr; return; }
    if (el.tagName === "A") el.href = "mailto:" + adr;
    el.textContent = adr;
  });
})();
