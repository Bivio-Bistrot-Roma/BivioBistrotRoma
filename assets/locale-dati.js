/**
 * Bivio Bistrot — dati del locale, in comune tra il menu (menu/) e il sito del locale
 * ---------------------------------------------------------------------------
 * Unico oggetto globale congelato: window.BIVIO_LOCALE (script classico, niente moduli né fetch:
 * tutto funziona anche aprendo le pagine da file://). Va caricato PRIMA di menu/menu-data.js,
 * che ne riprende `meta` e `privacy` (BIVIO_MENU.meta / BIVIO_MENU.privacy).
 * Qui stanno i dati scritti una volta sola e letti da tutti e due i siti: orari, indirizzo,
 * telefono, link, dati legali, informativa privacy. Cambiando un orario qui, cambia ovunque.
 *
 * STRUTTURA
 *  - meta    : dati generali (nome, città, valuta, lingue, orari `hours`, indirizzo, telefono, `legal`, `links`).
 *  - privacy : testo dell'informativa per lingua.
 *  - gallery : foto del locale per la galleria del sito del locale (istruzioni sopra l'elenco).
 *
 * ORARI
 *  meta.hours: 7 elementi, da lunedì (indice 0) a domenica (indice 6). Ogni elemento è
 *  { open: "HH:MM", close: "HH:MM" } oppure null = chiuso tutto il giorno.
 *  Se close <= open la chiusura è dopo mezzanotte (giorno successivo): es. 11:30-02:00.
 *  Alimenta la pill di stato nell'header e l'elenco orari nel footer (orari di Roma).
 *  Solo per debug: `?ora=HH:MM` e `?giorno=1..7` (1 = lunedì) nell'URL forzano ora e giorno.
 *
 * LINK DI CONTATTO
 *  meta.links.maps / meta.links.whatsapp: URL https definitivi. Stringa vuota = pulsante "in arrivo".
 *  meta.address / meta.phone: indirizzo e telefono mostrati nel footer (l'indirizzo apre meta.links.maps,
 *  il telefono diventa un link tel:). In menu/index.html c'è una copia statica: se li cambi, allinea anche l'HTML.
 *  meta.legal: { company, vat, seat, rea, capital, email, host, updated }. Ragione sociale e partita IVA compaiono nel footer e
 *  alimentano l'informativa privacy (pop-up aperto dal link "Privacy" nel footer o da #privacy). `rea` (testo) e
 *  `capital` (numero, euro interamente versati) sono facoltativi e compaiono solo nell'informativa. Regola "in attesa":
 *  finché company, vat ed email non sono TUTTI compilati, la riga legale e il link Privacy non compaiono e #privacy
 *  non apre nulla. `seat` vuoto = si usa meta.address. `host` e `updated` (AAAA-MM-GG) compaiono nell'informativa.
 *  Solo per debug: `?anteprima=legale` nell'URL mostra riga e pop-up con "[da completare]" al posto dei dati mancanti.
 *
 * INFORMATIVA PRIVACY
 *  privacy: { it: [ { h, p: [paragrafo, ...] }, ... ], en: [ ... ] } = sezioni dell'informativa per lingua
 *  (titolo `h` + paragrafi `p`). Un paragrafo può essere { noAnalytics, analytics }: si usa il secondo testo
 *  quando meta.legal.analytics è true (statistiche Cloudflare accese), altrimenti il primo. Nei paragrafi i segnaposto {company}, {vat}, {seat}, {rea}, {capital}, {email}, {host} vengono
 *  sostituiti con i valori di meta.legal; un paragrafo che usa {rea} o {capital} viene saltato se quel dato è vuoto. Se manca una lingua si usa l'italiano. Se cambi il testo, aggiorna meta.legal.updated.
 *
 */
