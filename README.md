# proteosforma.it

Sito statico di **Proteos – Ente di Formazione Professionale**.
Nessun build step: le pagine HTML sono già nella radice del repo e si possono hostare su qualunque hosting statico.

## Struttura

```
index.html               Home
privacy-policy/          Privacy Policy
cookie-policy/           Cookie Policy
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
img/                     Logo (colore e bianco), favicon, icone; img/photos/ le foto (Unsplash, licenza libera)
fonts/                   Font self-hosted (Open Sans, Roboto, Playfair Display, Lato)
scripts/build.py         Generatore delle pagine (vedi sotto)
CNAME  robots.txt  sitemap.xml
```

## Modificare i contenuti

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
