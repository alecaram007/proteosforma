#!/usr/bin/env python3
"""Genera le pagine statiche del sito Proteos (proteosforma.it) nella radice del repo."""
from pathlib import Path
import html

ROOT = Path(__file__).resolve().parent.parent
BASE = ""
SITE = "https://proteosforma.it"

BRAND = "Proteos"
TAGLINE = "Ente di Formazione Professionale"
PIVA = "00000000000"
SEDE_LEGALE = "Via Esempio, 1 Palermo PA"
SEDE_OPERATIVA = "Via Esempio, 1 Palermo PA"
TEL = "091 0000000"
EMAIL = "info@proteos.it"
INDIRIZZO = "Via Esempio, 1 90100 Palermo (PA)"

U = "https://images.unsplash.com/"
IMG = {
    "hero_home": U + "photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2000&q=70",
    "card1": U + "photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&h=541&q=70",
    "card2": U + "photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&h=541&q=70",
    "card3": U + "photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&h=541&q=70",
    "hero_chi": U + "photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=2000&q=70",
    "chi1": U + "photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=70",
    "chi2": U + "photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=70",
    "chi3": U + "photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=70",
    "hero_contatti": U + "photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=70",
}

NAV = [
    ("Home", "/"),
    ("Chi siamo", "/chi-siamo/"),
    ("Corsi", "/corsi/"),
    ("Corsi finanziati", "#", [
        ("Avviso 6/2025", "/avviso-6-2025/"),
        ("Avviso 7/2023", "/avviso-7-2023/"),
        ("Avviso 20/2024", "/avviso-20-2024/"),
    ]),
    ("Bandi e Avvisi", "/bandi-e-avvisi/"),
    ("News", "/news/"),
    ("Contatti", "/contatti/"),
]


def nav_html(current: str) -> str:
    out = []
    for item in NAV:
        label, href = item[0], item[1]
        subs = item[2] if len(item) > 2 else None
        active = ""
        if subs:
            if any(current == s[1] for s in subs):
                active = " current"
            out.append(
                f'<li class="has-sub{active}"><a href="#" aria-haspopup="true" aria-expanded="false">{label}</a>'
                '<ul class="sub-menu">'
                + "".join(f'<li><a href="{BASE}{s[1]}">{s[0]}</a></li>' for s in subs)
                + "</ul></li>"
            )
        else:
            if current == href:
                active = " current"
            out.append(f'<li class="{active.strip()}"><a href="{BASE}{href}">{label}</a></li>')
    return "\n          ".join(out)


