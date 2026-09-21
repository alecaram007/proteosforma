/* Rendering lato pubblico dei contenuti gestiti dalla dashboard (Supabase). */
(function () {
  'use strict';
  var cfg = window.PROTEOS_CONFIG;
  if (!cfg || !window.supabase) return;
  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: false } });

  var STATI = {
    in_programmazione:   { label: 'In programmazione',                 cls: 'st-plan' },
    in_fase_di_avvio:    { label: 'In fase di avvio',                  cls: 'st-start' },
    in_cerca_di_allievi: { label: 'Corso avviato: iscrizioni aperte',  cls: 'st-open' },
    in_svolgimento:      { label: 'In svolgimento',                    cls: 'st-run' },
    concluso:            { label: 'Corso concluso',                    cls: 'st-done' }
  };
  var MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

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

  /* ---- menu "Corsi finanziati" ---- */
  function fillNav() {
    var lists = document.querySelectorAll('[data-cms="nav-avvisi"]');
    if (!lists.length) return;
    sb.from('web_avvisi').select('slug,titolo,numero').eq('pubblicato', true).order('ordine').then(function (r) {
      if (r.error || !r.data || !r.data.length) return;
      lists.forEach(function (ul) {
        ul.innerHTML = r.data.map(function (a) {
          return '<li><a href="/avviso/' + esc(a.slug) + '/">' + esc(a.titolo) + '</a></li>';
        }).join('');
      });
    });
  }

  /* ---- griglia corsi (pagina Corsi) ---- */
  function renderCorsi(el) {
    el.innerHTML = '<p class="cms-loading">Caricamento corsi…</p>';
    sb.from('web_corsi').select('slug,titolo,ore,indennita,sede,locandina_url,stato,avviso:web_avvisi(slug,titolo,numero,pubblicato)')
      .eq('pubblicato', true).order('ordine').then(function (r) {
        if (r.error) { el.innerHTML = '<p class="cms-error">Impossibile caricare i corsi in questo momento.</p>'; return; }
        var rows = (r.data || []).filter(function (c) { return c.avviso && c.avviso.pubblicato; });
        if (!rows.length) { el.innerHTML = '<p class="cms-empty">Al momento non ci sono corsi pubblicati. Torna a trovarci presto.</p>'; return; }
        el.innerHTML = '<div class="posters posters-corsi">' + rows.map(function (c) {
          var href = '/avviso/' + esc(c.avviso.slug) + '/#corso-' + esc(c.slug);
          return '<figure class="poster poster-link">' +
            '<a href="' + href + '">' + (c.locandina_url ? '<img src="' + esc(c.locandina_url) + '" alt="Locandina ' + esc(c.titolo) + '" loading="lazy" />' : '<div class="poster-placeholder">' + esc(c.titolo) + '</div>') + badge(c.stato) + '</a>' +
            '<figcaption><strong><a href="' + href + '">' + esc(c.titolo) + '</a></strong>' +
            '<span class="poster-avviso">' + esc(c.avviso.titolo) + '</span>' +
            (c.ore ? '<span>' + esc(c.ore) + '</span>' : '') +
            (c.indennita ? '<span>' + esc(c.indennita) + '</span>' : '') +
            (c.sede ? '<span>Sede: ' + esc(c.sede) + '</span>' : '') +
            '<a class="poster-more" href="' + href + '">Vai all’avviso e alle informazioni →</a></figcaption></figure>';
        }).join('') + '</div>';
      });
  }

  /* ---- pagina avviso ---- */
  function renderAvviso(el) {
    var slug = pathSlug('avviso');
    if (!slug) { el.innerHTML = '<section class="section section-white"><div class="container"><h1 class="page-title">Avviso non trovato</h1></div></section>'; return; }
    sb.from('web_avvisi').select('*,corsi:web_corsi(*)').eq('slug', slug).maybeSingle().then(function (r) {
      var a = r.data;
      if (r.error || !a || !a.pubblicato) {
        document.title = 'Avviso non trovato - Proteos';
        el.innerHTML = '<section class="section section-white"><div class="container narrow"><h1 class="page-title">Avviso non trovato</h1><p>L’avviso richiesto non è disponibile. <a href="/corsi/">Vedi i corsi attivi</a>.</p></div></section>';
        return;
      }
      document.title = a.titolo + ' - Proteos';
      var corsi = (a.corsi || []).filter(function (c) { return c.pubblicato; }).sort(function (x, y) { return x.ordine - y.ordine; });
      var titlePre = a.titolo.replace(a.numero, '').trim();
      var html = '';
      html += '<section class="avviso-hero"><div class="container">' +
        '<h1>' + esc(titlePre) + ' <strong>' + esc(a.numero) + '</strong></h1>' +
        '<div class="avviso-stato">' + badge(a.stato) + '</div>' +
        (a.sottotitolo ? '<p class="avviso-sub">' + esc(a.sottotitolo) + '</p>' : '') +
        paras(a.testo_intro) + '</div></section>';
      html += '<section class="section section-white avviso-body"><div class="container narrow">' +
        '<div class="text-brand">' + paras(a.testo_corpo) + '</div>' +
        (a.allegato_url ? '<p class="avviso-allegato"><a class="btn btn-square" href="' + esc(a.allegato_url) + '" target="_blank" rel="noopener">Scarica l’avviso completo (PDF)</a></p>' : '') +
        (corsi.length ? '<h2 class="h-red">Visualizza la nostra Offerta Formativa</h2><div class="posters">' + corsi.map(function (c) {
          return '<figure class="poster" id="corso-' + esc(c.slug) + '">' +
            (c.locandina_url ? '<a href="' + esc(c.locandina_url) + '" target="_blank" rel="noopener"><img src="' + esc(c.locandina_url) + '" alt="Locandina corso ' + esc(c.titolo) + '" loading="lazy" /></a>' : '') +
            '<figcaption>' + badge(c.stato) + '<strong>' + esc(c.titolo) + '</strong>' +
            (c.ore ? '<span>' + esc(c.ore) + '</span>' : '') + (c.indennita ? '<span>' + esc(c.indennita) + '</span>' : '') + (c.sede ? '<span>Sede: ' + esc(c.sede) + '</span>' : '') +
            (c.descrizione ? '<span class="poster-desc">' + esc(c.descrizione) + '</span>' : '') + '</figcaption></figure>';
        }).join('') + '</div>' : '') + '</div></section>';
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
      if (location.hash) { var t = document.querySelector(location.hash); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });
  }

  /* ---- bandi ---- */
  function renderBandi(el) {
    var id = pathSlug('bandi-e-avvisi');
    if (id) {
      sb.from('web_bandi').select('*').eq('id', id).maybeSingle().then(function (r) {
        var b = r.data;
        if (r.error || !b || !b.pubblicato) { el.innerHTML = '<h2 class="no-results">Bando non trovato</h2><p><a href="/bandi-e-avvisi/">Torna all’elenco</a></p>'; return; }
        document.title = b.titolo + ' - Proteos';
        el.innerHTML = '<article class="bando-detail"><p class="post-meta">' + fmtDate(b.data) + '</p><h2>' + esc(b.titolo) + '</h2>' +
          paras(b.testo || b.estratto) +
          (b.allegato_url ? '<p><a class="btn btn-square" href="' + esc(b.allegato_url) + '" target="_blank" rel="noopener">Scarica il bando (PDF)</a></p>' : '') +
          '<p class="pagination"><a href="/bandi-e-avvisi/">« Tutti i bandi</a></p></article>';
      });
      return;
    }
    el.innerHTML = '<p class="cms-loading">Caricamento…</p>';
    sb.from('web_bandi').select('id,titolo,data,estratto,allegato_url').eq('pubblicato', true).order('data', { ascending: false }).then(function (r) {
      if (r.error) { el.innerHTML = '<p class="cms-error">Impossibile caricare i bandi in questo momento.</p>'; return; }
      if (!r.data || !r.data.length) { el.innerHTML = '<h2 class="no-results">Nessun bando pubblicato</h2><p>Al momento non ci sono bandi o avvisi di selezione attivi.</p>'; return; }
      el.innerHTML = '<div class="posts">' + r.data.map(function (b) {
        var href = '/bandi-e-avvisi/' + b.id + '/';
        return '<article class="post"><h2><a href="' + href + '">' + esc(b.titolo) + '</a></h2><p class="post-meta">' + fmtDate(b.data) + '</p>' +
          (b.estratto ? '<p>' + esc(b.estratto) + '</p>' : '') +
          '<a class="more" href="' + href + '">leggi tutto</a>' + (b.allegato_url ? ' <a class="more" href="' + esc(b.allegato_url) + '" target="_blank" rel="noopener">PDF</a>' : '') + '</article>';
      }).join('') + '</div>';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    fillNav();
    document.querySelectorAll('[data-cms="corsi"]').forEach(renderCorsi);
    document.querySelectorAll('[data-cms="avviso"]').forEach(renderAvviso);
    document.querySelectorAll('[data-cms="bandi"]').forEach(renderBandi);
  });

  window.ProteosCMS = { client: sb, STATI: STATI, badge: badge, esc: esc };
})();
