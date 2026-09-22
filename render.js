/* Disegno delle pagine dinamiche (avvisi e bandi) condiviso tra browser (cms.js) e server (api/ssr.js):
   Google riceve la pagina già completa, i visitatori vedono esattamente lo stesso contenuto. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProteosRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SITE = 'https://proteosformazione.it';
  var ORG = 'Proteos S.r.l. Impresa Sociale';
  var STATI = {
    in_programmazione:   { label: 'In programmazione',                 cls: 'st-plan' },
    in_fase_di_avvio:    { label: 'In fase di avvio',                  cls: 'st-start' },
    in_cerca_di_allievi: { label: 'Corso avviato: iscrizioni aperte',  cls: 'st-open' },
    in_svolgimento:      { label: 'In svolgimento',                    cls: 'st-run' },
    in_conclusione:      { label: 'In conclusione',                    cls: 'st-closing' },
    concluso:            { label: 'Corso concluso',                    cls: 'st-done' }
  };
  var MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  var LOGHI_ALT = {
    'coesione-italia-21-27-sicilia': 'Coesione Italia 21-27 Sicilia',
    'cofinanziato-ue': 'Cofinanziato dall’Unione europea',
    'repubblica-italiana': 'Repubblica Italiana',
    'regione-siciliana': 'Regione Siciliana',
    'poc-sicilia-14-20': 'POC Sicilia 14-20'
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function paras(t) {
    if (!t) return '';
    return String(t).split(/\n{2,}/).map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }
  function plain(t, n) {
    var s = String(t || '').replace(/\s+/g, ' ').trim();
    if (s.length <= n) return s;
    s = s.slice(0, n - 1);
    return s.slice(0, Math.max(s.lastIndexOf(' '), n - 20)).replace(/[\s,;:–-]+$/, '') + '…';
  }
  function badge(stato) {
    var s = STATI[stato] || STATI.in_programmazione;
    return '<span class="stato ' + s.cls + '">' + s.label + '</span>';
  }
  function fmtDate(d) {
    if (!d) return '';
    var p = d.split('-');
    return parseInt(p[2], 10) + ' ' + MESI[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function loghiHtml(t) {
    var list = String(t || '').split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!list.length) return '';
    return '<div class="avviso-loghi">' + list.map(function (u) {
      var k = u.split('?')[0].split('/').pop().replace(/\.\w+$/, '');
      return '<img src="' + esc(u) + '" alt="' + esc(LOGHI_ALT[k] || 'Logo') + '" loading="lazy" decoding="async" />';
    }).join('') + '</div>';
  }
  function jsonld(obj) { return '<script type="application/ld+json">' + JSON.stringify(obj).replace(/</g, '\\u003c') + '</script>'; }
  function breadcrumb(items) {
    return { '@type': 'BreadcrumbList', itemListElement: items.map(function (it, i) { return { '@type': 'ListItem', position: i + 1, name: it[0], item: SITE + it[1] }; }) };
  }

  function bandoCard(b, conAvviso) {
    var href = '/bandi-e-avvisi/' + b.id + '/';
    var av = conAvviso && b.avviso && b.avviso.pubblicato ? '<span class="post-avviso">' + esc(b.avviso.titolo) + '</span>' : '';
    return '<article class="post"' + (b.avviso_id ? ' data-avviso="' + esc(b.avviso_id) + '"' : '') + '>' + av +
      '<h2><a href="' + href + '">' + esc(b.titolo) + '</a></h2><p class="post-meta">' + fmtDate(b.data) + '</p>' +
      (b.estratto ? '<p>' + esc(b.estratto) + '</p>' : '') +
      '<a class="more" href="' + href + '">leggi tutto</a>' + (b.allegato_url ? ' <a class="more" href="' + esc(b.allegato_url) + '" target="_blank" rel="noopener">PDF</a>' : '') + '</article>';
  }

  /* ---- pagina avviso: contenuto + titolo, descrizione e dati strutturati per Google ---- */
  function avviso(a, formHtml) {
    var url = '/avviso/' + a.slug + '/';
    var corsi = (a.corsi || []).filter(function (c) { return c.pubblicato; }).sort(function (x, y) { return x.ordine - y.ordine; });
    var bandi = (a.bandi || []).filter(function (b) { return b.pubblicato; }).sort(function (x, y) { return x.data < y.data ? 1 : -1; });
    var titlePre = a.titolo.replace(a.numero, '').trim();
    var form = String(formHtml || '');
    if (corsi.length) {
      form = form.replace('<label class="sr-only" for="f-subject">', '<label class="sr-only" for="f-corso">Corso di interesse</label><select class="input" id="f-corso" name="corso">' +
        '<option value="">Corso di interesse</option>' + corsi.map(function (c) { return '<option>' + esc(c.titolo) + '</option>'; }).join('') + '</select>' +
        '<label class="sr-only" for="f-subject">');
    }
    var html = '<section class="avviso-hero' + (a.loghi && a.loghi.trim() ? ' has-loghi' : '') + '"><span class="avviso-orb o1" aria-hidden="true"></span><span class="avviso-orb o2" aria-hidden="true"></span><div class="container">' +
      '<h1 data-split>' + esc(titlePre) + ' <strong>' + esc(a.numero) + '</strong></h1>' +
      '<div class="avviso-stato">' + badge(a.stato) + '</div>' +
      (a.sottotitolo ? '<p class="avviso-sub">' + esc(a.sottotitolo) + '</p>' : '') +
      paras(a.testo_intro) + '</div></section>';
    html += '<section class="section section-white avviso-body"><div class="container narrow">' + loghiHtml(a.loghi) +
      '<div class="text-brand">' + paras(a.testo_corpo) + '</div>' +
      (a.allegato_url ? '<p class="avviso-allegato"><a class="btn btn-square" href="' + esc(a.allegato_url) + '" target="_blank" rel="noopener">Scarica l’avviso completo (PDF)</a></p>' : '') +
      (corsi.length ? '<h2 class="h-red">Visualizza la nostra Offerta Formativa</h2><div class="posters">' + corsi.map(function (c) {
        return '<figure class="poster" id="corso-' + esc(c.slug) + '">' +
          (c.locandina_url ? '<a class="poster-img" href="' + esc(c.locandina_url) + '" target="_blank" rel="noopener"><img src="' + esc(c.locandina_url) + '" alt="Locandina corso ' + esc(c.titolo) + '" width="800" height="1131" loading="lazy" decoding="async" /></a>' : '') +
          '<figcaption>' + badge(c.stato) + '<strong>' + esc(c.titolo) + '</strong>' +
          (c.ore ? '<span>' + esc(c.ore) + '</span>' : '') + (c.indennita ? '<span>' + esc(c.indennita) + '</span>' : '') + (c.sede ? '<span>Sede: ' + esc(c.sede) + '</span>' : '') +
          (c.descrizione ? '<span class="poster-desc">' + esc(c.descrizione) + '</span>' : '') + '</figcaption></figure>';
      }).join('') + '</div>' : '') +
      (bandi.length ? '<h2 class="h-red">Bandi di selezione</h2><div class="posts posts-avviso">' + bandi.map(function (b) { return bandoCard(b, false); }).join('') + '</div>' : '') +
      '</div></section>';
    if (a.destinatari) {
      html += '<section class="section section-light avviso-q"><div class="container narrow"><h3 class="h-q">' + esc(a.destinatari_titolo || 'A chi si rivolge l’Avviso?') + '</h3>' + paras(a.destinatari) + '</div></section>';
    }
    html += '<section class="section section-white avviso-end"><div class="container narrow">' +
      (a.indennita ? '<div class="indennita-box"><h2>Indennità di frequenza</h2><p>' + esc(a.indennita).replace(/(€\s?[\d.,]+(?:\/h)?)/g, '<b>$1</b>') + '</p></div>' : '') +
      (a.rilascio_titolo ? '<h2 class="h-small-brand">Rilascio del titolo</h2><p>' + esc(a.rilascio_titolo) + '</p>' : '') +
      '<h2 class="h-red">Per iscriverti al modulo compila il form sottostante</h2><p class="center">Verrai ricontattato dalla nostra segreteria</p>' +
      '<div class="form-box">' + form + '</div></div></section>';

    var sub = a.sottotitolo ? String(a.sottotitolo).split(/\s[–-]\s/)[0] : '';
    var auto = a.titolo + (sub && (a.titolo + sub).length <= 62 ? ' – ' + sub : '');
    var title = (a.titolo_seo || auto) + ' - Proteos';
    var description = plain((a.sottotitolo ? a.sottotitolo + '. ' : '') + (a.testo_intro || a.testo_corpo || ''), 158);
    var graph = [breadcrumb([['Home', '/'], ['Corsi', '/corsi/'], [a.titolo, url]])];
    if (corsi.length) {
      graph.push({
        '@type': 'ItemList', name: 'Corsi – ' + a.titolo,
        itemListElement: corsi.map(function (c, i) {
          var h = String(c.ore || '').match(/\d+/);
          var inst = { '@type': 'CourseInstance', courseMode: 'Onsite', location: c.sede || 'Favara (AG)' };
          if (h) inst.courseWorkload = 'PT' + h[0] + 'H';
          return {
            '@type': 'ListItem', position: i + 1,
            item: {
              '@type': 'Course', name: c.titolo, url: SITE + url + '#corso-' + c.slug,
              description: c.descrizione || (c.titolo + ': corso di formazione gratuito' + (c.ore ? ' (' + c.ore + ')' : '') + ' – ' + a.titolo + ', Regione Siciliana.'),
              provider: { '@type': 'EducationalOrganization', name: ORG, sameAs: SITE + '/' },
              offers: { '@type': 'Offer', price: 0, priceCurrency: 'EUR', category: 'Free' },
              hasCourseInstance: inst
            }
          };
        })
      });
    }
    return { html: html, title: title, description: description, url: url, jsonld: jsonld({ '@context': 'https://schema.org', '@graph': graph }) };
  }

  /* ---- dettaglio bando ---- */
  function bandoDetail(b) {
    var url = '/bandi-e-avvisi/' + b.id + '/';
    var av = b.avviso && b.avviso.pubblicato ? ' · <a href="/avviso/' + esc(b.avviso.slug) + '/">' + esc(b.avviso.titolo) + '</a>' : '';
    var html = '<article class="bando-detail"><p class="post-meta">' + fmtDate(b.data) + av + '</p><h2>' + esc(b.titolo) + '</h2>' +
      paras(b.testo || b.estratto) +
      (b.allegato_url ? '<p><a class="btn btn-square" href="' + esc(b.allegato_url) + '" target="_blank" rel="noopener">Scarica il bando (PDF)</a></p>' : '') +
      '<p class="pagination"><a href="/bandi-e-avvisi/">« Tutti i bandi</a></p></article>';
    return {
      html: html, url: url, title: b.titolo + ' - Proteos',
      description: plain(b.estratto || b.testo || b.titolo, 158),
      jsonld: jsonld({ '@context': 'https://schema.org', '@graph': [breadcrumb([['Home', '/'], ['Bandi e Avvisi', '/bandi-e-avvisi/'], [b.titolo, url]])] })
    };
  }

  var NOT_FOUND = {
    avviso: '<section class="section section-white"><div class="container narrow"><h1 class="page-title">Avviso non trovato</h1><p>L’avviso richiesto non è disponibile. <a href="/corsi/">Vedi i corsi attivi</a>.</p></div></section>',
    bando: '<h2 class="no-results">Bando non trovato</h2><p><a href="/bandi-e-avvisi/">Torna all’elenco</a></p>'
  };
  var Q = {
    avviso: function (slug) { return 'web_avvisi?select=*,corsi:web_corsi(*),bandi:web_bandi(id,titolo,data,estratto,allegato_url,pubblicato)&slug=eq.' + encodeURIComponent(slug); },
    bando: function (id) { return 'web_bandi?select=*,avviso:web_avvisi(titolo,slug,pubblicato)&id=eq.' + id; }
  };

  return {
    SITE: SITE, STATI: STATI, esc: esc, paras: paras, plain: plain, badge: badge, fmtDate: fmtDate,
    loghiHtml: loghiHtml, bandoCard: bandoCard, avviso: avviso, bandoDetail: bandoDetail, NOT_FOUND: NOT_FOUND, Q: Q,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  };
});
