/* Sitemap sempre aggiornata (Vercel Function): pagine fisse + tutti gli avvisi e i bandi pubblicati
   dalla dashboard, con la data dell'ultima modifica. Servita su /sitemap.xml. */
const fs = require('fs');
const path = require('path');

const SITE = 'https://proteosformazione.it';
const cfgSrc = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');
const SB = cfgSrc.match(/supabaseUrl:\s*'([^']+)'/)[1];
const KEY = cfgSrc.match(/supabaseKey:\s*'([^']+)'/)[1];
const STATIC = ['/', '/chi-siamo/', '/corsi/', '/bandi-e-avvisi/', '/contatti/', '/privacy-policy/', '/cookie-policy/'];

async function api(q) {
  const r = await fetch(`${SB}/rest/v1/${q}&apikey=${encodeURIComponent(KEY)}`);
  if (!r.ok) throw new Error('Supabase ' + r.status);
  return r.json();
}
const day = (ts) => (ts ? String(ts).slice(0, 10) : null);

module.exports = async (req, res) => {
  let avvisi = [], bandi = [];
  try {
    [avvisi, bandi] = await Promise.all([
      api('web_avvisi?select=slug,updated_at&pubblicato=eq.true&order=ordine'),
      api('web_bandi?select=id,updated_at&pubblicato=eq.true&order=data.desc')
    ]);
  } catch (e) { /* database non raggiungibile: almeno le pagine fisse */ }
  const latest = avvisi.concat(bandi).map((x) => day(x.updated_at)).filter(Boolean).sort().pop() || null;
  const urls = STATIC.map((p) => ({ loc: p, lastmod: ['/', '/corsi/', '/bandi-e-avvisi/'].includes(p) ? latest : null }))
    .concat(avvisi.map((a) => ({ loc: `/avviso/${encodeURIComponent(a.slug)}/`, lastmod: day(a.updated_at) })))
    .concat(bandi.map((b) => ({ loc: `/bandi-e-avvisi/${b.id}/`, lastmod: day(b.updated_at) })));
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${SITE}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>\n`).join('') +
    '</urlset>\n';
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.end(xml);
};
