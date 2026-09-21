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

  /* ----- contact forms: validazione + captcha aritmetico + mailto ----- */
  var EMAIL = 'proteos@arubapec.it';
  document.querySelectorAll('.contact-form').forEach(function (form) {
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
      if (parseInt(captcha.value, 10) !== a + b) {
        captcha.classList.add('invalid');
        ok = false;
      }
      if (!ok) {
        status.className = 'form-status error';
        status.textContent = 'Compila tutti i campi obbligatori, accetta l\'informativa privacy e verifica il risultato della somma.';
        return;
      }
      var f = form.elements;
      var subject = (f.oggetto.value.trim() || 'Richiesta informazioni') + ' – ' + document.title.split(' - ')[0];
      var body = [
        'Nome e Cognome: ' + f.nome.value.trim(),
        'Telefono: ' + f.telefono.value.trim(),
        'Email: ' + f.email.value.trim(),
        '',
        f.messaggio.value.trim()
      ].join('\n');
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      status.className = 'form-status';
      status.textContent = 'Grazie! Si aprirà il tuo client di posta per inviare il messaggio.';
      form.reset();
    });
  });

  /* ----- mappa contatti (Leaflet self-hosted, tile OSM caricate solo dopo il clic) ----- */
  var mapBtn = document.getElementById('map-consent');
  if (mapBtn) {
    mapBtn.addEventListener('click', function () {
      var box = document.getElementById('map-box');
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
          m.bindPopup('<strong>' + s.title + '</strong><br>' + s.addr + '<br><a href="https://www.google.com/maps/dir/?api=1&destination=' + s.lat + ',' + s.lon + '" target="_blank" rel="noopener">Indicazioni stradali</a>');
          group.push(m);
        });
        map.fitBounds(L.featureGroup(group).getBounds().pad(0.35));
        group[0].openPopup();
      };
      document.head.appendChild(js);
    });
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
