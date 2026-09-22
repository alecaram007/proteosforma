/* Dashboard di pubblicazione: avvisi, corsi, bandi (Supabase Auth + RLS). */
(function () {
  'use strict';
  var cfg = window.PROTEOS_CONFIG;
  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);

  var STATI = [
    ['in_programmazione', 'In programmazione', 'st-plan'],
    ['in_fase_di_avvio', 'In fase di avvio', 'st-start'],
    ['in_cerca_di_allievi', 'Corso avviato: in cerca di allievi', 'st-open'],
    ['in_svolgimento', 'In svolgimento', 'st-run'],
    ['in_conclusione', 'In conclusione', 'st-closing'],
    ['concluso', 'Corso concluso', 'st-done']
  ];
  var STATO = {}; STATI.forEach(function (s) { STATO[s[0]] = { label: s[1], cls: s[2] }; });

  var TABLES = {
    avvisi: {
      table: 'web_avvisi', title: 'Avvisi', order: 'ordine', preview: function (r) { return '/avviso/' + r.slug + '/'; },
      hint: 'Gli avvisi regionali (POC, GOL, ecc.). Ogni avviso ha la sua pagina pubblica e raccoglie i corsi collegati.',
      fields: [
        { k: 'titolo', label: 'Titolo', type: 'text', req: true, ph: 'Avviso POC n. 1/2026', slugSource: true },
        { k: 'numero', label: 'Numero avviso', type: 'text', req: true, ph: '1/2026', half: true },
        { k: 'slug', label: 'Indirizzo pagina (slug)', type: 'slug', req: true, ph: 'avviso-1-2026-poc', half: true, help: 'La pagina sarà /avviso/<slug>/' },
        { k: 'stato', label: 'Stato', type: 'stato', half: true },
        { k: 'ordine', label: 'Ordine nel menu', type: 'number', half: true, def: 0 },
        { k: 'sottotitolo', label: 'Sottotitolo', type: 'text', ph: 'Corsi gratuiti per disoccupati e inoccupati' },
        { k: 'testo_intro', label: 'Testo introduttivo (nel riquadro blu)', type: 'textarea', rows: 4 },
        { k: 'testo_corpo', label: 'Descrizione dell’avviso', type: 'textarea', rows: 6, help: 'Lascia una riga vuota per separare i paragrafi.' },
        { k: 'destinatari_titolo', label: 'Titolo sezione destinatari', type: 'text', def: 'A chi si rivolge l’Avviso?' },
        { k: 'destinatari', label: 'Destinatari e requisiti', type: 'textarea', rows: 6 },
        { k: 'indennita', label: 'Indennità di frequenza', type: 'textarea', rows: 2, ph: '… è riconosciuta un’indennità di frequenza giornaliera pari a € 5,00' },
        { k: 'rilascio_titolo', label: 'Rilascio del titolo', type: 'textarea', rows: 3 },
        { k: 'allegato_url', label: 'Avviso completo (PDF)', type: 'file', accept: 'application/pdf', folder: 'avvisi' },
        { k: 'loghi', label: 'Loghi del finanziamento', type: 'textarea', rows: 5, help: 'Un’immagine per riga, nell’ordine in cui compaiono. Disponibili: /img/loghi/coesione-italia-21-27-sicilia.png · /img/loghi/cofinanziato-ue.png · /img/loghi/repubblica-italiana.png · /img/loghi/regione-siciliana.png · /img/loghi/poc-sicilia-14-20.png' },
        { k: 'pubblicato', label: 'Pubblicato sul sito', type: 'check' }
      ]
    },
    corsi: {
      table: 'web_corsi', title: 'Corsi', order: 'ordine', preview: function (r) { return r.avviso_slug ? '/avviso/' + r.avviso_slug + '/#corso-' + r.slug : '/corsi/'; },
      hint: 'I corsi con locandina. Compaiono nella pagina Corsi e dentro l’avviso a cui sono collegati.',
      fields: [
        { k: 'titolo', label: 'Titolo del corso', type: 'text', req: true, ph: 'Addetto Amministrativo Segretariale', slugSource: true },
        { k: 'avviso_id', label: 'Avviso di riferimento', type: 'avviso', req: true, half: true },
        { k: 'slug', label: 'Identificativo (slug)', type: 'slug', req: true, half: true },
        { k: 'stato', label: 'Stato', type: 'stato', half: true },
        { k: 'ordine', label: 'Ordine', type: 'number', half: true, def: 0 },
        { k: 'ore', label: 'Durata', type: 'text', ph: '600 ore + 54 ore obbligatorie', half: true },
        { k: 'indennita', label: 'Indennità', type: 'text', ph: 'Indennità giornaliera 5,00 €', half: true },
        { k: 'sede', label: 'Sede del corso', type: 'text', ph: 'Favara (AG)' },
        { k: 'descrizione', label: 'Descrizione breve', type: 'textarea', rows: 3 },
        { k: 'locandina_url', label: 'Locandina (immagine)', type: 'file', accept: 'image/*', folder: 'locandine', img: true },
        { k: 'pubblicato', label: 'Pubblicato sul sito', type: 'check' }
      ]
    },
    bandi: {
      table: 'web_bandi', title: 'Bandi', order: 'data', desc: true, preview: function (r) { return '/bandi-e-avvisi/' + r.id + '/'; },
      hint: 'Bandi di selezione per allievi, docenti e personale. Compaiono nella pagina Bandi e Avvisi, dal più recente.',
      fields: [
        { k: 'titolo', label: 'Titolo', type: 'text', req: true, ph: 'Bando pubblico di selezione allievi' },
        { k: 'data', label: 'Data', type: 'date', req: true, half: true, def: 'today' },
        { k: 'avviso_id', label: 'Avviso di riferimento', type: 'avviso', half: true },
        { k: 'estratto', label: 'Estratto (anteprima nell’elenco)', type: 'textarea', rows: 2 },
        { k: 'testo', label: 'Testo completo', type: 'textarea', rows: 8, help: 'Lascia una riga vuota per separare i paragrafi.' },
        { k: 'allegato_url', label: 'Bando (PDF)', type: 'file', accept: 'application/pdf', folder: 'bandi' },
        { k: 'pubblicato', label: 'Pubblicato sul sito', type: 'check' }
      ]
    }
  };

  var state = { tab: 'avvisi', rows: [], avvisi: [], editing: null, user: null };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function slugify(s) { return String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function toast(msg, err) { var t = $('#toast'); t.textContent = msg; t.className = 'toast' + (err ? ' err' : ''); t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(function () { t.hidden = true; }, 3200); }
  function fmtDate(d) { if (!d) return ''; var p = d.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function badge(st) { var s = STATO[st] || STATO.in_programmazione; return '<span class="stato ' + s.cls + '">' + s.label + '</span>'; }

  /* ---------- auth ---------- */
  function show(view) { $('#view-login').hidden = view !== 'login'; $('#view-app').hidden = view !== 'app'; }
  async function boot() {
    var s = await sb.auth.getSession();
    if (s.data.session) { await enter(s.data.session.user); } else { show('login'); }
  }
  async function enter(user) {
    var adm = await sb.from('web_admins').select('email').limit(1);
    if (adm.error || !adm.data || !adm.data.length) {
      await sb.auth.signOut(); show('login');
      $('#login-msg').textContent = 'Questo account non è abilitato alla dashboard.'; return;
    }
    state.user = user; $('#user-email').textContent = user.email; show('app');
    await loadAvvisi(); await loadTab();
  }
  $('#login-form').addEventListener('submit', async function (e) {
    e.preventDefault(); var f = e.target; $('#login-msg').textContent = '';
    var r = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
    if (r.error) { $('#login-msg').textContent = 'Credenziali non valide.'; return; }
    await enter(r.data.user);
  });
  $('#btn-logout').addEventListener('click', async function () { await sb.auth.signOut(); show('login'); });
  $('#btn-password').addEventListener('click', function () { $('#pw-form').reset(); $('#pw-msg').textContent = ''; $('#pw-modal').hidden = false; });
  $('#pw-form').addEventListener('submit', async function (e) {
    e.preventDefault(); var f = e.target;
    if (f.pw1.value.length < 8 || f.pw1.value !== f.pw2.value) { $('#pw-msg').textContent = 'Le password non coincidono o sono troppo corte.'; return; }
    var r = await sb.auth.updateUser({ password: f.pw1.value });
    if (r.error) { $('#pw-msg').textContent = r.error.message; return; }
    $('#pw-modal').hidden = true; toast('Password aggiornata');
  });

  /* ---------- tabs & list ---------- */
  $$('.tab').forEach(function (b) { b.addEventListener('click', function () { $$('.tab').forEach(function (x) { x.classList.toggle('active', x === b); }); state.tab = b.dataset.tab; loadTab(); }); });
  async function loadAvvisi() {
    var r = await sb.from('web_avvisi').select('id,titolo,slug,numero').order('ordine');
    state.avvisi = r.data || [];
  }
  async function loadTab() {
    var t = TABLES[state.tab];
    $('#panel-title').textContent = t.title; $('#panel-hint').textContent = t.hint;
    $('#btn-preview').href = state.tab === 'bandi' ? '/bandi-e-avvisi/' : '/corsi/';
    $('#legend').innerHTML = state.tab === 'bandi' ? '' : STATI.map(function (s) { return '<span class="stato ' + s[2] + '">' + s[1] + '</span>'; }).join('');
    $('#list').innerHTML = '<p class="muted">Caricamento…</p>';
    var q = sb.from(t.table).select('*').order(t.order, { ascending: !t.desc });
    var r = await q;
    if (r.error) { $('#list').innerHTML = '<p class="err">' + esc(r.error.message) + '</p>'; return; }
    state.rows = r.data || [];
    if (state.tab === 'corsi') state.rows.forEach(function (c) { var a = state.avvisi.find(function (x) { return x.id === c.avviso_id; }); c.avviso_slug = a ? a.slug : ''; c.avviso_titolo = a ? a.titolo : '—'; });
    renderList();
  }
  function renderList() {
    var t = TABLES[state.tab];
    if (!state.rows.length) { $('#list').innerHTML = '<p class="empty">Nessun elemento. Clicca “Nuovo” per aggiungerne uno.</p>'; return; }
    $('#list').innerHTML = state.rows.map(function (r) {
      var thumb = state.tab === 'corsi' ? (r.locandina_url ? '<img class="thumb" src="' + esc(r.locandina_url) + '" alt="" />' : '<div class="thumb thumb-empty">Nessuna locandina</div>') : '';
      var meta = state.tab === 'avvisi' ? 'N. ' + esc(r.numero) + ' · /avviso/' + esc(r.slug) + '/'
        : state.tab === 'corsi' ? esc(r.avviso_titolo) + (r.ore ? ' · ' + esc(r.ore) : '')
        : fmtDate(r.data) + (r.allegato_url ? ' · PDF allegato' : '');
      var stato = state.tab === 'bandi' ? '' :
        '<select class="stato-select ' + (STATO[r.stato] || {}).cls + '" data-id="' + r.id + '" aria-label="Stato">' + STATI.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === r.stato ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select>';
      return '<div class="row' + (r.pubblicato ? '' : ' draft') + '" data-id="' + r.id + '">' + thumb +
        '<div class="row-main"><div class="row-title">' + esc(r.titolo) + (r.pubblicato ? '' : ' <span class="tag">Bozza</span>') + '</div><div class="row-meta">' + meta + '</div></div>' +
        '<div class="row-actions">' + stato +
        '<label class="switch" title="Pubblicato"><input type="checkbox" class="pub-toggle" data-id="' + r.id + '"' + (r.pubblicato ? ' checked' : '') + ' /><span></span></label>' +
        '<a class="btn btn-ghost btn-sm" href="' + esc(t.preview(r)) + '" target="_blank" rel="noopener">Apri</a>' +
        '<button class="btn btn-ghost btn-sm btn-edit" data-id="' + r.id + '" type="button">Modifica</button></div></div>';
    }).join('');
  }
  $('#list').addEventListener('change', async function (e) {
    var t = TABLES[state.tab], id = e.target.dataset.id; if (!id) return;
    var patch = e.target.classList.contains('pub-toggle') ? { pubblicato: e.target.checked } : e.target.classList.contains('stato-select') ? { stato: e.target.value } : null;
    if (!patch) return;
    var r = await sb.from(t.table).update(patch).eq('id', id);
    if (r.error) { toast('Errore: ' + r.error.message, true); return; }
    var row = state.rows.find(function (x) { return x.id === id; }); Object.assign(row, patch); renderList();
    toast(patch.pubblicato === undefined ? 'Stato aggiornato' : (patch.pubblicato ? 'Pubblicato sul sito' : 'Nascosto dal sito'));
  });
  $('#list').addEventListener('click', function (e) { var b = e.target.closest('.btn-edit'); if (b) openEditor(state.rows.find(function (x) { return x.id === b.dataset.id; })); });
  $('#btn-new').addEventListener('click', function () { openEditor(null); });

  /* ---------- editor ---------- */
  function fieldHtml(f, v) {
    var id = 'f-' + f.k, req = f.req ? ' required' : '', help = f.help ? '<small>' + esc(f.help) + '</small>' : '';
    var wrap = function (inner) { return '<div class="field' + (f.half ? ' half' : '') + '">' + inner + help + '</div>'; };
    if (f.type === 'textarea') return wrap('<label for="' + id + '">' + f.label + '</label><textarea id="' + id + '" name="' + f.k + '" rows="' + (f.rows || 4) + '" placeholder="' + esc(f.ph || '') + '"' + req + '>' + esc(v) + '</textarea>');
    if (f.type === 'stato') return wrap('<label for="' + id + '">' + f.label + '</label><select id="' + id + '" name="' + f.k + '">' + STATI.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === (v || 'in_programmazione') ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select>');
    if (f.type === 'avviso') return wrap('<label for="' + id + '">' + f.label + '</label><select id="' + id + '" name="' + f.k + '"' + req + '><option value="">— scegli —</option>' + state.avvisi.map(function (a) { return '<option value="' + a.id + '"' + (a.id === v ? ' selected' : '') + '>' + esc(a.titolo) + '</option>'; }).join('') + '</select>');
    if (f.type === 'check') return '<div class="field"><label class="check"><input type="checkbox" name="' + f.k + '"' + (v ? ' checked' : '') + ' /> ' + f.label + '</label></div>';
    if (f.type === 'file') return wrap('<label for="' + id + '">' + f.label + '</label><div class="file-field">' + (v ? (f.img ? '<img class="file-preview" src="' + esc(v) + '" alt="" />' : '<a class="file-link" href="' + esc(v) + '" target="_blank" rel="noopener">File attuale</a>') : '<span class="muted">Nessun file</span>') +
      '<input type="hidden" name="' + f.k + '" value="' + esc(v) + '" /><input type="file" id="' + id + '" data-key="' + f.k + '" data-folder="' + f.folder + '" accept="' + f.accept + '" />' + (v ? '<button type="button" class="btn btn-ghost btn-sm file-clear" data-key="' + f.k + '">Rimuovi</button>' : '') + '</div>');
    var val = v == null ? '' : v; if (f.type === 'date' && f.def === 'today' && !v) val = new Date().toISOString().slice(0, 10);
    return wrap('<label for="' + id + '">' + f.label + '</label><input id="' + id + '" type="' + (f.type === 'slug' ? 'text' : f.type) + '" name="' + f.k + '" value="' + esc(val) + '" placeholder="' + esc(f.ph || '') + '"' + req + (f.slugSource ? ' data-slug-source' : '') + (f.type === 'slug' ? ' data-slug' : '') + ' />');
  }
  function openEditor(row) {
    var t = TABLES[state.tab]; state.editing = row;
    $('#editor-title').textContent = (row ? 'Modifica' : 'Nuovo') + ' – ' + t.title.replace(/i$/, 'o').replace(/^Avviso/, 'avviso').replace(/^Corso/, 'corso').replace(/^Bando/, 'bando');
    $('#editor-fields').innerHTML = t.fields.map(function (f) { return fieldHtml(f, row ? row[f.k] : (f.def !== undefined && f.def !== 'today' ? f.def : (f.type === 'check' ? false : ''))); }).join('');
    $('#btn-delete').hidden = !row; $('#editor-msg').textContent = ''; $('#drawer').hidden = false;
    var src = $('[data-slug-source]', $('#editor')), slug = $('[data-slug]', $('#editor'));
    if (src && slug) src.addEventListener('input', function () { if (!row) slug.value = slugify(src.value); });
    if (slug) slug.addEventListener('blur', function () { slug.value = slugify(slug.value); });
    $$('.file-clear', $('#editor')).forEach(function (b) { b.addEventListener('click', function () { $('input[name="' + b.dataset.key + '"]', $('#editor')).value = ''; b.parentElement.querySelector('.file-preview, .file-link, .muted') && (b.parentElement.querySelector('.file-preview, .file-link, .muted').outerHTML = '<span class="muted">Nessun file</span>'); b.remove(); }); });
    $('#editor-fields').scrollTop = 0;
  }
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', function () { $('#drawer').hidden = true; $('#pw-modal').hidden = true; }); });
  async function uploadFile(input) {
    var file = input.files[0]; if (!file) return null;
    var ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    var name = input.dataset.folder + '/' + Date.now() + '-' + slugify(file.name.replace(/\.[^.]+$/, '')) + '.' + ext;
    var r = await sb.storage.from(cfg.bucket).upload(name, file, { upsert: false, contentType: file.type });
    if (r.error) throw new Error('Upload fallito: ' + r.error.message);
    return sb.storage.from(cfg.bucket).getPublicUrl(name).data.publicUrl;
  }
  $('#editor').addEventListener('submit', async function (e) {
    e.preventDefault(); var t = TABLES[state.tab], f = e.target, msg = $('#editor-msg'); msg.textContent = '';
    if (!f.checkValidity()) { f.reportValidity(); return; }
    $('#btn-save').disabled = true; $('#btn-save').textContent = 'Salvataggio…';
    try {
      for (var i = 0; i < f.querySelectorAll('input[type=file]').length; i++) {
        var inp = f.querySelectorAll('input[type=file]')[i];
        if (inp.files[0]) { var url = await uploadFile(inp); f.querySelector('input[name="' + inp.dataset.key + '"]').value = url; }
      }
      var rec = {};
      t.fields.forEach(function (fd) {
        var el = f.elements[fd.k]; if (!el) return;
        if (fd.type === 'check') rec[fd.k] = el.checked;
        else if (fd.type === 'number') rec[fd.k] = parseInt(el.value, 10) || 0;
        else rec[fd.k] = el.value.trim() === '' ? null : el.value.trim();
      });
      if (rec.slug) rec.slug = slugify(rec.slug);
      var r = state.editing ? await sb.from(t.table).update(rec).eq('id', state.editing.id) : await sb.from(t.table).insert(rec);
      if (r.error) throw new Error(r.error.code === '23505' ? 'Esiste già un elemento con questo slug.' : r.error.message);
      $('#drawer').hidden = true; toast(state.editing ? 'Modifiche salvate' : 'Creato');
      if (state.tab === 'avvisi') await loadAvvisi();
      await loadTab();
    } catch (err) { msg.textContent = err.message; }
    $('#btn-save').disabled = false; $('#btn-save').textContent = 'Salva';
  });
  $('#btn-delete').addEventListener('click', async function () {
    var t = TABLES[state.tab]; if (!state.editing) return;
    if (!confirm('Eliminare definitivamente “' + state.editing.titolo + '”?' + (state.tab === 'avvisi' ? ' Verranno eliminati anche i corsi collegati.' : ''))) return;
    var r = await sb.from(t.table).delete().eq('id', state.editing.id);
    if (r.error) { $('#editor-msg').textContent = r.error.message; return; }
    $('#drawer').hidden = true; toast('Eliminato'); if (state.tab === 'avvisi') await loadAvvisi(); await loadTab();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { $('#drawer').hidden = true; $('#pw-modal').hidden = true; } });

  boot();
})();
