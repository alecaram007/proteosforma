#!/usr/bin/env python3
"""Genera le pagine statiche del sito Proteos (proteosformazione.it) nella radice del repo."""
from pathlib import Path
import hashlib
import html
import re

ROOT = Path(__file__).resolve().parent.parent
BASE = ""
SITE = "https://proteosformazione.it"
SUPABASE_URL = "https://jqlzuovigrxcbmazyysg.supabase.co"


def ver(rel: str) -> str:
    """Hash del contenuto: cambia a ogni modifica e obbliga i browser a riscaricare il file (JS/CSS in cache 7 giorni)."""
    return hashlib.md5((ROOT / rel).read_bytes()).hexdigest()[:8]


def asset(rel: str) -> str:
    return f"{BASE}/{rel}?v={ver(rel)}"

BRAND = "Proteos"
RAGIONE_SOCIALE = "Proteos S.r.l. Impresa Sociale"
TAGLINE = "Ente di Formazione Professionale"
FORMA = "S.r.l. Impresa Sociale"
PIVA = "03838230823"
REA = "AG-228657"
SEDE_LEGALE = "Cortile Dulcetta, 39 Favara AG"
SEDE_OPERATIVA = "Via Cesare Sessa, 58 Favara AG"
TEL = "0922 1830492"
EMAIL = "proteos1@libero.it"
PEC = "proteos@arubapec.it"
INDIRIZZO = "Via Cesare Sessa, 58 92026 Favara (AG)"
ACCREDITAMENTO = "Ente accreditato dalla Regione Siciliana – Codice CIR AD5015 – D.D.G. n. 699 del 29/05/2025"
AMBITI = "Orientamento e Formazione professionale (macrotipologie B, D)"
SEDI_OCCASIONALI = [
    "Viale Aldo Moro, 234/A – Favara (AG)",
    "Via Ercolano, 62 – Ragusa (RG)",
    "Via Padre Pino Puglisi, 19 – Alcamo (TP)",
]

try:
    from PIL import Image  # opzionale: serve solo a rigenerare le versioni WebP
except ImportError:
    Image = None


def webp(src: str, dst: str, width: int, quality: int = 78) -> str:
    """Versione WebP ridimensionata di un'immagine (rigenerata se l'originale è più recente).
    Senza Pillow, o se la conversione non è possibile, restituisce l'originale."""
    s, d = ROOT / src, ROOT / dst
    if Image is not None and (not d.exists() or d.stat().st_mtime < s.stat().st_mtime):
        im = Image.open(s)
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        im.save(d, "WEBP", quality=quality, method=6)
        print("webp", dst)
    return f"{BASE}/{dst}" if d.exists() else f"{BASE}/{src}"


PHOTOS = ["hero_home", "card1", "card2", "card3", "hero_chi", "chi1", "chi2", "chi3", "hero_contatti"]
IMG = {k: webp(f"img/photos/{k}.jpg", f"img/photos/{k}.webp", 1800) for k in PHOTOS}
IMG_SM = {k: webp(f"img/photos/{k}.jpg", f"img/photos/{k}-900.webp", 900) for k in ("hero_home", "hero_chi", "hero_contatti")}
LOGO = webp("img/logo.png", "img/logo-header.webp", 360, 90)
LOGO_WHITE = webp("img/logo-white.png", "img/logo-white.webp", 900, 90)
LOGO_WHITE_SM = webp("img/logo-white.png", "img/logo-white-sm.webp", 400, 90)


def hero_media(key: str, eager: bool = False) -> str:
    """Foto di sfondo dell'hero come <img> responsive (LCP), con zoom lento e parallax."""
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return (f'<div class="hero-media" data-parallax="0.18" aria-hidden="true">'
            f'<img src="{IMG[key]}" srcset="{IMG_SM[key]} 900w, {IMG[key]} 1800w" sizes="100vw" alt="" width="1800" height="1200" {load} decoding="async" /></div>')


WAVE = """<div class="hero-wave" aria-hidden="true">
        <svg viewBox="0 0 2880 100" preserveAspectRatio="none"><path d="M0 60C360 100 1080 20 1440 60S2520 20 2880 60V100H0Z"/></svg>
        <svg viewBox="0 0 2880 100" preserveAspectRatio="none"><path d="M0 60C360 100 1080 20 1440 60S2520 20 2880 60V100H0Z"/></svg>
      </div>"""



NAV = [
    ("Home", "/"),
    ("Chi siamo", "/chi-siamo/"),
    ("Corsi", "/corsi/"),
    ("Corsi finanziati", "#", [
        ("Avviso POC n. 1/2026", "/avviso/avviso-1-2026-poc/"),
        ("Avviso 23/2024", "/avviso/avviso-23-2024/"),
        ("Avviso 6/2025", "/avviso/avviso-6-2025/"),
        ("Avviso 7/2023", "/avviso/avviso-7-2023/"),
        ("Avviso 20/2024", "/avviso/avviso-20-2024/"),
    ]),
    ("Bandi e Avvisi", "/bandi-e-avvisi/"),
    ("News", "/news/"),
    ("Contatti", "/contatti/"),
]


