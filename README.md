# proteosforma.it

Sito statico di **Proteos – Ente di Formazione Professionale**.
Nessun build step: le pagine HTML sono già nella radice del repo e si possono hostare su qualunque hosting statico.

## Struttura

```
index.html               Home
admin/                   Dashboard di pubblicazione (login)
avviso/                  Pagina avviso dinamica (/avviso/<slug>/)
config.js  cms.js        Configurazione Supabase e rendering dei contenuti dinamici
privacy-policy/          Privacy Policy
cookie-policy/           Cookie Policy
chi-siamo/               Chi siamo
corsi/                   Corsi (griglia locandine dal database)
bandi-e-avvisi/          Bandi e Avvisi (dal database)
news/                    News
contatti/                Contatti
404.html                 Pagina non trovata
style.css  site.js       Stile e comportamenti (menu, form, cookie banner, mappa)
img/                     Logo (colore e bianco), favicon, icone; img/photos/ le foto (Unsplash, licenza libera)
fonts/                   Font self-hosted (Open Sans, Roboto, Playfair Display, Lato)
vendor/                  Leaflet (mappa) e supabase-js, self-hosted
vercel.json              Rewrite per le pagine dinamiche, redirect dai vecchi URL, header
scripts/build.py         Generatore delle pagine (vedi sotto)
CNAME  robots.txt  sitemap.xml
```

## Dashboard (avvisi, corsi, bandi)

Su **https://proteosforma.it/admin/** si pubblicano in autonomia avvisi, corsi con locandina e bandi, senza toccare il codice.
Il login usa Supabase Auth (progetto `Gestionale-Proteos`, tabelle con prefisso `web_`, bucket `web-media`); possono accedere solo le email presenti nella tabella `web_admins`.

- **Avvisi**: titolo, numero, testi, destinatari, indennità, PDF, stato e pubblicazione. Ogni avviso ha la pagina `/avviso/<slug>/`.
- **Corsi**: collegati a un avviso, con locandina caricata dalla dashboard, durata, indennità, sede e stato. Compaiono in `/corsi/` e dentro l'avviso.
- **Bandi**: titolo, data, estratto, testo completo e PDF. Compaiono in `/bandi-e-avvisi/`.
- **Stati** (badge sul sito): In programmazione · In fase di avvio · Corso avviato: in cerca di allievi · In svolgimento · Corso concluso. Si cambiano al volo dalla lista.
- L'interruttore verde pubblica o nasconde l'elemento; le bozze restano visibili solo in dashboard.

Per aggiungere un amministratore: creare l'utente in Supabase → Authentication e inserire la sua email in `web_admins`.
Le pagine `/avviso/<slug>/` e `/bandi-e-avvisi/<id>/` sono servite dai rewrite in `vercel.json` (in locale usare `/avviso/?s=<slug>`).

## Modificare i contenuti statici

Testi, dati aziendali e menu sono in `scripts/build.py`. Dopo una modifica rigenera le pagine:

```bash
python3 scripts/build.py
```

I dati da personalizzare sono le costanti in cima al file: `PIVA`, `SEDE_LEGALE`, `SEDE_OPERATIVA`, `TEL`, `EMAIL`, `INDIRIZZO` (e `EMAIL` in `site.js` per il form).
Le foto sono in `img/photos/` (nomi in `IMG` dentro `build.py`): per usare foto proprie basta sostituire i file mantenendo lo stesso nome.

## Hosting (GitHub Pages, già attivo)

Il sito è pubblicato con **GitHub Pages** dal branch `main` (cartella `/`), con dominio personalizzato `proteosforma.it` (file `CNAME`).
Ogni push su `main` ridistribuisce il sito in 1-2 minuti.

### DNS da impostare sul registrar del dominio

| Tipo  | Nome | Valore |
|-------|------|--------|
| A     | @    | 185.199.108.153 |
| A     | @    | 185.199.109.153 |
| A     | @    | 185.199.110.153 |
| A     | @    | 185.199.111.153 |
| AAAA  | @    | 2606:50c0:8000::153 |
| AAAA  | @    | 2606:50c0:8001::153 |
| AAAA  | @    | 2606:50c0:8002::153 |
| AAAA  | @    | 2606:50c0:8003::153 |
| CNAME | www  | alecaram007.github.io |

Quando i record sono propagati, in *Settings → Pages* del repo compare "DNS check successful": attiva **Enforce HTTPS** (il certificato viene emesso automaticamente da GitHub).

## Anteprima locale

```bash
python3 -m http.server 8080
```

poi apri http://localhost:8080
