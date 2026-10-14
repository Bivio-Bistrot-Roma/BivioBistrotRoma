/**
 * Bivio Bistrot — galleria a tutto schermo (lightbox), in comune
 * ---------------------------------------------------------------------------
 * Script classico (niente moduli: funziona anche da file://). Stile in assets/galleria.css.
 *
 * window.BIVIO_GALLERIA.avvia(opzioni) -> { apri(i), aggiorna(), precarica(i) }, oppure null se manca il <dialog>.
 *  opzioni.dialog : il <dialog class="lightbox"> (struttura qui sotto)
 *  opzioni.foto   : function () -> elenco delle foto { src, srcSmall, width, height, alt, caption, en: {…} }
 *                   (di solito BIVIO_LOCALE.gallery)
 *  opzioni.testo  : function (foto, campo) -> testo nella lingua corrente (campi "alt" e "caption")
 *  opzioni.base   : prefisso dei percorsi delle foto: "" dalla radice del sito, "../" da una sottocartella
 *
 *  apri(i)      apre la foto i e porta il focus sul pulsante Chiudi; alla chiusura il focus torna a chi l'ha aperta.
 *               Senza <dialog> modale (browser molto vecchi) la foto si apre in una nuova scheda.
 *  aggiorna()   ridisegna didascalia e testo alternativo nella lingua corrente (da chiamare al cambio lingua).
 *  precarica(i) scarica in anticipo la foto i (es. al passaggio del mouse sulla miniatura).
 *  Mentre è aperta, <html> ha la classe "is-modal-open": la regola che blocca lo scorrimento è nel CSS del sito.
 *  Navigazione: frecce a schermo, frecce della tastiera, swipe; Esc, X o clic sullo sfondo chiudono.
 *
 * Struttura del <dialog> (le etichette aria vanno tradotte dal sito, come il resto della pagina):
 *  <dialog class="lightbox" aria-label="Foto del locale">
 *    <div class="lightbox__inner">
 *      <button type="button" class="lightbox__btn lightbox__close" aria-label="Chiudi">(icona)</button>
 *      <button type="button" class="lightbox__btn lightbox__prev" aria-label="Foto precedente">(icona)</button>
 *      <button type="button" class="lightbox__btn lightbox__next" aria-label="Foto successiva">(icona)</button>
 *      <figure class="lightbox__figure">
 *        <img class="lightbox__img" alt="" draggable="false">
 *        <figcaption class="lightbox__caption">
 *          <span class="lightbox__text"></span>
 *          <span class="lightbox__count" aria-live="polite"></span>
 *        </figcaption>
 *      </figure>
 *    </div>
 *  </dialog>
 */