def page(*, path: str, title: str, description: str, body: str, extra_head: str = "") -> str:
    full_title = f"{BRAND} | Formazione Professionale in Sicilia - Corsi, Certificazioni e Competenze Digitali" if path == "/" else f"{title} - {BRAND}"
    canonical = SITE + path
    return f"""<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{html.escape(full_title)}</title>
  <meta name="description" content="{html.escape(description)}" />
  <link rel="canonical" href="{canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="{BRAND}" />
  <meta property="og:title" content="{html.escape(full_title)}" />
  <meta property="og:description" content="{html.escape(description)}" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:image" content="{SITE}/img/logo.png" />
  <meta name="theme-color" content="#0a7dbe" />
  <link rel="icon" type="image/png" sizes="32x32" href="{BASE}/img/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="64x64" href="{BASE}/img/favicon-64.png" />
  <link rel="apple-touch-icon" href="{BASE}/img/apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700,800|Roboto:300,400,500,700,900|Playfair+Display:700|Lato:400,700,900&display=swap" />
  <link rel="stylesheet" href="{BASE}/style.css" />
  {extra_head}
</head>
<body>
  <header class="site-header" id="top">
    <div class="container header-inner">
      <a class="logo" href="{BASE}/" aria-label="{BRAND} – Home">
        <img src="{BASE}/img/logo.png" alt="{BRAND} – {TAGLINE}" width="1359" height="505" />
      </a>
      <nav class="main-nav" aria-label="Menu principale">
        <ul id="primary-menu">
          {nav_html(path)}
        </ul>
        <button class="search-toggle" type="button" aria-label="Cerca" aria-expanded="false">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M16 16l5.5 5.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
        </button>
        <button class="menu-toggle" type="button" aria-label="Apri menu" aria-expanded="false" aria-controls="primary-menu">
          <span></span><span></span><span></span>
        </button>
      </nav>
    </div>
    <form class="search-bar" action="{BASE}/news/" method="get" role="search" hidden>
      <div class="container">
        <input type="search" name="s" placeholder="Cerca …" aria-label="Cerca nel sito" />
        <button type="button" class="search-close" aria-label="Chiudi ricerca">&times;</button>
      </div>
    </form>
  </header>

  <main id="main">
{body}
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-col footer-brand">
        <img class="footer-logo" src="{BASE}/img/logo.png" alt="{BRAND}" width="1359" height="505" loading="lazy" />
        <h2><strong>{BRAND}</strong></h2>
        <p>{TAGLINE}</p>
        <p>P.IVA {PIVA}</p>
        <p>Sede Legale: {SEDE_LEGALE}</p>
        <p>Sede Operativa: {SEDE_OPERATIVA}</p>
      </div>
      <div class="footer-col footer-contact">
        <div class="contact-box">
          <h2>Contatti</h2>
          <h4>Telefono</h4>
          <p><a href="tel:{TEL.replace(' ', '')}">{TEL}</a></p>
          <h4>Email</h4>
          <p><a href="mailto:{EMAIL}">{EMAIL}</a></p>
          <h4>Indirizzo</h4>
          <p>{INDIRIZZO}</p>
        </div>
        <a class="btn btn-pill" href="{BASE}/contatti/">Contattaci</a>
      </div>
    </div>
  </footer>

  <div class="cookie-banner" id="cookie-banner" role="dialog" aria-label="Gestisci Consenso" hidden>
    <div class="cookie-inner">
      <div class="cookie-text">
        <img src="{BASE}/img/logo.png" alt="" width="120" height="45" />
        <p>Per fornire le migliori esperienze, utilizziamo tecnologie come i cookie per memorizzare e/o accedere alle informazioni del dispositivo. Il consenso a queste tecnologie ci permetterà di elaborare dati come il comportamento di navigazione o ID unici su questo sito. Non acconsentire o ritirare il consenso può influire negativamente su alcune caratteristiche e funzioni.</p>
        <p class="cookie-links"><a href="#">Cookie Policy</a> <a href="#">Privacy Policy</a></p>
      </div>
      <div class="cookie-actions">
        <p class="cookie-title">Gestisci Consenso</p>
        <div class="cookie-buttons">
          <button type="button" class="cookie-accept" data-consent="accept">Accetta</button>
          <button type="button" data-consent="deny">Nega</button>
          <button type="button" data-consent="prefs">Visualizza le preferenze</button>
        </div>
      </div>
    </div>
  </div>
  <button type="button" class="cookie-badge" id="cookie-badge" aria-label="Gestisci consenso cookie" hidden>
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10c0-.7-.1-1.3-.2-2a3 3 0 0 1-3.3-3.3A3 3 0 0 1 15.2 3a10 10 0 0 0-3.2-1zm-3 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg>
  </button>

  <script src="{BASE}/site.js" defer></script>
</body>
</html>
"""


# ---------- blocchi riutilizzabili ----------

def contact_form(cta: str = "Invia messaggio", a: int = 14, b: int = 14) -> str:
    return f"""
        <form class="contact-form" novalidate data-a="{a}" data-b="{b}">
          <div class="form-row">
            <label class="sr-only" for="f-name">Nome e Cognome</label>
            <input class="input" id="f-name" name="nome" type="text" placeholder="Nome e Cognome" required />
            <label class="sr-only" for="f-tel">Numero di telefono</label>
            <input class="input" id="f-tel" name="telefono" type="tel" placeholder="Numero di telefono" required />
          </div>
          <label class="sr-only" for="f-email">Indirizzo email</label>
          <input class="input" id="f-email" name="email" type="email" placeholder="Indirizzo email" required />
          <label class="sr-only" for="f-subject">Oggetto del messaggio</label>
          <input class="input" id="f-subject" name="oggetto" type="text" placeholder="Oggetto del messaggio" />
          <label class="sr-only" for="f-msg">Messaggio</label>
          <textarea class="input" id="f-msg" name="messaggio" rows="6" placeholder="Messaggio" required></textarea>
          <div class="form-bottom">
            <label class="captcha"><span>{a} + {b} = </span><input class="input captcha-input" name="captcha" type="text" inputmode="numeric" size="2" required /></label>
            <button class="btn btn-form" type="submit">{cta}</button>
          </div>
          <p class="form-status" role="status" aria-live="polite"></p>
        </form>"""


