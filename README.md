# proteosforma.it

Sito statico di **Proteos – Ente di Formazione Professionale**.
Nessun build step: le pagine HTML sono già nella radice del repo e si possono hostare su qualunque hosting statico.

## Struttura

```
index.html               Home
chi-siamo/               Chi siamo
corsi/                   Corsi
avviso-6-2025/           Corsi finanziati → Avviso 6/2025 (GOL)
avviso-7-2023/           Corsi finanziati → Avviso 7/2023
avviso-20-2024/          Corsi finanziati → Avviso 20/2024 (assistenti familiari)
bandi-e-avvisi/          Bandi e Avvisi
news/                    News
contatti/                Contatti
404.html                 Pagina non trovata
style.css  site.js       Stile e comportamenti (menu, form, cookie banner, mappa)
img/                     Logo (colore e bianco), favicon, icone
scripts/build.py         Generatore delle pagine (vedi sotto)
CNAME  robots.txt  sitemap.xml
```

## Modificare i contenuti

Testi, dati aziendali e menu sono in `scripts/build.py`. Dopo una modifica rigenera le pagine:

```bash
python3 scripts/build.py
```

I dati da personalizzare sono le costanti in cima al file: `PIVA`, `SEDE_LEGALE`, `SEDE_OPERATIVA`, `TEL`, `EMAIL`, `INDIRIZZO` (e `EMAIL` in `site.js` per il form).
Le foto sono caricate da Unsplash (`IMG` in `build.py`): sostituiscile con foto proprie mettendole in `img/`.

## Hosting

- **GitHub Pages**: Settings → Pages → branch `main`, cartella `/` (root). Il file `CNAME` imposta già il dominio `proteosforma.it`. Sul DNS del dominio: record `A` verso gli IP di GitHub Pages (185.199.108.153, .109.153, .110.153, .111.153) e `CNAME www` → `alecaram007.github.io`.
- **Netlify / Vercel / Cloudflare Pages**: importa il repo, nessun comando di build, directory di pubblicazione `/`.

## Anteprima locale

```bash
python3 -m http.server 8080
```

poi apri http://localhost:8080