window.BIVIO_LOCALE = Object.freeze({
  meta: {
    name: "Bivio Bistrot", city: "Roma", currency: "EUR", locale: "it-IT",
    languages: ["it", "en"], defaultLanguage: "it",
    // Orari di apertura, lunedì -> domenica (indice 0 = lunedì). null = chiuso tutto il giorno.
    // close <= open = chiusura dopo mezzanotte (es. sabato 11:30-02:00 chiude alle 02:00 di domenica).
    hours: [
      { open: "07:30", close: "22:00" }, // lun
      { open: "07:30", close: "23:00" }, // mar
      { open: "07:30", close: "23:00" }, // mer
      { open: "07:30", close: "00:00" }, // gio
      { open: "07:30", close: "01:00" }, // ven
      { open: "11:30", close: "02:00" }, // sab
      { open: "11:30", close: "22:00" }  // dom
    ],
    // Link di contatto: incolla qui gli URL definitivi. Stringa vuota = pulsante mostrato come "in arrivo" (non cliccabile).
    address: "Piazza Monte Grappa, 1b, 00195 Roma",
    phone: "+39 378 067 0878",
    // Dati legali: finché company, vat ed email non sono tutti compilati, riga legale e informativa privacy restano nascoste.
    legal: {
      company: "BIVIO 2026 S.R.L.S.",   // ragione sociale esatta (sigla iscritta al Registro Imprese)
      vat: "18547191009",       // partita IVA, solo le 11 cifre
      seat: "",      // sede legale; lascia vuoto se coincide con `address`
      rea: "RM-1791596",  // numero REA (ufficio del Registro Imprese + numero); vuoto = non compare
      capital: 1000,      // capitale sociale interamente versato, in euro; null = non compare
      email: "privacy@example.com",  // FITTIZIA, DA SOSTITUIRE: contatto per le richieste sulla privacy
      host: "Cloudflare Pages – Cloudflare, Inc.",  // fornitore che ospita il sito (compare nell'informativa)
      analytics: false,  // true = Cloudflare Web Analytics è accesa (dal pannello Cloudflare): cambia la frase dell'informativa. Non accende le statistiche.
      updated: "2026-10-15"  // data dell'informativa (AAAA-MM-GG): aggiornala quando cambi i dati o il testo
    },
    links: {
      maps: "https://maps.app.goo.gl/19F1xGau4LCWjnEJA",
      whatsapp: "https://wa.me/393780670878",  // es. "https://wa.me/39XXXXXXXXXX" (numero con prefisso, senza + né spazi)
      thefork: ""  // pagina di prenotazione TheFork (sito del locale). Vuoto = il pulsante TheFork non compare
    }
  },

  // Informativa privacy (vedi lo schema in testa al file). Segnaposto: {company} {vat} {seat} {rea} {capital} {email} {host}
  privacy: {
    it: [
      { h: "Titolare del trattamento", p: [
        "{company}, partita IVA {vat}, con sede in {seat}.",
        "Registro delle Imprese di Roma, REA {rea}.",
        "Capitale sociale {capital} interamente versato.",
        "Per qualsiasi richiesta sulla privacy puoi scrivere a {email}."
      ] },
      { h: "Quali dati trattiamo", p: [
        {
          noAnalytics: "Questo sito serve a consultare il menu e a conoscere il locale. Non ha moduli, registrazioni, statistiche né pubblicità, e non usa cookie.",
          analytics: "Questo sito serve a consultare il menu e a conoscere il locale. Non ha moduli, registrazioni né pubblicità, e non usa cookie. Raccogliamo solo statistiche aggregate e anonime sulle visite (pagine viste, provenienza, tipo di dispositivo) con Cloudflare Web Analytics, che non usa cookie e non ti identifica."
        },
        "Come per ogni sito, il fornitore che lo ospita ({host}) registra nei propri log tecnici l'indirizzo IP e alcuni dati del browser di chi lo visita, per farlo funzionare e proteggerlo. Noi non usiamo questi dati per identificarti. La base giuridica è il legittimo interesse a far funzionare il sito in sicurezza (art. 6, par. 1, lett. f del GDPR)."
      ] },
      { h: "Cosa salviamo sul tuo dispositivo", p: [
        "Solo la lingua che scegli (italiano o inglese), nella memoria del browser, per non chiedertela a ogni visita. Non serve a profilarti e non richiede consenso. Puoi cancellarla dalle impostazioni del browser."
      ] },
      { h: "Link esterni", p: [
        "I pulsanti Mappa e WhatsApp e il numero di telefono aprono servizi esterni (Google Maps, WhatsApp, l'app del telefono), che trattano i tuoi dati secondo le proprie informative. Se ci scrivi o ci chiami, usiamo i tuoi dati solo per risponderti."
      ] },
      { h: "I tuoi diritti", p: [
        "Puoi chiedere in ogni momento l'accesso ai tuoi dati, la rettifica, la cancellazione, la limitazione o l'opposizione al trattamento scrivendo a {email}.",
        "Hai anche il diritto di presentare reclamo al Garante per la protezione dei dati personali (garanteprivacy.it)."
      ] }
    ],
    en: [
      { h: "Data controller", p: [
        "{company}, VAT no. {vat}, registered office at {seat}.",
        "Rome Companies Register, REA no. {rea}.",
        "Share capital {capital}, fully paid up.",
        "For any privacy request you can write to {email}."
      ] },
      { h: "What data we process", p: [
        {
          noAnalytics: "This website lets you browse the menu and find out about the restaurant. It has no forms, sign-ups, analytics or advertising, and it uses no cookies.",
          analytics: "This website lets you browse the menu and find out about the restaurant. It has no forms, sign-ups or advertising, and it uses no cookies. We only collect aggregate, anonymous visit statistics (pages viewed, referrer, device type) with Cloudflare Web Analytics, which uses no cookies and does not identify you."
        },
        "As with any website, the hosting provider ({host}) records the IP address and some browser data of visitors in its technical logs, in order to run and protect the site. We do not use this data to identify you. The legal basis is our legitimate interest in running the site securely (Art. 6(1)(f) GDPR)."
      ] },
      { h: "What we store on your device", p: [
        "Only the language you choose (Italian or English), in your browser's storage, so we don't have to ask at every visit. It is not used to profile you and requires no consent. You can delete it from your browser settings."
      ] },
      { h: "External links", p: [
        "The Map and WhatsApp buttons and the phone number open external services (Google Maps, WhatsApp, your phone app), which process your data under their own privacy notices. If you write or call us, we use your data only to reply."
      ] },
      { h: "Your rights", p: [
        "You can ask at any time to access, correct or delete your data, or to restrict or object to its processing, by writing to {email}.",
        "You also have the right to lodge a complaint with the Italian Data Protection Authority (garanteprivacy.it)."
      ] }
    ]
  },

  // ------------------------------------------------------------------ FOTO DEL LOCALE (galleria del sito del locale)
  // Percorsi dalla radice del sito (es. "assets/images/…"): chi li usa da una sottocartella aggiunge "../" (vedi assets/galleria.js, opzione `base`).
  // COME AGGIUNGERE UNA FOTO: metti l'originale in assets/images/locale/{esterni,interni,dettagli}/,
  // lancia `python tools/ottimizza-foto.py` (crea i derivati in locale/web/), poi aggiungi qui un oggetto:
  // { id, src (-1600), srcSmall (-800), width, height (del -1600), alt, caption, en: { alt, caption } }.
  // width/height (del -1600) servono a script.js per scegliere tra -800 e -1600 in base allo schermo. Ordine = ordine in pagina.
  gallery: [
    {
      id: "esterni-terrazzino", src: "assets/images/locale/web/esterni-terrazzino-1600.jpg", srcSmall: "assets/images/locale/web/esterni-terrazzino-800.jpg",
      width: 1200, height: 1600, alt: "Tavolo apparecchiato sul terrazzino tra le piante", caption: "Il terrazzino",
      en: { alt: "Table set on the terrace among the plants", caption: "The terrace" }
    },
    {
      id: "interni-cucina-a-vista-3", src: "assets/images/locale/web/interni-cucina-a-vista-3-1600.jpg", srcSmall: "assets/images/locale/web/interni-cucina-a-vista-3-800.jpg",
      width: 1600, height: 1200, alt: "Bancone in mosaico davanti alla cucina a vista", caption: "La cucina a vista",
      en: { alt: "Mosaic counter in front of the open kitchen", caption: "The open kitchen" }
    },
    {
      id: "interni-tavolo-con-piatti", src: "assets/images/locale/web/interni-tavolo-con-piatti-1600.jpg", srcSmall: "assets/images/locale/web/interni-tavolo-con-piatti-800.jpg",
      width: 1200, height: 1600, alt: "Due piatti di pasta al pomodoro su un tavolo apparecchiato", caption: "A tavola",
      en: { alt: "Two plates of tomato pasta on a set table", caption: "At the table" }
    },
    {
      id: "interni-cucina-a-vista-2", src: "assets/images/locale/web/interni-cucina-a-vista-2-1600.jpg", srcSmall: "assets/images/locale/web/interni-cucina-a-vista-2-800.jpg",
      width: 1200, height: 1600, alt: "Sgabelli al bancone con la cucina alle spalle", caption: "Il bancone",
      en: { alt: "Stools at the counter with the kitchen behind", caption: "The counter" }
    },
    {
      id: "interni-tavoli-al-buio", src: "assets/images/locale/web/interni-tavoli-al-buio-1600.jpg", srcSmall: "assets/images/locale/web/interni-tavoli-al-buio-800.jpg",
      width: 1200, height: 1600, alt: "Tavoli apparecchiati alla luce delle candele", caption: "La sera",
      en: { alt: "Tables set by candlelight", caption: "In the evening" }
    },
    {
      id: "interni-tavolo-con-piatto", src: "assets/images/locale/web/interni-tavolo-con-piatto-1600.jpg", srcSmall: "assets/images/locale/web/interni-tavolo-con-piatto-800.jpg",
      width: 1200, height: 1600, alt: "Pasta al pomodoro con formaggio grattugiato", caption: "Dalla cucina",
      en: { alt: "Tomato pasta with grated cheese", caption: "From the kitchen" }
    },
    {
      id: "interni-cucina-a-vista", src: "assets/images/locale/web/interni-cucina-a-vista-1600.jpg", srcSmall: "assets/images/locale/web/interni-cucina-a-vista-800.jpg",
      width: 1200, height: 1600, alt: "Piatto servito sul bancone davanti alla cucina", caption: "Al bancone",
      en: { alt: "Dish served at the counter in front of the kitchen", caption: "At the counter" }
    }
  ]
});