def avviso_page(*, slug, number, title_pre, subtitle, intro_hero, intro_body, cards, section_q, section_body, indennita, rilascio, capt):
    cards_html = "".join(
        f"""
            <div class="flyer">
              <div class="flyer-top"><img src="{BASE}/img/logo.png" alt="{BRAND}" width="1359" height="505" loading="lazy" /><span class="flyer-eu">Unione Europea · Regione Siciliana</span></div>
              <div class="flyer-body">
                <span class="flyer-free">Corso gratuito</span>
                <span class="flyer-avviso">Avviso<br><b>{number}</b></span>
                <h3>{c[0]}</h3>
                <span class="flyer-open">Iscrizioni<br>aperte</span>
              </div>
              <div class="flyer-foot"><span>Indennità {c[1]}</span><b>{c[2]}</b></div>
            </div>"""
        for c in cards
    )
    body = f"""
    <section class="avviso-hero">
      <div class="container">
        <h1>{title_pre} <strong>{number}</strong></h1>
        {"<p class='avviso-sub'>" + subtitle + "</p>" if subtitle else ""}
        <p>{intro_hero}</p>
      </div>
    </section>
    <section class="section section-white avviso-body">
      <div class="container narrow">
        <div class="text-brand">{intro_body}</div>
        {"<h2 class='h-red'>Visualizza la nostra Offerta Formativa</h2><div class='flyers'>" + cards_html + "</div>" if cards else ""}
      </div>
    </section>
    <section class="section section-light avviso-q">
      <div class="container narrow">
        <h3 class="h-q">{section_q}</h3>
        {section_body}
      </div>
    </section>
    <section class="section section-white avviso-end">
      <div class="container narrow">
        <div class="indennita-box">
          <h2>Indennità di frequenza</h2>
          <p>{indennita}</p>
        </div>
        <h2 class="h-small-brand">Rilascio del titolo</h2>
        <p>{rilascio}</p>
        <h2 class="h-red">Per iscriverti al modulo compila il form sottostante</h2>
        <p class="center">Verrai ricontattato dalla nostra segreteria</p>
        <div class="form-box">
{contact_form(a=capt[0], b=capt[1])}
        </div>
      </div>
    </section>
"""
    return page(path=f"/{slug}/", title=f"{title_pre} {number}", description=intro_hero[:155], body=body)


# ---------- pagine ----------

