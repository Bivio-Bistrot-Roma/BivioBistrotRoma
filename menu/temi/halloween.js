/* Tema Halloween del menu: comportamento (lo stile è in halloween.css).
 * Caricato solo con il tema acceso, dallo script in testa a menu/index.html, prima di script.js: qui si prepara soltanto
 * window.BIVIO_TEMA, senza toccare la pagina. script.js lo legge e:
 *   - gatto: personalizza il gatto del footer (mantelli, probabilità di passaggio, disegno in più, reazione al tocco);
 *   - avvia(aiuti): lo chiama dopo il sipario, passando i suoi helper { el, svg, reducedMotion }.
 * Tutto è solo decorativo (aria-hidden); con il movimento ridotto i ragni non ci sono. */
(function () {
  "use strict";

  // Helper di script.js, arrivano con avvia()
  var el, svg, reducedMotion;

  // ---------------------------------------------------------------- Halloween: il ragnetto
  // Da ciascuna delle due ragnatele in alto nell'intestazione un ragnetto scende piano su un
  // filo, dondola e risale, poi ricomincia dopo una pausa (il ciclo è in CSS: ragnetto-scende; quello di destra è sfalsato
  // di mezzo giro). Passano dietro le pillole della barra. Toccato, risale di scatto e torna dopo un po'. Solo decorativo
  // (aria-hidden); con il movimento ridotto non ci sono.
  function avviaRagnetti() {
    var header = document.querySelector(".site-header");
    if (!header || reducedMotion.matches) return;
    aggiungiRagnetto(header, "sinistra");
    aggiungiRagnetto(header, "destra");
  }

  function aggiungiRagnetto(header, lato) {
    var corpo = el("div", { class: "ragnetto__corpo" });
    var disegno = svg("svg", { viewBox: "0 0 20 20", width: 18, height: 18, focusable: "false" });
    disegno.appendChild(svg("path", { class: "ragnetto__zampe", d: "M8 9L4 6L3 2M8 11L3 10L1 7M8 13L3 14L1 18M8.5 15L5 18L4.5 20M12 9L16 6L17 2M12 11L17 10L19 7M12 13L17 14L19 18M11.5 15L15 18L15.5 20" }));
    disegno.appendChild(svg("ellipse", { cx: 10, cy: 13, rx: 3.4, ry: 4 }));
    disegno.appendChild(svg("circle", { cx: 10, cy: 7.6, r: 2.2 }));
    corpo.appendChild(disegno);
    var ragnetto = el("div", { class: "ragnetto ragnetto--" + lato, "aria-hidden": "true" }, [corpo]);
    // Primo figlio: la barra in alto (pillole) gli passa sopra
    header.insertBefore(ragnetto, header.firstChild);
    var occupato = false;
    corpo.addEventListener("click", function () {
      if (occupato) return;
      occupato = true;
      // Il ciclo si ferma dov'è (trasformazione fissata a mano) e da lì il ragnetto risale con una transizione
      corpo.style.transform = getComputedStyle(corpo).transform;
      corpo.style.animation = "none";
      void corpo.offsetWidth;
      corpo.classList.add("ragnetto__corpo--scappa");
      corpo.style.transform = "";
      window.setTimeout(function () {
        corpo.classList.remove("ragnetto__corpo--scappa");
        corpo.style.animation = ""; // il ciclo riparte da capo, con la sua pausa in cima
        occupato = false;
      }, 6000);
    });
  }

  // ---------------------------------------------------------------- Halloween: il ragno grosso
  // Qualche secondo dopo l'apertura, al massimo una volta per sessione (sessionStorage) e solo
  // una volta su RAGNO_PROBABILITA, un ragno grosso attraversa lo schermo da destra a sinistra, all'altezza del centro:
  // entra di corsa, rallenta al centro, riesce di corsa. Finché passa, il menu non scorre (rotella, dita, tasti: bloccaScorrimento).
  // Toccato, viene schiacciato: sparisce appiattendosi e sulla pagina resta per qualche secondo una chiazza verde
  // (disegnaChiazza), che scorre con il menu e poi svanisce. Se è il suo momento ma la pagina non si vede (scheda in
  // secondo piano) o c'è un pop-up aperto, aspetta che la scheda torni visibile o che il pop-up si chiuda, e passa
  // poco dopo: così la probabilità è quella vera per chi guarda il menu.
  // Solo decorativo (aria-hidden); con il movimento ridotto non c'è. ?ragno=1 (solo debug) lo fa passare sempre.
  var RAGNO_PROBABILITA = 1;
  var RAGNO_CHIAVE = "bivio-ragno";

  /** Il ragno visto dall'alto, rivolto a sinistra, sul modello di un ragno lupo ma cattivo: zampe lunghe e spigolose,
   *  ginocchia alte, punte sottili e spine (le due serie si alternano, come nel passo vero), pedipalpi, cheliceri con le
   *  zanne ricurve, occhi rossi che brillano (filtro ragno-bagliore), cefalotorace con i solchi, addome allungato con il
   *  segno scuro. Il corpo ha il bordo peloso (filtro ragno-pelo); le zampe no, per non pesare sull'animazione. */
  function disegnaRagno() {
    var disegno = svg("svg", { viewBox: "0 0 120 100", focusable: "false" });
    var defs = svg("defs", {});
    var luce = svg("radialGradient", { id: "ragno-luce", cx: "40%", cy: "35%", r: "70%" });
    luce.appendChild(svg("stop", { offset: "0", "stop-color": "#3E2E24" }));
    luce.appendChild(svg("stop", { offset: ".5", "stop-color": "#1A110D" }));
    luce.appendChild(svg("stop", { offset: "1", "stop-color": "#0A0605" }));
    defs.appendChild(luce);
    var pelo = svg("filter", { id: "ragno-pelo", x: "-10%", y: "-10%", width: "120%", height: "120%" });
    pelo.appendChild(svg("feTurbulence", { type: "fractalNoise", baseFrequency: "1.1", numOctaves: "2", seed: "4", result: "rumore" }));
    pelo.appendChild(svg("feDisplacementMap", { "in": "SourceGraphic", in2: "rumore", scale: "2.4", xChannelSelector: "R", yChannelSelector: "G" }));
    defs.appendChild(pelo);
    var bagliore = svg("filter", { id: "ragno-bagliore", x: "-100%", y: "-100%", width: "300%", height: "300%" });
    bagliore.appendChild(svg("feGaussianBlur", { stdDeviation: ".8", result: "alone" }));
    var unione = svg("feMerge", {});
    unione.appendChild(svg("feMergeNode", { "in": "alone" }));
    unione.appendChild(svg("feMergeNode", { "in": "SourceGraphic" }));
    bagliore.appendChild(unione);
    defs.appendChild(bagliore);
    disegno.appendChild(defs);

    // Zampe sopra (dall'attacco alla punta); quelle sotto sono lo specchio. Serie a: 1ª e 3ª sopra, 2ª e 4ª sotto
    [[[38, 43], [27, 21], [10, 9], [-6, 11]], [[42, 41], [35, 12], [24, -2], [15, -7]],
      [[47, 41], [59, 12], [70, 0], [79, -5]], [[51, 43], [71, 23], [94, 13], [113, 15]]].forEach(function (zampa, i) {
      [["su", 1], ["giu", -1]].forEach(function (lato) {
        var p = zampa.map(function (q) { return [q[0], lato[1] === 1 ? q[1] : 100 - q[1]]; });
        var serie = (i % 2 === 0) === (lato[0] === "su") ? "a" : "b";
        var g = svg("g", { class: "ragno__zampa ragno__zampa--" + lato[0] + " ragno__zampa--" + serie });
        [3, 2, .9].forEach(function (spessore, k) {
          var a = p[k], b = p[k + 1];
          g.appendChild(svg("path", { d: "M" + a.join(" ") + "L" + b.join(" "), "stroke-width": spessore }));
          if (k === 2) return;
          // Spine ai due lati del segmento, lunghe e inclinate verso la punta
          var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy);
          var ux = dx / l, uy = dy / l, lungo = spessore * 1.5;
          var d = "";
          [.3, .55, .8].forEach(function (t, h) {
            var verso = h % 2 ? 1 : -1;
            var x = a[0] + dx * t - uy * verso * spessore * .4, y = a[1] + dy * t + ux * verso * spessore * .4;
            d += "M" + x.toFixed(1) + " " + y.toFixed(1) + "l" + (-uy * verso * lungo + ux * lungo * .7).toFixed(1) + " " + (ux * verso * lungo + uy * lungo * .7).toFixed(1);
          });
          g.appendChild(svg("path", { class: "ragno__peli", d: d }));
          // Articolazione nodosa alla fine del segmento
          g.appendChild(svg("circle", { class: "ragno__giunto", cx: b[0], cy: b[1], r: spessore * .6 }));
        });
        disegno.appendChild(g);
      });
    });

    disegno.appendChild(svg("path", { class: "ragno__palpo", d: "M34 46L28 42.5L23 43.5M34 54L28 57.5L23 56.5" }));
    var corpo = svg("g", { filter: "url(#ragno-pelo)" });
    // Addome: segno scuro sul davanti, chevron chiare verso il fondo, puntini
    corpo.appendChild(svg("ellipse", { cx: 77, cy: 50, rx: 24, ry: 13.5, fill: "url(#ragno-luce)" }));
    corpo.appendChild(svg("path", { fill: "#140D0B", opacity: ".75", d: "M57 50C60 46.5 66 45.5 72 47.5L76 50L72 52.5C66 54.5 60 53.5 57 50Z" }));
    corpo.appendChild(svg("path", { class: "ragno__segni", d: "M77 44L81 48.5L85 44M80 42.5L85 47L90 43M77 56L81 51.5L85 56M80 57.5L85 53L90 57" }));
    [[66, 42.5], [66, 57.5], [71, 41], [71, 59], [91, 50]].forEach(function (q) {
      corpo.appendChild(svg("circle", { class: "ragno__punto", cx: q[0], cy: q[1], r: .9 }));
    });
    corpo.appendChild(svg("ellipse", { cx: 55, cy: 50, rx: 4, ry: 3.2, fill: "#1A120E" }));
    // Cefalotorace: fascia chiara al centro e solchi che partono dal centro
    corpo.appendChild(svg("ellipse", { cx: 44, cy: 50, rx: 12, ry: 10, fill: "url(#ragno-luce)" }));
    corpo.appendChild(svg("path", { class: "ragno__solchi", d: "M46 50L40 42.5M46 50L48 41.5M46 50L52.5 44M46 50L40 57.5M46 50L48 58.5M46 50L52.5 56" }));
    disegno.appendChild(corpo);
    // Cheliceri con le zanne ricurve verso l'interno, e occhi rossi (fuori dal filtro del pelo: restano netti)
    disegno.appendChild(svg("ellipse", { cx: 32, cy: 47.3, rx: 3.4, ry: 2.3, fill: "#0E0907" }));
    disegno.appendChild(svg("ellipse", { cx: 32, cy: 52.7, rx: 3.4, ry: 2.3, fill: "#0E0907" }));
    disegno.appendChild(svg("path", { class: "ragno__zanna", d: "M29.5 46.6Q25.2 46.4 26 49.6M29.5 53.4Q25.2 53.6 26 50.4" }));
    var occhi = svg("g", { filter: "url(#ragno-bagliore)" });
    [[36.4, 48, 1.15], [36.4, 52, 1.15], [34.8, 46.3, .55], [34.6, 48.8, .45], [34.6, 51.2, .45], [34.8, 53.7, .55], [39.4, 47.2, .8], [39.4, 52.8, .8]].forEach(function (o) {
      occhi.appendChild(svg("circle", { class: "ragno__occhio", cx: o[0], cy: o[1], r: o[2] }));
    });
    disegno.appendChild(occhi);
    return disegno;
  }

  /** La chiazza verde del ragno schiacciato (forma a caso ogni volta): una macchia irregolare sfumata, più scura e densa
   *  sul bordo, con una pozza più chiara dentro e un riflesso lucido; intorno, schizzi allungati verso l'esterno (gocce a
   *  lacrima) e goccioline sparse. */
  function disegnaChiazza() {
    var disegno = svg("svg", { viewBox: "-50 -50 100 100", focusable: "false" });
    var defs = svg("defs", {});
    var verde = svg("radialGradient", { id: "chiazza-verde", cx: "45%", cy: "42%", r: "60%" });
    verde.appendChild(svg("stop", { offset: "0", "stop-color": "#A6CF3C" }));
    verde.appendChild(svg("stop", { offset: ".6", "stop-color": "#7FAE22" }));
    verde.appendChild(svg("stop", { offset: "1", "stop-color": "#4E7512" }));
    defs.appendChild(verde);
    disegno.appendChild(defs);
    function macchia(raggio, schizzi, scala) {
      var n = 16, punti = [];
      for (var i = 0; i < n; i++) {
        var a = i / n * Math.PI * 2 + (Math.random() - .5) * .25;
        var r = (raggio + Math.random() * raggio * .35 + (i % 2 && Math.random() < schizzi ? raggio * (.35 + Math.random() * .45) : 0)) * scala;
        punti.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      // Curva morbida e chiusa: si va da un punto medio all'altro usando i punti come controllo
      function medio(k) {
        var p1 = punti[k % n], p2 = punti[(k + 1) % n];
        return ((p1[0] + p2[0]) / 2).toFixed(1) + " " + ((p1[1] + p2[1]) / 2).toFixed(1);
      }
      var d = "M" + medio(n - 1);
      for (var k = 0; k < n; k++) d += "Q" + punti[k][0].toFixed(1) + " " + punti[k][1].toFixed(1) + " " + medio(k);
      return d + "Z";
    }
    // Schizzi a lacrima: la punta verso il centro, la goccia tonda verso l'esterno, a distanze e misure diverse
    for (var g = 0; g < 9; g++) {
      var ang = Math.random() * 360, dist = 26 + Math.random() * 14, lungo = 6 + Math.random() * 9, largo = 1.4 + Math.random() * 2;
      disegno.appendChild(svg("path", {
        class: "chiazza__schizzo",
        d: "M0 " + (-largo * .25).toFixed(1) + "L" + lungo.toFixed(1) + " " + (-largo).toFixed(1) + "A" + largo.toFixed(1) + " " + largo.toFixed(1) + " 0 1 1 " + lungo.toFixed(1) + " " + largo.toFixed(1) + "L0 " + (largo * .25).toFixed(1) + "Z",
        transform: "rotate(" + ang.toFixed(0) + ") translate(" + dist.toFixed(1) + " 0)"
      }));
    }
    for (var c = 0; c < 10; c++) {
      var a2 = Math.random() * Math.PI * 2, r2 = 30 + Math.random() * 18;
      disegno.appendChild(svg("circle", { class: "chiazza__schizzo", cx: (Math.cos(a2) * r2).toFixed(1), cy: (Math.sin(a2) * r2).toFixed(1), r: (.6 + Math.random() * 1.8).toFixed(1) }));
    }
    disegno.appendChild(svg("path", { class: "chiazza__fondo", d: macchia(24, .7, 1) }));
    disegno.appendChild(svg("path", { class: "chiazza__pozza", d: macchia(15, .25, 1), transform: "translate(-2 -2)" }));
    disegno.appendChild(svg("ellipse", { class: "chiazza__riflesso", cx: -9, cy: -10, rx: 6, ry: 2.6, transform: "rotate(-30 -9 -10)" }));
    disegno.appendChild(svg("circle", { class: "chiazza__riflesso", cx: -2, cy: -14, r: 1.2 }));
    return disegno;
  }

  function passaRagno() {
    function riprova() { window.setTimeout(passaRagno, 1500); }
    if (document.hidden) {
      document.addEventListener("visibilitychange", function torna() {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", torna);
        riprova();
      });
      return;
    }
    var aperto = document.querySelector("dialog[open]");
    if (aperto) {
      aperto.addEventListener("close", function chiuso() {
        aperto.removeEventListener("close", chiuso);
        riprova();
      });
      return;
    }
    var ragno = el("div", { class: "ragno", "aria-hidden": "true" }, [disegnaRagno()]);
    var sblocca = bloccaScorrimento();
    var fatto = false;
    function fine() {
      if (fatto) return;
      fatto = true;
      sblocca();
      if (ragno.parentNode) ragno.parentNode.removeChild(ragno);
    }
    ragno.addEventListener("animationend", function (e) { if (e.animationName === "ragno-attraversa") fine(); });
    // Schiacciato: si ferma dov'è, si appiattisce e sparisce; al suo posto la chiazza
    ragno.addEventListener("pointerdown", function (e) {
      if (fatto || ragno.classList.contains("ragno--schiacciato")) return;
      e.preventDefault();
      var box = ragno.querySelector("svg").getBoundingClientRect();
      var lato = box.width * .8;
      var x = Math.min(Math.max(box.left + box.width / 2, lato / 2), window.innerWidth - lato / 2);
      var chiazza = el("div", { class: "chiazza", "aria-hidden": "true" }, [disegnaChiazza()]);
      chiazza.style.width = Math.round(lato) + "px";
      chiazza.style.left = Math.round(x + window.pageXOffset) + "px";
      chiazza.style.top = Math.round(box.top + box.height / 2 + window.pageYOffset) + "px";
      // Dopo qualche secondo svanisce (chiazza-svanisce in style.css) e si toglie dal DOM
      chiazza.addEventListener("animationend", function (ev) {
        if (ev.animationName === "chiazza-svanisce" && chiazza.parentNode) chiazza.parentNode.removeChild(chiazza);
      });
      document.body.appendChild(chiazza);
      ragno.style.transform = getComputedStyle(ragno).transform;
      ragno.style.animation = "none";
      ragno.classList.add("ragno--schiacciato");
      try { if (navigator.vibrate) navigator.vibrate(40); } catch (err) { /* vibrazione non disponibile */ }
      window.setTimeout(fine, 200);
    });
    // Nel tratto lento al centro (22%-62% di ragno-attraversa, 4,1 s) anche il passo rallenta
    window.setTimeout(function () { ragno.classList.add("ragno--lento"); }, 900);
    window.setTimeout(function () { ragno.classList.remove("ragno--lento"); }, 2540);
    window.setTimeout(fine, 4700); // riserva, se animationend non arriva
    document.body.appendChild(ragno);
  }

  /** Ferma lo scorrimento della pagina (rotella, trascinamento, tasti) senza toccare l'overflow: niente salti di
   *  layout per la barra di scorrimento. Restituisce la funzione che lo riattiva. */
  function bloccaScorrimento() {
    var tasti = { " ": 1, PageUp: 1, PageDown: 1, End: 1, Home: 1, ArrowUp: 1, ArrowDown: 1 };
    function ferma(e) { e.preventDefault(); }
    function fermaTasti(e) { if (tasti[e.key]) e.preventDefault(); }
    var opzioni = { passive: false };
    window.addEventListener("wheel", ferma, opzioni);
    window.addEventListener("touchmove", ferma, opzioni);
    window.addEventListener("keydown", fermaTasti);
    return function () {
      window.removeEventListener("wheel", ferma, opzioni);
      window.removeEventListener("touchmove", ferma, opzioni);
      window.removeEventListener("keydown", fermaTasti);
    };
  }

  function avviaRagno() {
    if (reducedMotion.matches) return;
    var sempre = false;
    try { sempre = new URLSearchParams(location.search).get("ragno") === "1"; } catch (e) { /* URLSearchParams assente */ }
    if (!sempre) {
      // Il tiro di dado si fa una volta per sessione: se è andato male, non si ritenta ricaricando
      try {
        if (sessionStorage.getItem(RAGNO_CHIAVE)) return;
        sessionStorage.setItem(RAGNO_CHIAVE, "1");
      } catch (e) { /* storage bloccato: vale il solo tiro di dado */ }
      if (Math.random() > RAGNO_PROBABILITA) return;
    }
    window.setTimeout(passaRagno, sempre ? 1500 : 5000 + Math.random() * 10000);
  }

  window.BIVIO_TEMA = {
    // Il gatto del footer: solo nero (porta sfortuna, ma è Halloween), passa più spesso e, toccato, invece di fare le
    // fusa inarca la schiena (la gobba disegnata qui sotto), drizza la coda e soffia (gatto--soffia in halloween.css)
    gatto: {
      mantelli: ["nero"],
      probabilita: 0.4,
      verso: "ffff!",
      classeTocco: "gatto--soffia",
      /** Aggiunge al disegno la schiena inarcata, subito dopo la pancia (nascosta finché il gatto non soffia). */
      disegna: function (corpo, svgFn) {
        corpo.appendChild(svgFn("path", { class: "gatto__gobba", d: "M9 18C9 10 14 3.5 21 3.5C28 3.5 33 10 33 18C27 16 15 16 9 18Z" }));
      }
    },
    avvia: function (aiuti) {
      el = aiuti.el;
      svg = aiuti.svg;
      reducedMotion = aiuti.reducedMotion;
      avviaRagnetti();
      avviaRagno();
    }
  };
})();
