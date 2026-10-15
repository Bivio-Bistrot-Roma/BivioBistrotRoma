/**
 * Bivio Bistrot — sito del locale
 * ---------------------------------------------------------------------------
 * Legge i dati comuni (assets/locale-dati.js -> BIVIO_LOCALE), i calcoli comuni (assets/comune.js ->
 * BIVIO_COMUNE), la galleria (assets/galleria.js -> BIVIO_GALLERIA) e il menu (menu/menu-data.js ->
 * BIVIO_MENU: stringhe in comune). DOM solo con createElement + textContent
 * (mai innerHTML con dati), URL esterni solo https.
 *
 * LINGUA: l'italiano è scritto nell'HTML (lo legge Google). Gli elementi con data-i18n / data-i18n-aria /
 * data-i18n-alt / data-i18n-content prendono l'inglese da EN qui sotto; l'italiano si rilegge dall'HTML
 * all'avvio. Priorità: ?lang= > localStorage["bivio-lang"] (la stessa chiave del menu) > italiano.
 */
(function () {
  "use strict";

  var LOCALE = window.BIVIO_LOCALE;
  var COMUNE = window.BIVIO_COMUNE;
  var MENU = window.BIVIO_MENU || null;
  if (!LOCALE || !COMUNE) return;
  var META = LOCALE.meta || {};

  // ---------------------------------------------------------------- Testi
  /** Traduzioni inglesi dei testi scritti nell'HTML (chiave = data-i18n…). */
  var EN = {
    "meta.title": "Bivio Bistrot — Rome",
    "meta.description": "Bivio Bistrot, a bistrot in Rome on Piazza Monte Grappa (Prati): seasonal cooking with Sicilian roots, breakfast in the morning, wines and cocktails late.",
    "skip": "Skip to content",
    "langLabel": "Language",
    "hero.logo": "Bivio Bistrot — bistrot, wines and cocktails in Rome",
    "hero.frase": "Where roads meet and stories begin.",
    "hero.menu": "See the menu",
    "hero.prenota": "Book",

    "storia.titolo": "Bivio Bistrot",
    "storia.1": "Some names come about by chance; others hold a story. Bivio is both.",
    "storia.2": "It started as a play on words, of course: the bistrot stands right at a bivio, a fork in the road, a point where roads meet and every direction can lead somewhere.",
    "storia.3": "But sometimes coincidences carry a deeper meaning. In life, a bivio is the moment when you stop, look at what you have left behind and decide where to go. It is a change, a choice, a leap into the unknown. It is the courage to let go of certainties, to take a chance and make room for something new, even without knowing exactly where it will lead.",
    "storia.4": "Bivio Bistrot was born of this very spirit: from the meeting of different people, paths and experiences, united by the wish to build something of their own. Agata, Alex and Miriam, each with their own story, skills and way of seeing things, chose to meet here and bring to life a project about food, conviviality and passion.",
    "storia.5": "Because sometimes the most beautiful turns come when we find the courage to change direction. When we decide to believe in an idea, to step out of our comfort zone and turn an intuition into something real.",
    "storia.6": "And so what, for some, is just a crossroads becomes, for us, a starting point. A place to stop, to meet, to share flavours and perhaps find ourselves, even if only for a moment, on the right road.",
    "storia.7": "Bivio Bistrot. Because every choice opens a road, and every road can become a story worth telling.",

    "cucina.titolo": "Our kitchen",
    "cucina.sottotitolo": "authentic and seasonal",
    "cucina.1": "We believe in cooking made of passion, dedication and a great deal of love. In our bistrot, every dish is the result of craftsmanship: care, attention and respect for the ingredients. We take no shortcuts: we choose to give every recipe the time it needs, bringing out authentic flavours and the quality of what we use.",
    "cucina.2": "Seasonality is an essential part of our philosophy. We follow the rhythm of the seasons, taking inspiration from what nature offers throughout the year, to bring fresh, wholesome dishes to the table.",
    "cucina.3": "In Agata's kitchen, Sicilian tradition meets the experience gained in Rome and the wish to offer something genuine every day. A cuisine of roots, memories and passion, where every dish tells a story.",

    "persone.titolo": "About us",
    "agata.titolo": "Agata, the soul of the bistrot",
    "agata.1": "Born in Catania and a Roman by adoption for thirty years now, Agata brings the scents, flavours and memories of her Sicily into the kitchen. Owner and chef of the bistrot, she keeps a deep bond with her homeland, made of traditions, wholesome ingredients and flavours that tell a story.",
    "agata.2": "Her cooking is born from the meeting of her Sicilian roots and the city that has welcomed her for so many years. It is a way of expressing herself, of sharing emotions and of keeping the memory of her origins alive, turning every dish into a small journey through the colours and scents of Sicily.",
    "agata.3": "For Agata, cooking means passing on something of herself: a childhood memory, a familiar taste, the warmth of a generously laid table. It means welcoming people, taking care of them and making every guest feel a little at home.",
    "agata.4": "Behind every recipe there is a story, and in every one of Agata's dishes there is a piece of her Sicily.",
    "miriam.titolo": "Miriam, the eye that tells the bistrot's story",
    "miriam.1": "At 26, Miriam brings a young, creative and attentive eye to the bistrot. Agata's daughter, she now helps shape its identity through communication, photography and visual care.",
    "miriam.2": "She is passionate about photography, and it shows in the way she looks at the world: she seeks out the right light, catches the details and recognises beauty in small things. For her, aesthetics are not just about appearance: they are a language able to convey emotions, tell stories and let you sense the soul of a place before you even step inside.",
    "miriam.3": "From a picture of a dish to a detail of the rooms, from a spontaneous gesture to a shared moment, Miriam tries to capture what makes the bistrot unique, turning it into an authentic, recognisable visual story.",
    "miriam.4": "Versatile and always ready to take on something new, she moves between creativity and hands-on work, with the sensitivity of someone who knows that it is often the small details that make the difference.",
    "miriam.5": "Her job is to tell the bistrot's story through images, but her talent is seeing what makes it special.",
    "alex.titolo": "Alex, a talent for surprise",
    "alex.1": "A Roman, a mixologist and a keen observer of people, Alex has a special talent: catching people's attention, creating connections and turning a simple moment at the bar into an experience to remember.",
    "alex.2": "With his charisma and his passion for mixology, he approaches the world of cocktails with creativity and personality, taking care of every detail, from the ingredients to the balance of flavours to the presentation.",
    "alex.3": "But what truly sets him apart is his ability to connect with whoever is in front of him. Alex knows how to read people, spark their curiosity and draw them in, putting them at ease naturally and with that touch of irony that makes every encounter special.",
    "alex.4": "Agata's business partner, he shares her vision of a place where food, conviviality and hospitality come together in a single experience. For Alex, a cocktail is not just a mix of ingredients but a way to tell something, to surprise and to leave a mark.",
    "alex.5": "His speciality? Creating cocktails people remember and moments they want to live again.",

    "locale.titolo": "The place",
    "locale.tutte": "See all the photos",
    "orari.titolo": "Opening hours",
    "dove.titolo": "Find us",
    "dove.maps": "Open in Google Maps",
    "prenota.titolo": "Book a table",
    "prenota.chiama": "Call us",
    "prenota.whatsapp": "Message us on WhatsApp",
    "prenota.thefork": "Book on TheFork",
    "piede.menu": "The menu",
    "lightbox.titolo": "Photos of the place",
    "lightbox.chiudi": "Close",
    "toTop": "Back to top",
    "lightbox.prima": "Previous photo",
    "lightbox.dopo": "Next photo"
  };

  /** Stringhe usate dallo script (le altre, come orari e privacy, vengono dal menu: MENU.ui). */
  var UI = {
    it: { leggiTutto: "Leggi tutto", leggiMeno: "Mostra meno", chiudi: "Chiudi", comingSoon: "Link in arrivo" },
    en: { leggiTutto: "Read more", leggiMeno: "Show less", chiudi: "Close", comingSoon: "Link coming soon" }
  };

  var LOCALES = { it: "it-IT", en: "en-GB" };
  var STORAGE_KEY = "bivio-lang";
  var lang = "it";

  function t(key) {
    var menuUi = (MENU && MENU.ui) || {};
    if (UI[lang] && UI[lang][key] !== undefined) return UI[lang][key];
    if (menuUi[lang] && menuUi[lang][key] !== undefined) return menuUi[lang][key];
    if (UI.it[key] !== undefined) return UI.it[key];
    if (menuUi.it && menuUi.it[key] !== undefined) return menuUi.it[key];
    return key;
  }

  /** Campo tradotto: obj.en[field] se c'è, altrimenti l'italiano. */
  function tr(obj, field) {
    if (lang !== "it" && obj && obj[lang] && obj[lang][field]) return obj[lang][field];
    return obj ? obj[field] : "";
  }

  function locale() { return LOCALES[lang] || "it-IT"; }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === null || value === undefined || value === false) return;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value === true ? "" : value);
    });
    (children || []).forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function each(selector, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), fn);
  }

  /** Solo URL https: protegge da javascript: e simili. */
  function safeHttps(url) {
    if (typeof url !== "string" || !url) return "";
    try { return new URL(url).protocol === "https:" ? url : ""; } catch (e) { return ""; }
  }

  // ---------------------------------------------------------------- Lingua
  function hasLang(code) { return code === "it" || code === "en"; }

  function detectLanguage() {
    try {
      var q = new URLSearchParams(location.search).get("lang");
      if (q && hasLang(q)) return q;
    } catch (e) { /* URLSearchParams assente */ }
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && hasLang(saved)) return saved;
    } catch (e) { /* localStorage bloccato */ }
    return "it";
  }

  // L'italiano è nell'HTML: lo si legge una volta, per poterci tornare
  var originali = { text: [], aria: [], alt: [], content: [] };
  each("[data-i18n]", function (n) { originali.text.push([n, n.textContent]); });
  each("[data-i18n-aria]", function (n) { originali.aria.push([n, n.getAttribute("aria-label") || ""]); });
  each("[data-i18n-alt]", function (n) { originali.alt.push([n, n.getAttribute("alt") || ""]); });
  each("[data-i18n-content]", function (n) { originali.content.push([n, n.getAttribute("content") || ""]); });

  function testoStatico(key, italiano) {
    return lang === "en" && EN[key] !== undefined ? EN[key] : italiano;
  }

  function applyStaticTexts() {
    originali.text.forEach(function (o) { o[0].textContent = testoStatico(o[0].getAttribute("data-i18n"), o[1]); });
    originali.aria.forEach(function (o) { o[0].setAttribute("aria-label", testoStatico(o[0].getAttribute("data-i18n-aria"), o[1])); });
    originali.alt.forEach(function (o) { o[0].setAttribute("alt", testoStatico(o[0].getAttribute("data-i18n-alt"), o[1])); });
    originali.content.forEach(function (o) { o[0].setAttribute("content", testoStatico(o[0].getAttribute("data-i18n-content"), o[1])); });
    var titleKey = document.querySelector("title[data-i18n]");
    if (titleKey) document.title = titleKey.textContent;
    document.documentElement.lang = lang;
  }

  function setLanguage(code, salva) {
    if (!hasLang(code)) return;
    lang = code;
    if (salva) {
      try { localStorage.setItem(STORAGE_KEY, code); } catch (e) { /* non critico */ }
    }
    each(".lingua__voce", function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-lang") === lang ? "true" : "false"); });
    applyStaticTexts();
    renderStatus();
    renderHours();
    renderPhotoTexts();
    renderPeopleButtons();
    renderLegal();
    if (galleria) galleria.aggiorna();
    if (privacyEl && privacyEl.open) renderPrivacy();
  }

  each(".lingua__voce", function (b) {
    b.addEventListener("click", function () { setLanguage(b.getAttribute("data-lang"), true); });
  });

  // ---------------------------------------------------------------- Stato e orari
  var dayFormatters = {};
  function dayName(i, style) {
    var key = locale() + style;
    if (!dayFormatters[key]) dayFormatters[key] = new Intl.DateTimeFormat(locale(), { weekday: style });
    var name = dayFormatters[key].format(new Date(2024, 0, 1 + i)); // 1 gennaio 2024 era un lunedì
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function fmt(key, time, day) {
    return t(key).replace("{t}", time).replace("{d}", day || "");
  }

  /** "Aperto · chiude alle 23:00" / "Chiuso · apre alle 07:30" (stesse stringhe del menu). */
  function statusText() {
    var st = COMUNE.openingStatus(META.hours);
    if (!st) return null;
    var show = COMUNE.shownTime;
    if (st.open) return { open: true, text: t("openNow") + " · " + fmt("closesAt", show(st.closes, true)) };
    var closed = t("closedNow") + " · ";
    var time = show(st.opens, false);
    if (st.inDays === 0) return { open: false, text: closed + fmt("opensAt", time) };
    if (st.inDays === 1) return { open: false, text: closed + fmt("opensTomorrow", time) };
    return { open: false, text: closed + fmt("opensOn", time, dayName(st.day, "long").toLowerCase()) };
  }

  function renderStatus() {
    var st = statusText();
    each(".stato", function (p) {
      p.hidden = !st;
      if (!st) return;
      p.textContent = st.text;
      p.classList.toggle("is-aperto", st.open);
    });
  }

  function renderHours() {
    var box = document.querySelector(".orari");
    if (!box) return;
    box.textContent = "";
    var groups = COMUNE.hoursGroups(META.hours);
    if (!groups) return;
    var show = COMUNE.shownTime;
    box.appendChild(el("dl", { class: "orari__elenco" }, groups.map(function (g) {
      var label = g.from === g.to ? dayName(g.from, "long") : dayName(g.from, "long") + " – " + dayName(g.to, "long");
      var time = g.slot ? show(g.slot.open, false) + " – " + show(g.slot.close, true) : t("closedDay");
      return el("div", { class: g.today ? "orari__riga is-oggi" : "orari__riga", "aria-current": g.today ? "date" : null }, [
        el("dt", { text: label }),
        el("dd", { text: time })
      ]);
    })));
  }

  // ---------------------------------------------------------------- Le persone: «Leggi tutto»
  function renderPeopleButtons() {
    each(".persona__altro", function (btn) {
      btn.textContent = btn.getAttribute("aria-expanded") === "true" ? t("leggiMeno") : t("leggiTutto");
    });
  }

  // Chi siamo: aprendo «Leggi tutto» di una persona le altre svaniscono e la sua scheda resta sola
  // (su pc a tutta larghezza, testo su due colonne); chiudendo, le altre tornano. In tre tempi:
  // 1) svaniscono le altre schede e il testo della scheda scelta; 2) la scheda scivola e si allarga (o restringe)
  // fino al suo nuovo posto mentre l'altezza della griglia si adegua; 3) il testo ricompare già impaginato.
  var personeEl = document.querySelector(".persone__griglia");
  var personeInCorso = false;
  var EASE = "cubic-bezier(.2, .7, .2, 1)";
  var EASE_MOTO = "cubic-bezier(.65, 0, .35, 1)"; // spostamento: parte e arriva piano

  function senzaMovimento() {
    return !personeEl || typeof personeEl.animate !== "function" ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function altreSchede(card) {
    return Array.prototype.filter.call(personeEl.querySelectorAll(".persona"), function (c) { return c !== card; });
  }

  /** Dissolvenza di più elementi (da 0 a 1 o da 1 a 0); a fine uscita restano invisibili (style.opacity = 0). */
  function dissolvi(els, da, a, durata, ritardo, poi) {
    var n = els.length, fatti = 0;
    if (!n) { if (poi) poi(); return; }
    els.forEach(function (e) {
      var su = "translateY(10px)";
      var an = e.animate([{ opacity: da, transform: da > a ? "none" : su }, { opacity: a, transform: da > a ? su : "none" }],
        { duration: durata, delay: ritardo || 0, easing: EASE, fill: "both" });
      an.onfinish = function () {
        e.style.opacity = a === 0 ? "0" : "";
        an.cancel();
        fatti += 1;
        if (fatti === n && poi) poi();
      };
    });
  }

  /** Applica il nuovo layout tenendo ferma la scheda a schermo (sul telefono le schede sopra spariscono o tornano). */
  function cambiaLayout(card, r0, applica) {
    var root = document.documentElement;
    root.style.overflowAnchor = "none";
    applica();
    var top1 = card.getBoundingClientRect().top;
    if (Math.abs(top1 - r0.top) > 1) window.scrollBy(0, top1 - r0.top);
    root.style.overflowAnchor = "";
  }

  /** La scheda parte dal rettangolo r0 (posizione e larghezza di prima) e scivola fino al suo posto nuovo. */
  function scivola(card, r0, durata) {
    var r1 = card.getBoundingClientRect();
    if (Math.abs(r1.left - r0.left) < 1 && Math.abs(r1.width - r0.width) < 1 && Math.abs(r1.top - r0.top) < 1) return;
    card.animate([
      { transform: "translate(" + (r0.left - r1.left) + "px, " + (r0.top - r1.top) + "px)", width: r0.width + "px" },
      { transform: "none", width: r1.width + "px" }
    ], { duration: durata, easing: EASE_MOTO });
  }

  /** L'altezza della griglia passa da h0 a quella nuova senza scatti. */
  function adeguaAltezza(h0, durata) {
    var h1 = personeEl.offsetHeight;
    if (Math.abs(h1 - h0) < 1) return;
    personeEl.style.overflow = "clip";
    var an = personeEl.animate([{ height: h0 + "px" }, { height: h1 + "px" }], { duration: durata, easing: EASE_MOTO });
    an.onfinish = an.oncancel = function () { personeEl.style.overflow = ""; };
  }

  function apriPersona(card, btn, resto) {
    var altre = altreSchede(card);
    var interni = [card.querySelector(".testo"), btn];
    function applica() {
      altre.forEach(function (c) { c.hidden = true; });
      card.classList.add("is-sola");
      resto.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      renderPeopleButtons();
    }
    if (senzaMovimento()) { applica(); return; }
    personeInCorso = true;
    dissolvi(altre.concat(interni), 1, 0, 260, 0, function () {
      var r0 = card.getBoundingClientRect();
      var h0 = personeEl.offsetHeight;
      cambiaLayout(card, r0, applica);
      adeguaAltezza(h0, 600);
      scivola(card, r0, 600);
      dissolvi(interni, 0, 1, 460, 380, function () { personeInCorso = false; });
    });
  }

  function chiudiPersona(card, btn, resto) {
    var altre = altreSchede(card);
    var interni = [card.querySelector(".testo"), btn];
    function applica() {
      resto.hidden = true;
      card.classList.remove("is-sola");
      altre.forEach(function (c) { c.hidden = false; });
      btn.setAttribute("aria-expanded", "false");
      renderPeopleButtons();
    }
    // Se la scheda chiusa finisce sopra lo schermo, la si riporta in vista
    function inVista() {
      var top = card.getBoundingClientRect().top;
      if (top < 0) window.scrollBy({ top: top - 24, behavior: senzaMovimento() ? "auto" : "smooth" });
    }
    if (senzaMovimento()) { applica(); inVista(); return; }
    personeInCorso = true;
    dissolvi(interni, 1, 0, 220, 0, function () {
      var r0 = card.getBoundingClientRect();
      var h0 = personeEl.offsetHeight;
      altre.forEach(function (c) { c.style.opacity = "0"; }); // tornano invisibili e poi compaiono
      cambiaLayout(card, r0, applica);
      adeguaAltezza(h0, 600);
      scivola(card, r0, 600);
      dissolvi(interni, 0, 1, 460, 380);
      dissolvi(altre, 0, 1, 460, 420, function () { personeInCorso = false; inVista(); });
    });
  }

  // Senza JS il testo resta tutto visibile; con JS si chiude e compare il pulsante
  each(".persona__altro", function (btn) {
    var resto = document.getElementById(btn.getAttribute("aria-controls"));
    if (!resto) return;
    resto.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.hidden = false;
    var card = personeEl && personeEl.contains(btn) ? btn.parentNode : null;
    btn.addEventListener("click", function () {
      var apri = resto.hidden;
      if (card) {
        if (personeInCorso) return;
        if (apri) apriPersona(card, btn, resto); else chiudiPersona(card, btn, resto);
        return;
      }
      if (resto.getAnimations && resto.getAnimations().length) return;
      resto.hidden = !apri;
      btn.setAttribute("aria-expanded", apri ? "true" : "false");
      renderPeopleButtons();
      if (!senzaMovimento()) srotola(resto, apri, btn);
    });
  });

  /** Storia: il resto del racconto si srotola (o si arrotola) in altezza mentre il testo compare o svanisce. */
  function srotola(resto, apri, btn) {
    if (!apri) resto.hidden = false; // resta visibile finché non si è arrotolato
    var stile = getComputedStyle(resto);
    var pieno = { height: resto.offsetHeight + "px", marginTop: stile.marginTop, opacity: 1, transform: "none" };
    var vuoto = { height: "0px", marginTop: "0px", opacity: 0, transform: "translateY(8px)" };
    resto.style.overflow = "clip";
    var an = resto.animate(apri ? [vuoto, pieno] : [pieno, vuoto], { duration: apri ? 560 : 460, easing: EASE_MOTO });
    an.onfinish = an.oncancel = function () {
      resto.style.overflow = "";
      if (apri) return;
      resto.hidden = true;
      // Chiuso il racconto, se il pulsante è finito sopra lo schermo lo si riporta in vista
      var top = btn.getBoundingClientRect().top;
      if (top < 80) window.scrollBy({ top: top - 160, behavior: "smooth" });
    };
  }

  // ---------------------------------------------------------------- Foto e galleria
  var foto = LOCALE.gallery || [];
  function findPhoto(id) {
    for (var i = 0; i < foto.length; i++) if (foto[i].id === id) return i;
    return -1;
  }

  /** Testi alternativi e didascalie delle foto nella lingua corrente (dai dati della galleria). */
  function renderPhotoTexts() {
    each("[data-foto]", function (a) {
      var i = findPhoto(a.getAttribute("data-foto"));
      var img = a.querySelector("img");
      if (i !== -1 && img) img.alt = tr(foto[i], "alt");
    });
    each("[data-didascalia]", function (c) {
      var i = findPhoto(c.getAttribute("data-didascalia"));
      if (i !== -1) c.textContent = tr(foto[i], "caption");
    });
  }

  var galleria = window.BIVIO_GALLERIA ? window.BIVIO_GALLERIA.avvia({
    dialog: document.querySelector(".lightbox"),
    foto: function () { return foto; },
    testo: function (g, campo) { return tr(g, campo); },
    base: ""
  }) : null;

  each("[data-foto]", function (a) {
    var i = findPhoto(a.getAttribute("data-foto"));
    if (i === -1 || !galleria) return;
    a.addEventListener("click", function (e) {
      e.preventDefault();
      galleria.apri(i);
    });
    a.addEventListener("pointerenter", function () { galleria.precarica(i); });
  });

  // Larghezza della barra di scorrimento (0 sui telefoni): serve al CSS per non far allargare la pagina con un modale aperto
  function misuraBarra() {
    if (document.documentElement.classList.contains("is-modal-open")) return;
    var barra = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty("--barra", (barra > 0 ? barra : 0) + "px");
  }
  misuraBarra();
  window.addEventListener("resize", misuraBarra);

  // ---------------------------------------------------------------- Torna su (come nel menu)
  // Compare oltre 600px di scorrimento; il clic riporta in cima e mette il focus sull'apertura
  (function () {
    var btn = document.querySelector(".to-top");
    var hero = document.getElementById("top");
    if (!btn) return;
    var visibile = null;
    function mostra(si) {
      if (si === visibile) return;
      visibile = si;
      btn.classList.toggle("is-visible", si);
      btn.setAttribute("aria-hidden", si ? "false" : "true");
      btn.tabIndex = si ? 0 : -1;
    }
    btn.hidden = false;
    mostra(window.scrollY > 600);
    window.addEventListener("scroll", function () { mostra(window.scrollY > 600); }, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: movimentoRidotto ? "auto" : "smooth" });
      if (hero) hero.focus({ preventScroll: true });
    });
  })();

  // «Guarda tutte le foto» sotto Il locale: dice che la galleria ha altre foto oltre a quelle in vista
  (function () {
    var riga = document.querySelector(".locale__tutte");
    if (!riga || !galleria) return;
    var inSezione = document.querySelectorAll(".locale [data-foto]").length;
    if (foto.length <= inSezione) return;
    riga.hidden = false;
    var btn = riga.querySelector("button");
    btn.addEventListener("click", function () { galleria.apri(0); });
    btn.addEventListener("pointerenter", function () { galleria.precarica(0); });
  })();

  // ---------------------------------------------------------------- Contatti e link
  function applyContacts() {
    var links = META.links || {};
    each("[data-link]", function (a) {
      var key = a.getAttribute("data-link");
      var url = safeHttps(links[key]);
      if (url) {
        a.setAttribute("href", url);
        a.removeAttribute("aria-disabled");
        a.hidden = false;
      } else if (key === "thefork") {
        a.hidden = true; // TheFork non ancora attivo: il pulsante non compare
      } else {
        a.removeAttribute("href");
        a.setAttribute("aria-disabled", "true");
      }
    });
    each("[data-meta='address']", function (n) { if (META.address) n.textContent = META.address; });
    each("[data-meta='phone']", function (a) {
      if (!META.phone) return;
      a.textContent = META.phone;
      a.setAttribute("href", "tel:" + META.phone.replace(/[^\d+]/g, ""));
    });
    // Pulsante «Chiamaci»: solo il link (apre le chiamate del telefono), il testo resta quello della lingua
    each("[data-meta='tel']", function (a) {
      if (META.phone) a.setAttribute("href", "tel:" + META.phone.replace(/[^\d+]/g, ""));
    });
    // Da file:// una cartella non apre il suo index.html: il link al menu punta al file
    if (location.protocol === "file:") each("[data-link-menu]", function (a) { a.setAttribute("href", "menu/index.html"); });
    each(".anno", function (n) { n.textContent = String(new Date().getFullYear()); });
  }

  // ---------------------------------------------------------------- Dati legali e privacy
  var privacyEl = document.querySelector(".privacy");
  var privacyOpener = null;

  function legalData() {
    return COMUNE.legalData(META, t("legalPending"));
  }

  function formatPrice(n) {
    return new Intl.NumberFormat(locale(), { style: "currency", currency: "EUR" }).format(n);
  }

  function formatLegalDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
    if (!m) return s || "";
    try {
      var d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
      return new Intl.DateTimeFormat(locale(), { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch (e) { return s; }
  }

  function renderLegal() {
    var box = document.querySelector(".piede__legale");
    if (!box) return;
    var data = legalData();
    box.textContent = "";
    box.hidden = !data;
    if (!data) return;
    var btn = el("button", { type: "button", class: "piede__privacy", "aria-haspopup": "dialog", text: t("privacyLink") });
    btn.addEventListener("click", function () { openPrivacy(btn); });
    box.appendChild(document.createTextNode(data.company + " · " + t("vatLabel") + " " + data.vat + " · "));
    box.appendChild(btn);
  }

  function closeIcon() {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    [["viewBox", "0 0 24 24"], ["width", "22"], ["height", "22"], ["fill", "none"], ["stroke", "currentColor"], ["stroke-width", "1.6"],
      ["stroke-linecap", "round"], ["aria-hidden", "true"], ["focusable", "false"]].forEach(function (a) { svg.setAttribute(a[0], a[1]); });
    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", "M6 6l12 12M18 6 6 18");
    svg.appendChild(path);
    return svg;
  }

  function renderPrivacy() {
    var panel = privacyEl && privacyEl.querySelector(".privacy__pannello");
    var data = legalData();
    if (!panel || !data) return;
    panel.textContent = "";
    var close = el("button", { type: "button", class: "privacy__chiudi", "aria-label": t("chiudi") }, [closeIcon()]);
    close.addEventListener("click", function () { privacyEl.close(); });
    panel.appendChild(close);
    panel.appendChild(el("h2", { class: "privacy__titolo", id: "privacy-titolo", text: t("privacyTitle") }));
    COMUNE.privacySections(LOCALE.privacy, lang, data, formatPrice).forEach(function (sezione) {
      panel.appendChild(el("h3", { class: "privacy__h", text: sezione.h }));
      sezione.p.forEach(function (testo) { panel.appendChild(el("p", { text: testo })); });
    });
    if (data.updated) panel.appendChild(el("p", { class: "privacy__data", text: fmt("privacyUpdated", "", formatLegalDate(data.updated)) }));
  }

  function openPrivacy(opener) {
    if (!privacyEl || !legalData() || privacyEl.open) return;
    privacyOpener = opener || document.activeElement;
    renderPrivacy();
    if (typeof privacyEl.showModal === "function") {
      document.documentElement.classList.add("is-modal-open");
      try { privacyEl.showModal(); } catch (e) { privacyEl.setAttribute("open", ""); }
    } else {
      privacyEl.setAttribute("open", "");
    }
    var panel = privacyEl.querySelector(".privacy__pannello");
    if (panel) panel.focus({ preventScroll: true });
  }

  if (privacyEl) {
    privacyEl.addEventListener("close", function () {
      document.documentElement.classList.remove("is-modal-open");
      if (location.hash === "#privacy") {
        try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* file://: non critico */ }
      }
      var target = privacyOpener && document.contains(privacyOpener) ? privacyOpener : document.querySelector(".piede__privacy");
      if (target && typeof target.focus === "function") target.focus({ preventScroll: true });
      privacyOpener = null;
    });
    // Clic sullo sfondo (fuori dal pannello) chiude
    privacyEl.addEventListener("click", function (e) { if (e.target === privacyEl) privacyEl.close(); });
  }

  // ---------------------------------------------------------------- Prenota (modale)
  // Il pulsante «Prenota» dell'apertura apre il modale con chiamata, WhatsApp e TheFork.
  // Apertura e chiusura animate in CSS con la classe is-aperto: alla chiusura si aspetta la fine
  // della transizione (o un timer di riserva) prima di chiudere davvero il <dialog>.
  var prenotaEl = document.querySelector(".modale-prenota");
  var prenotaOpener = null;
  var prenotaInChiusura = false;
  var movimentoRidotto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function apriPrenota(opener) {
    if (!prenotaEl || prenotaEl.open || typeof prenotaEl.showModal !== "function") return false;
    prenotaOpener = opener || document.activeElement;
    document.documentElement.classList.add("is-modal-open");
    try { prenotaEl.showModal(); } catch (e) { document.documentElement.classList.remove("is-modal-open"); return false; }
    void prenotaEl.offsetWidth; // parte dallo stato chiuso, così la transizione si vede
    prenotaEl.classList.add("is-aperto");
    return true;
  }

  function chiudiPrenota() {
    if (!prenotaEl || !prenotaEl.open || prenotaInChiusura) return;
    if (movimentoRidotto) { prenotaEl.close(); return; }
    prenotaInChiusura = true;
    var fatto = false;
    function fine() {
      if (fatto) return;
      fatto = true;
      prenotaEl.removeEventListener("transitionend", suFine);
      prenotaInChiusura = false;
      prenotaEl.close();
    }
    function suFine(e) { if (e.target === prenotaEl && e.propertyName === "transform") fine(); }
    prenotaEl.addEventListener("transitionend", suFine);
    setTimeout(fine, 600); // riserva se transitionend non arriva
    prenotaEl.classList.remove("is-aperto");
  }

  if (prenotaEl) {
    each("[data-apri-prenota]", function (a) {
      a.addEventListener("click", function (e) {
        if (apriPrenota(a)) e.preventDefault(); // senza <dialog> il link resta una chiamata
      });
    });
    prenotaEl.querySelector(".modale-prenota__chiudi").addEventListener("click", chiudiPrenota);
    // Esc: chiusura animata invece di quella immediata del browser
    prenotaEl.addEventListener("cancel", function (e) { e.preventDefault(); chiudiPrenota(); });
    // Clic sullo sfondo (fuori dal pannello) chiude
    prenotaEl.addEventListener("click", function (e) { if (e.target === prenotaEl) chiudiPrenota(); });
    prenotaEl.addEventListener("close", function () {
      prenotaEl.classList.remove("is-aperto");
      document.documentElement.classList.remove("is-modal-open");
      if (prenotaOpener && document.contains(prenotaOpener) && typeof prenotaOpener.focus === "function") prenotaOpener.focus({ preventScroll: true });
      prenotaOpener = null;
    });
  }

  function syncPrivacyFromHash() {
    if (location.hash === "#privacy") openPrivacy(document.querySelector(".piede__privacy"));
  }
  window.addEventListener("hashchange", syncPrivacyFromHash);

  // ---------------------------------------------------------------- Avvio
  applyContacts();
  setLanguage(detectLanguage(), false);
  syncPrivacyFromHash();
  // Stato e giorno di oggi si aggiornano ogni minuto
  window.setInterval(function () { renderStatus(); renderHours(); }, 60000);
})();