def build_home():
    cards = [
        ("Certificazioni", IMG["card1"],
         f"Le certificazioni di {BRAND} rappresentano un trampolino di lancio verso il tuo futuro professionale. Ogni corso è progettato per fornirti le competenze richieste dal mercato, con un focus particolare sulla pratica e sull’applicazione reale delle conoscenze. I nostri esperti ti guideranno attraverso un percorso formativo che non solo ti permetterà di ottenere una certificazione riconosciuta, ma ti aiuterà anche a costruire un profilo professionale competitivo. Unisciti a noi e trasforma le tue aspirazioni in realtà, con la certezza di avere alle spalle un’istituzione che crede nel tuo successo.",
         "/corsi/"),
        ("Corsi finanziati", IMG["card2"],
         "I corsi finanziati dalla Regione Sicilia rappresentano un’opportunità imperdibile per chi desidera ampliare le proprie competenze e migliorare il proprio profilo professionale. Grazie a un sostegno concreto, puoi accedere a programmi formativi di alta qualità senza gravare sul tuo budget. Ogni corso è pensato per rispondere alle esigenze del mercato del lavoro, fornendo conoscenze pratiche e teoriche che ti prepareranno ad affrontare le sfide del futuro. Unisciti a noi e scopri come il tuo talento può brillare attraverso un percorso formativo che valorizza le tue aspirazioni e ti guida verso nuove opportunità.",
         "/avviso-6-2025/"),
        ("Bandi e Avvisi", IMG["card3"],
         "Bandi e avvisi per docenti e studenti sono fondamentali per rimanere aggiornati sulle opportunità di crescita e sviluppo professionale. La nostra piattaforma offre un accesso facile e veloce a tutte le informazioni necessarie, consentendo a insegnanti e allievi di scoprire corsi, eventi e risorse che possono arricchire la loro esperienza educativa. Siamo impegnati a fornire un supporto costante, affinché ogni membro della nostra comunità possa cogliere al volo le occasioni che si presentano. Unisciti a noi per esplorare un mondo di possibilità e dare vita ai tuoi sogni accademici.",
         "/bandi-e-avvisi/"),
    ]
    cards_html = "".join(
        f"""
          <article class="card">
            <img src="{img}" alt="" width="800" height="541" loading="lazy" />
            <div class="card-body">
              <h4>{t}</h4>
              <p>{txt}</p>
            </div>
            <a class="btn btn-square" href="{BASE}{href}">Scopri di più</a>
          </article>"""
        for t, img, txt, href in cards
    )
    body = f"""
    <section class="hero hero-home" style="background-image:linear-gradient(180deg,rgba(0,0,0,.3) 0%,#0a7dbe 99%),url('{IMG["hero_home"]}')">
      <div class="hero-logo">
        <img src="{BASE}/img/logo-white.png" alt="{BRAND} – {TAGLINE}" width="1359" height="505" />
        <span class="hero-tagline">{TAGLINE}</span>
      </div>
    </section>

    <section class="section section-navy intro">
      <div class="container">
        <h2>Formazione Professionale</h2>
        <p>{BRAND} è il tuo punto di riferimento per una formazione di alta qualità in Sicilia. Offriamo corsi innovativi e pratici che preparano gli studenti per il mondo del lavoro. La nostra missione è fornire un’educazione che non solo informi, ma ispiri. Unisciti a noi per scoprire opportunità uniche che ti aiuteranno a realizzare i tuoi sogni professionali. Con un team di esperti e un ambiente stimolante, siamo qui per supportarti in ogni passo del tuo percorso formativo.</p>
      </div>
    </section>

    <section class="section section-light offerta">
      <div class="container">
        <h2 class="sr-only">Offerta Formativa</h2>
        <div class="cards">{cards_html}
        </div>
      </div>
    </section>
"""
    return page(path="/", title="Home",
                description=f"{BRAND} è il tuo punto di riferimento per una formazione di alta qualità in Sicilia: corsi, certificazioni e corsi finanziati dalla Regione Siciliana.",
                body=body)


