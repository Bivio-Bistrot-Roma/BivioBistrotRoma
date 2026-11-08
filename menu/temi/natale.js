/* Tema Natale del menu: comportamento (lo stile è in natale.css). Stesso schema di halloween.js: caricato solo con il
 * tema acceso, prima di script.js, e prepara window.BIVIO_TEMA (gatto con la sciarpa, avvia → la cometa).
 * In più, a pagina pronta, aggiunge il festone di luci nell'intestazione (così è già lì quando il velo si ritira).
 * Tutto è solo decorativo (aria-hidden); con il movimento ridotto la cometa non passa e le luci restano ferme. */
(function () {
  "use strict";

  var NS_SVG = "http://www.w3.org/2000/svg";
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function parametro(nome) {
    var m = new RegExp("[?&]" + nome + "=([a-z0-9]+)").exec(location.search);
    return m ? m[1] : "";
  }

  function svg(tag, attrs) {
    var node = document.createElementNS(NS_SVG, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }

  function gradiente(tipo, id, attrs, fermate) {
    var g = svg(tipo, attrs);
    g.setAttribute("id", id);
    fermate.forEach(function (f) {
      g.appendChild(svg("stop", { offset: f[0], "stop-color": f[1], "stop-opacity": f[2] === undefined ? "1" : f[2] }));
    });
    return g;
  }

  // ---------------------------------------------------------------- Il festone di luci
  // Un filo solo lungo il bordo in alto dell'intestazione, da un angolo all'altro, a festoni morbidi (uno ogni 120 px
  // circa, almeno tre), come le luminarie di via del Corso. Su ogni festone tre lampadine a goccia, nei colori di
  // FESTONE_COLORI in giro, con un bagliore che pulsa piano (alternato, così non si accendono tutte insieme). Passa sopra le pillole della
  // barra ma non riceve tocchi. Il disegno è in pixel, largo quanto l'intestazione: si rifà se la larghezza cambia.
  // I colori delle lampadine, in giro: vetro (sfumatura dall'alto in basso) e bagliore
  var FESTONE_COLORI = [
    { vetro: ["#FFD9DD", "#E0384F", "#A30F26"], alone: "#FF5A6E" }, // rosso
    { vetro: ["#FFF6D6", "#F7CD5A", "#C98A22"], alone: "#FFD86B" }, // oro
    { vetro: ["#E2F5DF", "#4FA35B", "#2F6B3A"], alone: "#6CCB7A" }, // verde
    { vetro: ["#E3EEFF", "#4D7FD6", "#2A4F9A"], alone: "#7FA8FF" }  // blu
  ];
  var FESTONE_ALTO = 26;  // altezza del disegno
  var FESTONE_CALA = 5;   // quanto scende il filo a metà di ogni festone

  function disegnaFestone(larghezza) {
    var disegno = svg("svg", { viewBox: "0 0 " + larghezza + " " + FESTONE_ALTO, width: larghezza, height: FESTONE_ALTO, focusable: "false" });
    var defs = svg("defs", {});
    FESTONE_COLORI.forEach(function (c, i) {
      defs.appendChild(gradiente("radialGradient", "festone-alone-" + i, {}, [["0", c.alone, ".9"], [".5", c.alone, ".35"], ["1", c.alone, "0"]]));
      defs.appendChild(gradiente("linearGradient", "festone-vetro-" + i, { x1: "0", y1: "0", x2: "0", y2: "1" }, [["0", c.vetro[0]], [".45", c.vetro[1]], ["1", c.vetro[2]]]));
    });
    disegno.appendChild(defs);
    var campate = Math.max(3, Math.round(larghezza / 120));
    var passo = larghezza / campate;
    var filo = "M0 1";
    var luci = [];
    for (var c = 0; c < campate; c++) {
      var x0 = c * passo;
      filo += "Q" + (x0 + passo / 2).toFixed(1) + " " + (1 + 2 * FESTONE_CALA) + " " + (x0 + passo).toFixed(1) + " 1";
      [.22, .5, .78].forEach(function (t) {
        luci.push([x0 + passo * t, 1 + 4 * FESTONE_CALA * t * (1 - t)]); // punto sul filo (curva di Bézier quadratica)
      });
    }
    disegno.appendChild(svg("path", { class: "festone__filo", d: filo }));
    luci.forEach(function (p, n) {
      var x = p[0], y = p[1], colore = n % FESTONE_COLORI.length;
      var alone = svg("circle", { class: "festone__alone", cx: x.toFixed(1), cy: (y + 5.5).toFixed(1), r: 9, fill: "url(#festone-alone-" + colore + ")" });
      alone.style.animationDelay = (-((n % 2) * 1.6 + (n % 3) * .45)).toFixed(2) + "s";
      disegno.appendChild(alone);
      disegno.appendChild(svg("rect", { class: "festone__attacco", x: (x - 1.3).toFixed(1), y: (y - .3).toFixed(1), width: 2.6, height: 2.4, rx: .5 }));
      disegno.appendChild(svg("path", {
        class: "festone__lampada",
        fill: "url(#festone-vetro-" + colore + ")",
        stroke: FESTONE_COLORI[colore].vetro[2],
        d: "M" + x.toFixed(1) + " " + (y + 2).toFixed(1) + "c3.2 1.6 3.2 5.6 0 7.2c-3.2-1.6-3.2-5.6 0-7.2Z"
      }));
      disegno.appendChild(svg("ellipse", { class: "festone__riflesso", cx: (x - 1).toFixed(1), cy: (y + 4.6).toFixed(1), rx: .7, ry: 1.3 }));
    });
    return disegno;
  }

  function avviaFestone() {
    var header = document.querySelector(".site-header");
    if (!header || header.querySelector(".festone")) return;
    var box = document.createElement("div");
    box.className = "festone";
    box.setAttribute("aria-hidden", "true");
    header.appendChild(box); // ultimo figlio: passa sopra la barra delle pillole
    var larghezza = 0;
    function aggiorna() {
      var w = header.clientWidth;
      if (!w || w === larghezza) return;
      larghezza = w;
      while (box.firstChild) box.removeChild(box.firstChild);
      box.appendChild(disegnaFestone(w));
    }
    aggiorna();
    window.addEventListener("resize", aggiorna);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avviaFestone);
  else avviaFestone();

  // ---------------------------------------------------------------- La cometa
  // Qualche secondo dopo l'apertura, al massimo una volta per sessione (sessionStorage) e solo una volta su
  // 1/COMETA_PROBABILITA, una cometa attraversa lo schermo in alto da destra a sinistra, scendendo un poco. Toccata, si
  // apre in una manciata di stelline. Se è il suo momento ma la pagina non si vede o c'è un pop-up aperto, aspetta.
  // Con il movimento ridotto non c'è. ?cometa=1 (solo debug) la fa passare sempre.
  var COMETA_PROBABILITA = 0.5;
  var COMETA_CHIAVE = "bivio-cometa";

  function passaCometa() {
    function riprova() { window.setTimeout(passaCometa, 1500); }
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
    var w = window.innerWidth, h = window.innerHeight;
    var cala = Math.round(h * (.08 + Math.random() * .1));
    var cometa = document.createElement("div");
    cometa.className = "cometa";
    cometa.setAttribute("aria-hidden", "true");
    cometa.style.setProperty("--y", Math.round(h * (.1 + Math.random() * .2)) + "px");
    cometa.style.setProperty("--cala", cala + "px");
    // La scia punta all'indietro rispetto al volo: verso destra e un po' in alto
    cometa.style.setProperty("--angolo", (-Math.atan2(cala, w + 300) * 180 / Math.PI).toFixed(1) + "deg");
    var coda = document.createElement("span");
    coda.className = "cometa__coda";
    var testa = document.createElement("span");
    testa.className = "cometa__testa";
    cometa.appendChild(coda);
    cometa.appendChild(testa);
    var fatto = false;
    function fine() {
      if (fatto) return;
      fatto = true;
      if (cometa.parentNode) cometa.parentNode.removeChild(cometa);
    }
    cometa.addEventListener("animationend", function (e) { if (e.animationName === "cometa-vola") fine(); });
    testa.addEventListener("pointerdown", function (e) {
      if (fatto) return;
      e.preventDefault();
      var box = testa.getBoundingClientRect();
      scoppio(box.left + box.width / 2, box.top + box.height / 2);
      fine();
    });
    window.setTimeout(fine, 3400); // riserva, se animationend non arriva
    document.body.appendChild(cometa);
  }

  /** Stelline che partono a raggiera dal punto (x, y) dello schermo e svaniscono. */
  function scoppio(x, y) {
    for (var i = 0; i < 10; i++) {
      var angolo = i / 10 * Math.PI * 2 + Math.random() * .5;
      var distanza = 40 + Math.random() * 55;
      var s = document.createElement("span");
      s.className = "stellina";
      s.setAttribute("aria-hidden", "true");
      s.style.left = Math.round(x) + "px";
      s.style.top = Math.round(y) + "px";
      s.style.setProperty("--dx", Math.round(Math.cos(angolo) * distanza) + "px");
      s.style.setProperty("--dy", Math.round(Math.sin(angolo) * distanza) + "px");
      s.style.animationDelay = Math.round(Math.random() * 80) + "ms";
      document.body.appendChild(s);
      window.setTimeout(function (n) { return function () { if (n.parentNode) n.parentNode.removeChild(n); }; }(s), 1200);
    }
  }

  function avviaCometa() {
    if (reducedMotion.matches) return;
    var sempre = parametro("cometa") === "1";
    if (!sempre) {
      // Il tiro di dado si fa una volta per sessione: se è andato male, non si ritenta ricaricando
      try {
        if (sessionStorage.getItem(COMETA_CHIAVE)) return;
        sessionStorage.setItem(COMETA_CHIAVE, "1");
      } catch (e) { /* storage bloccato: vale il solo tiro di dado */ }
      if (Math.random() > COMETA_PROBABILITA) return;
    }
    window.setTimeout(passaCometa, sempre ? 1500 : 6000 + Math.random() * 12000);
  }

  // ---------------------------------------------------------------- Per script.js
  window.BIVIO_TEMA = {
    // Il gatto del footer: mantelli di sempre, con una sciarpa verde abete a righe crema (giro al collo e capo che
    // sventola dietro; stile in natale.css). Disegnata sopra la testa, così il giro al collo le passa davanti.
    gatto: {
      // Toccato, invece del «prrr» fa gli auguri nella lingua del menu
      verso: function (lingua) { return lingua === "en" ? "Meowrry Christmas!" : "Buon Natale!"; },
      disegnaSopra: function (corpo, svgFn) {
        var sciarpa = svgFn("g", { class: "gatto__sciarpa" });
        var coda = svgFn("g", { class: "gatto__sciarpa-coda" });
        coda.appendChild(svgFn("polygon", { points: "32,12.4 32.8,15.4 25.4,14.6 24.6,11.8" }));
        coda.appendChild(svgFn("path", { class: "gatto__sciarpa-righe", d: "M29.9 12.4l.4 2.6M27.8 12.2l.4 2.6" }));
        coda.appendChild(svgFn("path", { class: "gatto__sciarpa-frange", d: "M24.6 11.8l-1.5-.3M25 13.2h-1.6M25.4 14.6l-1.5.3" }));
        sciarpa.appendChild(coda);
        sciarpa.appendChild(svgFn("polygon", { points: "30.4,9.8 33.4,8.8 35.6,16.4 32.6,17.4" }));
        sciarpa.appendChild(svgFn("path", { class: "gatto__sciarpa-righe", d: "M31.1 12.2l2.9-.9M31.8 14.7l2.9-.9" }));
        corpo.appendChild(sciarpa);
      }
    },
    avvia: function () {
      avviaCometa();
    }
  };
})();
