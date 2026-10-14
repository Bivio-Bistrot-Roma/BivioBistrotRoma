/**
 * Bivio Bistrot — funzioni in comune tra il menu (menu/) e il sito del locale
 * ---------------------------------------------------------------------------
 * Solo calcoli: niente DOM e niente testi, così ogni sito traduce e disegna a modo suo.
 * Script classico (niente moduli: funziona anche da file://): espone window.BIVIO_COMUNE, congelato.
 * Va caricato dopo assets/locale-dati.js e prima dello script del sito.
 *
 * ORARI (dati in BIVIO_LOCALE.meta.hours: 7 voci lun -> dom, null = chiuso, close <= open = chiude dopo mezzanotte)
 *  Ora e giorno sono quelli di Roma. SOLO PER DEBUG: `?ora=HH:MM` e `?giorno=1..7` (1 = lunedì) nell'URL li forzano.
 */
(function () {
  "use strict";

  var DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  /** "HH:MM" -> minuti dalla mezzanotte (NaN se malformato). */
  function minutes(v) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(v));
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : NaN;
  }

  /**
   * true se `now` ("HH:MM") cade nella fascia che parte da `from`.
   * Senza `until`: da `from` fino a mezzanotte. Con `until` > `from`: from <= now < until.
   * Con `until` <= `from` la fascia scavalca la mezzanotte: now >= from || now < until.
   * Valori malformati -> false.
   */
  function inWindow(from, until, now) {
    var a = minutes(from), n = minutes(now);
    if (isNaN(a) || isNaN(n)) return false;
    if (until === undefined || until === null || until === "") return n >= a;
    var u = minutes(until);
    if (isNaN(u)) return false;
    return u > a ? (n >= a && n < u) : (n >= a || n < u);
  }

  /** Ora corrente "HH:MM" a Roma (ripiego: ora locale se timeZone non è supportato). Debug: `?ora=HH:MM`. */
  function currentTime() {
    try {
      var forced = new URLSearchParams(location.search).get("ora");
      if (forced && /^([01]\d|2[0-3]):[0-5]\d$/.test(forced)) return forced;
    } catch (e) { /* URLSearchParams assente */ }
    try {
      var parts = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
      var h = "", m = "";
      parts.forEach(function (p) { if (p.type === "hour") h = p.value; else if (p.type === "minute") m = p.value; });
      if (h && m) return h + ":" + m;
    } catch (e) { /* Intl/timeZone non supportati: ora locale */ }
    var d = new Date();
    return (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
  }

  /** Giorno della settimana a Roma: 0 = lunedì … 6 = domenica (ripiego: giorno locale). Debug: `?giorno=1..7`. */
  function currentDay() {
    try {
      var forced = new URLSearchParams(location.search).get("giorno");
      if (forced && /^[1-7]$/.test(forced)) return parseInt(forced, 10) - 1;
    } catch (e) { /* URLSearchParams assente */ }
    try {
      var name = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Rome", weekday: "short" }).format(new Date());
      var idx = DAY_KEYS.indexOf(name);
      if (idx !== -1) return idx;
    } catch (e) { /* Intl/timeZone non supportati: giorno locale */ }
    return (new Date().getDay() + 6) % 7;
  }

  /** Orari validi (array di 7) o null. */
  function validHours(h) {
    return Array.isArray(h) && h.length === 7 ? h : null;
  }

  /** true se la chiusura cade dopo mezzanotte (close <= open). */
  function pastMidnight(slot) {
    return minutes(slot.close) <= minutes(slot.open);
  }

  /** Orario da mostrare: la chiusura "00:00" diventa "24:00", il resto invariato. */
  function shownTime(hhmm, isClose) {
    return isClose && hhmm === "00:00" ? "24:00" : hhmm;
  }

  /**
   * Stato in questo momento, senza testi. null se non ci sono orari (o se è chiuso tutti i giorni), altrimenti:
   *   { open: true, closes: "HH:MM" }                        aperto (anche nella coda di ieri, se ieri chiudeva dopo mezzanotte)
   *   { open: false, opens: "HH:MM", inDays: n, day: i }    chiuso: riapre tra n giorni (0 = oggi, 1 = domani…),
   *                                                          il giorno i (0 = lunedì)
   * Gli orari sono quelli dei dati: per mostrarli passa da shownTime().
   */
  function openingStatus(hours) {
    hours = validHours(hours);
    if (!hours) return null;
    var now = minutes(currentTime());
    var d = currentDay();
    var today = hours[d];
    var yesterday = hours[(d + 6) % 7];

    if (today && now >= minutes(today.open) && (pastMidnight(today) || now < minutes(today.close))) {
      return { open: true, closes: today.close };
    }
    if (yesterday && pastMidnight(yesterday) && now < minutes(yesterday.close)) {
      return { open: true, closes: yesterday.close };
    }
    if (today && now < minutes(today.open)) {
      return { open: false, opens: today.open, inDays: 0, day: d };
    }
    for (var n = 1; n <= 7; n++) {
      var slot = hours[(d + n) % 7];
      if (slot) return { open: false, opens: slot.open, inDays: n, day: (d + n) % 7 };
    }
    return null;
  }

  /**
   * Settimana a gruppi: giorni consecutivi con gli stessi orari stanno insieme. null se non ci sono orari.
   * [{ from: 0, to: 0, slot: { open, close } | null, today: bool }, …]  (from/to: 0 = lunedì)
   */
  function hoursGroups(hours) {
    hours = validHours(hours);
    if (!hours) return null;
    function same(a, b) { return a === b || (!!a && !!b && a.open === b.open && a.close === b.close); }
    var today = currentDay();
    var groups = [];
    var start = 0;
    while (start < 7) {
      var end = start;
      while (end + 1 < 7 && same(hours[end + 1], hours[start])) end++;
      groups.push({ from: start, to: end, slot: hours[start], today: today >= start && today <= end });
      start = end + 1;
    }
    return groups;
  }

  window.BIVIO_COMUNE = Object.freeze({
    minutes: minutes,
    inWindow: inWindow,
    currentTime: currentTime,
    currentDay: currentDay,
    validHours: validHours,
    shownTime: shownTime,
    openingStatus: openingStatus,
    hoursGroups: hoursGroups
  });
})();