def build_chi_siamo():
    body = f"""
    <section class="hero hero-page hero-chi" style="background-image:linear-gradient(180deg,rgba(0,0,0,.3) 0%,rgba(10,125,190,.85) 99%),url('{IMG["hero_chi"]}')">
      <div class="container hero-split">
        <div class="hero-title"><h1>Chi siamo</h1></div>
        <div class="hero-side"><img src="{BASE}/img/logo-white.png" alt="{BRAND}" width="1359" height="505" /></div>
      </div>
      <div class="container">
        <div class="hero-card">
          <p>In {BRAND} crediamo che la formazione sia la chiave per un futuro migliore. Offriamo corsi innovativi e personalizzati, pensati per rispondere alle esigenze del mercato del lavoro. La nostra missione è quella di fornire strumenti e conoscenze che permettano a ciascuno di realizzare il proprio potenziale. Siamo un punto di riferimento per chi desidera crescere professionalmente e personalmente, grazie a un approccio pratico e orientato ai risultati. Unisciti a noi e scopri come possiamo aiutarti a costruire il tuo percorso di successo.</p>
        </div>
      </div>
    </section>

    <section class="section section-white split">
      <div class="container split-inner">
        <div class="split-media"><img src="{IMG["chi1"]}" alt="" width="1200" height="800" loading="lazy" /></div>
        <div class="split-text">
          <h2>Giovane e Dinamica</h2>
          <p>In {BRAND}, ci impegniamo a creare un ambiente di apprendimento stimolante e inclusivo. I nostri corsi sono progettati per essere accessibili a tutti, indipendentemente dal livello di esperienza. Crediamo fermamente che ogni persona abbia il diritto di formarsi e di accedere a opportunità di crescita. Con il nostro approccio pratico e interattivo, i partecipanti possono acquisire competenze reali che possono applicare immediatamente nel mondo del lavoro. Siamo qui per accompagnarti in ogni fase del tuo percorso formativo, offrendo supporto e consulenza personalizzata. Scopri il tuo potenziale con noi e inizia a costruire il tuo futuro oggi stesso.</p>
        </div>
      </div>
    </section>

    <section class="section section-light split split-rev">
      <div class="container split-inner">
        <div class="split-text">
          <h2>La nostra visione</h2>
          <p>In {BRAND}, siamo appassionati di trasformare le aspirazioni in realtà. Ogni corso che offriamo è un viaggio verso l’eccellenza, progettato per ispirare e motivare. La nostra squadra di esperti è dedicata a fornire un’istruzione di alta qualità, arricchita da esperienze pratiche e casi studio reali. Siamo convinti che la formazione non sia solo un’opportunità, ma un diritto fondamentale per ogni individuo. Con una varietà di corsi che spaziano dalle competenze tecniche alle soft skills, abbiamo qualcosa per tutti. Unisciti a noi e inizia a scrivere la tua storia di successo con {BRAND}.</p>
        </div>
        <div class="split-media"><img src="{IMG["chi2"]}" alt="" width="1200" height="800" loading="lazy" /></div>
      </div>
    </section>

    <section class="section section-white split">
      <div class="container split-inner">
        <div class="split-media"><img src="{IMG["chi3"]}" alt="" width="1200" height="800" loading="lazy" /></div>
        <div class="split-text">
          <h2>Mission</h2>
          <p>In {BRAND}, crediamo che ogni giorno sia un’opportunità per imparare e crescere. I nostri corsi non sono solo un modo per acquisire competenze, ma un’esperienza trasformativa che ti prepara ad affrontare le sfide del mondo moderno. Siamo qui per supportarti nel tuo viaggio, offrendoti non solo conoscenze, ma anche la fiducia necessaria per affrontare il futuro. Con una rete di professionisti e formatori esperti, ogni lezione è un passo verso il tuo successo. Non aspettare oltre, il tuo futuro inizia con noi.</p>
        </div>
      </div>
    </section>
"""
    return page(path="/chi-siamo/", title="Chi siamo",
                description=f"In {BRAND} crediamo che la formazione sia la chiave per un futuro migliore: corsi innovativi e personalizzati per il mercato del lavoro.",
                body=body)


def build_corsi():
    body = f"""
    <section class="section section-white plain-page">
      <div class="container">
        <h1 class="page-title">Corsi</h1>
      </div>
    </section>
"""
    return page(path="/corsi/", title="Corsi", description=f"I corsi di {BRAND}.", body=body)


def build_news():
    body = f"""
    <section class="section section-white blog-page">
      <div class="container">
        <h1 class="blog-title">News</h1>
        <div class="blog-sheet">
          <h2 class="no-results">Nessun risultato</h2>
          <p>La pagina richiesta non è stata trovata. Affina la tua ricerca, o utilizza la barra di navigazione qui sopra per trovare il post.</p>
        </div>
      </div>
    </section>
"""
    return page(path="/news/", title="News", description=f"Le news di {BRAND}.", body=body)


