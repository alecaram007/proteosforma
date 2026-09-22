/* Animazioni del sito: comparsa allo scroll, titoli a parole, contatori, tilt 3D, parallax,
   carosello trascinabile, barra di avanzamento e torna su.
   Il contenuto è nascosto solo se <html> ha la classe "fx" (messa nell'head, tolta se questo file non arriva)
   e con "riduci movimento" attivo non si anima nulla. Lavora anche sui contenuti caricati dal CMS: ProteosFX.scan(el). */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  function mq(q) { return !!(window.matchMedia && window.matchMedia(q).matches); }
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var fine = mq('(hover: hover) and (pointer: fine)');

  /* elementi animati in automatico: [selettori, tipo di comparsa, scaglionati tra fratelli] */
  var AUTO = [
    ['.intro > .container > p, .corsi-intro, .text-brand > p, .avviso-q p, .avviso-end > .container > p, .h-small-brand, .split-text p, .avviso-allegato, .hero-card, .home-corsi-more, .avviso-sub, .avviso-stato, .legal-page p, .legal-page h2, .legal-page ul, .legal-updated, .no-results, .blog-sheet > p', 'up', false],
    ['.card, .poster, .post, .stat, .footer-grid > *, .map-legend li, .form-info > *', 'up', true],
    ['.split-media', 'clip', false],
    ['.indennita-box, .form-box, .blog-sheet, .bando-detail', 'zoom', false],
    ['.hero-side', 'right', false]
  ];
  var SPLIT = '.intro h2, .split-text h2, .hero-title h1, .avviso-hero h1, .blog-title, .corsi-title, .h-red, .h-q, .section-title, .legal-page .page-title, .indennita-box h2, .page-title';

  var io = null;
  if (!reduce && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        // visibile, oppure già superato (ricarica a metà pagina): mostra
        if (e.isIntersecting || e.boundingClientRect.top < 0) {
          io.unobserve(e.target);
          var list = proxies.get(e.target);
          if (list) { list.forEach(function (c) { c.classList.add('is-in'); }); proxies.delete(e.target); return; }
          e.target.classList.add('is-in');
          if (e.target.hasAttribute('data-count')) runCount(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  }
  var proxies = new Map();
  function show(el) {
    if (!io) { el.classList.add('is-in'); return; }
    if (el.getAttribute('data-reveal') === 'clip' && el.parentElement) {
      // un elemento ritagliato al 100% non risulta mai "visibile": osserva il contenitore
      var p = el.parentElement, list = proxies.get(p);
      if (!list) { proxies.set(p, list = []); io.observe(p); }
      if (list.indexOf(el) < 0) list.push(el);
      return;
    }
    io.observe(el);
  }

  /* ---- titoli: ogni parola sale dalla sua "maschera" ---- */
  function split(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          if (!c.textContent.trim()) return;
          var frag = d.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(p)); return; }
            var w = d.createElement('span'), wi = d.createElement('span');
            w.className = 'w'; wi.className = 'wi';
            wi.style.setProperty('--wi', n++);
            wi.textContent = p;
            w.appendChild(wi); frag.appendChild(w);
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR') {
          walk(c);
        }
      });
    })(el);
    el.classList.add('split');
    show(el);
  }

  /* ---- contatori ---- */
  function runCount(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var suf = el.getAttribute('data-suffix') || '';
    if (isNaN(to)) return;
    if (reduce || !io) { el.textContent = to + suf; return; }
    var t0 = null, dur = 1700;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function count(el) {
    if (!el.hasAttribute('data-count')) return;
    if (reduce || !io) { runCount(el); return; }
    if (el.classList.contains('is-in')) { runCount(el); return; }
    el.textContent = '0' + (el.getAttribute('data-suffix') || '');
    io.observe(el);
  }

  /* ---- tilt 3D con riflesso che segue il mouse ---- */
  function tilt(el) {
    if (el.dataset.tiltOn) return;
    el.dataset.tiltOn = '1';
    var raf = 0;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        el.classList.add('tilting');
        el.style.setProperty('--rx', ((0.5 - y) * 6).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ((x - 0.5) * 8).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
    });
    el.addEventListener('pointerleave', function () {
      cancelAnimationFrame(raf);
      el.classList.remove('tilting');
      el.style.removeProperty('--rx');
      el.style.removeProperty('--ry');
    });
  }

  /* ---- pulsanti "magnetici" ---- */
  function magnetic(el) {
    if (el.dataset.magOn) return;
    el.dataset.magOn = '1';
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.translate = ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px';
    });
    el.addEventListener('pointerleave', function () { el.style.translate = ''; });
  }

  /* ---- carosello: trascinamento col mouse e frecce ---- */
  function rail(el) {
    if (el.dataset.railOn) return;
    el.dataset.railOn = '1';
    var down = false, moved = false, sx = 0, sl = 0;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = el.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 5) { moved = true; el.classList.add('dragging'); }
      if (moved) el.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      el.classList.remove('dragging');
    });
    el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    el.addEventListener('dragstart', function (e) { e.preventDefault(); });
    var sec = el.closest('section');
    if (sec) sec.querySelectorAll('[data-rail]').forEach(function (b) {
      b.addEventListener('click', function () {
        el.scrollBy({ left: parseInt(b.getAttribute('data-rail'), 10) * el.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---- parallax (misura il contenitore, sposta l'elemento con la proprietà translate) ---- */
  var par = [];

  function scan(scope) {
    scope = scope || d;
    AUTO.forEach(function (g) {
      scope.querySelectorAll(g[0]).forEach(function (el) {
        if (el.hasAttribute('data-reveal')) return;
        el.setAttribute('data-reveal', g[1]);
        if (g[2] && el.parentNode) {
          var sibs = Array.prototype.filter.call(el.parentNode.children, function (s) { return s.tagName === el.tagName; });
          el.style.setProperty('--i', sibs.indexOf(el) % 6);
        }
      });
    });
    scope.querySelectorAll('[data-stagger]').forEach(function (p) {
      Array.prototype.forEach.call(p.children, function (c, i) {
        c.style.setProperty('--i', i % 6);
        if (!c.hasAttribute('data-reveal')) c.setAttribute('data-reveal', p.getAttribute('data-stagger') || 'up');
      });
    });
    scope.querySelectorAll('[data-reveal]:not(.is-in)').forEach(show);
    scope.querySelectorAll('[data-split], ' + SPLIT).forEach(function (el) { if (!reduce) split(el); });
    scope.querySelectorAll('[data-count]').forEach(count);
    scope.querySelectorAll('[data-drag]').forEach(rail);
    if (fine && !reduce) {
      scope.querySelectorAll('[data-tilt], .poster').forEach(tilt);
      scope.querySelectorAll('[data-magnetic]').forEach(magnetic);
    }
    if (!reduce) scope.querySelectorAll('[data-parallax]').forEach(function (el) {
      if (par.indexOf(el) < 0) par.push(el);
    });
    tick();
  }

  /* ---- barra di avanzamento, torna su, header che si nasconde scendendo ---- */
  var bar = d.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<i></i>';
  var toTop = d.createElement('button');
  toTop.type = 'button';
  toTop.className = 'to-top';
  toTop.setAttribute('aria-label', 'Torna su');
  toTop.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="ring-bg" cx="24" cy="24" r="21"/><circle class="ring" cx="24" cy="24" r="21"/><path d="M24 31V17m-6 6 6-6 6 6"/></svg>';
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  d.body.appendChild(bar);
  d.body.appendChild(toTop);
  var header = d.querySelector('.site-header');
  var lastY = window.scrollY, ticking = false;

  function tick() {
    var y = window.scrollY, vh = window.innerHeight, max = root.scrollHeight - vh;
    var p = max > 0 ? Math.min(1, y / max) : 0;
    bar.style.setProperty('--p', p.toFixed(4));
    toTop.style.setProperty('--p', p.toFixed(4));
    toTop.classList.toggle('show', y > 600);
    if (header) {
      var busy = header.querySelector('.main-nav.open, li.has-sub.open, .search-bar:not([hidden])');
      if (y > 320 && y > lastY + 4 && !busy) header.classList.add('hide');
      else if (y < lastY - 4 || y <= 320) header.classList.remove('hide');
    }
    lastY = y;
    for (var i = 0; i < par.length; i++) {
      var el = par[i], box = (el.parentElement || el).getBoundingClientRect();
      if (box.bottom < -200 || box.top > vh + 200) continue;
      var f = parseFloat(el.getAttribute('data-parallax')) || 0.15;
      // spostamento limitato al margine disponibile (foto più alta o ingrandita del contenitore)
      var lim = box.height * (el.classList.contains('hero-media') ? 0.12 : 0.06);
      var off = Math.max(-lim, Math.min(lim, (box.top + box.height / 2 - vh / 2) * -f));
      el.style.setProperty('--py', off.toFixed(1) + 'px');
    }
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(tick); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  /* ---- hero: luce e logo seguono il mouse ---- */
  if (fine && !reduce) {
    d.querySelectorAll('.hero').forEach(function (h) {
      var raf = 0;
      h.addEventListener('pointermove', function (e) {
        var r = h.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          h.style.setProperty('--hx', (x * 100).toFixed(1) + '%');
          h.style.setProperty('--hy', (y * 100).toFixed(1) + '%');
          h.style.setProperty('--dx', ((x - 0.5) * 18).toFixed(1) + 'px');
          h.style.setProperty('--dy', ((y - 0.5) * 12).toFixed(1) + 'px');
        });
      });
    });
  }

  window.ProteosFX = { scan: scan, count: count };
  scan(d);
})();
