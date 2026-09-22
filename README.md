# proteosformazione.it

Sito statico di **Proteos – Ente di Formazione Professionale**.
Nessun build step: le pagine HTML sono già nella radice del repo e si possono hostare su qualunque hosting statico.

## Struttura

```
index.html               Home
admin/                   Dashboard di pubblicazione (login)
avviso/                  Pagina avviso dinamica (/avviso/<slug>/)
config.js  cms.js        Configurazione Supabase e rendering dei contenuti dinamici (API REST con fetch, senza supabase-js)
fx.js                    Animazioni: comparsa allo scroll, titoli a parole, contatori, tilt, parallax, carosello
privacy-policy/          Privacy Policy
cookie-policy/           Cookie Policy
chi-siamo/               Chi siamo
corsi/                   Corsi (griglia locandine dal database)
bandi-e-avvisi/          Bandi e Avvisi (dal database)
news/                    News
contatti/                Contatti
404.html                 Pagina non trovata
style.css  site.js       Stile e comportamenti (menu, form, cookie banner, mappa)
img/                     Logo (colore e bianco), favicon, icone; img/photos/ le foto (Unsplash, licenza libera) con le versioni .webp
fonts/                   Font self-hosted (Open Sans, Roboto, Playfair Display, Lato)
vendor/                  Leaflet (mappa) e supabase-js (solo per la dashboard), self-hosted
vercel.json              Rewrite per le pagine dinamiche, redirect dai vecchi URL, header
scripts/build.py         Generatore delle pagine (vedi sotto)
CNAME  robots.txt  sitemap.xml
```

## Dashboard (avvisi, corsi, bandi)

Su **https://proteosformazione.it/admin/** si pubblicano in autonomia avvisi, corsi con locandina e bandi, senza toccare il codice.
Il login usa Supabase Auth (progetto Supabase dedicato `proteosforma`, tabelle con prefisso `web_`, bucket `web-media`); possono accedere solo le email presenti nella tabella `web_admins`.

- **Avvisi**: titolo, numero, testi, destinatari, indennità, PDF, stato e pubblicazione. Ogni avviso ha la pagina `/avviso/<slug>/`.
- **Corsi**: collegati a un avviso, con locandina caricata dalla dashboard, durata, indennità, sede e stato. Compaiono in `/corsi/` e dentro l'avviso.
- **Bandi**: titolo, data, estratto, testo completo e PDF. Compaiono in `/bandi-e-avvisi/`.
- **Stati** (badge sul sito): In programmazione · In fase di avvio · Corso avviato: in cerca di allievi · In svolgimento · In conclusione · Corso concluso. Si cambiano al volo dalla lista.
- L'interruttore verde pubblica o nasconde l'elemento; le bozze restano visibili solo in dashboard.

Per aggiungere un amministratore: creare l'utente in Supabase → Authentication e inserire la sua email in `web_admins`.
Le pagine `/avviso/<slug>/` e `/bandi-e-avvisi/<id>/` sono servite dai rewrite in `vercel.json` (in locale usare `/avviso/?s=<slug>`).

## Modificare i contenuti statici

Testi, dati aziendali e menu sono in `scripts/build.py`. Dopo una modifica rigenera le pagine:

```bash
python3 scripts/build.py
```

Va rilanciato anche dopo ogni modifica a `style.css`, `site.js`, `cms.js`, `config.js` o ai file di `admin/`: aggiorna il parametro `?v=` nei link, così i browser non usano la versione vecchia in cache.

I dati da personalizzare sono le costanti in cima al file: `PIVA`, `SEDE_LEGALE`, `SEDE_OPERATIVA`, `TEL`, `EMAIL`, `INDIRIZZO` (e `EMAIL` in `site.js` per il form).
Le foto sono in `img/photos/` (nomi in `PHOTOS` dentro `build.py`): per usare foto proprie basta sostituire i file `.jpg` mantenendo lo stesso nome e rilanciare `build.py`, che rigenera le versioni `.webp` usate dal sito (serve Pillow: `pip install pillow`; senza, il sito usa le `.jpg`).

## Hosting (Vercel)

Il sito è pubblicato su **Vercel** dal branch `main`: ogni push lo ridistribuisce in pochi secondi.
Indirizzi: https://proteosforma.vercel.app e il dominio **https://proteosformazione.it** (il `www` rimanda al dominio principale).
`vercel.json` gestisce i rewrite delle pagine dinamiche, i redirect dai vecchi indirizzi e gli header.

### DNS del dominio (Aruba)

| Tipo  | Nome | Valore |
|-------|------|--------|
| A     | @    | 216.198.79.1 |
| CNAME | www  | cname.vercel-dns.com |

Su `@` non deve esserci nessun record **AAAA**: quello del vecchio hosting Aruba impedisce la verifica di Vercel.
I record della posta (MX, `mail`, `webmail`, SPF) restano quelli di Aruba e non vanno toccati.
Il certificato HTTPS lo emette Vercel in automatico quando i record sono propagati.

Il repo è ancora collegato anche a GitHub Pages (file `CNAME` con il vecchio dominio proteosforma.it): non serve più e si può disattivare da *Settings → Pages*.

## Anteprima locale

```bash
python3 -m http.server 8080
```

poi apri http://localhost:8080