def build_bandi():
    posts = [
        ("Bando pubblico di selezione personale non docente", "7 Apr 2026",
         "REGIONE SICILIANA Assessorato dell’Istruzione e della Formazione Professionale Dipartimento della…"),
        ("Bando pubblico di selezione docenti", "3 Apr 2026",
         "REGIONE SICILIANA Assessorato dell’Istruzione e della Formazione Professionale Dipartimento della…"),
        ("Bando pubblico di selezione allievi", "30 Mar 2026",
         "REGIONE SICILIANA Assessorato dell’Istruzione e della Formazione Professionale Dipartimento della…"),
        ("Bando pubblico di selezione allievi", "7 Feb 2026",
         "REGIONE SICILIANA Assessorato regionale della famiglia, delle politiche sociali e del lavoro…"),
        ("Bando pubblico di selezione personale non docente", "7 Feb 2026",
         "REGIONE SICILIANA Assessorato regionale della famiglia, delle politiche sociali e del lavoro…"),
        ("Bando pubblico di selezione personale docente", "7 Feb 2026",
         "REGIONE SICILIANA Assessorato regionale della famiglia, delle politiche sociali e del lavoro…"),
        ("Bando di selezione pubblica per l’individuazione di personale non docente", "2 Set 2025",
         "REGIONE SICILIANA Assessorato dell’Istruzione e della Formazione Professionale Dipartimento della…"),
        ("Bando di selezione pubblica per l’individuazione di personale docente", "2 Set 2025",
         "REGIONE SICILIANA Assessorato dell’Istruzione e della Formazione Professionale Dipartimento della…"),
        ("Bando di selezione pubblica per l’individuazione di personale non docente", "20 Ago 2025",
         "REGIONE SICILIANA Assessorato dell’Istruzione e della Formazione Professionale Dipartimento della…"),
        ("Bando di selezione pubblica per l’individuazione di personale docente", "20 Ago 2025",
         "REGIONE SICILIANA Assessorato dell’Istruzione e della Formazione Professionale Dipartimento della…"),
    ]
    items = "".join(
        f"""
          <article class="post">
            <h2><a href="{BASE}/contatti/">{t}</a></h2>
            <p class="post-meta">{d}</p>
            <p>{ex}</p>
            <a class="more" href="{BASE}/contatti/">leggi tutto</a>
          </article>"""
        for t, d, ex in posts
    )
    body = f"""
    <section class="section section-white blog-page">
      <div class="container">
        <h1 class="blog-title">Bandi e Avvisi</h1>
        <div class="blog-sheet">
          <div class="posts">{items}
          </div>
          <p class="pagination"><a href="#">« Post precedenti</a></p>
        </div>
      </div>
    </section>
"""
    return page(path="/bandi-e-avvisi/", title="Bandi e Avvisi",
                description=f"Bandi e avvisi per docenti, personale e allievi pubblicati da {BRAND}.", body=body)


def build_contatti():
    body = f"""
    <section class="hero hero-page hero-contatti" style="background-image:url('{IMG["hero_contatti"]}')">
      <div class="container hero-split">
        <div class="hero-title">
          <h1>Contatti</h1>
          <img class="hero-logo-small" src="{BASE}/img/logo-white.png" alt="{BRAND}" width="1359" height="505" />
        </div>
        <div class="hero-side">
          <div class="map-box" id="map-box">
            <button type="button" class="map-consent" id="map-consent">Fai clic per accettare i cookie marketing e abilitare questo contenuto</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-white contact-section">
      <div class="container narrow">
        <div class="form-box form-box-split">
          <div class="form-info">
            <h2>Contatti</h2>
            <h4>Telefono</h4>
            <p>{TEL}</p>
            <h4>Email</h4>
            <p><a href="mailto:{EMAIL}">{EMAIL}</a></p>
            <h4>Indirizzo</h4>
            <p>{INDIRIZZO}</p>
          </div>
          <div class="form-fields">
{contact_form(a=15, b=14)}
          </div>
        </div>
      </div>
    </section>
"""
    return page(path="/contatti/", title="Contatti",
                description=f"Contatta {BRAND}: telefono, email e indirizzo della sede. Compila il form e verrai ricontattato dalla nostra segreteria.",
                body=body)


