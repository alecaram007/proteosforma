/* Pagine avviso e bando preparate sul server (Vercel Function): Google e i social ricevono HTML completo,
   con titolo, descrizione, indirizzo canonico e dati strutturati della singola pagina.
   Il disegno è lo stesso del browser (render.js); i contenuti restano in cache 5 minuti. */
const fs = require('fs');
const path = require('path');
const R = require('../render.js');

const ROOT = path.join(__dirname, '..');
const cfgSrc = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
const SB = cfgSrc.match(/supabaseUrl:\s*'([^']+)'/)[1];
const KEY = cfgSrc.match(/supabaseKey:\s*'([^']+)'/)[1];
const TPL = {
  avviso: fs.readFileSync(path.join(ROOT, 'avviso', 'index.html'), 'utf8'),
  bando: fs.readFileSync(path.join(ROOT, 'bandi-e-avvisi', 'index.html'), 'utf8')
};
const SLOT = {
  avviso: [/<div data-cms="avviso">[\s\S]*?<\/section><\/div>/, (h) => `<div data-cms="avviso" data-ssr="1">${h}</div>`],
  bando: [/<div class="blog-sheet" data-cms="bandi">[\s\S]*?<\/div>/, (h) => `<div class="blog-sheet" data-cms="bandi" data-ssr="1">${h}</div>`]
};

async function api(q) {
  const r = await fetch(`${SB}/rest/v1/${q}&apikey=${encodeURIComponent(KEY)}`);
  if (!r.ok) throw new Error('Supabase ' + r.status);
  return r.json();
}

/* aggiorna titolo, descrizione, canonical, Open Graph e indicizzazione del modello */
function head(html, o) {
  const url = R.SITE + o.url;
  if (o.title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${R.esc(o.title)}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${R.esc(o.title)}$2`);
  }
  if (o.description) {
    html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${R.esc(o.description)}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${R.esc(o.description)}$2`);
  }
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/\s*<meta name="robots" content="[^"]*" \/>/, '');
  if (o.noindex) html = html.replace('</head>', '  <meta name="robots" content="noindex" />\n</head>');
  if (o.jsonld) html = html.replace('</head>', `  ${o.jsonld}\n</head>`);
  return html;
}

function send(res, status, html, cache) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', cache || 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
  res.end(html);
}

module.exports = async (req, res) => {
  const q = req.query || {};
  const type = q.type === 'bando' ? 'bando' : 'avviso';
  const key = String((type === 'avviso' ? q.slug : q.id) || '');
  const url = type === 'avviso' ? `/avviso/${key}/` : `/bandi-e-avvisi/${key}/`;
  const tpl = TPL[type];
  const [slot, fill] = SLOT[type];
  let d = null;
  try {
    if (key && (type === 'avviso' || R.UUID.test(key))) d = (await api(R.Q[type](key)))[0] || null;
  } catch (e) {
    // database non raggiungibile: pagina base con l'indirizzo giusto, i contenuti li carica il browser
    return send(res, 200, head(tpl, { url }), 'public, max-age=0, s-maxage=30');
  }
  if (!d || !d.pubblicato) {
    const nf = head(tpl, { title: (type === 'avviso' ? 'Avviso' : 'Bando') + ' non trovato - Proteos', url, noindex: true });
    return send(res, 404, nf.replace(slot, fill(R.NOT_FOUND[type])), 'public, max-age=0, s-maxage=60');
  }
  let out;
  if (type === 'avviso') {
    const form = (tpl.match(/<template id="cms-form-template">([\s\S]*?)<\/template>/) || [])[1] || '';
    out = R.avviso(d, form);
  } else {
    out = R.bandoDetail(d);
  }
  return send(res, 200, head(tpl, out).replace(slot, fill(out.html)));
};
