/**
 * Bivio Bistrot — rendering del menu
 * ---------------------------------------------------------------------------
 * Legge window.BIVIO_MENU (menu-data.js) e costruisce il DOM con createElement +
 * textContent (mai innerHTML con dati). Nessuna dipendenza, nessun modulo.
 * Gestisce anche la lingua (IT/EN), i pulsanti Maps/WhatsApp e i testi statici
 * marcati con data-i18n / data-i18n-aria in index.html.
 */
(function () {
  "use strict";

  var MENU = window.BIVIO_MENU;
  var NS_SVG = "http://www.w3.org/2000/svg";

  // ---------------------------------------------------------------- Riferimenti DOM
  var mainEl = document.getElementById("menu");
  var navEl = document.querySelector(".menu-nav");
  var tabsEl = document.querySelector(".tabs");
  var subnavEl = document.querySelector(".subnav");
  // Riga di titoli agganciata sotto le tab (sezioni a scorrimento): creata qui, riempita da renderSubnav
  var navTitlesEl = subnavEl ? document.createElement("div") : null;
  if (navTitlesEl) {
    navTitlesEl.className = "titoli titoli--fissa";
    subnavEl.parentNode.insertBefore(navTitlesEl, subnavEl);
  }
  var toTopEl = document.querySelector(".to-top");
  var topEl = document.getElementById("top");
  var yearEl = document.getElementById("year");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Tema a tempo: la classe tema-<nome> su <html> la mette lo script in testa a index.html (da `meta.tema` o ?tema=)
  var halloween = document.documentElement.classList.contains("tema-halloween");

  /** Anno corrente nel footer. */
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---------------------------------------------------------------- Helper
  /**
   * Crea un elemento.
   * @param {string} tag
   * @param {Object=} attrs  "class", "text" (textContent) o attributi arbitrari; null/false = ignorato
   * @param {Array=} children  nodi o stringhe
   */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else node.setAttribute(key, value === true ? "" : value);
      });
    }
    (children || []).forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  /** Crea un elemento SVG (namespace corretto). */
  function svg(tag, attrs) {
    var node = document.createElementNS(NS_SVG, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }

  // ---------------------------------------------------------------- Lingua
  var LOCALES = { it: "it-IT", en: "en-GB" };
  var STORAGE_KEY = "bivio-lang";
  var lang = "it";

  function hasLang(code) {
    return !!(MENU && MENU.meta && MENU.meta.languages && MENU.meta.languages.indexOf(code) !== -1);
  }

  /** Priorità: ?lang= > localStorage > meta.defaultLanguage (mai la lingua del browser). */
  function detectLanguage() {
    var fromQuery = null;
    try { fromQuery = new URLSearchParams(location.search).get("lang"); } catch (e) { /* URLSearchParams assente */ }
    if (fromQuery && hasLang(fromQuery)) return fromQuery;
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && hasLang(saved)) return saved;
    } catch (e) { /* localStorage bloccato: non è critico */ }
    return (MENU && MENU.meta && MENU.meta.defaultLanguage) || "it";
  }

  /** Stringa dell'interfaccia; fallback italiano, poi la chiave stessa. */
  function t(key) {
    var ui = (MENU && MENU.ui) || {};
    if (ui[lang] && ui[lang][key] !== undefined) return ui[lang][key];
    if (ui.it && ui.it[key] !== undefined) return ui.it[key];
    return key;
  }

  /** Campo di contenuto tradotto: obj.en[field] se presente, altrimenti il campo base (italiano). */
  function tr(obj, field) {
    if (lang !== "it" && obj && obj[lang] && obj[lang][field] !== undefined && obj[lang][field] !== null) {
      return obj[lang][field];
    }
    return obj ? obj[field] : undefined;
  }

  // I formattatori sono costosi da creare: una istanza per locale, in cache.
  var priceFormatters = {};
  var abvFormatters = {};
  function locale() { return LOCALES[lang] || "it-IT"; }
  function formatPrice(n) {
    var loc = locale();
    if (!priceFormatters[loc]) priceFormatters[loc] = new Intl.NumberFormat(loc, { style: "currency", currency: "EUR" });
    return priceFormatters[loc].format(n);
  }
  function formatAbv(n) {
    var loc = locale();
    if (!abvFormatters[loc]) abvFormatters[loc] = new Intl.NumberFormat(loc, { maximumFractionDigits: 1 });
    return abvFormatters[loc].format(n) + " % Vol";
  }

  function scrollBehavior() {
    return reducedMotion.matches ? "auto" : "smooth";
  }

  function navHeight() {
    return navEl ? navEl.offsetHeight : 0;
  }

  // ---------------------------------------------------------------- Ora (ordine dinamico delle categorie)
  // Calcoli su ora e giorno di Roma: stanno in ../assets/comune.js (in comune con il sito del locale)
  var COMUNE = window.BIVIO_COMUNE;
  var inWindow = COMUNE.inWindow;
  var currentTime = COMUNE.currentTime;
  var currentDay = COMUNE.currentDay;
  var shownTime = COMUNE.shownTime;

  /**
   * Categorie della sezione nell'ordine di rendering. Se la sezione ha `orderByTime` e una sua fascia è attiva, vale
   * l'ordine di quella fascia (le categorie non elencate restano in coda, in ordine di dichiarazione). Altrimenti quelle
   * la cui fascia `firstFrom`/`firstUntil` è attiva passano in testa (in ordine di dichiarazione).
   */
  function orderedCategories(section) {
    var now = currentTime();
    var slots = section.orderByTime || [];
    for (var i = 0; i < slots.length; i++) {
      if (!slots[i] || !slots[i].order || !inWindow(slots[i].from, slots[i].until, now)) continue;
      var order = slots[i].order;
      var listed = [], others = [];
      order.forEach(function (id) {
        section.categories.forEach(function (cat) { if (cat.id === id && listed.indexOf(cat) === -1) listed.push(cat); });
      });
      section.categories.forEach(function (cat) { if (listed.indexOf(cat) === -1) others.push(cat); });
      return listed.concat(others);
    }
    var first = [], rest = [];
    section.categories.forEach(function (cat) {
      (cat.firstFrom && inWindow(cat.firstFrom, cat.firstUntil, now) ? first : rest).push(cat);
    });
    return first.concat(rest);
  }

  // ---------------------------------------------------------------- Orari
  // Il calcolo (aperto/chiuso, giorni raggruppati) sta in ../assets/comune.js; qui solo i testi.
  var dayFormatters = {};

  /** Orari validi (array di 7) o null: senza, pill e orari del footer non compaiono. */
  function weekHours() {
    return COMUNE.validHours(MENU && MENU.meta && MENU.meta.hours);
  }

  /** Nome del giorno i (0 = lunedì) nella lingua corrente. style: "long" | "short". Prima lettera maiuscola. */
  function dayName(i, style) {
    var key = locale() + style;
    if (!dayFormatters[key]) dayFormatters[key] = new Intl.DateTimeFormat(locale(), { weekday: style });
    var name = dayFormatters[key].format(new Date(2024, 0, 1 + i)); // 1 gennaio 2024 era un lunedì
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /** Sostituisce {t} e {d} nella stringa di interfaccia `key`. */
  function fmt(key, time, day) {
    return t(key).replace("{t}", time).replace("{d}", day || "");
  }

  /** Stato attuale con il testo della pill: { open: bool, text } oppure null se non ci sono orari. */
  function openingStatus() {
    var st = COMUNE.openingStatus(weekHours());
    if (!st) return null;
    if (st.open) return { open: true, text: t("openNow") + " · " + fmt("closesAt", shownTime(st.closes, true)) };
    var closed = t("closedNow") + " · ";
    var time = shownTime(st.opens, false);
    if (st.inDays === 0) return { open: false, text: closed + fmt("opensAt", time) };
    if (st.inDays === 1) return { open: false, text: closed + fmt("opensTomorrow", time) };
    return { open: false, text: closed + fmt("opensOn", time, dayName(st.day, "long").toLowerCase()) };
  }

  // ---------------------------------------------------------------- Guard
  if (!MENU || !MENU.sections || !mainEl) {
    if (mainEl) {
      mainEl.appendChild(el("p", { class: "menu__notice", text: "Il menu non è al momento disponibile. Riprova tra qualche istante. / The menu is currently unavailable." }));
    }
    return;
  }

  // ---------------------------------------------------------------- Stato
  var activeSectionId = null;
  var NAV_TARGETS = ".category"; // blocchi che hanno una chip nella subnav e vengono osservati dallo scrollspy
  var spyObserver = null;
  var spyOrder = [];    // id delle categorie osservate dallo scrollspy, in ordine di documento (vuoto nelle sezioni a pagine)
  var spyVisible = {};  // id -> true se la categoria è nella fascia attiva
  var spyLock = null;   // categoria scelta con un clic su una chip: lo scrollspy la rispetta finché l'utente non scorre
  var spyMarked = null; // chip evidenziata dallo scrollspy (evita di rimarcarla a ogni scroll)
  var activeCategory = {}; // id sezione -> id categoria aperta (solo sezioni "paged"): tornando nella scheda si riapre l'ultima vista
  var printAll = false;    // true durante la stampa: le sezioni "paged" mostrano tutte le categorie

  function findSection(id) {
    for (var i = 0; i < MENU.sections.length; i++) {
      if (MENU.sections[i].id === id) return MENU.sections[i];
    }
    return null;
  }

  /** Legge l'hash: "#vini" o "#vini/rossi" -> { section, category }. */
  function parseHash() {
    var raw = (location.hash || "").replace(/^#/, "");
    try { raw = decodeURIComponent(raw); } catch (e) { /* hash malformato: usa il testo grezzo */ }
    var parts = raw.split("/");
    var section = findSection(parts[0]);
    return { section: section, category: section ? parts[1] || null : null };
  }

  function updateHash(value) {
    try {
      history.replaceState(null, "", "#" + value);
    } catch (e) {
      /* file:// in alcuni browser può rifiutare replaceState: non è critico */
    }
  }

  // ---------------------------------------------------------------- Sezioni a pagine
  /** Voci di una categoria (array sorgente scelto dal tipo di sezione, filtrato per categoria). */
  function categoryItems(section, cat) {
    var source = section.type === "food" ? MENU.dishes : section.type === "list2" ? MENU[section.source] : MENU.spirits;
    return (source || []).filter(function (item) { return item.category === cat.id; });
  }

  /** Categorie nell'ordine di rendering, solo quelle con almeno una voce. */
  function visibleCategories(section) {
    return orderedCategories(section).filter(function (cat) { return categoryItems(section, cat).length > 0; });
  }

  /** true se la sezione mostra una categoria alla volta (non durante la stampa). */
  function isPaged(section) {
    return section.paged === true && !printAll;
  }

  /** Categoria aperta di una sezione a pagine: quella ricordata se valida, altrimenti la prima; null se non ce ne sono. */
  function currentCategory(section) {
    var cats = visibleCategories(section);
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].id === activeCategory[section.id]) return cats[i];
    }
    return cats.length ? cats[0] : null;
  }

  // ---------------------------------------------------------------- Immagini
  /** Segnaposto grafico: piatto con posate, line-art. */
  function buildFallbackIcon() {
    var s = svg("svg", { viewBox: "0 0 64 64", "class": "dish__icon", fill: "none", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" });
    s.appendChild(svg("circle", { cx: "32", cy: "32", r: "13" }));
    s.appendChild(svg("circle", { cx: "32", cy: "32", r: "8" }));
    s.appendChild(svg("path", { d: "M11 14v10a3 3 0 0 0 3 3v23M11 14v8M15 14v8M19 14v10a3 3 0 0 1-3 3" }));
    s.appendChild(svg("path", { d: "M53 14c-3 2-4.500 6-4.500 11 0 3 1.500 4 4.500 4v21M53 14v15" }));
    return s;
  }

  /**
   * Catena di fallback per la foto di un piatto:
   *   1. dish.image        -> foto locale (assets/images/<categoria>/<id>.jpg)
   *   2. dish.placeholder  -> foto Unsplash tematica, provata una sola volta
   *                           (se image è null si parte direttamente da qui)
   *   3. icona SVG         -> ripiego se un file indicato non si carica; il box (aspect-ratio 4/3) resta identico
   * Se image e placeholder sono entrambi null non si arriva qui: renderDish non crea il riquadro.
   * Gli handler vanno impostati PRIMA di assegnare src.
   */
  function attachImageFallback(img, figure, dish) {
    var triedPlaceholder = false;
    var start = dish.image;
    if (!start && dish.placeholder) {
      triedPlaceholder = true;
      start = dish.placeholder;
    }

    function showIcon() {
      img.onerror = null;
      if (img.parentNode) img.parentNode.removeChild(img);
      figure.classList.add("dish__media--fallback");
      figure.appendChild(buildFallbackIcon());
    }

    img.onerror = function () {
      if (!triedPlaceholder && dish.placeholder) {
        triedPlaceholder = true;
        img.src = dish.placeholder;
      } else {
        showIcon();
      }
    };
    img.src = start;
  }

  // ---------------------------------------------------------------- Allergeni
  function findAllergen(id) {
    var list = MENU.allergens || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  /** Icona "i" line-art in un cerchio (decorativa). size in px. */
  function buildInfoIcon(size) {
    var s = svg("svg", { viewBox: "0 0 24 24", width: String(size), height: String(size), "class": "info-icon", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" });
    s.appendChild(svg("circle", { cx: "12", cy: "12", r: "10" }));
    s.appendChild(svg("path", { d: "M12 11v5.500M12 7.800v.01" }));
    return s;
  }

  /**
   * Allergeni del piatto. `allergens`: array di id = presenti; [] o assente = nulla;
   * "chef" = comunicati separatamente. Restituisce null se non c'è nulla da mostrare.
   * Sotto il piatto: solo cerchietti numerati (aria-hidden) dentro un pulsante discreto che apre il pop-up allergeni;
   * il testo per screen reader ("Allergeni: Glutine, Uova") è in uno span visually-hidden.
   */
  function renderDishAllergens(d) {
    var a = d.allergens;
    if (a === "chef") {
      return el("p", { class: "dish__allergens dish__allergens--chef", text: t("allergensChef") });
    }
    if (!Array.isArray(a) || !a.length) return null;
    var names = [];
    var circles = [];
    a.slice().sort(function (x, y) { return x - y; }).forEach(function (id) {
      var al = findAllergen(id);
      if (!al) return;
      var label = tr(al, "name");
      names.push(label);
      circles.push(el("span", { class: "dish__allergen", "aria-hidden": "true", "data-allergen": String(id), title: id + " · " + label, text: String(id) }));
    });
    if (!circles.length) return null;
    var link = el("button", { type: "button", class: "dish__allergens-link", "aria-haspopup": "dialog" },
      [el("span", { class: "visually-hidden", text: t("allergensLabel") + ": " + names.join(", ") })].concat(circles));
    link.addEventListener("click", function () { openAllergens(d, link); });
    return el("p", { class: "dish__allergens" }, [link]);
  }

  /**
   * Elenco numerato dei 14 allergeni (ol.allergen-list), usato dal pop-up e dalla legenda di stampa.
   * `presenti`: array di id degli allergeni del piatto (evidenziati) oppure null (elenco neutro).
   */
  function renderAllergenList(presenti) {
    var evidenzia = Array.isArray(presenti) && presenti.length > 0;
    return el("ol", { class: evidenzia ? "allergen-list allergen-list--piatto" : "allergen-list" }, (MENU.allergens || []).map(function (al) {
      var presente = evidenzia && presenti.indexOf(al.id) !== -1;
      return el("li", { class: presente ? "allergen is-presente" : "allergen", "data-allergen": String(al.id) }, [
        el("span", { class: "allergen__num", "aria-hidden": "true", text: String(al.id) }),
        el("span", { class: "allergen__name", text: tr(al, "name") }),
        presente ? el("span", { class: "visually-hidden", text: t("allergensPresent") }) : null
      ]);
    }));
  }

  /**
   * Legenda allergeni per la sola stampa (sezione Cucina, dopo il pager): a schermo è nascosta,
   * il cliente usa il pop-up (openAllergens). Intestazione + elenco + invito a comunicare le allergie.
   */
  function renderAllergenLegend() {
    if (!(MENU.allergens || []).length) return null;
    return el("aside", { class: "menu-info menu-info--stampa", "aria-labelledby": "title-allergeni" }, [
      el("div", { class: "menu-info__head" }, [
        buildInfoIcon(20),
        el("h2", { class: "menu-info__title", id: "title-allergeni", text: t("allergensInfoTitle") })
      ]),
      renderAllergenList(null),
      el("p", { class: "allergen-ask", text: t("allergyAsk") })
    ]);
  }

  /** Note sotto i piatti della Cucina: invito a toccare i numeri (solo a schermo) + nota "prodotto gelo". */
  function renderMenuNotes() {
    return el("div", { class: "menu-notes" }, [
      el("p", { class: "menu-notes__hint" }, [buildInfoIcon(14), el("span", { text: t("allergensHint") })]),
      el("p", { class: "allergen-note" }, [el("span", { class: "allergen-note__mark", "aria-hidden": "true", text: "*" }), " " + t("frozenNote")])
    ]);
  }

  /**
   * Frase sugli allergeni nel footer: "Per allergie e intolleranze [leggi qui l'elenco degli allergeni] o chiedi al
   * nostro personale." Il tratto tra parentesi è un pulsante che apre il pop-up con l'elenco completo.
   * Senza allergeni nei dati resta la frase semplice (la stessa dell'HTML statico).
   */
  function renderFooterAllergens() {
    var box = document.querySelector(".site-footer__allergeni");
    if (!box) return;
    box.textContent = "";
    if (!(MENU.allergens || []).length) {
      box.textContent = t("allergens");
      return;
    }
    // Il link sta in mezzo alla frase: si spezza il testo sul segnaposto {link}
    var parts = t("allergensFooter").split("{link}");
    // <a role="button"> e non <button>: un pulsante non va a capo a metà, e su telefono la frase si spezzerebbe male
    var link = el("a", { href: "#", role: "button", class: "site-footer__link", "aria-haspopup": "dialog", text: t("allergensFooterLink") });
    link.addEventListener("click", function (e) {
      e.preventDefault();
      openAllergens(null, link);
    });
    link.addEventListener("keydown", function (e) {
      if (e.key !== " ") return; // come un pulsante: si attiva anche con la barra spaziatrice
      e.preventDefault();
      openAllergens(null, link);
    });
    box.appendChild(document.createTextNode(parts[0]));
    box.appendChild(link);
    box.appendChild(document.createTextNode(parts[1] || ""));
  }

  // ---------------------------------------------------------------- Pop-up allergeni
  var allergenModalEl = document.querySelector(".allergen-modal");
  var allergenState = { open: false, dish: null };
  var allergenReady = false;
  var allergenOpener = null; // elemento che ha aperto il pop-up: riceve il focus alla chiusura

  /** Icona X (chiudi), line-art, decorativa. size in px. */
  function buildCloseIcon(size) {
    var s = svg("svg", { viewBox: "0 0 24 24", width: String(size), height: String(size), fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" });
    s.appendChild(svg("path", { d: "M6 6l12 12M18 6 6 18" }));
    return s;
  }

  /**
   * Apertura dei pop-up allergeni e privacy: fa crescere il pop-up dal punto in cui sta `opener` (i numeretti del
   * piatto, il link nel footer) impostando l'origine della trasformazione (--origine-x/-y, lette da style.css).
   * Senza un opener visibile a schermo il pop-up cresce dal proprio centro. Va chiamata dopo l'apertura.
   */
  function setPopupOrigin(dialog, opener) {
    var x = "50%", y = "50%";
    try {
      var r = opener && typeof opener.getBoundingClientRect === "function" ? opener.getBoundingClientRect() : null;
      if (r && (r.width || r.height) && r.bottom > 0 && r.top < window.innerHeight) {
        // Il centro non cambia con la scala dell'animazione già partita; le misure vere sono offsetWidth/Height
        var d = dialog.getBoundingClientRect();
        var sinistra = d.left + d.width / 2 - dialog.offsetWidth / 2;
        var alto = d.top + d.height / 2 - dialog.offsetHeight / 2;
        x = Math.round(r.left + r.width / 2 - sinistra) + "px";
        y = Math.round(r.top + r.height / 2 - alto) + "px";
      }
      dialog.style.setProperty("--origine-x", x);
      dialog.style.setProperty("--origine-y", y);
    } catch (e) { /* non critico: resta l'origine al centro */ }
  }

  /**
   * Chiusura animata dei pop-up allergeni e privacy (X, sfondo, Esc): il pop-up rimpicciolisce verso il punto da cui
   * era uscito (classe .is-closing), poi si chiude davvero. animationend + timeout di sicurezza, come il modale lingua.
   */
  function closePopup(dialog) {
    if (!dialog || !dialog.open || dialog.classList.contains("is-closing")) return;
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      dialog.removeEventListener("animationend", onEnd);
      dialog.classList.remove("is-closing");
      if (dialog.open) dialog.close();
    }
    function onEnd(e) { if (e.target === dialog && e.animationName === "popup-chiude") finish(); }
    dialog.addEventListener("animationend", onEnd);
    dialog.classList.add("is-closing");
    window.setTimeout(finish, 320);
  }

  /** Ricostruisce il contenuto del pop-up nella lingua corrente per `dish` (o per l'elenco completo se null). */
  function renderAllergenModal(dish) {
    var panel = allergenModalEl.querySelector(".allergen-modal__panel");
    if (!panel) return;
    var presenti = [];
    if (dish && Array.isArray(dish.allergens)) {
      dish.allergens.forEach(function (id) { if (findAllergen(id)) presenti.push(id); });
    }
    panel.textContent = "";

    var closeBtn = el("button", { type: "button", class: "allergen-modal__close", "aria-label": t("close") }, [buildCloseIcon(24)]);
    closeBtn.addEventListener("click", function () { closePopup(allergenModalEl); });
    panel.appendChild(closeBtn);
    panel.appendChild(el("h2", { class: "allergen-modal__title", id: "allergen-modal-title", text: t("allergensInfoTitle") }));

    if (presenti.length) {
      // Il nome del piatto va in evidenza: si spezza il testo sul segnaposto {d}
      var parts = fmt("allergensContains", "", "\u0001").split("\u0001");
      var nomi = presenti.slice().sort(function (x, y) { return x - y; }).map(function (id) { return tr(findAllergen(id), "name"); });
      panel.appendChild(el("p", { class: "allergen-modal__piatto" }, [
        parts[0], el("strong", { text: tr(dish, "name") }), (parts[1] || "") + " " + nomi.join(", ")
      ]));
    }

    panel.appendChild(renderAllergenList(presenti));
    panel.appendChild(el("p", { class: "allergen-ask", text: t("allergyAsk") }));
  }

  /**
   * Apre il pop-up allergeni. `dish` (può essere null): evidenzia i suoi allergeni nell'elenco;
   * `opener`: elemento che riceve il focus alla chiusura.
   */
  function openAllergens(dish, opener) {
    if (!allergenModalEl) return;
    setupAllergenModal();
    if (allergenState.open) return;
    allergenOpener = opener || document.activeElement;
    allergenState.dish = dish || null;
    renderAllergenModal(allergenState.dish);
    allergenState.open = true;
    if (typeof allergenModalEl.showModal === "function") {
      document.documentElement.classList.add("is-modal-open");
      try { allergenModalEl.showModal(); } catch (e) {
        document.documentElement.classList.remove("is-modal-open");
        allergenModalEl.setAttribute("open", "");
      }
    } else {
      // Nessun <dialog> modale: l'informazione deve comunque essere leggibile
      allergenModalEl.setAttribute("open", "");
    }
    setPopupOrigin(allergenModalEl, opener);
    var panel = allergenModalEl.querySelector(".allergen-modal__panel");
    if (panel) panel.focus({ preventScroll: true });
  }

  /** Listener del pop-up: registrati una sola volta, alla prima apertura. */
  function setupAllergenModal() {
    if (allergenReady) return;
    allergenReady = true;
    // Alla chiusura (Esc, X o sfondo): sblocca lo scroll e riporta il focus all'elemento che ha aperto
    allergenModalEl.addEventListener("close", function () {
      allergenState.open = false;
      allergenState.dish = null;
      document.documentElement.classList.remove("is-modal-open");
      // Aperto da #sezione/allergeni: toglie "allergeni" dall'hash, altrimenti un ricaricamento riaprirebbe il pop-up
      if (/\/allergeni$/.test(location.hash)) updateHash(activeSectionId);
      if (allergenOpener && document.contains(allergenOpener) && typeof allergenOpener.focus === "function") {
        allergenOpener.focus({ preventScroll: true });
      }
      allergenOpener = null;
    });
    // Click sullo sfondo: il padding sta sul pannello, quindi e.target === dialog solo fuori dal pannello
    allergenModalEl.addEventListener("click", function (e) {
      if (e.target === allergenModalEl) closePopup(allergenModalEl);
    });
    // Esc: stessa chiusura animata
    allergenModalEl.addEventListener("cancel", function (e) { e.preventDefault(); closePopup(allergenModalEl); });
  }

  // ---------------------------------------------------------------- Dati legali + pop-up privacy
  /** Dati legali oppure null ("in attesa"): il calcolo sta in ../assets/comune.js. Debug: `?anteprima=legale`. */
  function legalData() {
    return COMUNE.legalData(MENU && MENU.meta, t("legalPending"));
  }

  /** Riga legale nel footer ("Ragione sociale · P. IVA … · Privacy"); nascosta e vuota se i dati sono in attesa. */
  function renderLegal() {
    var box = document.querySelector(".site-footer__legal");
    if (!box) return;
    var data = legalData();
    box.textContent = "";
    box.hidden = !data;
    if (!data) return;
    var btn = el("button", { type: "button", class: "site-footer__privacy", "aria-haspopup": "dialog", text: t("privacyLink") });
    btn.addEventListener("click", function () { openPrivacy(btn); });
    box.appendChild(document.createTextNode(data.company + " · " + t("vatLabel") + " " + data.vat + " · "));
    box.appendChild(btn);
  }

  // ---- Pop-up privacy
  var privacyModalEl = document.querySelector(".privacy-modal");
  var privacyState = { open: false };
  var privacyReady = false;
  var privacyOpener = null; // elemento che ha aperto il pop-up: riceve il focus alla chiusura

  /** Data "AAAA-MM-GG" nella lingua corrente ("7 ottobre 2026"); stringa grezza se il formato non è valido. */
  function formatLegalDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
    if (!m) return s || "";
    try {
      var d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
      return new Intl.DateTimeFormat(locale(), { day: "numeric", month: "long", year: "numeric" }).format(d);
    } catch (e) { return s; }
  }

  /** Ricostruisce il contenuto del pop-up privacy nella lingua corrente. */
  function renderPrivacyModal() {
    var panel = privacyModalEl && privacyModalEl.querySelector(".privacy-modal__panel");
    var data = legalData();
    if (!panel || !data) return;
    panel.textContent = "";

    var closeBtn = el("button", { type: "button", class: "privacy-modal__close", "aria-label": t("close") }, [buildCloseIcon(24)]);
    closeBtn.addEventListener("click", function () { closePopup(privacyModalEl); });
    panel.appendChild(closeBtn);
    panel.appendChild(el("h2", { class: "privacy-modal__title", id: "privacy-modal-title", text: t("privacyTitle") }));

    // Testo pronto (segnaposto sostituiti, paragrafi da saltare già tolti): ../assets/comune.js
    COMUNE.privacySections(MENU.privacy, lang, data, formatPrice).forEach(function (sezione) {
      panel.appendChild(el("h3", { class: "privacy-modal__h", text: sezione.h }));
      sezione.p.forEach(function (testo) { panel.appendChild(el("p", { text: testo })); });
    });

    if (data.updated) {
      panel.appendChild(el("p", { class: "privacy-modal__data", text: fmt("privacyUpdated", "", formatLegalDate(data.updated)) }));
    }
  }

  /** Apre il pop-up privacy (non fa nulla se i dati legali sono in attesa). `opener` riceve il focus alla chiusura. */
  function openPrivacy(opener) {
    if (!privacyModalEl || !legalData()) return;
    setupPrivacyModal();
    if (privacyState.open) return;
    privacyOpener = opener || document.activeElement;
    renderPrivacyModal();
    privacyState.open = true;
    if (typeof privacyModalEl.showModal === "function") {
      document.documentElement.classList.add("is-modal-open");
      try { privacyModalEl.showModal(); } catch (e) {
        document.documentElement.classList.remove("is-modal-open");
        privacyModalEl.setAttribute("open", "");
      }
    } else {
      // Nessun <dialog> modale: l'informativa deve comunque essere leggibile
      privacyModalEl.setAttribute("open", "");
    }
    setPopupOrigin(privacyModalEl, opener);
    var panel = privacyModalEl.querySelector(".privacy-modal__panel");
    if (panel) panel.focus({ preventScroll: true });
  }

  /** Listener del pop-up privacy: registrati una sola volta, alla prima apertura. */
  function setupPrivacyModal() {
    if (privacyReady) return;
    privacyReady = true;
    // Alla chiusura (Esc, X o sfondo): sblocca lo scroll, toglie #privacy dall'URL e riporta il focus
    privacyModalEl.addEventListener("close", function () {
      privacyState.open = false;
      document.documentElement.classList.remove("is-modal-open");
      if (location.hash === "#privacy") {
        try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* file://: non critico */ }
      }
      // Il pulsante del footer viene ricreato a ogni cambio lingua: se l'opener non c'è più si cerca quello attuale
      var target = privacyOpener && document.contains(privacyOpener) ? privacyOpener : document.querySelector(".site-footer__privacy");
      if (target && typeof target.focus === "function") target.focus({ preventScroll: true });
      privacyOpener = null;
    });
    // Click sullo sfondo: il padding sta sul pannello, quindi e.target === dialog solo fuori dal pannello
    privacyModalEl.addEventListener("click", function (e) {
      if (e.target === privacyModalEl) closePopup(privacyModalEl);
    });
    // Esc: stessa chiusura animata
    privacyModalEl.addEventListener("cancel", function (e) { e.preventDefault(); closePopup(privacyModalEl); });
  }

  /** Hash esattamente "#privacy": apre il pop-up (se i dati legali ci sono). */
  function syncPrivacyFromHash() {
    if (location.hash === "#privacy" && legalData()) openPrivacy(document.querySelector(".site-footer__privacy"));
  }

  // ---------------------------------------------------------------- Renderer
  function renderDish(d, i) {
    // Senza image né placeholder: card solo testo, nessun riquadro
    var figure = null;
    if (d.image || d.placeholder) {
      var img = el("img", { alt: tr(d, "name"), loading: "lazy", decoding: "async", width: "800", height: "600" });
      figure = el("figure", { class: "dish__media" }, [img]);
      attachImageFallback(img, figure, d);
    }

    // Nome + eventuale asterisco "prodotto gelo"
    var nameEl = el("h3", { class: "dish__name", text: tr(d, "name") });
    if (d.frozen) {
      nameEl.appendChild(el("span", { class: "dish__frozen", title: t("frozenMark"), "aria-label": t("frozenMark"), text: "*" }));
    }
    // Prezzo assente (price: null): l'elemento non viene creato
    var hasPrice = typeof d.price === "number";
    var head = el("div", { class: "dish__head" }, [
      nameEl,
      hasPrice ? el("data", { class: "dish__price", value: String(d.price), text: formatPrice(d.price) }) : null
    ]);
    var body = el("div", { class: "dish__body" }, [
      // Tra i piatti più graditi: etichetta sopra il nome
      d.favorite ? el("p", { class: "dish__badge", text: t("favorite") }) : null,
      head
    ]);
    var desc = tr(d, "description");
    if (desc) body.appendChild(el("p", { class: "dish__desc", text: desc }));
    var allergenLine = renderDishAllergens(d);
    if (allergenLine) body.appendChild(allergenLine);

    var article = el("article", { class: figure ? "dish" : "dish dish--no-media" }, [figure, body]);
    article.style.setProperty("--i", String(Math.min(i, 12)));
    return article;
  }

  function priceCell(label, value) {
    // L'etichetta (.wine__label) è sempre nel DOM: visibile su mobile, solo screen reader su desktop
    var missing = value === null || value === undefined;
    return el("div", { class: "wine__price" }, [
      el("span", { class: "wine__label", text: label }),
      missing ? el("span", { text: "—" }) : el("data", { value: String(value), text: formatPrice(value) })
    ]);
  }

  /**
   * Riga a due prezzi (vini, caffetteria). Le classi wine__* sono generiche: valgono per ogni sezione "list2".
   * `columns` = section.priceColumns ([{ key, label }, { key, label }]).
   */
  function renderPriceRow(w, columns) {
    // Collegamento interno opzionale (w.link): porta a una categoria di un'altra sezione
    var linkEl = null;
    var linkAsName = false;
    if (w.link && findSection(w.link.section)) {
      var link = w.link;
      linkAsName = w.linkAsName === true;
      linkEl = el("a", { class: "row-link", href: "#" + link.section + (link.category ? "/" + link.category : ""), text: t(link.label) });
      linkEl.addEventListener("click", function (e) {
        e.preventDefault();
        setSection(link.section, { category: link.category });
        // Dopo il re-render il layout può assestarsi (animazione d'ingresso, altezza pagina): riallinea al frame successivo
        window.requestAnimationFrame(function () { scrollToCategory(link.category, true); });
      });
    }

    // linkAsName: il nome resta solo per gli screen reader e il link lo sostituisce nell'intestazione
    var nameLine = [el("h3", { class: linkAsName ? "wine__name visually-hidden" : "wine__name", text: tr(w, "name") })];
    if (linkAsName) nameLine.push(linkEl);
    if (w.organic) nameLine.push(el("span", { class: "badge", text: t("organic") }));
    nameLine.push(el("span", { class: "leader", "aria-hidden": "true" }));

    // Meta: unisce con " · " solo i campi valorizzati
    var abv = typeof w.abv === "number" ? formatAbv(w.abv) : w.abv;
    var meta = [w.winery, tr(w, "detail"), w.vintage, abv].filter(Boolean).join(" · ");

    var li = el("li", { class: "wine" }, [
      el("div", { class: "wine__head" }, nameLine),
      el("div", { class: "wine__prices" }, columns.map(function (col) { return priceCell(t(col.label), w[col.key]); })),
      meta ? el("p", { class: "wine__meta", text: meta }) : null,
      linkAsName ? null : linkEl,
      // Allergeni "ask": stessa resa della nota chef dei piatti
      w.allergens === "ask" ? el("p", { class: "dish__allergens dish__allergens--chef wine__ask", text: t("allergensAsk") }) : null
    ]);
    return li;
  }

  function renderSpirit(s) {
    return el("li", { class: "spirit" }, [
      el("div", { class: "spirit__head" }, [
        el("h3", { class: "spirit__name", text: tr(s, "name") }),
        tr(s, "kind") ? el("span", { class: "spirit__kind", text: tr(s, "kind") }) : null,
        el("span", { class: "leader", "aria-hidden": "true" })
      ]),
      el("data", { class: "spirit__price", value: String(s.price), text: formatPrice(s.price) })
    ]);
  }

  /**
   * Riga di titoli grandi di una sezione a pagine: la categoria aperta è il titolo (h2, a tutta grandezza, al centro),
   * le altre sono link più piccoli e sbiaditi ai lati, nello stesso ordine delle chip: si vedono la precedente e la
   * successiva, tagliate dai bordi. La riga non si trascina: si sposta solo toccando un titolo (alignTitles).
   * Finché questa riga è a schermo le chip della subnav restano nascoste (syncTitles).
   */
  function renderTitles(section, cat, titleId) {
    return el("nav", { class: "titoli", "aria-label": t("categoriesLabel") }, visibleCategories(section).map(function (c) {
      if (c.id === cat.id) {
        return el("h2", { class: "titoli__voce titoli__voce--attiva category__title", id: titleId, "data-cat": c.id, text: tr(c, "label") });
      }
      var link = el("a", { class: "titoli__voce", href: "#" + section.id + "/" + c.id, "data-cat": c.id, text: tr(c, "label") });
      link.addEventListener("click", function (e) {
        e.preventDefault();
        setCategory(section, c.id, { focus: true }); // il link cliccato viene distrutto dal re-render: focus su #menu
      });
      return link;
    }));
  }

  /** Posizione di scorrimento della riga dei titoli che mette `node` al centro. */
  function titleCenter(row, node) {
    return node.offsetLeft + node.offsetWidth / 2 - row.clientWidth / 2;
  }

  var titleTween = 0; // contatore: uno scorrimento nuovo ferma quello ancora in corso

  /**
   * Centra `active` nella riga di titoli `row`. Con `from` (il titolo che era attivo) la riga parte centrata su quello
   * e scorre fino al nuovo, mentre i due si scambiano grandezza e colore (classi --entra / --esce), come un carosello.
   * Senza `from`, o con il movimento ridotto, si centra e basta.
   * `start` (facoltativo): posizione da cui far partire lo scorrimento al posto del centro di `from`; serve quando la
   * riga è stata trascinata con il dito e va riportata al centro da dove è stata lasciata (anche senza cambio di titolo).
   */
  function slideTitles(row, active, from, start) {
    var token = ++titleTween;
    Array.prototype.forEach.call(row.children, function (n) { n.classList.remove("titoli__voce--entra", "titoli__voce--esce"); });
    var to = titleCenter(row, active);
    var swap = !!from && from !== active;
    if ((!swap && start === undefined) || reducedMotion.matches) {
      row.scrollLeft = to;
      return;
    }
    if (start === undefined) start = titleCenter(row, from);
    row.scrollLeft = start;
    void row.offsetWidth; // riavvia le animazioni se le classi c'erano già
    if (swap) {
      active.classList.add("titoli__voce--entra");
      from.classList.add("titoli__voce--esce");
    }
    var t0 = null;
    function step(ts) {
      if (token !== titleTween || !document.contains(row)) return; // superato da un altro scorrimento o riga ridisegnata
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / 380);
      row.scrollLeft = start + (to - start) * (1 - Math.pow(1 - p, 3)); // ease-out
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
    // Rete di sicurezza: se i frame non arrivano (scheda in secondo piano), la riga finisce comunque centrata
    window.setTimeout(function () {
      if (token === titleTween && document.contains(row)) row.scrollLeft = to;
    }, 450);
  }

  /**
   * Centra il titolo attivo nella riga dei titoli presente: quella dentro la pagina (sezioni a pagine) o quella
   * agganciata nella nav (sezioni a scorrimento). `fromCatId`: categoria da cui si arriva in una sezione a pagine,
   * per animare lo scorrimento; senza, si centra e basta (primo disegno, resize, font caricati).
   */
  function alignTitles(fromCatId) {
    [mainEl.querySelector(".titoli"), navTitlesEl].forEach(function (row) {
      var active = row && row.querySelector(".titoli__voce--attiva");
      if (!active) return;
      slideTitles(row, active, fromCatId && row !== navTitlesEl ? row.querySelector('[data-cat="' + fromCatId + '"]') : null);
    });
  }

  /**
   * Sezioni a scorrimento: porta al centro della riga agganciata nella nav il titolo della categoria `catId`
   * (chiamata dallo scrollspy mentre si scorre, e al clic su un titolo). Non fa nulla se la riga è vuota.
   */
  function markTitle(catId) {
    if (!navTitlesEl || !navTitlesEl.firstChild) return;
    var old = navTitlesEl.querySelector(".titoli__voce--attiva");
    var next = navTitlesEl.querySelector('[data-cat="' + catId + '"]');
    if (!next || next === old) return;
    if (old) {
      old.classList.remove("titoli__voce--attiva");
      old.removeAttribute("aria-current");
    }
    next.classList.add("titoli__voce--attiva");
    next.setAttribute("aria-current", "true");
    slideTitles(navTitlesEl, next, old);
  }

  // Sezioni a scorrimento (classe `titoli--trascina` messa da renderSubnav): la riga dei titoli nella nav si
  // trascina in orizzontale con il dito o con il mouse. Al rilascio il titolo più vicino al centro diventa quello
  // attivo e la pagina va a quella categoria. Lo scorrimento verticale resta al browser (CSS: touch-action: pan-y).
  var titleDrag = null; // { id, x, scroll, dx, moved } del trascinamento in corso
  var titleDragClick = false; // il clic che segue un trascinamento non deve aprire il titolo sotto il dito

  /** Titolo della riga più vicino al centro, nella posizione in cui la riga si trova adesso. */
  function nearestTitle(row) {
    var mid = row.scrollLeft + row.clientWidth / 2, best = null, gap = Infinity;
    Array.prototype.forEach.call(row.children, function (n) {
      var d = Math.abs(n.offsetLeft + n.offsetWidth / 2 - mid);
      if (d < gap) { gap = d; best = n; }
    });
    return best;
  }

  /** Fine del trascinamento: `pick` = sceglie il titolo più vicino al centro; altrimenti la riga torna su quello attivo. */
  function dropTitles(pick) {
    var drag = titleDrag;
    titleDrag = null;
    navTitlesEl.classList.remove("is-trascinata");
    if (!drag || !drag.moved) return;
    var old = navTitlesEl.querySelector(".titoli__voce--attiva");
    var next = pick ? nearestTitle(navTitlesEl) : old;
    if (pick && old && next === old && Math.abs(drag.dx) > 40) {
      // Gesto breve ma deciso: il titolo attivo è largo e resterebbe il più vicino, si passa comunque a quello accanto
      next = (drag.dx < 0 ? old.nextElementSibling : old.previousElementSibling) || old;
    }
    if (!next) return;
    // Il titolo scelto resta dov'è sotto il dito anche se cambiando grandezza la riga si ridispone, poi scorre al centro
    var offset = navTitlesEl.scrollLeft - titleCenter(navTitlesEl, next);
    if (old && old !== next) {
      old.classList.remove("titoli__voce--attiva");
      old.removeAttribute("aria-current");
      next.classList.add("titoli__voce--attiva");
      next.setAttribute("aria-current", "true");
    }
    slideTitles(navTitlesEl, next, old, titleCenter(navTitlesEl, next) + offset);
    if (next !== old) scrollChip(next.getAttribute("data-cat"));
  }

  if (navTitlesEl && "PointerEvent" in window) {
    navTitlesEl.addEventListener("pointerdown", function (e) {
      titleDragClick = false;
      if (!navTitlesEl.classList.contains("titoli--trascina")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      titleDrag = { id: e.pointerId, x: e.clientX, scroll: navTitlesEl.scrollLeft, dx: 0, moved: false };
    });
    navTitlesEl.addEventListener("pointermove", function (e) {
      if (!titleDrag || e.pointerId !== titleDrag.id) return;
      titleDrag.dx = e.clientX - titleDrag.x;
      if (!titleDrag.moved) {
        if (Math.abs(titleDrag.dx) < 6) return; // sotto questa soglia è un tocco, non un trascinamento
        titleDrag.moved = true;
        titleDragClick = true;
        titleTween++; // ferma lo scorrimento automatico ancora in corso
        titleDrag.scroll = navTitlesEl.scrollLeft;
        titleDrag.x = e.clientX;
        titleDrag.dx = 0;
        navTitlesEl.classList.add("is-trascinata");
        try { navTitlesEl.setPointerCapture(e.pointerId); } catch (err) { /* puntatore già rilasciato */ }
      }
      navTitlesEl.scrollLeft = titleDrag.scroll - titleDrag.dx;
    });
    navTitlesEl.addEventListener("pointerup", function (e) {
      if (titleDrag && e.pointerId === titleDrag.id) dropTitles(true);
    });
    // Il browser ha preso il gesto per sé (scorrimento verticale della pagina): la riga torna sul titolo attivo
    navTitlesEl.addEventListener("pointercancel", function (e) {
      if (titleDrag && e.pointerId === titleDrag.id) dropTitles(false);
    });
    navTitlesEl.addEventListener("click", function (e) {
      if (!titleDragClick) return;
      titleDragClick = false;
      e.preventDefault();
      e.stopPropagation();
    }, true);
    // Con il mouse il browser trascinerebbe il link (anteprima fantasma) invece della riga
    navTitlesEl.addEventListener("dragstart", function (e) {
      if (navTitlesEl.classList.contains("titoli--trascina")) e.preventDefault();
    });
  }

  /** Sezioni a scorrimento: porta la pagina alla categoria `catId` scelta dalla riga dei titoli (clic o trascinamento). */
  function scrollChip(catId) {
    // Il titolo scelto resta evidenziato finché l'utente non scorre di nuovo: una categoria corta in fondo
    // alla pagina non può arrivare in cima, e lo scrollspy da solo evidenzierebbe quella prima
    spyLock = catId;
    spyMarked = catId;
    markChip(catId);
    scrollToCategory(catId);
    updateHash(activeSectionId + "/" + catId);
  }

  /**
   * Sezioni a pagine: le chip della subnav stanno sovrapposte sotto le tab (classe menu-nav--titoli) e compaiono
   * (is-visibile) solo quando la riga dei titoli grandi è uscita sotto la nav; così le due navigazioni non si
   * vedono mai insieme. Nelle altre sezioni la subnav resta com'è.
   */
  function syncTitles() {
    if (!navEl || !subnavEl) return;
    var show = false;
    if (navEl.classList.contains("menu-nav--titoli")) {
      var row = mainEl.querySelector(".titoli");
      show = !row || row.getBoundingClientRect().bottom < navHeight() + 4;
    }
    subnavEl.classList.toggle("is-visibile", show);
  }

  /** Renderizza una categoria; restituisce null se non contiene voci. */
  function renderCategory(section, cat, index) {
    var items = categoryItems(section, cat);
    if (!items.length) return null;

    var titleId = "title-" + cat.id;
    var subtitle = tr(cat, "subtitle") ? el("p", { class: "category__subtitle", text: tr(cat, "subtitle") }) : null;
    var heading = isPaged(section)
      // Sezione a pagine: il titolo è la riga di titoli grandi, che fa anche da navigazione tra le categorie
      ? el("div", { class: "category__heading category__heading--titoli" }, [renderTitles(section, cat, titleId), subtitle])
      // Sezioni a scorrimento: il nome grande è nella riga agganciata in alto, qui resta un'intestazione piccola che
      // separa le categorie; quella della prima categoria ripeterebbe il titolo subito sopra (classe --prima)
      : el("div", { class: "category__heading" + (section.paged === true ? "" : " category__heading--piccola" + (index === 0 ? " category__heading--prima" : "") + (subtitle ? "" : " category__heading--sola")) },
          [el("h2", { class: "category__title", id: titleId, text: tr(cat, "label") }), subtitle]);
    var wrapper = el("section", { class: "category category--" + section.type, id: "cat-" + cat.id, "aria-labelledby": titleId, "data-nav-label": tr(cat, "label") }, [heading]);
    wrapper.style.setProperty("--i", String(Math.min(index, 12)));

    if (section.type === "food") {
      wrapper.appendChild(el("div", { class: "dish-grid" }, items.map(renderDish)));
    } else if (section.type === "list2") {
      // Intestazione colonne (solo desktop, decorativa: le etichette sono ripetute per lo screen reader)
      var columns = section.priceColumns;
      wrapper.appendChild(el("div", { class: "wine-cols", "aria-hidden": "true" }, columns.map(function (col) {
        return el("span", { text: t(col.label) });
      })));
      wrapper.appendChild(el("ul", { class: "wine-list" }, items.map(function (item) { return renderPriceRow(item, columns); })));
    } else {
      wrapper.appendChild(el("ul", { class: "spirit-list" }, items.map(renderSpirit)));
    }
    return wrapper;
  }

  /** Pager di una sezione a pagine: categoria precedente a sinistra, successiva a destra (senza ciclo); null se non c'è né la precedente né la successiva. */
  function renderPager(section) {
    var cats = visibleCategories(section);
    var current = currentCategory(section);
    var idx = -1;
    for (var i = 0; i < cats.length; i++) {
      if (current && cats[i].id === current.id) idx = i;
    }
    var prev = idx > 0 ? cats[idx - 1] : null;
    var next = idx !== -1 && idx < cats.length - 1 ? cats[idx + 1] : null;
    if (!prev && !next) return null;

    function button(cat, dir) {
      var btn = el("button", { type: "button", class: "pager__btn pager__btn--" + dir }, [
        el("span", { class: "pager__name", text: tr(cat, "label") })
      ]);
      btn.addEventListener("click", function () { setCategory(section, cat.id, { focus: true }); });
      return btn;
    }
    return el("nav", { class: "pager", "aria-label": t("pagerLabel") }, [
      prev ? button(prev, "prev") : null,
      next ? button(next, "next") : null
    ]);
  }

  /**
   * Aggiorna lo stato del pager agganciato al fondo dello schermo.
   * - is-fluttuante: il posto naturale del pager (sotto il contenuto) è oltre il punto di aggancio (fondo della finestra
   *   meno il `bottom` del CSS), quindi i pulsanti galleggiano lì; quando il posto naturale entra nella finestra
   *   (fine lista, pagine corte) tornano lì.
   * - is-nascosta: fluttuante e pagina ferma in cima (scrollY < 24): compare solo appena si scorre.
   * Il posto naturale si calcola dall'elemento che precede il pager + margine + padding + altezza dei pulsanti, senza
   * leggere la posizione del pager stesso (che da agganciato è quella dello schermo).
   */
  function syncPager(immediato) {
    var pager = mainEl.querySelector(".pager");
    if (!pager) return;
    // Pager appena creato (immediato): lo stato va applicato senza transizione, altrimenti i pulsanti
    // nascono visibili e si vedono per un attimo mentre sfumano
    if (immediato) pager.style.transition = "none";
    var prev = pager.previousElementSibling;
    var btn = pager.firstElementChild;
    var fluttuante = false;
    if (prev && btn) {
      var stile = window.getComputedStyle(pager);
      var spazio = (parseFloat(stile.marginTop) || 0) + 2 * (parseFloat(stile.paddingTop) || 0);
      var fondoNaturale = prev.getBoundingClientRect().bottom + spazio + btn.offsetHeight;
      fluttuante = fondoNaturale > window.innerHeight - (parseFloat(stile.bottom) || 0);
    }
    pager.classList.toggle("is-fluttuante", fluttuante);
    pager.classList.toggle("is-nascosta", fluttuante && window.scrollY < 24);
    if (immediato) {
      void pager.offsetWidth; // applica lo stato prima di riattivare la transizione
      pager.style.transition = "";
    }
  }

  function renderSection(section) {
    var frag = document.createDocumentFragment();
    // Nota di sezione (riquadro sobrio prima della prima categoria)
    var note = tr(section, "note");
    if (note) frag.appendChild(el("p", { class: "section-note" }, [buildInfoIcon(14), el("span", { text: note })]));
    if (isPaged(section)) {
      // Sezione a pagine: una sola categoria, poi il pager
      var current = currentCategory(section);
      var page = current ? renderCategory(section, current, 0) : null;
      if (page) frag.appendChild(page);
      // Note della Cucina: subito dopo la categoria, prima del pager
      if (section.type === "food") frag.appendChild(renderMenuNotes());
      var pager = renderPager(section);
      if (pager) frag.appendChild(pager);
    } else {
      orderedCategories(section).forEach(function (cat, index) {
        var node = renderCategory(section, cat, index);
        if (node) frag.appendChild(node);
      });
      if (section.type === "food") frag.appendChild(renderMenuNotes());
    }
    // Cucina: legenda allergeni completa, visibile solo in stampa
    if (section.type === "food") {
      var legend = renderAllergenLegend();
      if (legend) frag.appendChild(legend);
    }
    return frag;
  }

  // ---------------------------------------------------------------- Tab
  function renderTabs() {
    tabsEl.textContent = "";
    MENU.sections.forEach(function (section) {
      var selected = section.id === activeSectionId;
      var btn = el("button", {
        class: "tab", type: "button", role: "tab", id: "tab-" + section.id,
        "aria-selected": selected ? "true" : "false", "aria-controls": "menu",
        tabindex: selected ? "0" : "-1", "data-section": section.id
      }, [el("span", { class: "tab__fondo", "aria-hidden": "true" }), tr(section, "label")]);
      btn.addEventListener("click", function () { switchSection(section.id, { scroll: true }); });
      tabsEl.appendChild(btn);
    });
  }

  var tabAnims = []; // animazioni in corso del colore delle tab: un nuovo cambio le annulla

  /**
   * Fa scorrere il colore, come un liquido, dalla tab di indice `from` a quella di indice `to`: esce dalla tab lasciata
   * nel verso dello spostamento, attraversa quelle in mezzo ed entra in quella scelta. Il fondo (.tab__fondo) è una
   * goccia con le estremità tonde: qui la si sposta (translateX) e la si inclina (skewX) nel verso del movimento.
   *
   * Il liquido è uno solo: tutte le tab seguono la stessa linea del tempo (stessa durata, stessa curva) e ognuna ne
   * occupa un tratto. Così quello che esce da una tab è, istante per istante, quello che entra nella successiva, e la
   * tab scelta finisce di riempirsi solo quando la precedente si è svuotata. La curva parte piano, corre al centro
   * (le tab di mezzo passano veloci) e rallenta all'arrivo.
   *
   * Va chiamata dopo syncTabs: a riposo vale il CSS (fondo pieno solo sulla tab attiva). Senza Web Animations o con il
   * movimento ridotto non fa nulla e il cambio è immediato.
   */
  function flowTabs(from, to) {
    tabAnims.forEach(function (anim) { anim.cancel(); });
    tabAnims = [];
    var tabs = tabsEl.children;
    if (from === to || !tabs[from] || !tabs[to] || reducedMotion.matches || typeof tabs[to].animate !== "function") return;
    var sgn = to > from ? 1 : -1;
    var n = Math.abs(to - from);
    var opts = { duration: 320 + 70 * n, easing: "cubic-bezier(.5, 0, .3, 1)" }; // 390 ms tra due tab vicine, 530 da un capo all'altro
    var TILT = 16; // inclinazione del fronte, in gradi

    /** Posizione della goccia: x in percentuale della sua larghezza (0 = tab piena, ±100 = fuori), inclinazione in gradi. */
    function at(x, tilt) {
      return "translateX(" + (x * sgn) + "%) skewX(" + (-tilt * sgn) + "deg)";
    }
    function run(node, frames) {
      if (node) tabAnims.push(node.animate(frames, opts));
    }
    for (var k = 0; k <= n; k++) {
      var tab = tabs[from + sgn * k];
      var fondo = tab.querySelector(".tab__fondo");
      var enter = (k - 1) / n; // tratto della linea del tempo in cui il liquido entra in questa tab...
      var leave = (k + 1) / n; // ...e quello in cui ne è uscito del tutto
      if (k === 0) {
        // Tab lasciata: il liquido si inclina e scivola fuori
        run(fondo, [{ transform: at(0, 0), offset: 0 }, { transform: at(100, TILT), offset: leave }, { transform: at(100, TILT), offset: 1 }]);
      } else if (k < n) {
        // Tab di mezzo: la goccia la attraversa da parte a parte, inclinata, senza fermarsi
        run(fondo, [{ transform: at(-100, TILT), offset: 0 }, { transform: at(-100, TILT), offset: enter }, { transform: at(100, TILT), offset: leave }, { transform: at(100, TILT), offset: 1 }]);
      } else {
        // Tab scelta: il fronte entra e si raddrizza mentre la riempie
        run(fondo, [{ transform: at(-100, TILT), offset: 0 }, { transform: at(-100, TILT), offset: enter }, { transform: at(0, 0), offset: 1 }]);
        // Il testo diventa chiaro quando il colore gli arriva sopra, non prima (a riposo lo sarebbe subito, dal CSS)
        var style = window.getComputedStyle(document.documentElement);
        var ink = style.getPropertyValue("--ink"), light = style.getPropertyValue("--btn-ink");
        run(tab, [{ color: ink, offset: 0 }, { color: ink, offset: enter + 0.35 / n }, { color: light, offset: enter + 0.8 / n }, { color: light, offset: 1 }]);
      }
    }
  }

  /** Allinea le tab alla sezione `id` (senza argomento: quella attiva): aria-selected, tabindex, tab in vista. */
  function syncTabs(id) {
    id = id || activeSectionId;
    Array.prototype.forEach.call(tabsEl.children, function (btn) {
      var on = btn.getAttribute("data-section") === id;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      btn.setAttribute("tabindex", on ? "0" : "-1");
      // Riga tab scorrevole (schermi stretti): porta la tab attiva in vista senza scrollare la pagina
      if (on && tabsEl.scrollWidth > tabsEl.clientWidth) {
        tabsEl.scrollTo({ left: Math.max(0, btn.offsetLeft - (tabsEl.clientWidth - btn.offsetWidth) / 2), behavior: "auto" });
      }
    });
    mainEl.setAttribute("role", "tabpanel");
    mainEl.setAttribute("aria-labelledby", "tab-" + id);
  }

  /** Tastiera: frecce, Home, End spostano focus e attivano la tab. */
  tabsEl.addEventListener("keydown", function (e) {
    var ids = MENU.sections.map(function (s) { return s.id; });
    var idx = ids.indexOf(pendingSectionId || activeSectionId); // la tab già evidenziata, anche se il contenuto sta ancora cambiando
    var next;
    if (e.key === "ArrowRight") next = (idx + 1) % ids.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + ids.length) % ids.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = ids.length - 1;
    else return;
    e.preventDefault();
    switchSection(ids[next], { scroll: false });
    var btn = document.getElementById("tab-" + ids[next]);
    if (btn) btn.focus();
  });

  // ---------------------------------------------------------------- Subnav + scrollspy
  function renderSubnav(section) {
    subnavEl.textContent = "";
    navTitlesEl.textContent = "";
    navEl.classList.toggle("menu-nav--titoli", isPaged(section)); // sezioni a pagine: chip sovrapposte, vedi syncTitles
    navTitlesEl.setAttribute("aria-label", t("categoriesLabel"));
    navTitlesEl.setAttribute("role", "navigation");
    navTitlesEl.classList.toggle("titoli--trascina", !isPaged(section)); // sezioni a scorrimento: riga trascinabile

    /** Titolo di una categoria nella riga agganciata (sezioni a scorrimento): al clic la pagina va a quella categoria. */
    function addTitle(catId, label, href) {
      var link = el("a", { class: "titoli__voce", href: href, "data-cat": catId, text: label });
      link.addEventListener("click", function (e) {
        e.preventDefault();
        scrollChip(catId);
      });
      navTitlesEl.appendChild(link);
    }

    /** Chip di una categoria: link all'ancora; `onClick` gestisce il clic (preventDefault già fatto). */
    function addChip(catId, label, href, onClick) {
      var chip = el("a", { class: "chip", href: href, "data-cat": catId }, [label]);
      chip.addEventListener("click", function (e) {
        e.preventDefault();
        onClick();
      });
      subnavEl.appendChild(chip);
    }

    if (isPaged(section)) {
      // Sezione a pagine: nel DOM c'è una sola categoria, quindi le chip si costruiscono dai dati
      visibleCategories(section).forEach(function (cat) {
        addChip(cat.id, tr(cat, "label"), "#" + section.id + "/" + cat.id, function () { setCategory(section, cat.id); });
      });
    } else {
      // Sezione a scorrimento: niente chip, un titolo per ogni categoria effettivamente renderizzata
      Array.prototype.forEach.call(mainEl.querySelectorAll(NAV_TARGETS), function (node) {
        var catId = node.id.replace(/^cat-/, "");
        addTitle(catId, node.getAttribute("data-nav-label") || catId, "#" + node.id);
      });
    }
  }

  /** Verso del cambio pagina: 1 = avanti, -1 = indietro, 0 = nessuno (stessa categoria o provenienza sconosciuta). */
  function pageDirection(section, fromCatId) {
    var ids = visibleCategories(section).map(function (cat) { return cat.id; });
    var current = currentCategory(section);
    var a = ids.indexOf(fromCatId), b = current ? ids.indexOf(current.id) : -1;
    if (a === -1 || b === -1 || a === b) return 0;
    return b > a ? 1 : -1;
  }

  /** Porta la pagina all'inizio del menu; senza `always` non scende mai (se l'utente è ancora sull'header resta dov'è). */
  function scrollToMenuTop(always) {
    var y = mainEl.getBoundingClientRect().top + window.scrollY - navHeight();
    if (always || window.scrollY > y) window.scrollTo({ top: Math.max(0, y), behavior: "auto" });
  }

  /**
   * Apre una categoria di una sezione a pagine: ridisegna il contenuto, aggiorna l'hash e riporta in cima al menu.
   * Le chip restano le stesse (non vengono ricreate): così il trattino della chip attiva si anima e il focus resta dov'è.
   * opts.focus: focus su #menu (il pulsante del pager cliccato viene distrutto dal re-render).
   */
  function setCategory(section, catId, opts) {
    opts = opts || {};
    var from = currentCategory(section);
    activeCategory[section.id] = catId;
    renderActive(true, true, from ? from.id : null);
    updateHash(section.id + "/" + catId);
    scrollToMenuTop();
    if (opts.focus) mainEl.focus({ preventScroll: true });
  }

  function scrollToCategory(catId, instant) {
    var target = document.getElementById("cat-" + catId);
    if (target) target.scrollIntoView({ behavior: instant ? "auto" : scrollBehavior(), block: "start" });
  }

  /** Evidenzia la chip attiva e la centra nella subnav senza scrollare la pagina. */
  function markChip(catId) {
    markTitle(catId); // sezioni a scorrimento: la riga dei titoli nella nav segue la categoria
    Array.prototype.forEach.call(subnavEl.children, function (chip) {
      var on = chip.getAttribute("data-cat") === catId;
      if (on) chip.setAttribute("aria-current", "true");
      else chip.removeAttribute("aria-current");
      if (on && subnavEl.scrollWidth > subnavEl.clientWidth) {
        var left = chip.offsetLeft - (subnavEl.clientWidth - chip.offsetWidth) / 2;
        subnavEl.scrollTo({ left: Math.max(0, left), behavior: scrollBehavior() });
      }
    });
  }

  function setupScrollSpy() {
    if (spyObserver) spyObserver.disconnect();
    spyOrder = [];
    spyLock = null;
    spyMarked = null;
    var activeSection = findSection(activeSectionId);
    if (activeSection && isPaged(activeSection)) {
      // Sezione a pagine: la chip attiva è la categoria aperta, niente scrollspy
      var open = currentCategory(activeSection);
      if (open) markChip(open.id);
      return;
    }
    if (!("IntersectionObserver" in window)) return;

    var cats = mainEl.querySelectorAll(NAV_TARGETS);
    spyVisible = {};
    spyOrder = Array.prototype.map.call(cats, function (c) { return c.id; });

    spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { spyVisible[entry.target.id] = entry.isIntersecting; });
      spyUpdate();
    }, { rootMargin: "-" + (navHeight() + 10) + "px 0px -60% 0px" });

    Array.prototype.forEach.call(cats, function (c) { spyObserver.observe(c); });
    if (spyOrder.length) {
      spyMarked = spyOrder[0].replace(/^cat-/, "");
      markChip(spyMarked);
    }
  }

  /**
   * Sceglie la chip da evidenziare nelle sezioni a scorrimento: in fondo alla pagina l'ultima categoria
   * (se è corta non arriva mai nella fascia attiva), altrimenti la prima categoria nella fascia attiva.
   * Non fa nulla finché vale la scelta fatta con un clic su una chip (spyLock).
   */
  function spyUpdate() {
    if (spyLock || (titleDrag && titleDrag.moved) || !spyOrder.length) return; // né mentre si trascina la riga dei titoli
    var pick = null;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      pick = spyOrder[spyOrder.length - 1];
    } else {
      for (var i = 0; i < spyOrder.length && !pick; i++) {
        if (spyVisible[spyOrder[i]]) pick = spyOrder[i];
      }
    }
    if (!pick) return;
    pick = pick.replace(/^cat-/, "");
    if (pick !== spyMarked) {
      spyMarked = pick;
      markChip(pick);
    }
  }

  // Uno scorrimento fatto dall'utente (rotella, dito, tastiera, barra di scorrimento) toglie il blocco della chip scelta
  ["wheel", "touchmove", "keydown", "mousedown"].forEach(function (type) {
    window.addEventListener(type, function () { spyLock = null; }, { passive: true });
  });

  // ---------------------------------------------------------------- Cambio sezione
  /**
   * Ridisegna sezione attiva + subnav + scrollspy. animate=false: nessuna animazione d'ingresso. keepSubnav=true: lascia
   * le chip esistenti (cambio categoria in una sezione a pagine). fromCatId: categoria da cui si arriva in una sezione a
   * pagine; i piatti entrano dal lato giusto (classi cambio-avanti / cambio-indietro) e la riga dei titoli scorre.
   */
  function renderActive(animate, keepSubnav, fromCatId) {
    var section = findSection(activeSectionId);
    if (!section) return;
    mainEl.textContent = "";
    mainEl.appendChild(renderSection(section));
    // Riavvia l'animazione di ingresso: rimuove la classe, forza il reflow, la riaggiunge
    mainEl.classList.remove("is-entering", "cambio-avanti", "cambio-indietro");
    mainEl.classList.toggle("no-anim", !animate);
    var dir = animate && isPaged(section) ? pageDirection(section, fromCatId) : 0;
    if (dir) mainEl.classList.add(dir > 0 ? "cambio-avanti" : "cambio-indietro");
    void mainEl.offsetWidth;
    mainEl.classList.add("is-entering");
    if (!keepSubnav) renderSubnav(section);
    setupScrollSpy();
    syncPager(true);
    alignTitles(dir ? fromCatId : null);
    syncTitles();
    syncToTop();
  }

  /**
   * Sbuffo di bollicine nell'onda dell'intestazione, sopra la tab `tab`: una decina di bolle in più che salgono una
   * volta sola e poi vengono tolte dal DOM (quelle fisse dell'HTML continuano per conto loro). Decorativo: niente con
   * il movimento ridotto, e un tetto al numero di bolle se si cambia sezione a raffica.
   */
  function burstBubbles(tab) {
    var onda = document.querySelector(".onda");
    if (!onda || !tab || reducedMotion.matches) return;
    if (onda.querySelectorAll(".onda__bolla--extra").length > 36) return;
    var box = onda.getBoundingClientRect();
    var t = tab.getBoundingClientRect();
    if (!box.width) return;
    var center = t.left + t.width / 2 - box.left;
    var svgEl = onda.querySelector("svg");
    for (var i = 0; i < 10; i++) {
      var b = el("span", { class: "onda__bolla onda__bolla--extra" });
      // Sparse attorno alla tab (poco più larghe di lei), a diverse altezze dentro l'onda
      var x = center + (Math.random() - 0.5) * (t.width + 70);
      b.style.left = Math.max(4, Math.min(box.width - 10, x)) + "px";
      b.style.bottom = (15 + Math.random() * 60) + "%";
      b.style.setProperty("--d", (3 + Math.round(Math.random() * 5)) + "px");
      b.style.setProperty("--t", (1.1 + Math.random() * 1.1).toFixed(2) + "s");
      b.style.setProperty("--r", (Math.random() * 0.35).toFixed(2) + "s");
      b.style.setProperty("--dx", Math.round((Math.random() - 0.5) * 16) + "px");
      b.addEventListener("animationend", function (e) {
        if (e.target.parentNode) e.target.parentNode.removeChild(e.target);
      });
      onda.insertBefore(b, svgEl);
    }
  }

  var pendingSectionId = null;   // sezione scelta con una tab mentre il contenuto vecchio sta ancora uscendo
  var sectionSwitchTimer = null;

  /**
   * Cambio di sezione scelto dall'utente (clic o tastiera sulle tab), con la stessa transizione del cambio lingua:
   * la tab cambia subito (il colore scorre), il contenuto sotto esce in dissolvenza (classe sezione-esce su <html>),
   * viene ridisegnato (setSection) e rientra (sezione-entra). Le tab restano ferme. Con il movimento ridotto, o se la
   * sezione è già quella, si passa direttamente a setSection.
   */
  function switchSection(id, opts) {
    var root = document.documentElement;
    var shown = pendingSectionId || activeSectionId;
    if (!findSection(id) || id === shown || !activeSectionId || reducedMotion.matches) {
      if (id !== shown) setSection(id, opts);
      return;
    }
    var ids = MENU.sections.map(function (sec) { return sec.id; });
    window.clearTimeout(sectionSwitchTimer);
    pendingSectionId = id;
    syncTabs(id);
    flowTabs(ids.indexOf(shown), ids.indexOf(id));
    burstBubbles(document.getElementById("tab-" + id));
    root.classList.remove("sezione-entra");
    root.classList.add("sezione-esce");
    sectionSwitchTimer = window.setTimeout(function () {
      var o = {};
      Object.keys(opts || {}).forEach(function (key) { o[key] = opts[key]; });
      o.noFlow = true; // il colore delle tab sta già scorrendo
      o.noAnim = true; // niente ingresso piatto per piatto: entra tutto insieme
      pendingSectionId = null;
      setSection(id, o);
      root.classList.remove("sezione-esce");
      root.classList.add("sezione-entra");
      sectionSwitchTimer = window.setTimeout(function () { root.classList.remove("sezione-entra"); }, 420);
    }, 170);
  }

  /**
   * @param {string} id  id sezione
   * @param {{scroll?: boolean, category?: string, keepHash?: boolean, noFlow?: boolean, noAnim?: boolean}=} opts
   *   noFlow: non animare il colore delle tab; noAnim: nessuna animazione d'ingresso dei piatti (li usa switchSection)
   */
  function setSection(id, opts) {
    opts = opts || {};
    var section = findSection(id);
    if (!section) return;
    var changed = id !== activeSectionId;
    var previousId = activeSectionId;
    activeSectionId = id;
    syncTabs();
    if (changed && previousId && !opts.noFlow) {
      var ids = MENU.sections.map(function (sec) { return sec.id; });
      flowTabs(ids.indexOf(previousId), ids.indexOf(id));
    }

    // Sezione a pagine con una categoria richiesta: la imposta prima del render
    var pagedCat = null;
    var catChanged = false;
    var fromCat = null;
    if (isPaged(section) && opts.category) {
      visibleCategories(section).forEach(function (cat) {
        if (cat.id === opts.category) pagedCat = cat.id;
      });
      if (pagedCat) {
        fromCat = currentCategory(section).id;
        catChanged = fromCat !== pagedCat;
        activeCategory[id] = pagedCat;
      }
    }

    if (changed || catChanged || !mainEl.firstChild || mainEl.querySelector(".menu__notice")) {
      renderActive(!opts.noAnim, !changed && catChanged && subnavEl.children.length > 0, !changed && catChanged ? fromCat : null);
    }

    if (!opts.keepHash) updateHash(opts.category ? id + "/" + opts.category : id);

    if (opts.category === "allergeni" && section.type === "food" && (MENU.allergens || []).length) {
      // #cucina/allergeni: apre il pop-up con l'elenco completo (opener = link nel footer)
      openAllergens(null, document.querySelector(".site-footer__link"));
    } else if (pagedCat) {
      scrollToMenuTop();
    } else if (opts.category && document.getElementById("cat-" + opts.category)) {
      scrollToCategory(opts.category, true);
    } else if (opts.scroll && window.scrollY > topEl.offsetHeight) {
      // Portati all'inizio del menu, così il cambio tab non lascia a metà pagina
      scrollToMenuTop(true);
    }
  }

  // ---------------------------------------------------------------- Stampa
  // In stampa le sezioni a pagine mostrano tutte le categorie: il foglio non deve contenere una sola pagina del menu
  function setPrintAll(on) {
    var section = findSection(activeSectionId);
    printAll = on;
    if (section && section.paged === true) renderActive(false);
  }
  window.addEventListener("beforeprint", function () { setPrintAll(true); });
  window.addEventListener("afterprint", function () { setPrintAll(false); });

  // ---------------------------------------------------------------- Altezza nav -> CSS var
  function updateNavHeight() {
    document.documentElement.style.setProperty("--nav-h", navHeight() + "px");
  }
  updateNavHeight();
  if ("ResizeObserver" in window && navEl) new ResizeObserver(updateNavHeight).observe(navEl);
  else window.addEventListener("resize", updateNavHeight);

  // ---------------------------------------------------------------- Back to top
  var toTopVisible = false;
  function setToTop(show) {
    toTopVisible = show;
    toTopEl.classList.toggle("is-visible", show);
    toTopEl.setAttribute("aria-hidden", show ? "false" : "true");
    toTopEl.tabIndex = show ? 0 : -1;
  }
  /** Mostra "torna su" oltre 600px di scroll, ma non nelle sezioni a pagine (stesso angolo del pulsante "avanti"). */
  function syncToTop() {
    if (!toTopEl) return;
    var section = findSection(activeSectionId);
    var show = window.scrollY > 600 && !(section && isPaged(section));
    if (show !== toTopVisible) setToTop(show);
  }
  // Lo scroll scatta al più una volta per frame e le due funzioni fanno poche letture: nessun throttle
  window.addEventListener("scroll", function () {
    syncToTop();
    syncPager();
    syncTitles();
    spyUpdate();
  }, { passive: true });
  window.addEventListener("resize", function () { syncPager(); alignTitles(); syncTitles(); });
  // Il carattere dei titoli arriva dopo il primo disegno e ne cambia la larghezza: la riga va centrata di nuovo
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { alignTitles(); });
  if (toTopEl) {
    toTopEl.hidden = false;
    setToTop(false);
    toTopEl.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: scrollBehavior() });
      if (topEl) topEl.focus({ preventScroll: true });
    });
  }

  // ---------------------------------------------------------------- Hash + avvio
  function syncFromHash(initial) {
    var parsed = parseHash();
    var section = parsed.section || MENU.sections[0];
    if (!section) return;
    setSection(section.id, { category: parsed.category, keepHash: !parsed.section || (initial && !parsed.category) });
  }

  // Ignora hash che non puntano a una sezione (es. ancore interne)
  window.addEventListener("hashchange", function () {
    if (parseHash().section) syncFromHash(false);
    syncPrivacyFromHash();
  });

  // ---------------------------------------------------------------- Testi statici + link
  /** Solo URL https: protegge da javascript: e simili. */
  function safeHttps(url) {
    if (typeof url !== "string" || !url) return "";
    try { return new URL(url).protocol === "https:" ? url : ""; } catch (e) { return ""; }
  }

  function applyLinks() {
    var links = (MENU.meta && MENU.meta.links) || {};
    Array.prototype.forEach.call(document.querySelectorAll("[data-link]"), function (a) {
      var url = safeHttps(links[a.getAttribute("data-link")]);
      if (url) {
        a.setAttribute("href", url);
        a.removeAttribute("aria-disabled");
        a.removeAttribute("title");
      } else {
        a.removeAttribute("href");
        a.setAttribute("aria-disabled", "true");
        a.setAttribute("title", t("comingSoon"));
      }
    });
  }

  // ---------------------------------------------------------------- Orari: rendering (pill header + footer)
  var statusEl = document.querySelector(".status-pill");
  var statusPanelEl = document.querySelector(".status-panel");
  var statusOpenTimer = null;
  var hoursEl = document.querySelector(".hours");

  /** Pill "Aperto · chiude alle 23:00" / "Chiuso · apre alle 07:30"; nascosta se non ci sono orari. */
  function renderStatus() {
    if (!statusEl) return;
    var st = openingStatus();
    statusEl.textContent = "";
    statusEl.hidden = !st;
    if (!st) {
      setStatusPanel(false); // senza orari niente pannello aperto
      return;
    }
    // classList (non className): non deve perdere "is-open" a pannello aperto
    statusEl.classList.toggle("status-pill--open", st.open);
    statusEl.classList.toggle("status-pill--closed", !st.open);
    statusEl.appendChild(el("span", { class: "status-pill__dot", "aria-hidden": "true" }));
    statusEl.appendChild(el("span", { class: "status-pill__text", text: st.text }));
    var chevron = svg("svg", { viewBox: "0 0 24 24", "class": "status-pill__chevron", width: "12", height: "12", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" });
    chevron.appendChild(svg("path", { d: "M6 9l6 6 6-6" }));
    statusEl.appendChild(chevron);
  }

  /** Apre/chiude il pannello degli orari sotto la pill e tiene allineati aria-expanded e classe. */
  function setStatusPanel(open) {
    if (!statusEl || !statusPanelEl) return;
    var opening = open && statusPanelEl.hidden;
    statusEl.setAttribute("aria-expanded", open ? "true" : "false");
    statusEl.classList.toggle("is-open", open);
    statusPanelEl.hidden = !open;
    if (opening) {
      // Le righe entrano una dopo l'altra solo all'apertura: senza la classe non si rianimano al ridisegno di ogni minuto
      statusPanelEl.classList.add("is-aprendo");
      window.clearTimeout(statusOpenTimer);
      statusOpenTimer = window.setTimeout(function () { statusPanelEl.classList.remove("is-aprendo"); }, 800);
    }
  }

  /** Pannello sotto la pill: titolo + elenco orari (stesso elenco del footer). */
  function renderStatusPanel() {
    if (!statusPanelEl) return;
    statusPanelEl.textContent = "";
    var list = buildHoursList();
    if (!list) return;
    statusPanelEl.appendChild(el("p", { class: "status-panel__title", text: t("hoursTitle") }));
    statusPanelEl.appendChild(list);
  }

  /** Testo orario di un giorno: "07:30–24:00" oppure "chiuso". */
  function slotText(slot) {
    return slot ? shownTime(slot.open, false) + "–" + shownTime(slot.close, true) : t("closedDay");
  }

  /** Elenco orari (dl): giorni consecutivi con orari identici raggruppati ("Mar–Mer 07:30–23:00"); null senza orari. */
  function buildHoursList() {
    var groups = COMUNE.hoursGroups(weekHours());
    if (!groups) return null;
    return el("dl", { class: "hours__list" }, groups.map(function (g) {
      var label = g.from === g.to ? dayName(g.from, "short") : dayName(g.from, "short") + "–" + dayName(g.to, "short");
      return el("div", { class: g.today ? "hours__row hours__row--today" : "hours__row", "aria-current": g.today ? "date" : null }, [
        el("dt", { text: label }),
        el("dd", { text: slotText(g.slot) })
      ]);
    }));
  }

  /** Orari nel footer. */
  function renderHours() {
    if (!hoursEl) return;
    var list = buildHoursList();
    hoursEl.textContent = "";
    hoursEl.hidden = !list;
    if (!list) return;
    hoursEl.appendChild(el("h2", { class: "hours__title visually-hidden", text: t("hoursTitle") }));
    hoursEl.appendChild(list);
  }

  // Pill = pulsante: apre/chiude il pannello; si chiude con clic fuori o Esc (listener registrati una volta sola)
  if (statusEl && statusPanelEl) {
    statusEl.addEventListener("click", function () {
      setStatusPanel(statusPanelEl.hidden);
    });
    document.addEventListener("click", function (e) {
      if (statusPanelEl.hidden) return;
      if (statusEl.contains(e.target) || statusPanelEl.contains(e.target)) return;
      setStatusPanel(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || statusPanelEl.hidden) return;
      setStatusPanel(false);
      statusEl.focus();
    });
  }

  /** Contatti nel footer: indirizzo e telefono da `meta` (l'HTML ne contiene una copia statica); il telefono diventa un link tel:. */
  function applyContacts() {
    var meta = MENU.meta || {};
    var addr = document.querySelector("[data-meta='address']");
    if (addr && meta.address) addr.textContent = meta.address;
    var tel = document.querySelector("[data-meta='phone']");
    if (tel && meta.phone) {
      tel.textContent = meta.phone;
      tel.setAttribute("href", "tel:" + meta.phone.replace(/[^\d+]/g, ""));
    }
  }

  function applyStaticText() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (n) {
      n.textContent = t(n.getAttribute("data-i18n"));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-aria]"), function (n) {
      n.setAttribute("aria-label", t(n.getAttribute("data-i18n-aria")));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-content]"), function (n) {
      n.setAttribute("content", t(n.getAttribute("data-i18n-content")));
    });
    document.documentElement.lang = lang;
    document.title = t("pageTitle");
    renderLangPill();
    applyLinks();
    applyContacts();
    renderFooterAllergens();
    renderLegal();
    renderStatus();
    renderStatusPanel();
    renderHours();
  }

  /** Cambia lingua mantenendo sezione attiva e posizione di scroll, senza animazioni. */
  function setLanguage(code, opts) {
    if (!hasLang(code)) return;
    opts = opts || {};
    var changed = code !== lang;
    lang = code;
    if (!opts.initial) {
      try { localStorage.setItem(STORAGE_KEY, code); } catch (e) { /* non critico */ }
      // Rimuove ?lang= dall'URL: altrimenti al ricaricamento vincerebbe sulla scelta appena fatta
      try {
        if (/[?&]lang=/.test(location.search)) {
          var params = new URLSearchParams(location.search);
          params.delete("lang");
          var qs = params.toString();
          history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
        }
      } catch (e) { /* non critico */ }
    }
    applyStaticText();
    if (allergenState.open) renderAllergenModal(allergenState.dish); // cambio lingua con pop-up allergeni aperto
    if (privacyState.open) renderPrivacyModal(); // idem per il pop-up privacy
    if (opts.initial || !changed) return;
    var y = window.scrollY;
    renderTabs();
    renderActive(false);
    window.scrollTo({ top: y, behavior: "instant" }); // "instant": "auto" seguirebbe scroll-behavior: smooth del CSS
  }

  // ---------------------------------------------------------------- Modale scelta lingua (primo accesso)
  var langModalEl = document.querySelector(".lang-modal");
  var langModalReady = false;
  var langModalClosing = false;

  /** true se esiste una scelta esplicita: ?lang= valido oppure valore valido in localStorage. */
  function hasExplicitLanguage() {
    try {
      var q = new URLSearchParams(location.search).get("lang");
      if (q && hasLang(q)) return true;
    } catch (e) { /* URLSearchParams assente */ }
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && hasLang(saved)) return true;
    } catch (e) { return false; } // localStorage bloccato: il modale compare comunque
    return false;
  }

  function langModalSupported() {
    return !!langModalEl && typeof window.HTMLDialogElement !== "undefined" && typeof langModalEl.showModal === "function";
  }

  /** Chiusura con fade-out (classe .is-closing); animationend + timeout di sicurezza. */
  function closeLanguageModal() {
    var dialog = langModalEl;
    if (langModalClosing || !dialog.open) return;
    langModalClosing = true;
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      dialog.removeEventListener("animationend", onEnd);
      dialog.classList.remove("is-closing");
      if (dialog.open) dialog.close();
      document.documentElement.classList.remove("is-modal-open"); // subito, senza attendere l'evento close
    }
    function onEnd(e) { if (e.target === dialog && e.animationName === "lang-modal-out") finish(); }
    dialog.addEventListener("animationend", onEnd);
    dialog.classList.add("is-closing");
    window.setTimeout(finish, 400);
  }

  /** Listener del modale: registrati una sola volta, alla prima apertura. */
  function setupLanguageModal() {
    if (langModalReady) return;
    langModalReady = true;
    var dialog = langModalEl;

    // A qualsiasi chiusura: sblocca lo scroll
    dialog.addEventListener("close", function () {
      document.documentElement.classList.remove("is-modal-open");
      langModalClosing = false;
    });

    /** Esc o click sul backdrop: conferma la lingua corrente (default it) così il modale non ricompare da solo. */
    function dismiss() {
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* non critico */ }
      closeLanguageModal();
    }
    dialog.addEventListener("cancel", function (e) { e.preventDefault(); dismiss(); });
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dismiss(); });

    Array.prototype.forEach.call(dialog.querySelectorAll("[data-lang]"), function (b) {
      b.addEventListener("click", function () {
        setLanguage(b.getAttribute("data-lang")); // salva in localStorage
        closeLanguageModal();
      });
    });
  }

  /** Apre il modale di scelta lingua (solo al primo accesso: poi la lingua si cambia dalla pillola in alto). */
  function openLanguageModal() {
    if (!langModalSupported() || langModalEl.open) return;
    setupLanguageModal();
    document.documentElement.classList.add("is-modal-open");
    try {
      langModalEl.showModal();
    } catch (e) {
      document.documentElement.classList.remove("is-modal-open");
      return;
    }
    // Focus iniziale sul pannello, non su un pulsante: l'anello di focus sembrerebbe una lingua
    // già preselezionata. Con Tab si passa subito a "Italiano" / "English".
    var panel = langModalEl.querySelector(".lang-modal__panel");
    if (panel) panel.focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------- Pillola della lingua + menu a tendina
  var langPillEl = document.querySelector(".lang-pill");
  var langPanelEl = document.querySelector(".lang-panel");

  /** Apre/chiude il menu a tendina delle lingue e tiene allineati aria-expanded e classe. */
  function setLangPanel(open) {
    if (!langPillEl || !langPanelEl) return;
    langPillEl.setAttribute("aria-expanded", open ? "true" : "false");
    langPillEl.classList.toggle("is-open", open);
    langPanelEl.hidden = !open;
  }

  var langSwitchTimer = null;

  /**
   * Cambio lingua scelto dall'utente, con una transizione: i testi escono in dissolvenza (classe lingua-esce su <html>),
   * vengono riscritti (setLanguage) e rientrano (lingua-entra). Con il movimento ridotto, o se la lingua è già quella,
   * si passa direttamente a setLanguage.
   */
  function switchLanguage(code) {
    var root = document.documentElement;
    if (code === lang || !hasLang(code) || reducedMotion.matches) {
      setLanguage(code);
      return;
    }
    window.clearTimeout(langSwitchTimer);
    root.classList.remove("lingua-entra");
    root.classList.add("lingua-esce");
    langSwitchTimer = window.setTimeout(function () {
      setLanguage(code);
      root.classList.remove("lingua-esce");
      root.classList.add("lingua-entra");
      langSwitchTimer = window.setTimeout(function () { root.classList.remove("lingua-entra"); }, 420);
    }, 170);
  }

  /** Sigla e nome accessibile della pillola, voce attiva del menu: nella lingua corrente. */
  function renderLangPill() {
    if (!langPillEl || !langPanelEl) return;
    var code = langPillEl.querySelector(".lang-pill__code");
    if (code) code.textContent = lang.toUpperCase();
    var name = "";
    Array.prototype.forEach.call(langPanelEl.querySelectorAll("[data-lang]"), function (b) {
      var on = b.getAttribute("data-lang") === lang;
      if (on) {
        b.setAttribute("aria-current", "true");
        name = b.textContent;
      } else {
        b.removeAttribute("aria-current");
      }
    });
    langPillEl.setAttribute("aria-label", t("langLabel") + (name ? ": " + name : ""));
  }

  // Easter egg: cinque tocchi rapidi sulla pillola e la sigla fa un brindisi in più lingue, poi torna quella di prima.
  // Cambia solo il testo a schermo: l'aria-label della pillola resta «Lingua: …».
  var BRINDISI = ["Cin cin", "Cheers", "Santé", "Prost"];
  var brindisiTocchi = 0;
  var brindisiUltimo = 0;
  var brindisiTimer = null;

  function brindisi() {
    var code = langPillEl.querySelector(".lang-pill__code");
    if (!code) return;
    var i = 0;
    langPillEl.classList.add("lang-pill--brindisi");
    (function passo() {
      if (i >= BRINDISI.length) {
        brindisiTimer = null;
        langPillEl.classList.remove("lang-pill--brindisi");
        code.classList.remove("lang-pill__code--brindisi");
        renderLangPill();
        return;
      }
      code.textContent = BRINDISI[i++];
      // togliere e rimettere la classe fa ripartire l'animazione a ogni parola
      code.classList.remove("lang-pill__code--brindisi");
      void code.offsetWidth;
      code.classList.add("lang-pill__code--brindisi");
      brindisiTimer = window.setTimeout(passo, 750);
    })();
  }

  // Pillola = pulsante: apre/chiude il menu; si chiude con clic fuori o Esc, e dopo la scelta di una lingua
  if (langPillEl && langPanelEl) {
    langPillEl.addEventListener("click", function () {
      if (brindisiTimer) return;
      var ora = Date.now();
      brindisiTocchi = ora - brindisiUltimo < 450 ? brindisiTocchi + 1 : 1;
      brindisiUltimo = ora;
      if (brindisiTocchi >= 5) {
        brindisiTocchi = 0;
        setLangPanel(false);
        brindisi();
        return;
      }
      setLangPanel(langPanelEl.hidden);
    });
    Array.prototype.forEach.call(langPanelEl.querySelectorAll("[data-lang]"), function (b) {
      b.addEventListener("click", function () {
        switchLanguage(b.getAttribute("data-lang"));
        setLangPanel(false);
        langPillEl.focus({ preventScroll: true });
      });
    });
    document.addEventListener("click", function (e) {
      if (langPanelEl.hidden) return;
      if (langPillEl.contains(e.target) || langPanelEl.contains(e.target)) return;
      setLangPanel(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || langPanelEl.hidden) return;
      setLangPanel(false);
      langPillEl.focus();
    });
  }

  // ---------------------------------------------------------------- Sipario d'apertura
  var siparioEl = document.querySelector(".sipario");

  /**
   * Chiama fn quando il sipario d'apertura ha finito (subito se non c'è o è già passato), lo toglie dal DOM e mette
   * senza-intro su <html>: da lì in poi logo e piatti non hanno più le animazioni e i ritardi dell'apertura.
   * L'animazione è tutta in CSS (style.css): qui si aspetta solo la dissolvenza, con un timer di riserva.
   */
  function dopoSipario(fn) {
    var fatto = false;
    function fine() {
      if (fatto) return;
      fatto = true;
      if (siparioEl && siparioEl.parentNode) siparioEl.parentNode.removeChild(siparioEl);
      document.documentElement.classList.add("senza-intro");
      fn();
    }
    var stile = siparioEl ? window.getComputedStyle(siparioEl) : null;
    if (!stile || stile.display === "none" || stile.visibility === "hidden") {
      fine();
      return;
    }
    siparioEl.addEventListener("animationend", function (e) { if (e.target === siparioEl) fine(); });
    window.setTimeout(fine, 2300 * siparioLento);
  }

  // Solo debug: ?lento=N rallenta di N volte le animazioni già partite (il sipario), timer di riserva compreso
  var siparioLento = 1;
  try { siparioLento = Math.max(1, parseFloat(new URLSearchParams(location.search).get("lento")) || 1); } catch (e) { /* URLSearchParams assente */ }
  if (siparioLento > 1 && document.getAnimations) {
    document.getAnimations().forEach(function (a) { a.playbackRate = 1 / siparioLento; });
  }

  // ---------------------------------------------------------------- Easter egg: il gatto di Roma
  // Ogni tanto (una volta su cinque che il footer entra a schermo, al massimo una volta per visita) un gattino
  // attraversa il footer camminando sulla sua riga in alto. Toccato, si ferma e fa le fusa, poi scappa via.
  // Il mantello è scelto a caso tra quelli di MANTELLI (mai nero: porta sfortuna; a meno che non sia Halloween: allora solo nero).
  // Solo decorativo (aria-hidden); con il movimento ridotto non passa. ?gatto=1 (solo debug) lo fa passare sempre.
  var footerEl = document.querySelector(".site-footer");
  var gattoSempre = false;
  try { gattoSempre = new URLSearchParams(location.search).get("gatto") === "1"; } catch (e) { /* URLSearchParams assente */ }
  var gattoPassato = false;
  var MANTELLI = halloween ? ["nero"] : ["rosso", "bordeaux", "pezzato"]; // classi gatto--<mantello> in style.css
  var gattoProbabilita = halloween ? 0.4 : 0.2; // a Halloween passa più spesso

  /** Il gatto di profilo, rivolto a destra: coda, zampe (due coppie che si alternano), corpo, testa, orecchie, occhio. */
  function disegnaGatto() {
    var corpo = svg("g", { class: "gatto__corpo" });
    corpo.appendChild(svg("path", { class: "gatto__coda", d: "M11 15C5 14 3 8 6 3" }));
    [[12, "b"], [15, "a"], [28, "b"], [31, "a"]].forEach(function (z) {
      corpo.appendChild(svg("line", { class: "gatto__zampa gatto__zampa--" + z[1], x1: z[0], y1: 18, x2: z[0], y2: 28.5 }));
    });
    corpo.appendChild(svg("ellipse", { class: "gatto__pancia", cx: 21, cy: 16, rx: 12, ry: 6 }));
    // Schiena inarcata (solo il gatto nero, quando soffia: gatto--soffia in style.css)
    corpo.appendChild(svg("path", { class: "gatto__gobba", d: "M9 18C9 10 14 3.5 21 3.5C28 3.5 33 10 33 18C27 16 15 16 9 18Z" }));
    corpo.appendChild(svg("circle", { cx: 36, cy: 11, r: 5.5 }));
    corpo.appendChild(svg("polygon", { points: "31.5,8 32.5,2 36,6" }));
    corpo.appendChild(svg("polygon", { points: "36.5,6 40,2 40.8,8.5" }));
    // Macchie (solo il bianco e rosso) e strisce (solo il rosso tigrato): le mostra o nasconde style.css secondo il mantello
    corpo.appendChild(svg("ellipse", { class: "gatto__macchia", cx: 18, cy: 14, rx: 5.5, ry: 3.5 }));
    corpo.appendChild(svg("circle", { class: "gatto__macchia", cx: 35, cy: 9, r: 3 }));
    corpo.appendChild(svg("polygon", { class: "gatto__macchia", points: "36.5,6 40,2 40.8,8.5" }));
    corpo.appendChild(svg("path", { class: "gatto__strisce", d: "M17 10.6q1 2.4 0 4.2M21 10.1q1 2.5 0 4.6M25 10.6q1 2.4 0 4.2M35.4 6.2l.3 2.2" }));
    corpo.appendChild(svg("circle", { class: "gatto__occhio", cx: 38.3, cy: 10, r: 0.9 }));
    var disegno = svg("svg", { viewBox: "0 0 48 30", width: 48, height: 30, focusable: "false" });
    disegno.appendChild(corpo);
    return disegno;
  }

  function passaGatto() {
    if (!footerEl || footerEl.querySelector(".gatto-strada")) return;
    var mantello = MANTELLI[Math.floor(Math.random() * MANTELLI.length)];
    var gatto = el("div", { class: "gatto gatto--" + mantello + (Math.random() < 0.5 ? " gatto--da-destra" : "") }, [disegnaGatto()]);
    var strada = el("div", { class: "gatto-strada", "aria-hidden": "true" }, [gatto]);
    // Passo costante: su uno schermo largo ci mette di più, non corre
    gatto.style.animationDuration = Math.round((footerEl.clientWidth + 120) / 55 * 10) / 10 + "s";
    gatto.addEventListener("animationend", function (e) {
      if (e.animationName === "gatto-cammina" && strada.parentNode) strada.parentNode.removeChild(strada);
    });
    // Toccato: si ferma, vibra e fa «prrr», poi scappa via di corsa dalla parte verso cui guarda. Il gatto nero di
    // Halloween invece inarca la schiena, drizza la coda e soffia («ffff!») prima di scappare
    gatto.addEventListener("click", function () {
      if (gatto.classList.contains("gatto--fusa") || gatto.classList.contains("gatto--scappa")) return;
      var nero = gatto.classList.contains("gatto--nero");
      var fusa = el("span", { class: "gatto__prrr", text: nero ? "ffff!" : "prrr" });
      gatto.appendChild(fusa);
      gatto.classList.add("gatto--fusa");
      if (nero) gatto.classList.add("gatto--soffia");
      window.setTimeout(function () {
        if (fusa.parentNode) fusa.parentNode.removeChild(fusa);
        // Il cammino si ferma dov'è (left fissato a mano) e da lì parte la corsa, una transizione su left
        var x = gatto.offsetLeft;
        var versoSinistra = gatto.classList.contains("gatto--da-destra");
        var distanza = versoSinistra ? x + 60 : strada.clientWidth - x;
        gatto.style.animation = "none";
        gatto.style.left = x + "px";
        gatto.classList.remove("gatto--fusa", "gatto--soffia");
        gatto.classList.add("gatto--scappa");
        gatto.style.transitionDuration = Math.max(0.4, distanza / 700) + "s";
        void gatto.offsetWidth;
        gatto.style.left = versoSinistra ? "-60px" : "100%";
        window.setTimeout(function () {
          if (strada.parentNode) strada.parentNode.removeChild(strada);
        }, Math.max(400, distanza / 0.7) + 100);
      }, 1600);
    });
    footerEl.appendChild(strada);
  }

  function avviaGatto() {
    if (!footerEl || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || reducedMotion.matches) return;
      if (!gattoSempre && (gattoPassato || Math.random() > gattoProbabilita)) return;
      gattoPassato = true;
      window.setTimeout(passaGatto, 500);
    }, { threshold: 0.5 }).observe(footerEl);
  }

  // ---------------------------------------------------------------- Halloween: il ragnetto
  // Solo con il tema Halloween: da ciascuna delle due ragnatele in alto nell'intestazione un ragnetto scende piano su un
  // filo, dondola e risale, poi ricomincia dopo una pausa (il ciclo è in CSS: ragnetto-scende; quello di destra è sfalsato
  // di mezzo giro). Passano dietro le pillole della barra. Toccato, risale di scatto e torna dopo un po'. Solo decorativo
  // (aria-hidden); con il movimento ridotto non ci sono.
  function avviaRagnetti() {
    var header = document.querySelector(".site-header");
    if (!halloween || !header || reducedMotion.matches) return;
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
  // Solo con il tema Halloween: qualche secondo dopo l'apertura, al massimo una volta per sessione (sessionStorage) e solo
  // una volta su RAGNO_PROBABILITA, un ragno grosso attraversa lo schermo da destra a sinistra, all'altezza del centro:
  // entra di corsa, rallenta al centro, riesce di corsa. Finché passa, il menu non scorre (rotella, dita, tasti: bloccaScorrimento).
  // Toccato, viene schiacciato: sparisce appiattendosi e sulla pagina resta per qualche secondo una chiazza verde
  // (disegnaChiazza), che scorre con il menu e poi svanisce. Non passa se c'è un pop-up aperto o la pagina non si vede.
  // Solo decorativo (aria-hidden); con il movimento ridotto non c'è. ?ragno=1 (solo debug) lo fa passare sempre.
  var RAGNO_PROBABILITA = 0.33;
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

  function passaRagno(tentativi) {
    if (document.hidden || document.querySelector("dialog[open]")) {
      if (tentativi > 0) window.setTimeout(function () { passaRagno(tentativi - 1); }, 6000);
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
    if (!halloween || reducedMotion.matches) return;
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
    window.setTimeout(function () { passaRagno(3); }, sempre ? 1500 : 5000 + Math.random() * 10000);
  }

  lang = detectLanguage();
  setLanguage(lang, { initial: true });
  renderTabs();
  syncFromHash(true);
  syncPrivacyFromHash(); // #privacy all'avvio
  // Primo accesso: modale lingua dopo il rendering del menu e dopo il sipario (il <dialog> gli passerebbe sopra)
  dopoSipario(function () {
    if (!hasExplicitLanguage()) openLanguageModal();
    avviaGatto();
    avviaRagnetti();
    avviaRagno();
  });
  // Pill di stato e giorno evidenziato (pannello e footer) si aggiornano ogni minuto (senza ridisegnare il menu)
  window.setInterval(function () { renderStatus(); renderStatusPanel(); renderHours(); }, 60000);
})();
