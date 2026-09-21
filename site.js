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
      var a = parseInt(form.dataset.a, 10), b = parseInt(form.dataset.b, 10);
      var captcha = form.querySelector('.captcha-input');
      if (parseInt(captcha.value, 10) !== a + b) {
        captcha.classList.add('invalid');
        ok = false;
      }
      if (!ok) {
        status.className = 'form-status error';
        status.textContent = 'Compila tutti i campi obbligatori e verifica il risultato della somma.';
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

  /* ----- mappa contatti: caricata solo dopo consenso ----- */
  var mapBtn = document.getElementById('map-consent');
  if (mapBtn) {
    mapBtn.addEventListener('click', function () {
      var box = document.getElementById('map-box');
      var iframe = document.createElement('iframe');
      iframe.title = 'Mappa sede Proteos';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.src = 'https://www.openstreetmap.org/export/embed.html?bbox=13.640%2C37.300%2C13.690%2C37.335&marker=37.3175%2C13.6635&layer=mapnik';
      box.innerHTML = '';
      box.appendChild(iframe);
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