SEDE_LEGALE_FULL = "Cortile Dulcetta, 39 – 92026 Favara (AG)"
YEAR = 2026


def tel_li() -> str:
    if not TEL:
        return ""
    return f'<li><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg><a href="tel:{TEL.replace(" ", "")}">{TEL}</a></li>'


def tel_html() -> str:
    if not TEL:
        return ""
    return f'<h4>Telefono</h4>\n          <p><a href="tel:{TEL.replace(" ", "")}">{TEL}</a></p>'


def nav_html(current: str) -> str:
    out = []
    for item in NAV:
        label, href = item[0], item[1]
        subs = item[2] if len(item) > 2 else None
        active = ""
        if subs:
            if current.startswith("/avviso/") or any(current == s[1] for s in subs):
                active = " current"
            out.append(
                f'<li class="has-sub{active}"><a href="#" aria-haspopup="true" aria-expanded="false">{label}</a>'
                '<ul class="sub-menu" data-cms="nav-avvisi">'
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
  <meta property="og:site_name" content="{RAGIONE_SOCIALE}" />
  <meta property="og:title" content="{html.escape(full_title)}" />
  <meta property="og:description" content="{html.escape(description)}" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:image" content="{SITE}/img/logo.png" />
  <meta name="theme-color" content="#0a7dbe" />
  <link rel="icon" type="image/png" sizes="32x32" href="{BASE}/img/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="64x64" href="{BASE}/img/favicon-64.png" />
  <link rel="apple-touch-icon" href="{BASE}/img/apple-touch-icon.png" />
  <link rel="preload" as="font" type="font/woff2" href="{BASE}/fonts/open-sans-400-latin.woff2" crossorigin />
  <link rel="preload" as="font" type="font/woff2" href="{BASE}/fonts/roboto-500-latin.woff2" crossorigin />
  <link rel="preconnect" href="{SUPABASE_URL}" crossorigin />
  <link rel="stylesheet" href="{BASE}/fonts/fonts.css" />
  <link rel="stylesheet" href="{asset('style.css')}" />
  {extra_head}
  <script>document.documentElement.classList.add('fx');setTimeout(function(){{if(!window.ProteosFX)document.documentElement.classList.remove('fx')}},2500)</script>
  <script type="application/ld+json">{{"@context":"https://schema.org","@type":"EducationalOrganization","name":"{RAGIONE_SOCIALE}","alternateName":"{BRAND}","url":"{SITE}/","logo":"{SITE}/img/logo.png","email":"{PEC}","vatID":"IT{PIVA}","taxID":"{PIVA}","address":{{"@type":"PostalAddress","streetAddress":"Via Cesare Sessa, 58","postalCode":"92026","addressLocality":"Favara","addressRegion":"AG","addressCountry":"IT"}},"areaServed":"Sicilia"}}</script>
</head>
<body>
  <header class="site-header" id="top">
    <div class="container header-inner">
      <a class="logo" href="{BASE}/" aria-label="{BRAND} – Home">
        <img src="{LOGO}" alt="{BRAND} – {TAGLINE}" width="360" height="134" />
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
    <div class="container footer-grid">
      <div class="footer-about">
        <img class="footer-logo" src="{LOGO_WHITE_SM}" alt="{BRAND}" width="400" height="148" loading="lazy" />
        <p>Ente di formazione professionale accreditato dalla Regione Siciliana. Corsi, certificazioni e percorsi finanziati a Favara, Ragusa e Alcamo.</p>
        <p class="footer-accr">Accreditamento CIR AD5015 · D.D.G. n. 699 del 29/05/2025<br>Orientamento e Formazione professionale (B, D)</p>
      </div>
      <nav class="footer-links" aria-label="Menu footer">
        <h4>Il sito</h4>
        <ul>
          <li><a href="{BASE}/">Home</a></li>
          <li><a href="{BASE}/chi-siamo/">Chi siamo</a></li>
          <li><a href="{BASE}/corsi/">Corsi</a></li>
          <li><a href="{BASE}/bandi-e-avvisi/">Bandi e Avvisi</a></li>
          <li><a href="{BASE}/news/">News</a></li>
          <li><a href="{BASE}/contatti/">Contatti</a></li>
        </ul>
      </nav>
      <nav class="footer-links" aria-label="Corsi finanziati">
        <h4>Corsi finanziati</h4>
        <ul data-cms="nav-avvisi">
          <li><a href="{BASE}/avviso/avviso-1-2026-poc/">Avviso POC n. 1/2026</a></li>
          <li><a href="{BASE}/avviso/avviso-23-2024/">Avviso 23/2024</a></li>
          <li><a href="{BASE}/avviso/avviso-6-2025/">Avviso 6/2025</a></li>
          <li><a href="{BASE}/avviso/avviso-7-2023/">Avviso 7/2023</a></li>
          <li><a href="{BASE}/avviso/avviso-20-2024/">Avviso 20/2024</a></li>
        </ul>
      </nav>
      <div class="footer-contact">
        <h4>Contatti</h4>
        <ul class="contact-list">
          <li><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg><span>{INDIRIZZO}<br><small>Sede legale: {SEDE_LEGALE_FULL}</small></span></li>
          <li><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z"/></svg><span><a href="mailto:{EMAIL}">{EMAIL}</a><br><small>PEC: <a href="mailto:{PEC}">{PEC}</a></small></span></li>
          {tel_li()}
        </ul>
        <a class="btn btn-square btn-footer" href="{BASE}/contatti/">Contattaci</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <p>© {YEAR} {RAGIONE_SOCIALE} · P.IVA / C.F. {PIVA} · REA {REA}</p>
        <p class="footer-legal"><a href="{BASE}/privacy-policy/">Privacy Policy</a><a href="{BASE}/cookie-policy/">Cookie Policy</a><button type="button" class="link-btn" id="cookie-manage">Gestisci cookie</button></p>
      </div>
    </div>
  </footer>

  <div class="cookie-banner" id="cookie-banner" role="dialog" aria-label="Gestisci consenso cookie" hidden>
    <div class="container cookie-inner">
      <p>Usiamo cookie tecnici e, previo consenso, cookie di terze parti (es. mappe) per migliorare la tua esperienza. <a href="{BASE}/cookie-policy/">Cookie Policy</a></p>
      <div class="cookie-buttons">
        <button type="button" data-consent="deny">Rifiuta</button>
        <button type="button" class="cookie-accept" data-consent="accept">Accetta</button>
      </div>
    </div>
  </div>
  <button type="button" class="cookie-badge" id="cookie-badge" aria-label="Gestisci consenso cookie" hidden>
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10c0-.7-.1-1.3-.2-2a3 3 0 0 1-3.3-3.3A3 3 0 0 1 15.2 3a10 10 0 0 0-3.2-1zm-3 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg>
  </button>

  <script src="{asset('site.js')}" defer></script>
  <script src="{asset('fx.js')}" defer></script>
  <script src="{asset('config.js')}" defer></script>
  <script src="{asset('cms.js')}" defer></script>
</body>
</html>
"""


# ---------- blocchi riutilizzabili ----------

def contact_form(cta: str = "Invia messaggio", a: int = 14, b: int = 14) -> str:
    return f"""
        <form class="contact-form" novalidate data-a="{a}" data-b="{b}">
          <div class="form-row">
            <label class="sr-only" for="f-name">Nome e Cognome</label>
            <input class="input" id="f-name" name="nome" type="text" placeholder="Nome e Cognome" maxlength="120" autocomplete="name" required />
            <label class="sr-only" for="f-tel">Numero di telefono</label>
            <input class="input" id="f-tel" name="telefono" type="tel" placeholder="Numero di telefono" maxlength="40" autocomplete="tel" required />
          </div>
          <label class="sr-only" for="f-email">Indirizzo email</label>
          <input class="input" id="f-email" name="email" type="email" placeholder="Indirizzo email" maxlength="200" autocomplete="email" required />
          <label class="sr-only" for="f-subject">Oggetto del messaggio</label>
          <input class="input" id="f-subject" name="oggetto" type="text" placeholder="Oggetto del messaggio" maxlength="200" />
          <label class="sr-only" for="f-msg">Messaggio</label>
          <textarea class="input" id="f-msg" name="messaggio" rows="6" placeholder="Messaggio" maxlength="4000" required></textarea>
          <div class="hp" aria-hidden="true"><label>Sito web <input name="sito" type="text" tabindex="-1" autocomplete="off" /></label></div>
          <p class="form-privacy"><label><input type="checkbox" name="privacy" required /> Ho letto l’<a href="{BASE}/privacy-policy/">informativa privacy</a> e acconsento al trattamento dei dati per essere ricontattato.</label></p>
          <div class="form-bottom">
            <label class="captcha"><span>{a} + {b} = </span><input class="input captcha-input" name="captcha" type="text" inputmode="numeric" size="2" required /></label>
            <button class="btn btn-form" type="submit">{cta}</button>
          </div>
          <p class="form-status" role="status" aria-live="polite"></p>
        </form>"""


def avviso_page(*, slug, number, title_pre, subtitle, intro_hero, intro_body, cards, section_q, section_body, indennita, rilascio, capt):
    if cards and len(cards[0]) == 4:
        cards_html = "".join(
            f"""
            <figure class="poster">
              <a href="{BASE}/img/avviso-1-2026/{c[1]}.jpg" target="_blank" rel="noopener"><img src="{BASE}/img/avviso-1-2026/{c[1]}.jpg" alt="Locandina corso {c[0]} – Avviso 1/2026 POC" width="800" height="1131" loading="lazy" /></a>
              <figcaption><strong>{c[0]}</strong><span>{c[2]}</span><span>Indennità {c[3]}</span></figcaption>
            </figure>"""
            for c in cards
        )
    else:
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
        {"<h2 class='h-red'>Visualizza la nostra Offerta Formativa</h2><div class='" + ("posters" if len(cards[0]) == 4 else "flyers") + "'>" + cards_html + "</div>" if cards else ""}
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
         "/corsi/"),
        ("Bandi e Avvisi", IMG["card3"],
         "Bandi e avvisi per docenti e studenti sono fondamentali per rimanere aggiornati sulle opportunità di crescita e sviluppo professionale. La nostra piattaforma offre un accesso facile e veloce a tutte le informazioni necessarie, consentendo a insegnanti e allievi di scoprire corsi, eventi e risorse che possono arricchire la loro esperienza educativa. Siamo impegnati a fornire un supporto costante, affinché ogni membro della nostra comunità possa cogliere al volo le occasioni che si presentano. Unisciti a noi per esplorare un mondo di possibilità e dare vita ai tuoi sogni accademici.",
         "/bandi-e-avvisi/"),
    ]
    cards_html = "".join(
        f"""
          <article class="card" data-tilt>
            <div class="card-media"><img src="{img}" alt="" width="800" height="541" loading="lazy" decoding="async" /></div>
            <div class="card-body">
              <span class="card-num" aria-hidden="true">0{i}</span>
              <h4>{t}</h4>
              <p>{txt}</p>
            </div>
            <a class="btn btn-square" href="{BASE}{href}">Scopri di più</a>
          </article>"""
        for i, (t, img, txt, href) in enumerate(cards, 1)
    )
    ribbon = "".join(f"<span>{w}</span>" for w in [
        "Corsi gratuiti", "Qualifiche professionali", "Tirocini in azienda", "Certificazioni",
        "Indennità di frequenza", "Favara · Ragusa · Alcamo", "Ente accreditato Regione Siciliana"])
    body = f"""
    <section class="hero hero-home">
      {hero_media("hero_home", eager=True)}
      <div class="hero-shade"></div>
      <div class="hero-logo">
        <img class="hero-logo-img" src="{LOGO_WHITE}" alt="{BRAND} – {TAGLINE}" width="900" height="334" fetchpriority="high" />
        <span class="hero-tagline">{TAGLINE}</span>
        <div class="hero-cta">
          <a class="btn btn-glow" href="{BASE}/corsi/" data-magnetic>Scopri i corsi <span class="arr" aria-hidden="true">→</span></a>
          <a class="btn btn-ghost" href="{BASE}/contatti/" data-magnetic>Contattaci</a>
        </div>
      </div>
      <a class="scroll-cue" href="#intro" aria-label="Scorri verso il basso"><span></span></a>
      {WAVE}
    </section>

    <section class="section section-navy intro" id="intro">
      <div class="container">
        <h2 data-split>Formazione Professionale</h2>
        <p>{BRAND} è il tuo punto di riferimento per una formazione di alta qualità in Sicilia. Offriamo corsi innovativi e pratici che preparano gli studenti per il mondo del lavoro. La nostra missione è fornire un’educazione che non solo informi, ma ispiri. Unisciti a noi per scoprire opportunità uniche che ti aiuteranno a realizzare i tuoi sogni professionali. Con un team di esperti e un ambiente stimolante, siamo qui per supportarti in ogni passo del tuo percorso formativo.</p>
        <div class="stats" data-stagger>
          <div class="stat"><b class="stat-num" data-cms-stat="avvisi">–</b><span>Avvisi regionali</span></div>
          <div class="stat"><b class="stat-num" data-cms-stat="corsi">–</b><span>Percorsi formativi</span></div>
          <div class="stat"><b class="stat-num" data-count="3">3</b><span>Città: Favara, Ragusa, Alcamo</span></div>
          <div class="stat"><b class="stat-num" data-count="100" data-suffix="%">100%</b><span>Gratuiti i corsi finanziati</span></div>
        </div>
      </div>
    </section>

    <div class="ribbon" aria-hidden="true"><div class="ribbon-track">{ribbon}{ribbon}</div></div>

    <section class="section section-light offerta">
      <div class="container">
        <h2 class="sr-only">Offerta Formativa</h2>
        <div class="cards" data-stagger>{cards_html}
        </div>
      </div>
    </section>

    <section class="section section-white home-corsi">
      <div class="container section-head">
        <div>
          <span class="eyebrow">Offerta formativa</span>
          <h2 class="section-title" data-split>Corsi in evidenza</h2>
        </div>
        <div class="rail-nav">
          <button type="button" class="rail-btn" data-rail="-1" aria-label="Corsi precedenti">←</button>
          <button type="button" class="rail-btn" data-rail="1" aria-label="Corsi successivi">→</button>
        </div>
      </div>
      <div class="rail" data-cms="home-corsi" data-drag tabindex="0" aria-label="Corsi in evidenza"><p class="cms-loading">Caricamento corsi…</p></div>
      <div class="container center home-corsi-more"><a class="btn btn-square" href="{BASE}/corsi/">Tutti i corsi</a></div>
    </section>
"""
    return page(path="/", title="Home", extra_head=f'<link rel="preload" as="image" href="{IMG_SM["hero_home"]}" imagesrcset="{IMG_SM["hero_home"]} 900w, {IMG["hero_home"]} 1800w" imagesizes="100vw" fetchpriority="high" />',
                description=f"{BRAND} è il tuo punto di riferimento per una formazione di alta qualità in Sicilia: corsi, certificazioni e corsi finanziati dalla Regione Siciliana.",
                body=body)


def build_chi_siamo():
    body = f"""
    <section class="hero hero-page hero-chi">
      {hero_media("hero_chi", eager=True)}
      <div class="hero-shade"></div>
      <div class="container hero-split">
        <div class="hero-title"><h1 data-split>Chi siamo</h1></div>
        <div class="hero-side"><img src="{LOGO_WHITE_SM}" alt="{BRAND}" width="400" height="148" /></div>
      </div>
      <div class="container">
        <div class="hero-card">
          <p>In {BRAND} crediamo che la formazione sia la chiave per un futuro migliore. Offriamo corsi innovativi e personalizzati, pensati per rispondere alle esigenze del mercato del lavoro. La nostra missione è quella di fornire strumenti e conoscenze che permettano a ciascuno di realizzare il proprio potenziale. Siamo un punto di riferimento per chi desidera crescere professionalmente e personalmente, grazie a un approccio pratico e orientato ai risultati. Unisciti a noi e scopri come possiamo aiutarti a costruire il tuo percorso di successo.</p>
          <p class="accr">{RAGIONE_SOCIALE} è un {ACCREDITAMENTO.lower()[0].lower() + ACCREDITAMENTO[1:]} per gli ambiti {AMBITI}.</p>
        </div>
      </div>
    </section>

    <section class="section section-white split">
      <div class="container split-inner">
        <div class="split-media"><img src="{IMG["chi1"]}" alt="" width="1200" height="800" decoding="async" data-parallax="0.07" /></div>
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
        <div class="split-media"><img src="{IMG["chi2"]}" alt="" width="1200" height="800" decoding="async" data-parallax="0.07" /></div>
      </div>
    </section>

    <section class="section section-white split">
      <div class="container split-inner">
        <div class="split-media"><img src="{IMG["chi3"]}" alt="" width="1200" height="800" decoding="async" data-parallax="0.07" /></div>
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
    <section class="section section-white corsi-page">
      <div class="container">
        <h1 class="page-title corsi-title">Corsi</h1>
        <p class="corsi-intro">Tutti i corsi attivi e in programmazione di {BRAND}. Clicca una locandina per aprire l’avviso di riferimento con requisiti, indennità e modulo di iscrizione.</p>
        <div data-cms="corsi"></div>
      </div>
    </section>
"""
    return page(path="/corsi/", title="Corsi", description=f"I corsi di formazione professionale gratuiti di {BRAND}: locandine, stato di avvio e avvisi di riferimento.", body=body)


def build_avviso_template():
    body = f"""
    <div data-cms="avviso"><section class="section section-white"><div class="container"><p class="cms-loading">Caricamento avviso…</p></div></section></div>
    <template id="cms-form-template">{contact_form(a=9, b=4)}</template>
"""
    return page(path="/avviso/", title="Avviso", description=f"Avvisi e corsi finanziati di {BRAND}.", body=body)


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
    body = f"""
    <section class="section section-white blog-page">
      <div class="container">
        <h1 class="blog-title">Bandi e Avvisi</h1>
        <div class="blog-sheet" data-cms="bandi"><p class="cms-loading">Caricamento…</p></div>
      </div>
    </section>
"""
    return page(path="/bandi-e-avvisi/", title="Bandi e Avvisi",
                description=f"Bandi e avvisi di selezione per allievi, docenti e personale pubblicati da {BRAND}.", body=body)


def build_contatti():
    body = f"""
    <section class="hero hero-page hero-contatti">
      {hero_media("hero_contatti", eager=True)}
      <div class="container hero-split">
        <div class="hero-title">
          <h1 data-split>Contatti</h1>
          <img class="hero-logo-small" src="{LOGO_WHITE_SM}" alt="{BRAND}" width="400" height="148" />
        </div>
        <div class="hero-side">
          <div class="map-box" id="map-box" data-sedi='[{{"lat":37.3191283,"lon":13.6662229,"title":"Sede direzionale e di erogazione","addr":"Via Cesare Sessa, 58 – 92026 Favara (AG)"}},{{"lat":37.3172090,"lon":13.6588283,"title":"Sede legale","addr":"Cortile Dulcetta, 39 – 92026 Favara (AG)"}}]'></div>
          <ul class="map-legend">
            <li><span class="pin pin-a">A</span><div><strong>Sede direzionale e di erogazione</strong><br>Via Cesare Sessa, 58 – 92026 Favara (AG)</div></li>
            <li><span class="pin pin-b">B</span><div><strong>Sede legale</strong><br>Cortile Dulcetta, 39 – 92026 Favara (AG)</div></li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section section-white contact-section">
      <div class="container narrow">
        <div class="form-box form-box-split">
          <div class="form-info">
            <h2>Contatti</h2>
            {tel_html()}
            <h4>Email</h4>
            <p><a href="mailto:{EMAIL}">{EMAIL}</a></p>
            <h4>PEC</h4>
            <p><a href="mailto:{PEC}">{PEC}</a></p>
            <h4>Sede direzionale e di erogazione</h4>
            <p>{INDIRIZZO}</p>
            <h4>Sede legale</h4>
            <p>{SEDE_LEGALE.replace(" Favara AG", " – 92026 Favara (AG)")}</p>
            <h4>Sedi di erogazione occasionali</h4>
            <p>{"<br>".join(SEDI_OCCASIONALI)}</p>
            <h4>Accreditamento</h4>
            <p>{ACCREDITAMENTO}<br>{AMBITI}</p>
          </div>
          <div class="form-fields">
{contact_form(a=15, b=14)}
          </div>
        </div>
      </div>
    </section>
"""
    return page(path="/contatti/", title="Contatti",
                description=f"Contatta {RAGIONE_SOCIALE}: PEC, sedi di Favara, Ragusa e Alcamo e accreditamento regionale. Compila il form e verrai ricontattato dalla nostra segreteria.",
                body=body)


def legal_page(slug, title, body_html):
    body = f"""
    <section class="section section-white legal-page">
      <div class="container narrow">
        <h1 class="page-title">{title}</h1>
        <p class="legal-updated">Ultimo aggiornamento: settembre {YEAR}</p>
        {body_html}
      </div>
    </section>
"""
    return page(path=f"/{slug}/", title=title, description=f"{title} di {RAGIONE_SOCIALE} – proteosformazione.it", body=body)


def build_legal():
    titolare = f"<p><strong>Titolare del trattamento:</strong> {RAGIONE_SOCIALE}, sede legale in {SEDE_LEGALE_FULL}, P.IVA / C.F. {PIVA}, PEC <a href=\"mailto:{PEC}\">{PEC}</a>.</p>"
    privacy = f"""
        {titolare}
        <h2>1. Tipologia di dati trattati</h2>
        <p><strong>Dati di navigazione.</strong> I sistemi informatici e le procedure software preposte al funzionamento di questo sito acquisiscono, nel corso del loro normale esercizio, alcuni dati la cui trasmissione è implicita nell’uso dei protocolli di comunicazione di Internet (indirizzi IP, orario della richiesta, URL richiesto, dimensione della risposta, browser e sistema operativo). Tali dati sono trattati dal fornitore di hosting esclusivamente per finalità tecniche e di sicurezza e vengono conservati per il tempo strettamente necessario.</p>
        <p><strong>Dati forniti volontariamente.</strong> Compilando i moduli di contatto o di iscrizione presenti sul sito (nome e cognome, telefono, email, oggetto e messaggio) l’utente fornisce dati personali (ed eventualmente il corso di interesse) che vengono registrati nell’area riservata del sito, consultabile solo dal personale autorizzato del Titolare. Per prevenire invii automatici e abusi viene conservata anche un’impronta cifrata (non reversibile) dell’indirizzo IP di provenienza. L’invio è facoltativo; senza i dati obbligatori non è possibile ricontattare l’utente.</p>
        <h2>2. Finalità e base giuridica</h2>
        <ul>
          <li>Riscontro alle richieste di informazioni e di iscrizione ai percorsi formativi (art. 6, par. 1, lett. b GDPR – misure precontrattuali su richiesta dell’interessato).</li>
          <li>Adempimento di obblighi di legge, anche connessi all’accreditamento regionale e ai corsi finanziati (art. 6, par. 1, lett. c GDPR).</li>
          <li>Sicurezza e corretto funzionamento del sito (art. 6, par. 1, lett. f GDPR – legittimo interesse).</li>
        </ul>
        <h2>3. Modalità di trattamento e conservazione</h2>
        <p>I dati sono trattati con strumenti informatici e cartacei, con misure adeguate a garantirne sicurezza e riservatezza. I dati dei moduli di contatto sono conservati per il tempo necessario a riscontrare la richiesta e comunque non oltre 24 mesi dall’invio; in caso di iscrizione a un percorso formativo, per la durata prevista dalla normativa sui corsi finanziati e dagli obblighi fiscali e amministrativi.</p>
        <h2>4. Destinatari</h2>
        <p>I dati possono essere trattati da personale autorizzato del Titolare, dal fornitore di hosting del sito e dal fornitore del database in cui sono registrate le richieste (Supabase, server in Francoforte, UE), che agiscono come responsabili del trattamento, e, per i corsi finanziati, comunicati alla Regione Siciliana e agli enti preposti nei limiti degli obblighi di legge. I dati non sono diffusi né trasferiti al di fuori dell’Unione Europea, salvo i servizi indicati nella Cookie Policy.</p>
        <h2>5. Diritti dell’interessato</h2>
        <p>L’interessato può esercitare in qualsiasi momento i diritti previsti dagli artt. 15-22 GDPR (accesso, rettifica, cancellazione, limitazione, portabilità, opposizione) scrivendo a <a href="mailto:{PEC}">{PEC}</a>. Ha inoltre il diritto di proporre reclamo al Garante per la protezione dei dati personali (<a href="https://www.garanteprivacy.it" rel="noopener" target="_blank">www.garanteprivacy.it</a>).</p>
        <h2>6. Cookie</h2>
        <p>Per le informazioni sull’uso dei cookie si rimanda alla <a href="{{BASE}}/cookie-policy/">Cookie Policy</a>.</p>
    """.replace("{{BASE}}", BASE)
    cookie = f"""
        {titolare}
        <h2>Cosa sono i cookie</h2>
        <p>I cookie sono piccoli file di testo che i siti visitati inviano al dispositivo dell’utente, dove vengono memorizzati per essere ritrasmessi agli stessi siti alla visita successiva. Questo sito utilizza un numero minimo di tecnologie, descritte di seguito.</p>
        <h2>Cookie e tecnologie utilizzate</h2>
        <table class="legal-table">
          <thead><tr><th>Nome</th><th>Tipo</th><th>Finalità</th><th>Durata</th></tr></thead>
          <tbody>
            <tr><td>proteos-consent</td><td>Tecnico (localStorage)</td><td>Memorizza la scelta espressa nel banner dei cookie.</td><td>Fino a cancellazione da parte dell’utente</td></tr>
            <tr><td>Supabase (contenuti)</td><td>Terze parti</td><td>Avvisi, corsi e bandi sono caricati dal servizio Supabase (server in Francoforte, UE), che riceve l’indirizzo IP dell’utente per servire la richiesta e registra i moduli di contatto inviati. Non vengono impostati cookie.</td><td>Sessione</td></tr>
            <tr><td>OpenStreetMap (mappa)</td><td>Terze parti</td><td>Nella pagina Contatti le immagini della mappa sono scaricate dai server di OpenStreetMap Foundation, che riceve l’indirizzo IP dell’utente. Non vengono impostati cookie.</td><td>Sessione</td></tr>
          </tbody>
        </table>
        <p>Il sito <strong>non</strong> utilizza cookie di profilazione, strumenti di analisi statistica né pixel pubblicitari. I caratteri tipografici e le immagini sono ospitati sullo stesso server del sito e non comportano richieste verso servizi terzi.</p>
        <h2>Gestione delle preferenze</h2>
        <p>Al primo accesso viene mostrato un banner informativo. La scelta può essere modificata in qualsiasi momento tramite il link “Gestisci cookie” nel piè di pagina o cancellando i dati del sito dalle impostazioni del browser. Le istruzioni per i principali browser: <a href="https://support.google.com/chrome/answer/95647" rel="noopener" target="_blank">Chrome</a>, <a href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie" rel="noopener" target="_blank">Firefox</a>, <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" rel="noopener" target="_blank">Safari</a>, <a href="https://support.microsoft.com/it-it/microsoft-edge" rel="noopener" target="_blank">Edge</a>.</p>
        <h2>Riferimenti normativi</h2>
        <p>Regolamento (UE) 2016/679 (GDPR), D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018, Linee guida del Garante per la protezione dei dati personali sui cookie del 10 giugno 2021.</p>
    """
    return {"privacy-policy": legal_page("privacy-policy", "Privacy Policy", privacy),
            "cookie-policy": legal_page("cookie-policy", "Cookie Policy", cookie)}


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
    a1 = avviso_page(
        slug="avviso-1-2026-poc", number="1/2026", title_pre="Avviso POC n.", subtitle="Corsi gratuiti per disoccupati e inoccupati – Piano Azione e Coesione (POC) Sicilia 2014/2020",
        intro_hero="Avviso pubblico n. 1/2026 della Regione Siciliana – Assessorato regionale dell’Istruzione e della Formazione Professionale – per la costituzione del Catalogo regionale dell’offerta formativa e la realizzazione di percorsi di qualificazione professionale finanziati dal Piano Azione e Coesione (POC) 2014/2020, Azione 5.1.1 “Piano Regionale dei Servizi Formativi”, e dal Programma FSE+ Sicilia 2021-2027, Priorità 2 “Istruzione e Formazione”, Azione “Formazione permanente”.",
        intro_body="<p>L’Avviso finanzia percorsi formativi gratuiti rivolti a persone disoccupate e inoccupate, finalizzati al conseguimento di una qualifica professionale riconosciuta e spendibile nel mercato del lavoro. I corsi comprendono un modulo tecnico-professionale e 54 ore obbligatorie di competenze trasversali (sicurezza sul lavoro, diritti e doveri dei lavoratori, competenze digitali di base) e prevedono attività di laboratorio e stage in azienda. Tutti i percorsi sono inseriti nel Catalogo regionale dell’offerta formativa e si svolgono nelle sedi accreditate di Proteos.</p>",
        cards=[
            ("Addetto Amministrativo Segretariale", "addetto-amministrativo-segretariale", "600 ore + 54 ore obbligatorie", "giornaliera 5,00 €"),
            ("Operatore Informatico di Risorse Web", "operatore-informatico-di-risorse-web", "500 ore + 54 ore obbligatorie", "giornaliera 5,00 €"),
            ("Collaboratore di Sala e Bar", "collaboratore-di-sala-e-bar", "500 ore + 54 ore obbligatorie", "giornaliera 5,00 €"),
            ("Collaboratore Polivalente nelle Strutture Ricettive e Ristorative", "collaboratore-polivalente-nelle-strutture-ricettive-e-ristorative", "600 ore + 54 ore obbligatorie", "giornaliera 5,00 €"),
            ("Addetto agli Stucchi e ai Decori", "addetto-agli-stucchi-e-ai-decori", "600 ore + 54 ore obbligatorie", "giornaliera 5,00 €"),
            ("Addetto alle Murature, Intonaci e Posa Materiali Lapidei", "addetto-alle-murature-intonaci-e-posa-materiali-lapidei", "600 ore + 54 ore obbligatorie", "giornaliera 5,00 €"),
            ("Addetto alla Sistemazione e Manutenzione Aree Verdi", "addetto-alla-sistemazione-e-manutenzione-aree-verdi", "500 ore + 54 ore obbligatorie", "giornaliera 5,00 €"),
        ],
        section_q="A chi si rivolge l’Avviso?",
        section_body="""
        <p>I percorsi formativi sono rivolti a persone <strong>disoccupate, inoccupate e inattive</strong>. Al momento dell’iscrizione i destinatari devono possedere i seguenti requisiti:<br>
        – essere residenti o domiciliati in Sicilia;<br>
        – essere in età lavorativa (almeno 18 anni compiuti);<br>
        – aver assolto il previsto obbligo di istruzione;<br>
        – possedere il titolo di studio minimo richiesto per il corso scelto.<br>
        In caso di cittadini non comunitari, è richiesto il possesso di regolare permesso di soggiorno in corso di validità. La partecipazione è completamente gratuita.</p>""",
        indennita="Agli allievi in possesso dei requisiti richiesti dall’Avviso, che abbiano frequentato almeno il 70% delle ore di formazione previste, è riconosciuta un’indennità di frequenza giornaliera pari a <b>€ 5,00</b>",
        rilascio="Al termine di ciascun percorso formativo, previo superamento dell’esame finale, sarà rilasciato l’attestato di qualifica professionale in coerenza con il Repertorio delle qualificazioni della Regione Siciliana, con certificazione delle competenze acquisite, ai partecipanti che abbiano frequentato le ore minime previste dal percorso.",
        capt=(9, 4),
    )
    return {"avviso-1-2026-poc": a1, "avviso-6-2025": a6, "avviso-7-2023": a7, "avviso-20-2024": a20}


def write(rel: str, content: str):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    print("wrote", p.relative_to(ROOT))


def stamp_assets(rel: str):
    """Aggiorna ?v= di CSS/JS nelle pagine scritte a mano (404, dashboard)."""
    p = ROOT / rel
    s = re.sub(r'((?:href|src)="/((?:admin/)?(?:style|site|config|cms|admin)\.(?:css|js)))(?:\?v=\w+)?"',
               lambda m: f'{m.group(1)}?v={ver(m.group(2))}"', p.read_text(encoding="utf-8"))
    p.write_text(s, encoding="utf-8")
    print("stamped", rel)


def build_404():
    body = f"""
    <section class="section section-white blog-page">
      <div class="container">
        <h1 class="blog-title">Pagina non trovata</h1>
        <div class="blog-sheet">
          <h2 class="no-results">Pagina non trovata</h2>
          <p>La pagina richiesta non esiste o è stata spostata. Torna alla <a href="{BASE}/">home</a>, guarda i <a href="{BASE}/corsi/">corsi attivi</a> o <a href="{BASE}/contatti/">contattaci</a>.</p>
        </div>
      </div>
    </section>
"""
    return page(path="/404.html", title="Pagina non trovata", description=f"Pagina non trovata – {BRAND}.", body=body,
                extra_head='<meta name="robots" content="noindex" />')


def main():
    write("index.html", build_home())
    write("chi-siamo/index.html", build_chi_siamo())
    write("corsi/index.html", build_corsi())
    write("news/index.html", build_news())
    write("bandi-e-avvisi/index.html", build_bandi())
    write("contatti/index.html", build_contatti())
    write("avviso/index.html", build_avviso_template())
    write("404.html", build_404())
    for slug, content in build_legal().items():
        write(f"{slug}/index.html", content)
    pages = ["/", "/chi-siamo/", "/corsi/", "/avviso/avviso-1-2026-poc/", "/avviso/avviso-23-2024/", "/avviso/avviso-6-2025/", "/avviso/avviso-7-2023/", "/avviso/avviso-20-2024/", "/bandi-e-avvisi/", "/news/", "/contatti/", "/privacy-policy/", "/cookie-policy/"]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
        f"  <url><loc>{SITE}{p}</loc></url>\n" for p in pages) + "</urlset>\n"
    write("sitemap.xml", sm)
    stamp_assets("admin/index.html")


if __name__ == "__main__":
    main()
