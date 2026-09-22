/* Rendering lato pubblico dei contenuti gestiti dalla dashboard (Supabase).
   Legge l'API REST con fetch semplici (niente supabase-js: -218 KB per pagina) e tiene
   in sessionStorage le risposte per 2 minuti, così la navigazione tra le pagine è immediata.
   Avvisi e bandi usano render.js (lo stesso codice del server): se la pagina arriva già
   disegnata dal server (data-ssr) qui si attivano solo modulo e animazioni. */
(function () {
  'use strict';
  var cfg = window.PROTEOS_CONFIG;
  var R = window.ProteosRender;
  if (!cfg || !R || !window.fetch) return;
  var esc = R.esc, badge = R.badge;
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

  function pathSlug(prefix) {
    var m = location.pathname.match(new RegExp('^/' + prefix + '/([^/]+)/?$'));
    if (m) return decodeURIComponent(m[1]);
    var q = new URLSearchParams(location.search);
    return q.get('s') || q.get('id') || '';
  }
  /* titolo, descrizione, indirizzo canonico e indicizzazione quando la pagina è disegnata qui */
  function setHead(o) {
    if (o.title) document.title = o.title;
    var set = function (sel, attr, val) { var el = document.querySelector(sel); if (el && val) el.setAttribute(attr, val); };
    set('meta[name="description"]', 'content', o.description);
    set('meta[property="og:title"]', 'content', o.title);
    set('meta[property="og:description"]', 'content', o.description);
    if (o.url) { set('link[rel="canonical"]', 'href', R.SITE + o.url); set('meta[property="og:url"]', 'content', R.SITE + o.url); }
    var robots = document.querySelector('meta[name="robots"]');
    if (o.noindex) {
      if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots); }
      robots.content = 'noindex';
    } else if (robots) { robots.remove(); }
  }
  function afterRender(el) {
    if (window.ProteosForms) window.ProteosForms.init(el);
    fx(el);
    if (location.hash) { var t = document.querySelector(location.hash); if (t) setTimeout(function () { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150); }
  }

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
    if (el.dataset.ssr) { afterRender(el); return; }
    var slug = pathSlug('avviso');
    function notFound() {
      setHead({ title: 'Avviso non trovato - Proteos', noindex: true });
      el.innerHTML = R.NOT_FOUND.avviso;
    }
    if (!slug) { notFound(); return; }
    api(R.Q.avviso(slug)).then(function (rows) {
      var a = rows[0];
      if (!a || !a.pubblicato) { notFound(); return; }
      var tpl = document.getElementById('cms-form-template');
      var out = R.avviso(a, tpl ? tpl.innerHTML : '');
      setHead(out);
      el.innerHTML = out.html;
      afterRender(el);
    }).catch(notFound);
  }

  /* ---- bandi ---- */
  function renderBandi(el) {
    var id = pathSlug('bandi-e-avvisi');
    if (id) {
      if (el.dataset.ssr) { afterRender(el); return; }
      var nf = function () { setHead({ title: 'Bando non trovato - Proteos', noindex: true }); el.innerHTML = R.NOT_FOUND.bando; };
      if (!R.UUID.test(id)) { nf(); return; }
      api(R.Q.bando(id)).then(function (rows) {
        var b = rows[0];
        if (!b || !b.pubblicato) { nf(); return; }
        var out = R.bandoDetail(b);
        setHead(out);
        el.innerHTML = out.html;
        afterRender(el);
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
      el.innerHTML = chips + '<div class="posts">' + rows.map(function (b) { return R.bandoCard(b, true); }).join('') + '</div>';
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

  window.ProteosCMS = { api: api, STATI: R.STATI, badge: badge, esc: esc };
})();
