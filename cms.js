/* Rendering lato pubblico dei contenuti gestiti dalla dashboard (Supabase).
   Legge l'API REST con fetch semplici (niente supabase-js: -218 KB per pagina) e tiene
   in sessionStorage le risposte per 2 minuti, così la navigazione tra le pagine è immediata. */
(function () {
  'use strict';
  var cfg = window.PROTEOS_CONFIG;
  if (!cfg || !window.fetch) return;

  var STATI = {
    in_programmazione:   { label: 'In programmazione',                 cls: 'st-plan' },
    in_fase_di_avvio:    { label: 'In fase di avvio',                  cls: 'st-start' },
    in_cerca_di_allievi: { label: 'Corso avviato: iscrizioni aperte',  cls: 'st-open' },
    in_svolgimento:      { label: 'In svolgimento',                    cls: 'st-run' },
    in_conclusione:      { label: 'In conclusione',                    cls: 'st-closing' },
    concluso:            { label: 'Corso concluso',                    cls: 'st-done' }
  };
  var MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  var TTL = 120000;

  /* GET sull'API REST: apikey in query string = richiesta "semplice", senza preflight CORS */
  var inflight = {};
  function api(path) {
    var key = 'cms:' + path, now = Date.now();
    try {
      var hit = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (hit && now - hit.t < TTL) return Promise.resolve(hit.d);
    } catch (e) { /* storage non disponibile */ }
    if (inflight[path]) return inflight[path];
    var url = cfg.supabaseUrl + '/rest/v1/' + path + (path.indexOf('?') < 0 ? '?' : '&') + 'apikey=' + encodeURIComponent(cfg.supabaseKey);
    inflight[path] = fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (d) {
      try { sessionStorage.setItem(key, JSON.stringify({ t: now, d: d })); } catch (e) { /* ignora */ }
      delete inflight[path];
      return d;
    }, function (err) { delete inflight[path]; throw err; });
    return inflight[path];
  }
  function fx(el) { if (window.ProteosFX) window.ProteosFX.scan(el); }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function paras(t) {
    if (!t) return '';
    return String(t).split(/\n{2,}/).map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
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
  function pathSlug(prefix) {
    var m = location.pathname.match(new RegExp('^/' + prefix + '/([^/]+)/?$'));
    if (m) return decodeURIComponent(m[1]);
    var q = new URLSearchParams(location.search);
    return q.get('s') || q.get('id') || '';
  }
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  var Q_AVVISI = 'web_avvisi?select=slug,titolo,numero&pubblicato=eq.true&order=ordine';
  var Q_CORSI = 'web_corsi?select=slug,titolo,ore,indennita,sede,locandina_url,stato,avviso:web_avvisi(slug,titolo,numero,pubblicato)&pubblicato=eq.true&order=ordine';
  function corsiPubblicati() {
    return api(Q_CORSI).then(function (rows) { return rows.filter(function (c) { return c.avviso && c.avviso.pubblicato; }); });
  }

  /* ---- menu "Corsi finanziati" ---- */
  function fillNav() {
    var lists = document.querySelectorAll('[data-cms="nav-avvisi"]');
    if (!lists.length) return;
    api(Q_AVVISI).then(function (rows) {
      if (!rows.length) return;
      var html = rows.map(function (a) { return '<li><a href="/avviso/' + esc(a.slug) + '/">' + esc(a.titolo) + '</a></li>'; }).join('');
      lists.forEach(function (ul) { ul.innerHTML = html; });
    }).catch(function () { /* resta il menu statico */ });
  }

  /* ---- contatori della home ---- */
  function fillStats() {
    var els = document.querySelectorAll('[data-cms-stat]');
    if (!els.length) return;
    function set(name, n) {
      document.querySelectorAll('[data-cms-stat="' + name + '"]').forEach(function (el) {
        el.setAttribute('data-count', n);
        el.textContent = n;
        if (window.ProteosFX) window.ProteosFX.count(el);
      });
    }
    api(Q_AVVISI).then(function (r) { set('avvisi', r.length); }).catch(function () {});
    corsiPubblicati().then(function (r) { set('corsi', r.length); }).catch(function () {});
  }

  function posterFigure(c, opts) {
    var href = '/avviso/' + esc(c.avviso.slug) + '/#corso-' + esc(c.slug);
    return '<figure class="poster poster-link' + (opts && opts.rail ? ' rail-item' : '') + '">' +
      '<a href="' + href + '" class="poster-img">' + (c.locandina_url
        ? '<img src="' + esc(c.locandina_url) + '" alt="Locandina ' + esc(c.titolo) + '" width="800" height="1131" loading="lazy" decoding="async" />'
        : '<div class="poster-placeholder"><span>' + esc(c.titolo) + '</span></div>') + badge(c.stato) + '</a>' +
      '<figcaption><strong><a href="' + href + '">' + esc(c.titolo) + '</a></strong>' +
      '<span class="poster-avviso">' + esc(c.avviso.titolo) + '</span>' +
      (opts && opts.rail ? '' :
        (c.ore ? '<span>' + esc(c.ore) + '</span>' : '') +
        (c.indennita ? '<span>' + esc(c.indennita) + '</span>' : '') +
        (c.sede ? '<span>Sede: ' + esc(c.sede) + '</span>' : '') +
        '<a class="poster-more" href="' + href + '">Vai all’avviso e alle informazioni →</a>') +
      '</figcaption></figure>';
  }

  /* ---- griglia corsi (pagina Corsi) ---- */
  function renderCorsi(el) {
    el.innerHTML = '<p class="cms-loading">Caricamento corsi…</p>';
    corsiPubblicati().then(function (rows) {
      if (!rows.length) { el.innerHTML = '<p class="cms-empty">Al momento non ci sono corsi pubblicati. Torna a trovarci presto.</p>'; return; }
      el.innerHTML = '<div class="posters posters-corsi">' + rows.map(function (c) { return posterFigure(c); }).join('') + '</div>';
      fx(el);
    }).catch(function () { el.innerHTML = '<p class="cms-error">Impossibile caricare i corsi in questo momento.</p>'; });
  }

  /* ---- corsi in evidenza (home): prima quelli con locandina ---- */
  function renderHomeCorsi(el) {
    corsiPubblicati().then(function (rows) {
      rows = rows.filter(function (c) { return c.stato !== 'concluso'; })
        .sort(function (a, b) { return (b.locandina_url ? 1 : 0) - (a.locandina_url ? 1 : 0); });
      if (!rows.length) { el.closest('section').hidden = true; return; }
      el.innerHTML = rows.map(function (c) { return posterFigure(c, { rail: true }); }).join('');
      fx(el);
    }).catch(function () { el.closest('section').hidden = true; });
  }

  /* ---- pagina avviso ---- */
  function renderAvviso(el) {
    var slug = pathSlug('avviso');
    function notFound() {
      document.title = 'Avviso non trovato - Proteos';
      el.innerHTML = '<section class="section section-white"><div class="container narrow"><h1 class="page-title">Avviso non trovato</h1><p>L’avviso richiesto non è disponibile. <a href="/corsi/">Vedi i corsi attivi</a>.</p></div></section>';
    }
    if (!slug) { notFound(); return; }
    api('web_avvisi?select=*,corsi:web_corsi(*),bandi:web_bandi(id,titolo,data,estratto,allegato_url,pubblicato)&slug=eq.' + encodeURIComponent(slug)).then(function (rows) {
      var a = rows[0];
      if (!a || !a.pubblicato) { notFound(); return; }
      document.title = a.titolo + ' - Proteos';
      var corsi = (a.corsi || []).filter(function (c) { return c.pubblicato; }).sort(function (x, y) { return x.ordine - y.ordine; });
      var bandi = (a.bandi || []).filter(function (b) { return b.pubblicato; }).sort(function (x, y) { return x.data < y.data ? 1 : -1; });
      var titlePre = a.titolo.replace(a.numero, '').trim();
      var html = '';
      html += '<section class="avviso-hero"><span class="avviso-orb o1" aria-hidden="true"></span><span class="avviso-orb o2" aria-hidden="true"></span><div class="container">' +
        '<h1 data-split>' + esc(titlePre) + ' <strong>' + esc(a.numero) + '</strong></h1>' +
        '<div class="avviso-stato">' + badge(a.stato) + '</div>' +
        (a.sottotitolo ? '<p class="avviso-sub">' + esc(a.sottotitolo) + '</p>' : '') +
        paras(a.testo_intro) + '</div></section>';
      html += '<section class="section section-white avviso-body"><div class="container narrow">' +
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
        '<div class="form-box">' + document.getElementById('cms-form-template').innerHTML + '</div></div></section>';
      el.innerHTML = html;
      if (window.ProteosForms) window.ProteosForms.init(el);
      fx(el);
      if (location.hash) { var t = document.querySelector(location.hash); if (t) setTimeout(function () { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150); }
    }).catch(notFound);
  }

  /* ---- bandi ---- */
  function bandoCard(b, conAvviso) {
    var href = '/bandi-e-avvisi/' + b.id + '/';
    var av = conAvviso && b.avviso && b.avviso.pubblicato ? '<span class="post-avviso">' + esc(b.avviso.titolo) + '</span>' : '';
    return '<article class="post"' + (b.avviso_id ? ' data-avviso="' + esc(b.avviso_id) + '"' : '') + '>' + av +
      '<h2><a href="' + href + '">' + esc(b.titolo) + '</a></h2><p class="post-meta">' + fmtDate(b.data) + '</p>' +
      (b.estratto ? '<p>' + esc(b.estratto) + '</p>' : '') +
      '<a class="more" href="' + href + '">leggi tutto</a>' + (b.allegato_url ? ' <a class="more" href="' + esc(b.allegato_url) + '" target="_blank" rel="noopener">PDF</a>' : '') + '</article>';
  }
  function renderBandi(el) {
    var id = pathSlug('bandi-e-avvisi');
    if (id) {
      var nf = function () { el.innerHTML = '<h2 class="no-results">Bando non trovato</h2><p><a href="/bandi-e-avvisi/">Torna all’elenco</a></p>'; };
      if (!UUID.test(id)) { nf(); return; }
      api('web_bandi?select=*,avviso:web_avvisi(titolo,slug,pubblicato)&id=eq.' + id).then(function (rows) {
        var b = rows[0];
        if (!b || !b.pubblicato) { nf(); return; }
        document.title = b.titolo + ' - Proteos';
        var av = b.avviso && b.avviso.pubblicato ? ' · <a href="/avviso/' + esc(b.avviso.slug) + '/">' + esc(b.avviso.titolo) + '</a>' : '';
        el.innerHTML = '<article class="bando-detail"><p class="post-meta">' + fmtDate(b.data) + av + '</p><h2>' + esc(b.titolo) + '</h2>' +
          paras(b.testo || b.estratto) +
          (b.allegato_url ? '<p><a class="btn btn-square" href="' + esc(b.allegato_url) + '" target="_blank" rel="noopener">Scarica il bando (PDF)</a></p>' : '') +
          '<p class="pagination"><a href="/bandi-e-avvisi/">« Tutti i bandi</a></p></article>';
        fx(el);
      }).catch(nf);
      return;
    }
    el.innerHTML = '<p class="cms-loading">Caricamento…</p>';
    api('web_bandi?select=id,titolo,data,estratto,allegato_url,avviso_id,avviso:web_avvisi(titolo,slug,pubblicato,ordine)&pubblicato=eq.true&order=data.desc').then(function (rows) {
      if (!rows.length) { el.innerHTML = '<h2 class="no-results">Nessun bando pubblicato</h2><p>Al momento non ci sono bandi o avvisi di selezione attivi.</p>'; return; }
      // filtri per avviso (solo se i bandi appartengono a più avvisi)
      var avvisi = [], seen = {};
      rows.forEach(function (b) { if (b.avviso && b.avviso.pubblicato && !seen[b.avviso_id]) { seen[b.avviso_id] = 1; avvisi.push({ id: b.avviso_id, t: b.avviso.titolo, o: b.avviso.ordine }); } });
      avvisi.sort(function (x, y) { return x.o - y.o; });
      var chips = avvisi.length > 1 ? '<div class="chips" role="group" aria-label="Filtra per avviso"><button type="button" class="chip active" data-f="">Tutti</button>' +
        avvisi.map(function (a) { return '<button type="button" class="chip" data-f="' + esc(a.id) + '">' + esc(a.t) + '</button>'; }).join('') + '</div>' : '';
      el.innerHTML = chips + '<div class="posts">' + rows.map(function (b) { return bandoCard(b, true); }).join('') + '</div>';
      el.querySelectorAll('.chip').forEach(function (c) {
        c.addEventListener('click', function () {
          el.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('active', x === c); });
          var f = c.getAttribute('data-f');
          el.querySelectorAll('.post').forEach(function (p) { p.hidden = !!f && p.getAttribute('data-avviso') !== f; });
        });
      });
      fx(el);
    }).catch(function () { el.innerHTML = '<p class="cms-error">Impossibile caricare i bandi in questo momento.</p>'; });
  }

  function init() {
    fillNav();
    fillStats();
    document.querySelectorAll('[data-cms="corsi"]').forEach(renderCorsi);
    document.querySelectorAll('[data-cms="home-corsi"]').forEach(renderHomeCorsi);
    document.querySelectorAll('[data-cms="avviso"]').forEach(renderAvviso);
    document.querySelectorAll('[data-cms="bandi"]').forEach(renderBandi);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.ProteosCMS = { api: api, STATI: STATI, badge: badge, esc: esc };
})();
