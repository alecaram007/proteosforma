(function () {
  'use strict';

  /* ----- header: shrink on scroll ----- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('shrunk', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----- mobile menu ----- */
  var nav = document.querySelector('.main-nav');
  var menuToggle = document.querySelector('.menu-toggle');
  if (nav && menuToggle) {
    menuToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
    });
  }

  /* ----- dropdown "Corsi finanziati" (click/tap + tastiera) ----- */
  document.querySelectorAll('.main-nav li.has-sub > a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var li = a.parentElement;
      var open = li.classList.toggle('open');
      a.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.main-nav')) {
      document.querySelectorAll('.main-nav li.has-sub.open').forEach(function (li) {
        li.classList.remove('open');
        li.querySelector('a').setAttribute('aria-expanded', 'false');
      });
    }
  });

  /* ----- search bar ----- */
  var searchToggle = document.querySelector('.search-toggle');
  var searchBar = document.querySelector('.search-bar');
  var searchClose = document.querySelector('.search-close');
  function setSearch(open) {
    if (!searchBar) return;
    searchBar.hidden = !open;
    searchToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) searchBar.querySelector('input').focus();
  }
  if (searchToggle && searchBar) {
    searchToggle.addEventListener('click', function () { setSearch(searchBar.hidden); });
    searchClose.addEventListener('click', function () { setSearch(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setSearch(false); });
  }

  /* ----- moduli di contatto / iscrizione: validazione, captcha aritmetico e salvataggio nel database
     del sito (dashboard → Richieste); se l'invio non riesce resta la possibilità di scrivere via email ----- */
  var EMAIL = 'proteos1@libero.it';
  function escHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function avvisoSlug() {
    var m = location.pathname.match(/^\/avviso\/([^/]+)\/?$/);
    return m ? decodeURIComponent(m[1]) : (new URLSearchParams(location.search).get('s') || null);
  }
  function mailtoHref(rec) {
    var subject = (rec.oggetto || 'Richiesta informazioni') + ' – ' + rec.pagina;
    var body = ['Nome e Cognome: ' + rec.nome, 'Telefono: ' + rec.telefono, 'Email: ' + rec.email].concat(rec.corso ? ['Corso: ' + rec.corso] : []).concat(['', rec.messaggio || '']).join('\n');
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  function initForms(scope) {
    (scope || document).querySelectorAll('.contact-form').forEach(function (form) {
      if (form.dataset.ready) return;
      form.dataset.ready = '1';
      var status = form.querySelector('.form-status');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        form.querySelectorAll('.input[required]').forEach(function (el) {
          var valid = el.value.trim() !== '' && (el.type !== 'email' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value));
          el.classList.toggle('invalid', !valid);
          if (!valid) ok = false;
        });
        var privacy = form.querySelector('input[name="privacy"]');
        if (privacy && !privacy.checked) { privacy.closest('.form-privacy').classList.add('invalid'); ok = false; }
        else if (privacy) { privacy.closest('.form-privacy').classList.remove('invalid'); }
        var a = parseInt(form.dataset.a, 10), b = parseInt(form.dataset.b, 10);
        var captcha = form.querySelector('.captcha-input');
        if (parseInt(captcha.value, 10) !== a + b) { captcha.classList.add('invalid'); ok = false; }
        if (!ok) {
          status.className = 'form-status error';
          status.textContent = 'Compila tutti i campi obbligatori, accetta l\'informativa privacy e verifica il risultato della somma.';
          return;
        }
        var f = form.elements;
        var thanks = 'Grazie! La tua richiesta è stata inviata: la segreteria ti ricontatterà al più presto.';
        if (f.sito && f.sito.value) { status.className = 'form-status ok'; status.textContent = thanks; form.reset(); return; }  // trappola anti-bot
        var val = function (n) { return f[n] && f[n].value.trim() ? f[n].value.trim() : null; };
        var rec = {
          nome: val('nome'), telefono: val('telefono'), email: val('email'), oggetto: val('oggetto'), messaggio: val('messaggio'),
          corso: val('corso'), pagina: document.title.split(' - ')[0].slice(0, 300), avviso_slug: avvisoSlug(), privacy: true
        };
        var cfg = window.PROTEOS_CONFIG || {};
        var btn = form.querySelector('[type="submit"]'), label = btn.textContent;
        btn.disabled = true; btn.textContent = 'Invio…';
        status.className = 'form-status'; status.textContent = '';
        fetch(cfg.supabaseUrl + '/rest/v1/web_richieste?apikey=' + encodeURIComponent(cfg.supabaseKey), {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, body: JSON.stringify(rec)
        }).then(function (r) {
          if (r.ok) { status.className = 'form-status ok'; status.textContent = thanks; form.reset(); return; }
          return r.json().catch(function () { return {}; }).then(function (e) { throw new Error(e && /Troppe/.test(e.message || '') ? e.message : 'invio'); });
        }).catch(function (err) {
          status.className = 'form-status error';
          status.innerHTML = (/Troppe/.test(err.message) ? escHtml(err.message) + '.' : 'Non è stato possibile inviare la richiesta.') +
            ' Puoi scriverci a <a href="' + mailtoHref(rec) + '">' + EMAIL + '</a>.';
        }).then(function () { btn.disabled = false; btn.textContent = label; });
      });
    });
  }
  initForms(document);
  window.ProteosForms = { init: initForms };

  /* ----- mappa contatti (Leaflet self-hosted, tile OpenStreetMap) ----- */
  var mapBox = document.getElementById('map-box');
  if (mapBox) {
    (function () {
      var box = mapBox;
      var sedi = JSON.parse(box.dataset.sedi || '[]');
      var css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = '/vendor/leaflet/leaflet.css';
      document.head.appendChild(css);
      var js = document.createElement('script');
      js.src = '/vendor/leaflet/leaflet.js';
      js.onload = function () {
        box.innerHTML = '';
        box.classList.add('map-loaded');
        var map = L.map(box, { scrollWheelZoom: false });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        var letters = ['A', 'B', 'C', 'D'];
        var group = [];
        sedi.forEach(function (s, i) {
          var icon = L.divIcon({ className: 'map-pin', html: '<span>' + letters[i] + '</span>', iconSize: [34, 42], iconAnchor: [17, 42], popupAnchor: [0, -38] });
          var m = L.marker([s.lat, s.lon], { icon: icon }).addTo(map);
          m.bindPopup('<strong>' + s.title + '</strong><br>' + s.addr + '<br><a href="https://www.google.com/maps/dir/?api=1&destination=' + s.lat + ',' + s.lon + '" target="_blank" rel="noopener">Indicazioni stradali</a>', { maxWidth: 220 });
          group.push(m);
        });
        map.fitBounds(L.featureGroup(group).getBounds().pad(0.35));
      };
      document.head.appendChild(js);
    })();
  }

  /* ----- cookie banner ----- */
  var KEY = 'proteos-consent';
  var banner = document.getElementById('cookie-banner');
  var badge = document.getElementById('cookie-badge');
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (err) { /* storage non disponibile */ }
  function showBanner(show) {
    if (!banner || !badge) return;
    banner.hidden = !show;
    badge.hidden = show;
  }
  showBanner(!stored);
  if (banner) {
    banner.querySelectorAll('[data-consent]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.dataset.consent;
        if (v === 'prefs') v = 'deny';
        try { localStorage.setItem(KEY, v); } catch (err) { /* ignora */ }
        showBanner(false);
      });
    });
  }
  if (badge) badge.addEventListener('click', function () { showBanner(true); });
  var manage = document.getElementById('cookie-manage');
  if (manage) manage.addEventListener('click', function () { showBanner(true); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); });
})();