(function () {
  "use strict";

  function avvia(opzioni) {
    var dialog = opzioni && opzioni.dialog;
    if (!dialog) return null;
    var base = opzioni.base || "";
    var stato = { index: 0, open: false };
    var pronta = false;
    var opener = null; // elemento che ha aperto la galleria: riceve il focus alla chiusura

    function elenco() {
      var f = opzioni.foto();
      return f && f.length ? f : [];
    }

    function testo(g, campo) {
      return (opzioni.testo ? opzioni.testo(g, campo) : g[campo]) || "";
    }

    /**
     * Sceglie la versione della foto: -800 (srcSmall) se basta ai pixel fisici che il riquadro
     * (92vw x 80vh, come .lightbox__img) può mostrare, altrimenti -1600 (src).
     */
    function sorgente(g) {
      if (!g.width || !g.height) return base + g.src;
      var boxW = window.innerWidth * 0.92;
      var boxH = window.innerHeight * 0.80;
      var s = Math.min(boxW / g.width, boxH / g.height, 1);
      var needed = s * Math.max(g.width, g.height) * (window.devicePixelRatio || 1);
      return base + ((g.srcSmall && needed <= 800) ? g.srcSmall : g.src);
    }

    function precarica(i) {
      var g = elenco()[i];
      if (g) new Image().src = sorgente(g);
    }

    /** Mostra la foto i (ciclico). istantanea = senza dissolvenza. */
    function mostra(i, istantanea) {
      var items = elenco();
      if (!items.length) return;
      var n = items.length;
      stato.index = ((i % n) + n) % n;
      var g = items[stato.index];
      var img = dialog.querySelector(".lightbox__img");
      var didascalia = testo(g, "caption");
      dialog.querySelector(".lightbox__text").textContent = didascalia;
      dialog.querySelector(".lightbox__count").textContent = (stato.index + 1) + " / " + n;
      img.alt = testo(g, "alt") || didascalia;
      var voluta = sorgente(g);
      if (img.getAttribute("src") !== voluta) {
        if (!istantanea) img.classList.add("is-loading");
        img.onload = img.onerror = function () { img.classList.remove("is-loading"); };
        img.src = voluta;
        if (img.complete) img.classList.remove("is-loading");
      }
      // Precarica le vicine per una navigazione fluida
      precarica((stato.index + 1) % n);
      precarica((stato.index - 1 + n) % n);
    }

    function apri(i) {
      var items = elenco();
      if (!items[i]) return;
      if (typeof dialog.showModal !== "function") {
        window.open(base + items[i].src, "_blank", "noopener");
        return;
      }
      prepara();
      opener = document.activeElement;
      stato.index = i;
      stato.open = true;
      dialog.querySelector(".lightbox__img").removeAttribute("src");
      document.documentElement.classList.add("is-modal-open");
      try { dialog.showModal(); } catch (e) {
        stato.open = false;
        document.documentElement.classList.remove("is-modal-open");
        window.open(base + items[i].src, "_blank", "noopener");
        return;
      }
      mostra(i, true);
      dialog.querySelector(".lightbox__close").focus({ preventScroll: true });
    }

    function aggiorna() {
      if (stato.open) mostra(stato.index, true);
    }

    /** Listener: registrati una sola volta, alla prima apertura. */
    function prepara() {
      if (pronta) return;
      pronta = true;
      dialog.querySelector(".lightbox__close").addEventListener("click", function () { dialog.close(); });
      dialog.querySelector(".lightbox__prev").addEventListener("click", function () { mostra(stato.index - 1); });
      dialog.querySelector(".lightbox__next").addEventListener("click", function () { mostra(stato.index + 1); });

      // Alla chiusura (Esc, X o sfondo): sblocca lo scroll e riporta il focus all'elemento che ha aperto
      dialog.addEventListener("close", function () {
        stato.open = false;
        document.documentElement.classList.remove("is-modal-open");
        if (opener && document.contains(opener) && typeof opener.focus === "function") {
          opener.focus({ preventScroll: true });
        }
        opener = null;
      });

      dialog.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { e.preventDefault(); mostra(stato.index - 1); }
        else if (e.key === "ArrowRight") { e.preventDefault(); mostra(stato.index + 1); }
      });

      // Swipe orizzontale (touch/penna); soglia 40px, prevale l'asse orizzontale
      var startX = null, startY = 0, swiped = false;
      dialog.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse") return;
        startX = e.clientX; startY = e.clientY; swiped = false;
      });
      dialog.addEventListener("pointerup", function (e) {
        if (startX === null) return;
        var dx = e.clientX - startX, dy = e.clientY - startY;
        startX = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          swiped = true;
          mostra(stato.index + (dx < 0 ? 1 : -1));
        }
      });
      dialog.addEventListener("pointercancel", function () { startX = null; });

      // Clic sullo sfondo (fuori da foto, didascalia e pulsanti) chiude
      dialog.addEventListener("click", function (e) {
        if (swiped) { swiped = false; return; }
        if (e.target.closest("button, .lightbox__img, .lightbox__caption")) return;
        dialog.close();
      });
    }

    return { apri: apri, aggiorna: aggiorna, precarica: precarica };
  }

  window.BIVIO_GALLERIA = Object.freeze({ avvia: avvia });
})();