def build_avvisi():
    a6 = avviso_page(
        slug="avviso-6-2025", number="6/2025", title_pre="Avviso", subtitle="",
        intro_hero="Avviso pubblico n. 6/2025 per l’attuazione del Programma Garanzia Occupabilità dei Lavoratori (GOL) da finanziare nell’ambito del Piano Nazionale di Ripresa e Resilienza (PNRR), Missione 5 “Inclusione e coesione”, Componente 1 “Politiche per i il Lavoro”, Riforma 1.1 “Politiche Attive del Lavoro e Formazione”, finanziato dall’Unione europea – Next Generation EU – Aggiornamento del Catalogo regionale dell’offerta formativa per la realizzazione di percorsi formativi mirati al rafforzamento dell’occupabilità in Sicilia attraverso il reinserimento lavorativo, l’aggiornamento e la riqualificazione dei lavoratori.",
        intro_body="<p>L’ Avviso si pone l’obiettivo di accompagnare le persone, comprese quelle che presentano particolari situazioni di svantaggio o fragilità, in un percorso volto al miglioramento delle proprie competenze e all’ingresso/reinserimento nel mercato del lavoro, garantendo la centralità della persona e la libertà di scelta e reca le indicazioni per una nuova edizione del Catalogo regionale dell’offerta formativa e per la realizzazione di percorsi mirati al rafforzamento dell’occupabilità in Sicilia in grado di coniugare i fabbisogni formativi dei destinatari con le esigenze di competenze espresse dalle imprese e dall’ economia regionale, anche attraverso il reinserimento lavorativo, l’aggiornamento e la riqualificazione dei lavoratori. L’elemento che accomunerà i diversi percorsi sarà la personalizzazione, che permetterà di delineare la soluzione più adatta in base alle esigenze dei singoli soggetti.</p>",
        cards=[("Addetto agli Stucchi e Decori", "oraria", "3,50 €"),
               ("Addetto Amministrativo segretariale", "oraria", "3,50 €"),
               ("Operatore Informatico di Risorse Web", "oraria", "3,50 €")],
        section_q="Quali sono i percorsi GOL di riferimento?",
        section_body="""
        <p><strong>Percorso 1 -“Reinserimento occupazionale”</strong>: percorso modulare per un totale di 40 ore formative, è rivolto a beneficiari Work ready, ossia più vicini al mercato del lavoro;<br>
        <strong>Percorso 2 -“Upskilling”</strong>: percorso modulare per un totale di 80 ore formative, è rivolto a beneficiari meno vicini al mercato del lavoro rispetto a quelli definiti Work ready indirizzati al Percorso 1, ma comunque con competenze che, con gli opportuni interventi di aggiornamento, sono spendibili nel mercato del lavoro;<br>
        <strong>Percorso 3 -“Reskilling”</strong>: percorso modulare per un totale di 250 ore formative, (di cui obbligatorie 40 ore formative per acquisizione di competenze tecnico professionali e relative 90 ore per attività di stage/tirocinio curriculare) è rivolto a beneficiari distanti dal mercato del lavoro e con competenze non adeguate ai fabbisogni richiesti dallo stesso.</p>""",
        indennita="Agli allievi validi (che abbiano frequentato almeno il 70% del monte ore corso – aula e stage), è riconosciuta un’indennità di frequenza pari a <b>€ 3,50/h</b>",
        rilascio="A conclusione del percorso il beneficiario conseguirà una attestazione delle competenze acquisite: Attestato di frequenza e profitto con messa in trasparenza degli apprendimenti.",
        capt=(14, 14),
    )
    a7 = avviso_page(
        slug="avviso-7-2023", number="7/2023", title_pre="Avviso", subtitle="Corsi gratuiti per disoccupati",
        intro_hero="Costituzione Catalogo Regionale dell’Offerta Formativa e correlata realizzazione di percorsi formativi di qualificazione mirati al rafforzamento dell’occupabilità in Sicilia.",
        intro_body="<p>L’Avviso si pone come obiettivo l’accrescimento dell’occupabilità della popolazione in età lavorativa attraverso l’aggiornamento di conoscenze, abilità e competenze nonché la riqualificazione delle competenze mediante il conseguimento di qualifiche professionali, in un’ottica di rafforzamento delle specificità dell’economia siciliana.</p>",
        cards=[("Operatore gestore impresa di pulizie", "giornaliera", "5,00 €"),
               ("Addetto agli stucchi e ai decori", "giornaliera", "5,00 €")],
        section_q="Destinatari",
        section_body="""
        <p>I percorsi formativi sono rivolti a persone disoccupati, inoccupati e inattivi. I destinatari devono possedere, inoltre, i seguenti requisiti:<br>
        – essere residenti o domiciliati in Sicilia;<br>
        – essere in età lavorativa;<br>
        – aver assolto il previsto obbligo di istruzione;<br>
        – avere il titolo di studio minimo richiesto per la tipologia di percorso formativo scelto.<br>
        In caso di cittadino non comunitario, è richiesto il possesso di regolare permesso di soggiorno in corso di validità.</p>""",
        indennita="Agli allievi in possesso dei requisiti richiesti dall’Avviso, che abbiano frequentato almeno il 70% delle ore di formazione previste con esclusione dei moduli formativi aggiuntivi, è riconosciuta un’indennità di frequenza giornaliera pari a <b>€ 5,00</b>",
        rilascio="Al termine di ciascun percorso formativo, previo superamento dell’esame finale, saranno rilasciati attestati di qualificazione, attestazione e certificazione delle competenze finali, ai partecipanti che abbiano frequentato le ore di frequenza minima complessivamente previste dal percorso.",
        capt=(2, 15),
    )
    a20 = avviso_page(
        slug="avviso-20-2024", number="20/2024", title_pre="Avviso", subtitle="Avviso per la realizzazione di percorsi per la formazione di assistenti familiari",
        intro_hero="L’Avviso intende contribuire alla politica di rafforzamento dell’offerta formativa su tutto il territorio regionale relativa ai servizi di sostegno alle persone non autosufficienti. In particolare, la figura di sostegno che si intende formare è quella dell’assistente familiare che si occuperà della cura e del benessere in generale di persone parzialmente o totalmente non autosufficienti.",
        intro_body="<p>Inoltre, in conformità a quanto disposto dalla L.R.21/03/2024, n.5, l’Avviso intende valorizzare la figura del “caregiver familiare” come definita dal comma 255 dell’art. 1 della Legge 27 Dicembre 2017 n. 205 e successive modificazioni, per favorirne il riconoscimento e l’integrazione nell’ambito del sistema regionale dei servizi sociali, socio-sanitari e sanitari. A tal fine, l’Avviso prevede il riconoscimento ai caregiver familiari di crediti formativi in accesso ai percorsi di assistente familiare, secondo le modalità contenute nel decreto assessoriale n. 705 del 24/06/2024 e nella pertinente scheda corso del Repertorio delle qualificazioni.</p>",
        cards=[("Assistente Familiare", "giornaliera", "5,00 €")],
        section_q="A chi si rivolge l’Avviso?",
        section_body="""
        <p>Sono destinatari delle attività formative dell’Avviso le persone:<br>
        – non occupate, pertanto disoccupati, inoccupati e inattivi.<br>
        Al momento della domanda per la partecipazione al percorso formativo, i destinatari devono possedere i seguenti requisiti:<br>
        – essere residenti o domiciliati in Sicilia;<br>
        – avere un’età compresa tra un minimo di 18 anni e un massimo di 64 anni compiuti;<br>
        – avere conseguito almeno il diploma di scuola secondaria di I grado (Licenza Media).<br>
        In caso di cittadini non comunitari, è richiesto il possesso di regolare permesso di soggiorno in corso di validità.</p>""",
        indennita="Agli allievi validi (che abbiano frequentato almeno il 70% del monte ore corso – aula e stage), è riconosciuta un’indennità giornaliera di frequenza pari a <b>€ 5,00</b>",
        rilascio="A seguito del superamento dell’esame finale, a cui saranno ammessi solo gli allievi che hanno frequentato almeno 70% delle ore complessivamente previste, sarà rilasciato un Attestato di qualifica Professionale EQF 2 in “Assistente Familiare” in coerenza con il Repertorio delle qualificazioni della Regione Siciliana adottato con decreto assessoriale n. 2570 del 26 maggio 2016.",
        capt=(7, 2),
    )
    return {"avviso-6-2025": a6, "avviso-7-2023": a7, "avviso-20-2024": a20}


def write(rel: str, content: str):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    print("wrote", p.relative_to(ROOT))


def main():
    write("index.html", build_home())
    write("chi-siamo/index.html", build_chi_siamo())
    write("corsi/index.html", build_corsi())
    write("news/index.html", build_news())
    write("bandi-e-avvisi/index.html", build_bandi())
    write("contatti/index.html", build_contatti())
    for slug, content in build_avvisi().items():
        write(f"{slug}/index.html", content)
    pages = ["/", "/chi-siamo/", "/corsi/", "/avviso-6-2025/", "/avviso-7-2023/", "/avviso-20-2024/", "/bandi-e-avvisi/", "/news/", "/contatti/"]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
        f"  <url><loc>{SITE}{p}</loc></url>\n" for p in pages) + "</urlset>\n"
    write("sitemap.xml", sm)


if __name__ == "__main__":
    main()
